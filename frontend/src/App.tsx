import React, { useEffect, useState, useCallback } from 'react';
import { api } from './services/api';
import {
  Product,
  PricingSuggestion,
  ReorderSuggestion,
  DashboardMetrics,
  StrategyConfig
} from './types';
import { Navbar } from './components/Navbar';
import { MetricsBanner } from './components/MetricsBanner';
import { PendingReviewQueue } from './components/PendingReviewQueue';
import { ProductCatalog } from './components/ProductCatalog';
import { AdjustStockModal } from './components/AdjustStockModal';
import { AiStreamModal } from './components/AiStreamModal';
import { AddProductModal } from './components/AddProductModal';
import { ApiExplorer } from './components/ApiExplorer';
import { SimulationLab } from './components/SimulationLab';
import { CheckCircle2, AlertCircle, Info, X, RefreshCw } from 'lucide-react';

interface EvaluationEvent {
  productId: string;
  productName: string;
  triggerReason: string;
  timestamp: number;
}

export const App: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'DASHBOARD' | 'SIMULATION' | 'API_EXPLORER'>('DASHBOARD');

  const [products, setProducts] = useState<Product[]>([]);
  const [pricingSuggestions, setPricingSuggestions] = useState<PricingSuggestion[]>([]);
  const [reorderSuggestions, setReorderSuggestions] = useState<ReorderSuggestion[]>([]);
  const [metrics, setMetrics] = useState<DashboardMetrics | null>(null);
  const [strategyConfig, setStrategyConfig] = useState<StrategyConfig | null>(null);

  const [selectedStockProduct, setSelectedStockProduct] = useState<Product | null>(null);
  const [selectedStreamProduct, setSelectedStreamProduct] = useState<Product | null>(null);
  const [isAddProductOpen, setIsAddProductOpen] = useState<boolean>(false);

  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [isRefreshing, setIsRefreshing] = useState<boolean>(false);
  const [autoRefresh, setAutoRefresh] = useState<boolean>(true);
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'info' | 'error' } | null>(null);

  // Active Real-Time LLM Evaluations Tracking (from SSE EventStream)
  const [activeEvaluations, setActiveEvaluations] = useState<Map<string, EvaluationEvent>>(new Map());
  const [advisingProductIds, setAdvisingProductIds] = useState<Set<string>>(new Set());

  // Dark Mode State
  const [darkMode, setDarkMode] = useState<boolean>(() => {
    const saved = localStorage.getItem('stockpulse-theme');
    if (saved) return saved === 'dark';
    return true;
  });

  useEffect(() => {
    if (darkMode) {
      document.documentElement.classList.add('dark');
      document.documentElement.classList.remove('light');
      localStorage.setItem('stockpulse-theme', 'dark');
    } else {
      document.documentElement.classList.remove('dark');
      document.documentElement.classList.add('light');
      localStorage.setItem('stockpulse-theme', 'light');
    }
  }, [darkMode]);

  const showToast = (message: string, type: 'success' | 'info' | 'error' = 'info') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 4000);
  };

  const loadData = useCallback(async (silent = false) => {
    if (!silent) setIsRefreshing(true);
    try {
      const [prods, pricing, reorder, mets, strat] = await Promise.all([
        api.getProducts(),
        api.getPricingSuggestions(),
        api.getReorderSuggestions(),
        api.getDashboardMetrics(),
        api.getStrategyConfig(),
      ]);

      setProducts(prods);
      setPricingSuggestions(pricing);
      setReorderSuggestions(reorder);
      setMetrics(mets);
      setStrategyConfig(strat);
    } catch (err: any) {
      console.error('Failed to load data:', err);
      if (!silent) {
        showToast('Unable to connect to backend on localhost:8080', 'error');
      }
    } finally {
      if (!silent) setIsRefreshing(false);
    }
  }, []);

  // Initial load
  useEffect(() => {
    loadData();
  }, [loadData]);

  // Seamless Background Polling (every 2.5s)
  useEffect(() => {
    if (!autoRefresh) return;
    const interval = setInterval(() => {
      loadData(true);
    }, 2500);
    return () => clearInterval(interval);
  }, [autoRefresh, loadData]);

  // Real-Time Server-Sent Events Stream for Live LLM Processing Alerts
  useEffect(() => {
    let eventSource: EventSource | null = null;

    try {
      eventSource = new EventSource('http://localhost:8080/api/events/stream');

      eventSource.addEventListener('LLM_EVALUATION_START', (e: MessageEvent) => {
        try {
          const data: EvaluationEvent = JSON.parse(e.data);
          setActiveEvaluations(prev => {
            const next = new Map(prev);
            next.set(data.productId, data);
            return next;
          });
        } catch (err) {
          console.error('Error parsing SSE event', err);
        }
      });

      eventSource.addEventListener('LLM_EVALUATION_COMPLETE', (e: MessageEvent) => {
        try {
          const data: EvaluationEvent = JSON.parse(e.data);
          setActiveEvaluations(prev => {
            const next = new Map(prev);
            next.delete(data.productId);
            return next;
          });
          loadData(true);
        } catch (err) {
          console.error('Error parsing SSE event', err);
        }
      });

      eventSource.onerror = () => {
        // SSE will reconnect automatically
      };
    } catch (err) {
      console.warn('SSE stream unavailable, falling back to 2.5s polling', err);
    }

    return () => {
      if (eventSource) eventSource.close();
    };
  }, [loadData]);

  // Actions
  const handleCreateProduct = async (productData: Partial<Product>) => {
    setIsLoading(true);
    try {
      const created = await api.createProduct(productData);
      showToast(`Created new SKU ${created.name} (${created.sku}).`, 'success');
      await loadData(true);
    } catch (err: any) {
      showToast(err.message || 'Failed to create product', 'error');
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  const handleSimulateOrder = async (id: string, quantity: number) => {
    setIsLoading(true);
    try {
      const updated = await api.simulateOrder(id, quantity);
      showToast(`Order processed for ${updated.name}. Stock is now ${updated.stockLevel}.`, 'info');
      await loadData(true);
    } catch (err: any) {
      showToast(err.message || 'Failed to simulate order', 'error');
    } finally {
      setIsLoading(false);
    }
  };

  const handleUpdateStock = async (id: string, newStock: number) => {
    setIsLoading(true);
    try {
      const updated = await api.updateStock(id, newStock);
      showToast(`Stock updated to ${updated.stockLevel} units for ${updated.name}.`, 'success');
      setSelectedStockProduct(null);
      await loadData(true);
    } catch (err: any) {
      showToast(err.message || 'Failed to update stock', 'error');
    } finally {
      setIsLoading(false);
    }
  };

  const handleDecidePricing = async (id: number, decision: 'ACCEPTED' | 'REJECTED') => {
    setIsLoading(true);
    try {
      const updated = await api.decidePricingSuggestion(id, decision);
      if (decision === 'ACCEPTED') {
        showToast(`Pricing proposal ACCEPTED! Live price updated to $${updated.recommendedPrice.toFixed(2)}.`, 'success');
      } else {
        showToast(`Pricing proposal #${id} dismissed.`, 'info');
      }
      await loadData(true);
    } catch (err: any) {
      showToast(err.message || 'Failed to decide pricing suggestion', 'error');
    } finally {
      setIsLoading(false);
    }
  };

  const handleDecideReorder = async (id: number, decision: 'ACCEPTED' | 'REJECTED') => {
    setIsLoading(true);
    try {
      const updated = await api.decideReorderSuggestion(id, decision);
      if (decision === 'ACCEPTED') {
        showToast(`Reorder proposal ACCEPTED! Inbound shipment received (+${updated.recommendedQuantity} units).`, 'success');
      } else {
        showToast(`Reorder proposal #${id} dismissed.`, 'info');
      }
      await loadData(true);
    } catch (err: any) {
      showToast(err.message || 'Failed to decide reorder suggestion', 'error');
    } finally {
      setIsLoading(false);
    }
  };

  const handleToggleStrategy = async () => {
    if (!strategyConfig) return;
    const nextMode = strategyConfig.activeMode === 'AI_POWERED' ? 'RULE_BASED' : 'AI_POWERED';
    try {
      const updated = await api.setStrategyConfig(nextMode);
      setStrategyConfig(updated);
      showToast(`Strategy switched to ${updated.activeMode}!`, 'success');
    } catch (err: any) {
      showToast('Failed to switch strategy mode', 'error');
    }
  };

  const handleRunAiAdvisor = async (id: string) => {
    setAdvisingProductIds(prev => new Set(prev).add(id));
    const targetProduct = products.find(p => p.id === id);
    const prodName = targetProduct ? targetProduct.name : id;
    try {
      await Promise.all([
        api.suggestPricing(id),
        api.suggestReorder(id)
      ]);
      showToast(`AI proposals generated for ${prodName}! Added to Pending Approvals queue.`, 'success');
      await loadData(true);
    } catch (err: any) {
      showToast(err.message || 'Failed to generate suggestions', 'error');
    } finally {
      setAdvisingProductIds(prev => {
        const next = new Set(prev);
        next.delete(id);
        return next;
      });
    }
  };

  const handleResetCatalog = async () => {
    if (!window.confirm('Reset catalog back to Addendum A initial state?')) return;
    try {
      await api.resetDatabase();
      showToast('Database reset and seeded with initial demo catalog.', 'success');
      await loadData();
    } catch (err: any) {
      showToast('Failed to reset catalog', 'error');
    }
  };

  const evaluatingProductIds = new Set(Array.from(activeEvaluations.keys()));

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 pb-16 transition-colors duration-200">
      {/* Toast Notification */}
      {toast && (
        <div className="fixed bottom-5 right-5 z-50 flex items-center gap-2.5 px-4 py-3 rounded-xl shadow-2xl text-xs font-mono border transition-all animate-in slide-in-from-bottom-5 bg-white dark:bg-slate-900 text-slate-900 dark:text-white border-slate-200 dark:border-slate-800">
          {toast.type === 'success' && <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />}
          {toast.type === 'error' && <AlertCircle className="w-4 h-4 text-rose-500 shrink-0" />}
          {toast.type === 'info' && <Info className="w-4 h-4 text-indigo-500 shrink-0" />}
          <span>{toast.message}</span>
          <button onClick={() => setToast(null)} className="ml-2 text-slate-400 hover:text-slate-600 dark:hover:text-white">
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* Top Navbar */}
      <Navbar
        strategyConfig={strategyConfig}
        onToggleStrategy={handleToggleStrategy}
        onRefresh={() => loadData(false)}
        onResetData={handleResetCatalog}
        onOpenAddProduct={() => setIsAddProductOpen(true)}
        isRefreshing={isRefreshing}
        autoRefresh={autoRefresh}
        onToggleAutoRefresh={() => setAutoRefresh(!autoRefresh)}
        darkMode={darkMode}
        onToggleDarkMode={() => setDarkMode(!darkMode)}
        activeTab={activeTab}
        onSelectTab={setActiveTab}
      />

      {/* Main Content Area */}
      <main className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 pt-6 sm:pt-8 space-y-6 sm:space-y-8">
        {activeTab === 'API_EXPLORER' ? (
          /* Interactive API Explorer View */
          <ApiExplorer />
        ) : activeTab === 'SIMULATION' ? (
          /* Autonomous Live Simulation Lab (1d = 1m) */
          <SimulationLab
            products={products}
            onRefreshData={() => loadData(true)}
            strategyConfig={strategyConfig}
            onToggleStrategy={handleToggleStrategy}
          />
        ) : (
          /* Main Console Dashboard */
          <>
            {/* Live LLM Active Pipeline Activity Banner */}
            {activeEvaluations.size > 0 && (
              <div className="bg-indigo-600/10 border border-indigo-500/30 rounded-2xl p-4 flex items-center justify-between shadow-sm animate-in fade-in slide-in-from-top-3 duration-200">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-xl bg-indigo-600 text-white flex items-center justify-center font-bold shrink-0">
                    <RefreshCw className="w-4 h-4 animate-spin text-white" />
                  </div>
                  <div>
                    <div className="text-xs font-mono font-bold text-indigo-600 dark:text-indigo-400 flex items-center gap-2">
                      <span>AI Agent Evaluating Product Signals in Real Time</span>
                      <span className="w-2 h-2 rounded-full bg-indigo-500 animate-ping" />
                    </div>
                    <div className="text-xs text-slate-600 dark:text-slate-300 font-mono mt-0.5 flex items-center gap-2 flex-wrap">
                      {Array.from(activeEvaluations.values()).map(ev => (
                        <span key={ev.productId} className="px-2 py-0.5 rounded-md bg-white dark:bg-slate-900 border border-indigo-500/20">
                          <strong>{ev.productName}</strong> ({ev.productId}) &bull; trigger: <span className="text-indigo-500">{ev.triggerReason}</span>
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
                <span className="text-[11px] font-mono text-slate-400 hidden md:inline">
                  Continuous Stream: /api/events/stream
                </span>
              </div>
            )}

            {/* 6-Card KPI Telemetry Banner */}
            <MetricsBanner metrics={metrics} />

            {/* Human Governance Checkpoint */}
            <PendingReviewQueue
              pricingSuggestions={pricingSuggestions}
              reorderSuggestions={reorderSuggestions}
              onDecidePricing={handleDecidePricing}
              onDecideReorder={handleDecideReorder}
              isLoading={isLoading}
            />

            {/* Product Catalog & Simulators */}
            <ProductCatalog
              products={products}
              categoryAverages={metrics?.categoryAverages || {}}
              onSimulateOrder={handleSimulateOrder}
              onOpenStockModal={p => setSelectedStockProduct(p)}
              onRunAiAdvisor={handleRunAiAdvisor}
              onOpenStreamModal={p => setSelectedStreamProduct(p)}
              isLoading={isLoading}
              evaluatingProductIds={evaluatingProductIds}
              advisingProductIds={advisingProductIds}
            />
          </>
        )}
      </main>

      {/* Modals */}
      {isAddProductOpen && (
        <AddProductModal
          onClose={() => setIsAddProductOpen(false)}
          onSave={handleCreateProduct}
          isLoading={isLoading}
        />
      )}

      {selectedStockProduct && (
        <AdjustStockModal
          product={selectedStockProduct}
          onClose={() => setSelectedStockProduct(null)}
          onSave={handleUpdateStock}
          isLoading={isLoading}
        />
      )}

      {selectedStreamProduct && (
        <AiStreamModal
          product={selectedStreamProduct}
          onClose={() => setSelectedStreamProduct(null)}
        />
      )}
    </div>
  );
};

export default App;
