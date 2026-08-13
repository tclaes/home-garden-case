import '@testing-library/jest-dom/vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

const registerUserActionMock = vi.fn();
const pushMock = vi.fn();

vi.mock('@itp-home-garden/web-data-access-users', () => ({
  registerUserAction: (...args: unknown[]) => registerUserActionMock(...args),
}));

vi.mock('next/navigation', () => ({
  useRouter: () => ({ push: pushMock }),
}));

const { RegisterForm } = await import('./register-form.js');

function fillAndSubmit(email = 'ada@example.com') {
  fireEvent.change(screen.getByLabelText('Email address'), { target: { value: email } });
  fireEvent.click(screen.getByRole('button', { name: 'Register' }));
}

describe('RegisterForm', () => {
  beforeEach(() => {
    registerUserActionMock.mockReset();
    pushMock.mockReset();
  });

  it('shows the server-side validation error for input the backend rejects', async () => {
    // Server-side validation (e.g. rejecting a disallowed domain) can't be replicated by the
    // browser's native type="email" check, so this exercises the ok:false rendering path with a
    // syntactically valid address that the mocked action still rejects.
    registerUserActionMock.mockResolvedValue({
      ok: false,
      error: 'Email address is required',
    });
    render(<RegisterForm />);

    fillAndSubmit('ada@example.com');

    await waitFor(() => expect(screen.getByText('Email address is required')).toBeInTheDocument());
    expect(pushMock).not.toHaveBeenCalled();
  });

  it('shows the fallback error message when the API call fails', async () => {
    registerUserActionMock.mockResolvedValue({
      ok: false,
      error: 'Could not register. Please try again.',
    });
    render(<RegisterForm />);

    fillAndSubmit();

    await waitFor(() =>
      expect(screen.getByText('Could not register. Please try again.')).toBeInTheDocument(),
    );
    expect(pushMock).not.toHaveBeenCalled();
  });

  it('disables the submit button and shows a pending label while registering', async () => {
    let resolveAction!: (value: { ok: true; data: null }) => void;
    registerUserActionMock.mockReturnValue(
      new Promise((resolve) => {
        resolveAction = resolve;
      }),
    );
    render(<RegisterForm />);

    fillAndSubmit();

    await waitFor(() => expect(screen.getByRole('button')).toBeDisabled());
    expect(screen.getByRole('button')).toHaveTextContent('Registering…');

    resolveAction({ ok: true, data: null });
    await waitFor(() => expect(pushMock).toHaveBeenCalled());
  });

  it('navigates to the success page after a successful registration', async () => {
    registerUserActionMock.mockResolvedValue({ ok: true, data: { userId: 1 } });
    render(<RegisterForm />);

    fillAndSubmit();

    await waitFor(() => expect(pushMock).toHaveBeenCalledWith('/register/success'));
    expect(registerUserActionMock).toHaveBeenCalledWith(
      expect.objectContaining({ emailAddress: 'ada@example.com' }),
    );
  });
});
