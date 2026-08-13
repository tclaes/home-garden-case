'use client';

import { ErrorState } from '@itp-home-garden/web-ui';

export default function GardenDetailError({ reset }: { error: Error; reset: () => void }) {
  return <ErrorState message="Couldn't load this garden right now." onRetry={reset} />;
}
