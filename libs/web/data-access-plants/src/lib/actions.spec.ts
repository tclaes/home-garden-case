import { beforeEach, describe, expect, it, vi } from 'vitest';
import { ApiError } from '@itp-home-garden/web-api-client';

const resilientFetchMock = vi.fn();
const userHeadersMock = vi.fn();

vi.mock('@itp-home-garden/web-api-client', async () => {
  const actual = await vi.importActual<typeof import('@itp-home-garden/web-api-client')>(
    '@itp-home-garden/web-api-client',
  );
  return {
    ...actual,
    resilientFetch: (...args: unknown[]) => resilientFetchMock(...args),
  };
});

vi.mock('@itp-home-garden/web-data-access-gardens/user-context', () => ({
  userHeaders: (...args: unknown[]) => userHeadersMock(...args),
}));

const { createPlantAction, updatePlantAction, deletePlantAction } = await import('./actions.js');

const validPlant = {
  plantName: 'Tomato',
  species: 'Solanum lycopersicum',
  plantType: 'vegetable' as const,
  plantationDate: '2026-01-01T00:00:00.000Z',
  surfaceAreaRequired: 2,
  idealHumidityLevel: 60,
  gardenId: 1,
};

/** Mimics the error next/navigation's redirect() throws — must propagate, not be swallowed into
 * a generic ActionResult, or the unauthenticated user never actually gets redirected to /login. */
class RedirectError extends Error {
  digest = 'NEXT_REDIRECT;replace;/login;307;';
}

describe('createPlantAction', () => {
  beforeEach(() => {
    resilientFetchMock.mockReset();
    userHeadersMock.mockReset();
    userHeadersMock.mockResolvedValue({ 'X-User-Id': '1' });
  });

  it('rejects invalid input without calling the API', async () => {
    const result = await createPlantAction({ ...validPlant, idealHumidityLevel: 150 });

    expect(result.ok).toBe(false);
    expect(resilientFetchMock).not.toHaveBeenCalled();
  });

  it('creates the plant, attaching the current user id as a trusted header', async () => {
    resilientFetchMock.mockResolvedValue({ ...validPlant, plantId: 9 });

    const result = await createPlantAction(validPlant);

    expect(result.ok).toBe(true);
    expect(resilientFetchMock).toHaveBeenCalledWith(
      expect.stringContaining('/plants'),
      expect.anything(),
      expect.objectContaining({ headers: expect.objectContaining({ 'X-User-Id': '1' }) }),
    );
  });

  it('surfaces the overcrowding error message from the backend', async () => {
    resilientFetchMock.mockRejectedValue(
      new ApiError('Cannot add plant: total surface area required (12m²) would exceed...', 400),
    );

    const result = await createPlantAction(validPlant);

    expect(result).toMatchObject({ ok: false, error: expect.stringContaining('exceed') });
  });

  it('propagates the redirect when there is no session, instead of returning a generic error', async () => {
    userHeadersMock.mockRejectedValue(new RedirectError());

    await expect(createPlantAction(validPlant)).rejects.toThrow(RedirectError);
    expect(resilientFetchMock).not.toHaveBeenCalled();
  });
});

describe('updatePlantAction', () => {
  beforeEach(() => {
    resilientFetchMock.mockReset();
    userHeadersMock.mockReset();
    userHeadersMock.mockResolvedValue({ 'X-User-Id': '1' });
  });

  it('updates the plant, attaching the current user id as a trusted header', async () => {
    resilientFetchMock.mockResolvedValue({ ...validPlant, plantId: 3, gardenId: 1 });

    const result = await updatePlantAction(3, validPlant);

    expect(result.ok).toBe(true);
    expect(resilientFetchMock).toHaveBeenCalledWith(
      expect.stringContaining('/plants/3'),
      expect.anything(),
      expect.objectContaining({ headers: expect.objectContaining({ 'X-User-Id': '1' }) }),
    );
  });

  it('propagates the redirect when there is no session, instead of returning a generic error', async () => {
    userHeadersMock.mockRejectedValue(new RedirectError());

    await expect(updatePlantAction(3, validPlant)).rejects.toThrow(RedirectError);
    expect(resilientFetchMock).not.toHaveBeenCalled();
  });
});

describe('deletePlantAction', () => {
  beforeEach(() => {
    resilientFetchMock.mockReset();
    userHeadersMock.mockReset();
    userHeadersMock.mockResolvedValue({ 'X-User-Id': '1' });
  });

  it('deletes the plant, attaching the current user id as a trusted header', async () => {
    resilientFetchMock.mockResolvedValue(null);

    const result = await deletePlantAction(4);

    expect(result).toEqual({ ok: true, data: null });
    expect(resilientFetchMock).toHaveBeenCalledWith(
      expect.stringContaining('/plants/4'),
      expect.anything(),
      expect.objectContaining({ headers: expect.objectContaining({ 'X-User-Id': '1' }) }),
    );
  });

  it('propagates the redirect when there is no session, instead of returning a generic error', async () => {
    userHeadersMock.mockRejectedValue(new RedirectError());

    await expect(deletePlantAction(4)).rejects.toThrow(RedirectError);
    expect(resilientFetchMock).not.toHaveBeenCalled();
  });
});
