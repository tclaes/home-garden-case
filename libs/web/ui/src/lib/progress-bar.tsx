import { cn } from './cn.js';

export interface ProgressBarProps {
  /** 0-100. Values above 100 are clamped visually, but the bar turns red past 100 to flag overcrowding-style overshoot. */
  percent: number;
  className?: string;
}

export function ProgressBar({ percent, className }: ProgressBarProps) {
  const clamped = Math.max(0, Math.min(100, percent));
  const overCapacity = percent > 100;

  return (
    <div
      role="progressbar"
      aria-valuenow={Math.round(percent)}
      aria-valuemin={0}
      aria-valuemax={100}
      className={cn('h-2 w-full overflow-hidden rounded-full bg-gray-100', className)}
    >
      <div
        className={cn(
          'h-full rounded-full transition-[width]',
          overCapacity ? 'bg-red-600' : 'bg-green-600',
        )}
        style={{ width: `${clamped}%` }}
      />
    </div>
  );
}
