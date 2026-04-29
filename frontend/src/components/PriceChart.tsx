import { PriceHistoryEntry } from '../types/index.js';

interface PriceChartProps {
  history: PriceHistoryEntry[];
  loading: boolean;
}

function formatPrice(n: number): string {
  return n.toLocaleString('ru-RU');
}

function formatDate(dateStr: string): string {
  const d = new Date(dateStr);
  return d.toLocaleDateString('ru-RU', { day: 'numeric', month: 'short' });
}

export default function PriceChart({ history, loading }: PriceChartProps) {
  if (loading) {
    return (
      <div className="bg-white rounded-xl shadow-card p-6 gold-mesh aspect-video animate-pulse flex items-end justify-between gap-1">
        {Array.from({ length: 15 }).map((_, i) => (
          <div key={i} className="w-full bg-surface-container rounded-t-sm" style={{ height: `${45 + i * 3}%` }} />
        ))}
      </div>
    );
  }

  if (history.length === 0) return null;

  const prices = history.map(h => h.priceUzs);
  const minPrice = Math.min(...prices);
  const maxPrice = Math.max(...prices);
  const range = maxPrice - minPrice || 1;

  const getBarHeight = (price: number) => {
    const pct = ((price - minPrice) / range) * 60 + 30; // 30%–90%
    return `${pct}%`;
  };

  const lastPrice = prices[prices.length - 1];
  const firstPrice = prices[0];
  const changePercent = ((lastPrice - firstPrice) / firstPrice) * 100;
  const isPositive = changePercent >= 0;

  return (
    <div>
      <div className="flex justify-between items-end mb-4">
        <div>
          <h2 className="text-headline-md text-on-surface">Динамика цен</h2>
          <p className="text-label-sm text-secondary">Последние {history.length} дней</p>
        </div>
        <div className="text-right">
          <span className={`block text-label-bold font-bold ${isPositive ? 'text-primary' : 'text-error'}`}>
            Макс: {formatPrice(maxPrice)}
          </span>
          <span className="block text-label-sm text-secondary">Мин: {formatPrice(minPrice)}</span>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-card p-6 gold-mesh overflow-hidden">
        {/* Tooltip area */}
        <div className="flex items-end justify-between gap-1 h-48">
          {history.map((entry, i) => {
            const isLast = i === history.length - 1;
            const isPeak = entry.priceUzs === maxPrice;
            return (
              <div key={i} className="group relative flex-1 flex flex-col items-center justify-end h-full">
                {/* Tooltip */}
                <div className="absolute bottom-full mb-2 left-1/2 -translate-x-1/2 hidden group-hover:flex flex-col items-center z-10 pointer-events-none">
                  <div className="bg-inverse-surface text-inverse-on-surface text-[10px] font-semibold rounded px-2 py-1 whitespace-nowrap shadow-lg">
                    {formatPrice(entry.priceUzs)}
                    <br />
                    <span className="opacity-70">{formatDate(entry.date)}</span>
                  </div>
                  <div className="w-2 h-2 bg-inverse-surface rotate-45 -mt-1" />
                </div>
                {/* Bar */}
                <div
                  className={`w-full rounded-t-sm transition-all duration-300 cursor-pointer hover:opacity-80 ${
                    isLast
                      ? 'bg-primary'
                      : isPeak
                      ? 'bg-primary-container'
                      : 'bg-zinc-100'
                  }`}
                  style={{ height: getBarHeight(entry.priceUzs) }}
                />
              </div>
            );
          })}
        </div>

        {/* X-axis labels — first, middle, last */}
        <div className="flex justify-between mt-2">
          <span className="text-[10px] text-secondary">{formatDate(history[0].date)}</span>
          {history.length > 7 && (
            <span className="text-[10px] text-secondary">{formatDate(history[Math.floor(history.length / 2)].date)}</span>
          )}
          <span className="text-[10px] text-secondary">{formatDate(history[history.length - 1].date)}</span>
        </div>
      </div>
    </div>
  );
}
