import { describe, expect, it } from 'vitest';
import { createPlantSchema } from './plant.schema.js';

const basePlant = {
  plantName: 'Tomato',
  species: 'Solanum lycopersicum',
  plantType: 'vegetable' as const,
  plantationDate: '2026-01-01T00:00:00.000Z',
  surfaceAreaRequired: 2,
  idealHumidityLevel: 60,
  gardenId: 1,
};

describe('createPlantSchema', () => {
  it('accepts a valid plant', () => {
    expect(createPlantSchema.safeParse(basePlant).success).toBe(true);
  });

  it('accepts humidity at the boundaries (0 and 100)', () => {
    expect(createPlantSchema.safeParse({ ...basePlant, idealHumidityLevel: 0 }).success).toBe(true);
    expect(createPlantSchema.safeParse({ ...basePlant, idealHumidityLevel: 100 }).success).toBe(
      true,
    );
  });

  it('rejects humidity below 0 or above 100', () => {
    expect(createPlantSchema.safeParse({ ...basePlant, idealHumidityLevel: -1 }).success).toBe(
      false,
    );
    expect(createPlantSchema.safeParse({ ...basePlant, idealHumidityLevel: 101 }).success).toBe(
      false,
    );
  });

  it('rejects an unknown plant type', () => {
    const result = createPlantSchema.safeParse({ ...basePlant, plantType: 'tree' });
    expect(result.success).toBe(false);
  });

  it('rejects a negative surface area', () => {
    const result = createPlantSchema.safeParse({ ...basePlant, surfaceAreaRequired: -1 });
    expect(result.success).toBe(false);
  });

  it('rejects a missing gardenId', () => {
    const withoutGardenId: Partial<typeof basePlant> = { ...basePlant };
    delete withoutGardenId.gardenId;
    const result = createPlantSchema.safeParse(withoutGardenId);
    expect(result.success).toBe(false);
  });
});
