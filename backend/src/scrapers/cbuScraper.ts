import axios from 'axios';
import * as cheerio from 'cheerio';
import { ScrapedGoldData, ScrapedAvailabilityItem } from '../types/index.js';

const PRICES_URL = 'https://cbu.uz/ru/banknotes-coins/gold-bars/prices/';
const BALANCE_URL = 'https://cbu.uz/ru/banknotes-coins/gold-bars/balance/';

const HTTP_HEADERS = {
  'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
  'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
  'Accept-Language': 'ru-RU,ru;q=0.9,en;q=0.5',
  'Accept-Encoding': 'gzip, deflate, br',
};

const WEIGHT_COLUMNS = [5, 10, 20, 50, 100];

export async function scrapeGoldData(): Promise<{ data: ScrapedGoldData; isMockData: boolean }> {
  try {
    const [pricesHtml, balanceHtml] = await Promise.all([
      axios.get(PRICES_URL, { timeout: 20000, headers: HTTP_HEADERS }).then(r => r.data as string),
      axios.get(BALANCE_URL, { timeout: 20000, headers: HTTP_HEADERS }).then(r => r.data as string),
    ]);

    const prices = parsePricesPage(pricesHtml);
    const priceMap = new Map(prices.map(p => [p.weightGrams, p.priceUzs]));
    const availability = parseBalancePage(balanceHtml, priceMap);

    if (availability.length > 0) {
      console.log(`[Scraper] Parsed ${availability.length} branch-weight entries, ${prices.length} price rows`);
      return { data: { prices, availability }, isMockData: false };
    }

    console.warn('[Scraper] Parsed 0 entries — falling back to mock data');
    return { data: getMockData(), isMockData: true };
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : String(error);
    console.error(`[Scraper] Fetch error: ${msg}. Using mock data.`);
    return { data: getMockData(), isMockData: true };
  }
}

// ---------------------------------------------------------------------------
// Grid builder — expands rowspan/colspan so every logical row has the same
// number of columns regardless of how the HTML merges cells.
// ---------------------------------------------------------------------------
function buildGrid($: cheerio.CheerioAPI, table: cheerio.Element): string[][] {
  const grid: string[][] = [];
  // pending[col] = { value, rowsLeft } — cells still occupied by an active rowspan
  const pending = new Map<number, { value: string; rowsLeft: number }>();

  $(table).find('tr').each((ri, tr) => {
    grid[ri] = [];
    let col = 0;

    $(tr).find('td, th').each((_, td) => {
      // Advance past columns already occupied by rowspans from previous rows
      while (pending.has(col)) {
        grid[ri][col] = pending.get(col)!.value;
        col++;
      }

      const text = $(td).text().trim();
      const rowspan = parseInt($(td).attr('rowspan') || '1', 10);
      const colspan = parseInt($(td).attr('colspan') || '1', 10);

      for (let c = 0; c < colspan; c++) {
        grid[ri][col + c] = text;
        if (rowspan > 1) {
          pending.set(col + c, { value: text, rowsLeft: rowspan - 1 });
        }
      }
      col += colspan;
    });

    // Fill any remaining positions at the end of this row that rowspans cover
    for (const [c, info] of pending) {
      if (grid[ri][c] === undefined) grid[ri][c] = info.value;
    }

    // Decrement all active rowspans; remove exhausted ones
    for (const [c, info] of [...pending.entries()]) {
      info.rowsLeft--;
      if (info.rowsLeft <= 0) pending.delete(c);
    }
  });

  return grid;
}

// ---------------------------------------------------------------------------
// Prices page: Вес | Цена продажи | buyback…
// ---------------------------------------------------------------------------
function parsePricesPage(html: string): Array<{ weightGrams: number; priceUzs: number }> {
  const $ = cheerio.load(html);
  const prices: Array<{ weightGrams: number; priceUzs: number }> = [];

  $('table tr').each((_, row) => {
    const cells = $(row).find('td');
    if (cells.length < 2) return;

    const weightGrams = parseWeightGrams($(cells[0]).text().trim());
    const priceUzs = parsePrice($(cells[1]).text().trim());

    if (weightGrams > 0 && priceUzs > 1_000_000) {
      prices.push({ weightGrams, priceUzs });
    }
  });

  return prices;
}

// ---------------------------------------------------------------------------
// Balance page — columns after rowspan expansion:
//   0:№  1:Регион  2:Банк(Филиал)  3:Всего(skip)  4:5г  5:10г  6:20г  7:50г  8:100г
// ---------------------------------------------------------------------------
function parseBalancePage(
  html: string,
  priceMap: Map<number, number>,
): ScrapedAvailabilityItem[] {
  const $ = cheerio.load(html);
  const availability: ScrapedAvailabilityItem[] = [];

  $('table').each((_, table) => {
    const tableText = $(table).text();
    if (!tableText.includes('5 гр') || !tableText.includes('Регион')) return;

    const grid = buildGrid($, table);

    // Detect which row is the last header row (contains "5 гр")
    let dataStartRow = -1;
    let regionCol = 1;
    let bankCol = 2;
    let firstWeightCol = 4; // default: weights start after №, Регион, Банк, Всего

    for (let r = 0; r < Math.min(grid.length, 10); r++) {
      const row = grid[r] ?? [];
      if (row.some(cell => /^5\s*гр?\.?$/i.test((cell ?? '').trim()))) {
        // Found the header row with weight columns — detect positions
        row.forEach((cell, i) => {
          const cl = (cell ?? '').toLowerCase().trim();
          if (cl === 'регион') regionCol = i;
          else if (cl === 'банк') bankCol = i;
          else if (/^5\s*гр?\.?$/i.test(cl)) firstWeightCol = i;
        });
        dataStartRow = r + 1;
        break;
      }
    }

    if (dataStartRow < 0) {
      console.warn('[Scraper] Could not find balance table header row');
      return;
    }

    console.log(`[Scraper] Balance table: dataStartRow=${dataStartRow} regionCol=${regionCol} bankCol=${bankCol} firstWeightCol=${firstWeightCol}`);

    for (let r = dataStartRow; r < grid.length; r++) {
      const row = grid[r] ?? [];

      // Need enough columns to reach the last weight column
      if ((row[firstWeightCol + WEIGHT_COLUMNS.length - 1] ?? '') === '' && row.length < firstWeightCol + WEIGHT_COLUMNS.length) continue;

      const region = (row[regionCol] ?? '').trim();
      const bankRaw = (row[bankCol] ?? '').trim();

      if (!region || !bankRaw) continue;

      // Skip summary/total rows
      if (/итого|всего|total/i.test(bankRaw)) continue;

      // Only rows where the bank column contains «» are actual branch rows
      if (!bankRaw.includes('«')) continue;

      // Skip rows where region looks like a weight (parser misread columns)
      if (/^\d+\s*гр/i.test(region)) continue;

      const { bankName, bankShortName, branchName } = parseBankName(bankRaw);
      const city = parseCity(region);

      WEIGHT_COLUMNS.forEach((weightGrams, i) => {
        const qty = parseQty((row[firstWeightCol + i] ?? '').trim());
        availability.push({
          bankName,
          bankShortName,
          city,
          address: branchName,
          phone: '',
          weightGrams,
          quantity: qty,
          priceUzs: priceMap.get(weightGrams) ?? 0,
        });
      });
    }
  });

  return availability;
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

// Input: 'АКБ «ASIA ALLIANCE BANK» (ОПЕРУ)'
function parseBankName(raw: string): { bankName: string; bankShortName: string; branchName: string } {
  const nameMatch = raw.match(/«([^»]+)»/);
  const bankName = nameMatch
    ? nameMatch[1].trim()
    : raw.replace(/\s*\([^)]*\)\s*/, '').replace(/^(АКБ|ОАО|ПАО|ЗАО|ЧБ|КБ)\s+/i, '').trim();

  const branchMatch = raw.match(/\(([^)]+)\)/);
  const branchName = branchMatch ? branchMatch[1].trim() : '';

  return { bankName, bankShortName: extractShortName(bankName), branchName };
}

// 'город Ташкент' → 'Ташкент', 'г. Навои' → 'Навои'
function parseCity(region: string): string {
  return region.replace(/^город\s+/i, '').replace(/^г\.\s*/i, '').trim();
}

function parseWeightGrams(text: string): number {
  const m = text.match(/^(\d+)/);
  return m ? parseInt(m[1], 10) : 0;
}

function parsePrice(text: string): number {
  const digits = text.replace(/[^\d]/g, '');
  return digits ? parseInt(digits, 10) : 0;
}

function parseQty(text: string): number {
  if (!text || /^[—\-–]$/.test(text)) return 0;
  const n = parseInt(text.replace(/[^\d]/g, ''), 10);
  return isNaN(n) ? 0 : n;
}

function extractShortName(bankName: string): string {
  const known: Record<string, string> = {
    'национальный банк': 'NBU',
    'узпромстройбанк': 'SQB',
    'hamkorbank': 'HKB',
    'хамкорбанк': 'HKB',
    'kapitalbank': 'KAP',
    'капиталбанк': 'KAP',
    'agrobank': 'AGB',
    'агробанк': 'AGB',
    'ипотека': 'IPB',
    'asaka': 'ASK',
    'асака': 'ASK',
    'aloqabank': 'ALQ',
    'алока': 'ALQ',
    'халк': 'XB',
    'xalq': 'XB',
    'asia alliance': 'AAB',
    'orient': 'OFB',
    'ravnaq': 'RVB',
    'davr': 'DVB',
    'mikrokreditbank': 'MKB',
    'микрокредит': 'MKB',
    'туронбанк': 'TRB',
    'turonbank': 'TRB',
    'савдогар': 'SVD',
    'savdogar': 'SVD',
    'универсал': 'UNB',
    'universal': 'UNB',
    'ziraat': 'ZRT',
    'зираат': 'ZRT',
    'народный': 'XB',
    'развития бизнеса': 'BDB',
    'бизнес': 'BIZ',
    'инвест': 'INV',
    'трастбанк': 'TRS',
    'trustbank': 'TRS',
    'поytaxt': 'PYT',
    'пойтахт': 'PYT',
    'anorbank': 'ANR',
    'анор': 'ANR',
    'tenge': 'TNG',
  };

  const lower = bankName.toLowerCase();
  for (const [key, val] of Object.entries(known)) {
    if (lower.includes(key)) return val;
  }

  return bankName.split(/\s+/)[0].slice(0, 4).toUpperCase();
}

export function getMockData(): ScrapedGoldData {
  return {
    prices: [
      { weightGrams: 5,   priceUzs: 9_396_000 },
      { weightGrams: 10,  priceUzs: 18_434_000 },
      { weightGrams: 20,  priceUzs: 36_867_000 },
      { weightGrams: 50,  priceUzs: 92_168_000 },
      { weightGrams: 100, priceUzs: 184_337_000 },
    ],
    availability: [
      { bankName: 'Узпромстройбанк', bankShortName: 'SQB', city: 'Ташкент',          address: 'Сергелийский ОБУ',     phone: '', weightGrams: 5,   quantity: 7,  priceUzs: 9_396_000 },
      { bankName: 'Узпромстройбанк', bankShortName: 'SQB', city: 'Ташкент',          address: 'Сергелийский ОБУ',     phone: '', weightGrams: 10,  quantity: 15, priceUzs: 18_434_000 },
      { bankName: 'Узпромстройбанк', bankShortName: 'SQB', city: 'Ташкент',          address: 'Сергелийский ОБУ',     phone: '', weightGrams: 20,  quantity: 15, priceUzs: 36_867_000 },
      { bankName: 'Узпромстройбанк', bankShortName: 'SQB', city: 'Ташкент',          address: 'Сергелийский ОБУ',     phone: '', weightGrams: 50,  quantity: 4,  priceUzs: 92_168_000 },
      { bankName: 'Узпромстройбанк', bankShortName: 'SQB', city: 'Ташкент',          address: 'Сергелийский ОБУ',     phone: '', weightGrams: 100, quantity: 6,  priceUzs: 184_337_000 },
      { bankName: 'ASIA ALLIANCE BANK', bankShortName: 'AAB', city: 'Ташкент',       address: 'ОПЕРУ',                phone: '', weightGrams: 5,   quantity: 23, priceUzs: 9_396_000 },
      { bankName: 'ASIA ALLIANCE BANK', bankShortName: 'AAB', city: 'Ташкент',       address: 'ОПЕРУ',                phone: '', weightGrams: 10,  quantity: 13, priceUzs: 18_434_000 },
      { bankName: 'ASIA ALLIANCE BANK', bankShortName: 'AAB', city: 'Ташкент',       address: 'ОПЕРУ',                phone: '', weightGrams: 20,  quantity: 36, priceUzs: 36_867_000 },
      { bankName: 'ASIA ALLIANCE BANK', bankShortName: 'AAB', city: 'Ташкент',       address: 'ОПЕРУ',                phone: '', weightGrams: 50,  quantity: 5,  priceUzs: 92_168_000 },
      { bankName: 'ASIA ALLIANCE BANK', bankShortName: 'AAB', city: 'Ташкент',       address: 'ОПЕРУ',                phone: '', weightGrams: 100, quantity: 20, priceUzs: 184_337_000 },
      { bankName: 'Банк развития бизнеса', bankShortName: 'BDB', city: 'Ташкент',    address: 'Яккасарайский ЦБУ',    phone: '', weightGrams: 5,   quantity: 27, priceUzs: 9_396_000 },
      { bankName: 'Банк развития бизнеса', bankShortName: 'BDB', city: 'Ташкент',    address: 'Яккасарайский ЦБУ',    phone: '', weightGrams: 10,  quantity: 0,  priceUzs: 18_434_000 },
      { bankName: 'Банк развития бизнеса', bankShortName: 'BDB', city: 'Наманган',   address: 'Наманганский ОБУ',     phone: '', weightGrams: 5,   quantity: 9,  priceUzs: 9_396_000 },
      { bankName: 'Банк развития бизнеса', bankShortName: 'BDB', city: 'Наманган',   address: 'Учкурганский ОБУ',     phone: '', weightGrams: 5,   quantity: 1,  priceUzs: 9_396_000 },
      { bankName: 'Банк развития бизнеса', bankShortName: 'BDB', city: 'Наманган',   address: 'Папский ОБУ',          phone: '', weightGrams: 5,   quantity: 2,  priceUzs: 9_396_000 },
    ],
  };
}
