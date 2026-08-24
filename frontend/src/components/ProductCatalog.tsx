import React, { useState } from 'react';
import {
  Product,
  ProductStatus
} from '../types';
import {
  ShoppingCart,
  Zap,
  Edit3,
  Sparkles,
  Radio,
  Search,
  AlertTriangle,
  Flame,
  CheckCircle,
  XCircle,
  RefreshCw
} from 'lucide-react';

interface ProductCatalogProps {
  products: Product[];
  categoryAverages: Record<string, number>;
  onSimulateOrder: (id: string, quantity: number) => void;
  onOpenStockModal: (product: Product) => void;
  onRunAiAdvisor: (id: string) => void;
  onOpenStreamModal: (product: Product) => void;
  isLoading: boolean;
  evaluatingProductIds?: Set<string>;
}

export const ProductCatalog: React.FC<ProductCatalogProps> = ({
  products,
  categoryAverages,
  onSimulateOrder,
  onOpenStockModal,
  onRunAiAdvisor,
  onOpenStreamModal,
  isLoading,
  evaluatingProductIds = new Set()
}) => {
  const [selectedCategory, setSelectedCategory] = useState<string>('ALL');
  const [selectedStatus, setSelectedStatus] = useState<string>('ALL');
  const [searchQuery, setSearchQuery] = useState<string>('');

  const filteredProducts = products.filter(p => {
    if (selectedCategory !== 'ALL' && p.category !== selectedCategory) return false;
    if (selectedStatus !== 'ALL' && p.status !== selectedStatus) return false;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      return (
        p.name.toLowerCase().includes(q) ||
        p.sku.toLowerCase().includes(q) ||
        p.id.toLowerCase().includes(q)
      );
    }
    return true;
  });

  const renderStatusBadge = (product: Product) => {
    const isEvaluating = evaluatingProductIds.has(product.id);

    if (isEvaluating) {
      return (
        <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-md text-[10.5px] font-mono font-bold bg-indigo-500/20 text-indigo-600 dark:text-indigo-300 border border-indigo-500/40 animate-pulse">
          <RefreshCw className="w-3 h-3 animate-spin text-indigo-500" />
          AI Evaluating...
        </span>
      );
    }

    if (product.stockLevel === 0 || product.status === 'OUT_OF_STOCK') {
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-md text-[10.5px] font-mono font-semibold bg-rose-500/15 text-rose-600 dark:text-rose-400 border border-rose-500/30">
          <XCircle className="w-3 h-3" />
          OUT_OF_STOCK
        </span>
      );
    }
    if (product.status === 'PRICE_REVIEW_PENDING') {
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-md text-[10.5px] font-mono font-semibold bg-amber-500/15 text-amber-600 dark:text-amber-400 border border-amber-500/30 animate-pulse">
          <AlertTriangle className="w-3 h-3" />
          REVIEW_PENDING
        </span>
      );
    }
    return (
      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-md text-[10.5px] font-mono font-semibold bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30">
        <CheckCircle className="w-3 h-3" />
        ACTIVE
      </span>
    );
  };

  return (
    <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs overflow-hidden mb-12">
      {/* Header & Controls */}
      <div className="p-4 sm:p-5 border-b border-slate-200 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-950/40">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h2 className="font-bold text-base text-slate-900 dark:text-white">
              Inventory Catalog &amp; Simulation Controls
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400 font-mono mt-0.5">
              Live stock levels, burn-rate telemetry &amp; autonomous agent dispatchers
            </p>
          </div>

          {/* Search bar */}
          <div className="relative w-full md:w-64">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 transform -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search SKU or name..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-3 py-1.5 text-xs font-mono bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl focus:outline-none focus:border-indigo-500 text-slate-900 dark:text-white transition-colors"
            />
          </div>
        </div>

        {/* Filter Chips */}
        <div className="flex flex-wrap items-center gap-2 mt-4 pt-3 border-t border-slate-200 dark:border-slate-800">
          <div className="flex items-center gap-1 text-[11px] font-mono text-slate-400 mr-1">
            <span>Category:</span>
          </div>
          {['ALL', 'ELECTRONICS', 'APPAREL', 'HOME'].map(cat => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`px-3 py-1 rounded-lg text-xs font-mono transition-all ${
                selectedCategory === cat
                  ? 'bg-slate-900 text-white dark:bg-indigo-600 dark:text-white font-semibold shadow-xs'
                  : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-700'
              }`}
            >
              {cat}
            </button>
          ))}

          <div className="flex items-center gap-1 text-[11px] font-mono text-slate-400 sm:ml-auto mr-1 mt-2 sm:mt-0">
            <span>Status:</span>
          </div>
          {['ALL', 'ACTIVE', 'PRICE_REVIEW_PENDING', 'OUT_OF_STOCK'].map(st => (
            <button
              key={st}
              onClick={() => setSelectedStatus(st)}
              className={`px-3 py-1 rounded-lg text-xs font-mono transition-all ${
                selectedStatus === st
                  ? 'bg-indigo-600 text-white font-semibold shadow-xs'
                  : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-700'
              }`}
            >
              {st}
            </button>
          ))}
        </div>
      </div>

      {/* 1. Desktop Table View (Hidden on mobile) */}
      <div className="hidden md:block overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-slate-100/60 dark:bg-slate-950/60 text-[10.5px] font-mono uppercase tracking-wider text-slate-500 dark:text-slate-400 border-b border-slate-200 dark:border-slate-800">
              <th className="py-3.5 px-5 font-semibold">SKU &amp; Product</th>
              <th className="py-3.5 px-5 font-semibold">Live Price</th>
              <th className="py-3.5 px-5 font-semibold">Stock Health</th>
              <th className="py-3.5 px-5 font-semibold">24h Velocity</th>
              <th className="py-3.5 px-5 font-semibold">Lifecycle</th>
              <th className="py-3.5 px-5 font-semibold text-right">Interactive Simulators</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-200 dark:divide-slate-800 text-xs">
            {filteredProducts.map(product => {
              const catAvg = categoryAverages[product.category] || 5.0;
              const isSpike = product.demandVelocity > (2.0 * catAvg) && product.demandVelocity >= 8;
              const isLowStock = product.stockLevel <= product.reorderThreshold;
              const stockPct = Math.min(100, Math.round((product.stockLevel / (product.reorderThreshold * 2.5)) * 100));
              const isEvaluating = evaluatingProductIds.has(product.id);

              return (
                <tr
                  key={product.id}
                  className={`transition-colors ${
                    isEvaluating
                      ? 'bg-indigo-50/50 dark:bg-indigo-950/20'
                      : 'hover:bg-slate-50/80 dark:hover:bg-slate-800/30'
                  }`}
                >
                  {/* SKU & Product */}
                  <td className="py-4 px-5">
                    <div className="font-mono text-[11px] text-slate-400 font-medium">{product.sku}</div>
                    <div className="font-semibold text-sm text-slate-900 dark:text-white mt-0.5">{product.name}</div>
                    <div className="text-[10px] font-mono px-2 py-0.5 inline-block rounded bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 mt-1 border border-slate-200 dark:border-slate-700">
                      {product.category}
                    </div>
                  </td>

                  {/* Price */}
                  <td className="py-4 px-5">
                    <div className="font-mono font-bold text-sm text-slate-900 dark:text-white">
                      ${product.currentPrice.toFixed(2)}
                    </div>
                    {product.costPrice && (
                      <div className="text-[10.5px] font-mono text-slate-400 mt-0.5">
                        Cost: ${product.costPrice.toFixed(2)}
                      </div>
                    )}
                  </td>

                  {/* Stock Health */}
                  <td className="py-4 px-5 min-w-[160px]">
                    <div className="flex items-center justify-between font-mono text-xs mb-1">
                      <span className={`font-bold ${
                        product.stockLevel === 0
                          ? 'text-rose-500'
                          : isLowStock
                          ? 'text-amber-500'
                          : 'text-slate-900 dark:text-white'
                      }`}>
                        {product.stockLevel} units
                      </span>
                      <span className="text-slate-400 text-[10.5px]">min {product.reorderThreshold}</span>
                    </div>
                    <div className="w-full h-1.5 rounded-full bg-slate-200 dark:bg-slate-800 overflow-hidden">
                      <div
                        className={`h-full rounded-full transition-all ${
                          product.stockLevel === 0
                            ? 'bg-rose-500'
                            : isLowStock
                            ? 'bg-amber-500 animate-pulse'
                            : 'bg-emerald-500'
                        }`}
                        style={{ width: `${Math.max(5, stockPct)}%` }}
                      />
                    </div>
                  </td>

                  {/* Velocity */}
                  <td className="py-4 px-5">
                    <div className="flex items-center gap-1.5">
                      <span className={`font-mono font-bold text-sm ${isSpike ? 'text-cyan-600 dark:text-cyan-400' : 'text-slate-900 dark:text-white'}`}>
                        {product.demandVelocity}
                      </span>
                      <span className="text-[11px] font-mono text-slate-400">orders/day</span>
                      {isSpike && (
                        <span className="inline-flex items-center text-[10px] font-mono font-bold px-1.5 py-0.5 rounded bg-cyan-500/15 text-cyan-600 dark:text-cyan-400 border border-cyan-500/30">
                          <Flame className="w-3 h-3 mr-0.5 text-cyan-500" />
                          Surge
                        </span>
                      )}
                    </div>
                    <div className="text-[10px] font-mono text-slate-400 mt-0.5">
                      Cat. avg: {catAvg}/day
                    </div>
                  </td>

                  {/* Lifecycle */}
                  <td className="py-4 px-5">
                    {renderStatusBadge(product)}
                  </td>

                  {/* Organized Simulators Control Bar */}
                  <td className="py-4 px-5 text-right">
                    <div className="flex items-center justify-end gap-2 flex-wrap">
                      {/* 1. Sales Simulation Segment */}
                      <div className="flex items-center bg-slate-100 dark:bg-slate-800/80 p-0.5 rounded-xl border border-slate-200 dark:border-slate-700/60">
                        <button
                          onClick={() => onSimulateOrder(product.id, 1)}
                          disabled={isLoading || product.stockLevel === 0}
                          className="flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-mono hover:bg-white dark:hover:bg-slate-700 text-slate-900 dark:text-white transition-all disabled:opacity-40"
                          title="Simulate 1 sale (decrements stock by 1, bumps velocity)"
                        >
                          <ShoppingCart className="w-3 h-3 text-indigo-500" />
                          <span>1x Sale</span>
                        </button>
                        <button
                          onClick={() => onSimulateOrder(product.id, 5)}
                          disabled={isLoading || product.stockLevel === 0}
                          className="flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-mono bg-cyan-500/15 hover:bg-cyan-500/25 text-cyan-700 dark:text-cyan-300 font-semibold transition-all disabled:opacity-40"
                          title="Simulate surge (+5 orders, tests DEMAND_SPIKE loop)"
                        >
                          <Zap className="w-3 h-3 text-cyan-500" />
                          <span>Surge (+5)</span>
                        </button>
                      </div>

                      {/* 2. AI Intelligence Segment */}
                      <div className="flex items-center bg-indigo-50/60 dark:bg-indigo-950/30 p-0.5 rounded-xl border border-indigo-200 dark:border-indigo-800/50">
                        <button
                          onClick={() => onRunAiAdvisor(product.id)}
                          disabled={isLoading}
                          className="flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-mono text-indigo-600 dark:text-indigo-400 hover:bg-white dark:hover:bg-indigo-900/50 transition-colors"
                          title="Request on-demand AI pricing & reorder proposals"
                        >
                          <Sparkles className="w-3 h-3" />
                          <span>Advise</span>
                        </button>
                        <button
                          onClick={() => onOpenStreamModal(product)}
                          className="flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-mono text-indigo-600 dark:text-indigo-400 hover:bg-white dark:hover:bg-indigo-900/50 transition-colors"
                          title="Stream AI token reasoning live via SSE"
                        >
                          <Radio className="w-3 h-3 animate-pulse" />
                          <span>Stream</span>
                        </button>
                      </div>

                      {/* 3. Direct Stock Edit */}
                      <button
                        onClick={() => onOpenStockModal(product)}
                        className="p-1.5 text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 transition-colors"
                        title="Directly edit stock units"
                      >
                        <Edit3 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* 2. Mobile Responsive Card List */}
      <div className="block md:hidden divide-y divide-slate-200 dark:divide-slate-800">
        {filteredProducts.map(product => {
          const catAvg = categoryAverages[product.category] || 5.0;
          const isSpike = product.demandVelocity > (2.0 * catAvg) && product.demandVelocity >= 8;
          const isLowStock = product.stockLevel <= product.reorderThreshold;
          const stockPct = Math.min(100, Math.round((product.stockLevel / (product.reorderThreshold * 2.5)) * 100));

          return (
            <div key={product.id} className="p-4 space-y-3">
              {/* Top info */}
              <div className="flex items-start justify-between gap-2">
                <div>
                  <span className="text-[11px] font-mono text-slate-400">{product.sku}</span>
                  <h3 className="font-bold text-sm text-slate-900 dark:text-white">{product.name}</h3>
                  <div className="flex items-center gap-2 mt-1">
                    <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-slate-700">
                      {product.category}
                    </span>
                    {renderStatusBadge(product)}
                  </div>
                </div>
                <div className="text-right">
                  <div className="font-mono font-bold text-base text-slate-900 dark:text-white">
                    ${product.currentPrice.toFixed(2)}
                  </div>
                  {product.costPrice && (
                    <div className="text-[10px] font-mono text-slate-400">Cost: ${product.costPrice.toFixed(2)}</div>
                  )}
                </div>
              </div>

              {/* Stock health bar & Velocity row */}
              <div className="bg-slate-50 dark:bg-slate-950 p-3 rounded-xl border border-slate-200 dark:border-slate-800 space-y-2">
                <div className="flex items-center justify-between text-xs font-mono">
                  <span className={`font-bold ${
                    product.stockLevel === 0 ? 'text-rose-500' : isLowStock ? 'text-amber-500' : 'text-slate-900 dark:text-white'
                  }`}>
                    Stock: {product.stockLevel} units
                  </span>
                  <span className="text-slate-400 text-[10.5px]">Min threshold: {product.reorderThreshold}</span>
                </div>
                <div className="w-full h-1.5 rounded-full bg-slate-200 dark:bg-slate-800 overflow-hidden">
                  <div
                    className={`h-full rounded-full ${
                      product.stockLevel === 0 ? 'bg-rose-500' : isLowStock ? 'bg-amber-500' : 'bg-emerald-500'
                    }`}
                    style={{ width: `${Math.max(5, stockPct)}%` }}
                  />
                </div>

                <div className="flex items-center justify-between text-xs font-mono pt-1">
                  <div className="flex items-center gap-1.5">
                    <span className="text-slate-400">Velocity:</span>
                    <span className={`font-bold ${isSpike ? 'text-cyan-500' : 'text-slate-900 dark:text-white'}`}>
                      {product.demandVelocity}/day
                    </span>
                    {isSpike && (
                      <span className="text-[10px] px-1 py-0.2 rounded bg-cyan-500/15 text-cyan-600 dark:text-cyan-400 font-bold">
                        Surge
                      </span>
                    )}
                  </div>
                  <span className="text-slate-400 text-[10.5px]">Cat. avg: {catAvg}/d</span>
                </div>
              </div>

              {/* Mobile Simulator Action Buttons (Grid) */}
              <div className="grid grid-cols-2 gap-2 pt-1">
                <button
                  onClick={() => onSimulateOrder(product.id, 1)}
                  disabled={isLoading || product.stockLevel === 0}
                  className="flex items-center justify-center gap-1 py-2 rounded-xl text-xs font-mono bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-900 dark:text-white border border-slate-200 dark:border-slate-700"
                >
                  <ShoppingCart className="w-3.5 h-3.5 text-indigo-500" />
                  <span>1x Sale</span>
                </button>

                <button
                  onClick={() => onSimulateOrder(product.id, 5)}
                  disabled={isLoading || product.stockLevel === 0}
                  className="flex items-center justify-center gap-1 py-2 rounded-xl text-xs font-mono bg-cyan-500/15 text-cyan-700 dark:text-cyan-300 font-semibold border border-cyan-500/30"
                >
                  <Zap className="w-3.5 h-3.5 text-cyan-500" />
                  <span>Surge (+5)</span>
                </button>

                <button
                  onClick={() => onRunAiAdvisor(product.id)}
                  disabled={isLoading}
                  className="flex items-center justify-center gap-1 py-2 rounded-xl text-xs font-mono bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border border-indigo-500/30"
                >
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>AI Advise</span>
                </button>

                <button
                  onClick={() => onOpenStreamModal(product)}
                  className="flex items-center justify-center gap-1 py-2 rounded-xl text-xs font-mono bg-indigo-600 text-white font-semibold"
                >
                  <Radio className="w-3.5 h-3.5" />
                  <span>Stream AI</span>
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
