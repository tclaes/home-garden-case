import '@testing-library/jest-dom/vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

const loginActionMock = vi.fn();
const pushMock = vi.fn();

vi.mock('@itp-home-garden/web-data-access-auth', () => ({
  loginAction: (...args: unknown[]) => loginActionMock(...args),
}));

vi.mock('next/navigation', () => ({
  useRouter: () => ({ push: pushMock }),
}));

const { LoginForm } = await import('./login-form.js');

describe('LoginForm', () => {
  beforeEach(() => {
    loginActionMock.mockReset();
    pushMock.mockReset();
  });

  it('submits the entered credentials and redirects to /gardens on success', async () => {
    loginActionMock.mockResolvedValue({ ok: true, data: null });
    render(<LoginForm />);

    fireEvent.change(screen.getByLabelText('Email'), { target: { value: 'test@example.com' } });
    fireEvent.change(screen.getByLabelText('Password'), { target: { value: 'password123' } });
    fireEvent.click(screen.getByRole('button', { name: 'Log in' }));

    await waitFor(() => expect(pushMock).toHaveBeenCalledWith('/gardens'));
    expect(loginActionMock).toHaveBeenCalledWith({
      emailAddress: 'test@example.com',
      password: 'password123',
    });
  });

  it('shows the error and stays put when login fails', async () => {
    loginActionMock.mockResolvedValue({ ok: false, error: 'Invalid email or password' });
    render(<LoginForm />);

    fireEvent.change(screen.getByLabelText('Email'), { target: { value: 'test@example.com' } });
    fireEvent.change(screen.getByLabelText('Password'), { target: { value: 'wrong' } });
    fireEvent.click(screen.getByRole('button', { name: 'Log in' }));

    await waitFor(() => expect(screen.getByText('Invalid email or password')).toBeInTheDocument());
    expect(pushMock).not.toHaveBeenCalled();
  });
});
