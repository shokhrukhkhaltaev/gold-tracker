import { scrapeGoldData } from '../scrapers/cbuScraper.js';
import * as repo from '../repositories/goldRepository.js';
import { GoldPrice, PriceHistoryEntry, BankWithAvailability } from '../types/index.js';

let lastScrapeTime: Date | null = null;
let isMockData = false;
let lastScrapeError: string | null = null;

export async function refreshData(): Promise<void> {
  console.log('[GoldService] Starting data refresh...');
  const { data, isMockData: mock, error } = await scrapeGoldData();
  isMockData = mock;
  lastScrapeError = error ?? null;

  await repo.persistScrapedData(data);

  for (const price of data.prices) {
    if (!(await repo.hasPriceHistory(price.weightGrams))) {
      await repo.seedPriceHistory(price.weightGrams, price.priceUzs);
    }
  }

  lastScrapeTime = new Date();
  console.log(`[GoldService] Data refresh complete. Source: ${mock ? 'mock' : 'CBU'}`);
}

export async function getPrices(): Promise<{ prices: GoldPrice[]; updatedAt: string; isMockData: boolean }> {
  const prices = await repo.getAllPrices();
  const updatedAt = prices[0]?.updatedAt ?? new Date().toISOString();
  return { prices, updatedAt, isMockData };
}

export async function getPriceHistory(weightGrams: number): Promise<PriceHistoryEntry[]> {
  return repo.getPriceHistory(weightGrams, 15);
}

export async function getCities(): Promise<string[]> {
  return repo.getAllCities();
}

export async function getBanksWithAvailability(city?: string, weightGrams?: number): Promise<{
  banks: BankWithAvailability[];
  updatedAt: string;
  isMockData: boolean;
}> {
  const banks = await repo.getAvailabilityGrouped(city, weightGrams);
  const updatedAt = await repo.getAvailabilityUpdatedAt();
  return { banks, updatedAt, isMockData };
}

export function getStatus(): { lastScrape: string | null; isMockData: boolean; lastError: string | null } {
  return {
    lastScrape: lastScrapeTime?.toISOString() ?? null,
    isMockData,
    lastError: lastScrapeError,
  };
}
