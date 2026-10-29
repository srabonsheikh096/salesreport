import React, { useState, useEffect } from 'react';
import {
  FileSpreadsheet,
  Plus,
  Layers,
  ShoppingCart,
  BarChart3,
  TrendingUp,
  PackageCheck,
  RefreshCw,
  ExternalLink,
  ShieldCheck,
  CheckCircle,
  AlertCircle
} from 'lucide-react';
import { User } from 'firebase/auth';

import { Product, SaleRecord, MonthlySummary, GoogleSheetMeta } from './types';
import {
  getStoredProducts,
  saveProducts,
  getStoredSales,
  saveSales,
  getStoredSheetMeta,
  saveGoogleSheetMeta,
  getStoredCurrency,
  saveStoredCurrency,
  computeMonthlySummaries,
} from './services/storage';
import { initAuth, logout, googleSignIn, setCachedAccessToken } from './services/auth';
import { syncAllDataToGoogleSheet } from './services/sheets';

import { ProductsTableView } from './components/ProductsTableView';
import { SalesLedgerView } from './components/SalesLedgerView';
import { MonthlyAnalyticsView } from './components/MonthlyAnalyticsView';
import { AddProductModal } from './components/AddProductModal';
import { NewSaleModal } from './components/NewSaleModal';
import { RestockModal } from './components/RestockModal';
import { GoogleSheetsSyncModal } from './components/GoogleSheetsSyncModal';
import { ConfirmationModal } from './components/ConfirmationModal';
import { GoogleSheetLivePreview } from './components/GoogleSheetLivePreview';

export default function App() {
  // Core state
  const [products, setProducts] = useState<Product[]>([]);
  const [sales, setSales] = useState<SaleRecord[]>([]);
  const [currency, setCurrency] = useState<string>('৳');
  const [sheetMeta, setSheetMeta] = useState<GoogleSheetMeta | null>(null);

  // Active view tab
  const [activeTab, setActiveTab] = useState<'inventory' | 'sales' | 'monthly' | 'sheet_preview'>('inventory');

  // Google Auth state
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isSyncingGlobal, setIsSyncingGlobal] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Modals state
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [isSaleModalOpen, setIsSaleModalOpen] = useState(false);
  const [saleDefaultProdId, setSaleDefaultProdId] = useState<string | undefined>(undefined);
  const [isRestockModalOpen, setIsRestockModalOpen] = useState(false);
  const [restockDefaultProdId, setRestockDefaultProdId] = useState<string | undefined>(undefined);
  const [isSheetsModalOpen, setIsSheetsModalOpen] = useState(false);

  // Destructive Confirmation Modal state
  const [confirmationState, setConfirmationState] = useState<{
    isOpen: boolean;
    title: string;
    message: string;
    onConfirm: () => void;
  }>({
    isOpen: false,
    title: '',
    message: '',
    onConfirm: () => {},
  });

  // Load local data on mount
  useEffect(() => {
    const loadedProducts = getStoredProducts();
    const loadedSales = getStoredSales();
    const loadedMeta = getStoredSheetMeta();
    const loadedCurrency = getStoredCurrency();

    setProducts(loadedProducts);
    setSales(loadedSales);
    setSheetMeta(loadedMeta);
    setCurrency(loadedCurrency);
  }, []);

  // Initialize Firebase Auth listener
  useEffect(() => {
    const unsubscribe = initAuth(
      (u, t) => {
        setUser(u);
        setToken(t);
      },
      () => {
        setUser(null);
        setToken(null);
      }
    );
    return () => {
      if (typeof unsubscribe === 'function') unsubscribe();
    };
  }, []);

  // Compute monthly summaries whenever sales change
  const monthlySummaries: MonthlySummary[] = computeMonthlySummaries(sales);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage((prev) => (prev === msg ? null : prev));
    }, 4000);
  };

  // Google sign in helper
  const handleAuthSuccess = (authUser: User, accessToken: string) => {
    setUser(authUser);
    setToken(accessToken);
    setCachedAccessToken(accessToken);
    showToast(`স্বাগতম, ${authUser.displayName || 'ব্যবহারকারী'}! গুগল একাউন্ট সফলভাবে যুক্ত হয়েছে।`);
  };

  const handleLogout = async () => {
    await logout();
    setUser(null);
    setToken(null);
    showToast('গুগল একাউন্ট থেকে সাইন-আউট করা হয়েছে।');
  };

  // Save single product
  const handleSaveProduct = (prod: Product) => {
    const exists = products.some((p) => p.id === prod.id);
    let updated: Product[];
    if (exists) {
      updated = products.map((p) => (p.id === prod.id ? prod : p));
      showToast(`"${prod.name}" সফলভাবে আপডেট করা হয়েছে।`);
    } else {
      updated = [prod, ...products];
      showToast(`নতুন পণ্য "${prod.name}" যুক্ত করা হয়েছে।`);
    }
    setProducts(updated);
    saveProducts(updated);
  };

  // Save multiple products at once
  const handleSaveMultipleProducts = (newProds: Product[]) => {
    if (newProds.length === 0) return;
    const updated = [...newProds, ...products];
    setProducts(updated);
    saveProducts(updated);
    showToast(`${newProds.length} টি প্রোডাক্ট একসাথে যুক্ত করা হয়েছে!`);
  };

  // Delete product with confirmation
  const handleRequestDeleteProduct = (product: Product) => {
    setConfirmationState({
      isOpen: true,
      title: `"${product.name}" মুছে ফেলতে চান?`,
      message: `এই পণ্যটি মুছে ফেললে পণ্যের তথ্য তালিকা থেকে চিরতরে মুছে যাবে। আপনি কি নিশ্চিত?`,
      onConfirm: () => {
        const updated = products.filter((p) => p.id !== product.id);
        setProducts(updated);
        saveProducts(updated);
        setConfirmationState((prev) => ({ ...prev, isOpen: false }));
        showToast(`পণ্য "${product.name}" মুছে ফেলা হয়েছে।`);
      },
    });
  };

  // Save sale record
  const handleSaveSale = (sale: SaleRecord) => {
    // 1. Deduct stock from the product
    const updatedProducts = products.map((p) => {
      if (p.id === sale.productId) {
        return {
          ...p,
          stock: Math.max(0, p.stock - sale.quantity),
        };
      }
      return p;
    });

    const updatedSales = [sale, ...sales];

    setProducts(updatedProducts);
    saveProducts(updatedProducts);
    setSales(updatedSales);
    saveSales(updatedSales);

    showToast(`বিক্রয় সফল! অর্জিত লাভ: ${currency}${sale.profit.toLocaleString()}`);
  };

  // Delete sale with confirmation
  const handleRequestDeleteSale = (sale: SaleRecord) => {
    setConfirmationState({
      isOpen: true,
      title: 'বিক্রয় রেকর্ড মুছে ফেলতে চান?',
      message: `তারিখ: ${sale.date}, পণ্য: "${sale.productName}"। এই রেকর্ডটি মুছে দিলে স্টক স্বয়ংক্রিয়ভাবে ফেরত আনা হবে।`,
      onConfirm: () => {
        // Return stock back
        const updatedProducts = products.map((p) => {
          if (p.id === sale.productId) {
            return {
              ...p,
              stock: p.stock + sale.quantity,
            };
          }
          return p;
        });

        const updatedSales = sales.filter((s) => s.id !== sale.id);
        setProducts(updatedProducts);
        saveProducts(updatedProducts);
        setSales(updatedSales);
        saveSales(updatedSales);
        setConfirmationState((prev) => ({ ...prev, isOpen: false }));
        showToast('বিক্রয় রেকর্ড মুছে ফেলা হয়েছে এবং স্টক ফেরত আনা হয়েছে।');
      },
    });
  };

  // Restock inventory
  const handleRestock = (productId: string, addedStock: number, newCostPrice?: number) => {
    const updatedProducts = products.map((p) => {
      if (p.id === productId) {
        return {
          ...p,
          stock: p.stock + addedStock,
          costPrice: newCostPrice !== undefined && newCostPrice > 0 ? newCostPrice : p.costPrice,
        };
      }
      return p;
    });

    const targetProd = products.find((p) => p.id === productId);
    setProducts(updatedProducts);
    saveProducts(updatedProducts);
    showToast(`"${targetProd?.name || 'পণ্য'}" এ ${addedStock} ইউনিট স্টক যোগ করা হয়েছে।`);
  };

  // Quick sync to Google Sheets
  const handleQuickSyncToSheet = async () => {
    if (!sheetMeta) {
      setIsSheetsModalOpen(true);
      return;
    }

    if (!user || !token) {
      try {
        const res = await googleSignIn();
        if (!res) return;
        handleAuthSuccess(res.user, res.accessToken);
      } catch (err: any) {
        showToast('গুগল সাইন-ইন করতে ব্যর্থ হয়েছে: ' + (err.message || ''));
        return;
      }
    }

    setIsSyncingGlobal(true);
    try {
      await syncAllDataToGoogleSheet(
        sheetMeta.spreadsheetId,
        products,
        sales,
        monthlySummaries,
        currency
      );

      const updatedMeta: GoogleSheetMeta = {
        ...sheetMeta,
        lastSyncedAt: new Date().toISOString(),
      };
      setSheetMeta(updatedMeta);
      saveGoogleSheetMeta(updatedMeta);
      showToast('গুগল শিটে সমস্ত তথ্য সফলভাবে সিন্ক হয়েছে! ✅');
    } catch (err: any) {
      showToast('শিট সিন্ক করতে সমস্যা হয়েছে: ' + (err.message || ''));
    } finally {
      setIsSyncingGlobal(false);
    }
  };

  // Current Month summary stats
  const currentMonthKey = new Date().toISOString().slice(0, 7);
  const currentMonthSummary = monthlySummaries.find((m) => m.monthKey === currentMonthKey);
  const totalStockVal = products.reduce((sum, p) => sum + p.stock * p.costPrice, 0);

  return (
    <div className="min-h-screen bg-slate-100/70 text-slate-900 pb-16 font-sans w-full max-w-full overflow-x-hidden">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed top-5 right-5 z-50 bg-slate-900 text-white px-5 py-3 rounded-2xl shadow-xl border border-slate-700 text-xs font-semibold flex items-center gap-2.5 animate-in slide-in-from-top-2">
          <CheckCircle className="w-4 h-4 text-emerald-400 shrink-0" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Top Header Navbar */}
      <header className="bg-white border-b border-slate-200/80 sticky top-0 z-40 w-full overflow-hidden">
        <div className="max-w-7xl mx-auto px-2 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-14 sm:h-16 gap-1 sm:gap-2">
            {/* App Brand */}
            <div className="flex items-center gap-1.5 sm:gap-3 min-w-0">
              <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-xl bg-gradient-to-tr from-emerald-600 to-teal-500 text-white flex items-center justify-center shadow-xs shrink-0">
                <FileSpreadsheet className="w-4 h-4 sm:w-6 sm:h-6" />
              </div>
              <div className="min-w-0">
                <h1 className="text-xs sm:text-base md:text-lg font-bold text-slate-900 leading-tight flex items-center gap-1 min-w-0">
                  <span className="hidden xs:inline sm:inline truncate">স্মার্ট স্টক ও লাভ খাতা</span>
                  <span className="xs:hidden sm:hidden truncate">স্টক ও লাভ</span>
                  <span className="text-[9px] sm:text-[10px] bg-emerald-100 text-emerald-800 font-bold px-1.5 py-0.5 rounded-full uppercase tracking-wider shrink-0">
                    PRO
                  </span>
                </h1>
                <p className="text-[10px] sm:text-[11px] text-slate-500 hidden md:block">
                  মাল্টি-প্রোডাক্ট স্টক, দৈনিক বিক্রয় ও মাসিক লাভ-ক্ষতির হিসাব
                </p>
              </div>
            </div>

            {/* Google Sheets Sync & User Header Tools */}
            <div className="flex items-center gap-1 sm:gap-2 shrink-0">
              {/* Currency Selector (compact) */}
              <div className="flex items-center bg-slate-100 px-2 py-1 rounded-xl text-xs font-semibold text-slate-700">
                <select
                  value={currency}
                  onChange={(e) => {
                    setCurrency(e.target.value);
                    saveStoredCurrency(e.target.value);
                  }}
                  className="bg-transparent outline-none font-bold text-slate-900 cursor-pointer text-xs"
                >
                  <option value="৳">৳ BDT</option>
                  <option value="$">$ USD</option>
                  <option value="₹">₹ INR</option>
                  <option value="€">€ EUR</option>
                  <option value="£">£ GBP</option>
                </select>
              </div>

              {/* Google Sheets Status / Action */}
              {sheetMeta ? (
                <div className="flex items-center gap-1 bg-emerald-50 border border-emerald-200 p-0.5 sm:p-1 rounded-xl">
                  <button
                    type="button"
                    onClick={handleQuickSyncToSheet}
                    disabled={isSyncingGlobal}
                    title="গুগল শিটে সিন্ক করুন"
                    className="px-2.5 sm:px-3 py-1 sm:py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-[11px] sm:text-xs rounded-lg transition-all flex items-center gap-1 shadow-2xs"
                  >
                    <RefreshCw className={`w-3 h-3 sm:w-3.5 sm:h-3.5 ${isSyncingGlobal ? 'animate-spin' : ''}`} />
                    <span className="hidden sm:inline">
                      {isSyncingGlobal ? 'সিন্ক...' : 'সিন্ক'}
                    </span>
                  </button>

                  <a
                    href={sheetMeta.spreadsheetUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="p-1 sm:p-1.5 text-emerald-700 hover:bg-emerald-100 rounded-lg transition-colors"
                    title="গুগল শিট খুলুন"
                  >
                    <ExternalLink className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                  </a>

                  <button
                    type="button"
                    onClick={() => setIsSheetsModalOpen(true)}
                    className="hidden sm:block p-1 text-emerald-700 hover:bg-emerald-100 rounded-lg text-[10px] font-semibold"
                    title="শিট সেটিংস"
                  >
                    সেটিংস
                  </button>
                </div>
              ) : (
                <button
                  type="button"
                  onClick={() => setIsSheetsModalOpen(true)}
                  className="px-2.5 sm:px-3 py-1.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-300 font-bold text-xs rounded-xl transition-all flex items-center gap-1.5"
                >
                  <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-600" />
                  <span className="hidden sm:inline">Google Sheets এ সিন্ক</span>
                  <span className="sm:hidden text-[11px]">Sheets</span>
                </button>
              )}

              {/* Google User Avatar / Sign In */}
              {user ? (
                <div
                  onClick={() => setIsSheetsModalOpen(true)}
                  className="flex items-center gap-1.5 cursor-pointer p-1 rounded-xl hover:bg-slate-100 transition-colors"
                  title={`${user.email} (ক্লিক করে শিট সেটিংস দেখুন)`}
                >
                  {user.photoURL ? (
                    <img
                      src={user.photoURL}
                      alt={user.displayName || ''}
                      className="w-7 h-7 sm:w-8 sm:h-8 rounded-full border border-emerald-300 object-cover"
                    />
                  ) : (
                    <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-full bg-emerald-600 text-white font-bold flex items-center justify-center text-xs">
                      {(user.displayName || user.email || 'U')[0].toUpperCase()}
                    </div>
                  )}
                  <span className="hidden md:inline text-xs font-semibold text-slate-700 max-w-[100px] truncate">
                    {user.displayName?.split(' ')[0] || 'User'}
                  </span>
                </div>
              ) : (
                <button
                  type="button"
                  onClick={() => setIsSheetsModalOpen(true)}
                  className="px-2.5 sm:px-3 py-1.5 bg-white border border-slate-300 hover:bg-slate-50 text-slate-800 font-bold text-xs rounded-xl shadow-2xs transition-all flex items-center gap-1.5"
                >
                  <svg className="w-3.5 h-3.5 shrink-0" viewBox="0 0 48 48">
                    <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"></path>
                    <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"></path>
                    <path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"></path>
                    <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"></path>
                  </svg>
                  <span className="hidden sm:inline">গুগল সাইন-ইন</span>
                  <span className="sm:hidden text-[11px]">সাইন-ইন</span>
                </button>
              )}
            </div>
          </div>
        </div>
      </header>

      {/* Main Container */}
      <main className="max-w-7xl mx-auto px-2.5 sm:px-6 lg:px-8 pt-3 sm:pt-6 space-y-4 sm:space-y-6 w-full max-w-full overflow-x-hidden">
        {/* Highlight Quick Summary Strip */}
        <div className="bg-gradient-to-r from-emerald-800 via-teal-900 to-slate-900 text-white rounded-2xl sm:rounded-3xl p-3.5 sm:p-6 shadow-md relative overflow-hidden w-full">
          <div className="absolute right-0 top-0 translate-x-10 -translate-y-10 w-64 h-64 bg-emerald-500/10 rounded-full blur-2xl pointer-events-none" />

          <div className="grid grid-cols-2 md:grid-cols-4 gap-2.5 sm:gap-6 relative z-10">
            <div>
              <p className="text-[10px] sm:text-[11px] font-semibold text-emerald-300 uppercase tracking-wider">
                মজুদ পণ্য ও মান
              </p>
              <p className="text-lg sm:text-2xl font-black mt-0.5 sm:mt-1 text-white">
                {products.length} টি
              </p>
              <p className="text-[10px] sm:text-xs text-emerald-200/80 mt-0.5 truncate">
                মান: {currency}{totalStockVal.toLocaleString()}
              </p>
            </div>

            <div>
              <p className="text-[10px] sm:text-[11px] font-semibold text-teal-300 uppercase tracking-wider">
                চলতি মাসের বিক্রয়
              </p>
              <p className="text-lg sm:text-2xl font-black mt-0.5 sm:mt-1 text-white">
                {currency}{(currentMonthSummary?.totalRevenue || 0).toLocaleString()}
              </p>
              <p className="text-[10px] sm:text-xs text-teal-200/80 mt-0.5 truncate">
                {currentMonthSummary?.totalSalesCount || 0} টি বিক্রয়
              </p>
            </div>

            <div>
              <p className="text-[10px] sm:text-[11px] font-semibold text-emerald-300 uppercase tracking-wider">
                চলতি মাসের নীট লাভ
              </p>
              <p
                className={`text-lg sm:text-2xl font-black mt-0.5 sm:mt-1 ${
                  (currentMonthSummary?.netProfit || 0) >= 0 ? 'text-emerald-400' : 'text-rose-400'
                }`}
              >
                {(currentMonthSummary?.netProfit || 0) >= 0 ? '+' : ''}
                {currency}{(currentMonthSummary?.netProfit || 0).toLocaleString()}
              </p>
              <p className="text-[10px] sm:text-xs text-emerald-200/80 mt-0.5 truncate">
                মার্জিন: {(currentMonthSummary?.profitMargin || 0).toFixed(1)}%
              </p>
            </div>

            <div className="col-span-2 sm:col-span-1 flex flex-col justify-center sm:items-end">
              <button
                type="button"
                onClick={() => {
                  setSaleDefaultProdId(undefined);
                  setIsSaleModalOpen(true);
                }}
                className="w-full sm:w-auto px-4 sm:px-5 py-2.5 bg-emerald-500 hover:bg-emerald-400 active:scale-95 text-slate-950 font-black text-xs rounded-xl shadow-lg shadow-emerald-500/20 transition-all flex items-center justify-center gap-2"
              >
                <ShoppingCart className="w-4 h-4 shrink-0" />
                নতুন বিক্রয় এন্ট্রি
              </button>
            </div>
          </div>
        </div>

        {/* View Tabs Navigation (Responsive Mobile Labels + Swipable scroll) */}
        <div className="flex border-b border-slate-200 bg-white rounded-2xl p-1 shadow-2xs gap-1 overflow-x-auto no-scrollbar w-full">
          <button
            type="button"
            onClick={() => setActiveTab('inventory')}
            className={`shrink-0 sm:flex-1 py-2 sm:py-3 px-2.5 sm:px-4 text-xs sm:text-sm font-bold rounded-xl transition-all flex items-center justify-center gap-1.5 sm:gap-2 whitespace-nowrap ${
              activeTab === 'inventory'
                ? 'bg-emerald-600 text-white shadow-xs'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
            }`}
          >
            <Layers className="w-4 h-4 shrink-0" />
            <span className="hidden sm:inline">প্রোডাক্ট ও স্টক খাতা (Inventory)</span>
            <span className="sm:hidden">স্টক</span>
            <span
              className={`px-1.5 sm:px-2 py-0.5 rounded-full text-[10px] sm:text-[11px] font-extrabold ${
                activeTab === 'inventory' ? 'bg-emerald-800 text-white' : 'bg-slate-100 text-slate-700'
              }`}
            >
              {products.length}
            </span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('sales')}
            className={`shrink-0 sm:flex-1 py-2 sm:py-3 px-2.5 sm:px-4 text-xs sm:text-sm font-bold rounded-xl transition-all flex items-center justify-center gap-1.5 sm:gap-2 whitespace-nowrap ${
              activeTab === 'sales'
                ? 'bg-emerald-600 text-white shadow-xs'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
            }`}
          >
            <ShoppingCart className="w-4 h-4 shrink-0" />
            <span className="hidden sm:inline">দৈনিক বিক্রয় ও লাভ (Sales Log)</span>
            <span className="sm:hidden">বিক্রয়</span>
            <span
              className={`px-1.5 sm:px-2 py-0.5 rounded-full text-[10px] sm:text-[11px] font-extrabold ${
                activeTab === 'sales' ? 'bg-emerald-800 text-white' : 'bg-slate-100 text-slate-700'
              }`}
            >
              {sales.length}
            </span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('monthly')}
            className={`shrink-0 sm:flex-1 py-2 sm:py-3 px-2.5 sm:px-4 text-xs sm:text-sm font-bold rounded-xl transition-all flex items-center justify-center gap-1.5 sm:gap-2 whitespace-nowrap ${
              activeTab === 'monthly'
                ? 'bg-emerald-600 text-white shadow-xs'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
            }`}
          >
            <BarChart3 className="w-4 h-4 shrink-0" />
            <span className="hidden sm:inline">মাসিক হিসাব (P&L)</span>
            <span className="sm:hidden">মাসিক</span>
            {monthlySummaries.length > 0 && (
              <span
                className={`px-1.5 sm:px-2 py-0.5 rounded-full text-[10px] sm:text-[11px] font-extrabold ${
                  activeTab === 'monthly' ? 'bg-emerald-800 text-white' : 'bg-slate-100 text-slate-700'
                }`}
              >
                {monthlySummaries.length}
              </span>
            )}
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('sheet_preview')}
            className={`shrink-0 sm:flex-1 py-2 sm:py-3 px-2.5 sm:px-4 text-xs sm:text-sm font-bold rounded-xl transition-all flex items-center justify-center gap-1.5 sm:gap-2 whitespace-nowrap ${
              activeTab === 'sheet_preview'
                ? 'bg-emerald-600 text-white shadow-xs'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
            }`}
          >
            <FileSpreadsheet className="w-4 h-4 shrink-0" />
            <span className="hidden sm:inline">গুগল শিট প্রিভিউ (Sheets Theme)</span>
            <span className="sm:hidden">শিট ভিউ</span>
          </button>
        </div>

        {/* Tab Contents */}
        {activeTab === 'inventory' && (
          <ProductsTableView
            products={products}
            sales={sales}
            currency={currency}
            onOpenAddSingle={() => {
              setEditingProduct(null);
              setIsAddModalOpen(true);
            }}
            onOpenAddBulk={() => {
              setEditingProduct(null);
              setIsAddModalOpen(true);
            }}
            onOpenRestock={(prodId) => {
              setRestockDefaultProdId(prodId);
              setIsRestockModalOpen(true);
            }}
            onOpenSale={(prodId) => {
              setSaleDefaultProdId(prodId);
              setIsSaleModalOpen(true);
            }}
            onEditProduct={(prod) => {
              setEditingProduct(prod);
              setIsAddModalOpen(true);
            }}
            onRequestDeleteProduct={handleRequestDeleteProduct}
          />
        )}

        {activeTab === 'sales' && (
          <SalesLedgerView
            sales={sales}
            currency={currency}
            onOpenNewSale={() => {
              setSaleDefaultProdId(undefined);
              setIsSaleModalOpen(true);
            }}
            onRequestDeleteSale={handleRequestDeleteSale}
          />
        )}

        {activeTab === 'monthly' && (
          <MonthlyAnalyticsView
            monthlySummaries={monthlySummaries}
            sales={sales}
            products={products}
            currency={currency}
          />
        )}

        {activeTab === 'sheet_preview' && (
          <GoogleSheetLivePreview
            products={products}
            sales={sales}
            monthlySummaries={monthlySummaries}
            sheetMeta={sheetMeta}
            currency={currency}
            onSync={handleQuickSyncToSheet}
            isSyncing={isSyncingGlobal}
          />
        )}
      </main>

      {/* Add / Edit Product Modal */}
      <AddProductModal
        isOpen={isAddModalOpen}
        onClose={() => {
          setIsAddModalOpen(false);
          setEditingProduct(null);
        }}
        onSaveProduct={handleSaveProduct}
        onSaveMultipleProducts={handleSaveMultipleProducts}
        editingProduct={editingProduct}
        currency={currency}
      />

      {/* New Sale Modal */}
      <NewSaleModal
        isOpen={isSaleModalOpen}
        onClose={() => {
          setIsSaleModalOpen(false);
          setSaleDefaultProdId(undefined);
        }}
        products={products}
        onSaveSale={handleSaveSale}
        currency={currency}
        defaultProductId={saleDefaultProdId}
      />

      {/* Restock Modal */}
      <RestockModal
        isOpen={isRestockModalOpen}
        onClose={() => {
          setIsRestockModalOpen(false);
          setRestockDefaultProdId(undefined);
        }}
        products={products}
        onRestock={handleRestock}
        currency={currency}
        defaultProductId={restockDefaultProdId}
      />

      {/* Google Sheets Sync Modal */}
      <GoogleSheetsSyncModal
        isOpen={isSheetsModalOpen}
        onClose={() => setIsSheetsModalOpen(false)}
        user={user}
        token={token}
        onAuthSuccess={handleAuthSuccess}
        onLogout={handleLogout}
        sheetMeta={sheetMeta}
        onUpdateSheetMeta={(newMeta) => {
          setSheetMeta(newMeta);
          saveGoogleSheetMeta(newMeta);
        }}
        products={products}
        sales={sales}
        monthlySummaries={monthlySummaries}
        currency={currency}
      />

      {/* Destructive Action Confirmation Modal (Workspace Skill Requirement) */}
      <ConfirmationModal
        isOpen={confirmationState.isOpen}
        title={confirmationState.title}
        message={confirmationState.message}
        onConfirm={confirmationState.onConfirm}
        onCancel={() => setConfirmationState((prev) => ({ ...prev, isOpen: false }))}
      />
    </div>
  );
}
