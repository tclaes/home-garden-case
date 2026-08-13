import Link from 'next/link';
import { notFound, redirect } from 'next/navigation';
import { Suspense } from 'react';
import { getGardenById } from '@itp-home-garden/web-data-access-gardens';
import { ApiError } from '@itp-home-garden/web-api-client';
import { gardenIdParamsSchema } from '@itp-home-garden/shared-api-contracts';
import { DeleteGardenButton } from '@itp-home-garden/web-feature-gardens';
import { GardenCapacitySummary, PlantList } from '@itp-home-garden/web-feature-plants';
import { buttonVariants } from '@itp-home-garden/web-ui';

export const dynamic = 'force-dynamic';

async function getGardenOrNotFound(gardenId: number) {
  try {
    return await getGardenById(gardenId);
  } catch (error) {
    if (error instanceof ApiError && error.status === 404) {
      notFound();
    }
    // A present-but-expired/invalid session cookie surfaces as a 401 — send the user back to
    // log in rather than letting the generic error boundary handle it.
    if (error instanceof ApiError && error.status === 401) {
      redirect('/login');
    }
    throw error;
  }
}

function PlantListSkeleton() {
  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3" aria-hidden>
      {[0, 1, 2].map((i) => (
        <div key={i} className="h-28 animate-pulse rounded-lg border border-gray-200 bg-gray-100" />
      ))}
    </div>
  );
}

export default async function GardenDetailPage({
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
  const garden = await getGardenOrNotFound(gardenId);

  return (
    <div className="flex flex-col gap-8">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900">{garden.gardenName}</h1>
          <p className="text-sm text-gray-500">{garden.locationDescription ?? 'No location set'}</p>
        </div>
        <div className="flex gap-2">
          <Link
            href={`/gardens/${gardenId}/edit`}
            className={buttonVariants({ variant: 'secondary' })}
          >
            Edit garden
          </Link>
          <DeleteGardenButton gardenId={gardenId} />
        </div>
      </div>

      <Suspense fallback={<div className="h-8 animate-pulse rounded bg-gray-100" aria-hidden />}>
        <GardenCapacitySummary gardenId={gardenId} totalSurfaceArea={garden.totalSurfaceArea} />
      </Suspense>

      <div className="flex flex-col gap-4">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold text-gray-900">Plants</h2>
          <Link
            href={`/gardens/${gardenId}/plants/new`}
            className={buttonVariants({ variant: 'primary', size: 'sm' })}
          >
            Add plant
          </Link>
        </div>
        <Suspense fallback={<PlantListSkeleton />}>
          <PlantList gardenId={gardenId} />
        </Suspense>
      </div>
    </div>
  );
}
