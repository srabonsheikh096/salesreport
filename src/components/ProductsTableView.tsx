import React, { useState } from 'react';
import {
  Search,
  Plus,
  Layers,
  TrendingUp,
  PackagePlus,
  Edit2,
  Trash2,
  AlertTriangle,
  Download,
  Filter
} from 'lucide-react';
import { Product, SaleRecord } from '../types';

interface Props {
  products: Product[];
  sales: SaleRecord[];
  currency: string;
  onOpenAddSingle: () => void;
  onOpenAddBulk: () => void;
  onOpenRestock: (productId?: string) => void;
  onOpenSale: (productId?: string) => void;
  onEditProduct: (product: Product) => void;
  onRequestDeleteProduct: (product: Product) => void;
}

export const ProductsTableView: React.FC<Props> = ({
  products,
  sales,
  currency,
  onOpenAddSingle,
  onOpenAddBulk,
  onOpenRestock,
  onOpenSale,
  onEditProduct,
  onRequestDeleteProduct,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');

  const categories = Array.from(new Set(products.map((p) => p.category).filter(Boolean)));

  const filteredProducts = products.filter((p) => {
    const matchesSearch =
      p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.category.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = selectedCategory === 'all' || p.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  // Calculate totals
  const totalStockItems = products.reduce((sum, p) => sum + p.stock, 0);
  const totalInventoryValue = products.reduce((sum, p) => sum + p.stock * p.costPrice, 0);
  const lowStockCount = products.filter((p) => p.stock <= p.minStockAlert).length;

  // Export to CSV
  const handleExportCSV = () => {
    const headers = ['SL,Product Name,Category,Unit,Cost Price,Selling Price,Stock,Stock Value,Total Sold'];
    const rows = filteredProducts.map((p, idx) => {
      const sold = sales
        .filter((s) => s.productId === p.id)
        .reduce((sum, s) => sum + s.quantity, 0);
      const stockVal = p.stock * p.costPrice;
      return `${idx + 1},"${p.name}","${p.category}","${p.unit}",${p.costPrice},${p.sellingPrice},${p.stock},${stockVal},${sold}`;
    });
    const csvContent = 'data:text/csv;charset=utf-8,\uFEFF' + [headers, ...rows].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `Product_Stock_Sheet_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-5">
      {/* Overview mini-cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold text-slate-500">মোট তালিকাভুক্ত পণ্য</p>
            <p className="text-xl font-black text-slate-900 mt-1">{products.length} টি</p>
            <p className="text-[11px] text-slate-400 mt-0.5">মোট মজুদ: {totalStockItems} ইউনিট</p>
          </div>
          <div className="p-3 bg-emerald-50 text-emerald-600 rounded-xl">
            <Layers className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold text-slate-500">বর্তমান মোট স্টক মূল্য</p>
            <p className="text-xl font-black text-slate-900 mt-1">
              {currency}{totalInventoryValue.toLocaleString()}
            </p>
            <p className="text-[11px] text-slate-400 mt-0.5">কেনা দামের ভিত্তিতে মজুদ মান</p>
          </div>
          <div className="p-3 bg-blue-50 text-blue-600 rounded-xl">
            <TrendingUp className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold text-slate-500">কম স্টক সতর্কতা</p>
            <p className={`text-xl font-black mt-1 ${lowStockCount > 0 ? 'text-amber-600' : 'text-slate-900'}`}>
              {lowStockCount} টি পণ্য
            </p>
            <p className="text-[11px] text-slate-400 mt-0.5">
              {lowStockCount > 0 ? 'দ্রুত স্টক রিফিল করা প্রয়োজন' : 'সব পণ্যের পর্যাপ্ত স্টক আছে'}
            </p>
          </div>
          <div className={`p-3 rounded-xl ${lowStockCount > 0 ? 'bg-amber-100 text-amber-700' : 'bg-slate-100 text-slate-600'}`}>
            <AlertTriangle className="w-5 h-5" />
          </div>
        </div>
      </div>

      {/* Control Bar: Search, Category Filter, and Add Actions */}
      <div className="bg-white p-3.5 sm:p-4 rounded-2xl border border-slate-200/80 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-3 w-full">
        <div className="flex flex-col sm:flex-row sm:items-center gap-2.5 sm:gap-3 flex-1 w-full min-w-0">
          {/* Search box */}
          <div className="relative flex-1 w-full min-w-0">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="পণ্যের নাম দিয়ে খুঁজুন..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-4 py-2 text-xs rounded-xl border border-slate-200 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 outline-none"
            />
          </div>

          {/* Category filter */}
          {categories.length > 0 && (
            <div className="flex items-center gap-1.5 text-xs text-slate-500 shrink-0">
              <Filter className="w-3.5 h-3.5" />
              <select
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                className="px-3 py-2 text-xs bg-slate-50 rounded-xl border border-slate-200 outline-none text-slate-700 cursor-pointer font-medium w-full sm:w-auto"
              >
                <option value="all">সব ক্যাটাগরি</option>
                {categories.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
            </div>
          )}
        </div>

        {/* Buttons */}
        <div className="grid grid-cols-2 sm:flex sm:flex-wrap items-center gap-2 w-full md:w-auto">
          <button
            type="button"
            onClick={handleExportCSV}
            className="px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-xl transition-all flex items-center justify-center gap-1.5"
            title="CSV ফাইল হিসেবে ডাউনলোড করুন"
          >
            <Download className="w-3.5 h-3.5 shrink-0" />
            CSV এক্সপোর্ট
          </button>

          <button
            type="button"
            onClick={() => onOpenRestock()}
            className="px-3.5 py-2 bg-blue-50 hover:bg-blue-100 text-blue-700 border border-blue-200 text-xs font-bold rounded-xl transition-all flex items-center justify-center gap-1.5"
          >
            <PackagePlus className="w-3.5 h-3.5 shrink-0" />
            স্টক যোগ
          </button>

          <button
            type="button"
            onClick={onOpenAddSingle}
            className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl shadow-xs transition-all flex items-center justify-center gap-1.5"
          >
            <Plus className="w-3.5 h-3.5 shrink-0" />
            পণ্য যোগ
          </button>

          <button
            type="button"
            onClick={onOpenAddBulk}
            className="px-4 py-2 bg-emerald-800 hover:bg-emerald-900 text-white text-xs font-bold rounded-xl shadow-xs transition-all flex items-center justify-center gap-1.5"
          >
            <Layers className="w-3.5 h-3.5 text-emerald-300 shrink-0" />
            মাল্টি-পণ্য
          </button>
        </div>
      </div>

      {/* Spreadsheet Table */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden w-full max-w-full">
        {filteredProducts.length === 0 ? (
          <div className="p-12 text-center text-slate-500">
            <Layers className="w-10 h-10 text-slate-300 mx-auto mb-2" />
            <p className="text-sm font-bold text-slate-700">কোনো পণ্য পাওয়া যায়নি</p>
            <p className="text-xs text-slate-400 mt-1">
              {searchQuery ? 'অন্য কোনো নাম দিয়ে সার্চ করে দেখুন।' : 'উপরের "পণ্য যোগ করুন" বাটনে চাপুন।'}
            </p>
          </div>
        ) : (
          <>
            {/* Mobile Cards View (Visible on small screens) */}
            <div className="block sm:hidden divide-y divide-slate-100">
              {filteredProducts.map((p, idx) => {
                const productSales = sales.filter((s) => s.productId === p.id);
                const totalSold = productSales.reduce((sum, s) => sum + s.quantity, 0);
                const totalProfitEarned = productSales.reduce((sum, s) => sum + s.profit, 0);
                const unitProfit = p.sellingPrice - p.costPrice;
                const stockValue = p.stock * p.costPrice;
                const isLow = p.stock <= p.minStockAlert;
                const isOut = p.stock <= 0;

                return (
                  <div key={p.id} className="p-4 bg-white space-y-3">
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <span className="text-xs font-black text-slate-400">#{idx + 1}</span>
                          <span className="font-bold text-slate-900 text-sm">
                            {p.name}
                          </span>
                        </div>
                        <span className="text-[10px] text-slate-500 font-medium">
                          ক্যাটাগরি: {p.category} | একক: {p.unit}
                        </span>
                      </div>

                      <span
                        className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold shrink-0 ${
                          isOut
                            ? 'bg-rose-100 text-rose-700'
                            : isLow
                            ? 'bg-amber-100 text-amber-800'
                            : 'bg-emerald-100 text-emerald-800'
                        }`}
                      >
                        {isOut ? 'স্টক শেষ' : `মজুদ: ${p.stock} ${p.unit}`}
                      </span>
                    </div>

                    <div className="grid grid-cols-3 gap-2 bg-slate-50 p-2.5 rounded-xl text-center text-xs">
                      <div>
                        <p className="text-[10px] text-slate-400 font-semibold uppercase">ক্রয়মূল্য</p>
                        <p className="font-bold text-slate-700 mt-0.5">{currency}{p.costPrice}</p>
                      </div>
                      <div>
                        <p className="text-[10px] text-slate-400 font-semibold uppercase">বিক্রয়মূল্য</p>
                        <p className="font-bold text-slate-900 mt-0.5">{currency}{p.sellingPrice}</p>
                      </div>
                      <div>
                        <p className="text-[10px] text-slate-400 font-semibold uppercase">লাভ/একক</p>
                        <p className={`font-bold mt-0.5 ${unitProfit >= 0 ? 'text-emerald-700' : 'text-rose-600'}`}>
                          {unitProfit >= 0 ? '+' : ''}{currency}{unitProfit.toFixed(1)}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center justify-between text-[11px] text-slate-500 font-medium px-1">
                      <span>স্টক মূল্য: <strong className="text-slate-800">{currency}{stockValue.toLocaleString()}</strong></span>
                      <span>বিক্রি: <strong className="text-slate-800">{totalSold} {p.unit}</strong> (লাভ: <strong className="text-emerald-700">{currency}{totalProfitEarned}</strong>)</span>
                    </div>

                    {/* Touch action buttons */}
                    <div className="grid grid-cols-4 gap-1.5 pt-1">
                      <button
                        type="button"
                        onClick={() => onOpenSale(p.id)}
                        disabled={isOut}
                        className="col-span-2 py-2 px-3 bg-emerald-600 hover:bg-emerald-700 active:scale-95 text-white font-bold text-xs rounded-xl shadow-2xs transition-all flex items-center justify-center gap-1.5 disabled:opacity-40"
                      >
                        <TrendingUp className="w-3.5 h-3.5" />
                        বিক্রি করুন
                      </button>

                      <button
                        type="button"
                        onClick={() => onOpenRestock(p.id)}
                        className="py-2 px-2 bg-blue-50 hover:bg-blue-100 text-blue-700 border border-blue-200 font-bold text-xs rounded-xl transition-all flex items-center justify-center gap-1"
                        title="স্টক যোগ"
                      >
                        <PackagePlus className="w-3.5 h-3.5" />
                        স্টক +
                      </button>

                      <div className="flex gap-1">
                        <button
                          type="button"
                          onClick={() => onEditProduct(p)}
                          className="flex-1 py-2 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-xl flex items-center justify-center"
                          title="এডিট"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          type="button"
                          onClick={() => onRequestDeleteProduct(p)}
                          className="flex-1 py-2 bg-rose-50 hover:bg-rose-100 text-rose-600 rounded-xl flex items-center justify-center"
                          title="মুছুন"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Desktop Spreadsheet Table (Hidden on small mobile screens) */}
            <div className="hidden sm:block overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead className="bg-slate-50/90 text-slate-600 font-bold uppercase tracking-wider border-b border-slate-200">
                  <tr>
                    <th className="px-4 py-3.5 text-center w-12">#</th>
                    <th className="px-4 py-3.5">পণ্যের নাম</th>
                    <th className="px-3 py-3.5">ক্যাটাগরি</th>
                    <th className="px-3 py-3.5 text-right">ক্রয়মূল্য</th>
                    <th className="px-3 py-3.5 text-right">বিক্রয়মূল্য</th>
                    <th className="px-3 py-3.5 text-right">লাভ / একক</th>
                    <th className="px-4 py-3.5 text-center">বর্তমান স্টক</th>
                    <th className="px-4 py-3.5 text-right">স্টক মূল্য</th>
                    <th className="px-3 py-3.5 text-center">সর্বমোট বিক্রি</th>
                    <th className="px-4 py-3.5 text-center">অ্যাকশন</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredProducts.map((p, idx) => {
                    const productSales = sales.filter((s) => s.productId === p.id);
                    const totalSold = productSales.reduce((sum, s) => sum + s.quantity, 0);
                    const totalProfitEarned = productSales.reduce((sum, s) => sum + s.profit, 0);
                    const unitProfit = p.sellingPrice - p.costPrice;
                    const stockValue = p.stock * p.costPrice;
                    const isLow = p.stock <= p.minStockAlert;
                    const isOut = p.stock <= 0;

                    return (
                      <tr
                        key={p.id}
                        className="hover:bg-slate-50/80 transition-colors group"
                      >
                        <td className="px-4 py-3.5 text-center text-slate-400 font-semibold">
                          {idx + 1}
                        </td>

                        <td className="px-4 py-3.5">
                          <span className="font-bold text-slate-900 text-sm block">
                            {p.name}
                          </span>
                          <span className="text-[11px] text-slate-400">
                            একক: {p.unit} | এন্ট্রি: {new Date(p.createdAt).toLocaleDateString('bn-BD')}
                          </span>
                        </td>

                        <td className="px-3 py-3.5">
                          <span className="px-2.5 py-1 rounded-lg bg-slate-100 text-slate-700 text-[11px] font-medium">
                            {p.category || 'সাধারণ'}
                          </span>
                        </td>

                        <td className="px-3 py-3.5 text-right font-semibold text-slate-600">
                          {currency}{p.costPrice.toLocaleString()}
                        </td>

                        <td className="px-3 py-3.5 text-right font-bold text-slate-900">
                          {currency}{p.sellingPrice.toLocaleString()}
                        </td>

                        <td className="px-3 py-3.5 text-right">
                          <span
                            className={`font-bold ${
                              unitProfit >= 0 ? 'text-emerald-700' : 'text-rose-600'
                            }`}
                          >
                            {unitProfit >= 0 ? '+' : ''}{currency}{unitProfit.toFixed(1)}
                          </span>
                        </td>

                        <td className="px-4 py-3.5 text-center">
                          <span
                            className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold ${
                              isOut
                                ? 'bg-rose-100 text-rose-700'
                                : isLow
                                ? 'bg-amber-100 text-amber-800'
                                : 'bg-emerald-100 text-emerald-800'
                            }`}
                          >
                            {isOut ? 'স্টক শেষ' : `${p.stock} ${p.unit}`}
                          </span>
                          {isLow && !isOut && (
                            <span className="block text-[10px] text-amber-700 font-medium mt-0.5">
                              (কম স্টক)
                            </span>
                          )}
                        </td>

                        <td className="px-4 py-3.5 text-right font-bold text-slate-800">
                          {currency}{stockValue.toLocaleString()}
                        </td>

                        <td className="px-3 py-3.5 text-center">
                          <span className="font-bold text-slate-800 block">
                            {totalSold} {p.unit}
                          </span>
                          {totalProfitEarned !== 0 && (
                            <span className="text-[10px] font-bold text-emerald-600">
                              লাভ: {currency}{totalProfitEarned.toLocaleString()}
                            </span>
                          )}
                        </td>

                        <td className="px-4 py-3.5 text-center">
                          <div className="flex items-center justify-center gap-1.5">
                            <button
                              type="button"
                              onClick={() => onOpenSale(p.id)}
                              disabled={isOut}
                              title="বিক্রি করুন"
                              className="px-2.5 py-1 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-[11px] rounded-lg transition-all shadow-2xs disabled:opacity-30 disabled:pointer-events-none flex items-center gap-1"
                            >
                              <TrendingUp className="w-3 h-3" />
                              বিক্রি
                            </button>

                            <button
                              type="button"
                              onClick={() => onOpenRestock(p.id)}
                              title="স্টক যোগ করুন"
                              className="p-1.5 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors border border-blue-200"
                            >
                              <PackagePlus className="w-3.5 h-3.5" />
                            </button>

                            <button
                              type="button"
                              onClick={() => onEditProduct(p)}
                              title="সম্পাদনা"
                              className="p-1.5 text-slate-500 hover:text-slate-800 hover:bg-slate-100 rounded-lg transition-colors"
                            >
                              <Edit2 className="w-3.5 h-3.5" />
                            </button>

                            <button
                              type="button"
                              onClick={() => onRequestDeleteProduct(p)}
                              title="পণ্য মুছে ফেলুন"
                              className="p-1.5 text-rose-500 hover:text-rose-700 hover:bg-rose-50 rounded-lg transition-colors"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </>
        )}
      </div>
    </div>
  );
};
