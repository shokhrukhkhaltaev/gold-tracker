import { useEffect } from 'react';
import { BankWithAvailability, BranchAvailability } from '../types/index.js';
import { resolveBankInfo } from './BankCard.js';

interface BranchModalProps {
  bank: BankWithAvailability | null;
  onClose: () => void;
}

const FALLBACK_PHONE = '+998 90 123 45 67';

export default function BranchModal({ bank, onClose }: BranchModalProps) {
  useEffect(() => {
    if (!bank) return;
    document.body.style.overflow = 'hidden';
    return () => { document.body.style.overflow = ''; };
  }, [bank]);

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') onClose();
    }
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [onClose]);

  if (!bank) return null;

  const available = bank.branches.filter(b => b.available);
  const info = resolveBankInfo(bank);
  const displayName = info?.name ?? bank.bankName;

  return (
    <div className="fixed inset-0 z-[100] flex items-end sm:items-center justify-center">
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm animate-backdrop-in" onClick={onClose} />

      <div className="relative w-full max-w-lg bg-white rounded-t-[28px] sm:rounded-2xl shadow-2xl max-h-[80vh] flex flex-col animate-slide-up">
        {/* drag handle */}
        <div className="flex justify-center pt-3 pb-1">
          <div className="w-10 h-1 bg-outline-variant rounded-full" />
        </div>

        {/* header */}
        <div className="px-gutter pb-4 pt-2 border-b border-surface-container">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              {/* круглая иконка */}
              {info?.logo ? (
                <div className="w-12 h-12 rounded-full bg-white border border-zinc-100 shadow-sm flex items-center justify-center overflow-hidden p-1 shrink-0">
                  <img src={info.logo} alt={displayName} className="w-full h-full object-contain" />
                </div>
              ) : (
                <div className="w-12 h-12 rounded-full bg-gradient-to-br from-zinc-500 to-zinc-700 flex items-center justify-center shrink-0">
                  <span className="text-white font-black text-sm">{bank.bankShortName.slice(0, 2)}</span>
                </div>
              )}
              <div>
                <h2 className="text-[16px] font-bold text-on-surface leading-snug">{displayName}</h2>
                {available.length > 0 && (
                  <div className="flex items-center gap-1 mt-0.5">
                    <span className="material-symbols-outlined text-[13px] text-emerald-600" style={{ fontVariationSettings: "'FILL' 1" }}>
                      location_on
                    </span>
                    <span className="text-[12px] text-emerald-600 font-semibold">
                      {available.length} {pluralBranch(available.length)} в наличии
                    </span>
                  </div>
                )}
              </div>
            </div>
            <button
              onClick={onClose}
              className="w-9 h-9 rounded-full hover:bg-surface-container flex items-center justify-center transition-colors shrink-0"
            >
              <span className="material-symbols-outlined text-secondary">close</span>
            </button>
          </div>
        </div>

        <div className="overflow-y-auto flex-1 px-gutter py-stack-md space-y-3">
          {available.length === 0 ? (
            <p className="text-body-md text-secondary text-center py-8">Нет филиалов с данным слитком</p>
          ) : (
            available.map(branch => (
              <BranchItem key={branch.branchId} branch={branch} />
            ))
          )}
        </div>

        <div className="h-safe-area-bottom" />
      </div>
    </div>
  );
}

function BranchItem({ branch }: { branch: BranchAvailability }) {
  const phone = branch.phone || FALLBACK_PHONE;

  return (
    <div className="rounded-xl border border-emerald-100 bg-emerald-50/50 p-4">
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-start gap-3 flex-1 min-w-0">
          <span className="material-symbols-outlined text-[20px] mt-0.5 shrink-0 text-emerald-600" style={{ fontVariationSettings: "'FILL' 1" }}>
            location_on
          </span>
          <div className="min-w-0">
            <p className="text-label-bold text-on-surface leading-snug">{branch.address || 'Адрес не указан'}</p>
            <p className="text-label-sm text-secondary mt-0.5">{branch.city}</p>
            <div className="flex items-center gap-1.5 mt-1.5">
              <span className="bg-emerald-100 text-emerald-700 text-[14px] font-black px-2.5 py-0.5 rounded-full">
                {branch.quantity} шт.
              </span>
              <span className="text-[11px] text-emerald-600 font-medium">в наличии</span>
            </div>
          </div>
        </div>

        <a
          href={`tel:${phone}`}
          className="shrink-0 w-10 h-10 rounded-full bg-gradient-to-br from-yellow-400 to-amber-500 flex items-center justify-center shadow-sm hover:shadow-md transition-shadow"
          title={`Позвонить: ${phone}`}
        >
          <span className="material-symbols-outlined text-white text-[20px]">call</span>
        </a>
      </div>
    </div>
  );
}

function pluralBranch(n: number): string {
  if (n % 100 >= 11 && n % 100 <= 19) return 'филиалов';
  if (n % 10 === 1) return 'филиал';
  if (n % 10 >= 2 && n % 10 <= 4) return 'филиала';
  return 'филиалов';
}
