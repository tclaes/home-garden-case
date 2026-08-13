import Link from 'next/link';
import { redirect } from 'next/navigation';
import { getGardens } from '@itp-home-garden/web-data-access-gardens';
import { ApiError } from '@itp-home-garden/web-api-client';
import { buttonVariants } from '@itp-home-garden/web-ui';
import { GardenCard } from './garden-card.js';

/** A present-but-expired/invalid session cookie surfaces as a 401 from the API — send the user
 * back to log in rather than letting the generic error boundary handle it. */
async function getGardensOrRedirect() {
  try {
    return await getGardens();
  } catch (error) {
    if (error instanceof ApiError && error.status === 401) {
      redirect('/login');
    }
    throw error;
  }
}

export async function GardenList() {
  const gardens = await getGardensOrRedirect();

  if (gardens.length === 0) {
    return (
      <div className="flex flex-col items-center gap-4 rounded-lg border border-dashed border-gray-300 p-12 text-center">
        <p className="text-gray-500">You haven&apos;t added any gardens yet.</p>
        <Link href="/gardens/new" className={buttonVariants({ variant: 'primary' })}>
          Create your first garden
        </Link>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {gardens.map((garden) => (
        <GardenCard key={garden.gardenId} garden={garden} />
      ))}
    </div>
  );
}
