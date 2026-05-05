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
        <h1 className="font-bold text-lg text-yellow-600">
          {loading ? (
            <span className="block w-36 h-5 bg-surface-container-high rounded animate-pulse" />
          ) : pricePerGram > 0 ? (
            `1г: ${formatPrice(pricePerGram)} сум`
          ) : (
            'Золото Узбекистана'
          )}
        </h1>
      </div>
    </header>
  );
}
