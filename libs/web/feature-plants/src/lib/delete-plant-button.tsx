'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { deletePlantAction } from '@itp-home-garden/web-data-access-plants';
import { Button } from '@itp-home-garden/web-ui';

export function DeletePlantButton({ plantId, gardenId }: { plantId: number; gardenId: number }) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [confirming, setConfirming] = useState(false);

  if (!confirming) {
    return (
      <Button variant="destructive" size="sm" onClick={() => setConfirming(true)}>
        Delete plant
      </Button>
    );
  }

  return (
    <div className="flex flex-wrap items-center gap-2">
      <span className="text-sm text-gray-600">Delete this plant?</span>
      <Button
        variant="destructive"
        size="sm"
        disabled={isPending}
        onClick={() =>
          startTransition(async () => {
            const result = await deletePlantAction(plantId);
            if (result.ok) {
              router.push(`/gardens/${gardenId}`);
            } else {
              setError(result.error);
            }
          })
        }
      >
        {isPending ? 'Deleting…' : 'Confirm delete'}
      </Button>
      <Button variant="ghost" size="sm" onClick={() => setConfirming(false)}>
        Cancel
      </Button>
      {error && <span className="text-sm text-red-600">{error}</span>}
    </div>
  );
}
