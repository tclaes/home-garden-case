import { beforeEach, describe, expect, it, vi } from 'vitest';
import { ApiError } from '@itp-home-garden/web-api-client';
import { GARDENS_LIST_TAG, gardenTag } from './cache-tags.js';

const resilientFetchMock = vi.fn();
const revalidateTagMock = vi.fn();

vi.mock('@itp-home-garden/web-api-client', async () => {
  const actual = await vi.importActual<typeof import('@itp-home-garden/web-api-client')>(
    '@itp-home-garden/web-api-client',
  );
  return {
    ...actual,
    resilientFetch: (...args: unknown[]) => resilientFetchMock(...args),
  };
});

vi.mock('next/cache', () => ({
  revalidateTag: (...args: unknown[]) => revalidateTagMock(...args),
}));

const { createGardenAction, updateGardenAction, deleteGardenAction } = await import('./actions.js');

const validGarden = { gardenName: 'Backyard', totalSurfaceArea: 20 };

describe('createGardenAction', () => {
  beforeEach(() => {
    resilientFetchMock.mockReset();
    revalidateTagMock.mockReset();
  });

  it('rejects invalid input without calling the API', async () => {
    const result = await createGardenAction({ gardenName: '', totalSurfaceArea: 20 });

    expect(result.ok).toBe(false);
    expect(resilientFetchMock).not.toHaveBeenCalled();
  });

  it('creates the garden and revalidates the gardens list on success', async () => {
    resilientFetchMock.mockResolvedValue({ ...validGarden, gardenId: 1 });

    const result = await createGardenAction(validGarden);

    expect(result).toEqual({ ok: true, data: { ...validGarden, gardenId: 1 } });
    expect(resilientFetchMock).toHaveBeenCalledWith(
      expect.stringContaining('/gardens'),
      expect.anything(),
      expect.objectContaining({ method: 'POST', retries: 0 }),
    );
    expect(revalidateTagMock).toHaveBeenCalledWith(GARDENS_LIST_TAG);
  });

  it('surfaces the backend message on an ApiError (e.g. an overcrowding-style validation failure)', async () => {
    resilientFetchMock.mockRejectedValue(new ApiError('total surface area is invalid', 400));

    const result = await createGardenAction(validGarden);

    expect(result).toEqual({ ok: false, error: 'total surface area is invalid' });
    expect(revalidateTagMock).not.toHaveBeenCalled();
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
    revalidateTagMock.mockReset();
  });

  it('updates the garden and revalidates both the list and the detail tag', async () => {
    resilientFetchMock.mockResolvedValue({ ...validGarden, gardenId: 5 });

    const result = await updateGardenAction(5, validGarden);

    expect(result.ok).toBe(true);
    expect(resilientFetchMock).toHaveBeenCalledWith(
      expect.stringContaining('/gardens/5'),
      expect.anything(),
      expect.objectContaining({ method: 'PUT', retries: 2 }),
    );
    expect(revalidateTagMock).toHaveBeenCalledWith(GARDENS_LIST_TAG);
    expect(revalidateTagMock).toHaveBeenCalledWith(gardenTag(5));
  });
});

describe('deleteGardenAction', () => {
  beforeEach(() => {
    resilientFetchMock.mockReset();
    revalidateTagMock.mockReset();
  });

  it('deletes the garden and revalidates both tags', async () => {
    resilientFetchMock.mockResolvedValue(null);

    const result = await deleteGardenAction(7);

    expect(result).toEqual({ ok: true, data: null });
    expect(resilientFetchMock).toHaveBeenCalledWith(
      expect.stringContaining('/gardens/7'),
      expect.anything(),
      expect.objectContaining({ method: 'DELETE', retries: 2 }),
    );
    expect(revalidateTagMock).toHaveBeenCalledWith(GARDENS_LIST_TAG);
    expect(revalidateTagMock).toHaveBeenCalledWith(gardenTag(7));
  });

  it('treats a 404 (e.g. a retry landing after the resource was already deleted) as success', async () => {
    resilientFetchMock.mockRejectedValue(new ApiError('Garden with ID 7 not found', 404));

    const result = await deleteGardenAction(7);

    expect(result).toEqual({ ok: true, data: null });
    expect(revalidateTagMock).toHaveBeenCalledWith(GARDENS_LIST_TAG);
    expect(revalidateTagMock).toHaveBeenCalledWith(gardenTag(7));
  });

  it('surfaces a non-404 ApiError as a failure', async () => {
    resilientFetchMock.mockRejectedValue(new ApiError('server exploded', 500));

    const result = await deleteGardenAction(7);

    expect(result).toEqual({ ok: false, error: 'server exploded' });
  });
});
