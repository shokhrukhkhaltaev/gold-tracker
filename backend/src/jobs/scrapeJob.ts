import cron from 'node-cron';
import { refreshData } from '../services/goldService.js';

// Run at 09:00 Uzbekistan time (UTC+5 = 04:00 UTC) every day
const CRON_SCHEDULE = process.env.CRON_SCHEDULE || '0 4 * * *';

export function startScrapeJob(): void {
  cron.schedule(CRON_SCHEDULE, async () => {
    console.log('[CronJob] Starting scheduled gold data refresh...');
    try {
      await refreshData();
      console.log('[CronJob] Scheduled refresh completed successfully.');
    } catch (err) {
      console.error('[CronJob] Scheduled refresh failed:', err);
    }
  }, {
    timezone: 'Asia/Tashkent',
  });

  console.log(`[CronJob] Scrape job scheduled: ${CRON_SCHEDULE} (Asia/Tashkent)`);
}

// Allow running as standalone script
if (require.main === module) {
  (async () => {
    console.log('[ScrapeJob] Running one-off scrape...');
    await refreshData();
    console.log('[ScrapeJob] Done.');
    process.exit(0);
  })();
}
