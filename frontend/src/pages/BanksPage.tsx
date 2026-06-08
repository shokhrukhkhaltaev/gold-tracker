import { useState } from 'react';
import { useLocation } from 'react-router-dom';
import { useBanks, useCities, usePrices, usePriceHistory, useFavorites } from '../hooks/useGoldData.js';
import { BankWithAvailability, PriceHistoryEntry } from '../types/index.js';
import Header from '../components/Header.js';
import PriceHero from '../components/PriceHero.js';
import WeightChips from '../components/WeightChips.js';
import CitySelector from '../components/CitySelector.js';
import BankCard from '../components/BankCard.js';
import BranchModal from '../components/BranchModal.js';
import { BankCardSkeleton } from '../components/LoadingSkeleton.js';
import EmptyState from '../components/EmptyState.js';

const CITY_KEY = 'goldi_selected_city';

function calcChange(history: PriceHistoryEntry[]): number | null {
  if (history.length < 2) return null;
  const first = history[0].priceUzs;
  const last = history[history.length - 1].priceUzs;
  return ((last - first) / first) * 100;
}

export default function BanksPage() {
  const location = useLocation();
  const params = new URLSearchParams(location.search);
  const initialWeight = parseInt(params.get('weight') ?? '5', 10);

  const [selectedWeight, setSelectedWeight] = useState(initialWeight);
  const [selectedCity, setSelectedCity] = useState(
    () => localStorage.getItem(CITY_KEY) ?? 'Ташкент',
  );
  const [selectedBank, setSelectedBank] = useState<BankWithAvailability | null>(null);
  const { favorites, toggle: toggleFavorite } = useFavorites();

  function handleCityChange(city: string) {
    localStorage.setItem(CITY_KEY, city);
    setSelectedCity(city);
  }

  const { prices, loading: pricesLoading } = usePrices();
  const { cities } = useCities();
  const { history } = usePriceHistory(selectedWeight);
  const { banks, loading: banksLoading, isMockData, updatedAt } = useBanks(
    selectedCity || undefined,
    selectedWeight,
  );

  const changePercent = calcChange(history);

  const formattedUpdate = updatedAt
    ? new Intl.RelativeTimeFormat('ru', { numeric: 'auto' }).format(
        -Math.round((Date.now() - new Date(updatedAt).getTime()) / 60000),
        'minute',
      )
    : null;

  return (
    <>
      <Header prices={prices} loading={pricesLoading} />

      <main className="pt-[72px] pb-[100px] px-container-margin max-w-2xl mx-auto animate-fade-in">
        <section className="mt-stack-lg mb-stack-lg">
          <PriceHero
            prices={prices}
            selectedWeight={selectedWeight}
            loading={pricesLoading}
            changePercent={changePercent}
          />
        </section>

        <section className="mb-stack-lg space-y-stack-md">
          <CitySelector cities={cities} selected={selectedCity} onChange={handleCityChange} />
          <WeightChips selected={selectedWeight} onChange={setSelectedWeight} />
        </section>

        <section className="space-y-stack-md">
          <h3 className="text-headline-md text-on-background mb-4">Наличие в банках</h3>

          {banksLoading ? (
            <>
              <BankCardSkeleton />
              <BankCardSkeleton />
              <BankCardSkeleton />
            </>
          ) : banks.length === 0 ? (
            <EmptyState
              message={`Нет данных для ${selectedWeight}г ${selectedCity ? `в ${selectedCity}` : ''}`}
              icon="account_balance"
            />
          ) : (() => {
            const sorted = [...banks].sort((a, b) => b.totalQuantity - a.totalQuantity);
            const favBanks = sorted.filter(b => favorites.has(b.bankName));
            const restBanks = sorted.filter(b => !favorites.has(b.bankName));
            return (
              <>
                {favBanks.length > 0 && (
                  <>
                    <div className="flex items-center gap-1.5 px-1">
                      <span
                        className="material-symbols-outlined text-[16px] text-amber-400"
                        style={{ fontVariationSettings: "'FILL' 1" }}
                      >
                        star
                      </span>
                      <span className="text-[11px] font-bold text-zinc-400 uppercase tracking-wider">
                        Избранное
                      </span>
                    </div>
                    {favBanks.map((bank, i) => (
                      <BankCard
                        key={bank.bankName}
                        bank={bank}
                        onViewBranches={setSelectedBank}
                        index={i}
                        isFavorite
                        onToggleFavorite={toggleFavorite}
                      />
                    ))}
                    {restBanks.length > 0 && (
                      <div className="flex items-center gap-2 px-1 pt-1">
                        <div className="flex-1 h-px bg-zinc-100" />
                        <span className="text-[11px] font-bold text-zinc-300 uppercase tracking-wider">
                          Все банки
                        </span>
                        <div className="flex-1 h-px bg-zinc-100" />
                      </div>
                    )}
                  </>
                )}
                {restBanks.map((bank, i) => (
                  <BankCard
                    key={bank.bankName}
                    bank={bank}
                    onViewBranches={setSelectedBank}
                    index={favBanks.length + i}
                    isFavorite={false}
                    onToggleFavorite={toggleFavorite}
                  />
                ))}
              </>
            );
          })()}
        </section>

        {!banksLoading && (
          <div className="mt-stack-lg p-gutter bg-surface-container-low rounded-xl border-l-4 border-primary">
            <div className="flex gap-3">
              <span className="material-symbols-outlined text-primary shrink-0">info</span>
              <p className="text-label-bold text-on-surface-variant">
                {isMockData
                  ? 'Используются демо-данные. Реальные данные с сайта ЦБУ недоступны.'
                  : formattedUpdate
                  ? `Цены обновлены ${formattedUpdate}. Наличие товара в филиалах может меняться в режиме реального времени.`
                  : 'Данные актуальны. Наличие товара в филиалах может меняться в режиме реального времени.'}
              </p>
            </div>
          </div>
        )}
      </main>

      <BranchModal bank={selectedBank} onClose={() => setSelectedBank(null)} />
    </>
  );
}
