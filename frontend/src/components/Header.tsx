import { GoldPrice } from '../types/index.js';

interface HeaderProps {
  prices: GoldPrice[];
  loading: boolean;
}

function formatPrice(n: number): string {
  return n.toLocaleString('ru-RU');
}

export default function Header({ prices, loading }: HeaderProps) {
  const pricePerGram = prices.find(p => p.weightGrams === 1)?.priceUzs
    ?? (prices[0] ? Math.round(prices[0].priceUzs / prices[0].weightGrams) : 0);

  return (
    <header className="bg-white border-b border-zinc-100 shadow-sm fixed top-0 w-full z-50 flex justify-between items-center px-6 py-3">
      <div className="flex items-center gap-3">
        <span className="material-symbols-outlined text-yellow-500" style={{ fontVariationSettings: "'FILL' 1" }}>
          payments
        </span>
        <h1 className="font-bold text-lg text-on-surface">Золото Узбекистана</h1>
      </div>
      {loading ? (
        <span className="w-32 h-6 bg-surface-container-high rounded-full animate-pulse block" />
      ) : pricePerGram > 0 ? (
        <div
          className="flex items-center gap-1.5 bg-primary-fixed px-3 py-1 rounded-full select-none pointer-events-none cursor-default"
          aria-label={`Цена за 1 грамм: ${formatPrice(pricePerGram)} сум`}
        >
          <span className="material-symbols-outlined text-on-primary-fixed-variant" style={{ fontSize: '14px' }}>
            monitoring
          </span>
          <span className="text-label-sm font-semibold text-on-primary-fixed-variant">
            1г · {formatPrice(pricePerGram)} сум
          </span>
        </div>
      ) : null}
    </header>
  );
}
