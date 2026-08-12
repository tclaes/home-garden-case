import '@testing-library/jest-dom/vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

const deleteGardenActionMock = vi.fn();
const pushMock = vi.fn();

vi.mock('@itp-home-garden/web-data-access-gardens', () => ({
  deleteGardenAction: (...args: unknown[]) => deleteGardenActionMock(...args),
}));

vi.mock('next/navigation', () => ({
  useRouter: () => ({ push: pushMock }),
}));

const { DeleteGardenButton } = await import('./delete-garden-button.js');

describe('DeleteGardenButton', () => {
  beforeEach(() => {
    deleteGardenActionMock.mockReset();
    pushMock.mockReset();
  });

  it('asks for confirmation before deleting', () => {
    render(<DeleteGardenButton gardenId={1} />);

    expect(screen.queryByText(/delete this garden and all its plants/i)).not.toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'Delete garden' }));
    expect(screen.getByText(/delete this garden and all its plants/i)).toBeInTheDocument();
  });

  it('cancels without calling the delete action', () => {
    render(<DeleteGardenButton gardenId={1} />);
    fireEvent.click(screen.getByRole('button', { name: 'Delete garden' }));
    fireEvent.click(screen.getByRole('button', { name: 'Cancel' }));

    expect(screen.queryByRole('button', { name: 'Confirm delete' })).not.toBeInTheDocument();
    expect(deleteGardenActionMock).not.toHaveBeenCalled();
  });

  it('deletes and redirects to the gardens list on success', async () => {
    deleteGardenActionMock.mockResolvedValue({ ok: true, data: null });
    render(<DeleteGardenButton gardenId={42} />);

    fireEvent.click(screen.getByRole('button', { name: 'Delete garden' }));
    fireEvent.click(screen.getByRole('button', { name: 'Confirm delete' }));

    await waitFor(() => expect(pushMock).toHaveBeenCalledWith('/gardens'));
    expect(deleteGardenActionMock).toHaveBeenCalledWith(42);
  });

  it('shows the error and stays put when the delete action fails', async () => {
    deleteGardenActionMock.mockResolvedValue({ ok: false, error: 'Could not delete the garden.' });
    render(<DeleteGardenButton gardenId={42} />);

    fireEvent.click(screen.getByRole('button', { name: 'Delete garden' }));
    fireEvent.click(screen.getByRole('button', { name: 'Confirm delete' }));

    await waitFor(() =>
      expect(screen.getByText('Could not delete the garden.')).toBeInTheDocument(),
    );
    expect(pushMock).not.toHaveBeenCalled();
  });
});
