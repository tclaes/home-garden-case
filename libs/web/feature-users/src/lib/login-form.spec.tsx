import '@testing-library/jest-dom/vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

const loginUserActionMock = vi.fn();
const pushMock = vi.fn();

vi.mock('@itp-home-garden/web-data-access-users', () => ({
  loginUserAction: (...args: unknown[]) => loginUserActionMock(...args),
}));

vi.mock('next/navigation', () => ({
  useRouter: () => ({ push: pushMock }),
}));

const { LoginForm } = await import('./login-form.js');

function fillAndSubmit(email = 'ada@example.com') {
  fireEvent.change(screen.getByLabelText('Email address'), { target: { value: email } });
  fireEvent.click(screen.getByRole('button', { name: 'Log in' }));
}

describe('LoginForm', () => {
  beforeEach(() => {
    loginUserActionMock.mockReset();
    pushMock.mockReset();
  });

  it('shows the error when no account matches the email', async () => {
    loginUserActionMock.mockResolvedValue({
      ok: false,
      error: 'No account found with this email address.',
    });
    render(<LoginForm />);

    fillAndSubmit();

    await waitFor(() =>
      expect(screen.getByText('No account found with this email address.')).toBeInTheDocument(),
    );
    expect(pushMock).not.toHaveBeenCalled();
  });

  it('disables the submit button and shows a pending label while logging in', async () => {
    let resolveAction!: (value: { ok: true; data: null }) => void;
    loginUserActionMock.mockReturnValue(
      new Promise((resolve) => {
        resolveAction = resolve;
      }),
    );
    render(<LoginForm />);

    fillAndSubmit();

    await waitFor(() => expect(screen.getByRole('button')).toBeDisabled());
    expect(screen.getByRole('button')).toHaveTextContent('Logging in…');

    resolveAction({ ok: true, data: null });
    await waitFor(() => expect(pushMock).toHaveBeenCalled());
  });

  it('navigates to the gardens page after a successful login', async () => {
    loginUserActionMock.mockResolvedValue({ ok: true, data: { userId: 1 } });
    render(<LoginForm />);

    fillAndSubmit();

    await waitFor(() => expect(pushMock).toHaveBeenCalledWith('/gardens'));
    expect(loginUserActionMock).toHaveBeenCalledWith(
      expect.objectContaining({ emailAddress: 'ada@example.com' }),
    );
  });
});
