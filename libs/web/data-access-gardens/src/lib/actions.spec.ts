import { beforeEach, describe, expect, it, vi } from 'vitest';
import { ApiError } from '@itp-home-garden/web-api-client';

const resilientFetchMock = vi.fn();
const requireCurrentUserIdMock = vi.fn();

vi.mock('@itp-home-garden/web-api-client', async () => {
  const actual = await vi.importActual<typeof import('@itp-home-garden/web-api-client')>(
    '@itp-home-garden/web-api-client',
  );
  return {
    ...actual,
    resilientFetch: (...args: unknown[]) => resilientFetchMock(...args),
  };
});

vi.mock('@itp-home-garden/web-data-access-users/session', () => ({
  requireCurrentUserId: (...args: unknown[]) => requireCurrentUserIdMock(...args),
}));

const { createGardenAction, updateGardenAction, deleteGardenAction } = await import('./actions.js');

const validGarden = { gardenName: 'Backyard', totalSurfaceArea: 20 };

describe('createGardenAction', () => {
  beforeEach(() => {
    resilientFetchMock.mockReset();
    requireCurrentUserIdMock.mockReset();
    requireCurrentUserIdMock.mockResolvedValue(1);
  });

  it('rejects invalid input without calling the API', async () => {
    const result = await createGardenAction({ gardenName: '', totalSurfaceArea: 20 });

    expect(result.ok).toBe(false);
    expect(resilientFetchMock).not.toHaveBeenCalled();
  });

  it('creates the garden, attaching the current user id as a trusted header', async () => {
    resilientFetchMock.mockResolvedValue({ ...validGarden, gardenId: 1, userId: 1 });

    const result = await createGardenAction(validGarden);

    expect(result).toEqual({ ok: true, data: { ...validGarden, gardenId: 1, userId: 1 } });
    expect(resilientFetchMock).toHaveBeenCalledWith(
      expect.stringContaining('/gardens'),
      expect.anything(),
      expect.objectContaining({
        method: 'POST',
        retries: 0,
        headers: expect.objectContaining({ 'X-User-Id': '1' }),
      }),
    );
  });

  it('surfaces the backend message on an ApiError (e.g. an overcrowding-style validation failure)', async () => {
    resilientFetchMock.mockRejectedValue(new ApiError('total surface area is invalid', 400));

    const result = await createGardenAction(validGarden);

    expect(result).toEqual({ ok: false, error: 'total surface area is invalid' });
  });

  it('falls back to a generic message on an unexpected error (e.g. network failure)', async () => {
    resilientFetchMock.mockRejectedValue(new TypeError('fetch failed'));

    const result = await createGardenAction(validGarden);

    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.error).toMatch(/try again/i);
    }
  });
});

describe('updateGardenAction', () => {
  beforeEach(() => {
    resilientFetchMock.mockReset();
    requireCurrentUserIdMock.mockReset();
    requireCurrentUserIdMock.mockResolvedValue(1);
  });

  it('updates the garden, attaching the current user id as a trusted header', async () => {
    resilientFetchMock.mockResolvedValue({ ...validGarden, gardenId: 5, userId: 1 });

    const result = await updateGardenAction(5, validGarden);

    expect(result.ok).toBe(true);
    expect(resilientFetchMock).toHaveBeenCalledWith(
      expect.stringContaining('/gardens/5'),
      expect.anything(),
      expect.objectContaining({
        method: 'PUT',
        retries: 2,
        headers: expect.objectContaining({ 'X-User-Id': '1' }),
      }),
    );
  });
});

describe('deleteGardenAction', () => {
  beforeEach(() => {
    resilientFetchMock.mockReset();
    requireCurrentUserIdMock.mockReset();
    requireCurrentUserIdMock.mockResolvedValue(1);
  });

  it('deletes the garden, attaching the current user id as a trusted header', async () => {
    resilientFetchMock.mockResolvedValue(null);

    const result = await deleteGardenAction(7);

    expect(result).toEqual({ ok: true, data: null });
    expect(resilientFetchMock).toHaveBeenCalledWith(
      expect.stringContaining('/gardens/7'),
      expect.anything(),
      expect.objectContaining({
        method: 'DELETE',
        retries: 2,
        headers: expect.objectContaining({ 'X-User-Id': '1' }),
      }),
    );
  });
});
