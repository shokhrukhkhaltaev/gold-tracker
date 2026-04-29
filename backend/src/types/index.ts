export interface Bank {
  id: number;
  name: string;
  shortName: string;
}

export interface Branch {
  id: number;
  bankId: number;
  bankName: string;
  bankShortName: string;
  city: string;
  address: string;
  phone: string;
}

export interface GoldPrice {
  weightGrams: number;
  priceUzs: number;
  updatedAt: string;
}

export interface GoldAvailability {
  id: number;
  branchId: number;
  bankName: string;
  bankShortName: string;
  city: string;
  address: string;
  phone: string;
  weightGrams: number;
  quantity: number;
  priceUzs: number;
  updatedAt: string;
}

export interface PriceHistoryEntry {
  date: string;
  priceUzs: number;
  weightGrams: number;
}

export interface BranchAvailability {
  branchId: number;
  address: string;
  phone: string;
  quantity: number;
  available: boolean;
}

export interface BankWithAvailability {
  bankName: string;
  bankShortName: string;
  city: string;
  totalQuantity: number;
  hasAvailability: boolean;
  branches: BranchAvailability[];
}

export interface ScrapedAvailabilityItem {
  bankName: string;
  bankShortName: string;
  city: string;
  address: string;
  phone: string;
  weightGrams: number;
  quantity: number;
  priceUzs: number;
}

export interface ScrapedGoldData {
  prices: { weightGrams: number; priceUzs: number }[];
  availability: ScrapedAvailabilityItem[];
}

export interface ApiResponse<T> {
  data: T;
  updatedAt: string;
  isMockData?: boolean;
}
