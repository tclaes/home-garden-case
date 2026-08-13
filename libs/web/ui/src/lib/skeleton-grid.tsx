export interface SkeletonGridProps {
  titleClassName?: string;
  showSubtitleBar?: boolean;
  cardCount?: number;
  cardClassName?: string;
  gapClassName?: string;
}

export function SkeletonGrid({
  titleClassName = 'h-8 w-64',
  showSubtitleBar = false,
  cardCount = 3,
  cardClassName = 'h-28',
  gapClassName = 'gap-4',
}: SkeletonGridProps) {
  return (
    <div className={`flex flex-col ${gapClassName}`}>
      <div className={`animate-pulse rounded bg-gray-100 ${titleClassName}`} />
      {showSubtitleBar && <div className="h-8 animate-pulse rounded bg-gray-100 subtitle-bar" />}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {Array.from({ length: cardCount }, (_, i) => (
          <div
            key={i}
            className={`animate-pulse rounded-lg border border-gray-200 bg-gray-100 ${cardClassName}`}
          />
        ))}
      </div>
    </div>
  );
}
