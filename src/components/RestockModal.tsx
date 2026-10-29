import React, { useState, useEffect } from 'react';
import { X, PackagePlus, CheckCircle2 } from 'lucide-react';
import { Product } from '../types';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  products: Product[];
  onRestock: (productId: string, addedStock: number, newCostPrice?: number) => void;
  currency: string;
  defaultProductId?: string;
}

export const RestockModal: React.FC<Props> = ({
  isOpen,
  onClose,
  products,
  onRestock,
  currency,
  defaultProductId,
}) => {
  const [selectedProductId, setSelectedProductId] = useState<string>('');
  const [quantity, setQuantity] = useState<number | ''>('');
  const [costPrice, setCostPrice] = useState<number | ''>('');

  useEffect(() => {
    if (isOpen) {
      const initialId = defaultProductId || (products.length > 0 ? products[0].id : '');
      setSelectedProductId(initialId);
      setQuantity('');
      const prod = products.find((p) => p.id === initialId);
      if (prod) {
        setCostPrice(prod.costPrice);
      } else {
        setCostPrice('');
      }
    }
  }, [isOpen, defaultProductId, products]);

  const handleProductChange = (id: string) => {
    setSelectedProductId(id);
    const prod = products.find((p) => p.id === id);
    if (prod) {
      setCostPrice(prod.costPrice);
    }
  };

  if (!isOpen) return null;

  const selectedProduct = products.find((p) => p.id === selectedProductId);
  const currentStock = selectedProduct?.stock || 0;
  const addedQty = Number(quantity) || 0;
  const newTotalStock = currentStock + addedQty;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedProductId || addedQty <= 0) return;

    onRestock(
      selectedProductId,
      addedQty,
      costPrice !== '' ? Number(costPrice) : undefined
    );
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-slate-900/60 backdrop-blur-xs overflow-y-auto">
      <div className="relative w-full max-w-md bg-white rounded-2xl sm:rounded-3xl shadow-2xl border border-slate-200 overflow-hidden my-auto max-h-[96vh] flex flex-col">
        <div className="px-4 sm:px-6 py-3.5 sm:py-4 bg-gradient-to-r from-blue-600 to-indigo-700 text-white flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2.5 sm:gap-3">
            <div className="p-1.5 sm:p-2 bg-white/10 rounded-lg">
              <PackagePlus className="w-5 h-5 text-white" />
            </div>
            <div>
              <h2 className="text-lg font-bold">নতুন স্টক যোগ করুন (Restock)</h2>
              <p className="text-xs text-blue-100">মজুদে নতুন পণ্য ক্রয় করে যুক্ত করুন</p>
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
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              প্রোডাক্ট সিলেক্ট করুন *
            </label>
            <select
              value={selectedProductId}
              onChange={(e) => handleProductChange(e.target.value)}
              required
              className="w-full px-4 py-2.5 rounded-xl border border-slate-300 focus:border-blue-500 text-slate-900 text-sm outline-none bg-white font-medium"
            >
              {products.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name} (বর্তমান মজুদ: {p.stock} {p.unit})
                </option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                যোগ করা পরিমাণ *
              </label>
              <input
                type="number"
                min="1"
                required
                value={quantity}
                onChange={(e) => setQuantity(e.target.value === '' ? '' : Number(e.target.value))}
                placeholder="0"
                className="w-full px-4 py-2.5 rounded-xl border border-slate-300 focus:border-blue-500 text-slate-900 text-sm outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                ক্রয়মূল্য ({currency})
              </label>
              <input
                type="number"
                min="0"
                step="any"
                value={costPrice}
                onChange={(e) => setCostPrice(e.target.value === '' ? '' : Number(e.target.value))}
                placeholder="0"
                className="w-full px-4 py-2.5 rounded-xl border border-slate-300 focus:border-blue-500 text-slate-900 text-sm outline-none"
              />
            </div>
          </div>

          {selectedProduct && (
            <div className="p-3 bg-blue-50/70 border border-blue-200 rounded-xl text-xs space-y-1 text-blue-900">
              <div className="flex justify-between">
                <span>বর্তমান স্টক:</span>
                <span className="font-semibold">{currentStock} {selectedProduct.unit}</span>
              </div>
              <div className="flex justify-between font-bold text-sm text-blue-700 pt-1 border-t border-blue-200">
                <span>যোগ করার পর মোট স্টক হবে:</span>
                <span>{newTotalStock} {selectedProduct.unit}</span>
              </div>
            </div>
          )}

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
              disabled={addedQty <= 0}
              className="px-6 py-2.5 text-sm font-bold text-white bg-blue-600 hover:bg-blue-700 rounded-xl shadow-xs transition-all flex items-center gap-2 disabled:opacity-50"
            >
              <CheckCircle2 className="w-4 h-4" />
              স্টক আপডেট করুন
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
