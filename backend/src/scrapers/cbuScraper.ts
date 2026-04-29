import axios from 'axios';
import * as cheerio from 'cheerio';
import { ScrapedGoldData, ScrapedAvailabilityItem } from '../types/index.js';

const CBU_URL = 'https://cbu.uz/ru/banknotes-coins/gold-bars/balance/';

const BASE_PRICES: Record<number, number> = {
  1: 980000,
  2: 1960000,
  5: 4900000,
  10: 9800000,
  20: 19600000,
  50: 49000000,
  100: 98000000,
};

export async function scrapeGoldData(): Promise<{ data: ScrapedGoldData; isMockData: boolean }> {
  try {
    const response = await axios.get(CBU_URL, {
      timeout: 20000,
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
        'Accept-Language': 'ru-RU,ru;q=0.9,en;q=0.5',
        'Accept-Encoding': 'gzip, deflate, br',
      },
    });

    const parsed = parseHtml(response.data);
    if (parsed.availability.length > 0) {
      console.log(`[Scraper] Successfully parsed ${parsed.availability.length} availability entries from CBU`);
      return { data: parsed, isMockData: false };
    }

    console.warn('[Scraper] Parsed 0 entries — falling back to mock data');
    return { data: getMockData(), isMockData: true };
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : String(error);
    console.error(`[Scraper] Failed to fetch CBU page: ${msg}. Using mock data.`);
    return { data: getMockData(), isMockData: true };
  }
}

function parseHtml(html: string): ScrapedGoldData {
  const $ = cheerio.load(html);
  const availability: ScrapedAvailabilityItem[] = [];
  const priceMap = new Map<number, number>();

  $('table').each((_, table) => {
    const rows = $(table).find('tr');
    if (rows.length < 2) return;

    // Detect header columns
    const headerCells = $(rows[0]).find('th, td').map((_, el) => $(el).text().trim().toLowerCase()).get();
    const hasGoldData = headerCells.some(h => h.includes('слиток') || h.includes('золот') || h.includes('грамм') || h.includes('банк'));
    if (!hasGoldData) return;

    rows.slice(1).each((_, row) => {
      const cells = $(row).find('td');
      if (cells.length < 3) return;

      const cellTexts = cells.map((_, el) => $(el).text().trim()).get();
      const bankName = cellTexts[0] || '';
      const city = cellTexts[1] || 'Ташкент';
      const address = cellTexts[2] || '';
      const weightText = cellTexts[3] || '';
      const quantityText = cellTexts[4] || '0';
      const priceText = cellTexts[5] || '0';

      const weightGrams = parseWeight(weightText);
      if (weightGrams === 0 || !bankName) return;

      const quantity = parseInt(quantityText.replace(/\D/g, '') || '0', 10);
      const priceRaw = parseInt(priceText.replace(/\D/g, '') || '0', 10);
      const priceUzs = priceRaw > 0 ? priceRaw : (BASE_PRICES[weightGrams] ?? weightGrams * 980000);

      priceMap.set(weightGrams, priceUzs);
      availability.push({
        bankName: bankName.trim(),
        bankShortName: extractShortName(bankName),
        city: city.trim() || 'Ташкент',
        address: address.trim(),
        phone: '',
        weightGrams,
        quantity,
        priceUzs,
      });
    });
  });

  const prices = Array.from(priceMap.entries())
    .map(([weightGrams, priceUzs]) => ({ weightGrams, priceUzs }))
    .sort((a, b) => a.weightGrams - b.weightGrams);

  if (prices.length === 0) {
    prices.push(...Object.entries(BASE_PRICES).map(([w, p]) => ({ weightGrams: Number(w), priceUzs: p })));
  }

  return { prices, availability };
}

function parseWeight(text: string): number {
  const match = text.match(/(\d+)\s*г/i);
  return match ? parseInt(match[1], 10) : 0;
}

function extractShortName(fullName: string): string {
  const known: Record<string, string> = {
    'национальный банк': 'NBU',
    'узпромстройбанк': 'SQB',
    'hamkorbank': 'HKB',
    'хамкорбанк': 'HKB',
    'kapitalbank': 'KAP',
    'капиталбанк': 'KAP',
    'agrobank': 'AGB',
    'агробанк': 'AGB',
    'ипотека-банк': 'IPB',
    'asaka': 'ASK',
    'асака': 'ASK',
    'алока': 'ALQ',
    'aloqabank': 'ALQ',
    'народный банк': 'XB',
    'халк': 'XB',
  };

  const lower = fullName.toLowerCase();
  for (const [key, val] of Object.entries(known)) {
    if (lower.includes(key)) return val;
  }

  // Fallback: take first word up to 4 chars
  const word = fullName.split(/\s+/)[0];
  return word.slice(0, 4).toUpperCase();
}

export function getMockData(): ScrapedGoldData {
  return {
    prices: [
      { weightGrams: 1, priceUzs: 980000 },
      { weightGrams: 2, priceUzs: 1960000 },
      { weightGrams: 5, priceUzs: 4900000 },
      { weightGrams: 10, priceUzs: 9800000 },
      { weightGrams: 20, priceUzs: 19600000 },
      { weightGrams: 50, priceUzs: 49000000 },
      { weightGrams: 100, priceUzs: 98000000 },
    ],
    availability: [
      // NBU — Tashkent
      { bankName: 'Национальный Банк Узбекистана', bankShortName: 'NBU', city: 'Ташкент', address: 'ул. Ислама Каримова, 6', phone: '+998712007590', weightGrams: 5, quantity: 14, priceUzs: 4900000 },
      { bankName: 'Национальный Банк Узбекистана', bankShortName: 'NBU', city: 'Ташкент', address: 'ул. Ислама Каримова, 6', phone: '+998712007590', weightGrams: 10, quantity: 6, priceUzs: 9800000 },
      { bankName: 'Национальный Банк Узбекистана', bankShortName: 'NBU', city: 'Ташкент', address: 'пр. Амира Темура, 1', phone: '+998712336767', weightGrams: 5, quantity: 8, priceUzs: 4900000 },
      { bankName: 'Национальный Банк Узбекистана', bankShortName: 'NBU', city: 'Ташкент', address: 'пр. Амира Темура, 1', phone: '+998712336767', weightGrams: 20, quantity: 3, priceUzs: 19600000 },
      { bankName: 'Национальный Банк Узбекистана', bankShortName: 'NBU', city: 'Ташкент', address: 'ул. Беруни, 93', phone: '+998712310988', weightGrams: 10, quantity: 4, priceUzs: 9800000 },
      { bankName: 'Национальный Банк Узбекистана', bankShortName: 'NBU', city: 'Ташкент', address: 'ул. Беруни, 93', phone: '+998712310988', weightGrams: 50, quantity: 1, priceUzs: 49000000 },
      // NBU — Samarkand
      { bankName: 'Национальный Банк Узбекистана', bankShortName: 'NBU', city: 'Самарканд', address: 'пр. Ислама Каримова, 28', phone: '+998662237890', weightGrams: 5, quantity: 8, priceUzs: 4900000 },
      { bankName: 'Национальный Банк Узбекистана', bankShortName: 'NBU', city: 'Самарканд', address: 'пр. Ислама Каримова, 28', phone: '+998662237890', weightGrams: 50, quantity: 2, priceUzs: 49000000 },
      // NBU — Namangan
      { bankName: 'Национальный Банк Узбекистана', bankShortName: 'NBU', city: 'Наманган', address: 'ул. Навоий, 14', phone: '+998692226677', weightGrams: 5, quantity: 6, priceUzs: 4900000 },
      { bankName: 'Национальный Банк Узбекистана', bankShortName: 'NBU', city: 'Наманган', address: 'ул. Навоий, 14', phone: '+998692226677', weightGrams: 20, quantity: 2, priceUzs: 19600000 },
      // SQB — Tashkent
      { bankName: 'Узпромстройбанк', bankShortName: 'SQB', city: 'Ташкент', address: 'пр. Мирзо Улугбека, 101', phone: '+998712449000', weightGrams: 5, quantity: 8, priceUzs: 4900000 },
      { bankName: 'Узпромстройбанк', bankShortName: 'SQB', city: 'Ташкент', address: 'ул. Навоий, 34', phone: '+998711502900', weightGrams: 10, quantity: 4, priceUzs: 9800000 },
      { bankName: 'Узпромстройбанк', bankShortName: 'SQB', city: 'Ташкент', address: 'ул. Лабзак, 57', phone: '+998712556677', weightGrams: 5, quantity: 3, priceUzs: 4900000 },
      { bankName: 'Узпромстройбанк', bankShortName: 'SQB', city: 'Ташкент', address: 'ул. Лабзак, 57', phone: '+998712556677', weightGrams: 100, quantity: 1, priceUzs: 98000000 },
      // SQB — Fergana
      { bankName: 'Узпромстройбанк', bankShortName: 'SQB', city: 'Фергана', address: 'пр. Ферганы, 15', phone: '+998732243567', weightGrams: 10, quantity: 5, priceUzs: 9800000 },
      { bankName: 'Узпромстройбанк', bankShortName: 'SQB', city: 'Фергана', address: 'пр. Ферганы, 15', phone: '+998732243567', weightGrams: 5, quantity: 0, priceUzs: 4900000 },
      // Hamkorbank — Tashkent
      { bankName: 'Hamkorbank', bankShortName: 'HKB', city: 'Ташкент', address: 'пр. Буюк Ипак Йули, 65', phone: '+998712339000', weightGrams: 5, quantity: 22, priceUzs: 4900000 },
      { bankName: 'Hamkorbank', bankShortName: 'HKB', city: 'Ташкент', address: 'пр. Буюк Ипак Йули, 65', phone: '+998712339000', weightGrams: 10, quantity: 11, priceUzs: 9800000 },
      { bankName: 'Hamkorbank', bankShortName: 'HKB', city: 'Ташкент', address: 'ул. Чилонзор, 14', phone: '+998712347788', weightGrams: 20, quantity: 5, priceUzs: 19600000 },
      { bankName: 'Hamkorbank', bankShortName: 'HKB', city: 'Ташкент', address: 'ул. Чилонзор, 14', phone: '+998712347788', weightGrams: 50, quantity: 1, priceUzs: 49000000 },
      // Hamkorbank — Fergana
      { bankName: 'Hamkorbank', bankShortName: 'HKB', city: 'Фергана', address: 'ул. Мустакиллик, 22', phone: '+998732223456', weightGrams: 5, quantity: 7, priceUzs: 4900000 },
      { bankName: 'Hamkorbank', bankShortName: 'HKB', city: 'Фергана', address: 'ул. Мустакиллик, 22', phone: '+998732223456', weightGrams: 10, quantity: 3, priceUzs: 9800000 },
      // Hamkorbank — Andijan
      { bankName: 'Hamkorbank', bankShortName: 'HKB', city: 'Андижан', address: 'ул. Навоий, 55', phone: '+998742247799', weightGrams: 5, quantity: 11, priceUzs: 4900000 },
      { bankName: 'Hamkorbank', bankShortName: 'HKB', city: 'Андижан', address: 'ул. Навоий, 55', phone: '+998742247799', weightGrams: 10, quantity: 4, priceUzs: 9800000 },
      // Kapitalbank — Tashkent (out of stock)
      { bankName: 'Kapitalbank', bankShortName: 'KAP', city: 'Ташкент', address: 'ул. Шота Руставели, 12', phone: '+998712009900', weightGrams: 5, quantity: 0, priceUzs: 4900000 },
      { bankName: 'Kapitalbank', bankShortName: 'KAP', city: 'Ташкент', address: 'пр. Узбекистан, 54', phone: '+998712009901', weightGrams: 10, quantity: 0, priceUzs: 9800000 },
      { bankName: 'Kapitalbank', bankShortName: 'KAP', city: 'Ташкент', address: 'пр. Узбекистан, 54', phone: '+998712009901', weightGrams: 20, quantity: 2, priceUzs: 19600000 },
      // Agrobank — Tashkent
      { bankName: 'Agrobank', bankShortName: 'AGB', city: 'Ташкент', address: 'ул. Истикбол, 71', phone: '+998712002000', weightGrams: 5, quantity: 12, priceUzs: 4900000 },
      { bankName: 'Agrobank', bankShortName: 'AGB', city: 'Ташкент', address: 'ул. Истикбол, 71', phone: '+998712002000', weightGrams: 50, quantity: 1, priceUzs: 49000000 },
      { bankName: 'Agrobank', bankShortName: 'AGB', city: 'Ташкент', address: 'ул. Мирабад, 12', phone: '+998712003344', weightGrams: 10, quantity: 3, priceUzs: 9800000 },
      // Agrobank — Bukhara
      { bankName: 'Agrobank', bankShortName: 'AGB', city: 'Бухара', address: 'ул. Мухаммад Икбол, 5', phone: '+998652224455', weightGrams: 5, quantity: 4, priceUzs: 4900000 },
      { bankName: 'Agrobank', bankShortName: 'AGB', city: 'Бухара', address: 'ул. Мухаммад Икбол, 5', phone: '+998652224455', weightGrams: 10, quantity: 2, priceUzs: 9800000 },
      // Ipoteka-bank — Tashkent
      { bankName: 'Ипотека-банк', bankShortName: 'IPB', city: 'Ташкент', address: 'пр. Шохжахон, 24', phone: '+998712771122', weightGrams: 5, quantity: 9, priceUzs: 4900000 },
      { bankName: 'Ипотека-банк', bankShortName: 'IPB', city: 'Ташкент', address: 'ул. Амир Темур, 37', phone: '+998712335000', weightGrams: 10, quantity: 0, priceUzs: 9800000 },
      { bankName: 'Ипотека-банк', bankShortName: 'IPB', city: 'Ташкент', address: 'пр. Шохжахон, 24', phone: '+998712771122', weightGrams: 100, quantity: 1, priceUzs: 98000000 },
      // Asaka Bank — Tashkent
      { bankName: 'АсакаБанк', bankShortName: 'ASK', city: 'Ташкент', address: 'ул. Академика Абдуллаева, 4', phone: '+998712337700', weightGrams: 5, quantity: 0, priceUzs: 4900000 },
      { bankName: 'АсакаБанк', bankShortName: 'ASK', city: 'Ташкент', address: 'ул. Академика Абдуллаева, 4', phone: '+998712337700', weightGrams: 100, quantity: 1, priceUzs: 98000000 },
      // Aloqabank — Tashkent
      { bankName: 'Алокабанк', bankShortName: 'ALQ', city: 'Ташкент', address: 'пр. Матбуотчилар, 32', phone: '+998712330088', weightGrams: 5, quantity: 5, priceUzs: 4900000 },
      { bankName: 'Алокабанк', bankShortName: 'ALQ', city: 'Ташкент', address: 'пр. Матбуотчилар, 32', phone: '+998712330088', weightGrams: 20, quantity: 3, priceUzs: 19600000 },
    ],
  };
}
