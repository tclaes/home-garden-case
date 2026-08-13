import { Button } from './button.js';

export interface ErrorStateProps {
  message: string;
  onRetry: () => void;
  retryLabel?: string;
}

export function ErrorState({ message, onRetry, retryLabel = 'Try again' }: ErrorStateProps) {
  return (
    <div className="flex flex-col items-center gap-4 rounded-lg border border-red-200 bg-red-50 p-12 text-center">
      <p className="text-red-700">{message}</p>
      <Button type="button" variant="destructive" onClick={onRetry}>
        {retryLabel}
      </Button>
    </div>
  );
}
