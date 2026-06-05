import { BankWithAvailability } from '../types/index.js';

interface BankCardProps {
  bank: BankWithAvailability;
  onViewBranches: (bank: BankWithAvailability) => void;
  index: number;
}

interface BankInfo {
  logo: string;
  name: string;
}

// Маппинг по bankShortName (из скрапера)
const BY_SHORT: Record<string, BankInfo> = {
  SQB: { logo: '/logos/sqb.png',                 name: 'Sanoat Qurilish Bank' },
  AAB: { logo: '/logos/asia-alliance-bank.png',   name: 'Asia Alliance Bank' },
  BDB: { logo: '/logos/biznesni-bank.png',        name: 'Biznesni Rivojlantirish Banki' },
  NBU: { logo: '/logos/milliy-bank.png',          name: 'Milliy Bank' },
  HKB: { logo: '/logos/hamkor-bank.png',          name: 'Hamkor Bank' },
  KAP: { logo: '/logos/kapital-bank.png',         name: 'Kapital Bank' },
  AGB: { logo: '/logos/agrobank.png',             name: 'Agrobank' },
  IPB: { logo: '/logos/ipoteka-bank.png',         name: 'Ipoteka Bank' },
  ASK: { logo: '/logos/asaka-bank.png',           name: 'Asaka Bank' },
  ALQ: { logo: '/logos/aloqa-bank.png',           name: 'Aloqa Bank' },
  XB:  { logo: '/logos/xalq-bank.png',            name: 'Xalq Bank' },
  OFB: { logo: '/logos/orient-finance-bank.png',  name: 'Orient Finance Bank' },
  DVB: { logo: '/logos/davr-bank.png',            name: 'Davr Bank' },
  MKB: { logo: '/logos/mikrokredit-bank.png',     name: 'Mikrokredit Bank' },
  TRB: { logo: '/logos/turon-bank.png',           name: 'Turon Bank' },
  TRS: { logo: '/logos/trastbank.png',            name: 'Trastbank' },
  ANR: { logo: '/logos/anorbank.png',             name: 'Anorbank' },
  TNG: { logo: '/logos/tenge-bank.png',           name: 'Tenge Bank' },
};

// Дополнительный маппинг по подстроке bankName (для банков без shortName)
const BY_NAME: Array<{ match: string; info: BankInfo }> = [
  { match: 'kdb',           info: { logo: '/logos/kdb.png',            name: 'KDB Bank Uzbekistan' } },
  { match: 'smartbank',     info: { logo: '/logos/smartbank.png',      name: 'Smartbank' } },
  { match: 'smart bank',    info: { logo: '/logos/smartbank.png',      name: 'Smartbank' } },
  { match: 'yangi',         info: { logo: '/logos/yangi-bank.png',     name: 'Yangi Bank' } },
  { match: 'garant',        info: { logo: '/logos/garant-bank.png',    name: 'Garant bank' } },
  { match: 'infin',         info: { logo: '/logos/infin-bank.png',     name: 'Infin Bank' } },
  { match: 'ipak yuli',     info: { logo: '/logos/ipak-yuli-bank.png', name: 'Ipak Yuli Bank' } },
  { match: 'ipak',          info: { logo: '/logos/ipak-yuli-bank.png', name: 'Ipak Yuli Bank' } },
  { match: 'octobank',      info: { logo: '/logos/octobank.jpg',       name: 'Octobank' } },
  { match: 'окто',          info: { logo: '/logos/octobank.jpg',       name: 'Octobank' } },
  // Latin
  { match: 'asia alliance', info: { logo: '/logos/asia-alliance-bank.png',  name: 'Asia Alliance Bank' } },
  { match: 'orient',        info: { logo: '/logos/orient-finance-bank.png', name: 'Orient Finance Bank' } },
  { match: 'davr',          info: { logo: '/logos/davr-bank.png',           name: 'Davr Bank' } },
  { match: 'anorbank',      info: { logo: '/logos/anorbank.png',            name: 'Anorbank' } },
  { match: 'anor bank',    info: { logo: '/logos/anorbank.png',            name: 'Anorbank' } },
  { match: 'anor',         info: { logo: '/logos/anorbank.png',            name: 'Anorbank' } },
  { match: 'tenge',         info: { logo: '/logos/tenge-bank.png',          name: 'Tenge Bank' } },
  { match: 'trustbank',     info: { logo: '/logos/trastbank.png',           name: 'Trastbank' } },
  { match: 'turonbank',     info: { logo: '/logos/turon-bank.png',          name: 'Turon Bank' } },
  { match: 'mikrokreditbank', info: { logo: '/logos/mikrokredit-bank.png',  name: 'Mikrokredit Bank' } },
  { match: 'xalq',          info: { logo: '/logos/xalq-bank.png',           name: 'Xalq Bank' } },
  { match: 'kapitalbank',   info: { logo: '/logos/kapital-bank.png',        name: 'Kapital Bank' } },
  { match: 'agrobank',      info: { logo: '/logos/agrobank.png',            name: 'Agrobank' } },
  { match: 'ipoteka',       info: { logo: '/logos/ipoteka-bank.png',        name: 'Ipoteka Bank' } },
  { match: 'asaka',         info: { logo: '/logos/asaka-bank.png',          name: 'Asaka Bank' } },
  { match: 'aloqabank',     info: { logo: '/logos/aloqa-bank.png',          name: 'Aloqa Bank' } },
  { match: 'hamkor',        info: { logo: '/logos/hamkor-bank.png',         name: 'Hamkor Bank' } },
  { match: 'biznesni',      info: { logo: '/logos/biznesni-bank.png',       name: 'Biznesni Rivojlantirish Banki' } },
  // Cyrillic (реальные имена из БД с сайта ЦБУ)
  { match: 'ориент',        info: { logo: '/logos/orient-finance-bank.png', name: 'Orient Finance Bank' } },
  { match: 'анор',          info: { logo: '/logos/anorbank.png',            name: 'Anorbank' } },
  { match: 'ипак',          info: { logo: '/logos/ipak-yuli-bank.png',      name: 'Ipak Yuli Bank' } },
  { match: 'гарант',        info: { logo: '/logos/garant-bank.png',         name: 'Garant bank' } },
  { match: 'тенге',         info: { logo: '/logos/tenge-bank.png',          name: 'Tenge Bank' } },
  { match: 'трастбанк',     info: { logo: '/logos/trastbank.png',           name: 'Trastbank' } },
  { match: 'траст',         info: { logo: '/logos/trastbank.png',           name: 'Trastbank' } },
  { match: 'туронбанк',     info: { logo: '/logos/turon-bank.png',          name: 'Turon Bank' } },
  { match: 'турон',         info: { logo: '/logos/turon-bank.png',          name: 'Turon Bank' } },
  { match: 'микрокредит',   info: { logo: '/logos/mikrokredit-bank.png',    name: 'Mikrokredit Bank' } },
  { match: 'халк',          info: { logo: '/logos/xalq-bank.png',           name: 'Xalq Bank' } },
  { match: 'капиталбанк',   info: { logo: '/logos/kapital-bank.png',        name: 'Kapital Bank' } },
  { match: 'капитал',       info: { logo: '/logos/kapital-bank.png',        name: 'Kapital Bank' } },
  { match: 'агробанк',      info: { logo: '/logos/agrobank.png',            name: 'Agrobank' } },
  { match: 'агро',          info: { logo: '/logos/agrobank.png',            name: 'Agrobank' } },
  { match: 'ипотека',       info: { logo: '/logos/ipoteka-bank.png',        name: 'Ipoteka Bank' } },
  { match: 'асака',         info: { logo: '/logos/asaka-bank.png',          name: 'Asaka Bank' } },
  { match: 'асакабанк',     info: { logo: '/logos/asaka-bank.png',          name: 'Asaka Bank' } },
  { match: 'алока',         info: { logo: '/logos/aloqa-bank.png',          name: 'Aloqa Bank' } },
  { match: 'алоқа',         info: { logo: '/logos/aloqa-bank.png',          name: 'Aloqa Bank' } },
  { match: 'хамкор',        info: { logo: '/logos/hamkor-bank.png',         name: 'Hamkor Bank' } },
  { match: 'национальный',  info: { logo: '/logos/milliy-bank.png',         name: 'Milliy Bank' } },
  { match: 'миллий',        info: { logo: '/logos/milliy-bank.png',         name: 'Milliy Bank' } },
  { match: 'узпромстройбанк', info: { logo: '/logos/sqb.png',               name: 'Sanoat Qurilish Bank' } },
  { match: 'саноат',        info: { logo: '/logos/sqb.png',                 name: 'Sanoat Qurilish Bank' } },
  { match: 'развития бизнеса', info: { logo: '/logos/biznesni-bank.png',    name: 'Biznesni Rivojlantirish Banki' } },
  { match: 'ривожлантириш', info: { logo: '/logos/biznesni-bank.png',       name: 'Biznesni Rivojlantirish Banki' } },
  { match: 'давр',          info: { logo: '/logos/davr-bank.png',           name: 'Davr Bank' } },
  { match: 'инфин',         info: { logo: '/logos/infin-bank.png',          name: 'Infin Bank' } },
  { match: 'янги',          info: { logo: '/logos/yangi-bank.png',          name: 'Yangi Bank' } },
  { match: 'смарт',         info: { logo: '/logos/smartbank.png',           name: 'Smartbank' } },
  { match: 'окто',          info: { logo: '/logos/octobank.jpg',            name: 'Octobank' } },
];

export function resolveBankInfo(bank: BankWithAvailability): BankInfo | null {
  if (BY_SHORT[bank.bankShortName]) return BY_SHORT[bank.bankShortName];
  const lower = bank.bankName.toLowerCase();
  for (const { match, info } of BY_NAME) {
    if (lower.includes(match)) return info;
  }
  return null;
}

export default function BankCard({ bank, onViewBranches, index }: BankCardProps) {
  const info = resolveBankInfo(bank);
  const displayName = info?.name ?? bank.bankName;
  const availableBranches = bank.branches.filter(b => b.available).length;

  return (
    <div
      className="bg-white rounded-2xl shadow-card p-gutter border border-transparent hover:border-primary-container transition-all hover:shadow-card-hover animate-card-in"
      style={{ animationDelay: `${index * 70}ms` }}
    >
      <div className="flex justify-between items-start mb-3">
        <div className="flex items-center gap-3 flex-1 min-w-0">
          {info?.logo ? (
            <div className="w-14 h-14 rounded-xl bg-white border border-zinc-100 flex items-center justify-center shrink-0 overflow-hidden p-0.5">
              <img
                src={info.logo}
                alt={displayName}
                className="w-full h-full object-contain"
              />
            </div>
          ) : (
            <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-zinc-500 to-zinc-700 flex items-center justify-center shrink-0">
              <span className="text-white font-black text-sm">
                {bank.bankShortName.slice(0, 2)}
              </span>
            </div>
          )}
          <h4 className="text-[15px] font-bold text-on-surface leading-snug">{displayName}</h4>
        </div>

        <div className="shrink-0 ml-3 text-right">
          {bank.hasAvailability ? (
            <>
              <span className="block text-[22px] font-black text-primary leading-tight">{bank.totalQuantity} шт.</span>
              <span className="text-label-sm text-emerald-600 font-semibold">В наличии</span>
            </>
          ) : (
            <span className="inline-flex items-center bg-zinc-100 text-zinc-500 text-[11px] font-bold px-2.5 py-1 rounded-full mt-1">
              Нет в наличии
            </span>
          )}
        </div>
      </div>

      {availableBranches > 0 && (
        <div className="flex items-center gap-1.5 mb-3 bg-emerald-50 rounded-lg px-3 py-2">
          <span className="material-symbols-outlined text-[16px] text-emerald-600" style={{ fontVariationSettings: "'FILL' 1" }}>
            location_on
          </span>
          <span className="text-[13px] text-emerald-800">
            <span className="font-black text-emerald-700">{availableBranches}</span>
            {' '}из {bank.branches.length} {pluralBranch(bank.branches.length)} в наличии
          </span>
        </div>
      )}

      <button
        onClick={() => onViewBranches(bank)}
        className={`w-full py-3 rounded-xl font-bold text-[14px] active:scale-[0.97] transition-all flex items-center justify-center gap-1.5 ${
          bank.hasAvailability
            ? 'bg-gradient-to-r from-yellow-400 to-amber-500 text-white shadow-sm hover:shadow-md'
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
