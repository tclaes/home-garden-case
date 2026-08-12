'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { deleteGardenAction } from '@itp-home-garden/web-data-access-gardens';
import { Button } from '@itp-home-garden/web-ui';

export function DeleteGardenButton({ gardenId }: { gardenId: number }) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [confirming, setConfirming] = useState(false);

  if (!confirming) {
    return (
      <Button variant="destructive" size="sm" onClick={() => setConfirming(true)}>
        Delete garden
      </Button>
    );
  }

  return (
    <div className="flex flex-wrap items-center gap-2">
      <span className="text-sm text-gray-600">Delete this garden and all its plants?</span>
      <Button
        variant="destructive"
        size="sm"
        disabled={isPending}
        onClick={() =>
          startTransition(async () => {
            const result = await deleteGardenAction(gardenId);
            if (result.ok) {
              router.push('/gardens');
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
