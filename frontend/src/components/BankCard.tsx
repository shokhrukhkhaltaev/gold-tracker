import { BankWithAvailability } from '../types/index.js';

interface BankCardProps {
  bank: BankWithAvailability;
  onViewBranches: (bank: BankWithAvailability) => void;
}

const BANK_INITIALS: Record<string, string> = {
  NBU: 'НБ',
  SQB: 'SQB',
  HKB: 'HKB',
  KAP: 'КАП',
  AGB: 'AGB',
  IPB: 'ИПБ',
  ASK: 'АСК',
  ALQ: 'АЛК',
};

const BANK_COLORS: Record<string, string> = {
  NBU: 'from-blue-600 to-blue-800',
  SQB: 'from-indigo-500 to-indigo-700',
  HKB: 'from-emerald-500 to-emerald-700',
  KAP: 'from-violet-500 to-violet-700',
  AGB: 'from-green-600 to-green-800',
  IPB: 'from-orange-500 to-orange-700',
  ASK: 'from-red-500 to-red-700',
  ALQ: 'from-teal-500 to-teal-700',
};

export default function BankCard({ bank, onViewBranches }: BankCardProps) {
  const initials = BANK_INITIALS[bank.bankShortName] ?? bank.bankShortName.slice(0, 2);
  const gradient = BANK_COLORS[bank.bankShortName] ?? 'from-zinc-500 to-zinc-700';
  const availableBranches = bank.branches.filter(b => b.available).length;

  return (
    <div className="bg-white rounded-xl shadow-card p-gutter border border-transparent hover:border-primary-container transition-all hover:shadow-card-hover">
      <div className="flex justify-between items-start mb-stack-md">
        <div className="flex items-center gap-4">
          <div className={`w-12 h-12 rounded-lg bg-gradient-to-br ${gradient} flex items-center justify-center shadow-sm`}>
            <span className="text-white font-black text-sm tracking-tight">{initials}</span>
          </div>
          <div>
            <h4 className="text-headline-md text-[18px] font-bold text-on-surface leading-tight">{bank.bankShortName}</h4>
            <p className="text-label-sm text-secondary mt-0.5 max-w-[160px] truncate">{bank.bankName}</p>
          </div>
        </div>
        <div className="text-right">
          {bank.hasAvailability ? (
            <>
              <span className="block text-headline-md text-primary font-black">{bank.totalQuantity} шт.</span>
              <span className="text-label-sm text-emerald-600 font-semibold">В наличии</span>
            </>
          ) : (
            <>
              <span className="block text-headline-md text-secondary">—</span>
              <span className="text-label-sm text-on-secondary-container">Нет в наличии</span>
            </>
          )}
        </div>
      </div>

      {availableBranches > 0 && (
        <p className="text-label-sm text-on-surface-variant mb-stack-sm">
          {availableBranches} из {bank.branches.length} {pluralBranch(bank.branches.length)} в наличии
        </p>
      )}

      <button
        onClick={() => onViewBranches(bank)}
        className={`w-full py-3 rounded-lg font-label-bold text-label-bold active:scale-95 duration-150 shadow-sm flex items-center justify-center gap-2 transition-colors ${
          bank.hasAvailability
            ? 'bg-primary-container text-on-primary-fixed-variant hover:bg-primary-fixed-dim'
            : 'bg-surface-container text-secondary hover:bg-surface-container-high'
        }`}
      >
        Смотреть филиалы
        <span className="material-symbols-outlined text-[18px]">chevron_right</span>
      </button>
    </div>
  );
}

function pluralBranch(n: number): string {
  if (n % 100 >= 11 && n % 100 <= 19) return 'филиалов';
  if (n % 10 === 1) return 'филиала';
  if (n % 10 >= 2 && n % 10 <= 4) return 'филиалов';
  return 'филиалов';
}
