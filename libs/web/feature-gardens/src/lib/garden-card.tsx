import Link from 'next/link';
import type { Garden } from '@itp-home-garden/shared-api-contracts';
import { Card, CardContent, CardHeader, CardTitle, Badge } from '@itp-home-garden/web-ui';

export function GardenCard({ garden }: { garden: Garden }) {
  return (
    <Link href={`/gardens/${garden.gardenId}`} className="block">
      <Card className="transition-shadow hover:shadow-md">
        <CardHeader className="flex-row items-start justify-between">
          <CardTitle>{garden.gardenName}</CardTitle>
          <Badge tone="neutral">{garden.totalSurfaceArea}m²</Badge>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-gray-500">{garden.locationDescription ?? 'No location set'}</p>
        </CardContent>
      </Card>
    </Link>
  );
}
