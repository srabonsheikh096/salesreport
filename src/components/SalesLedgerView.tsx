import React, { useState } from 'react';
import {
  Search,
  ShoppingCart,
  Calendar,
  Trash2,
  TrendingUp,
  Download,
  Filter
} from 'lucide-react';
import { SaleRecord } from '../types';

interface Props {
  sales: SaleRecord[];
  currency: string;
  onOpenNewSale: () => void;
  onRequestDeleteSale: (sale: SaleRecord) => void;
}

export const SalesLedgerView: React.FC<Props> = ({
  sales,
  currency,
  onOpenNewSale,
  onRequestDeleteSale,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [dateFilter, setDateFilter] = useState('');

  const filteredSales = sales.filter((s) => {
    const matchesQuery =
      s.productName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (s.customerNote && s.customerNote.toLowerCase().includes(searchQuery.toLowerCase()));
    const matchesDate = !dateFilter || s.date === dateFilter;
    return matchesQuery && matchesDate;
  });

  // Totals for filtered view
  const totalRev = filteredSales.reduce((acc, s) => acc + s.totalRevenue, 0);
  const totalCost = filteredSales.reduce((acc, s) => acc + s.totalCost, 0);
  const totalProfit = filteredSales.reduce((acc, s) => acc + s.profit, 0);
  const totalItemsSold = filteredSales.reduce((acc, s) => acc + s.quantity, 0);

  const handleExportSalesCSV = () => {
    const headers = [
      'Date,Product Name,Quantity,Cost Price,Selling Price,Total Revenue,Total Cost,Profit,Margin %,Note'
    ];
    const rows = filteredSales.map((s) => {
      const margin = s.totalRevenue > 0 ? ((s.profit / s.totalRevenue) * 100).toFixed(1) + '%' : '0%';
      return `"${s.date}","${s.productName}",${s.quantity},${s.unitCostPrice},${s.sellingPrice},${s.totalRevenue},${s.totalCost},${s.profit},"${margin}","${s.customerNote || ''}"`;
    });
    const csvContent = 'data:text/csv;charset=utf-8,\uFEFF' + [headers, ...rows].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `Sales_Ledger_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-5">
      {/* Sales Summary Banner */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
        <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs">
          <p className="text-xs font-semibold text-slate-500">বিক্রীত আইটেম</p>
          <p className="text-xl font-black text-slate-900 mt-1">{totalItemsSold} ইউনিট</p>
          <p className="text-[11px] text-slate-400 mt-0.5">{filteredSales.length} টি বিক্রয় এন্ট্রি</p>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs">
          <p className="text-xs font-semibold text-slate-500">মোট বিক্রয় (Revenue)</p>
          <p className="text-xl font-black text-slate-900 mt-1">
            {currency}{totalRev.toLocaleString()}
          </p>
          <p className="text-[11px] text-slate-400 mt-0.5">সব মিলিয়ে মোট ক্যাশ/বিক্রয়</p>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs">
          <p className="text-xs font-semibold text-slate-500">ক্রয় খরচ (Total Cost)</p>
          <p className="text-xl font-black text-slate-900 mt-1">
            {currency}{totalCost.toLocaleString()}
          </p>
          <p className="text-[11px] text-slate-400 mt-0.5">কেনা দাম বাবদ খরচ</p>
        </div>

        <div
          className={`p-4 rounded-2xl border shadow-xs ${
            totalProfit >= 0
              ? 'bg-emerald-50/80 border-emerald-200 text-emerald-900'
              : 'bg-rose-50/80 border-rose-200 text-rose-900'
          }`}
        >
          <p className="text-xs font-bold">মোট লাভ / ক্ষতি</p>
          <p
            className={`text-xl font-black mt-1 ${
              totalProfit >= 0 ? 'text-emerald-700' : 'text-rose-700'
            }`}
          >
            {totalProfit >= 0 ? '+' : ''}{currency}{totalProfit.toLocaleString()}
          </p>
          <p className="text-[11px] font-semibold mt-0.5">
            মার্জিন: {totalRev > 0 ? ((totalProfit / totalRev) * 100).toFixed(1) : 0}%
          </p>
        </div>
      </div>

      {/* Control bar */}
      <div className="bg-white p-3.5 sm:p-4 rounded-2xl border border-slate-200/80 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-3 w-full">
        <div className="flex flex-col sm:flex-row sm:items-center gap-2.5 sm:gap-3 flex-1 w-full min-w-0">
          {/* Search */}
          <div className="relative flex-1 w-full min-w-0">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="পণ্য বা মেমো নোট দিয়ে খুঁজুন..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-4 py-2 text-xs rounded-xl border border-slate-200 focus:border-emerald-500 outline-none"
            />
          </div>

          {/* Date filter */}
          <div className="flex items-center gap-1.5 text-xs text-slate-500 shrink-0">
            <Calendar className="w-3.5 h-3.5" />
            <input
              type="date"
              value={dateFilter}
              onChange={(e) => setDateFilter(e.target.value)}
              className="px-3 py-1.5 text-xs bg-slate-50 rounded-xl border border-slate-200 outline-none cursor-pointer w-full sm:w-auto"
            />
            {dateFilter && (
              <button
                type="button"
                onClick={() => setDateFilter('')}
                className="text-[11px] text-rose-600 hover:underline ml-1"
              >
                রিসেট
              </button>
            )}
          </div>
        </div>

        <div className="flex items-center gap-2 w-full md:w-auto justify-end">
          <button
            type="button"
            onClick={handleExportSalesCSV}
            className="w-full sm:w-auto px-3.5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-xl transition-all flex items-center justify-center gap-1.5"
          >
            <Download className="w-3.5 h-3.5" />
            CSV এক্সপোর্ট
          </button>

          <button
            type="button"
            onClick={onOpenNewSale}
            className="w-full sm:w-auto px-4 sm:px-5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl shadow-xs transition-all flex items-center justify-center gap-1.5 whitespace-nowrap"
          >
            <ShoppingCart className="w-3.5 h-3.5" />
            নতুন বিক্রয় এন্ট্রি
          </button>
        </div>
      </div>

      {/* Sales table */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden w-full max-w-full">
        {filteredSales.length === 0 ? (
          <div className="p-12 text-center text-slate-500">
            <ShoppingCart className="w-10 h-10 text-slate-300 mx-auto mb-2" />
            <p className="text-sm font-bold text-slate-700">কোনো বিক্রয় রেকর্ড নেই</p>
            <p className="text-xs text-slate-400 mt-1">
              {searchQuery || dateFilter
                ? 'ফিল্টার অনুযায়ী কোনো রেকর্ড পাওয়া যায়নি।'
                : 'নতুন পণ্য বিক্রি রেকর্ড করতে উপরের "নতুন বিক্রয় এন্ট্রি" বাটনে চাপুন।'}
            </p>
          </div>
        ) : (
          <>
            {/* Mobile Sales Cards (Visible on mobile screens) */}
            <div className="block sm:hidden divide-y divide-slate-100">
              {filteredSales.map((s) => {
                const isProfit = s.profit >= 0;
                const margin = s.totalRevenue > 0 ? (s.profit / s.totalRevenue) * 100 : 0;

                return (
                  <div key={s.id} className="p-4 bg-white space-y-2.5">
                    <div className="flex items-start justify-between">
                      <div>
                        <span className="text-[10px] font-bold text-slate-400 block">{s.date}</span>
                        <h4 className="text-sm font-bold text-slate-900 mt-0.5">{s.productName}</h4>
                      </div>
                      <div className="flex items-center gap-2">
                        <span
                          className={`px-2.5 py-0.5 rounded-full text-xs font-black ${
                            isProfit ? 'bg-emerald-100 text-emerald-800' : 'bg-rose-100 text-rose-800'
                          }`}
                        >
                          {isProfit ? '+' : ''}{currency}{s.profit.toLocaleString()}
                        </span>
                        <button
                          type="button"
                          onClick={() => onRequestDeleteSale(s)}
                          className="p-1.5 text-slate-400 hover:text-rose-600 rounded-lg hover:bg-rose-50"
                          title="মুছুন"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>

                    <div className="grid grid-cols-4 gap-1.5 bg-slate-50 p-2 rounded-xl text-center text-[11px]">
                      <div>
                        <span className="text-[9px] text-slate-400 block">পরিমাণ</span>
                        <strong className="text-slate-800">{s.quantity}</strong>
                      </div>
                      <div>
                        <span className="text-[9px] text-slate-400 block">বিক্রয় দর</span>
                        <strong className="text-slate-800">{currency}{s.sellingPrice}</strong>
                      </div>
                      <div>
                        <span className="text-[9px] text-slate-400 block">মোট বিক্রয়</span>
                        <strong className="text-slate-900">{currency}{s.totalRevenue.toLocaleString()}</strong>
                      </div>
                      <div>
                        <span className="text-[9px] text-slate-400 block">মার্জিন</span>
                        <strong className={isProfit ? 'text-emerald-700' : 'text-rose-600'}>
                          {margin.toFixed(0)}%
                        </strong>
                      </div>
                    </div>

                    {s.customerNote && (
                      <p className="text-[11px] text-slate-500 italic bg-amber-50/60 px-2.5 py-1 rounded-lg border border-amber-100">
                        নোট: {s.customerNote}
                      </p>
                    )}
                  </div>
                );
              })}
            </div>

            {/* Desktop Sales Table (Hidden on small mobile screens) */}
            <div className="hidden sm:block overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead className="bg-slate-50/90 text-slate-600 font-bold uppercase tracking-wider border-b border-slate-200">
                  <tr>
                    <th className="px-4 py-3.5">তারিখ</th>
                    <th className="px-4 py-3.5">পণ্যের নাম</th>
                    <th className="px-3 py-3.5 text-center">পরিমাণ</th>
                    <th className="px-3 py-3.5 text-right">ক্রয়মূল্য</th>
                    <th className="px-3 py-3.5 text-right">বিক্রয়মূল্য (সেদিন)</th>
                    <th className="px-4 py-3.5 text-right">মোট বিক্রয়</th>
                    <th className="px-4 py-3.5 text-right">মোট কেনা খরচ</th>
                    <th className="px-4 py-3.5 text-right">অর্জিত লাভ</th>
                    <th className="px-4 py-3.5">নোট</th>
                    <th className="px-3 py-3.5 text-center">মুছুন</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-medium">
                  {filteredSales.map((s) => {
                    const isProfit = s.profit >= 0;
                    const margin = s.totalRevenue > 0 ? (s.profit / s.totalRevenue) * 100 : 0;

                    return (
                      <tr key={s.id} className="hover:bg-slate-50/80 transition-colors">
                        <td className="px-4 py-3.5 font-semibold text-slate-700 whitespace-nowrap">
                          {s.date}
                        </td>

                        <td className="px-4 py-3.5 font-bold text-slate-900">
                          {s.productName}
                        </td>

                        <td className="px-3 py-3.5 text-center font-bold text-slate-800">
                          {s.quantity}
                        </td>

                        <td className="px-3 py-3.5 text-right text-slate-500 font-medium">
                          {currency}{s.unitCostPrice}
                        </td>

                        <td className="px-3 py-3.5 text-right font-bold text-slate-900">
                          {currency}{s.sellingPrice}
                        </td>

                        <td className="px-4 py-3.5 text-right font-bold text-slate-900">
                          {currency}{s.totalRevenue.toLocaleString()}
                        </td>

                        <td className="px-4 py-3.5 text-right text-slate-500 font-medium">
                          {currency}{s.totalCost.toLocaleString()}
                        </td>

                        <td
                          className={`px-4 py-3.5 text-right font-black ${
                            isProfit ? 'text-emerald-700' : 'text-rose-600'
                          }`}
                        >
                          {isProfit ? '+' : ''}{currency}{s.profit.toLocaleString()}
                          <span className="block text-[10px] font-semibold opacity-75">
                            ({margin.toFixed(1)}%)
                          </span>
                        </td>

                        <td className="px-4 py-3.5 text-slate-500 max-w-xs truncate">
                          {s.customerNote || '-'}
                        </td>

                        <td className="px-3 py-3.5 text-center">
                          <button
                            type="button"
                            onClick={() => onRequestDeleteSale(s)}
                            title="রেকর্ড মুছুন"
                            className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
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
