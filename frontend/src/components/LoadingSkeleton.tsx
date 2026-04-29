export function BankCardSkeleton() {
  return (
    <div className="bg-white rounded-xl shadow-card p-gutter animate-pulse">
      <div className="flex justify-between items-start mb-stack-md">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-lg bg-surface-container-high" />
          <div className="space-y-2">
            <div className="w-16 h-4 bg-surface-container-high rounded" />
            <div className="w-28 h-3 bg-surface-container rounded" />
          </div>
        </div>
        <div className="text-right space-y-2">
          <div className="w-14 h-6 bg-surface-container-high rounded" />
          <div className="w-16 h-3 bg-surface-container rounded" />
        </div>
      </div>
      <div className="w-full h-11 bg-surface-container rounded-lg" />
    </div>
  );
}

export function PriceCardSkeleton() {
  return (
    <div className="bg-white rounded-xl shadow-card p-stack-md animate-pulse">
      <div className="flex justify-between items-start mb-4">
        <div className="w-12 h-8 bg-surface-container-high rounded-lg" />
        <div className="space-y-1">
          <div className="w-32 h-6 bg-surface-container-high rounded" />
          <div className="w-16 h-3 bg-surface-container rounded ml-auto" />
        </div>
      </div>
      <div className="w-full h-11 bg-surface-container rounded-lg" />
    </div>
  );
}

export function ChartSkeleton() {
  return (
    <div className="bg-white rounded-xl shadow-card p-6 gold-mesh aspect-video animate-pulse flex items-end justify-between gap-1">
      {Array.from({ length: 15 }).map((_, i) => (
        <div
          key={i}
          className="w-full bg-surface-container rounded-t-sm"
          style={{ height: `${40 + Math.random() * 50}%` }}
        />
      ))}
    </div>
  );
}
