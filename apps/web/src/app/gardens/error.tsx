'use client';

import { ErrorState } from '@itp-home-garden/web-ui';

export default function GardensError({ reset }: { error: Error; reset: () => void }) {
  return (
    <ErrorState
      message="Couldn't load your gardens right now — the backend can be flaky under load."
      onRetry={reset}
    />
  );
}
