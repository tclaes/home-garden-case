import { sumPlantSurfaceArea } from '@itp-home-garden/shared-domain';
import { getPlantsByGardenId } from '@itp-home-garden/web-data-access-plants';
import { ProgressBar } from '@itp-home-garden/web-ui';

export async function GardenCapacitySummary({
  gardenId,
  totalSurfaceArea,
}: {
  gardenId: number;
  totalSurfaceArea: number;
}) {
  const plants = await getPlantsByGardenId(gardenId);
  const usedSurfaceArea = sumPlantSurfaceArea(plants);
  const percent = totalSurfaceArea === 0 ? 0 : (usedSurfaceArea / totalSurfaceArea) * 100;
  const remaining = totalSurfaceArea - usedSurfaceArea;

  return (
    <div className="flex flex-col gap-2">
      <div className="flex items-baseline justify-between text-sm">
        <span className="font-medium text-gray-700">Garden capacity</span>
        <span className="text-gray-500">
          {usedSurfaceArea}m² / {totalSurfaceArea}m² used
        </span>
      </div>
      <ProgressBar percent={percent} />
      <p className="text-sm text-gray-500">
        {remaining >= 0
          ? `${remaining}m² remaining`
          : `${Math.abs(remaining)}m² over capacity — remove or shrink a plant`}
      </p>
    </div>
  );
}
