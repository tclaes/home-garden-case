import Link from 'next/link';
import { Suspense } from 'react';
import { GardenList } from '@itp-home-garden/web-feature-gardens';
import { buttonVariants } from '@itp-home-garden/web-ui';

// Data is per-request against a live, frequently-changing backend — never prerender statically.
export const dynamic = 'force-dynamic';

function GardenListSkeleton() {
  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3" aria-hidden>
      {[0, 1, 2].map((i) => (
        <div key={i} className="h-32 animate-pulse rounded-lg border border-gray-200 bg-gray-100" />
      ))}
    </div>
  );
}

export default function GardensPage() {
  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold text-gray-900">Your gardens</h1>
        <Link href="/gardens/new" className={buttonVariants({ variant: 'primary' })}>
          New garden
        </Link>
      </div>
      <Suspense fallback={<GardenListSkeleton />}>
        <GardenList />
      </Suspense>
    </div>
  );
}
