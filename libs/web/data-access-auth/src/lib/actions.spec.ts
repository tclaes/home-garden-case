import { beforeEach, describe, expect, it, vi } from 'vitest';
import { ApiError } from '@itp-home-garden/web-api-client';

const resilientFetchMock = vi.fn();
const cookieStoreMock = { set: vi.fn(), delete: vi.fn(), get: vi.fn() };
const cookiesMock = vi.fn(() => cookieStoreMock);
const redirectMock = vi.fn();

vi.mock('@itp-home-garden/web-api-client', async () => {
  const actual = await vi.importActual<typeof import('@itp-home-garden/web-api-client')>(
    '@itp-home-garden/web-api-client',
  );
  return {
    ...actual,
    resilientFetch: (...args: unknown[]) => resilientFetchMock(...args),
  };
});

vi.mock('next/headers', () => ({
  cookies: () => cookiesMock(),
}));

vi.mock('next/navigation', () => ({
  redirect: (...args: unknown[]) => redirectMock(...args),
}));

const { registerAction, loginAction, logoutAction } = await import('./actions.js');

const validRegister = { emailAddress: 'test@example.com', password: 'password123' };
const validLogin = { emailAddress: 'test@example.com', password: 'password123' };

describe('registerAction', () => {
  beforeEach(() => {
    resilientFetchMock.mockReset();
    cookieStoreMock.set.mockReset();
  });

  it('rejects invalid input without calling the API', async () => {
    const result = await registerAction({ emailAddress: 'not-an-email', password: 'short' });

    expect(result.ok).toBe(false);
    expect(resilientFetchMock).not.toHaveBeenCalled();
  });

  it('sets the session cookie and succeeds when the API accepts the registration', async () => {
    resilientFetchMock.mockResolvedValue({
      token: 'jwt-token',
      user: { userId: 1, emailAddress: validRegister.emailAddress },
    });

    const result = await registerAction(validRegister);

    expect(result).toEqual({ ok: true, data: null });
    expect(cookieStoreMock.set).toHaveBeenCalledWith(
      'session',
      'jwt-token',
      expect.objectContaining({ httpOnly: true }),
    );
  });

  it('surfaces a conflict error from the API (e.g. duplicate email)', async () => {
    resilientFetchMock.mockRejectedValue(new ApiError('User with email already exists', 409));

    const result = await registerAction(validRegister);

    expect(result).toEqual({ ok: false, error: 'User with email already exists' });
    expect(cookieStoreMock.set).not.toHaveBeenCalled();
  });
});

describe('loginAction', () => {
  beforeEach(() => {
    resilientFetchMock.mockReset();
    cookieStoreMock.set.mockReset();
  });

  it('sets the session cookie and succeeds on valid credentials', async () => {
    resilientFetchMock.mockResolvedValue({
      token: 'jwt-token',
      user: { userId: 1, emailAddress: validLogin.emailAddress },
    });

    const result = await loginAction(validLogin);

    expect(result).toEqual({ ok: true, data: null });
    expect(cookieStoreMock.set).toHaveBeenCalledWith(
      'session',
      'jwt-token',
      expect.objectContaining({ httpOnly: true }),
    );
  });

  it('surfaces an unauthorized error from the API on invalid credentials', async () => {
    resilientFetchMock.mockRejectedValue(new ApiError('Invalid email or password', 401));

    const result = await loginAction(validLogin);

    expect(result).toEqual({ ok: false, error: 'Invalid email or password' });
  });
});

describe('logoutAction', () => {
  it('clears the session cookie and redirects to /login', async () => {
    cookieStoreMock.delete.mockReset();
    redirectMock.mockReset();

    await logoutAction();

    expect(cookieStoreMock.delete).toHaveBeenCalledWith('session');
    expect(redirectMock).toHaveBeenCalledWith('/login');
  });
});
