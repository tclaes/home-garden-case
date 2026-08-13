import { notFound, redirect } from 'next/navigation';
import { sumPlantSurfaceArea } from '@itp-home-garden/shared-domain';
import { ApiError } from '@itp-home-garden/web-api-client';
import { getGardenById } from '@itp-home-garden/web-data-access-gardens';
import { getPlantsByGardenId } from '@itp-home-garden/web-data-access-plants';
import { PlantForm } from '@itp-home-garden/web-feature-plants';
import { gardenIdParamsSchema } from '@itp-home-garden/shared-api-contracts';

export const dynamic = 'force-dynamic';

export default async function NewPlantPage({ params }: { params: Promise<{ gardenId: string }> }) {
  const { gardenId: gardenIdParam } = await params;
  const parsedGardenId = gardenIdParamsSchema.safeParse({ gardenId: gardenIdParam });
  if (!parsedGardenId.success) {
    notFound();
  }
  const { gardenId } = parsedGardenId.data;

  let garden;
  try {
    garden = await getGardenById(gardenId);
  } catch (error) {
    if (error instanceof ApiError && error.status === 404) {
      notFound();
    }
    if (error instanceof ApiError && error.status === 401) {
      redirect('/login');
    }
    throw error;
  }

  const plants = await getPlantsByGardenId(gardenId);
  const usedSurfaceArea = sumPlantSurfaceArea(plants);

  return (
    <div className="flex flex-col gap-6">
      <h1 className="text-2xl font-semibold text-gray-900">Add a plant to {garden.gardenName}</h1>
      <div className="max-w-md">
        <PlantForm
          gardenId={gardenId}
          totalSurfaceArea={garden.totalSurfaceArea}
          usedSurfaceArea={usedSurfaceArea}
        />
      </div>
    </div>
  );
}
