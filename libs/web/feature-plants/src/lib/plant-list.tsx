import Link from 'next/link';
import { getPlantsByGardenId } from '@itp-home-garden/web-data-access-plants';
import { buttonVariants } from '@itp-home-garden/web-ui';
import { PlantCard } from './plant-card.js';

export async function PlantList({ gardenId }: { gardenId: number }) {
  const plants = await getPlantsByGardenId(gardenId);

  if (plants.length === 0) {
    return (
      <div className="flex flex-col items-center gap-4 rounded-lg border border-dashed border-gray-300 p-12 text-center">
        <p className="text-gray-500">No plants in this garden yet.</p>
        <Link
          href={`/gardens/${gardenId}/plants/new`}
          className={buttonVariants({ variant: 'primary' })}
        >
          Add your first plant
        </Link>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {plants.map((plant) => (
        <PlantCard key={plant.plantId} plant={plant} />
      ))}
    </div>
  );
}
