import React from 'react';
import {
  Activity,
  RefreshCw,
  Database,
  RotateCcw,
  Sun,
  Moon,
  Sparkles,
  Plus,
  Terminal,
  LayoutDashboard
} from 'lucide-react';
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
    <header className="sticky top-0 z-30 glass-header border-b border-slate-200 dark:border-slate-800/80 bg-white/95 dark:bg-slate-950/95 backdrop-blur-md transition-colors">
      <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8">
        {/* Main Header Bar */}
        <div className="flex items-center justify-between h-16 gap-2 sm:gap-4">
          {/* Logo & Desktop Tab Switcher */}
          <div className="flex items-center gap-3 sm:gap-4 shrink-0">
            <div className="flex items-center gap-2 sm:gap-2.5 cursor-pointer" onClick={() => onSelectTab('DASHBOARD')}>
              <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-indigo-500 to-indigo-700 flex items-center justify-center text-white shadow-sm shadow-indigo-600/30 shrink-0">
                <Activity className="w-4 h-4 animate-pulse" />
              </div>
              <div className="flex flex-col">
                <div className="flex items-center gap-1.5">
                  <span className="font-extrabold text-sm sm:text-base tracking-tight text-slate-900 dark:text-white">
                    StockPulse
                  </span>
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 hidden sm:inline-block" />
                </div>
                <span className="text-[10px] font-mono text-slate-500 dark:text-slate-400 hidden sm:block">
                  Commerce Console
                </span>
              </div>
            </div>

            {/* Desktop Navigation Tabs (Hidden on small mobile) */}
            <div className="hidden md:flex items-center h-9 bg-slate-100 dark:bg-slate-900 p-0.5 rounded-xl border border-slate-200 dark:border-slate-800 text-xs font-mono ml-2 lg:ml-4">
              <button
                onClick={() => onSelectTab('DASHBOARD')}
                className={`h-8 flex items-center gap-1.5 px-3 rounded-lg transition-all ${
                  activeTab === 'DASHBOARD'
                    ? 'bg-white dark:bg-slate-800 text-indigo-600 dark:text-indigo-400 font-bold shadow-xs'
                    : 'text-slate-500 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                <LayoutDashboard className="w-3.5 h-3.5" />
                <span>Console</span>
              </button>
              <button
                onClick={() => onSelectTab('SIMULATION')}
                className={`h-8 flex items-center gap-1.5 px-3 rounded-lg transition-all ${
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
                className={`h-8 flex items-center gap-1.5 px-3 rounded-lg transition-all ${
                  activeTab === 'API_EXPLORER'
                    ? 'bg-white dark:bg-slate-800 text-indigo-600 dark:text-indigo-400 font-bold shadow-xs'
                    : 'text-slate-500 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                <Terminal className="w-3.5 h-3.5" />
                <span>API Explorer</span>
              </button>
            </div>
          </div>

          {/* Desktop Strategy Toggle Pill Switch */}
          <div className="hidden lg:flex items-center h-9 bg-slate-100 dark:bg-slate-900 p-0.5 rounded-xl border border-slate-200 dark:border-slate-800 text-xs font-mono">
            <button
              onClick={onToggleStrategy}
              className={`h-8 flex items-center gap-1.5 px-3 rounded-lg transition-all ${
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
              className={`h-8 flex items-center gap-1.5 px-3 rounded-lg transition-all ${
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

          {/* Right Action Icons & Mobile Quick Controls */}
          <div className="flex items-center gap-1.5 sm:gap-2">
            {/* Mobile Strategy Button (Icon only) */}
            <button
              onClick={onToggleStrategy}
              className={`h-9 flex lg:hidden items-center gap-1 px-2.5 rounded-xl text-xs font-mono border transition-all ${
                isAi
                  ? 'bg-indigo-500/15 text-indigo-600 dark:text-indigo-400 border-indigo-500/30'
                  : 'bg-slate-100 dark:bg-slate-900 text-slate-600 dark:text-slate-400 border-slate-200 dark:border-slate-800'
              }`}
              title={`Active: ${isAi ? 'AI Agent' : 'Rule Engine'}`}
            >
              <Sparkles className="w-3.5 h-3.5 text-indigo-500" />
              <span className="text-[11px] font-bold">{isAi ? 'AI' : 'Rule'}</span>
            </button>

            {/* Add Product Button */}
            {activeTab === 'DASHBOARD' && (
              <button
                onClick={onOpenAddProduct}
                className="h-9 flex items-center gap-1.5 px-3 rounded-xl text-xs font-mono font-semibold bg-indigo-600 hover:bg-indigo-500 text-white shadow-sm shadow-indigo-600/30 transition-all shrink-0"
                title="Add New Catalog SKU"
              >
                <Plus className="w-4 h-4" />
                <span className="hidden sm:inline">New SKU</span>
              </button>
            )}

            {/* Live Auto-Poll Indicator */}
            <button
              onClick={onToggleAutoRefresh}
              className={`h-9 hidden sm:flex items-center gap-1.5 px-2.5 rounded-xl text-xs font-mono border transition-all ${
                autoRefresh
                  ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/30'
                  : 'bg-slate-100 dark:bg-slate-900 text-slate-500 border-slate-200 dark:border-slate-800'
              }`}
              title="Toggle 2.5s live auto-refresh"
            >
              <span className={`w-2 h-2 rounded-full ${autoRefresh ? 'bg-emerald-500 animate-ping' : 'bg-slate-400'}`} />
              <span className="text-[11px]">{autoRefresh ? 'Live' : 'Paused'}</span>
            </button>

            {/* Refresh Button */}
            <button
              onClick={onRefresh}
              disabled={isRefreshing}
              className="w-9 h-9 flex items-center justify-center text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl hover:bg-slate-200 dark:hover:bg-slate-800 transition-colors shrink-0"
              title="Refresh telemetry"
            >
              <RefreshCw className={`w-4 h-4 ${isRefreshing ? 'animate-spin text-indigo-500' : ''}`} />
            </button>

            {/* Dark/Light Mode Switcher */}
            <button
              onClick={onToggleDarkMode}
              className="w-9 h-9 flex items-center justify-center text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl hover:bg-slate-200 dark:hover:bg-slate-800 transition-colors shrink-0"
              title={darkMode ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
            >
              {darkMode ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4 text-slate-700" />}
            </button>

            {/* Reset Catalog Button */}
            <button
              onClick={onResetData}
              className="w-9 h-9 hidden sm:flex items-center justify-center text-slate-500 hover:text-rose-600 dark:hover:text-rose-400 bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl hover:border-rose-500/30 transition-colors shrink-0"
              title="Reset catalog to initial Addendum A state"
            >
              <RotateCcw className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* Mobile Navigation Sub-Bar (Visible on mobile screens < 768px) */}
        <div className="flex md:hidden items-center justify-around py-2 border-t border-slate-200 dark:border-slate-800/60 text-xs font-mono gap-1">
          <button
            onClick={() => onSelectTab('DASHBOARD')}
            className={`flex-1 py-1.5 flex items-center justify-center gap-1.5 rounded-lg transition-all ${
              activeTab === 'DASHBOARD'
                ? 'bg-indigo-600/10 dark:bg-indigo-950/40 text-indigo-600 dark:text-indigo-400 font-bold border border-indigo-500/30'
                : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-900'
            }`}
          >
            <LayoutDashboard className="w-3.5 h-3.5" />
            <span>Console</span>
          </button>
          <button
            onClick={() => onSelectTab('SIMULATION')}
            className={`flex-1 py-1.5 flex items-center justify-center gap-1.5 rounded-lg transition-all ${
              activeTab === 'SIMULATION'
                ? 'bg-indigo-600/10 dark:bg-indigo-950/40 text-indigo-600 dark:text-indigo-400 font-bold border border-indigo-500/30'
                : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-900'
            }`}
          >
            <Activity className="w-3.5 h-3.5" />
            <span>Simulation</span>
          </button>
          <button
            onClick={() => onSelectTab('API_EXPLORER')}
            className={`flex-1 py-1.5 flex items-center justify-center gap-1.5 rounded-lg transition-all ${
              activeTab === 'API_EXPLORER'
                ? 'bg-indigo-600/10 dark:bg-indigo-950/40 text-indigo-600 dark:text-indigo-400 font-bold border border-indigo-500/30'
                : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-900'
            }`}
          >
            <Terminal className="w-3.5 h-3.5" />
            <span>API</span>
          </button>
        </div>
      </div>
    </header>
  );
};
