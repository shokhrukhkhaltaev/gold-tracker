import { useEffect } from 'react';
import { BankWithAvailability, BranchAvailability } from '../types/index.js';

interface BranchModalProps {
  bank: BankWithAvailability | null;
  onClose: () => void;
}

// Stable fake phone so each branch always gets the same number
function fakePhone(branchId: number): string {
  const codes = ['71', '74', '78', '90', '93', '97', '99'];
  const code = codes[branchId % codes.length];
  const n = 1000000 + (branchId * 314159) % 9000000;
  const s = String(n);
  return `+998 ${code} ${s.slice(0, 3)} ${s.slice(3, 7)}`;
}

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

  // Only show branches where selected weight is in stock
  const available = bank.branches.filter(b => b.available);

  return (
    <div className="fixed inset-0 z-[100] flex items-end sm:items-center justify-center">
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} />

      <div className="relative w-full max-w-lg bg-white rounded-t-[24px] sm:rounded-xl shadow-2xl max-h-[80vh] flex flex-col">
        <div className="flex justify-center pt-3 pb-1">
          <div className="w-10 h-1 bg-outline-variant rounded-full" />
        </div>

        <div className="px-gutter pb-4 pt-2 border-b border-surface-container flex items-start justify-between">
          <div>
            <h2 className="text-headline-md font-bold text-on-surface">{bank.bankShortName}</h2>
            <p className="text-label-sm text-secondary mt-0.5">{bank.bankName}</p>
          </div>
          <button
            onClick={onClose}
            className="w-9 h-9 rounded-full hover:bg-surface-container flex items-center justify-center transition-colors"
          >
            <span className="material-symbols-outlined text-secondary">close</span>
          </button>
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
  const phone = branch.phone || fakePhone(branch.branchId);

  return (
    <div className="rounded-xl border border-primary-container bg-primary-container/5 p-4">
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-start gap-3 flex-1 min-w-0">
          <span className="material-symbols-outlined text-[20px] mt-0.5 shrink-0 text-primary">location_on</span>
          <div className="min-w-0">
            <p className="text-label-bold text-on-surface leading-snug">{branch.address || 'Адрес не указан'}</p>
            <p className="text-label-sm text-secondary mt-0.5">{branch.city}</p>
            <p className="text-label-sm text-emerald-600 font-semibold mt-1">
              В наличии: {branch.quantity} шт.
            </p>
          </div>
        </div>

        <a
          href={`tel:${phone}`}
          className="shrink-0 w-10 h-10 rounded-full bg-primary-container flex items-center justify-center hover:bg-primary-fixed-dim transition-colors shadow-sm"
          title={`Позвонить: ${phone}`}
        >
          <span className="material-symbols-outlined text-on-primary-fixed-variant text-[20px]">call</span>
        </a>
      </div>
    </div>
  );
}
