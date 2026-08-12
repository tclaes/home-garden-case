export default function GardenDetailLoading() {
  return (
    <div className="flex flex-col gap-8">
      <div className="h-8 w-64 animate-pulse rounded bg-gray-100" />
      <div className="h-8 animate-pulse rounded bg-gray-100" />
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {[0, 1, 2].map((i) => (
          <div
            key={i}
            className="h-28 animate-pulse rounded-lg border border-gray-200 bg-gray-100"
          />
        ))}
      </div>
    </div>
  );
}
