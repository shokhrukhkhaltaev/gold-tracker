import { useState, useEffect, useCallback } from 'react';
import { fetchPrices, fetchBanks, fetchCities, fetchPriceHistory } from '../api/goldApi.js';
import { GoldPrice, BankWithAvailability, PriceHistoryEntry } from '../types/index.js';

interface UsePricesReturn {
  prices: GoldPrice[];
  updatedAt: string;
  isMockData: boolean;
  loading: boolean;
  error: string | null;
}

export function usePrices(): UsePricesReturn {
  const [prices, setPrices] = useState<GoldPrice[]>([]);
  const [updatedAt, setUpdatedAt] = useState('');
  const [isMockData, setIsMockData] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchPrices()
      .then(res => {
        setPrices(res.data);
        setUpdatedAt(res.updatedAt ?? '');
        setIsMockData(res.isMockData ?? false);
      })
      .catch(err => setError(err.message))
      .finally(() => setLoading(false));
  }, []);

  return { prices, updatedAt, isMockData, loading, error };
}

interface UsePriceHistoryReturn {
  history: PriceHistoryEntry[];
  loading: boolean;
  error: string | null;
}

export function usePriceHistory(weightGrams: number): UsePriceHistoryReturn {
  const [history, setHistory] = useState<PriceHistoryEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setLoading(true);
    setError(null);
    fetchPriceHistory(weightGrams)
      .then(res => setHistory(res.data))
      .catch(err => setError(err.message))
      .finally(() => setLoading(false));
  }, [weightGrams]);

  return { history, loading, error };
}

interface UseBanksReturn {
  banks: BankWithAvailability[];
  updatedAt: string;
  isMockData: boolean;
  loading: boolean;
  error: string | null;
  refetch: () => void;
}

export function useBanks(city?: string, weight?: number): UseBanksReturn {
  const [banks, setBanks] = useState<BankWithAvailability[]>([]);
  const [updatedAt, setUpdatedAt] = useState('');
  const [isMockData, setIsMockData] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetch_ = useCallback(() => {
    setLoading(true);
    setError(null);
    fetchBanks({ city, weight })
      .then(res => {
        setBanks(res.data);
        setUpdatedAt(res.updatedAt ?? '');
        setIsMockData(res.isMockData ?? false);
      })
      .catch(err => setError(err.message))
      .finally(() => setLoading(false));
  }, [city, weight]);

  useEffect(() => { fetch_(); }, [fetch_]);

  return { banks, updatedAt, isMockData, loading, error, refetch: fetch_ };
}

interface UseCitiesReturn {
  cities: string[];
  loading: boolean;
}

export function useCities(): UseCitiesReturn {
  const [cities, setCities] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchCities()
      .then(res => setCities(res.data))
      .catch(() => { /* non-critical */ })
      .finally(() => setLoading(false));
  }, []);

  return { cities, loading };
}
