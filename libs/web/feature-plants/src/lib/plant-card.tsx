import Link from 'next/link';
import type { Plant } from '@itp-home-garden/shared-api-contracts';
import { Badge, Card, CardContent, CardHeader, CardTitle } from '@itp-home-garden/web-ui';

const PLANT_TYPE_TONE = {
  vegetable: 'success',
  fruit: 'warning',
  flower: 'neutral',
} as const;

export function PlantCard({ plant }: { plant: Plant }) {
  return (
    <Link href={`/gardens/${plant.gardenId}/plants/${plant.plantId}`} className="block">
      <Card className="transition-shadow hover:shadow-md">
        <CardHeader className="flex-row items-start justify-between">
          <CardTitle>{plant.plantName}</CardTitle>
          <Badge tone={PLANT_TYPE_TONE[plant.plantType]}>{plant.plantType}</Badge>
        </CardHeader>
        <CardContent className="flex flex-col gap-1">
          <p className="text-sm text-gray-500">{plant.species}</p>
          <p className="text-sm text-gray-500">
            {plant.surfaceAreaRequired}m² · {plant.idealHumidityLevel}% humidity
          </p>
        </CardContent>
      </Card>
    </Link>
  );
}
