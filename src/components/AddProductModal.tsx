import React, { useState, useEffect } from 'react';
import { X, Plus, Trash2, Layers, CheckCircle2 } from 'lucide-react';
import { Product } from '../types';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onSaveProduct: (product: Product) => void;
  onSaveMultipleProducts: (products: Product[]) => void;
  editingProduct?: Product | null;
  currency: string;
}

interface BulkRow {
  name: string;
  category: string;
  unit: string;
  costPrice: number | '';
  sellingPrice: number | '';
  stock: number | '';
}

export const AddProductModal: React.FC<Props> = ({
  isOpen,
  onClose,
  onSaveProduct,
  onSaveMultipleProducts,
  editingProduct,
  currency,
}) => {
  const [mode, setMode] = useState<'single' | 'bulk'>('single');

  // Single product state
  const [name, setName] = useState('');
  const [category, setCategory] = useState('');
  const [unit, setUnit] = useState('পিস');
  const [costPrice, setCostPrice] = useState<number | ''>('');
  const [sellingPrice, setSellingPrice] = useState<number | ''>('');
  const [stock, setStock] = useState<number | ''>('');
  const [minStockAlert, setMinStockAlert] = useState<number | ''>(5);

  // Bulk products state
  const [bulkRows, setBulkRows] = useState<BulkRow[]>([
    { name: '', category: 'মুদি পণ্য', unit: 'পিস', costPrice: '', sellingPrice: '', stock: '' },
    { name: '', category: 'মুদি পণ্য', unit: 'কেজি', costPrice: '', sellingPrice: '', stock: '' },
    { name: '', category: 'মুদি পণ্য', unit: 'প্যাকেট', costPrice: '', sellingPrice: '', stock: '' },
  ]);

  useEffect(() => {
    if (editingProduct) {
      setMode('single');
      setName(editingProduct.name);
      setCategory(editingProduct.category);
      setUnit(editingProduct.unit);
      setCostPrice(editingProduct.costPrice);
      setSellingPrice(editingProduct.sellingPrice);
      setStock(editingProduct.stock);
      setMinStockAlert(editingProduct.minStockAlert);
    } else {
      setName('');
      setCategory('');
      setUnit('পিস');
      setCostPrice('');
      setSellingPrice('');
      setStock('');
      setMinStockAlert(5);
    }
  }, [editingProduct, isOpen]);

  if (!isOpen) return null;

  const handleSingleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    const prod: Product = {
      id: editingProduct ? editingProduct.id : `prod-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
      name: name.trim(),
      category: category.trim() || 'সাধারণ পণ্য',
      unit: unit.trim() || 'পিস',
      costPrice: Number(costPrice) || 0,
      sellingPrice: Number(sellingPrice) || 0,
      stock: Number(stock) || 0,
      initialStock: editingProduct ? editingProduct.initialStock : (Number(stock) || 0),
      minStockAlert: Number(minStockAlert) || 5,
      createdAt: editingProduct ? editingProduct.createdAt : new Date().toISOString(),
    };

    onSaveProduct(prod);
    onClose();
  };

  const handleAddBulkRow = () => {
    setBulkRows([
      ...bulkRows,
      { name: '', category: 'মুদি পণ্য', unit: 'পিস', costPrice: '', sellingPrice: '', stock: '' },
    ]);
  };

  const handleRemoveBulkRow = (index: number) => {
    if (bulkRows.length <= 1) return;
    setBulkRows(bulkRows.filter((_, i) => i !== index));
  };

  const handleBulkChange = (index: number, field: keyof BulkRow, val: any) => {
    const updated = [...bulkRows];
    updated[index] = { ...updated[index], [field]: val };
    setBulkRows(updated);
  };

  const handleBulkSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const validRows = bulkRows.filter((r) => r.name.trim().length > 0);
    if (validRows.length === 0) return;

    const newProducts: Product[] = validRows.map((r, i) => ({
      id: `prod-${Date.now()}-${i}-${Math.random().toString(36).substr(2, 4)}`,
      name: r.name.trim(),
      category: r.category.trim() || 'সাধারণ পণ্য',
      unit: r.unit.trim() || 'পিস',
      costPrice: Number(r.costPrice) || 0,
      sellingPrice: Number(r.sellingPrice) || 0,
      stock: Number(r.stock) || 0,
      initialStock: Number(r.stock) || 0,
      minStockAlert: 5,
      createdAt: new Date().toISOString(),
    }));

    onSaveMultipleProducts(newProducts);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-slate-900/60 backdrop-blur-xs overflow-y-auto">
      <div className={`relative w-full ${mode === 'bulk' ? 'max-w-4xl' : 'max-w-xl'} bg-white rounded-2xl sm:rounded-3xl shadow-2xl border border-slate-200 overflow-hidden my-auto max-h-[95vh] flex flex-col`}>
        {/* Header */}
        <div className="px-4 sm:px-6 py-3.5 sm:py-4 bg-gradient-to-r from-emerald-600 to-teal-700 text-white flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2.5 sm:gap-3">
            <div className="p-1.5 sm:p-2 bg-white/10 rounded-lg">
              <Layers className="w-5 h-5 text-white" />
            </div>
            <div>
              <h2 className="text-lg font-bold">
                {editingProduct ? 'পণ্যের তথ্য পরিবর্তন করুন' : 'নতুন পণ্য / প্রোডাক্ট যুক্ত করুন'}
              </h2>
              <p className="text-xs text-emerald-100">
                ক্রয়মূল্য, বিক্রয়মূল্য ও স্টক সঠিকভাবে হিসাব রাখুন
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

        {/* Mode Selector (Single vs Bulk) */}
        {!editingProduct && (
          <div className="flex border-b border-slate-200 bg-slate-50/80 p-2 gap-2">
            <button
              type="button"
              onClick={() => setMode('single')}
              className={`flex-1 py-2 text-sm font-semibold rounded-xl transition-all ${
                mode === 'single'
                  ? 'bg-white text-emerald-700 shadow-xs border border-slate-200'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              একক পণ্য (Single Product)
            </button>
            <button
              type="button"
              onClick={() => setMode('bulk')}
              className={`flex-1 py-2 text-sm font-semibold rounded-xl transition-all ${
                mode === 'bulk'
                  ? 'bg-white text-emerald-700 shadow-xs border border-slate-200'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              মাল্টি-প্রোডাক্ট একসাথে (Multiple Products) ✨
            </button>
          </div>
        )}

        {/* Single Form */}
        {mode === 'single' && (
          <form onSubmit={handleSingleSubmit} className="p-6 space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                প্রোডাক্টের নাম * (Product Name)
              </label>
              <input
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="যেমন: তীর সয়াবিন তেল (৫ লিটার), মিনিকেট চাল"
                className="w-full px-4 py-2.5 rounded-xl border border-slate-300 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 text-slate-900 text-sm outline-none"
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  ক্যাটাগরি (Category)
                </label>
                <input
                  type="text"
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  placeholder="যেমন: মুদি পণ্য, চাল-ডাল, পানীয়"
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-300 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 text-slate-900 text-sm outline-none"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  একক (Unit)
                </label>
                <select
                  value={unit}
                  onChange={(e) => setUnit(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-300 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 text-slate-900 text-sm outline-none bg-white"
                >
                  <option value="পিস">পিস (Piece)</option>
                  <option value="কেজি">কেজি (KG)</option>
                  <option value="লিটার">লিটার (Liter)</option>
                  <option value="বস্তা">বস্তা (Sack/Bag)</option>
                  <option value="প্যাকেট">প্যাকেট (Packet)</option>
                  <option value="বক্স">বক্স (Box)</option>
                  <option value="ডজন">ডজন (Dozen)</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  ক্রয়মূল্য / কেনা দাম * ({currency})
                </label>
                <input
                  type="number"
                  min="0"
                  step="any"
                  required
                  value={costPrice}
                  onChange={(e) => setCostPrice(e.target.value === '' ? '' : Number(e.target.value))}
                  placeholder="0.00"
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-300 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 text-slate-900 text-sm outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  বিক্রয়মূল্য * ({currency})
                </label>
                <input
                  type="number"
                  min="0"
                  step="any"
                  required
                  value={sellingPrice}
                  onChange={(e) => setSellingPrice(e.target.value === '' ? '' : Number(e.target.value))}
                  placeholder="0.00"
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-300 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 text-slate-900 text-sm outline-none"
                />
              </div>
            </div>

            {/* Estimated Unit Profit helper */}
            {typeof costPrice === 'number' && typeof sellingPrice === 'number' && (
              <div className="p-3 bg-emerald-50 rounded-xl border border-emerald-200 flex items-center justify-between text-xs">
                <span className="text-emerald-800 font-medium">
                  প্রতি এককে আনুমানিক লাভ:
                </span>
                <span className={`font-bold text-sm ${sellingPrice >= costPrice ? 'text-emerald-700' : 'text-rose-600'}`}>
                  {currency}{(sellingPrice - costPrice).toFixed(2)}
                  {' '}
                  ({costPrice > 0 ? (((sellingPrice - costPrice) / costPrice) * 100).toFixed(1) + '%' : '0%'})
                </span>
              </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  বর্তমান মজুদ / স্টক * (Current Stock)
                </label>
                <input
                  type="number"
                  min="0"
                  required
                  value={stock}
                  onChange={(e) => setStock(e.target.value === '' ? '' : Number(e.target.value))}
                  placeholder="0"
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-300 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 text-slate-900 text-sm outline-none"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  কম স্টক সতর্কবার্তা লেভেল (Alert at)
                </label>
                <input
                  type="number"
                  min="1"
                  value={minStockAlert}
                  onChange={(e) => setMinStockAlert(e.target.value === '' ? '' : Number(e.target.value))}
                  placeholder="5"
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-300 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 text-slate-900 text-sm outline-none"
                />
              </div>
            </div>

            <div className="pt-4 flex items-center justify-end gap-3 border-t border-slate-200">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2.5 text-sm font-semibold text-slate-600 hover:text-slate-800 bg-slate-100 hover:bg-slate-200 rounded-xl transition-all"
              >
                বাতিল
              </button>
              <button
                type="submit"
                className="px-6 py-2.5 text-sm font-bold text-white bg-emerald-600 hover:bg-emerald-700 rounded-xl shadow-xs transition-all flex items-center gap-2"
              >
                <CheckCircle2 className="w-4 h-4" />
                {editingProduct ? 'আপডেট করুন' : 'পণ্য সংরক্ষণ করুন'}
              </button>
            </div>
          </form>
        )}

        {/* Multi-Product Bulk Form */}
        {mode === 'bulk' && (
          <form onSubmit={handleBulkSubmit} className="p-6 space-y-4">
            <p className="text-xs text-slate-600">
              নিচে এক বা একাধিক প্রোডাক্টের বিবরণ লিখুন। খালি থাকা সারিগুলো স্বয়ংক্রিয়ভাবে বাদ দেওয়া হবে।
            </p>

            <div className="max-h-96 overflow-y-auto space-y-3 pr-1">
              {bulkRows.map((row, idx) => (
                <div
                  key={idx}
                  className="p-3 bg-slate-50 border border-slate-200 rounded-xl grid grid-cols-12 gap-2 items-center"
                >
                  <div className="col-span-12 sm:col-span-4">
                    <label className="block text-[10px] font-semibold text-slate-500 mb-0.5">
                      পণ্যের নাম {idx + 1} *
                    </label>
                    <input
                      type="text"
                      placeholder="পণ্যের নাম লিখুন"
                      value={row.name}
                      onChange={(e) => handleBulkChange(idx, 'name', e.target.value)}
                      className="w-full px-2.5 py-1.5 text-xs rounded-lg border border-slate-300 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 outline-none bg-white"
                    />
                  </div>

                  <div className="col-span-6 sm:col-span-2">
                    <label className="block text-[10px] font-semibold text-slate-500 mb-0.5">
                      একক
                    </label>
                    <select
                      value={row.unit}
                      onChange={(e) => handleBulkChange(idx, 'unit', e.target.value)}
                      className="w-full px-2 py-1.5 text-xs rounded-lg border border-slate-300 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 outline-none bg-white"
                    >
                      <option value="পিস">পিস</option>
                      <option value="কেজি">কেজি</option>
                      <option value="লিটার">লিটার</option>
                      <option value="বস্তা">বস্তা</option>
                      <option value="প্যাকেট">প্যাকেট</option>
                      <option value="বক্স">বক্স</option>
                    </select>
                  </div>

                  <div className="col-span-6 sm:col-span-2">
                    <label className="block text-[10px] font-semibold text-slate-500 mb-0.5">
                      ক্রয়মূল্য ({currency})
                    </label>
                    <input
                      type="number"
                      placeholder="0"
                      value={row.costPrice}
                      onChange={(e) => handleBulkChange(idx, 'costPrice', e.target.value === '' ? '' : Number(e.target.value))}
                      className="w-full px-2.5 py-1.5 text-xs rounded-lg border border-slate-300 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 outline-none bg-white"
                    />
                  </div>

                  <div className="col-span-6 sm:col-span-2">
                    <label className="block text-[10px] font-semibold text-slate-500 mb-0.5">
                      বিক্রয়মূল্য ({currency})
                    </label>
                    <input
                      type="number"
                      placeholder="0"
                      value={row.sellingPrice}
                      onChange={(e) => handleBulkChange(idx, 'sellingPrice', e.target.value === '' ? '' : Number(e.target.value))}
                      className="w-full px-2.5 py-1.5 text-xs rounded-lg border border-slate-300 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 outline-none bg-white"
                    />
                  </div>

                  <div className="col-span-5 sm:col-span-1">
                    <label className="block text-[10px] font-semibold text-slate-500 mb-0.5">
                      স্টক
                    </label>
                    <input
                      type="number"
                      placeholder="0"
                      value={row.stock}
                      onChange={(e) => handleBulkChange(idx, 'stock', e.target.value === '' ? '' : Number(e.target.value))}
                      className="w-full px-2 py-1.5 text-xs rounded-lg border border-slate-300 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 outline-none bg-white"
                    />
                  </div>

                  <div className="col-span-1 flex justify-center pt-3 sm:pt-0">
                    <button
                      type="button"
                      onClick={() => handleRemoveBulkRow(idx)}
                      disabled={bulkRows.length <= 1}
                      className="text-slate-400 hover:text-rose-600 p-1 disabled:opacity-30 transition-colors"
                      title="মুছুন"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>

            <button
              type="button"
              onClick={handleAddBulkRow}
              className="w-full py-2 border-2 border-dashed border-emerald-300 hover:border-emerald-500 bg-emerald-50/50 hover:bg-emerald-50 text-emerald-700 text-xs font-bold rounded-xl transition-all flex items-center justify-center gap-1.5"
            >
              <Plus className="w-4 h-4" />
              আরও একটি প্রোডাক্টের সারি যোগ করুন
            </button>

            <div className="pt-4 flex items-center justify-end gap-3 border-t border-slate-200">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2.5 text-sm font-semibold text-slate-600 hover:text-slate-800 bg-slate-100 hover:bg-slate-200 rounded-xl transition-all"
              >
                বাতিল
              </button>
              <button
                type="submit"
                className="px-6 py-2.5 text-sm font-bold text-white bg-emerald-600 hover:bg-emerald-700 rounded-xl shadow-xs transition-all flex items-center gap-2"
              >
                <CheckCircle2 className="w-4 h-4" />
                সবগুলো পণ্য সংরক্ষণ করুন ({bulkRows.filter(r => r.name.trim()).length} টি)
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};
