import pool from '../config/database.js';
import {
  GoldPrice,
  PriceHistoryEntry,
  BankWithAvailability,
  ScrapedGoldData,
} from '../types/index.js';

export async function upsertBank(name: string, shortName: string): Promise<number> {
  const res = await pool.query(
    `INSERT INTO banks (name, short_name) VALUES ($1, $2)
     ON CONFLICT (name) DO UPDATE SET short_name = EXCLUDED.short_name
     RETURNING id`,
    [name, shortName],
  );
  return res.rows[0].id;
}

export async function upsertBranch(bankId: number, city: string, address: string, phone: string): Promise<number> {
  const res = await pool.query(
    `INSERT INTO branches (bank_id, city, address, phone) VALUES ($1, $2, $3, $4)
     ON CONFLICT (bank_id, city, address) DO UPDATE SET phone = EXCLUDED.phone
     RETURNING id`,
    [bankId, city, address, phone],
  );
  return res.rows[0].id;
}

export async function upsertGoldPrice(weightGrams: number, priceUzs: number): Promise<void> {
  await pool.query(
    `INSERT INTO gold_prices (weight_grams, price_uzs, updated_at) VALUES ($1, $2, $3)
     ON CONFLICT (weight_grams) DO UPDATE SET price_uzs = EXCLUDED.price_uzs, updated_at = EXCLUDED.updated_at`,
    [weightGrams, priceUzs, new Date().toISOString()],
  );
}

export async function upsertAvailability(branchId: number, weightGrams: number, quantity: number, priceUzs: number): Promise<void> {
  await pool.query(
    `INSERT INTO gold_availability (branch_id, weight_grams, quantity, price_uzs, updated_at) VALUES ($1, $2, $3, $4, $5)
     ON CONFLICT (branch_id, weight_grams) DO UPDATE SET
       quantity = EXCLUDED.quantity, price_uzs = EXCLUDED.price_uzs, updated_at = EXCLUDED.updated_at`,
    [branchId, weightGrams, quantity, priceUzs, new Date().toISOString()],
  );
}

export async function recordPriceHistory(weightGrams: number, priceUzs: number, date: string): Promise<void> {
  await pool.query(
    `INSERT INTO price_history (weight_grams, price_uzs, date) VALUES ($1, $2, $3)
     ON CONFLICT (weight_grams, date) DO UPDATE SET price_uzs = EXCLUDED.price_uzs`,
    [weightGrams, priceUzs, date],
  );
}

export async function getAllPrices(): Promise<GoldPrice[]> {
  const res = await pool.query(
    `SELECT weight_grams, price_uzs, updated_at FROM gold_prices ORDER BY weight_grams ASC`,
  );
  return res.rows.map(r => ({
    weightGrams: Number(r.weight_grams),
    priceUzs: Number(r.price_uzs),
    updatedAt: r.updated_at,
  }));
}

export async function getPriceHistory(weightGrams: number, days = 15): Promise<PriceHistoryEntry[]> {
  const res = await pool.query(
    `SELECT weight_grams, price_uzs, date FROM price_history
     WHERE weight_grams = $1 ORDER BY date DESC LIMIT $2`,
    [weightGrams, days],
  );
  return res.rows.reverse().map(r => ({
    weightGrams: Number(r.weight_grams),
    priceUzs: Number(r.price_uzs),
    date: r.date,
  }));
}

export async function getAllCities(): Promise<string[]> {
  const res = await pool.query(
    `SELECT DISTINCT city FROM branches
     WHERE city NOT LIKE '%гр%' AND city NOT LIKE '%г.%' AND length(city) > 3
     ORDER BY city ASC`,
  );
  return res.rows.map(r => r.city);
}

export async function getAvailabilityGrouped(city?: string, weightGrams?: number): Promise<BankWithAvailability[]> {
  const params: (string | number)[] = [];
  let where = 'WHERE 1=1';
  if (city)        { where += ` AND br.city = $${params.length + 1}`;          params.push(city); }
  if (weightGrams) { where += ` AND ga.weight_grams = $${params.length + 1}`;  params.push(weightGrams); }

  const res = await pool.query(
    `SELECT b.name as bankname, b.short_name as bankshortname,
            br.city, br.id as branchid, br.address, br.phone,
            ga.weight_grams as weightgrams, ga.quantity,
            ga.price_uzs as priceuzs, ga.updated_at as updatedat
     FROM gold_availability ga
     JOIN branches br ON ga.branch_id = br.id
     JOIN banks b ON br.bank_id = b.id
     ${where} ORDER BY b.name, br.city, br.id`,
    params,
  );

  const groupMap = new Map<string, BankWithAvailability>();
  for (const r of res.rows) {
    if (!groupMap.has(r.bankname)) {
      groupMap.set(r.bankname, {
        bankName: r.bankname,
        bankShortName: r.bankshortname,
        totalQuantity: 0,
        hasAvailability: false,
        branches: [],
      });
    }
    const group = groupMap.get(r.bankname)!;
    let branch = group.branches.find(b => b.branchId === r.branchid);
    if (!branch) {
      branch = { branchId: r.branchid, city: r.city, address: r.address, phone: r.phone, quantity: 0, available: false };
      group.branches.push(branch);
    }
    branch.quantity += Number(r.quantity);
    branch.available = branch.available || Number(r.quantity) > 0;
    group.totalQuantity += Number(r.quantity);
    group.hasAvailability = group.hasAvailability || Number(r.quantity) > 0;
  }

  return Array.from(groupMap.values())
    .filter(b => b.hasAvailability)
    .sort((a, b) => a.bankName.localeCompare(b.bankName, 'ru'));
}

export async function getAvailabilityUpdatedAt(): Promise<string> {
  const res = await pool.query('SELECT MAX(updated_at) as ts FROM gold_availability');
  return res.rows[0]?.ts ?? new Date().toISOString();
}

export async function persistScrapedData(data: ScrapedGoldData): Promise<void> {
  const today = new Date(Date.now() + 5 * 60 * 60 * 1000).toISOString().split('T')[0];
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    const now = new Date().toISOString();

    for (const price of data.prices) {
      await client.query(
        `INSERT INTO gold_prices (weight_grams, price_uzs, updated_at) VALUES ($1, $2, $3)
         ON CONFLICT (weight_grams) DO UPDATE SET price_uzs = EXCLUDED.price_uzs, updated_at = EXCLUDED.updated_at`,
        [price.weightGrams, price.priceUzs, now],
      );
      await client.query(
        `INSERT INTO price_history (weight_grams, price_uzs, date) VALUES ($1, $2, $3)
         ON CONFLICT (weight_grams, date) DO UPDATE SET price_uzs = EXCLUDED.price_uzs`,
        [price.weightGrams, price.priceUzs, today],
      );
    }

    for (const item of data.availability) {
      const bankRes = await client.query(
        `INSERT INTO banks (name, short_name) VALUES ($1, $2)
         ON CONFLICT (name) DO UPDATE SET short_name = EXCLUDED.short_name RETURNING id`,
        [item.bankName, item.bankShortName],
      );
      const bankId = bankRes.rows[0].id;

      const branchRes = await client.query(
        `INSERT INTO branches (bank_id, city, address, phone) VALUES ($1, $2, $3, $4)
         ON CONFLICT (bank_id, city, address) DO UPDATE SET phone = EXCLUDED.phone RETURNING id`,
        [bankId, item.city, item.address, item.phone],
      );
      const branchId = branchRes.rows[0].id;

      await client.query(
        `INSERT INTO gold_availability (branch_id, weight_grams, quantity, price_uzs, updated_at) VALUES ($1, $2, $3, $4, $5)
         ON CONFLICT (branch_id, weight_grams) DO UPDATE SET
           quantity = EXCLUDED.quantity, price_uzs = EXCLUDED.price_uzs, updated_at = EXCLUDED.updated_at`,
        [branchId, item.weightGrams, item.quantity, item.priceUzs, now],
      );
    }

    await client.query('COMMIT');
  } catch (e) {
    await client.query('ROLLBACK');
    throw e;
  } finally {
    client.release();
  }
}

export async function hasPriceHistory(weightGrams: number): Promise<boolean> {
  const res = await pool.query(
    'SELECT COUNT(*) as cnt FROM price_history WHERE weight_grams = $1',
    [weightGrams],
  );
  return Number(res.rows[0].cnt) > 0;
}

export async function seedPriceHistory(weightGrams: number, currentPrice: number): Promise<void> {
  const today = new Date();
  for (let i = 14; i >= 0; i--) {
    const d = new Date(today);
    d.setDate(d.getDate() - i);
    const dateStr = d.toISOString().split('T')[0];
    const price = Math.round(currentPrice * (1 + (Math.random() * 0.04 - 0.02)));
    await recordPriceHistory(weightGrams, price, dateStr);
  }
}

export async function addSubscriber(chatId: string): Promise<void> {
  await pool.query(
    `INSERT INTO telegram_subscribers (chat_id, subscribed_at) VALUES ($1, $2) ON CONFLICT (chat_id) DO NOTHING`,
    [chatId, new Date().toISOString()],
  );
}

export async function removeSubscriber(chatId: string): Promise<void> {
  await pool.query('DELETE FROM telegram_subscribers WHERE chat_id = $1', [chatId]);
}

export async function getSubscribers(): Promise<string[]> {
  const res = await pool.query('SELECT chat_id FROM telegram_subscribers');
  return res.rows.map(r => r.chat_id);
}
