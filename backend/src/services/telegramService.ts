import axios from 'axios';
import { getPrices, getBanksWithAvailability, getCities } from './goldService.js';

const BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN;
const CHAT_ID   = process.env.TELEGRAM_CHAT_ID;

// Saved city preference (in-memory, survives runtime, resets on redeploy → defaults to Ташкент)
let savedCity: string = 'Ташкент';

// ─── Telegram API helper ───────────────────────────────────────────────────

async function tg(method: string, data: object): Promise<void> {
  if (!BOT_TOKEN) return;
  try {
    await axios.post(`https://api.telegram.org/bot${BOT_TOKEN}/${method}`, data);
  } catch (err: any) {
    console.error(`[Telegram] API error (${method}):`, err?.response?.data ?? err.message);
  }
}

// ─── Helpers ──────────────────────────────────────────────────────────────

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

function chunkArray<T>(arr: T[], size: number): T[][] {
  const result: T[][] = [];
  for (let i = 0; i < arr.length; i += size) result.push(arr.slice(i, i + size));
  return result;
}

// ─── Daily prices (automatic, 11:00 Tashkent) ────────────────────────────

export async function sendDailyPrices(chatId?: string | number): Promise<void> {
  const target = chatId ?? CHAT_ID;
  if (!BOT_TOKEN || !target) {
    console.warn('[Telegram] Credentials not set, skipping.');
    return;
  }

  const { prices } = getPrices();
  const weightOrder = [5, 10, 20, 50, 100];
  const sorted = [...prices].sort(
    (a, b) => weightOrder.indexOf(a.weightGrams) - weightOrder.indexOf(b.weightGrams),
  );

  const priceLines = sorted
    .map(p => `  *${p.weightGrams}г* — ${formatPrice(p.priceUzs)} сум`)
    .join('\n');

  const text = [
    `🟡 *Goldi — Цены на золото*`,
    `📅 ${formatDate()}`,
    ``,
    `💰 *Курс ЦБУ:*`,
    priceLines,
    ``,
    `🔗 [Открыть Goldi](https://frontend-flame-theta-76.vercel.app)`,
  ].join('\n');

  await tg('sendMessage', {
    chat_id: target,
    text,
    parse_mode: 'Markdown',
    disable_web_page_preview: true,
    reply_markup: {
      inline_keyboard: [[
        { text: '🏦 Проверить наличие', callback_data: 'check_availability' },
      ]],
    },
  });

  console.log('[Telegram] Daily prices sent.');
}

// ─── City selector keyboard ───────────────────────────────────────────────

async function sendCitySelector(chatId: number | string): Promise<void> {
  const cities = getCities();
  const rows = chunkArray(cities, 3).map(row =>
    row.map(city => ({ text: city, callback_data: `city:${city}` })),
  );

  await tg('sendMessage', {
    chat_id: chatId,
    text: '🏙 Выберите город:',
    reply_markup: { inline_keyboard: rows },
  });
}

// ─── Availability for saved city ──────────────────────────────────────────

async function sendAvailability(chatId: number | string, city: string): Promise<void> {
  const { banks } = getBanksWithAvailability(city);
  const available = banks
    .filter(b => b.hasAvailability)
    .sort((a, b) => b.totalQuantity - a.totalQuantity);

  const bankLines = available.length === 0
    ? '  _Нет в наличии_'
    : available
        .map(b => {
          const branchCount = b.branches.filter(br => br.available).length;
          return `  *${b.bankName}* — ${b.totalQuantity} шт. (${branchCount} фил.)`;
        })
        .join('\n');

  const text = [`🏦 *Наличие в ${city}*`, ``, bankLines].join('\n');

  await tg('sendMessage', {
    chat_id: chatId,
    text,
    parse_mode: 'Markdown',
    reply_markup: {
      inline_keyboard: [[
        { text: '🔄 Обновить', callback_data: `city:${city}` },
        { text: '🏙 Другой город', callback_data: 'change_city' },
      ]],
    },
  });
}

// ─── Webhook handler (incoming updates from Telegram) ─────────────────────

export async function handleUpdate(update: any): Promise<void> {
  const msg = update.message;
  const cb  = update.callback_query;

  if (msg) {
    const chatId = msg.chat.id;
    const text: string = msg.text?.trim() ?? '';

    if (text === '/start') {
      await tg('sendMessage', {
        chat_id: chatId,
        text: [
          `👋 Привет! Я *Goldi* — бот для цен на золото в Узбекистане.`,
          ``,
          `📅 Каждый день в *11:00* по Ташкенту присылаю актуальные цены ЦБУ.`,
          ``,
          `Команды:`,
          `/prices — текущие цены`,
          `/nalichie — наличие в банках (выбор города)`,
        ].join('\n'),
        parse_mode: 'Markdown',
        reply_markup: {
          inline_keyboard: [[
            { text: '💰 Цены сейчас', callback_data: 'get_prices' },
            { text: '🏦 Наличие', callback_data: 'check_availability' },
          ]],
        },
      });

    } else if (text === '/nalichie') {
      await sendCitySelector(chatId);

    } else if (text === '/prices') {
      await sendDailyPrices(chatId);
    }
  }

  if (cb) {
    const chatId = cb.message.chat.id;
    const data: string = cb.data ?? '';

    await tg('answerCallbackQuery', { callback_query_id: cb.id });

    if (data === 'get_prices') {
      await sendDailyPrices(chatId);

    } else if (data === 'check_availability') {
      // If city already saved — go straight to availability, else ask city
      await sendAvailability(chatId, savedCity);

    } else if (data === 'change_city') {
      await sendCitySelector(chatId);

    } else if (data.startsWith('city:')) {
      savedCity = data.slice(5);
      await sendAvailability(chatId, savedCity);
    }
  }
}

// ─── Webhook registration ─────────────────────────────────────────────────

export async function registerWebhook(baseUrl: string): Promise<void> {
  if (!BOT_TOKEN) return;
  const webhookUrl = `${baseUrl}/api/telegram/webhook`;
  await axios.post(`https://api.telegram.org/bot${BOT_TOKEN}/setWebhook`, {
    url: webhookUrl,
    allowed_updates: ['message', 'callback_query'],
  });
  console.log(`[Telegram] Webhook set: ${webhookUrl}`);
}
