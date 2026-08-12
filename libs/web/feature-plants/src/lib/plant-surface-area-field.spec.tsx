import '@testing-library/jest-dom/vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { PlantSurfaceAreaField } from './plant-surface-area-field.js';

describe('PlantSurfaceAreaField', () => {
  it('shows remaining capacity for a value that fits', () => {
    render(<PlantSurfaceAreaField totalSurfaceArea={10} usedSurfaceArea={4} defaultValue={2} />);

    expect(screen.getByText('4m² of the garden would remain free')).toBeInTheDocument();
    expect(screen.queryByRole('alert')).not.toBeInTheDocument();
  });

  it('flags overcrowding and reports it to the parent as the user types', () => {
    const onCapacityChange = vi.fn();
    render(
      <PlantSurfaceAreaField
        totalSurfaceArea={10}
        usedSurfaceArea={8}
        onCapacityChange={onCapacityChange}
      />,
    );

    fireEvent.change(screen.getByLabelText('Surface area required (m²)'), {
      target: { value: '5' },
    });

    expect(screen.getByRole('alert')).toHaveTextContent(/would overcrowd the garden/i);
    expect(onCapacityChange).toHaveBeenLastCalledWith(true);
  });

  it('clears the warning once the value fits again', () => {
    const onCapacityChange = vi.fn();
    render(
      <PlantSurfaceAreaField
        totalSurfaceArea={10}
        usedSurfaceArea={8}
        defaultValue={5}
        onCapacityChange={onCapacityChange}
      />,
    );

    expect(screen.getByRole('alert')).toBeInTheDocument();

    fireEvent.change(screen.getByLabelText('Surface area required (m²)'), {
      target: { value: '1' },
    });

    expect(screen.queryByRole('alert')).not.toBeInTheDocument();
    expect(onCapacityChange).toHaveBeenLastCalledWith(false);
  });
});
