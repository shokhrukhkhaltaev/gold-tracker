import Database from 'better-sqlite3';
import path from 'path';
import fs from 'fs';

const DATA_DIR = process.env.DATA_DIR || path.join(process.cwd(), 'data');

if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}

const db = new Database(path.join(DATA_DIR, 'gold.db'));

db.pragma('journal_mode = WAL');
db.pragma('foreign_keys = ON');

export function initDatabase(): void {
  db.exec(`
    CREATE TABLE IF NOT EXISTS banks (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      short_name TEXT NOT NULL,
      UNIQUE(name)
    );

    CREATE TABLE IF NOT EXISTS branches (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      bank_id INTEGER NOT NULL,
      city TEXT NOT NULL,
      address TEXT NOT NULL DEFAULT '',
      phone TEXT NOT NULL DEFAULT '',
      FOREIGN KEY (bank_id) REFERENCES banks(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS gold_prices (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      weight_grams INTEGER NOT NULL,
      price_uzs INTEGER NOT NULL,
      updated_at TEXT NOT NULL,
      UNIQUE(weight_grams)
    );

    CREATE TABLE IF NOT EXISTS gold_availability (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      branch_id INTEGER NOT NULL,
      weight_grams INTEGER NOT NULL,
      quantity INTEGER NOT NULL DEFAULT 0,
      price_uzs INTEGER NOT NULL DEFAULT 0,
      updated_at TEXT NOT NULL,
      FOREIGN KEY (branch_id) REFERENCES branches(id) ON DELETE CASCADE,
      UNIQUE(branch_id, weight_grams)
    );

    CREATE TABLE IF NOT EXISTS price_history (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      weight_grams INTEGER NOT NULL,
      price_uzs INTEGER NOT NULL,
      date TEXT NOT NULL,
      UNIQUE(weight_grams, date)
    );
  `);
}

export default db;
