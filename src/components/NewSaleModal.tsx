import React, { useState, useEffect } from 'react';
import { X, ShoppingCart, TrendingUp, AlertCircle, Sparkles } from 'lucide-react';
import confetti from 'canvas-confetti';
import { Product, SaleRecord } from '../types';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  products: Product[];
  onSaveSale: (sale: SaleRecord) => void;
  currency: string;
  defaultProductId?: string;
}

export const NewSaleModal: React.FC<Props> = ({
  isOpen,
  onClose,
  products,
  onSaveSale,
  currency,
  defaultProductId,
}) => {
  const [selectedProductId, setSelectedProductId] = useState<string>('');
  const [date, setDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [sellingPrice, setSellingPrice] = useState<number | ''>('');
  const [quantity, setQuantity] = useState<number | ''>('');
  const [note, setNote] = useState<string>('');

  // Selected product object
  const selectedProduct = products.find((p) => p.id === selectedProductId);

  useEffect(() => {
    if (isOpen) {
      const initialId = defaultProductId || (products.length > 0 ? products[0].id : '');
      setSelectedProductId(initialId);
      setDate(new Date().toISOString().split('T')[0]);
      setNote('');
      setQuantity(1);

      const prod = products.find((p) => p.id === initialId);
      if (prod) {
        setSellingPrice(prod.sellingPrice);
      } else {
        setSellingPrice('');
      }
    }
  }, [isOpen, defaultProductId, products]);

  // When selected product changes, pre-fill its default selling price
  const handleProductChange = (newId: string) => {
    setSelectedProductId(newId);
    const prod = products.find((p) => p.id === newId);
    if (prod) {
      setSellingPrice(prod.sellingPrice);
    }
  };

  if (!isOpen) return null;

  const costPrice = selectedProduct?.costPrice || 0;
  const currentStock = selectedProduct?.stock || 0;
  const qty = Number(quantity) || 0;
  const price = Number(sellingPrice) || 0;

  const totalRevenue = qty * price;
  const totalCost = qty * costPrice;
  const netProfit = totalRevenue - totalCost;
  const profitMargin = totalRevenue > 0 ? (netProfit / totalRevenue) * 100 : 0;

  const isOutOfStock = currentStock <= 0;
  const isOverStock = qty > currentStock;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedProduct || qty <= 0) return;

    const sale: SaleRecord = {
      id: `sale-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
      productId: selectedProduct.id,
      productName: selectedProduct.name,
      date,
      quantity: qty,
      unitCostPrice: costPrice,
      sellingPrice: price,
      totalRevenue,
      totalCost,
      profit: netProfit,
      customerNote: note.trim() || undefined,
      createdAt: new Date().toISOString(),
    };

    onSaveSale(sale);

    // Fun confetti if profit > 0
    if (netProfit > 0) {
      try {
        confetti({
          particleCount: 40,
          spread: 60,
          origin: { y: 0.8 },
          colors: ['#10b981', '#059669', '#34d399', '#f59e0b'],
        });
      } catch {
        // Safe fallback
      }
    }

    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-slate-900/60 backdrop-blur-xs overflow-y-auto">
      <div className="relative w-full max-w-lg bg-white rounded-2xl sm:rounded-3xl shadow-2xl border border-slate-200 overflow-hidden my-auto max-h-[96vh] flex flex-col">
        {/* Header */}
        <div className="px-4 sm:px-6 py-3.5 sm:py-4 bg-gradient-to-r from-teal-600 to-emerald-700 text-white flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2.5 sm:gap-3">
            <div className="p-1.5 sm:p-2 bg-white/10 rounded-lg">
              <ShoppingCart className="w-5 h-5 text-white" />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-bold">নতুন বিক্রয় এন্ট্রি (Record Sale)</h2>
              <p className="text-xs text-teal-100">
                বিক্রির পরিমাণ, সেদিনের দাম ও তাৎক্ষণিক লাভের হিসাব
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 text-white/80 hover:text-white rounded-lg hover:bg-white/10 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {/* Product selector */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              প্রোডাক্ট সিলেক্ট করুন * (Select Product)
            </label>
            <select
              value={selectedProductId}
              onChange={(e) => handleProductChange(e.target.value)}
              required
              className="w-full px-4 py-2.5 rounded-xl border border-slate-300 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 text-slate-900 text-sm outline-none bg-white font-medium"
            >
              {products.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name} (মজুদ: {p.stock} {p.unit} | ক্রয়: {currency}{p.costPrice})
                </option>
              ))}
            </select>
          </div>

          {/* Product status indicator */}
          {selectedProduct && (
            <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl flex items-center justify-between text-xs">
              <div className="flex items-center gap-2">
                <span className="text-slate-500">ক্রয়মূল্য (Cost Price):</span>
                <span className="font-bold text-slate-800">{currency}{selectedProduct.costPrice} / {selectedProduct.unit}</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-slate-500">বর্তমান স্টক (Stock):</span>
                <span
                  className={`font-bold px-2 py-0.5 rounded-full ${
                    selectedProduct.stock <= 0
                      ? 'bg-rose-100 text-rose-700'
                      : selectedProduct.stock <= selectedProduct.minStockAlert
                      ? 'bg-amber-100 text-amber-700'
                      : 'bg-emerald-100 text-emerald-800'
                  }`}
                >
                  {selectedProduct.stock} {selectedProduct.unit}
                </span>
              </div>
            </div>
          )}

          {/* Date & Selling Price */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                বিক্রির তারিখ * (Sale Date)
              </label>
              <input
                type="date"
                required
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="w-full px-4 py-2.5 rounded-xl border border-slate-300 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 text-slate-900 text-sm outline-none bg-white"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                সেদিনের বিক্রয়মূল্য * ({currency})
              </label>
              <input
                type="number"
                min="0"
                step="any"
                required
                value={sellingPrice}
                onChange={(e) => setSellingPrice(e.target.value === '' ? '' : Number(e.target.value))}
                placeholder="সেদিন কত দামে বিক্রি করলেন"
                className="w-full px-4 py-2.5 rounded-xl border border-slate-300 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 text-slate-900 text-sm outline-none font-semibold text-emerald-700"
              />
            </div>
          </div>

          {/* Quantity */}
          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="text-xs font-semibold text-slate-700">
                বিক্রির পরিমাণ (কত সেল হলো) *
              </label>
              {selectedProduct && (
                <span className="text-[11px] text-slate-500">
                  সর্বোচ্চ স্টক: {selectedProduct.stock} {selectedProduct.unit}
                </span>
              )}
            </div>
            <input
              type="number"
              min="1"
              required
              value={quantity}
              onChange={(e) => setQuantity(e.target.value === '' ? '' : Number(e.target.value))}
              placeholder="কত পিস বা কত ইউনিট বিক্রি হলো"
              className={`w-full px-4 py-2.5 rounded-xl border text-slate-900 text-sm outline-none font-semibold ${
                isOverStock
                  ? 'border-rose-400 focus:border-rose-500 focus:ring-2 focus:ring-rose-500/20 bg-rose-50/50'
                  : 'border-slate-300 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20'
              }`}
            />
            {isOverStock && (
              <p className="mt-1 text-xs text-rose-600 flex items-center gap-1 font-medium">
                <AlertCircle className="w-3.5 h-3.5" />
                সতর্কতা: বিক্রির পরিমাণ বর্তমান স্টকের ({currentStock}) চেয়ে বেশি!
              </p>
            )}
          </div>

          {/* Real-time Profit/Loss Preview Card */}
          <div className="p-4 bg-gradient-to-br from-slate-900 to-slate-800 text-white rounded-2xl shadow-inner space-y-3">
            <div className="flex items-center justify-between text-xs text-slate-300 border-b border-slate-700/60 pb-2">
              <span className="flex items-center gap-1.5 font-medium">
                <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                তাৎক্ষণিক হিসাব (Instant Calculation)
              </span>
              <span>
                {qty} {selectedProduct?.unit || 'পিস'}
              </span>
            </div>

            <div className="grid grid-cols-3 gap-2 text-center">
              <div className="p-2 bg-slate-800/80 rounded-xl">
                <p className="text-[10px] text-slate-400 uppercase tracking-wider">মোট বিক্রয়</p>
                <p className="text-sm font-bold text-slate-100 mt-0.5">
                  {currency}{totalRevenue.toLocaleString()}
                </p>
              </div>

              <div className="p-2 bg-slate-800/80 rounded-xl">
                <p className="text-[10px] text-slate-400 uppercase tracking-wider">মোট ক্রয় খরচ</p>
                <p className="text-sm font-bold text-slate-300 mt-0.5">
                  {currency}{totalCost.toLocaleString()}
                </p>
              </div>

              <div className={`p-2 rounded-xl ${netProfit >= 0 ? 'bg-emerald-950/80 border border-emerald-500/30' : 'bg-rose-950/80 border border-rose-500/30'}`}>
                <p className="text-[10px] uppercase tracking-wider font-semibold text-slate-300">
                  {netProfit >= 0 ? 'মোট লাভ' : 'মোট ক্ষতি'}
                </p>
                <p className={`text-base font-black mt-0.5 ${netProfit >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                  {netProfit >= 0 ? '+' : ''}{currency}{netProfit.toLocaleString()}
                </p>
              </div>
            </div>

            <div className="flex items-center justify-between text-[11px] text-slate-400 pt-1">
              <span>লাভের অনুপাত (Profit Margin):</span>
              <span className={`font-bold ${profitMargin >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                {profitMargin.toFixed(1)}%
              </span>
            </div>
          </div>

          {/* Optional Note */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              ক্রেতার নাম বা নোট (Customer / Note - Optional)
            </label>
            <input
              type="text"
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="যেমন: ক্যাশ মেমো #১০২, রহিম ভাই"
              className="w-full px-4 py-2 rounded-xl border border-slate-300 focus:border-emerald-500 text-slate-900 text-xs outline-none"
            />
          </div>

          {/* Action buttons */}
          <div className="pt-3 flex items-center justify-end gap-3 border-t border-slate-200">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 text-sm font-semibold text-slate-600 hover:text-slate-800 bg-slate-100 hover:bg-slate-200 rounded-xl transition-all"
            >
              বাতিল
            </button>
            <button
              type="submit"
              disabled={isOutOfStock && qty > 0}
              className="px-6 py-2.5 text-sm font-bold text-white bg-emerald-600 hover:bg-emerald-700 active:scale-95 disabled:opacity-50 disabled:pointer-events-none rounded-xl shadow-xs transition-all flex items-center gap-2"
            >
              <TrendingUp className="w-4 h-4" />
              বিক্রয় কনফার্ম করুন
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
