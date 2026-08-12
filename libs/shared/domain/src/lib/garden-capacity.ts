export interface GardenCapacityInput {
  /** Garden's configured total surface area, in square meters. */
  totalSurfaceArea: number;
  /** Sum of surfaceAreaRequired for every plant already in the garden, excluding the plant being created/updated (if any). */
  usedSurfaceArea: number;
  /** surfaceAreaRequired of the plant being added or updated. */
  requestedSurfaceArea: number;
}

export interface GardenCapacityResult {
  /** usedSurfaceArea + requestedSurfaceArea */
  totalSurfaceArea: number;
  /** How much surface area would remain (negative when over capacity). */
  remainingSurfaceArea: number;
  exceedsCapacity: boolean;
}

/**
 * Mirrors the overcrowding rule enforced server-side in plant.service.ts, so the web UI can show
 * a live "remaining capacity" indicator and block obviously-doomed submissions before the round trip.
 */
export function checkGardenCapacity({
  totalSurfaceArea,
  usedSurfaceArea,
  requestedSurfaceArea,
}: GardenCapacityInput): GardenCapacityResult {
  const newTotal = usedSurfaceArea + requestedSurfaceArea;
  return {
    totalSurfaceArea: newTotal,
    remainingSurfaceArea: totalSurfaceArea - newTotal,
    exceedsCapacity: newTotal > totalSurfaceArea,
  };
}

/** Sums surfaceAreaRequired across plants, optionally excluding one (e.g. the plant being updated). */
export function sumPlantSurfaceArea(
  plants: readonly { plantId: number; surfaceAreaRequired: number }[],
  excludePlantId?: number,
): number {
  return plants
    .filter((plant) => plant.plantId !== excludePlantId)
    .reduce((sum, plant) => sum + plant.surfaceAreaRequired, 0);
}
