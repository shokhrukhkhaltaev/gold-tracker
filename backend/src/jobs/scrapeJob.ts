import cron from 'node-cron';
import { refreshData } from '../services/goldService.js';

// 10:00 and 17:00 Tashkent (GMT+5) = 05:00 and 12:00 UTC
// CBU updates their prices around 09:35 Tashkent, so 10:00 ensures we get today's data
const CRON_SCHEDULE = process.env.CRON_SCHEDULE || '0 5,12 * * *';

export function startScrapeJob(): void {
  cron.schedule(CRON_SCHEDULE, async () => {
    console.log('[CronJob] Starting scheduled gold data refresh...');
    try {
      await refreshData();
      console.log('[CronJob] Scheduled refresh completed successfully.');
    } catch (err) {
      console.error('[CronJob] Scheduled refresh failed:', err);
    }
  });

  console.log(`[CronJob] Scrape job scheduled: ${CRON_SCHEDULE} UTC (10:00 & 17:00 Tashkent)`);
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
