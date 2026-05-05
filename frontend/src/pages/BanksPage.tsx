import { useState } from 'react';
import { useBanks, useCities } from '../hooks/useGoldData.js';
import { usePrices } from '../hooks/useGoldData.js';
import { BankWithAvailability } from '../types/index.js';
import Header from '../components/Header.js';
import PriceHero from '../components/PriceHero.js';
import WeightChips from '../components/WeightChips.js';
import CitySelector from '../components/CitySelector.js';
import BankCard from '../components/BankCard.js';
import BranchModal from '../components/BranchModal.js';
import { BankCardSkeleton } from '../components/LoadingSkeleton.js';
import EmptyState from '../components/EmptyState.js';

export default function BanksPage() {
  const [selectedWeight, setSelectedWeight] = useState(5);
  const [selectedCity, setSelectedCity] = useState('Ташкент');
  const [selectedBank, setSelectedBank] = useState<BankWithAvailability | null>(null);

  const { prices, loading: pricesLoading } = usePrices();
  const { cities } = useCities();
  const { banks, loading: banksLoading, isMockData, updatedAt } = useBanks(
    selectedCity || undefined,
    selectedWeight,
  );

  const formattedUpdate = updatedAt
    ? new Intl.RelativeTimeFormat('ru', { numeric: 'auto' }).format(
        -Math.round((Date.now() - new Date(updatedAt).getTime()) / 60000),
        'minute',
      )
    : null;

  return (
    <>
      <Header prices={prices} loading={pricesLoading} />

      <main className="pt-[72px] pb-[100px] px-container-margin max-w-2xl mx-auto">
        {/* Price Hero */}
        <section className="mt-stack-lg mb-stack-lg">
          <PriceHero prices={prices} selectedWeight={selectedWeight} loading={pricesLoading} />
        </section>

        {/* Filters */}
        <section className="mb-stack-lg space-y-stack-md">
          <div className="flex items-center justify-between">
            <CitySelector cities={cities} selected={selectedCity} onChange={setSelectedCity} />
          </div>
          <WeightChips selected={selectedWeight} onChange={setSelectedWeight} />
        </section>

        {/* Banks list */}
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
          ) : (
            banks.map(bank => (
              <BankCard
                key={bank.bankName}
                bank={bank}
                onViewBranches={setSelectedBank}
              />
            ))
          )}
        </section>

        {/* Info card */}
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
