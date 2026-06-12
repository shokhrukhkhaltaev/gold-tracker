import 'dotenv/config';
import app from './app.js';
import { initDatabase } from './config/database.js';
import { refreshData } from './services/goldService.js';
import { startScrapeJob } from './jobs/scrapeJob.js';
import { startTelegramJob } from './jobs/telegramJob.js';
import { registerWebhook } from './services/telegramService.js';

const PORT = parseInt(process.env.PORT || '3001', 10);

async function main() {
  if (!process.env.DATABASE_URL) {
    console.error('[Server] FATAL: DATABASE_URL is not set. Add a PostgreSQL service in Railway.');
    process.exit(1);
  }

  console.log('[Server] Initializing database...');
  await initDatabase();

  console.log('[Server] Loading initial gold data...');
  await refreshData();

  startScrapeJob();
  startTelegramJob();

  const baseUrl = process.env.RAILWAY_PUBLIC_DOMAIN
    ? `https://${process.env.RAILWAY_PUBLIC_DOMAIN}`
    : process.env.RENDER_EXTERNAL_URL ?? `https://gold-tracker-d0bv.onrender.com`;
  registerWebhook(baseUrl).catch(err => console.error('[Server] Webhook registration failed:', err));

  app.listen(PORT, () => {
    console.log(`[Server] Running on http://localhost:${PORT}`);
    console.log(`[Server] API available at http://localhost:${PORT}/api`);
  });
}

main().catch(err => {
  console.error('[Server] Fatal startup error:', err);
  process.exit(1);
});
