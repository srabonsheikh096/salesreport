import React, { useState } from 'react';
import {
  Calendar,
  TrendingUp,
  TrendingDown,
  DollarSign,
  Package,
  Award,
  Printer,
  ChevronRight,
  BarChart3,
  Download,
  FileText
} from 'lucide-react';
import { MonthlySummary, SaleRecord, Product } from '../types';
import { MonthlyReportPrintModal } from './MonthlyReportPrintModal';

interface Props {
  monthlySummaries: MonthlySummary[];
  sales: SaleRecord[];
  products: Product[];
  currency: string;
}

export const MonthlyAnalyticsView: React.FC<Props> = ({
  monthlySummaries,
  sales,
  products,
  currency,
}) => {
  const [selectedMonthKey, setSelectedMonthKey] = useState<string>(
    monthlySummaries.length > 0 ? monthlySummaries[0].monthKey : ''
  );

  const selectedSummary =
    monthlySummaries.find((m) => m.monthKey === selectedMonthKey) || monthlySummaries[0];

  // Filter sales for the selected month
  const monthSales = sales.filter((s) => s.date.startsWith(selectedMonthKey || ''));

  // Group by product for the selected month
  const productPerformanceMap: Record<
    string,
    { name: string; quantity: number; revenue: number; cost: number; profit: number }
  > = {};

  monthSales.forEach((s) => {
    if (!productPerformanceMap[s.productName]) {
      productPerformanceMap[s.productName] = {
        name: s.productName,
        quantity: 0,
        revenue: 0,
        cost: 0,
        profit: 0,
      };
    }
    const item = productPerformanceMap[s.productName];
    item.quantity += s.quantity;
    item.revenue += s.totalRevenue;
    item.cost += s.totalCost;
    item.profit += s.profit;
  });

  const productPerformances = Object.values(productPerformanceMap).sort(
    (a, b) => b.profit - a.profit
  );

  // Group by date for daily trend
  const dailyMap: Record<string, { date: string; sales: number; profit: number; count: number }> = {};
  monthSales.forEach((s) => {
    if (!dailyMap[s.date]) {
      dailyMap[s.date] = { date: s.date, sales: 0, profit: 0, count: 0 };
    }
    dailyMap[s.date].sales += s.totalRevenue;
    dailyMap[s.date].profit += s.profit;
    dailyMap[s.date].count += 1;
  });

  const dailyTrend = Object.values(dailyMap).sort((a, b) => a.date.localeCompare(b.date));

  const [isReportModalOpen, setIsReportModalOpen] = useState(false);

  const handlePrint = () => {
    setIsReportModalOpen(true);
  };

  if (monthlySummaries.length === 0) {
    return (
      <div className="bg-white rounded-3xl p-12 text-center border border-slate-200/80 shadow-xs">
        <Calendar className="w-12 h-12 text-slate-300 mx-auto mb-3" />
        <h3 className="text-lg font-bold text-slate-800">এখনও কোনো মাসিক হিসাব তৈরি হয়নি</h3>
        <p className="text-sm text-slate-500 mt-1 max-w-md mx-auto">
          দৈনিক বিক্রয় এন্ট্রি শুরু করলেই এখানে স্বয়ংক্রিয়ভাবে মাসভিত্তিক মোট বিক্রয়, খরচ ও নীট লাভ-ক্ষতির বিশ্লেষণ দেখা যাবে।
        </p>
      </div>
    );
  }

  const isProfit = (selectedSummary?.netProfit || 0) >= 0;

  return (
    <div className="space-y-5 sm:space-y-6 w-full max-w-full overflow-hidden">
      {/* Month Selector Bar & Action */}
      <div className="bg-white p-3.5 sm:p-5 rounded-2xl border border-slate-200/80 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3 w-full">
        <div className="flex items-center gap-3 min-w-0">
          <div className="p-2.5 bg-emerald-50 rounded-xl text-emerald-700 shrink-0">
            <Calendar className="w-5 h-5" />
          </div>
          <div className="min-w-0">
            <label className="block text-xs font-semibold text-slate-500">
              হিসাবের মাস নির্বাচন করুন
            </label>
            <select
              value={selectedMonthKey}
              onChange={(e) => setSelectedMonthKey(e.target.value)}
              className="text-sm sm:text-base font-bold text-slate-900 bg-transparent outline-none cursor-pointer pr-4 w-full"
            >
              {monthlySummaries.map((m) => (
                <option key={m.monthKey} value={m.monthKey}>
                  {m.monthName} ({m.totalSalesCount} টি বিক্রয়)
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="flex items-center gap-2 sm:gap-3 w-full sm:w-auto">
          <button
            type="button"
            onClick={() => setIsReportModalOpen(true)}
            className="w-full sm:w-auto no-print px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl shadow-xs transition-all flex items-center justify-center gap-1.5"
          >
            <Download className="w-4 h-4 shrink-0" />
            PDF / প্রিন্ট রিপোর্ট
          </button>
        </div>
      </div>

      {/* Hero Monthly KPI Grid */}
      {selectedSummary && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Revenue */}
          <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs relative overflow-hidden">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-slate-500">
                মোট বিক্রয় (Total Revenue)
              </span>
              <div className="p-2 bg-blue-50 text-blue-600 rounded-xl">
                <DollarSign className="w-4 h-4" />
              </div>
            </div>
            <div className="mt-3">
              <span className="text-2xl font-black text-slate-900">
                {currency}{selectedSummary.totalRevenue.toLocaleString()}
              </span>
              <p className="text-xs text-slate-500 mt-1">
                {selectedSummary.totalSalesCount} টি অর্ডারে {selectedSummary.totalItemsSold} ইউনিট
              </p>
            </div>
          </div>

          {/* Cost */}
          <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs relative overflow-hidden">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-slate-500">
                পণ্যের ক্রয়মূল্য / খরচ (Total Cost)
              </span>
              <div className="p-2 bg-amber-50 text-amber-600 rounded-xl">
                <Package className="w-4 h-4" />
              </div>
            </div>
            <div className="mt-3">
              <span className="text-2xl font-black text-slate-900">
                {currency}{selectedSummary.totalCost.toLocaleString()}
              </span>
              <p className="text-xs text-slate-500 mt-1">
                বিক্রীত পণ্যের কেনা খরচ
              </p>
            </div>
          </div>

          {/* Net Profit / Loss */}
          <div
            className={`p-5 rounded-2xl border shadow-xs relative overflow-hidden ${
              isProfit
                ? 'bg-gradient-to-br from-emerald-50 via-teal-50/50 to-white border-emerald-200'
                : 'bg-gradient-to-br from-rose-50 via-red-50/50 to-white border-rose-200'
            }`}
          >
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-700">
                {isProfit ? 'মোট লাভ (Gross Profit)' : 'মোট ক্ষতি (Loss)'}
              </span>
              <div
                className={`p-2 rounded-xl ${
                  isProfit ? 'bg-emerald-100 text-emerald-700' : 'bg-rose-100 text-rose-700'
                }`}
              >
                {isProfit ? <TrendingUp className="w-4 h-4" /> : <TrendingDown className="w-4 h-4" />}
              </div>
            </div>
            <div className="mt-3">
              <span
                className={`text-2xl font-black ${
                  isProfit ? 'text-emerald-700' : 'text-rose-700'
                }`}
              >
                {isProfit ? '+' : ''}{currency}{selectedSummary.netProfit.toLocaleString()}
              </span>
              <p className="text-xs font-semibold text-slate-600 mt-1">
                মাসিক নীট লাভ-ক্ষতির ফলাফল
              </p>
            </div>
          </div>

          {/* Profit Margin % */}
          <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs relative overflow-hidden">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-slate-500">
                মুনাফার হার (Profit Margin)
              </span>
              <div className="p-2 bg-purple-50 text-purple-600 rounded-xl">
                <Award className="w-4 h-4" />
              </div>
            </div>
            <div className="mt-3">
              <span className="text-2xl font-black text-purple-700">
                {selectedSummary.profitMargin.toFixed(1)}%
              </span>
              <p className="text-xs text-slate-500 mt-1">
                শীর্ষ লাভজনক: {selectedSummary.topProduct?.name || 'কোন পণ্য নেই'}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Daily Sales & Profit Progression */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-xs space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <BarChart3 className="w-5 h-5 text-emerald-600" />
            <h3 className="text-base font-bold text-slate-900">
              দৈনিক বিক্রয় ও লাভের গ্রাফ চিত্র ({selectedSummary?.monthName})
            </h3>
          </div>
          <span className="text-xs text-slate-500">
            {dailyTrend.length} দিন লেনদেন হয়েছে
          </span>
        </div>

        {dailyTrend.length === 0 ? (
          <p className="text-xs text-slate-400 py-4 text-center">এই মাসে কোনো বিক্রয় নেই</p>
        ) : (
          <div className="space-y-3 pt-2">
            {dailyTrend.map((d) => {
              const maxRev = Math.max(...dailyTrend.map((x) => x.sales), 1);
              const percentage = Math.min(100, Math.max(5, (d.sales / maxRev) * 100));

              return (
                <div key={d.date} className="flex flex-col sm:flex-row sm:items-center gap-2 text-xs">
                  <div className="w-24 font-bold text-slate-700 shrink-0">
                    {d.date}
                  </div>
                  <div className="flex-1 bg-slate-100 rounded-full h-4 overflow-hidden relative">
                    <div
                      className="bg-gradient-to-r from-emerald-500 to-teal-500 h-full rounded-full transition-all duration-500"
                      style={{ width: `${percentage}%` }}
                    />
                  </div>
                  <div className="flex items-center justify-between sm:justify-end gap-3 shrink-0 text-slate-700">
                    <span>বিক্রয়: <strong className="text-slate-900">{currency}{d.sales.toLocaleString()}</strong></span>
                    <span className="font-bold text-emerald-700">
                      লাভ: +{currency}{d.profit.toLocaleString()}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Product-wise Profit Breakdown Table */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
          <h3 className="text-base font-bold text-slate-900">
            পণ্যের ভিত্তিতে লাভ-ক্ষতির তালিকা (Product-wise Breakdown)
          </h3>
          <span className="text-xs text-slate-500">
            {productPerformances.length} টি পণ্য বিক্রি হয়েছে
          </span>
        </div>

        {productPerformances.length === 0 ? (
          <div className="p-8 text-center text-xs text-slate-400">
            এই মাসে কোন পণ্য বিক্রি হয়নি
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-500 font-semibold uppercase tracking-wider border-b border-slate-200/60">
                <tr>
                  <th className="px-6 py-3.5">পণ্য</th>
                  <th className="px-4 py-3.5 text-center">বিক্রীত পরিমাণ</th>
                  <th className="px-4 py-3.5 text-right">মোট বিক্রয়</th>
                  <th className="px-4 py-3.5 text-right">কেনা খরচ</th>
                  <th className="px-4 py-3.5 text-right">মোট লাভ / ক্ষতি</th>
                  <th className="px-6 py-3.5 text-right">মার্জিন (%)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-medium">
                {productPerformances.map((item, idx) => {
                  const margin = item.revenue > 0 ? (item.profit / item.revenue) * 100 : 0;
                  return (
                    <tr key={idx} className="hover:bg-slate-50/80 transition-colors">
                      <td className="px-6 py-3.5 font-bold text-slate-800">
                        {item.name}
                      </td>
                      <td className="px-4 py-3.5 text-center text-slate-600 font-semibold">
                        {item.quantity}
                      </td>
                      <td className="px-4 py-3.5 text-right text-slate-900 font-semibold">
                        {currency}{item.revenue.toLocaleString()}
                      </td>
                      <td className="px-4 py-3.5 text-right text-slate-500">
                        {currency}{item.cost.toLocaleString()}
                      </td>
                      <td className={`px-4 py-3.5 text-right font-black ${item.profit >= 0 ? 'text-emerald-700' : 'text-rose-600'}`}>
                        {item.profit >= 0 ? '+' : ''}{currency}{item.profit.toLocaleString()}
                      </td>
                      <td className="px-6 py-3.5 text-right">
                        <span className={`px-2 py-0.5 rounded-full font-bold text-[11px] ${
                          margin >= 15 ? 'bg-emerald-100 text-emerald-800' : margin >= 0 ? 'bg-blue-100 text-blue-800' : 'bg-rose-100 text-rose-800'
                        }`}>
                          {margin.toFixed(1)}%
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Monthly Report Print & PDF Modal */}
      {selectedSummary && (
        <MonthlyReportPrintModal
          isOpen={isReportModalOpen}
          onClose={() => setIsReportModalOpen(false)}
          summary={selectedSummary}
          sales={sales}
          products={products}
          currency={currency}
        />
      )}
    </div>
  );
};
