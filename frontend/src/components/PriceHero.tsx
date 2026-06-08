import { GoldPrice } from '../types/index.js';

interface PriceHeroProps {
  prices: GoldPrice[];
  selectedWeight: number;
  loading: boolean;
  changePercent?: number | null;
}

function formatPrice(n: number): string {
  return n.toLocaleString('ru-RU');
}

export default function PriceHero({ prices, selectedWeight, loading, changePercent }: PriceHeroProps) {
  const selected = prices.find(p => p.weightGrams === selectedWeight) ?? prices[0];

  if (loading) {
    return (
      <div className="bg-white rounded-2xl p-5 border border-zinc-100 shadow-card">
        <div className="space-y-2">
          <div className="w-32 h-3 bg-zinc-100 rounded animate-pulse" />
          <div className="w-48 h-8 bg-zinc-100 rounded animate-pulse" />
        </div>
      </div>
    );
  }

  if (!selected) return null;

  const isPositive = changePercent == null || changePercent >= 0;
  const changeLabel = changePercent == null
    ? null
    : `${isPositive ? '+' : ''}${changePercent.toFixed(2)}%`;

  return (
    <div className="bg-white rounded-2xl p-5 border border-zinc-100 shadow-card">
      <div className="flex justify-between items-start">
        <div>
          <span className="text-[11px] text-zinc-400 uppercase tracking-widest font-semibold">
            Цена за {selected.weightGrams}г золота
          </span>
          <h2 className="text-[30px] font-black text-zinc-900 mt-1 leading-tight">
            {formatPrice(selected.priceUzs)}
            <span className="text-[15px] font-semibold text-zinc-400 ml-1.5">сум</span>
          </h2>
        </div>
        {changeLabel && (
          <div className={`px-3 py-1.5 rounded-full text-[13px] font-bold mt-1 ${
            isPositive ? 'bg-emerald-50 text-emerald-600' : 'bg-red-50 text-red-500'
          }`}>
            {changeLabel}
          </div>
        )}
      </div>
      <div className="mt-3 pt-2.5 border-t border-zinc-100">
        <span className="text-zinc-400 text-[11px]">Курс Центрального Банка Узбекистана · </span>
        <a
          href="https://cbu.uz/ru/banknotes-coins/gold-bars/prices/"
          target="_blank"
          rel="noopener noreferrer"
          className="text-zinc-400 text-[11px] underline underline-offset-2 hover:text-zinc-600"
        >
          cbu.uz/gold-bars
        </a>
      </div>
    </div>
  );
}
