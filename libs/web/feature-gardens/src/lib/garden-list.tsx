import Link from 'next/link';
import { getGardens } from '@itp-home-garden/web-data-access-gardens';
import { buttonVariants } from '@itp-home-garden/web-ui';
import { GardenCard } from './garden-card.js';

export async function GardenList() {
  const gardens = await getGardens();

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
