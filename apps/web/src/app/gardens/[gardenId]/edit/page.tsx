import { notFound, redirect } from 'next/navigation';
import { getGardenById } from '@itp-home-garden/web-data-access-gardens';
import { ApiError } from '@itp-home-garden/web-api-client';
import { GardenForm } from '@itp-home-garden/web-feature-gardens';
import { gardenIdParamsSchema } from '@itp-home-garden/shared-api-contracts';

export const dynamic = 'force-dynamic';

export default async function EditGardenPage({
  params,
}: {
  params: Promise<{ gardenId: string }>;
}) {
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

  return (
    <div className="flex flex-col gap-6">
      <h1 className="text-2xl font-semibold text-gray-900">Edit {garden.gardenName}</h1>
      <div className="max-w-md">
        <GardenForm garden={garden} />
      </div>
    </div>
  );
}
