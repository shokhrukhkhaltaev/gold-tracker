import cron from 'node-cron';
import { sendDailyPrices } from '../services/telegramService.js';

// Every day at 11:00 Tashkent time
export function startTelegramJob(): void {
  // 11:10 Tashkent (GMT+5) = 06:10 UTC — 10 min after scrape finishes
  cron.schedule('10 6 * * *', async () => {
    console.log('[TelegramJob] Sending daily notification...');
    try {
      await sendDailyPrices();
    } catch (err) {
      console.error('[TelegramJob] Failed to send notification:', err);
    }
  });

  console.log('[TelegramJob] Scheduled: 06:10 UTC (11:10 Tashkent) every day');
}
