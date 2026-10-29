import React, { useState } from 'react';
import {
  FileSpreadsheet,
  ExternalLink,
  RefreshCw,
  CheckCircle2,
  Table,
  Layers,
  TrendingUp,
  BarChart3,
  Sparkles
} from 'lucide-react';
import { Product, SaleRecord, MonthlySummary, GoogleSheetMeta } from '../types';

interface Props {
  products: Product[];
  sales: SaleRecord[];
  monthlySummaries: MonthlySummary[];
  sheetMeta: GoogleSheetMeta | null;
  currency: string;
  onSync: () => void;
  isSyncing: boolean;
}

export const GoogleSheetLivePreview: React.FC<Props> = ({
  products,
  sales,
  monthlySummaries,
  sheetMeta,
  currency,
  onSync,
  isSyncing,
}) => {
  const [activeSheetTab, setActiveSheetTab] = useState<'products' | 'sales' | 'monthly'>('products');
  const [selectedCell, setSelectedCell] = useState<{ col: string; row: number; val: string }>({
    col: 'B',
    row: 3,
    val: products[0]?.name || '',
  });

  return (
    <div className="space-y-4 w-full max-w-full overflow-hidden">
      {/* Header Info */}
      <div className="bg-white p-3.5 sm:p-4 rounded-2xl border border-slate-200/80 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3 w-full">
        <div className="flex items-center gap-3 min-w-0">
          <div className="w-9 h-9 rounded-xl bg-emerald-600 text-white flex items-center justify-center shadow-xs shrink-0">
            <FileSpreadsheet className="w-5 h-5" />
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <h3 className="text-xs sm:text-sm font-bold text-slate-900 truncate">গুগল শিট লাইভ ডিজাইন ও বাটন ভিউ</h3>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800">
                PRO থিম
              </span>
            </div>
            <p className="text-[11px] sm:text-xs text-slate-500 truncate">
              কুইক নেভিগেশন বাটন, এমারেল্ড হেডার ও অটো-কালার থিম
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto">
          {sheetMeta ? (
            <>
              <button
                type="button"
                onClick={onSync}
                disabled={isSyncing}
                className="flex-1 sm:flex-none px-3.5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl transition-all flex items-center justify-center gap-1.5 shadow-2xs disabled:opacity-50"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${isSyncing ? 'animate-spin' : ''}`} />
                {isSyncing ? 'থিম ও বাটন সহ সিন্ক হচ্ছে...' : 'শিটে থিম ও বাটন সিন্ক করুন'}
              </button>

              <a
                href={sheetMeta.spreadsheetUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-xl transition-all flex items-center justify-center gap-1.5 shrink-0"
              >
                <ExternalLink className="w-3.5 h-3.5 text-slate-500" />
                গুগল অ্যাপে ওপেন
              </a>
            </>
          ) : (
            <p className="text-xs text-slate-500">
              উপরে "Google Sheets এ সিন্ক" বাটনে চাপ দিয়ে শিট যুক্ত করুন
            </p>
          )}
        </div>
      </div>

      {/* Realistic Google Sheets Mockup Window */}
      <div className="bg-white rounded-2xl border border-slate-300 shadow-sm overflow-hidden font-sans w-full max-w-full">
        {/* Google Sheets Window Top Bar */}
        <div className="bg-slate-50 border-b border-slate-200 px-3 sm:px-4 py-2 flex items-center justify-between gap-2">
          <div className="flex items-center gap-2 min-w-0">
            <div className="w-6 h-6 rounded-md bg-emerald-600 flex items-center justify-center text-white shrink-0">
              <FileSpreadsheet className="w-4 h-4" />
            </div>
            <span className="text-xs font-bold text-slate-800 truncate">
              {sheetMeta?.title || 'Product Stock & Profit Ledger (প্রোডাক্ট স্টক ও লাভ খাতা)'}
            </span>
          </div>

          <div className="text-[10px] sm:text-[11px] text-slate-500 font-medium flex items-center gap-1 shrink-0">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
            <span className="hidden xs:inline">বাটন ও কালার থিম সক্রিয়</span>
            <span className="xs:hidden">সক্রিয়</span>
          </div>
        </div>

        {/* Formula Bar */}
        <div className="bg-slate-100/70 border-b border-slate-200 px-3 py-1.5 flex items-center gap-2 text-xs">
          <span className="px-2 py-0.5 bg-white border border-slate-300 rounded font-bold text-[11px] text-slate-700">
            {selectedCell.col}{selectedCell.row}
          </span>
          <span className="text-slate-400 font-bold italic text-xs">fx</span>
          <div className="flex-1 bg-white px-2.5 py-0.5 rounded border border-slate-200 text-xs text-slate-800 truncate font-mono">
            {selectedCell.val}
          </div>
        </div>

        {/* Spreadsheet Table View */}
        <div className="overflow-x-auto max-h-[500px] w-full max-w-full">
          {/* TAB 1: Products */}
          {activeSheetTab === 'products' && (
            <table className="w-full text-xs border-collapse min-w-[750px]">
              <thead>
                {/* Column letters A, B, C, D... */}
                <tr className="bg-slate-100 text-slate-500 font-bold text-[11px] text-center border-b border-slate-300 select-none">
                  <th className="w-10 py-1 bg-slate-200 border-r border-slate-300"></th>
                  <th className="py-1 border-r border-slate-300 w-12">A</th>
                  <th className="py-1 border-r border-slate-300 w-48">B</th>
                  <th className="py-1 border-r border-slate-300 w-32">C</th>
                  <th className="py-1 border-r border-slate-300 w-24">D</th>
                  <th className="py-1 border-r border-slate-300 w-28">E</th>
                  <th className="py-1 border-r border-slate-300 w-28">F</th>
                  <th className="py-1 border-r border-slate-300 w-28">G</th>
                  <th className="py-1 border-r border-slate-300 w-32">H</th>
                  <th className="py-1 border-r border-slate-300 w-28">I</th>
                  <th className="py-1 w-32">J</th>
                </tr>

                {/* ROW 1: Interactive Navigation Buttons Bar */}
                <tr className="bg-[#141E2E] text-white text-[11px] text-center h-9 border-b border-slate-700">
                  <td className="bg-slate-200 text-slate-700 font-bold border-r border-slate-300">1</td>
                  <td className="border-r border-slate-700 px-2 font-bold text-slate-300 text-[10px]">⚡ বাটন প্যানেল:</td>
                  <td className="border-r border-slate-700 px-2">
                    <button
                      type="button"
                      onClick={() => setActiveSheetTab('sales')}
                      className="px-2 py-1 bg-[#1E3A8A] hover:bg-blue-800 text-white font-bold rounded text-[10px] transition-all flex items-center justify-center gap-1 mx-auto"
                    >
                      🛒 দৈনিক বিক্রয় খাতা ➜
                    </button>
                  </td>
                  <td className="border-r border-slate-700 px-2">
                    <button
                      type="button"
                      onClick={() => setActiveSheetTab('monthly')}
                      className="px-2 py-1 bg-[#065F46] hover:bg-emerald-900 text-white font-bold rounded text-[10px] transition-all flex items-center justify-center gap-1 mx-auto"
                    >
                      📊 লাভ-ক্ষতি হিসাব ➜
                    </button>
                  </td>
                  <td className="border-r border-slate-700 px-2">
                    <span className="px-2 py-1 bg-[#6E29C7] text-white font-bold rounded text-[10px] inline-block">
                      🚀 স্মার্ট অ্যাপ ➜
                    </span>
                  </td>
                  <td colSpan={5} className="border-r border-slate-700 px-2 text-slate-400 text-[10px]">
                    গুগল শিটে তৈরি লাইভ লিঙ্ক ও ইন্টারঅ্যাক্টিভ বাটন
                  </td>
                  <td className="px-2 text-emerald-400 font-bold text-[10px]">
                    ✅ লাইভ ক্লাউড ডাটা
                  </td>
                </tr>

                {/* ROW 2: Emerald Header Row */}
                <tr className="bg-[#0F766E] text-white font-bold text-[11px] text-center h-10 border-b border-teal-800">
                  <td className="bg-slate-200 text-slate-700 font-bold border-r border-slate-300">2</td>
                  <td className="border-r border-teal-600/50 px-2">ক্রমিক (SL)</td>
                  <td className="border-r border-teal-600/50 px-3 text-left">পণ্যের নাম (Product Name)</td>
                  <td className="border-r border-teal-600/50 px-2 text-left">ক্যাটাগরি</td>
                  <td className="border-r border-teal-600/50 px-2">একক</td>
                  <td className="border-r border-teal-600/50 px-2 text-right">ক্রয়মূল্য ({currency})</td>
                  <td className="border-r border-teal-600/50 px-2 text-right">বিক্রয়মূল্য ({currency})</td>
                  <td className="border-r border-teal-600/50 px-2">বর্তমান স্টক</td>
                  <td className="border-r border-teal-600/50 px-2 text-right">স্টক মূল্য ({currency})</td>
                  <td className="border-r border-teal-600/50 px-2">মোট বিক্রি</td>
                  <td className="px-2">স্ট্যাটাস</td>
                </tr>
              </thead>
              <tbody>
                {products.map((p, idx) => {
                  const isEven = idx % 2 === 0;
                  const totalSold = sales.filter((s) => s.productId === p.id).reduce((sum, s) => sum + s.quantity, 0);
                  const stockVal = p.stock * p.costPrice;
                  const isOut = p.stock <= 0;
                  const isLow = p.stock <= p.minStockAlert;

                  return (
                    <tr
                      key={p.id}
                      className={`h-9 border-b border-slate-200 transition-colors ${
                        isEven ? 'bg-white' : 'bg-[#F8FAFC]'
                      } hover:bg-emerald-50/60`}
                    >
                      <td className="bg-slate-100 text-slate-500 font-bold text-center border-r border-slate-300 text-[11px] select-none">
                        {idx + 3}
                      </td>
                      <td className="border-r border-slate-200 text-center px-2 text-slate-600">{idx + 1}</td>
                      <td
                        onClick={() => setSelectedCell({ col: 'B', row: idx + 3, val: p.name })}
                        className="border-r border-slate-200 px-3 font-bold text-slate-900 cursor-pointer"
                      >
                        {p.name}
                      </td>
                      <td className="border-r border-slate-200 px-2 text-slate-700">{p.category}</td>
                      <td className="border-r border-slate-200 text-center px-2 text-slate-600">{p.unit}</td>
                      <td className="border-r border-slate-200 text-right px-2 font-semibold text-slate-700">{currency}{p.costPrice}</td>
                      <td className="border-r border-slate-200 text-right px-2 font-bold text-slate-900">{currency}{p.sellingPrice}</td>
                      <td className="border-r border-slate-200 text-center px-2 font-black text-slate-800">{p.stock}</td>
                      <td className="border-r border-slate-200 text-right px-2 font-bold text-slate-900">{currency}{stockVal.toLocaleString()}</td>
                      <td className="border-r border-slate-200 text-center px-2 font-semibold text-slate-700">{totalSold}</td>
                      <td className="text-center px-2">
                        <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                          isOut ? 'bg-rose-100 text-rose-800' : isLow ? 'bg-amber-100 text-amber-800' : 'bg-emerald-100 text-emerald-800'
                        }`}>
                          {isOut ? 'স্টক শেষ' : isLow ? 'কম স্টক' : 'উপলব্ধ'}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}

          {/* TAB 2: Sales */}
          {activeSheetTab === 'sales' && (
            <table className="w-full text-xs border-collapse min-w-[750px]">
              <thead>
                <tr className="bg-slate-100 text-slate-500 font-bold text-[11px] text-center border-b border-slate-300 select-none">
                  <th className="w-10 py-1 bg-slate-200 border-r border-slate-300"></th>
                  <th className="py-1 border-r border-slate-300 w-28">A</th>
                  <th className="py-1 border-r border-slate-300 w-48">B</th>
                  <th className="py-1 border-r border-slate-300 w-20">C</th>
                  <th className="py-1 border-r border-slate-300 w-24">D</th>
                  <th className="py-1 border-r border-slate-300 w-24">E</th>
                  <th className="py-1 border-r border-slate-300 w-28">F</th>
                  <th className="py-1 border-r border-slate-300 w-28">G</th>
                  <th className="py-1 border-r border-slate-300 w-28">H</th>
                  <th className="py-1 border-r border-slate-300 w-24">I</th>
                  <th className="py-1 w-36">J</th>
                </tr>

                {/* ROW 1: Navigation Buttons Bar */}
                <tr className="bg-[#141E2E] text-white text-[11px] text-center h-9 border-b border-slate-700">
                  <td className="bg-slate-200 text-slate-700 font-bold border-r border-slate-300">1</td>
                  <td className="border-r border-slate-700 px-2 font-bold text-slate-300 text-[10px]">⚡ বাটন প্যানেল:</td>
                  <td className="border-r border-slate-700 px-2">
                    <button
                      type="button"
                      onClick={() => setActiveSheetTab('products')}
                      className="px-2 py-1 bg-[#0F766E] hover:bg-teal-800 text-white font-bold rounded text-[10px] transition-all flex items-center justify-center gap-1 mx-auto"
                    >
                      📦 পণ্য ও স্টক খাতা ➜
                    </button>
                  </td>
                  <td className="border-r border-slate-700 px-2">
                    <button
                      type="button"
                      onClick={() => setActiveSheetTab('monthly')}
                      className="px-2 py-1 bg-[#065F46] hover:bg-emerald-900 text-white font-bold rounded text-[10px] transition-all flex items-center justify-center gap-1 mx-auto"
                    >
                      📊 লাভ-ক্ষতি হিসাব ➜
                    </button>
                  </td>
                  <td className="border-r border-slate-700 px-2">
                    <span className="px-2 py-1 bg-[#6E29C7] text-white font-bold rounded text-[10px] inline-block">
                      🚀 স্মার্ট অ্যাপ ➜
                    </span>
                  </td>
                  <td colSpan={5} className="border-r border-slate-700 px-2 text-slate-400 text-[10px]">
                    দৈনিক বিক্রয় খাতা
                  </td>
                  <td className="px-2 text-blue-400 font-bold text-[10px]">
                    ✅ বিক্রয় লেজার
                  </td>
                </tr>

                {/* ROW 2: Royal Navy Header */}
                <tr className="bg-[#1E3A8A] text-white font-bold text-[11px] text-center h-10 border-b border-blue-950">
                  <td className="bg-slate-200 text-slate-700 font-bold border-r border-slate-300">2</td>
                  <td className="border-r border-blue-600/50 px-2">তারিখ</td>
                  <td className="border-r border-blue-600/50 px-3 text-left">পণ্যের নাম</td>
                  <td className="border-r border-blue-600/50 px-2">পরিমাণ</td>
                  <td className="border-r border-blue-600/50 px-2 text-right">ক্রয়মূল্য</td>
                  <td className="border-r border-blue-600/50 px-2 text-right">বিক্রয় দর</td>
                  <td className="border-r border-blue-600/50 px-2 text-right">মোট বিক্রয়</td>
                  <td className="border-r border-blue-600/50 px-2 text-right">মোট খরচ</td>
                  <td className="border-r border-blue-600/50 px-2 text-right">মোট লাভ/ক্ষতি</td>
                  <td className="border-r border-blue-600/50 px-2">লাভের হার</td>
                  <td className="px-2 text-left">নোট</td>
                </tr>
              </thead>
              <tbody>
                {sales.map((s, idx) => {
                  const isEven = idx % 2 === 0;
                  const margin = s.totalRevenue > 0 ? (s.profit / s.totalRevenue) * 100 : 0;

                  return (
                    <tr
                      key={s.id}
                      className={`h-9 border-b border-slate-200 transition-colors ${
                        isEven ? 'bg-white' : 'bg-[#F8FAFC]'
                      } hover:bg-blue-50/60`}
                    >
                      <td className="bg-slate-100 text-slate-500 font-bold text-center border-r border-slate-300 text-[11px] select-none">
                        {idx + 3}
                      </td>
                      <td className="border-r border-slate-200 px-2 text-center text-slate-600">{s.date}</td>
                      <td className="border-r border-slate-200 px-3 font-bold text-slate-900">{s.productName}</td>
                      <td className="border-r border-slate-200 text-center px-2 font-bold text-slate-800">{s.quantity}</td>
                      <td className="border-r border-slate-200 text-right px-2 text-slate-500">{currency}{s.unitCostPrice}</td>
                      <td className="border-r border-slate-200 text-right px-2 font-semibold text-slate-800">{currency}{s.sellingPrice}</td>
                      <td className="border-r border-slate-200 text-right px-2 font-bold text-slate-900">{currency}{s.totalRevenue.toLocaleString()}</td>
                      <td className="border-r border-slate-200 text-right px-2 text-slate-500">{currency}{s.totalCost.toLocaleString()}</td>
                      <td className={`border-r border-slate-200 text-right px-2 font-black ${s.profit >= 0 ? 'text-emerald-700' : 'text-rose-600'}`}>
                        {s.profit >= 0 ? '+' : ''}{currency}{s.profit.toLocaleString()}
                      </td>
                      <td className="border-r border-slate-200 text-center px-2 font-bold text-slate-700">{margin.toFixed(1)}%</td>
                      <td className="px-2 text-slate-500 truncate max-w-xs">{s.customerNote || '-'}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}

          {/* TAB 3: Monthly */}
          {activeSheetTab === 'monthly' && (
            <table className="w-full text-xs border-collapse min-w-[750px]">
              <thead>
                <tr className="bg-slate-100 text-slate-500 font-bold text-[11px] text-center border-b border-slate-300 select-none">
                  <th className="w-10 py-1 bg-slate-200 border-r border-slate-300"></th>
                  <th className="py-1 border-r border-slate-300 w-36">A</th>
                  <th className="py-1 border-r border-slate-300 w-28">B</th>
                  <th className="py-1 border-r border-slate-300 w-32">C</th>
                  <th className="py-1 border-r border-slate-300 w-32">D</th>
                  <th className="py-1 border-r border-slate-300 w-32">E</th>
                  <th className="py-1 border-r border-slate-300 w-32">F</th>
                  <th className="py-1 border-r border-slate-300 w-28">G</th>
                  <th className="py-1 w-48">H</th>
                </tr>

                {/* ROW 1: Navigation Buttons Bar */}
                <tr className="bg-[#141E2E] text-white text-[11px] text-center h-9 border-b border-slate-700">
                  <td className="bg-slate-200 text-slate-700 font-bold border-r border-slate-300">1</td>
                  <td className="border-r border-slate-700 px-2 font-bold text-slate-300 text-[10px]">⚡ বাটন প্যানেল:</td>
                  <td className="border-r border-slate-700 px-2">
                    <button
                      type="button"
                      onClick={() => setActiveSheetTab('products')}
                      className="px-2 py-1 bg-[#0F766E] hover:bg-teal-800 text-white font-bold rounded text-[10px] transition-all flex items-center justify-center gap-1 mx-auto"
                    >
                      📦 পণ্য ও স্টক খাতা ➜
                    </button>
                  </td>
                  <td className="border-r border-slate-700 px-2">
                    <button
                      type="button"
                      onClick={() => setActiveSheetTab('sales')}
                      className="px-2 py-1 bg-[#1E3A8A] hover:bg-blue-800 text-white font-bold rounded text-[10px] transition-all flex items-center justify-center gap-1 mx-auto"
                    >
                      🛒 দৈনিক বিক্রয় খাতা ➜
                    </button>
                  </td>
                  <td className="border-r border-slate-700 px-2">
                    <span className="px-2 py-1 bg-[#6E29C7] text-white font-bold rounded text-[10px] inline-block">
                      🚀 স্মার্ট অ্যাপ ➜
                    </span>
                  </td>
                  <td colSpan={3} className="border-r border-slate-700 px-2 text-slate-400 text-[10px]">
                    মাসিক হিসাব খাতা
                  </td>
                  <td className="px-2 text-teal-300 font-bold text-[10px]">
                    ✅ লাভ-ক্ষতি রিপোর্ট
                  </td>
                </tr>

                {/* ROW 2: Forest Green Header */}
                <tr className="bg-[#065F46] text-white font-bold text-[11px] text-center h-10 border-b border-emerald-950">
                  <td className="bg-slate-200 text-slate-700 font-bold border-r border-slate-300">2</td>
                  <td className="border-r border-emerald-600/50 px-2 text-left">মাস (Month)</td>
                  <td className="border-r border-emerald-600/50 px-2">মোট অর্ডার</td>
                  <td className="border-r border-emerald-600/50 px-2">মোট বিক্রীত আইটেম</td>
                  <td className="border-r border-emerald-600/50 px-2 text-right">মোট বিক্রয়</td>
                  <td className="border-r border-emerald-600/50 px-2 text-right">মোট ক্রয় খরচ</td>
                  <td className="border-r border-emerald-600/50 px-2 text-right">নীট লাভ/ক্ষতি</td>
                  <td className="border-r border-emerald-600/50 px-2">মুনাফার হার</td>
                  <td className="px-3 text-left">শীর্ষ বিক্রিত পণ্য</td>
                </tr>
              </thead>
              <tbody>
                {monthlySummaries.map((m, idx) => {
                  const isEven = idx % 2 === 0;

                  return (
                    <tr
                      key={m.monthKey}
                      className={`h-9 border-b border-slate-200 transition-colors ${
                        isEven ? 'bg-white' : 'bg-[#F8FAFC]'
                      } hover:bg-emerald-50/60`}
                    >
                      <td className="bg-slate-100 text-slate-500 font-bold text-center border-r border-slate-300 text-[11px] select-none">
                        {idx + 3}
                      </td>
                      <td className="border-r border-slate-200 px-3 font-bold text-slate-900">{m.monthName}</td>
                      <td className="border-r border-slate-200 text-center px-2 text-slate-700">{m.totalSalesCount}</td>
                      <td className="border-r border-slate-200 text-center px-2 font-semibold text-slate-800">{m.totalItemsSold}</td>
                      <td className="border-r border-slate-200 text-right px-2 font-bold text-slate-900">{currency}{m.totalRevenue.toLocaleString()}</td>
                      <td className="border-r border-slate-200 text-right px-2 text-slate-500">{currency}{m.totalCost.toLocaleString()}</td>
                      <td className={`border-r border-slate-200 text-right px-2 font-black ${m.netProfit >= 0 ? 'text-emerald-700' : 'text-rose-600'}`}>
                        {m.netProfit >= 0 ? '+' : ''}{currency}{m.netProfit.toLocaleString()}
                      </td>
                      <td className="border-r border-slate-200 text-center px-2 font-bold text-slate-800">{m.profitMargin.toFixed(1)}%</td>
                      <td className="px-3 font-semibold text-slate-800 truncate">
                        {m.topProduct ? `${m.topProduct.name} (+${currency}${m.topProduct.profit})` : '-'}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>

        {/* Bottom Sheet Tabs Bar (Authentic Google Sheets style) */}
        <div className="bg-slate-200 border-t border-slate-300 px-2 sm:px-3 py-1.5 flex items-center gap-1 overflow-x-auto no-scrollbar w-full">
          <button
            type="button"
            onClick={() => setActiveSheetTab('products')}
            className={`px-3 py-1.5 rounded-t-lg font-bold text-xs flex items-center gap-1.5 transition-all shrink-0 whitespace-nowrap ${
              activeSheetTab === 'products'
                ? 'bg-white text-emerald-800 shadow-xs border-t-2 border-emerald-600'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-50'
            }`}
          >
            <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
            Products (পণ্য ও স্টক)
          </button>

          <button
            type="button"
            onClick={() => setActiveSheetTab('sales')}
            className={`px-3 py-1.5 rounded-t-lg font-bold text-xs flex items-center gap-1.5 transition-all shrink-0 whitespace-nowrap ${
              activeSheetTab === 'sales'
                ? 'bg-white text-blue-800 shadow-xs border-t-2 border-blue-600'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-50'
            }`}
          >
            <span className="w-2 h-2 rounded-full bg-blue-500"></span>
            Daily_Sales (দৈনিক বিক্রয়)
          </button>

          <button
            type="button"
            onClick={() => setActiveSheetTab('monthly')}
            className={`px-3 py-1.5 rounded-t-lg font-bold text-xs flex items-center gap-1.5 transition-all shrink-0 whitespace-nowrap ${
              activeSheetTab === 'monthly'
                ? 'bg-white text-teal-800 shadow-xs border-t-2 border-teal-600'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-50'
            }`}
          >
            <span className="w-2 h-2 rounded-full bg-teal-500"></span>
            Monthly_Summary (মাসিক হিসাব)
          </button>
        </div>
      </div>
    </div>
  );
};
