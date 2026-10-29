import { Product, SaleRecord, MonthlySummary, GoogleSheetMeta } from '../types';

const PRODUCTS_KEY = 'smart_stock_products_v1';
const SALES_KEY = 'smart_stock_sales_v1';
const SHEET_META_KEY = 'smart_stock_sheet_meta_v1';
const CURRENCY_KEY = 'smart_stock_currency_v1';

export const INITIAL_PRODUCTS: Product[] = [
  {
    id: 'prod-1',
    name: 'তীর সয়াবিন তেল (৫ লিটার)',
    category: 'তেল ও ঘি',
    unit: 'বোতল',
    costPrice: 780,
    sellingPrice: 840,
    stock: 24,
    initialStock: 30,
    minStockAlert: 5,
    createdAt: new Date().toISOString(),
  },
  {
    id: 'prod-2',
    name: 'মিনিকেট চাল (৫০ কেজি বস্তা)',
    category: 'চাল ও ডাল',
    unit: 'বস্তা',
    costPrice: 3150,
    sellingPrice: 3400,
    stock: 15,
    initialStock: 20,
    minStockAlert: 4,
    createdAt: new Date().toISOString(),
  },
  {
    id: 'prod-3',
    name: 'দেশি চিনি (১ কেজি প্যাকেট)',
    category: 'মুদি পণ্য',
    unit: 'প্যাকেট',
    costPrice: 130,
    sellingPrice: 145,
    stock: 45,
    initialStock: 60,
    minStockAlert: 10,
    createdAt: new Date().toISOString(),
  },
  {
    id: 'prod-4',
    name: 'ইস্পাহানি মির্জাপুর চা (৪০০ গ্রাম)',
    category: 'চা ও পানীয়',
    unit: 'প্যাকেট',
    costPrice: 210,
    sellingPrice: 240,
    stock: 8,
    initialStock: 25,
    minStockAlert: 5,
    createdAt: new Date().toISOString(),
  },
  {
    id: 'prod-5',
    name: 'মসুর ডাল প্রিমিয়াম (১ কেজি)',
    category: 'চাল ও ডাল',
    unit: 'কেজি',
    costPrice: 125,
    sellingPrice: 140,
    stock: 35,
    initialStock: 50,
    minStockAlert: 8,
    createdAt: new Date().toISOString(),
  }
];

export const INITIAL_SALES: SaleRecord[] = [
  {
    id: 'sale-1',
    productId: 'prod-1',
    productName: 'তীর সয়াবিন তেল (৫ লিটার)',
    date: new Date().toISOString().split('T')[0],
    quantity: 3,
    unitCostPrice: 780,
    sellingPrice: 840,
    totalRevenue: 2520,
    totalCost: 2340,
    profit: 180,
    customerNote: 'ক্যাশ সেল',
    createdAt: new Date().toISOString(),
  },
  {
    id: 'sale-2',
    productId: 'prod-2',
    productName: 'মিনিকেট চাল (৫০ কেজি বস্তা)',
    date: new Date().toISOString().split('T')[0],
    quantity: 2,
    unitCostPrice: 3150,
    sellingPrice: 3450,
    totalRevenue: 6900,
    totalCost: 6300,
    profit: 600,
    customerNote: 'হোম ডেলিভারি',
    createdAt: new Date().toISOString(),
  },
  {
    id: 'sale-3',
    productId: 'prod-3',
    productName: 'দেশি চিনি (১ কেজি প্যাকেট)',
    date: new Date(Date.now() - 86400000).toISOString().split('T')[0],
    quantity: 10,
    unitCostPrice: 130,
    sellingPrice: 145,
    totalRevenue: 1450,
    totalCost: 1300,
    profit: 150,
    createdAt: new Date(Date.now() - 86400000).toISOString(),
  },
  {
    id: 'sale-4',
    productId: 'prod-4',
    productName: 'ইস্পাহানি মির্জাপুর চা (৪০০ গ্রাম)',
    date: new Date(Date.now() - 86400000 * 2).toISOString().split('T')[0],
    quantity: 5,
    unitCostPrice: 210,
    sellingPrice: 240,
    totalRevenue: 1200,
    totalCost: 1050,
    profit: 150,
    createdAt: new Date(Date.now() - 86400000 * 2).toISOString(),
  }
];

export function getStoredProducts(): Product[] {
  try {
    const data = localStorage.getItem(PRODUCTS_KEY);
    if (!data) {
      localStorage.setItem(PRODUCTS_KEY, JSON.stringify(INITIAL_PRODUCTS));
      return INITIAL_PRODUCTS;
    }
    return JSON.parse(data);
  } catch {
    return INITIAL_PRODUCTS;
  }
}

export function saveProducts(products: Product[]) {
  localStorage.setItem(PRODUCTS_KEY, JSON.stringify(products));
}

export function getStoredSales(): SaleRecord[] {
  try {
    const data = localStorage.getItem(SALES_KEY);
    if (!data) {
      localStorage.setItem(SALES_KEY, JSON.stringify(INITIAL_SALES));
      return INITIAL_SALES;
    }
    return JSON.parse(data);
  } catch {
    return INITIAL_SALES;
  }
}

export function saveSales(sales: SaleRecord[]) {
  localStorage.setItem(SALES_KEY, JSON.stringify(sales));
}

export function getStoredSheetMeta(): GoogleSheetMeta | null {
  try {
    const data = localStorage.getItem(SHEET_META_KEY);
    return data ? JSON.parse(data) : null;
  } catch {
    return null;
  }
}

export function saveGoogleSheetMeta(meta: GoogleSheetMeta | null) {
  if (!meta) {
    localStorage.removeItem(SHEET_META_KEY);
  } else {
    localStorage.setItem(SHEET_META_KEY, JSON.stringify(meta));
  }
}

export function getStoredCurrency(): string {
  return localStorage.getItem(CURRENCY_KEY) || '৳';
}

export function saveStoredCurrency(currency: string) {
  localStorage.setItem(CURRENCY_KEY, currency);
}

const BENGALI_MONTHS: Record<string, string> = {
  '01': 'জানুয়ারি',
  '02': 'ফেব্রুয়ারি',
  '03': 'মার্চ',
  '04': 'এপ্রিল',
  '05': 'মে',
  '06': 'জুন',
  '07': 'জুলাই',
  '08': 'আগস্ট',
  '09': 'সেপ্টেম্বর',
  '10': 'অক্টোবর',
  '11': 'নভেম্বর',
  '12': 'ডিসেম্বর',
};

export function computeMonthlySummaries(sales: SaleRecord[]): MonthlySummary[] {
  const map: Record<string, {
    count: number;
    items: number;
    revenue: number;
    cost: number;
    profit: number;
    productProfits: Record<string, number>;
  }> = {};

  sales.forEach((s) => {
    const monthKey = s.date.slice(0, 7); // YYYY-MM
    if (!map[monthKey]) {
      map[monthKey] = {
        count: 0,
        items: 0,
        revenue: 0,
        cost: 0,
        profit: 0,
        productProfits: {},
      };
    }
    const entry = map[monthKey];
    entry.count += 1;
    entry.items += s.quantity;
    entry.revenue += s.totalRevenue;
    entry.cost += s.totalCost;
    entry.profit += s.profit;
    entry.productProfits[s.productName] = (entry.productProfits[s.productName] || 0) + s.profit;
  });

  const monthKeys = Object.keys(map).sort().reverse();

  return monthKeys.map((key) => {
    const entry = map[key];
    const [year, month] = key.split('-');
    const bnMonth = BENGALI_MONTHS[month] || month;
    const monthName = `${bnMonth} ${year}`;

    let topProdName = '';
    let topProdProfit = -Infinity;
    Object.entries(entry.productProfits).forEach(([pName, pProfit]) => {
      if (pProfit > topProdProfit) {
        topProdProfit = pProfit;
        topProdName = pName;
      }
    });

    const margin = entry.revenue > 0 ? (entry.profit / entry.revenue) * 100 : 0;

    return {
      monthKey: key,
      monthName,
      totalSalesCount: entry.count,
      totalItemsSold: entry.items,
      totalRevenue: entry.revenue,
      totalCost: entry.cost,
      netProfit: entry.profit,
      profitMargin: margin,
      topProduct: topProdName ? { name: topProdName, profit: topProdProfit } : undefined,
    };
  });
}
