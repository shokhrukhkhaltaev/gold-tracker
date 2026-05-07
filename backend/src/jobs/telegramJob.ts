import cron from 'node-cron';
import { sendDailyPrices } from '../services/telegramService.js';

// Every day at 11:00 Tashkent time
export function startTelegramJob(): void {
  cron.schedule('0 11 * * *', async () => {
    console.log('[TelegramJob] Sending daily notification...');
    try {
      await sendDailyPrices();
    } catch (err) {
      console.error('[TelegramJob] Failed to send notification:', err);
    }
  }, {
    timezone: 'Asia/Tashkent',
  });

  console.log('[TelegramJob] Scheduled: 11:00 Asia/Tashkent every day');
}
