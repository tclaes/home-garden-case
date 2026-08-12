'use client';

import { useEffect, useState } from 'react';
import { checkGardenCapacity } from '@itp-home-garden/shared-domain';
import { FieldError, Input, Label, ProgressBar } from '@itp-home-garden/web-ui';

export interface PlantSurfaceAreaFieldProps {
  /** Garden's configured total surface area. */
  totalSurfaceArea: number;
  /** Surface area already used by every *other* plant in the garden (excludes the plant being edited). */
  usedSurfaceArea: number;
  defaultValue?: number;
  /** Notified whenever the live capacity check changes, so the surrounding form can disable submit. */
  onCapacityChange?: (exceedsCapacity: boolean) => void;
}

/**
 * Mirrors the server-side overcrowding rule live as the user types, using the same
 * checkGardenCapacity function the backend's PlantService relies on — so the two can never
 * disagree about what "over capacity" means.
 */
export function PlantSurfaceAreaField({
  totalSurfaceArea,
  usedSurfaceArea,
  defaultValue,
  onCapacityChange,
}: PlantSurfaceAreaFieldProps) {
  const [requestedSurfaceArea, setRequestedSurfaceArea] = useState(defaultValue ?? 0);

  const capacity = checkGardenCapacity({
    totalSurfaceArea,
    usedSurfaceArea,
    requestedSurfaceArea,
  });

  useEffect(() => {
    onCapacityChange?.(capacity.exceedsCapacity);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [capacity.exceedsCapacity]);
  const percent = totalSurfaceArea === 0 ? 0 : (capacity.totalSurfaceArea / totalSurfaceArea) * 100;

  return (
    <div className="flex flex-col gap-1.5">
      <Label htmlFor="surfaceAreaRequired">Surface area required (m²)</Label>
      <Input
        id="surfaceAreaRequired"
        name="surfaceAreaRequired"
        type="number"
        min={0}
        step="any"
        defaultValue={defaultValue}
        onChange={(event) => setRequestedSurfaceArea(Number(event.target.value) || 0)}
        required
        aria-describedby="surfaceAreaRequired-capacity"
      />
      <div id="surfaceAreaRequired-capacity" className="flex flex-col gap-1">
        <ProgressBar percent={percent} />
        <p className="text-sm text-gray-500">
          {capacity.remainingSurfaceArea >= 0
            ? `${capacity.remainingSurfaceArea}m² of the garden would remain free`
            : `Exceeds the garden by ${Math.abs(capacity.remainingSurfaceArea)}m²`}
        </p>
      </div>
      {capacity.exceedsCapacity && (
        <FieldError>
          This plant would overcrowd the garden ({capacity.totalSurfaceArea}m² of {totalSurfaceArea}
          m²). Reduce the surface area or free up space first.
        </FieldError>
      )}
    </div>
  );
}
