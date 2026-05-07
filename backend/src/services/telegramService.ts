import axios from 'axios';
import { getPrices, getBanksWithAvailability } from './goldService.js';

const BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN;
const CHAT_ID   = process.env.TELEGRAM_CHAT_ID;

function formatPrice(n: number): string {
  return n.toLocaleString('ru-RU');
}

function formatDate(): string {
  return new Intl.DateTimeFormat('ru-RU', {
    timeZone: 'Asia/Tashkent',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(new Date());
}

export async function sendDailyNotification(): Promise<void> {
  if (!BOT_TOKEN || !CHAT_ID) {
    console.warn('[Telegram] TELEGRAM_BOT_TOKEN or TELEGRAM_CHAT_ID not set, skipping.');
    return;
  }

  const { prices } = getPrices();
  const { banks }  = getBanksWithAvailability('Ташкент');

  const weightOrder = [5, 10, 20, 50, 100];
  const sortedPrices = [...prices].sort(
    (a, b) => weightOrder.indexOf(a.weightGrams) - weightOrder.indexOf(b.weightGrams),
  );

  const priceLines = sortedPrices
    .map(p => `  ${p.weightGrams}г — ${formatPrice(p.priceUzs)} сум`)
    .join('\n');

  const availableBanks = banks
    .filter(b => b.hasAvailability)
    .sort((a, b) => b.totalQuantity - a.totalQuantity);

  let bankLines: string;
  if (availableBanks.length === 0) {
    bankLines = '  Нет в наличии';
  } else {
    bankLines = availableBanks
      .map(b => {
        const branchCount = b.branches.filter(br => br.available).length;
        return `  ${b.bankName} — ${b.totalQuantity} шт. (${branchCount} фил.)`;
      })
      .join('\n');
  }

  const text = [
    `🟡 *Goldi — Золотые слитки*`,
    `📅 ${formatDate()} (Ташкент)`,
    ``,
    `💰 *Цены ЦБУ:*`,
    priceLines,
    ``,
    `🏦 *Наличие в Ташкенте:*`,
    bankLines,
    ``,
    `🔗 [Открыть Goldi](https://frontend-flame-theta-76.vercel.app)`,
  ].join('\n');

  await axios.post(`https://api.telegram.org/bot${BOT_TOKEN}/sendMessage`, {
    chat_id: CHAT_ID,
    text,
    parse_mode: 'Markdown',
    disable_web_page_preview: true,
  });

  console.log('[Telegram] Daily notification sent.');
}
