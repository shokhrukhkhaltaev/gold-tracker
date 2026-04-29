import { useState } from 'react';
import { usePrices, usePriceHistory } from '../hooks/useGoldData.js';
import { GoldPrice } from '../types/index.js';
import Header from '../components/Header.js';
import PriceChart from '../components/PriceChart.js';
import { PriceCardSkeleton } from '../components/LoadingSkeleton.js';

function formatPrice(n: number): string {
  return n.toLocaleString('ru-RU');
}

const WEIGHT_LABELS: Record<number, string> = {
  1: '1г',
  2: '2г',
  5: '5г',
  10: '10г',
  20: '20г',
  50: '50г',
  100: '100г',
};

interface GoldCardProps {
  price: GoldPrice;
  onCheckAvailability: (w: number) => void;
  colSpan?: boolean;
}

function GoldCard({ price, onCheckAvailability, colSpan }: GoldCardProps) {
  return (
    <div className={`bg-white rounded-xl shadow-card overflow-hidden flex flex-col hover:shadow-card-hover transition-all duration-300 ${colSpan ? 'md:col-span-2' : ''}`}>
      <div className="p-stack-md flex-grow">
        <div className="flex justify-between items-start mb-4">
          <div className="bg-primary-fixed text-on-primary-fixed px-3 py-1 rounded-lg text-headline-md font-black">
            {WEIGHT_LABELS[price.weightGrams] ?? `${price.weightGrams}г`}
          </div>
          <div className="text-right">
            <p className={colSpan ? 'text-headline-lg font-bold' : 'text-headline-md font-bold'}>
              {formatPrice(price.priceUzs)}
            </p>
            <span className="text-label-sm text-emerald-600 flex items-center justify-end gap-0.5">
              <span className="material-symbols-outlined text-[14px]">trending_up</span>
              +1.2%
            </span>
          </div>
        </div>
      </div>
      <div className="px-stack-md pb-stack-md">
        <button
          onClick={() => onCheckAvailability(price.weightGrams)}
          className={`w-full bg-primary-container text-on-primary-fixed py-3 rounded-lg font-label-bold text-label-bold active:scale-[0.98] transition-transform shadow-sm hover:bg-primary-fixed-dim ${colSpan ? 'py-4' : ''}`}
        >
          Проверить наличие
        </button>
      </div>
    </div>
  );
}

export default function PricesPage() {
  const [chartWeight, setChartWeight] = useState(1);
  const { prices, loading: pricesLoading } = usePrices();
  const { history, loading: historyLoading } = usePriceHistory(chartWeight);

  function handleCheckAvailability(weight: number) {
    window.location.href = `/banks?weight=${weight}`;
  }

  const colSpanWeight = prices.find(p => [100].includes(p.weightGrams))?.weightGrams;

  return (
    <>
      <Header prices={prices} loading={pricesLoading} />

      <main className="pt-[72px] pb-[100px] px-container-margin max-w-2xl mx-auto space-y-stack-lg">
        {/* Chart section */}
        <section className="mt-stack-lg space-y-stack-sm">
          {/* Weight selector for chart */}
          {!pricesLoading && prices.length > 0 && (
            <div className="flex gap-2 mb-4 overflow-x-auto no-scrollbar pb-1">
              {prices.map(p => (
                <button
                  key={p.weightGrams}
                  onClick={() => setChartWeight(p.weightGrams)}
                  className={`px-4 py-1.5 rounded-full text-label-sm font-semibold whitespace-nowrap transition-colors ${
                    chartWeight === p.weightGrams
                      ? 'bg-primary-container text-on-primary-fixed-variant border border-primary'
                      : 'bg-surface-container text-secondary hover:bg-surface-container-high'
                  }`}
                >
                  {WEIGHT_LABELS[p.weightGrams] ?? `${p.weightGrams}г`}
                </button>
              ))}
            </div>
          )}

          <PriceChart history={history} loading={historyLoading} />
        </section>

        {/* Gold bars grid */}
        <section className="space-y-stack-md">
          <h3 className="text-headline-md px-2">Слитки</h3>

          {pricesLoading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-gutter">
              <PriceCardSkeleton />
              <PriceCardSkeleton />
              <PriceCardSkeleton />
              <PriceCardSkeleton />
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-gutter">
              {prices.map(price => (
                <GoldCard
                  key={price.weightGrams}
                  price={price}
                  onCheckAvailability={handleCheckAvailability}
                  colSpan={price.weightGrams === colSpanWeight}
                />
              ))}
            </div>
          )}
        </section>
      </main>
    </>
  );
}
