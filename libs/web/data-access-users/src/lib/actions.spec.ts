import { beforeEach, describe, expect, it, vi } from 'vitest';
import { ApiError } from '@itp-home-garden/web-api-client';

const resilientFetchMock = vi.fn();
const cookieSetMock = vi.fn();
const cookieDeleteMock = vi.fn();

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
  cookies: async () => ({ set: cookieSetMock, delete: cookieDeleteMock }),
}));

const { registerUserAction, loginUserAction, logoutUserAction } = await import('./actions.js');

const validUser = { emailAddress: 'test@example.com' };

describe('registerUserAction', () => {
  beforeEach(() => {
    resilientFetchMock.mockReset();
  });

  it('rejects invalid input without calling the API', async () => {
    const result = await registerUserAction({ emailAddress: 'not-an-email' });

    expect(result.ok).toBe(false);
    expect(resilientFetchMock).not.toHaveBeenCalled();
  });

  it('registers the user on success', async () => {
    resilientFetchMock.mockResolvedValue({
      ...validUser,
      userId: 1,
      firstName: null,
      lastName: null,
      age: null,
      createdAt: '2026-01-01T00:00:00.000Z',
      updatedAt: '2026-01-01T00:00:00.000Z',
    });

    const result = await registerUserAction(validUser);

    expect(result.ok).toBe(true);
    expect(resilientFetchMock).toHaveBeenCalledWith(
      expect.stringContaining('/users'),
      expect.anything(),
      expect.objectContaining({ method: 'POST', retries: 0 }),
    );
  });

  it('surfaces the backend message on an ApiError (e.g. a duplicate email conflict)', async () => {
    resilientFetchMock.mockRejectedValue(new ApiError('Conflict error', 409));

    const result = await registerUserAction(validUser);

    expect(result).toEqual({ ok: false, error: 'Conflict error' });
  });

  it('falls back to a generic message on an unexpected error (e.g. network failure)', async () => {
    resilientFetchMock.mockRejectedValue(new TypeError('fetch failed'));

    const result = await registerUserAction(validUser);

    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.error).toMatch(/try again/i);
    }
  });
});

describe('loginUserAction', () => {
  beforeEach(() => {
    resilientFetchMock.mockReset();
    cookieSetMock.mockReset();
  });

  it('rejects invalid input without calling the API', async () => {
    const result = await loginUserAction({ emailAddress: 'not-an-email' });

    expect(result.ok).toBe(false);
    expect(resilientFetchMock).not.toHaveBeenCalled();
    expect(cookieSetMock).not.toHaveBeenCalled();
  });

  it('logs the user in and sets a session cookie on success', async () => {
    resilientFetchMock.mockResolvedValue({
      ...validUser,
      userId: 1,
      firstName: null,
      lastName: null,
      age: null,
      createdAt: '2026-01-01T00:00:00.000Z',
      updatedAt: '2026-01-01T00:00:00.000Z',
    });

    const result = await loginUserAction(validUser);

    expect(result.ok).toBe(true);
    expect(resilientFetchMock).toHaveBeenCalledWith(
      expect.stringContaining('/users/email/'),
      expect.anything(),
      expect.objectContaining({ retries: 2 }),
    );
    expect(cookieSetMock).toHaveBeenCalledWith(
      'session_user_id',
      '1',
      expect.objectContaining({ httpOnly: true }),
    );
  });

  it('surfaces a friendly message when no user matches the email (404)', async () => {
    resilientFetchMock.mockRejectedValue(new ApiError('Not found', 404));

    const result = await loginUserAction(validUser);

    expect(result).toEqual({ ok: false, error: 'No account found with this email address.' });
    expect(cookieSetMock).not.toHaveBeenCalled();
  });

  it('surfaces the backend message on other ApiErrors', async () => {
    resilientFetchMock.mockRejectedValue(new ApiError('Server exploded', 500));

    const result = await loginUserAction(validUser);

    expect(result).toEqual({ ok: false, error: 'Server exploded' });
  });

  it('falls back to a generic message on an unexpected error (e.g. network failure)', async () => {
    resilientFetchMock.mockRejectedValue(new TypeError('fetch failed'));

    const result = await loginUserAction(validUser);

    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.error).toMatch(/try again/i);
    }
  });
});

describe('logoutUserAction', () => {
  beforeEach(() => {
    cookieDeleteMock.mockReset();
  });

  it('clears the session cookie', async () => {
    await logoutUserAction();

    expect(cookieDeleteMock).toHaveBeenCalledWith('session_user_id');
  });
});
