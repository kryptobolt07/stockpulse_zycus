import React, { useState } from 'react';
import { Product } from '../types';
import { X, Check, AlertTriangle } from 'lucide-react';

interface AdjustStockModalProps {
  product: Product | null;
  onClose: () => void;
  onSave: (id: string, newStock: number) => void;
  isLoading: boolean;
}

export const AdjustStockModal: React.FC<AdjustStockModalProps> = ({
  product,
  onClose,
  onSave,
  isLoading
}) => {
  if (!product) return null;

  const [stock, setStock] = useState<number>(product.stockLevel);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave(product.id, stock);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-sm p-4">
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800/80 shadow-2xl shadow-slate-900/30 max-w-md w-full animate-scale-in text-slate-900 dark:text-slate-100 overflow-hidden">
        {/* Gradient accent bar at top */}
        <div className="h-1 w-full bg-gradient-to-r from-indigo-500 via-violet-500 to-cyan-500" />

        <div className="p-6">
          <div className="flex items-center justify-between pb-4 border-b border-slate-200/80 dark:border-slate-800/80">
            <div>
              <h3 className="font-bold text-base text-slate-900 dark:text-white tracking-tight">Adjust Stock Level</h3>
              <p className="text-xs font-mono text-slate-500 dark:text-slate-400 mt-0.5">{product.name} · <span className="text-indigo-500">{product.sku}</span></p>
            </div>
            <button
              onClick={onClose}
              className="p-1.5 text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-all"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          <form onSubmit={handleSubmit} className="mt-4 space-y-4">
            <div>
              <label className="block text-[10px] font-mono uppercase tracking-widest text-slate-500 dark:text-slate-400 font-semibold mb-2">
                Stock Units
              </label>
              <div className="flex items-center gap-3 text-xs font-mono text-slate-400 mb-2">
                <span>Current: <span className="text-slate-700 dark:text-slate-300 font-semibold">{product.stockLevel}</span></span>
                <span>·</span>
                <span>Reorder at: <span className="text-amber-500 font-semibold">{product.reorderThreshold}</span></span>
              </div>
              <input
                type="number"
                min="0"
                value={stock}
                onChange={e => setStock(parseInt(e.target.value) || 0)}
                className="w-full px-4 py-3 text-base font-mono bg-slate-50 dark:bg-slate-950/60 border border-slate-200/80 dark:border-slate-800/80 rounded-xl focus:outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 text-slate-900 dark:text-white transition-all"
                autoFocus
              />
              {stock < product.reorderThreshold && (
                <div className="mt-2 flex items-center gap-2 px-3 py-2 rounded-xl bg-amber-500/10 border border-amber-500/30 text-xs font-mono text-amber-600 dark:text-amber-400">
                  <AlertTriangle className="w-3.5 h-3.5 shrink-0" />
                  <span>Below reorder threshold — will trigger agentic loop!</span>
                </div>
              )}
            </div>

            <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-200/80 dark:border-slate-800/80">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 text-xs font-mono text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl border border-slate-200/80 dark:border-slate-800/80 transition-all"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isLoading}
                className="flex items-center gap-1.5 px-5 py-2 text-xs font-mono font-semibold bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 text-white rounded-xl shadow-glow-indigo transition-all disabled:opacity-50"
              >
                <Check className="w-3.5 h-3.5" />
                <span>Update Stock</span>
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};
