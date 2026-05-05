import { ApiResponse, BankWithAvailability, GoldPrice, PriceHistoryEntry } from '../types/index.js';

const BASE_URL = (import.meta.env.VITE_API_URL as string | undefined) ?? '/api';

async function apiFetch<T>(path: string): Promise<T> {
  const res = await fetch(`${BASE_URL}${path}`);
  if (!res.ok) {
    const body = await res.json().catch(() => ({ error: res.statusText }));
    throw new Error(body.error ?? `Request failed: ${res.status}`);
  }
  return res.json() as Promise<T>;
}

export async function fetchPrices(): Promise<ApiResponse<GoldPrice[]>> {
  return apiFetch('/prices');
}

export async function fetchPriceHistory(weightGrams: number): Promise<ApiResponse<PriceHistoryEntry[]>> {
  return apiFetch(`/prices/history?weight=${weightGrams}`);
}

export async function fetchCities(): Promise<ApiResponse<string[]>> {
  return apiFetch('/cities');
}

export async function fetchBanks(params?: { city?: string; weight?: number }): Promise<ApiResponse<BankWithAvailability[]>> {
  const qs = new URLSearchParams();
  if (params?.city) qs.set('city', params.city);
  if (params?.weight) qs.set('weight', String(params.weight));
  const query = qs.toString() ? `?${qs.toString()}` : '';
  return apiFetch(`/banks${query}`);
}
