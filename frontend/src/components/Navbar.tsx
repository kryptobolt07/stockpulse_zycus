import React from 'react';
import { Activity, RefreshCw, Database, RotateCcw, Sun, Moon, Sparkles, Plus, Terminal, LayoutDashboard } from 'lucide-react';
import { StrategyConfig } from '../types';

interface NavbarProps {
  strategyConfig: StrategyConfig | null;
  onToggleStrategy: () => void;
  onRefresh: () => void;
  onResetData: () => void;
  onOpenAddProduct: () => void;
  isRefreshing: boolean;
  autoRefresh: boolean;
  onToggleAutoRefresh: () => void;
  darkMode: boolean;
  onToggleDarkMode: () => void;
  activeTab: 'DASHBOARD' | 'SIMULATION' | 'API_EXPLORER';
  onSelectTab: (tab: 'DASHBOARD' | 'SIMULATION' | 'API_EXPLORER') => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  strategyConfig,
  onToggleStrategy,
  onRefresh,
  onResetData,
  onOpenAddProduct,
  isRefreshing,
  autoRefresh,
  onToggleAutoRefresh,
  darkMode,
  onToggleDarkMode,
  activeTab,
  onSelectTab,
}) => {
  const isAi = strategyConfig?.activeMode === 'AI_POWERED';

  return (
    <header className="sticky top-0 z-30 glass-header border-b border-slate-200 dark:border-slate-800/80 bg-white/90 dark:bg-slate-950/90 transition-colors">
      <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 gap-2 sm:gap-4">
          {/* Logo & Tab Switcher */}
          <div className="flex items-center gap-4 shrink-0">
            <div className="flex items-center gap-2.5 sm:gap-3">
              <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-indigo-500 to-indigo-700 flex items-center justify-center text-white shadow-sm shadow-indigo-600/30">
                <Activity className="w-4 h-4 animate-pulse" />
              </div>
              <div className="flex flex-col">
                <div className="flex items-center gap-1.5">
                  <span className="font-extrabold text-base tracking-tight text-slate-900 dark:text-white">
                    StockPulse
                  </span>
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 hidden sm:inline-block" />
                </div>
                <span className="text-[10.5px] font-mono text-slate-500 dark:text-slate-400 hidden sm:block">
                  Commerce Console
                </span>
              </div>
            </div>

            {/* Navigation Tabs (Dashboard vs Simulation vs API Explorer) */}
            <div className="flex items-center h-9 bg-slate-100 dark:bg-slate-900 p-0.5 rounded-xl border border-slate-200 dark:border-slate-800 text-xs font-mono ml-1 sm:ml-3">
              <button
                onClick={() => onSelectTab('DASHBOARD')}
                className={`h-8 flex items-center gap-1.5 px-2.5 sm:px-3 rounded-lg transition-all ${
                  activeTab === 'DASHBOARD'
                    ? 'bg-white dark:bg-slate-800 text-slate-900 dark:text-white font-bold shadow-xs'
                    : 'text-slate-500 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                <LayoutDashboard className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Console</span>
              </button>
              <button
                onClick={() => onSelectTab('SIMULATION')}
                className={`h-8 flex items-center gap-1.5 px-2.5 sm:px-3 rounded-lg transition-all ${
                  activeTab === 'SIMULATION'
                    ? 'bg-white dark:bg-slate-800 text-indigo-600 dark:text-indigo-400 font-bold shadow-xs'
                    : 'text-slate-500 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                <Activity className="w-3.5 h-3.5" />
                <span>Simulation (1d=1m)</span>
              </button>
              <button
                onClick={() => onSelectTab('API_EXPLORER')}
                className={`h-8 flex items-center gap-1.5 px-2.5 sm:px-3 rounded-lg transition-all ${
                  activeTab === 'API_EXPLORER'
                    ? 'bg-white dark:bg-slate-800 text-indigo-600 dark:text-indigo-400 font-bold shadow-xs'
                    : 'text-slate-500 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                <Terminal className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">API Explorer</span>
              </button>
            </div>
          </div>

          {/* Strategy Toggle Pill Switch (Equal h-9 height) */}
          <div className="hidden md:flex items-center h-9 bg-slate-100 dark:bg-slate-900 p-0.5 rounded-xl border border-slate-200 dark:border-slate-800 text-xs font-mono">
            <button
              onClick={onToggleStrategy}
              className={`h-8 flex items-center gap-1.5 px-2.5 sm:px-3 rounded-lg transition-all ${
                isAi
                  ? 'bg-indigo-600 text-white font-semibold shadow-xs'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
              title="AI Agent Strategy"
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>AI Agent</span>
            </button>
            <button
              onClick={onToggleStrategy}
              className={`h-8 flex items-center gap-1.5 px-2.5 sm:px-3 rounded-lg transition-all ${
                !isAi
                  ? 'bg-slate-800 text-white dark:bg-slate-800 font-semibold shadow-xs'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
              title="Deterministic Rule Engine"
            >
              <Database className="w-3.5 h-3.5" />
              <span>Rule Engine</span>
            </button>
          </div>

          {/* Action Buttons (All standardized to h-9 equal height) */}
          <div className="flex items-center gap-1.5 sm:gap-2">
            {/* Add Product Button */}
            {activeTab === 'DASHBOARD' && (
              <button
                onClick={onOpenAddProduct}
                className="h-9 flex items-center gap-1.5 px-3 sm:px-3.5 rounded-xl text-xs font-mono font-semibold bg-indigo-600 hover:bg-indigo-500 text-white shadow-sm shadow-indigo-600/30 transition-all shrink-0"
                title="Add New Catalog SKU"
              >
                <Plus className="w-4 h-4" />
                <span className="hidden lg:inline">New Product</span>
              </button>
            )}

            {/* Live Auto-Poll Indicator */}
            <button
              onClick={onToggleAutoRefresh}
              className={`h-9 hidden lg:flex items-center gap-2 px-3 rounded-xl text-xs font-mono border transition-all ${
                autoRefresh
                  ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/30'
                  : 'bg-slate-100 dark:bg-slate-900 text-slate-500 border-slate-200 dark:border-slate-800'
              }`}
              title="Toggle 2.5s live auto-refresh"
            >
              <span className={`w-2 h-2 rounded-full ${autoRefresh ? 'bg-emerald-500 animate-ping' : 'bg-slate-400'}`} />
              <span>{autoRefresh ? 'Live' : 'Paused'}</span>
            </button>

            {/* Refresh Button (w-9 h-9) */}
            <button
              onClick={onRefresh}
              disabled={isRefreshing}
              className="w-9 h-9 flex items-center justify-center text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl hover:bg-slate-200 dark:hover:bg-slate-800 transition-colors shrink-0"
              title="Refresh telemetry"
            >
              <RefreshCw className={`w-4 h-4 ${isRefreshing ? 'animate-spin text-indigo-500' : ''}`} />
            </button>

            {/* Dark/Light Mode Switcher (w-9 h-9) */}
            <button
              onClick={onToggleDarkMode}
              className="w-9 h-9 flex items-center justify-center text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl hover:bg-slate-200 dark:hover:bg-slate-800 transition-colors shrink-0"
              title={darkMode ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
            >
              {darkMode ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4 text-slate-700" />}
            </button>

            {/* Reset Catalog Button (w-9 h-9) */}
            <button
              onClick={onResetData}
              className="w-9 h-9 hidden sm:flex items-center justify-center text-slate-500 hover:text-rose-600 dark:hover:text-rose-400 bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl hover:border-rose-500/30 transition-colors shrink-0"
              title="Reset catalog to initial Addendum A state"
            >
              <RotateCcw className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>
    </header>
  );
};
