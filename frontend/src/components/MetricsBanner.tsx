import React from 'react';
import { Package, AlertTriangle, Layers, Zap, TrendingUp } from 'lucide-react';
import { DashboardMetrics } from '../types';

interface MetricsBannerProps {
  metrics: DashboardMetrics | null;
}

export const MetricsBanner: React.FC<MetricsBannerProps> = ({ metrics }) => {
  if (!metrics) return null;

  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 mb-8">
      {/* 1. Total Catalog SKUs */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 shadow-xs transition-colors">
        <div className="flex items-center justify-between text-slate-500 dark:text-slate-400 mb-1.5">
          <span className="text-[11px] font-mono uppercase tracking-wider font-medium">Catalog SKUs</span>
          <Package className="w-4 h-4 text-slate-400" />
        </div>
        <div className="flex items-baseline gap-1.5">
          <span className="text-2xl sm:text-3xl font-mono font-bold text-slate-900 dark:text-white">
            {metrics.totalProducts}
          </span>
          <span className="text-[11px] font-mono text-slate-500">items</span>
        </div>
      </div>

      {/* 2. Action Required (Pending Approvals) */}
      <div className={`border rounded-2xl p-4 shadow-xs transition-all ${
        metrics.pendingReviewCount > 0
          ? 'bg-amber-500/5 dark:bg-amber-500/10 border-amber-500/30'
          : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800'
      }`}>
        <div className="flex items-center justify-between mb-1.5">
          <span className="text-[11px] font-mono uppercase tracking-wider font-semibold text-amber-600 dark:text-amber-400">
            Action Queue
          </span>
          {metrics.pendingReviewCount > 0 ? (
            <span className="w-2 h-2 rounded-full bg-amber-500 animate-ping" />
          ) : (
            <Layers className="w-4 h-4 text-slate-400" />
          )}
        </div>
        <div className="flex items-baseline gap-1.5">
          <span className="text-2xl sm:text-3xl font-mono font-bold text-amber-600 dark:text-amber-400">
            {metrics.pendingReviewCount}
          </span>
          <span className="text-[11px] font-mono text-amber-700/80 dark:text-amber-300/80">
            queued
          </span>
        </div>
      </div>

      {/* 3. Low Stock Alerts */}
      <div className={`border rounded-2xl p-4 shadow-xs transition-all ${
        metrics.lowStockCount > 0
          ? 'bg-rose-500/5 dark:bg-rose-500/10 border-rose-500/30'
          : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800'
      }`}>
        <div className="flex items-center justify-between mb-1.5">
          <span className="text-[11px] font-mono uppercase tracking-wider font-semibold text-rose-600 dark:text-rose-400">
            Low Stock
          </span>
          <AlertTriangle className="w-4 h-4 text-rose-500" />
        </div>
        <div className="flex items-baseline gap-1.5">
          <span className="text-2xl sm:text-3xl font-mono font-bold text-rose-600 dark:text-rose-400">
            {metrics.lowStockCount}
          </span>
          <span className="text-[11px] font-mono text-rose-700/80 dark:text-rose-300/80">
            &le; threshold
          </span>
        </div>
      </div>

      {/* 4. Pricing Proposals */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 shadow-xs transition-colors">
        <div className="flex items-center justify-between text-slate-500 dark:text-slate-400 mb-1.5">
          <span className="text-[11px] font-mono uppercase tracking-wider font-medium">Pricing AI</span>
          <TrendingUp className="w-4 h-4 text-indigo-500" />
        </div>
        <div className="flex items-baseline gap-1.5">
          <span className="text-2xl sm:text-3xl font-mono font-bold text-indigo-600 dark:text-indigo-400">
            {metrics.pendingPricingSuggestions}
          </span>
          <span className="text-[11px] font-mono text-slate-500">pending</span>
        </div>
      </div>

      {/* 5. Reorder Batches */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 shadow-xs transition-colors">
        <div className="flex items-center justify-between text-slate-500 dark:text-slate-400 mb-1.5">
          <span className="text-[11px] font-mono uppercase tracking-wider font-medium">Reorders AI</span>
          <Layers className="w-4 h-4 text-emerald-500" />
        </div>
        <div className="flex items-baseline gap-1.5">
          <span className="text-2xl sm:text-3xl font-mono font-bold text-emerald-600 dark:text-emerald-400">
            {metrics.pendingReorderSuggestions}
          </span>
          <span className="text-[11px] font-mono text-slate-500">batches</span>
        </div>
      </div>

      {/* 6. Category Benchmarks Capsule */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-3.5 shadow-xs transition-colors col-span-2 sm:col-span-3 lg:col-span-1 flex flex-col justify-between">
        <div className="flex items-center justify-between text-slate-500 dark:text-slate-400 mb-1">
          <span className="text-[10.5px] font-mono uppercase tracking-wider font-medium">Benchmarks</span>
          <Zap className="w-3.5 h-3.5 text-indigo-500" />
        </div>
        <div className="grid grid-cols-3 lg:grid-cols-1 gap-1 text-xs font-mono">
          <div className="flex justify-between items-center text-[11px] bg-slate-50 dark:bg-slate-950 p-1 px-2 rounded-md">
            <span className="text-slate-400">ELEC</span>
            <span className="font-bold text-slate-900 dark:text-white">{metrics.categoryAverages.ELECTRONICS || 0}/d</span>
          </div>
          <div className="flex justify-between items-center text-[11px] bg-slate-50 dark:bg-slate-950 p-1 px-2 rounded-md">
            <span className="text-slate-400">APP</span>
            <span className="font-bold text-slate-900 dark:text-white">{metrics.categoryAverages.APPAREL || 0}/d</span>
          </div>
          <div className="flex justify-between items-center text-[11px] bg-slate-50 dark:bg-slate-950 p-1 px-2 rounded-md">
            <span className="text-slate-400">HOME</span>
            <span className="font-bold text-slate-900 dark:text-white">{metrics.categoryAverages.HOME || 0}/d</span>
          </div>
        </div>
      </div>
    </div>
  );
};
