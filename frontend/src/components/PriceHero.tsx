import { GoldPrice } from '../types/index.js';

interface PriceHeroProps {
  prices: GoldPrice[];
  selectedWeight: number;
  loading: boolean;
}

function formatPrice(n: number): string {
  return n.toLocaleString('ru-RU');
}

export default function PriceHero({ prices, selectedWeight, loading }: PriceHeroProps) {
  const selected = prices.find(p => p.weightGrams === selectedWeight) ?? prices[0];

  if (loading) {
    return (
      <div className="bg-white rounded-xl shadow-card p-gutter flex justify-between items-end">
        <div className="space-y-2">
          <div className="w-32 h-3 bg-surface-container-high rounded animate-pulse" />
          <div className="w-48 h-8 bg-surface-container-high rounded animate-pulse" />
        </div>
        <div className="w-16 h-7 bg-surface-container-high rounded-full animate-pulse" />
      </div>
    );
  }

  if (!selected) return null;

  return (
    <div className="bg-white rounded-xl shadow-card p-gutter flex justify-between items-end">
      <div>
        <span className="text-label-sm text-secondary uppercase tracking-wider">
          Цена за {selected.weightGrams}г золота
        </span>
        <h2 className="text-headline-lg text-black mt-1">
          {formatPrice(selected.priceUzs)} <span className="text-headline-md font-semibold text-secondary">сум</span>
        </h2>
      </div>
      <div className="flex items-center text-primary font-bold bg-primary-container/20 px-3 py-1 rounded-full mb-1">
        <span className="material-symbols-outlined text-[18px] mr-1">trending_up</span>
        <span className="text-label-bold">+1.2%</span>
      </div>
    </div>
  );
}
