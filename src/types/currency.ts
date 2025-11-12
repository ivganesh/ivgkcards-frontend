export interface CurrencySummary {
  id: string;
  code: string;
  name: string;
  symbol: string;
  isActive: boolean;
  createdAt: string;
}

export interface CurrencyFormValues {
  code: string;
  name: string;
  symbol: string;
  isActive: boolean;
}

