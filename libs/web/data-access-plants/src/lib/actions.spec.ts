import { beforeEach, describe, expect, it, vi } from 'vitest';
import { ApiError } from '@itp-home-garden/web-api-client';
import { gardenTag } from '@itp-home-garden/web-data-access-gardens';
import { plantsForGardenTag, plantTag } from './cache-tags.js';

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

describe('createPlantAction', () => {
  beforeEach(() => {
    resilientFetchMock.mockReset();
    revalidateTagMock.mockReset();
  });

  it('rejects invalid input without calling the API', async () => {
    const result = await createPlantAction({ ...validPlant, idealHumidityLevel: 150 });

    expect(result.ok).toBe(false);
    expect(resilientFetchMock).not.toHaveBeenCalled();
  });

  it('creates the plant and revalidates the garden it belongs to', async () => {
    resilientFetchMock.mockResolvedValue({ ...validPlant, plantId: 9 });

    const result = await createPlantAction(validPlant);

    expect(result.ok).toBe(true);
    expect(revalidateTagMock).toHaveBeenCalledWith(plantsForGardenTag(1));
    expect(revalidateTagMock).toHaveBeenCalledWith(gardenTag(1));
  });

  it('surfaces the overcrowding error message from the backend', async () => {
    resilientFetchMock.mockRejectedValue(
      new ApiError('Cannot add plant: total surface area required (12m²) would exceed...', 400),
    );

    const result = await createPlantAction(validPlant);

    expect(result).toMatchObject({ ok: false, error: expect.stringContaining('exceed') });
  });
});

describe('updatePlantAction', () => {
  beforeEach(() => {
    resilientFetchMock.mockReset();
    revalidateTagMock.mockReset();
  });

  it('revalidates only the current garden when it does not change', async () => {
    resilientFetchMock.mockResolvedValue({ ...validPlant, plantId: 3, gardenId: 1 });

    await updatePlantAction(3, 1, validPlant);

    expect(revalidateTagMock).toHaveBeenCalledWith(plantTag(3));
    expect(revalidateTagMock).toHaveBeenCalledWith(plantsForGardenTag(1));
    expect(revalidateTagMock).toHaveBeenCalledWith(gardenTag(1));
    expect(revalidateTagMock).not.toHaveBeenCalledWith(plantsForGardenTag(2));
  });

  it('revalidates both the old and new garden when the plant moves gardens', async () => {
    resilientFetchMock.mockResolvedValue({ ...validPlant, plantId: 3, gardenId: 2 });

    await updatePlantAction(3, 1, { ...validPlant, gardenId: 2 });

    expect(revalidateTagMock).toHaveBeenCalledWith(plantsForGardenTag(1));
    expect(revalidateTagMock).toHaveBeenCalledWith(gardenTag(1));
    expect(revalidateTagMock).toHaveBeenCalledWith(plantsForGardenTag(2));
    expect(revalidateTagMock).toHaveBeenCalledWith(gardenTag(2));
  });
});

describe('deletePlantAction', () => {
  beforeEach(() => {
    resilientFetchMock.mockReset();
    revalidateTagMock.mockReset();
  });

  it('deletes the plant and revalidates its garden', async () => {
    resilientFetchMock.mockResolvedValue(null);

    const result = await deletePlantAction(4, 1);

    expect(result).toEqual({ ok: true, data: null });
    expect(revalidateTagMock).toHaveBeenCalledWith(plantTag(4));
    expect(revalidateTagMock).toHaveBeenCalledWith(plantsForGardenTag(1));
    expect(revalidateTagMock).toHaveBeenCalledWith(gardenTag(1));
  });
});
