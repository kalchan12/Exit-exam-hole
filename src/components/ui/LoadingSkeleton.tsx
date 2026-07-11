export function CardSkeleton({ count = 6 }: { count?: number }) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 animate-pulse">
      {Array.from({ length: count }, (_, i) => (
        <div key={i} className="card p-5 flex flex-col min-h-[160px]">
          <div className="flex items-start gap-3 mb-3">
            <div className="w-8 h-8 rounded-lg bg-surface-container-highest" />
            <div className="flex-1 space-y-2">
              <div className="h-3 bg-surface-container-highest rounded w-3/4" />
              <div className="h-3 bg-surface-container-highest rounded w-1/2" />
            </div>
          </div>
          <div className="mt-auto pt-4 border-t border-outline-variant">
            <div className="h-3 bg-surface-container-highest rounded w-1/3" />
          </div>
        </div>
      ))}
    </div>
  );
}

export function ListSkeleton({ rows = 5 }: { rows?: number }) {
  return (
    <div className="animate-pulse space-y-3">
      {Array.from({ length: rows }, (_, i) => (
        <div key={i} className="flex items-center gap-4 p-4 rounded-xl bg-surface-container-highest/50">
          <div className="w-10 h-10 rounded-lg bg-surface-container-highest" />
          <div className="flex-1 space-y-2">
            <div className="h-3 bg-surface-container-highest rounded w-1/2" />
            <div className="h-3 bg-surface-container-highest rounded w-1/4" />
          </div>
        </div>
      ))}
    </div>
  );
}

export function PageSkeleton() {
  return (
    <div className="animate-pulse space-y-6 py-4">
      <div className="h-10 bg-surface-container-highest rounded-xl w-48" />
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {Array.from({ length: 4 }, (_, i) => (
          <div key={i} className="h-24 bg-surface-container-highest rounded-xl" />
        ))}
      </div>
      <div className="h-48 bg-surface-container-highest rounded-xl" />
    </div>
  );
}
