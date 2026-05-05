import db from '../config/database.js';
import {
  GoldPrice,
  GoldAvailability,
  PriceHistoryEntry,
  BankWithAvailability,
  ScrapedGoldData,
} from '../types/index.js';

export function upsertBank(name: string, shortName: string): number {
  const existing = db.prepare('SELECT id FROM banks WHERE name = ?').get(name) as { id: number } | null;
  if (existing) return existing.id;
  const result = db.prepare('INSERT INTO banks (name, short_name) VALUES (?, ?)').run([name, shortName]);
  return result.lastInsertRowid as number;
}

export function upsertBranch(bankId: number, city: string, address: string, phone: string): number {
  const existing = db.prepare(
    'SELECT id FROM branches WHERE bank_id = ? AND city = ? AND address = ?'
  ).get([bankId, city, address]) as { id: number } | null;

  if (existing) {
    db.prepare('UPDATE branches SET phone = ? WHERE id = ?').run([phone, existing.id]);
    return existing.id;
  }
  const result = db.prepare(
    'INSERT INTO branches (bank_id, city, address, phone) VALUES (?, ?, ?, ?)'
  ).run([bankId, city, address, phone]);
  return result.lastInsertRowid as number;
}

export function upsertGoldPrice(weightGrams: number, priceUzs: number): void {
  const now = new Date().toISOString();
  db.prepare(`
    INSERT INTO gold_prices (weight_grams, price_uzs, updated_at)
    VALUES (?, ?, ?)
    ON CONFLICT(weight_grams) DO UPDATE SET price_uzs = excluded.price_uzs, updated_at = excluded.updated_at
  `).run([weightGrams, priceUzs, now]);
}

export function upsertAvailability(branchId: number, weightGrams: number, quantity: number, priceUzs: number): void {
  const now = new Date().toISOString();
  db.prepare(`
    INSERT INTO gold_availability (branch_id, weight_grams, quantity, price_uzs, updated_at)
    VALUES (?, ?, ?, ?, ?)
    ON CONFLICT(branch_id, weight_grams) DO UPDATE SET
      quantity = excluded.quantity,
      price_uzs = excluded.price_uzs,
      updated_at = excluded.updated_at
  `).run([branchId, weightGrams, quantity, priceUzs, now]);
}

export function recordPriceHistory(weightGrams: number, priceUzs: number, date: string): void {
  db.prepare(`
    INSERT INTO price_history (weight_grams, price_uzs, date)
    VALUES (?, ?, ?)
    ON CONFLICT(weight_grams, date) DO UPDATE SET price_uzs = excluded.price_uzs
  `).run([weightGrams, priceUzs, date]);
}

export function getAllPrices(): GoldPrice[] {
  const rows = db.prepare(`
    SELECT weight_grams as weightGrams, price_uzs as priceUzs, updated_at as updatedAt
    FROM gold_prices
    ORDER BY weight_grams ASC
  `).all() as unknown as GoldPrice[];
  return rows;
}

export function getPriceHistory(weightGrams: number, days = 15): PriceHistoryEntry[] {
  const rows = db.prepare(`
    SELECT weight_grams as weightGrams, price_uzs as priceUzs, date
    FROM price_history
    WHERE weight_grams = ?
    ORDER BY date DESC
    LIMIT ?
  `).all([weightGrams, days]) as unknown as PriceHistoryEntry[];
  return rows.reverse();
}

export function getAllCities(): string[] {
  const rows = db.prepare(`
    SELECT DISTINCT city FROM branches
    WHERE city NOT LIKE '%гр%'
      AND city NOT LIKE '%г.%'
      AND length(city) > 3
    ORDER BY city ASC
  `).all() as { city: string }[];
  return rows.map(r => r.city);
}

export function getAvailabilityGrouped(city?: string, weightGrams?: number): BankWithAvailability[] {
  let query = `
    SELECT
      b.name as bankName,
      b.short_name as bankShortName,
      br.city,
      br.id as branchId,
      br.address,
      br.phone,
      ga.weight_grams as weightGrams,
      ga.quantity,
      ga.price_uzs as priceUzs,
      ga.updated_at as updatedAt
    FROM gold_availability ga
    JOIN branches br ON ga.branch_id = br.id
    JOIN banks b ON br.bank_id = b.id
    WHERE 1=1
  `;

  const params: (string | number)[] = [];
  if (city) { query += ' AND br.city = ?'; params.push(city); }
  if (weightGrams) { query += ' AND ga.weight_grams = ?'; params.push(weightGrams); }
  query += ' ORDER BY b.name, br.city, br.id';

  const rows = db.prepare(query).all(params.length ? params : undefined) as Array<{
    bankName: string;
    bankShortName: string;
    city: string;
    branchId: number;
    address: string;
    phone: string;
    weightGrams: number;
    quantity: number;
    priceUzs: number;
    updatedAt: string;
  }>;

  // Group by bankName only (all cities under one card)
  const groupMap = new Map<string, BankWithAvailability>();

  for (const row of rows) {
    const key = row.bankName;
    if (!groupMap.has(key)) {
      groupMap.set(key, {
        bankName: row.bankName,
        bankShortName: row.bankShortName,
        totalQuantity: 0,
        hasAvailability: false,
        branches: [],
      });
    }
    const group = groupMap.get(key)!;

    let branch = group.branches.find(br => br.branchId === row.branchId);
    if (!branch) {
      branch = { branchId: row.branchId, city: row.city, address: row.address, phone: row.phone, quantity: 0, available: false };
      group.branches.push(branch);
    }
    branch.quantity += row.quantity;
    branch.available = branch.available || row.quantity > 0;
    group.totalQuantity += row.quantity;
    group.hasAvailability = group.hasAvailability || row.quantity > 0;
  }

  const result = Array.from(groupMap.values())
    .filter(b => b.hasAvailability)
    .sort((a, b) => a.bankName.localeCompare(b.bankName, 'ru'));

  return result;
}

export function getAvailabilityUpdatedAt(): string {
  const row = db.prepare('SELECT MAX(updated_at) as ts FROM gold_availability').get() as { ts: string | null } | null;
  return row?.ts ?? new Date().toISOString();
}

export function persistScrapedData(data: ScrapedGoldData): void {
  const today = new Date().toISOString().split('T')[0];

  db.exec('BEGIN');
  try {
    for (const price of data.prices) {
      upsertGoldPrice(price.weightGrams, price.priceUzs);
      recordPriceHistory(price.weightGrams, price.priceUzs, today);
    }

    for (const item of data.availability) {
      const bankId = upsertBank(item.bankName, item.bankShortName);
      const branchId = upsertBranch(bankId, item.city, item.address, item.phone);
      upsertAvailability(branchId, item.weightGrams, item.quantity, item.priceUzs);
    }
    db.exec('COMMIT');
  } catch (e) {
    db.exec('ROLLBACK');
    throw e;
  }
}

export function hasPriceHistory(weightGrams: number): boolean {
  const row = db.prepare('SELECT COUNT(*) as cnt FROM price_history WHERE weight_grams = ?').get(weightGrams) as { cnt: number };
  return row.cnt > 0;
}

export function seedPriceHistory(weightGrams: number, currentPrice: number): void {
  const today = new Date();
  for (let i = 14; i >= 0; i--) {
    const d = new Date(today);
    d.setDate(d.getDate() - i);
    const dateStr = d.toISOString().split('T')[0];
    const variation = 1 + (Math.random() * 0.04 - 0.02); // ±2%
    const price = Math.round(currentPrice * variation);
    recordPriceHistory(weightGrams, price, dateStr);
  }
}
