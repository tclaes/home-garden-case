import { describe, expect, it } from 'vitest';
import { createGardenSchema } from './garden.schema.js';

const baseGarden = { gardenName: 'Backyard', totalSurfaceArea: 20 };

describe('createGardenSchema', () => {
  it('accepts a garden without coordinates', () => {
    expect(createGardenSchema.safeParse(baseGarden).success).toBe(true);
  });

  it('accepts a garden with both latitude and longitude', () => {
    const result = createGardenSchema.safeParse({
      ...baseGarden,
      latitude: 51.05,
      longitude: 3.72,
    });
    expect(result.success).toBe(true);
  });

  it('rejects latitude without longitude', () => {
    const result = createGardenSchema.safeParse({ ...baseGarden, latitude: 51.05 });
    expect(result.success).toBe(false);
  });

  it('rejects longitude without latitude', () => {
    const result = createGardenSchema.safeParse({ ...baseGarden, longitude: 3.72 });
    expect(result.success).toBe(false);
  });

  it('rejects an out-of-range latitude', () => {
    const result = createGardenSchema.safeParse({ ...baseGarden, latitude: 200, longitude: 3.72 });
    expect(result.success).toBe(false);
  });

  it('rejects a negative surface area', () => {
    const result = createGardenSchema.safeParse({ ...baseGarden, totalSurfaceArea: -1 });
    expect(result.success).toBe(false);
  });

  it('rejects an empty garden name', () => {
    const result = createGardenSchema.safeParse({ ...baseGarden, gardenName: '' });
    expect(result.success).toBe(false);
  });

  it('rejects a whitespace-only garden name', () => {
    const result = createGardenSchema.safeParse({ ...baseGarden, gardenName: '   ' });
    expect(result.success).toBe(false);
  });
});
