import { beforeEach, describe, expect, it, vi } from 'vitest';

const resilientFetchMock = vi.fn();
const cookieGetMock = vi.fn();

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
  cookies: async () => ({ get: cookieGetMock }),
}));

const { getCurrentUser } = await import('./session.js');

describe('getCurrentUser', () => {
  beforeEach(() => {
    resilientFetchMock.mockReset();
    cookieGetMock.mockReset();
  });

  it('returns null when there is no session cookie', async () => {
    cookieGetMock.mockReturnValue(undefined);

    const result = await getCurrentUser();

    expect(result).toBeNull();
    expect(resilientFetchMock).not.toHaveBeenCalled();
  });

  it('returns null when the cookie value is not a valid user id', async () => {
    cookieGetMock.mockReturnValue({ value: 'not-a-number' });

    const result = await getCurrentUser();

    expect(result).toBeNull();
    expect(resilientFetchMock).not.toHaveBeenCalled();
  });

  it('returns the user when the session cookie resolves to a real user', async () => {
    cookieGetMock.mockReturnValue({ value: '1' });
    const user = {
      userId: 1,
      firstName: 'Ada',
      lastName: 'Lovelace',
      age: null,
      emailAddress: 'ada@example.com',
      createdAt: '2026-01-01T00:00:00.000Z',
      updatedAt: '2026-01-01T00:00:00.000Z',
    };
    resilientFetchMock.mockResolvedValue(user);

    const result = await getCurrentUser();

    expect(result).toEqual(user);
    expect(resilientFetchMock).toHaveBeenCalledWith(
      expect.stringContaining('/users/1'),
      expect.anything(),
      expect.objectContaining({ retries: 1 }),
    );
  });

  it('returns null when the lookup fails (e.g. the user was deleted)', async () => {
    cookieGetMock.mockReturnValue({ value: '1' });
    resilientFetchMock.mockRejectedValue(new Error('not found'));

    const result = await getCurrentUser();

    expect(result).toBeNull();
  });
});
