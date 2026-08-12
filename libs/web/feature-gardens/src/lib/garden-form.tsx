'use client';

import { useActionState } from 'react';
import { useRouter } from 'next/navigation';
import type { Garden } from '@itp-home-garden/shared-api-contracts';
import {
  type ActionResult,
  createGardenAction,
  updateGardenAction,
} from '@itp-home-garden/web-data-access-gardens';
import { Button, FieldError, Input, Label } from '@itp-home-garden/web-ui';

type FormState = ActionResult<Garden> | null;

function parseFormData(formData: FormData) {
  const latitude = formData.get('latitude');
  const longitude = formData.get('longitude');
  return {
    gardenName: String(formData.get('gardenName') ?? ''),
    totalSurfaceArea: Number(formData.get('totalSurfaceArea')),
    locationDescription: (formData.get('locationDescription') as string) || null,
    latitude: latitude ? Number(latitude) : null,
    longitude: longitude ? Number(longitude) : null,
  };
}

export function GardenForm({ garden }: { garden?: Garden }) {
  const router = useRouter();
  const isEdit = garden !== undefined;

  const [state, formAction, isPending] = useActionState<FormState, FormData>(
    async (_prevState, formData) => {
      const input = parseFormData(formData);
      const result = isEdit
        ? await updateGardenAction(garden.gardenId, input)
        : await createGardenAction(input);

      if (result.ok) {
        router.push(`/gardens/${result.data.gardenId}`);
      }
      return result;
    },
    null,
  );

  return (
    <form action={formAction} className="flex flex-col gap-4">
      <div className="flex flex-col gap-1.5">
        <Label htmlFor="gardenName">Name</Label>
        <Input id="gardenName" name="gardenName" defaultValue={garden?.gardenName} required />
      </div>

      <div className="flex flex-col gap-1.5">
        <Label htmlFor="totalSurfaceArea">Total surface area (m²)</Label>
        <Input
          id="totalSurfaceArea"
          name="totalSurfaceArea"
          type="number"
          min={0}
          step="any"
          defaultValue={garden?.totalSurfaceArea}
          required
        />
      </div>

      <div className="flex flex-col gap-1.5">
        <Label htmlFor="locationDescription">Location</Label>
        <Input
          id="locationDescription"
          name="locationDescription"
          placeholder="e.g. Backyard"
          defaultValue={garden?.locationDescription ?? ''}
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="latitude">Latitude</Label>
          <Input
            id="latitude"
            name="latitude"
            type="number"
            step="any"
            defaultValue={garden?.latitude ?? ''}
          />
        </div>
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="longitude">Longitude</Label>
          <Input
            id="longitude"
            name="longitude"
            type="number"
            step="any"
            defaultValue={garden?.longitude ?? ''}
          />
        </div>
      </div>

      {state && !state.ok && <FieldError>{state.error}</FieldError>}

      <Button type="submit" disabled={isPending}>
        {isPending ? 'Saving…' : isEdit ? 'Save changes' : 'Create garden'}
      </Button>
    </form>
  );
}
