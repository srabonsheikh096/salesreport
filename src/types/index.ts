export interface Product {
  id: string;
  name: string;
  category: string;
  unit: string;
  costPrice: number;       // ক্রয়মূল্য (কেনা দাম)
  sellingPrice: number;    // সাধারণ বিক্রয়মূল্য
  stock: number;           // বর্তমান স্টক
  initialStock: number;    // প্রারম্ভিক স্টক
  minStockAlert: number;   // সতর্কবার্তা লেভেল
  createdAt: string;
}

export interface SaleRecord {
  id: string;
  productId: string;
  productName: string;
  date: string;            // YYYY-MM-DD
  quantity: number;        // বিক্রির পরিমাণ
  unitCostPrice: number;   // সেদিনের ক্রয়মূল্য
  sellingPrice: number;    // সেদিনের বিক্রয়মূল্য (সেদিন প্রাইস দিব)
  totalRevenue: number;    // মোট বিক্রয় = quantity * sellingPrice
  totalCost: number;       // মোট খরচ = quantity * unitCostPrice
  profit: number;          // লাভ = totalRevenue - totalCost
  customerNote?: string;
  createdAt: string;
}

export interface RestockRecord {
  id: string;
  productId: string;
  productName: string;
  date: string;
  quantity: number;
  unitCostPrice: number;
  totalCost: number;
  note?: string;
  createdAt: string;
}

export interface MonthlySummary {
  monthKey: string;        // YYYY-MM
  monthName: string;
  totalSalesCount: number;
  totalItemsSold: number;
  totalRevenue: number;
  totalCost: number;
  netProfit: number;
  profitMargin: number;    // percentage
  topProduct?: {
    name: string;
    profit: number;
  };
}

export interface GoogleSheetMeta {
  spreadsheetId: string;
  spreadsheetUrl: string;
  title: string;
  lastSyncedAt: string | null;
}
