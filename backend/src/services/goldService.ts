import { scrapeGoldData } from '../scrapers/cbuScraper.js';
import * as repo from '../repositories/goldRepository.js';
import { GoldPrice, PriceHistoryEntry, BankWithAvailability } from '../types/index.js';

let lastScrapeTime: Date | null = null;
let isMockData = false;

export async function refreshData(): Promise<void> {
  console.log('[GoldService] Starting data refresh...');
  const { data, isMockData: mock } = await scrapeGoldData();
  isMockData = mock;

  repo.persistScrapedData(data);

  // Seed history for any weight that has no history yet
  for (const price of data.prices) {
    if (!repo.hasPriceHistory(price.weightGrams)) {
      repo.seedPriceHistory(price.weightGrams, price.priceUzs);
    }
  }

  lastScrapeTime = new Date();
  console.log(`[GoldService] Data refresh complete. Source: ${mock ? 'mock' : 'CBU'}`);
}

export function getPrices(): { prices: GoldPrice[]; updatedAt: string; isMockData: boolean } {
  const prices = repo.getAllPrices();
  const updatedAt = prices[0]?.updatedAt ?? new Date().toISOString();
  return { prices, updatedAt, isMockData };
}

export function getPriceHistory(weightGrams: number): PriceHistoryEntry[] {
  return repo.getPriceHistory(weightGrams, 15);
}

export function getCities(): string[] {
  return repo.getAllCities();
}

export function getBanksWithAvailability(city?: string, weightGrams?: number): {
  banks: BankWithAvailability[];
  updatedAt: string;
  isMockData: boolean;
} {
  const banks = repo.getAvailabilityGrouped(city, weightGrams);
  const updatedAt = repo.getAvailabilityUpdatedAt();
  return { banks, updatedAt, isMockData };
}

export function getStatus(): { lastScrape: string | null; isMockData: boolean } {
  return {
    lastScrape: lastScrapeTime?.toISOString() ?? null,
    isMockData,
  };
}
