import cron from 'node-cron';
import { sendDailyPrices } from '../services/telegramService.js';

// Every day at 11:00 Tashkent time
export function startTelegramJob(): void {
  // 11:00 Tashkent (GMT+5) = 06:00 UTC
  cron.schedule('0 6 * * *', async () => {
    console.log('[TelegramJob] Sending daily notification...');
    try {
      await sendDailyPrices();
    } catch (err) {
      console.error('[TelegramJob] Failed to send notification:', err);
    }
  });

  console.log('[TelegramJob] Scheduled: 06:00 UTC (11:00 Tashkent) every day');
}
