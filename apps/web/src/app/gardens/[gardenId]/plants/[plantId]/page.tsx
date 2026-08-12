import { notFound } from 'next/navigation';
import { sumPlantSurfaceArea } from '@itp-home-garden/shared-domain';
import { ApiError } from '@itp-home-garden/web-api-client';
import { getGardenById } from '@itp-home-garden/web-data-access-gardens';
import { getPlantById, getPlantsByGardenId } from '@itp-home-garden/web-data-access-plants';
import { DeletePlantButton, PlantForm } from '@itp-home-garden/web-feature-plants';
import { gardenIdParamsSchema, plantIdParamsSchema } from '@itp-home-garden/shared-api-contracts';

export const dynamic = 'force-dynamic';

export default async function PlantDetailPage({
  params,
}: {
  params: Promise<{ gardenId: string; plantId: string }>;
}) {
  const { gardenId: gardenIdParam, plantId: plantIdParam } = await params;
  const parsedGardenId = gardenIdParamsSchema.safeParse({ gardenId: gardenIdParam });
  const parsedPlantId = plantIdParamsSchema.safeParse({ plantId: plantIdParam });
  if (!parsedGardenId.success || !parsedPlantId.success) {
    notFound();
  }
  const { gardenId } = parsedGardenId.data;
  const { plantId } = parsedPlantId.data;

  let garden;
  let plant;
  try {
    [garden, plant] = await Promise.all([getGardenById(gardenId), getPlantById(plantId)]);
  } catch (error) {
    if (error instanceof ApiError && error.status === 404) {
      notFound();
    }
    throw error;
  }

  if (plant.gardenId !== gardenId) {
    notFound();
  }

  const plants = await getPlantsByGardenId(gardenId);
  const usedSurfaceArea = sumPlantSurfaceArea(plants, plantId);

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-start justify-between gap-4">
        <h1 className="text-2xl font-semibold text-gray-900">{plant.plantName}</h1>
        <DeletePlantButton plantId={plantId} gardenId={gardenId} />
      </div>
      <div className="max-w-md">
        <PlantForm
          gardenId={gardenId}
          totalSurfaceArea={garden.totalSurfaceArea}
          usedSurfaceArea={usedSurfaceArea}
          plant={plant}
        />
      </div>
    </div>
  );
}
