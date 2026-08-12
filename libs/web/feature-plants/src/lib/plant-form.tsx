'use client';

import { useActionState, useState } from 'react';
import { useRouter } from 'next/navigation';
import type { Plant } from '@itp-home-garden/shared-api-contracts';
import {
  type ActionResult,
  createPlantAction,
  updatePlantAction,
} from '@itp-home-garden/web-data-access-plants';
import { Button, FieldError, Input, Label } from '@itp-home-garden/web-ui';
import { PlantSurfaceAreaField } from './plant-surface-area-field.js';

type FormState = ActionResult<Plant> | null;

const PLANT_TYPES = ['vegetable', 'fruit', 'flower'] as const;

function parseFormData(formData: FormData, gardenId: number) {
  return {
    plantName: String(formData.get('plantName') ?? ''),
    species: String(formData.get('species') ?? ''),
    plantType: String(formData.get('plantType') ?? '') as (typeof PLANT_TYPES)[number],
    plantationDate: new Date(String(formData.get('plantationDate'))).toISOString(),
    surfaceAreaRequired: Number(formData.get('surfaceAreaRequired')),
    idealHumidityLevel: Number(formData.get('idealHumidityLevel')),
    gardenId,
  };
}

export interface PlantFormProps {
  gardenId: number;
  /** Garden's configured total surface area, for the live capacity meter. */
  totalSurfaceArea: number;
  /** Surface area already used by every *other* plant in the garden. */
  usedSurfaceArea: number;
  plant?: Plant;
}

export function PlantForm({ gardenId, totalSurfaceArea, usedSurfaceArea, plant }: PlantFormProps) {
  const router = useRouter();
  const isEdit = plant !== undefined;
  const [exceedsCapacity, setExceedsCapacity] = useState(false);

  const [state, formAction, isPending] = useActionState<FormState, FormData>(
    async (_prevState, formData) => {
      const input = parseFormData(formData, gardenId);
      const result = isEdit
        ? await updatePlantAction(plant.plantId, gardenId, input)
        : await createPlantAction(input);

      if (result.ok) {
        router.push(`/gardens/${gardenId}`);
      }
      return result;
    },
    null,
  );

  return (
    <form action={formAction} className="flex flex-col gap-4">
      <div className="flex flex-col gap-1.5">
        <Label htmlFor="plantName">Name</Label>
        <Input id="plantName" name="plantName" defaultValue={plant?.plantName} required />
      </div>

      <div className="flex flex-col gap-1.5">
        <Label htmlFor="species">Species</Label>
        <Input id="species" name="species" defaultValue={plant?.species} required />
      </div>

      <div className="flex flex-col gap-1.5">
        <Label htmlFor="plantType">Type</Label>
        <select
          id="plantType"
          name="plantType"
          defaultValue={plant?.plantType ?? PLANT_TYPES[0]}
          required
          className="h-10 w-full rounded-md border border-gray-300 bg-white px-3 text-sm text-gray-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-green-600"
        >
          {PLANT_TYPES.map((type) => (
            <option key={type} value={type}>
              {type}
            </option>
          ))}
        </select>
      </div>

      <div className="flex flex-col gap-1.5">
        <Label htmlFor="plantationDate">Plantation date</Label>
        <Input
          id="plantationDate"
          name="plantationDate"
          type="date"
          defaultValue={plant?.plantationDate.slice(0, 10)}
          required
        />
      </div>

      <PlantSurfaceAreaField
        totalSurfaceArea={totalSurfaceArea}
        usedSurfaceArea={usedSurfaceArea}
        defaultValue={plant?.surfaceAreaRequired}
        onCapacityChange={setExceedsCapacity}
      />

      <div className="flex flex-col gap-1.5">
        <Label htmlFor="idealHumidityLevel">Ideal humidity level (%)</Label>
        <Input
          id="idealHumidityLevel"
          name="idealHumidityLevel"
          type="number"
          min={0}
          max={100}
          defaultValue={plant?.idealHumidityLevel}
          required
        />
      </div>

      {state && !state.ok && <FieldError>{state.error}</FieldError>}

      <Button type="submit" disabled={isPending || exceedsCapacity}>
        {isPending ? 'Saving…' : isEdit ? 'Save changes' : 'Add plant'}
      </Button>
    </form>
  );
}
