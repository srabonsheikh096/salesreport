import React, { useRef, useState } from 'react';
import {
  X,
  Printer,
  Download,
  FileText,
  TrendingUp,
  TrendingDown,
  CheckCircle2,
  Calendar,
  DollarSign
} from 'lucide-react';
import { jsPDF } from 'jspdf';
import html2canvas from 'html2canvas';
import { MonthlySummary, SaleRecord, Product } from '../types';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  summary: MonthlySummary;
  sales: SaleRecord[];
  products: Product[];
  currency: string;
}

export const MonthlyReportPrintModal: React.FC<Props> = ({
  isOpen,
  onClose,
  summary,
  sales,
  currency,
}) => {
  const reportRef = useRef<HTMLDivElement>(null);
  const [isGeneratingPdf, setIsGeneratingPdf] = useState(false);

  if (!isOpen) return null;

  // Filter sales for this month
  const monthSales = sales.filter((s) => s.date.startsWith(summary.monthKey));

  // Product performance breakdown
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

  const isProfit = summary.netProfit >= 0;

  // Direct PDF Download using html2canvas and jsPDF
  const handleDownloadPDF = async () => {
    if (!reportRef.current) return;
    setIsGeneratingPdf(true);

    try {
      const element = reportRef.current;
      const canvas = await html2canvas(element, {
        scale: 2, // 2x DPI for crisp text and graphics
        useCORS: true,
        logging: false,
        backgroundColor: '#FFFFFF',
      });

      const imgData = canvas.toDataURL('image/jpeg', 0.95);
      const pdf = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: 'a4',
      });

      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = pdf.internal.pageSize.getHeight();
      const imgWidth = pdfWidth;
      const imgHeight = (canvas.height * pdfWidth) / canvas.width;

      let heightLeft = imgHeight;
      let position = 0;

      pdf.addImage(imgData, 'JPEG', 0, position, imgWidth, imgHeight);
      heightLeft -= pdfHeight;

      while (heightLeft > 0) {
        position = heightLeft - imgHeight;
        pdf.addPage();
        pdf.addImage(imgData, 'JPEG', 0, position, imgWidth, imgHeight);
        heightLeft -= pdfHeight;
      }

      const fileName = `Monthly_Sales_Report_${summary.monthKey}.pdf`;
      pdf.save(fileName);
    } catch (err) {
      console.error('PDF generation error:', err);
      // Fallback to browser print dialog
      window.print();
    } finally {
      setIsGeneratingPdf(false);
    }
  };

  const handleBrowserPrint = () => {
    window.print();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-slate-900/70 backdrop-blur-xs overflow-y-auto print:p-0 print:bg-white print:static">
      <div className="relative w-full max-w-4xl bg-white rounded-3xl shadow-2xl border border-slate-200 overflow-hidden my-4 sm:my-8 print:shadow-none print:border-none print:m-0 print:w-full print:max-w-none">
        {/* Modal Action Bar (hidden when printing) */}
        <div className="no-print px-6 py-4 bg-slate-900 text-white flex flex-wrap items-center justify-between gap-3 border-b border-slate-800">
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-emerald-500/20 text-emerald-400 rounded-xl">
              <FileText className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-white">
                মাসিক বিক্রয় ও লাভ-ক্ষতি প্রতিবেদন (Monthly Statement)
              </h2>
              <p className="text-[11px] text-slate-400">
                {summary.monthName} • মোট বিক্রয়: {currency}{summary.totalRevenue.toLocaleString()}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleBrowserPrint}
              className="px-3.5 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold rounded-xl transition-all flex items-center gap-1.5 border border-slate-700"
            >
              <Printer className="w-3.5 h-3.5 text-slate-300" />
              প্রিন্ট (Print)
            </button>

            <button
              type="button"
              onClick={handleDownloadPDF}
              disabled={isGeneratingPdf}
              className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold rounded-xl shadow-xs transition-all flex items-center gap-1.5 disabled:opacity-50"
            >
              <Download className={`w-3.5 h-3.5 ${isGeneratingPdf ? 'animate-bounce' : ''}`} />
              {isGeneratingPdf ? 'PDF তৈরি হচ্ছে...' : 'PDF ডাউনলোড করুন'}
            </button>

            <button
              type="button"
              onClick={onClose}
              className="p-2 text-slate-400 hover:text-white rounded-xl hover:bg-slate-800 transition-colors ml-1"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Printable Document Container */}
        <div className="max-h-[80vh] overflow-y-auto print:max-h-none print:overflow-visible">
          <div
            ref={reportRef}
            className="p-6 sm:p-10 bg-white text-slate-900 space-y-6 print:p-6"
            style={{ fontFamily: "'Hind Siliguri', 'Plus Jakarta Sans', sans-serif" }}
          >
            {/* Report Header */}
            <div className="border-b-2 border-slate-900 pb-5 flex flex-wrap items-start justify-between gap-4">
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-xl sm:text-2xl font-black text-slate-950 tracking-tight">
                    স্মার্ট প্রোডাক্ট স্টক ও লাভ খাতা
                  </span>
                  <span className="px-2 py-0.5 bg-emerald-100 text-emerald-800 text-[10px] font-bold rounded-md uppercase">
                    মাসিক হিসাব
                  </span>
                </div>
                <p className="text-xs text-slate-500 mt-1">
                  ব্যবসার পণ্য মজুদ, দৈনিক বিক্রয় এবং মাসভিত্তিক নীট লাভ-ক্ষতি স্টেটমেন্ট
                </p>
                <div className="flex items-center gap-4 mt-2 text-xs font-semibold text-slate-700">
                  <span className="flex items-center gap-1">
                    <Calendar className="w-3.5 h-3.5 text-slate-400" />
                    প্রতিবেদনের মাস: <strong>{summary.monthName}</strong>
                  </span>
                  <span>•</span>
                  <span>
                    প্রস্তুতের তারিখ: {new Date().toLocaleDateString('bn-BD', { year: 'numeric', month: 'long', day: 'numeric' })}
                  </span>
                </div>
              </div>

              <div className="text-right">
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
                  আর্থিক অবস্থা
                </span>
                <span
                  className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-black mt-1 ${
                    isProfit
                      ? 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                      : 'bg-rose-100 text-rose-800 border border-rose-300'
                  }`}
                >
                  {isProfit ? <TrendingUp className="w-3.5 h-3.5" /> : <TrendingDown className="w-3.5 h-3.5" />}
                  {isProfit ? 'লাভজনক (Profitable)' : 'ক্ষতি (Loss)'}
                </span>
              </div>
            </div>

            {/* Summary Highlights Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 print:gap-2">
              <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200">
                <p className="text-[11px] font-bold text-slate-500 uppercase">মোট বিক্রয় (Revenue)</p>
                <p className="text-xl font-black text-slate-950 mt-1">
                  {currency}{summary.totalRevenue.toLocaleString()}
                </p>
                <p className="text-[10px] text-slate-500 mt-0.5">
                  {summary.totalSalesCount} টি অর্ডারে
                </p>
              </div>

              <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200">
                <p className="text-[11px] font-bold text-slate-500 uppercase">মোট কেনা খরচ (Cost)</p>
                <p className="text-xl font-black text-slate-800 mt-1">
                  {currency}{summary.totalCost.toLocaleString()}
                </p>
                <p className="text-[10px] text-slate-500 mt-0.5">
                  {summary.totalItemsSold} ইউনিট বিক্রির খরচ
                </p>
              </div>

              <div
                className={`p-3.5 rounded-xl border ${
                  isProfit
                    ? 'bg-emerald-50/90 border-emerald-300 text-emerald-950'
                    : 'bg-rose-50/90 border-rose-300 text-rose-950'
                }`}
              >
                <p className="text-[11px] font-bold uppercase">
                  {isProfit ? 'নীট লাভ (Net Profit)' : 'নীট ক্ষতি (Net Loss)'}
                </p>
                <p
                  className={`text-xl font-black mt-1 ${
                    isProfit ? 'text-emerald-700' : 'text-rose-700'
                  }`}
                >
                  {isProfit ? '+' : ''}{currency}{summary.netProfit.toLocaleString()}
                </p>
                <p className="text-[10px] font-bold mt-0.5">
                  মার্জিন: {summary.profitMargin.toFixed(1)}%
                </p>
              </div>

              <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200">
                <p className="text-[11px] font-bold text-slate-500 uppercase">শীর্ষ লাভজনক পণ্য</p>
                <p className="text-sm font-black text-slate-900 mt-1 truncate">
                  {summary.topProduct?.name || 'কোন পণ্য নেই'}
                </p>
                <p className="text-[10px] font-bold text-emerald-700 mt-0.5">
                  {summary.topProduct ? `লাভ: ${currency}${summary.topProduct.profit.toLocaleString()}` : '-'}
                </p>
              </div>
            </div>

            {/* Product Performance Table */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <h3 className="text-xs font-black uppercase tracking-wider text-slate-800">
                  পণ্যের বিক্রয় ও লাভ-ক্ষতির বিবরণ (Product Breakdown)
                </h3>
                <span className="text-[11px] text-slate-500">
                  {productPerformances.length} টি পণ্য
                </span>
              </div>

              <div className="border border-slate-200 rounded-xl overflow-hidden">
                <table className="w-full text-left text-xs border-collapse">
                  <thead className="bg-slate-100 text-slate-700 font-bold border-b border-slate-200">
                    <tr>
                      <th className="px-3 py-2 text-center w-8">#</th>
                      <th className="px-3 py-2">পণ্যের নাম</th>
                      <th className="px-3 py-2 text-center">বিক্রীত সংখ্যা</th>
                      <th className="px-3 py-2 text-right">মোট বিক্রয়</th>
                      <th className="px-3 py-2 text-right">মোট কেনা খরচ</th>
                      <th className="px-3 py-2 text-right">নীট লাভ/ক্ষতি</th>
                      <th className="px-3 py-2 text-right">মার্জিন</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 font-medium">
                    {productPerformances.map((item, idx) => {
                      const margin = item.revenue > 0 ? (item.profit / item.revenue) * 100 : 0;
                      return (
                        <tr key={idx} className={idx % 2 === 0 ? 'bg-white' : 'bg-slate-50/50'}>
                          <td className="px-3 py-2 text-center text-slate-400 font-bold">{idx + 1}</td>
                          <td className="px-3 py-2 font-bold text-slate-900">{item.name}</td>
                          <td className="px-3 py-2 text-center text-slate-700 font-semibold">{item.quantity}</td>
                          <td className="px-3 py-2 text-right text-slate-900">{currency}{item.revenue.toLocaleString()}</td>
                          <td className="px-3 py-2 text-right text-slate-500">{currency}{item.cost.toLocaleString()}</td>
                          <td className={`px-3 py-2 text-right font-bold ${item.profit >= 0 ? 'text-emerald-700' : 'text-rose-600'}`}>
                            {item.profit >= 0 ? '+' : ''}{currency}{item.profit.toLocaleString()}
                          </td>
                          <td className="px-3 py-2 text-right font-bold text-slate-700">
                            {margin.toFixed(1)}%
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Daily Sales Records */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <h3 className="text-xs font-black uppercase tracking-wider text-slate-800">
                  দৈনিক বিক্রয় ও মেমো তালিকা (Daily Sales Ledger)
                </h3>
                <span className="text-[11px] text-slate-500">
                  {monthSales.length} টি বিক্রয় রেকর্ড
                </span>
              </div>

              <div className="border border-slate-200 rounded-xl overflow-hidden">
                <table className="w-full text-left text-xs border-collapse">
                  <thead className="bg-slate-100 text-slate-700 font-bold border-b border-slate-200">
                    <tr>
                      <th className="px-3 py-2">তারিখ</th>
                      <th className="px-3 py-2">পণ্য</th>
                      <th className="px-2 py-2 text-center">পরিমাণ</th>
                      <th className="px-2 py-2 text-right">কেনা দর</th>
                      <th className="px-2 py-2 text-right">বিক্রয় দর</th>
                      <th className="px-3 py-2 text-right">মোট বিক্রয়</th>
                      <th className="px-3 py-2 text-right">লাভ</th>
                      <th className="px-3 py-2">নোট</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 font-medium text-[11px]">
                    {monthSales.map((s, idx) => (
                      <tr key={s.id} className={idx % 2 === 0 ? 'bg-white' : 'bg-slate-50/50'}>
                        <td className="px-3 py-2 text-slate-700 font-semibold whitespace-nowrap">{s.date}</td>
                        <td className="px-3 py-2 font-bold text-slate-900">{s.productName}</td>
                        <td className="px-2 py-2 text-center font-bold text-slate-800">{s.quantity}</td>
                        <td className="px-2 py-2 text-right text-slate-500">{currency}{s.unitCostPrice}</td>
                        <td className="px-2 py-2 text-right font-bold text-slate-900">{currency}{s.sellingPrice}</td>
                        <td className="px-3 py-2 text-right font-bold text-slate-900">{currency}{s.totalRevenue.toLocaleString()}</td>
                        <td className={`px-3 py-2 text-right font-black ${s.profit >= 0 ? 'text-emerald-700' : 'text-rose-600'}`}>
                          {s.profit >= 0 ? '+' : ''}{currency}{s.profit.toLocaleString()}
                        </td>
                        <td className="px-3 py-2 text-slate-500 truncate max-w-[150px]">{s.customerNote || '-'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Signature & Verification Block */}
            <div className="pt-8 border-t border-slate-200 grid grid-cols-2 gap-8 text-center text-xs">
              <div>
                <div className="w-48 mx-auto border-b border-slate-400 mb-1"></div>
                <p className="font-semibold text-slate-700">হিসাবরক্ষক / প্রস্তুতকারক</p>
                <p className="text-[10px] text-slate-400">স্বাক্ষর ও তারিখ</p>
              </div>

              <div>
                <div className="w-48 mx-auto border-b border-slate-400 mb-1"></div>
                <p className="font-semibold text-slate-700">স্বত্বাধিকারী / অনুমোদনকারী</p>
                <p className="text-[10px] text-slate-400">স্বাক্ষর ও তারিখ</p>
              </div>
            </div>

            {/* System Footnote */}
            <div className="text-center text-[10px] text-slate-400 pt-2">
              এই স্টেটমেন্টটি "স্মার্ট প্রোডাক্ট স্টক ও লাভ খাতা" সিস্টেম দ্বারা স্বয়ংক্রিয়ভাবে প্রস্তুতকৃত।
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
