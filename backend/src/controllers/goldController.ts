import { Request, Response, NextFunction } from 'express';
import * as goldService from '../services/goldService.js';
import { sendDailyNotification } from '../services/telegramService.js';

export async function getPrices(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const result = goldService.getPrices();
    res.json({
      data: result.prices,
      updatedAt: result.updatedAt,
      isMockData: result.isMockData,
    });
  } catch (err) {
    next(err);
  }
}

export async function getPriceHistory(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const weightGrams = parseInt(req.query.weight as string || '1', 10);
    if (isNaN(weightGrams) || weightGrams <= 0) {
      res.status(400).json({ error: 'Invalid weight parameter' });
      return;
    }
    const history = goldService.getPriceHistory(weightGrams);
    res.json({ data: history });
  } catch (err) {
    next(err);
  }
}

export async function getCities(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const cities = goldService.getCities();
    res.json({ data: cities });
  } catch (err) {
    next(err);
  }
}

export async function getBanks(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const city = req.query.city as string | undefined;
    const weightParam = req.query.weight as string | undefined;
    const weightGrams = weightParam ? parseInt(weightParam, 10) : undefined;

    if (weightGrams !== undefined && isNaN(weightGrams)) {
      res.status(400).json({ error: 'Invalid weight parameter' });
      return;
    }

    const result = goldService.getBanksWithAvailability(city, weightGrams);
    res.json({
      data: result.banks,
      updatedAt: result.updatedAt,
      isMockData: result.isMockData,
    });
  } catch (err) {
    next(err);
  }
}

export async function getStatus(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const status = goldService.getStatus();
    res.json(status);
  } catch (err) {
    next(err);
  }
}

export async function triggerRefresh(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    await goldService.refreshData();
    res.json({ message: 'Data refreshed successfully' });
  } catch (err) {
    next(err);
  }
}

export async function sendTelegramTest(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    await sendDailyNotification();
    res.json({ message: 'Telegram notification sent' });
  } catch (err) {
    next(err);
  }
}
