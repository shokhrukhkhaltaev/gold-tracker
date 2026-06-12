import { Pool } from 'pg';

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.DATABASE_URL ? { rejectUnauthorized: false } : false,
});

export async function initDatabase(): Promise<void> {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS banks (
      id SERIAL PRIMARY KEY,
      name TEXT NOT NULL,
      short_name TEXT NOT NULL,
      UNIQUE(name)
    );

    CREATE TABLE IF NOT EXISTS branches (
      id SERIAL PRIMARY KEY,
      bank_id INTEGER NOT NULL,
      city TEXT NOT NULL,
      address TEXT NOT NULL DEFAULT '',
      phone TEXT NOT NULL DEFAULT '',
      UNIQUE(bank_id, city, address),
      FOREIGN KEY (bank_id) REFERENCES banks(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS gold_prices (
      id SERIAL PRIMARY KEY,
      weight_grams INTEGER NOT NULL,
      price_uzs BIGINT NOT NULL,
      updated_at TEXT NOT NULL,
      UNIQUE(weight_grams)
    );

    CREATE TABLE IF NOT EXISTS gold_availability (
      id SERIAL PRIMARY KEY,
      branch_id INTEGER NOT NULL,
      weight_grams INTEGER NOT NULL,
      quantity INTEGER NOT NULL DEFAULT 0,
      price_uzs BIGINT NOT NULL DEFAULT 0,
      updated_at TEXT NOT NULL,
      UNIQUE(branch_id, weight_grams),
      FOREIGN KEY (branch_id) REFERENCES branches(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS price_history (
      id SERIAL PRIMARY KEY,
      weight_grams INTEGER NOT NULL,
      price_uzs BIGINT NOT NULL,
      date TEXT NOT NULL,
      UNIQUE(weight_grams, date)
    );

    CREATE TABLE IF NOT EXISTS telegram_subscribers (
      id SERIAL PRIMARY KEY,
      chat_id TEXT UNIQUE NOT NULL,
      subscribed_at TEXT NOT NULL
    );
  `);
}

export default pool;
