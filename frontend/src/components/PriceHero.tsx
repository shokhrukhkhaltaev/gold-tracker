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
      <div className="bg-gradient-to-br from-yellow-400 to-amber-500 rounded-2xl p-5 flex justify-between items-end shadow-md">
        <div className="space-y-2">
          <div className="w-32 h-3 bg-white/30 rounded animate-pulse" />
          <div className="w-48 h-8 bg-white/30 rounded animate-pulse" />
        </div>
        <div className="w-16 h-7 bg-white/30 rounded-full animate-pulse" />
      </div>
    );
  }

  if (!selected) return null;

  const isPositive = changePercent == null || changePercent >= 0;
  const changeLabel = changePercent == null
    ? null
    : `${isPositive ? '+' : ''}${changePercent.toFixed(2)}%`;

  return (
    <div className="bg-gradient-to-br from-yellow-400 to-amber-500 rounded-2xl p-5 flex justify-between items-end shadow-md">
      <div>
        <span className="text-[12px] text-white/80 uppercase tracking-widest font-semibold">
          Цена за {selected.weightGrams}г золота
        </span>
        <h2 className="text-[28px] font-black text-white mt-1 leading-tight">
          {formatPrice(selected.priceUzs)}
          <span className="text-[16px] font-semibold text-white/80 ml-1.5">сум</span>
        </h2>
      </div>
      {changeLabel && (
        <div className="flex items-center gap-1 bg-white/20 backdrop-blur-sm px-3 py-1.5 rounded-full mb-0.5">
          <span className="material-symbols-outlined text-white text-[16px]">
            {isPositive ? 'trending_up' : 'trending_down'}
          </span>
          <span className="text-white text-[13px] font-bold">{changeLabel}</span>
        </div>
      )}
    </div>
  );
}
