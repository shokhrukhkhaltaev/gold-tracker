interface ChartEntry {
  date: string;
  priceUzs: number | null;
}

interface PriceChartProps {
  history: ChartEntry[];
  loading: boolean;
  hideTitle?: boolean;
}

function formatPrice(n: number): string {
  return n.toLocaleString('ru-RU');
}

function formatBarLabel(n: number): string {
  if (n >= 1_000_000) return (n / 1_000_000).toFixed(2) + 'М';
  if (n >= 1_000) return Math.round(n / 1_000).toLocaleString('ru-RU') + 'к';
  return n.toLocaleString('ru-RU');
}

function formatDate(dateStr: string): string {
  const d = new Date(dateStr);
  return d.toLocaleDateString('ru-RU', { day: 'numeric', month: 'short' });
}

export default function PriceChart({ history, loading, hideTitle }: PriceChartProps) {
  if (loading) {
    return (
      <div className="bg-white rounded-xl shadow-card p-6 gold-mesh overflow-hidden">
        <div className="flex gap-2 mb-3">
          {Array.from({ length: 7 }).map((_, i) => (
            <div key={i} className="flex-1 h-4 bg-surface-container rounded animate-pulse" />
          ))}
        </div>
        <div className="flex items-end gap-2 h-36 animate-pulse">
          {Array.from({ length: 7 }).map((_, i) => (
            <div key={i} className="flex-1 bg-surface-container rounded-t-sm" style={{ height: `${30 + i * 7}%` }} />
          ))}
        </div>
      </div>
    );
  }

  if (history.length === 0) return null;

  const activePrices = history.filter(h => h.priceUzs !== null).map(h => h.priceUzs as number);

  const minPrice = activePrices.length > 0 ? Math.min(...activePrices) : 0;
  const maxPrice = activePrices.length > 0 ? Math.max(...activePrices) : 0;
  const range = maxPrice - minPrice || 1;

  // Minimum display range = 3% of max price so tiny fluctuations don't look colossal
  const minDisplayRange = maxPrice * 0.03;
  const displayRange = Math.max(range, minDisplayRange);
  const displayMin = maxPrice - displayRange;

  const getBarHeight = (price: number) => {
    if (activePrices.length === 1) return '80%';
    const pct = ((price - displayMin) / displayRange) * 55 + 25;
    return `${Math.min(80, Math.max(25, pct))}%`;
  };

  const lastActiveIndex = history.reduce((acc, h, i) => (h.priceUzs !== null ? i : acc), -1);
  const isPositive = activePrices.length > 1
    ? activePrices[activePrices.length - 1] >= activePrices[0]
    : true;

  return (
    <div>
      {!hideTitle && activePrices.length > 0 && (
        <div className="flex justify-between items-end mb-4">
          <div>
            <h2 className="text-headline-md text-on-surface">Динамика цен</h2>
            <p className="text-label-sm text-secondary">Последние {activePrices.length} дней</p>
          </div>
          <div className="text-right">
            <span className={`block text-label-bold font-bold ${isPositive ? 'text-primary' : 'text-error'}`}>
              Макс: {formatPrice(maxPrice)}
            </span>
            <span className="block text-label-sm text-secondary">Мин: {formatPrice(minPrice)}</span>
          </div>
        </div>
      )}
      {hideTitle && activePrices.length > 0 && (
        <div className="flex justify-end mb-2">
          <div className="text-right">
            <span className={`block text-label-bold font-bold ${isPositive ? 'text-primary' : 'text-error'}`}>
              Макс: {formatPrice(maxPrice)}
            </span>
            <span className="block text-label-sm text-secondary">Мин: {formatPrice(minPrice)}</span>
          </div>
        </div>
      )}

      <div className="bg-white rounded-xl shadow-card p-6 gold-mesh overflow-hidden">
        {/* Price labels row — one per bar column */}
        <div className="flex gap-2 mb-3">
          {history.map((entry, i) => {
            const labelPrice = entry.priceUzs;
            return (
              <div key={i} className="flex-1 text-center">
                {labelPrice !== null ? (
                  <span className="text-[11px] font-bold text-on-surface leading-none block">
                    {formatBarLabel(labelPrice)}
                  </span>
                ) : (
                  <span className="text-[11px] text-zinc-200 leading-none block">—</span>
                )}
              </div>
            );
          })}
        </div>

        {/* Bars */}
        <div className="flex items-end gap-2 h-36">
          {history.map((entry, i) => {
            const isDisabled = entry.priceUzs === null;
            const isLast = i === lastActiveIndex;
            const isPeak = !isDisabled && entry.priceUzs === maxPrice && activePrices.length > 1;

            return (
              <div key={i} className="group relative flex-1 flex flex-col items-center justify-end h-full">
                {!isDisabled && (
                  <div className="absolute bottom-full mb-2 left-1/2 -translate-x-1/2 hidden group-hover:flex flex-col items-center z-10 pointer-events-none">
                    <div className="bg-inverse-surface text-inverse-on-surface text-[10px] font-semibold rounded px-2 py-1 whitespace-nowrap shadow-lg">
                      {formatPrice(entry.priceUzs!)}
                      <br />
                      <span className="opacity-70">{formatDate(entry.date)}</span>
                    </div>
                    <div className="w-2 h-2 bg-inverse-surface rotate-45 -mt-1" />
                  </div>
                )}

                {isDisabled ? (
                  <div
                    className="w-full rounded-t-sm bg-zinc-400"
                    style={{ height: '18%' }}
                  />
                ) : (
                  <div
                    className={`w-full rounded-t-sm transition-all duration-300 cursor-pointer hover:opacity-80 ${
                      isPeak ? 'bg-blue-400' : isLast ? 'bg-blue-600' : 'bg-blue-800'
                    }`}
                    style={{ height: getBarHeight(entry.priceUzs!) }}
                  />
                )}
              </div>
            );
          })}
        </div>

        {/* Date labels — one under each bar */}
        <div className="flex gap-2 mt-2">
          {history.map((entry, i) => {
            const d = new Date(entry.date + 'T00:00:00Z');
            const isFirst = i === 0;
            const isLast = i === history.length - 1;
            const label = (isFirst || isLast)
              ? d.toLocaleDateString('ru-RU', { day: 'numeric', month: 'short' })
              : String(d.getUTCDate());
            return (
              <div key={i} className="flex-1 text-center">
                <span className="text-[9px] text-secondary leading-none">{label}</span>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
