import { describe, expect, it } from 'vitest';
import { checkGardenCapacity, sumPlantSurfaceArea } from './garden-capacity.js';

describe('checkGardenCapacity', () => {
  it('allows a plant that fits within remaining capacity', () => {
    const result = checkGardenCapacity({
      totalSurfaceArea: 10,
      usedSurfaceArea: 4,
      requestedSurfaceArea: 3,
    });

    expect(result.exceedsCapacity).toBe(false);
    expect(result.totalSurfaceArea).toBe(7);
    expect(result.remainingSurfaceArea).toBe(3);
  });

  it('allows a plant that exactly fills the garden', () => {
    const result = checkGardenCapacity({
      totalSurfaceArea: 10,
      usedSurfaceArea: 4,
      requestedSurfaceArea: 6,
    });

    expect(result.exceedsCapacity).toBe(false);
    expect(result.remainingSurfaceArea).toBe(0);
  });

  it('rejects a plant that would exceed capacity', () => {
    const result = checkGardenCapacity({
      totalSurfaceArea: 10,
      usedSurfaceArea: 8,
      requestedSurfaceArea: 3,
    });

    expect(result.exceedsCapacity).toBe(true);
    expect(result.totalSurfaceArea).toBe(11);
    expect(result.remainingSurfaceArea).toBe(-1);
  });

  it('treats an empty garden as fully available', () => {
    const result = checkGardenCapacity({
      totalSurfaceArea: 5,
      usedSurfaceArea: 0,
      requestedSurfaceArea: 5,
    });

    expect(result.exceedsCapacity).toBe(false);
  });
});

describe('sumPlantSurfaceArea', () => {
  const plants = [
    { plantId: 1, surfaceAreaRequired: 2 },
    { plantId: 2, surfaceAreaRequired: 3 },
    { plantId: 3, surfaceAreaRequired: 5 },
  ];

  it('sums surface area across all plants', () => {
    expect(sumPlantSurfaceArea(plants)).toBe(10);
  });

  it('excludes the given plant id (e.g. the one being updated)', () => {
    expect(sumPlantSurfaceArea(plants, 2)).toBe(7);
  });

  it('returns 0 for an empty list', () => {
    expect(sumPlantSurfaceArea([])).toBe(0);
  });

  it('is unaffected when the excluded id does not exist in the list', () => {
    expect(sumPlantSurfaceArea(plants, 999)).toBe(10);
  });
});
