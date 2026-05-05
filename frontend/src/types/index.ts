export interface GoldPrice {
  weightGrams: number;
  priceUzs: number;
  updatedAt: string;
}

export interface PriceHistoryEntry {
  weightGrams: number;
  priceUzs: number;
  date: string;
}

export interface BranchAvailability {
  branchId: number;
  city: string;
  address: string;
  phone: string;
  quantity: number;
  available: boolean;
}

export interface BankWithAvailability {
  bankName: string;
  bankShortName: string;
  totalQuantity: number;
  hasAvailability: boolean;
  branches: BranchAvailability[];
}

export interface ApiResponse<T> {
  data: T;
  updatedAt?: string;
  isMockData?: boolean;
}
