export type TransactionType = 'sale' | 'expense';

export interface Transaction {
  id: string;
  ts: number;
  date: string; // YYYY-MM-DD
  type: TransactionType;
  item: string;
  quantity: number;
  sellingPricePerUnit: number | null;
  costPricePerUnit: number | null;
  expenseAmount: number | null;
  note: string;
  imageUrl?: string;
}

export interface ReportAgg {
  monthKey: string;
  revenue: number;
  cost: number;
  profit: number;
  margin: number;
  items: {
    item: string;
    qty: number;
    revenue: number;
    cost: number;
    profit: number;
    margin: number;
  }[];
}

export interface UserSettings {
  companyName: string;
  companyAddress: string;
  currency: string;
  taxId: string;
  role: string;
  catalog?: { item: string; price: number; cost: number }[];
}
