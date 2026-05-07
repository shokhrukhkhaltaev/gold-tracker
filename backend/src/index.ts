import 'dotenv/config';
import app from './app.js';
import { initDatabase } from './config/database.js';
import { refreshData } from './services/goldService.js';
import { startScrapeJob } from './jobs/scrapeJob.js';
import { startTelegramJob } from './jobs/telegramJob.js';

const PORT = parseInt(process.env.PORT || '3001', 10);

async function main() {
  console.log('[Server] Initializing database...');
  initDatabase();

  console.log('[Server] Loading initial gold data...');
  await refreshData();

  startScrapeJob();
  startTelegramJob();

  app.listen(PORT, () => {
    console.log(`[Server] Running on http://localhost:${PORT}`);
    console.log(`[Server] API available at http://localhost:${PORT}/api`);
  });
}

main().catch(err => {
  console.error('[Server] Fatal startup error:', err);
  process.exit(1);
});
