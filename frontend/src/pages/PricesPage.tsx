import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { usePrices, usePriceHistory } from '../hooks/useGoldData.js';
import { GoldPrice } from '../types/index.js';
import Header from '../components/Header.js';
import { PriceCardSkeleton } from '../components/LoadingSkeleton.js';
import PriceChart from '../components/PriceChart.js';
import WeightChips from '../components/WeightChips.js';

function formatPrice(n: number): string {
  return n.toLocaleString('ru-RU');
}

const WEIGHT_LABELS: Record<number, string> = {
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
  index: number;
}

function GoldCard({ price, onCheckAvailability, colSpan, index }: GoldCardProps) {
  return (
    <div
      className={`bg-white rounded-2xl shadow-card overflow-hidden flex flex-col hover:shadow-card-hover transition-shadow duration-300 animate-card-in ${colSpan ? 'md:col-span-2' : ''}`}
      style={{ animationDelay: `${index * 70}ms` }}
    >
      <div className="p-stack-md flex-grow">
        <div className="flex justify-between items-start mb-4">
          <div className="bg-gradient-to-br from-yellow-400 to-amber-500 text-white px-3 py-1.5 rounded-xl font-black text-[22px] leading-none shadow-sm">
            {WEIGHT_LABELS[price.weightGrams] ?? `${price.weightGrams}г`}
          </div>
          <div className="text-right">
            <p className={`font-black text-on-surface ${colSpan ? 'text-headline-lg' : 'text-headline-md'}`}>
              {formatPrice(price.priceUzs)}
              <span className="text-label-sm font-semibold text-secondary ml-1">сум</span>
            </p>
          </div>
        </div>
      </div>

      <div className="px-stack-md pb-stack-md">
        <button
          onClick={() => onCheckAvailability(price.weightGrams)}
          className={`w-full bg-gradient-to-r from-yellow-400 to-amber-500 text-white rounded-xl font-bold text-[14px] active:scale-[0.97] transition-transform shadow-sm hover:shadow-md ${colSpan ? 'py-4' : 'py-3'}`}
        >
          Проверить наличие
        </button>
      </div>
    </div>
  );
}

export default function PricesPage() {
  const navigate = useNavigate();
  const [selectedWeight, setSelectedWeight] = useState(5);
  const { prices, loading: pricesLoading } = usePrices();
  const { history, loading: historyLoading } = usePriceHistory(selectedWeight);

  // Fixed 7-day window starting from the first data date; future days are null until cron fills them
  const anchorDate = history.length > 0 ? history[0].date : new Date().toISOString().split('T')[0];
  const chartData = Array.from({ length: 7 }, (_, i) => {
    const d = new Date(anchorDate + 'T00:00:00Z');
    d.setUTCDate(d.getUTCDate() + i);
    const date = d.toISOString().split('T')[0];
    const entry = history.find(h => h.date === date);
    return { date, priceUzs: entry ? entry.priceUzs : null };
  });

  const activePrices = chartData.filter(d => d.priceUzs !== null).map(d => d.priceUzs as number);
  const changePercent =
    activePrices.length > 1
      ? ((activePrices[activePrices.length - 1] - activePrices[0]) / activePrices[0]) * 100
      : null;

  function handleCheckAvailability(weight: number) {
    navigate(`/?weight=${weight}`);
  }

  const colSpanWeight = prices.find(p => p.weightGrams === 100)?.weightGrams;

  return (
    <>
      <Header prices={prices} loading={pricesLoading} />

      <main className="pt-[72px] pb-[100px] px-container-margin max-w-2xl mx-auto space-y-stack-lg animate-fade-in">

        <section className="mt-stack-lg space-y-3">
          <div className="flex items-center justify-between px-1">
            <div>
              <h3 className="text-headline-md">Динамика цен</h3>
              <p className="text-label-sm text-secondary">Цена за 1 грамм золота</p>
            </div>
            {changePercent !== null && (
              <span
                className={`text-sm font-bold px-3 py-1.5 rounded-full ${
                  changePercent >= 0
                    ? 'bg-emerald-50 text-emerald-600'
                    : 'bg-red-50 text-red-600'
                }`}
              >
                {changePercent >= 0 ? '+' : ''}
                {changePercent.toFixed(1)}%
              </span>
            )}
          </div>

          <WeightChips selected={selectedWeight} onChange={setSelectedWeight} />

          <PriceChart history={chartData} loading={historyLoading} hideTitle perGramDivisor={selectedWeight} />
        </section>

        <section className="space-y-stack-md">
          <h3 className="text-headline-md px-1">Слитки</h3>

          {pricesLoading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-gutter">
              <PriceCardSkeleton />
              <PriceCardSkeleton />
              <PriceCardSkeleton />
              <PriceCardSkeleton />
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-gutter">
              {prices.map((price, i) => (
                <GoldCard
                  key={price.weightGrams}
                  price={price}
                  onCheckAvailability={handleCheckAvailability}
                  colSpan={price.weightGrams === colSpanWeight}
                  index={i}
                />
              ))}
            </div>
          )}
        </section>
      </main>
    </>
  );
}
