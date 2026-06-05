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
    <header className="bg-white border-b border-zinc-100 shadow-sm fixed top-0 w-full z-50 flex justify-between items-center px-5 py-3">
      <div className="flex items-center gap-2.5">
        <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-yellow-400 to-amber-500 flex items-center justify-center shadow-sm">
          <span className="text-white font-black text-sm">G</span>
        </div>
        <h1 className="font-black text-[20px] tracking-tight text-zinc-900">Goldi</h1>
      </div>

      <div>
        {loading ? (
          <span className="block w-36 h-7 bg-surface-container-high rounded-full animate-pulse" />
        ) : pricePerGram > 0 ? (
          <div className="flex items-center gap-1.5 bg-gradient-to-r from-yellow-400 to-amber-500 px-3 py-1.5 rounded-full shadow-sm">
            <span
              className="material-symbols-outlined text-white text-[14px]"
              style={{ fontVariationSettings: "'FILL' 1" }}
            >
              finance
            </span>
            <span className="text-white text-[13px] font-black tracking-wide">
              1г · {formatPrice(pricePerGram)} сум
            </span>
          </div>
        ) : null}
      </div>
    </header>
  );
}
