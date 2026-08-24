import React, { useState } from 'react';
import { Category, Product } from '../types';
import { X, Plus, PackagePlus, AlertCircle } from 'lucide-react';

interface AddProductModalProps {
  onClose: () => void;
  onSave: (product: Partial<Product>) => Promise<void>;
  isLoading: boolean;
}

export const AddProductModal: React.FC<AddProductModalProps> = ({
  onClose,
  onSave,
  isLoading
}) => {
  const [sku, setSku] = useState<string>('');
  const [name, setName] = useState<string>('');
  const [category, setCategory] = useState<Category>('ELECTRONICS');
  const [currentPrice, setCurrentPrice] = useState<number>(49.99);
  const [stockLevel, setStockLevel] = useState<number>(50);
  const [reorderThreshold, setReorderThreshold] = useState<number>(15);
  const [costPrice, setCostPrice] = useState<number>(25.00);
  const [marginFloor, setMarginFloor] = useState<number>(35.00);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!name.trim()) {
      setError('Product Name is required.');
      return;
    }

    const generatedSku = sku.trim() || `SKU-${category.substring(0, 4)}-${Math.floor(100 + Math.random() * 900)}`;
    const generatedId = `PRD-${Math.floor(100 + Math.random() * 900)}`;

    try {
      await onSave({
        id: generatedId,
        sku: generatedSku,
        name: name.trim(),
        category,
        currentPrice: Number(currentPrice),
        stockLevel: Number(stockLevel),
        reorderThreshold: Number(reorderThreshold),
        demandVelocity: 0,
        status: 'ACTIVE',
        costPrice: Number(costPrice),
        marginFloor: Number(marginFloor),
      });
      onClose();
    } catch (err: any) {
      setError(err.message || 'Failed to create product.');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/70 backdrop-blur-xs p-4 animate-in fade-in duration-150">
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-2xl max-w-lg w-full p-6 text-slate-900 dark:text-slate-100">
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-slate-200 dark:border-slate-800">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-indigo-600/10 text-indigo-600 dark:text-indigo-400 flex items-center justify-center font-bold">
              <PackagePlus className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-bold text-base text-slate-900 dark:text-white">Add New Catalog SKU</h3>
              <p className="text-xs font-mono text-slate-500 dark:text-slate-400">
                Register inventory item for dynamic pricing &amp; replenishment
              </p>
            </div>
          </div>
          <button onClick={onClose} className="p-1.5 text-slate-400 hover:text-slate-900 dark:hover:text-white rounded-lg transition-colors">
            <X className="w-4 h-4" />
          </button>
        </div>

        {error && (
          <div className="mt-4 p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-600 dark:text-rose-400 text-xs font-mono flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="mt-5 space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-[11px] font-mono uppercase tracking-wider text-slate-500 dark:text-slate-400 font-semibold mb-1">
                Product Name *
              </label>
              <input
                type="text"
                required
                placeholder="e.g. Ergonomic Keyboard"
                value={name}
                onChange={e => setName(e.target.value)}
                className="w-full px-3 py-2 text-xs font-sans bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl focus:outline-none focus:border-indigo-500 text-slate-900 dark:text-white"
              />
            </div>

            <div>
              <label className="block text-[11px] font-mono uppercase tracking-wider text-slate-500 dark:text-slate-400 font-semibold mb-1">
                Category
              </label>
              <select
                value={category}
                onChange={e => setCategory(e.target.value as Category)}
                className="w-full px-3 py-2 text-xs font-mono bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl focus:outline-none focus:border-indigo-500 text-slate-900 dark:text-white"
              >
                <option value="ELECTRONICS">ELECTRONICS</option>
                <option value="APPAREL">APPAREL</option>
                <option value="HOME">HOME</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-[11px] font-mono uppercase tracking-wider text-slate-500 dark:text-slate-400 font-semibold mb-1">
                SKU Code (Optional)
              </label>
              <input
                type="text"
                placeholder="e.g. SKU-ELEC-004"
                value={sku}
                onChange={e => setSku(e.target.value)}
                className="w-full px-3 py-2 text-xs font-mono bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl focus:outline-none focus:border-indigo-500 text-slate-900 dark:text-white"
              />
            </div>

            <div>
              <label className="block text-[11px] font-mono uppercase tracking-wider text-slate-500 dark:text-slate-400 font-semibold mb-1">
                Initial Price ($) *
              </label>
              <input
                type="number"
                step="0.01"
                min="0.1"
                required
                value={currentPrice}
                onChange={e => setCurrentPrice(parseFloat(e.target.value) || 0)}
                className="w-full px-3 py-2 text-xs font-mono bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl focus:outline-none focus:border-indigo-500 text-slate-900 dark:text-white"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-[11px] font-mono uppercase tracking-wider text-slate-500 dark:text-slate-400 font-semibold mb-1">
                Stock Level (Units) *
              </label>
              <input
                type="number"
                min="0"
                required
                value={stockLevel}
                onChange={e => setStockLevel(parseInt(e.target.value) || 0)}
                className="w-full px-3 py-2 text-xs font-mono bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl focus:outline-none focus:border-indigo-500 text-slate-900 dark:text-white"
              />
            </div>

            <div>
              <label className="block text-[11px] font-mono uppercase tracking-wider text-slate-500 dark:text-slate-400 font-semibold mb-1">
                Reorder Threshold *
              </label>
              <input
                type="number"
                min="1"
                required
                value={reorderThreshold}
                onChange={e => setReorderThreshold(parseInt(e.target.value) || 1)}
                className="w-full px-3 py-2 text-xs font-mono bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl focus:outline-none focus:border-indigo-500 text-slate-900 dark:text-white"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3 pt-1">
            <div>
              <label className="block text-[11px] font-mono uppercase tracking-wider text-slate-500 dark:text-slate-400 font-semibold mb-1">
                Cost Price ($)
              </label>
              <input
                type="number"
                step="0.01"
                min="0"
                value={costPrice}
                onChange={e => setCostPrice(parseFloat(e.target.value) || 0)}
                className="w-full px-3 py-2 text-xs font-mono bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl focus:outline-none focus:border-indigo-500 text-slate-900 dark:text-white"
              />
            </div>

            <div>
              <label className="block text-[11px] font-mono uppercase tracking-wider text-slate-500 dark:text-slate-400 font-semibold mb-1">
                Margin Floor ($)
              </label>
              <input
                type="number"
                step="0.01"
                min="0"
                value={marginFloor}
                onChange={e => setMarginFloor(parseFloat(e.target.value) || 0)}
                className="w-full px-3 py-2 text-xs font-mono bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl focus:outline-none focus:border-indigo-500 text-slate-900 dark:text-white"
              />
            </div>
          </div>

          <div className="flex items-center justify-end gap-2 pt-4 border-t border-slate-200 dark:border-slate-800">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-mono text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-800 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isLoading}
              className="flex items-center gap-1.5 px-5 py-2 text-xs font-mono font-bold bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl shadow-sm shadow-indigo-600/30 transition-all disabled:opacity-50"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Create Product</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

