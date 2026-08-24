import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Product, StrategyConfig } from '../types';
import { api } from '../services/api';
import {
  Play,
  Pause,
  RotateCcw,
  Zap,
  ShoppingCart,
  Truck,
  Sparkles,
  ShieldCheck,
  TrendingUp,
  Clock,
  CheckCircle2,
  Package,
  Flame,
  BrainCircuit,
  Radio,
  DollarSign,
  Box,
  AlertTriangle,
  ChevronDown,
  ChevronUp
} from 'lucide-react';

interface SimulationLabProps {
  products: Product[];
  onRefreshData: () => Promise<void>;
  strategyConfig: StrategyConfig | null;
  onToggleStrategy: () => void;
}

export interface InboundShipment {
  id: string;
  suggestionId: number;
  productId: string;
  productName: string;
  sku: string;
  quantity: number;
  leadTimeDays: number;
  totalDurationSeconds: number;
  remainingSeconds: number;
  dispatchedAtDay: number;
  dispatchedAtHour: number;
  arrivalDay: number;
  status: 'IN_TRANSIT' | 'DELIVERED';
}

export interface SimulationLogEntry {
  id: string;
  realTimestamp: string;
  simulatedDay: number;
  simulatedHour: number;
  simulatedMinute: number;
  type:
    | 'ORDER'
    | 'AI_SIGNAL'
    | 'LLM_REASONING'
    | 'AUTO_APPROVED'
    | 'MANUAL_REQUIRED'
    | 'PO_DISPATCHED'
    | 'SHIPMENT_DELIVERED'
    | 'SURGE_INJECTED'
    | 'SYSTEM';
  title: string;
  detail: string;
  fullReasoning?: string;
  productId?: string;
  productName?: string;
  priceDiff?: string;
  stockDiff?: string;
  confidence?: number;
  badgeColor?: string;
}

export const SimulationLab: React.FC<SimulationLabProps> = ({
  products: initialProducts,
  onRefreshData,
  strategyConfig,
  onToggleStrategy,
}) => {
  // --- Simulation Engine State ---
  const [isRunning, setIsRunning] = useState<boolean>(false);
  const [playbackSpeed, setPlaybackSpeed] = useState<number>(1); // 1x = 60s/day, 2x = 30s/day, 5x = 12s/day
  const [simulatedDay, setSimulatedDay] = useState<number>(1);
  const [simulatedHour, setSimulatedHour] = useState<number>(8); // starts at 08:00 AM
  const [simulatedMinute, setSimulatedMinute] = useState<number>(0);
  const [dayProgressPct, setDayProgressPct] = useState<number>(0);
  const [elapsedRealSeconds, setElapsedRealSeconds] = useState<number>(0);

  // --- Policy & Automation Config ---
  const [autoApproveAi, setAutoApproveAi] = useState<boolean>(true);
  const [autoApproveConfidenceThreshold] = useState<number>(0.85);
  const [trafficIntensity] = useState<'LOW' | 'NORMAL' | 'HIGH'>('NORMAL');

  // --- Tracking Metrics ---
  const [liveProducts, setLiveProducts] = useState<Product[]>(initialProducts);
  const [inboundShipments, setInboundShipments] = useState<InboundShipment[]>([]);
  const [logs, setLogs] = useState<SimulationLogEntry[]>([]);
  const [selectedFilter, setSelectedFilter] = useState<string>('ALL');
  const [expandedLogIds, setExpandedLogIds] = useState<Set<string>>(new Set());

  const [cumulativeRevenue, setCumulativeRevenue] = useState<number>(0);
  const [totalOrdersPlaced, setTotalOrdersPlaced] = useState<number>(0);
  const [stockoutsPrevented, setStockoutsPrevented] = useState<number>(0);
  const [aiPriceChangesCount, setAiPriceChangesCount] = useState<number>(0);
  const [activeEvaluations, setActiveEvaluations] = useState<Set<string>>(new Set());

  const logsContainerRef = useRef<HTMLDivElement>(null);
  const isExecutingLoop = useRef<boolean>(false);

  // Sync initial products when prop changes
  useEffect(() => {
    if (initialProducts.length > 0 && liveProducts.length === 0) {
      setLiveProducts(initialProducts);
    }
  }, [initialProducts]);

  const toggleExpand = (id: string) => {
    setExpandedLogIds(prev => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  // Helper to add log entries
  const addLog = useCallback(
    (
      type: SimulationLogEntry['type'],
      title: string,
      detail: string,
      extra?: Partial<SimulationLogEntry>
    ) => {
      const entry: SimulationLogEntry = {
        id: `LOG-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`,
        realTimestamp: new Date().toLocaleTimeString(),
        simulatedDay,
        simulatedHour,
        simulatedMinute,
        type,
        title,
        detail,
        ...extra,
      };

      setLogs(prev => [entry, ...prev].slice(0, 150)); // Keep latest 150 events
    },
    [simulatedDay, simulatedHour, simulatedMinute]
  );

  // Initial welcome log
  useEffect(() => {
    if (logs.length === 0) {
      addLog(
        'SYSTEM',
        'StockPulse Simulation Engine Initialized',
        'Time Scale: 1 Simulated Day = 1 Real Minute (60s at 1x). Real Gemini 2.5 Flash agent loop active.',
        { badgeColor: 'text-indigo-400' }
      );
    }
  }, []);

  // --- Real Delivery Handler ---
  const handleDeliverShipment = useCallback(
    async (shipment: InboundShipment) => {
      try {
        // Accept the reorder suggestion or directly replenish stock
        await api.decideReorderSuggestion(shipment.suggestionId, 'ACCEPTED').catch(async () => {
          // If suggestion already resolved, directly adjust stock
          const prod = liveProducts.find(p => p.id === shipment.productId);
          if (prod) {
            await api.updateStock(shipment.productId, prod.stockLevel + shipment.quantity);
          }
        });

        // Update local state
        setLiveProducts(prev =>
          prev.map(p =>
            p.id === shipment.productId
              ? { ...p, stockLevel: p.stockLevel + shipment.quantity, status: 'ACTIVE' }
              : p
          )
        );

        setStockoutsPrevented(prev => prev + 1);

        addLog(
          'SHIPMENT_DELIVERED',
          `Inbound Shipment Delivered (+${shipment.quantity} units)`,
          `Freight arrival for ${shipment.productName} (${shipment.sku}). Stock restocked by +${shipment.quantity} units after ${shipment.leadTimeDays} simulated days in transit.`,
          {
            productId: shipment.productId,
            productName: shipment.productName,
            stockDiff: `+${shipment.quantity}`,
          }
        );

        await onRefreshData();
      } catch (err: any) {
        console.error('Delivery resolution error:', err);
      }
    },
    [liveProducts, addLog, onRefreshData]
  );

  // --- Order Traffic & Autonomous Agent Loop ---
  const runSimulationStep = useCallback(async () => {
    if (isExecutingLoop.current) return;
    isExecutingLoop.current = true;

    try {
      // 1. Pick 1 to 2 random products based on traffic intensity & velocity
      const trafficChance = trafficIntensity === 'HIGH' ? 0.9 : trafficIntensity === 'NORMAL' ? 0.65 : 0.4;
      if (Math.random() < trafficChance && liveProducts.length > 0) {
        // Weighted random pick
        const targetProduct = liveProducts[Math.floor(Math.random() * liveProducts.length)];

        if (targetProduct && targetProduct.stockLevel > 0) {
          const orderQty = Math.max(1, Math.min(targetProduct.stockLevel, Math.floor(1 + Math.random() * 3)));
          const revenue = targetProduct.currentPrice * orderQty;

          // Record order on backend in real-time
          const updated = await api.simulateOrder(targetProduct.id, orderQty);

          // Update local product state
          setLiveProducts(prev => prev.map(p => (p.id === targetProduct.id ? updated : p)));
          setCumulativeRevenue(prev => prev + revenue);
          setTotalOrdersPlaced(prev => prev + 1);

          addLog(
            'ORDER',
            `Customer Purchase: ${orderQty}x ${targetProduct.name}`,
            `Sale of $${revenue.toFixed(2)} recorded. Stock: ${targetProduct.stockLevel} → ${updated.stockLevel} units (Velocity: ${updated.demandVelocity}/d).`,
            {
              productId: targetProduct.id,
              productName: targetProduct.name,
              stockDiff: `-${orderQty}`,
            }
          );

          // Check if Low Stock Breached
          const isLowStock = updated.stockLevel <= updated.reorderThreshold;
          const isSpike = updated.demandVelocity >= 8;

          if ((isLowStock || isSpike) && !activeEvaluations.has(targetProduct.id)) {
            const trigger = isLowStock ? 'INVENTORY_LOW' : 'DEMAND_SPIKE';
            setActiveEvaluations(prev => new Set(prev).add(targetProduct.id));

            addLog(
              'AI_SIGNAL',
              `Signal Triggered: ${trigger}`,
              `${targetProduct.name} stock level (${updated.stockLevel}) breached threshold (${updated.reorderThreshold}). Invoking Gemini 2.5 Flash Commerce Advisor in background...`,
              {
                productId: targetProduct.id,
                productName: targetProduct.name,
              }
            );

            // Execute Real AI Proposal
            setTimeout(async () => {
              try {
                const [pricingProp, reorderProp] = await Promise.all([
                  api.suggestPricing(targetProduct.id),
                  api.suggestReorder(targetProduct.id),
                ]);

                addLog(
                  'LLM_REASONING',
                  `Gemini 2.5 Tradeoff Proposal Generated`,
                  `Price: $${pricingProp.currentPrice.toFixed(2)} → $${pricingProp.recommendedPrice.toFixed(2)} (${pricingProp.changeDirection}, ${(pricingProp.confidence * 100).toFixed(0)}% conf). Reorder: +${reorderProp.recommendedQuantity} units (Lead time: ${reorderProp.suggestedLeadTimeDays}d).`,
                  {
                    productId: targetProduct.id,
                    productName: targetProduct.name,
                    confidence: pricingProp.confidence,
                    priceDiff: `$${pricingProp.recommendedPrice.toFixed(2)}`,
                    fullReasoning: pricingProp.reasoning || reorderProp.reasoning,
                  }
                );

                // Check Auto-Approve Policy
                if (autoApproveAi && pricingProp.confidence >= autoApproveConfidenceThreshold) {
                  // Auto-accept pricing
                  const acceptedPrice = await api.decidePricingSuggestion(pricingProp.id, 'ACCEPTED');
                  setAiPriceChangesCount(prev => prev + 1);

                  // Update live product price
                  setLiveProducts(prev =>
                    prev.map(p =>
                      p.id === targetProduct.id
                        ? { ...p, currentPrice: acceptedPrice.recommendedPrice }
                        : p
                    )
                  );

                  addLog(
                    'AUTO_APPROVED',
                    `Autonomous Approval: Price Changed to $${acceptedPrice.recommendedPrice.toFixed(2)}`,
                    `Confidence score of ${(pricingProp.confidence * 100).toFixed(0)}% exceeded auto-approve policy threshold (${(autoApproveConfidenceThreshold * 100).toFixed(0)}%). New live price adopted.`,
                    {
                      productId: targetProduct.id,
                      productName: targetProduct.name,
                      priceDiff: `$${acceptedPrice.recommendedPrice.toFixed(2)}`,
                      confidence: pricingProp.confidence,
                    }
                  );

                  // Auto-dispatch Inbound Purchase Order with Real Lead Time
                  // 1 Day = 60s at 1x speed
                  const durationSecs = Math.max(10, Math.round((reorderProp.suggestedLeadTimeDays * 60) / playbackSpeed));

                  const newShipment: InboundShipment = {
                    id: `PO-${Math.floor(1000 + Math.random() * 9000)}`,
                    suggestionId: reorderProp.id,
                    productId: targetProduct.id,
                    productName: targetProduct.name,
                    sku: targetProduct.sku,
                    quantity: reorderProp.recommendedQuantity,
                    leadTimeDays: reorderProp.suggestedLeadTimeDays,
                    totalDurationSeconds: durationSecs,
                    remainingSeconds: durationSecs,
                    dispatchedAtDay: simulatedDay,
                    dispatchedAtHour: simulatedHour,
                    arrivalDay: simulatedDay + reorderProp.suggestedLeadTimeDays,
                    status: 'IN_TRANSIT',
                  };

                  setInboundShipments(prev => [...prev, newShipment]);

                  addLog(
                    'PO_DISPATCHED',
                    `Purchase Order Created & Dispatched: +${reorderProp.recommendedQuantity} units`,
                    `PO ${newShipment.id} sent to supplier. Estimated Lead Time: ${reorderProp.suggestedLeadTimeDays} simulated days (${durationSecs}s real-time at ${playbackSpeed}x).`,
                    {
                      productId: targetProduct.id,
                      productName: targetProduct.name,
                      stockDiff: `+${reorderProp.recommendedQuantity} (in transit)`,
                    }
                  );
                } else {
                  addLog(
                    'MANUAL_REQUIRED',
                    `Proposal Queued for Human Review`,
                    `Confidence score ${(pricingProp.confidence * 100).toFixed(0)}% flagged for merchandiser checkpoint. Visible on Governance Dashboard.`,
                    {
                      productId: targetProduct.id,
                      productName: targetProduct.name,
                    }
                  );
                }

                await onRefreshData();
              } catch (err: any) {
                console.error('Simulation AI evaluation error:', err);
              } finally {
                setActiveEvaluations(prev => {
                  const next = new Set(prev);
                  next.delete(targetProduct.id);
                  return next;
                });
              }
            }, 1200);
          }
        }
      }
    } catch (err) {
      console.error('Simulation tick error:', err);
    } finally {
      isExecutingLoop.current = false;
    }
  }, [
    liveProducts,
    trafficIntensity,
    activeEvaluations,
    autoApproveAi,
    autoApproveConfidenceThreshold,
    playbackSpeed,
    simulatedDay,
    simulatedHour,
    addLog,
    onRefreshData,
  ]);

  // --- Master Time Loop Clock (Runs every 1 second) ---
  useEffect(() => {
    if (!isRunning) return;

    const interval = setInterval(() => {
      // 1 real second corresponds to (24 hours / 60 seconds) * playbackSpeed = 0.4 hours * playbackSpeed
      const minutesPerSecond = Math.round(24 * playbackSpeed);

      setElapsedRealSeconds(prev => prev + 1);

      setSimulatedMinute(prevMin => {
        const totalMin = prevMin + minutesPerSecond;
        const addHours = Math.floor(totalMin / 60);
        const nextMin = totalMin % 60;

        if (addHours > 0) {
          setSimulatedHour(prevHr => {
            const nextHr = prevHr + addHours;
            if (nextHr >= 24) {
              setSimulatedDay(prevDay => prevDay + Math.floor(nextHr / 24));
              return nextHr % 24;
            }
            return nextHr;
          });
        }
        return nextMin;
      });

      // Calculate Day Progress (0 to 100%)
      setDayProgressPct(prev => {
        const next = (prev + (100 / 60) * playbackSpeed) % 100;
        return next;
      });

      // Advance Inbound Shipments Countdown
      setInboundShipments(prevShipments => {
        const updated = prevShipments.map(s => {
          if (s.status === 'IN_TRANSIT') {
            const nextRemaining = s.remainingSeconds - 1;
            if (nextRemaining <= 0) {
              handleDeliverShipment(s);
              return { ...s, remainingSeconds: 0, status: 'DELIVERED' as const };
            }
            return { ...s, remainingSeconds: nextRemaining };
          }
          return s;
        });
        return updated.filter(s => s.status === 'IN_TRANSIT');
      });

      // Trigger order and AI traffic step
      runSimulationStep();
    }, 1000);

    return () => clearInterval(interval);
  }, [isRunning, playbackSpeed, runSimulationStep, handleDeliverShipment]);

  // --- Manual Simulation Triggers ---
  const handleInjectSurge = async (category?: string) => {
    addLog(
      'SURGE_INJECTED',
      `Viral Demand Spike Injected!`,
      `Simulated flash surge injected across ${category ? category : 'all catalog items'}. Traffic multiplier: 4.5x.`,
      { badgeColor: 'text-cyan-400' }
    );

    const targetList = category
      ? liveProducts.filter(p => p.category === category)
      : liveProducts;

    for (const prod of targetList.slice(0, 3)) {
      if (prod.stockLevel > 0) {
        const surgeOrders = Math.min(prod.stockLevel, 5);
        await api.simulateOrder(prod.id, surgeOrders);
      }
    }

    await onRefreshData();
    const updatedCatalog = await api.getProducts();
    setLiveProducts(updatedCatalog);
  };

  const handleResetSimulation = async () => {
    setIsRunning(false);
    setSimulatedDay(1);
    setSimulatedHour(8);
    setSimulatedMinute(0);
    setDayProgressPct(0);
    setElapsedRealSeconds(0);
    setInboundShipments([]);
    setCumulativeRevenue(0);
    setTotalOrdersPlaced(0);
    setStockoutsPrevented(0);
    setAiPriceChangesCount(0);
    setLogs([]);
    setExpandedLogIds(new Set());

    await api.resetDatabase();
    await onRefreshData();
    const resetProducts = await api.getProducts();
    setLiveProducts(resetProducts);

    addLog(
      'SYSTEM',
      'Simulation Reset to Day 1',
      'Catalog reset to Addendum A benchmark state. Timers and telemetry reset to 0.',
      { badgeColor: 'text-indigo-400' }
    );
  };

  const formatSimTime = () => {
    const period = simulatedHour >= 12 ? 'PM' : 'AM';
    const displayHour = simulatedHour % 12 === 0 ? 12 : simulatedHour % 12;
    const displayMin = simulatedMinute < 10 ? `0${simulatedMinute}` : simulatedMinute;
    return `Day ${simulatedDay}, ${displayHour}:${displayMin} ${period}`;
  };

  const formatRealElapsed = () => {
    const mins = Math.floor(elapsedRealSeconds / 60);
    const secs = elapsedRealSeconds % 60;
    return `${mins < 10 ? '0' : ''}${mins}m ${secs < 10 ? '0' : ''}${secs}s`;
  };

  const filteredLogs = logs.filter(log => {
    if (selectedFilter === 'ALL') return true;
    if (selectedFilter === 'ORDERS') return log.type === 'ORDER';
    if (selectedFilter === 'AI') return log.type === 'AI_SIGNAL' || log.type === 'LLM_REASONING' || log.type === 'AUTO_APPROVED' || log.type === 'MANUAL_REQUIRED';
    if (selectedFilter === 'SHIPMENTS') return log.type === 'PO_DISPATCHED' || log.type === 'SHIPMENT_DELIVERED';
    if (selectedFilter === 'SURGES') return log.type === 'SURGE_INJECTED';
    return true;
  });

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      {/* Simulation Command Center Master Bar (Subtle darker slate shade matching theme) */}
      <div className="p-4 sm:p-6 rounded-3xl bg-slate-100/90 dark:bg-slate-900/90 text-slate-900 dark:text-white border border-slate-200 dark:border-slate-800 shadow-xs relative overflow-hidden">
        {/* Ambient Glow */}
        <div className="absolute top-0 right-0 w-80 sm:w-96 h-80 sm:h-96 bg-indigo-600/5 dark:bg-indigo-600/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-0 w-80 sm:w-96 h-80 sm:h-96 bg-cyan-600/5 dark:bg-cyan-600/10 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 space-y-4 sm:space-y-5">
          {/* Top Bar: Title & Simulation Clock HUD */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 sm:pb-5 border-b border-slate-200 dark:border-slate-800">
            <div className="flex items-center gap-3">
              <div className="w-10 sm:w-12 h-10 sm:h-12 rounded-2xl bg-gradient-to-br from-indigo-500 via-indigo-600 to-cyan-500 p-0.5 shadow-sm shadow-indigo-500/20 shrink-0">
                <div className="w-full h-full bg-white dark:bg-slate-950 rounded-[14px] flex items-center justify-center text-indigo-600 dark:text-indigo-400">
                  <BrainCircuit className="w-5 sm:w-6 h-5 sm:h-6 animate-pulse" />
                </div>
              </div>
              <div>
                <div className="flex items-center gap-2 flex-wrap">
                  <h2 className="text-base sm:text-lg lg:text-xl font-extrabold tracking-tight text-slate-900 dark:text-white">
                    Live Autonomous Commerce Simulation Lab
                  </h2>
                  <span className={`px-2.5 py-0.5 rounded-full text-[11px] font-mono font-bold flex items-center gap-1.5 ${
                    isRunning
                      ? 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30 animate-pulse'
                      : 'bg-slate-200/80 dark:bg-slate-800 text-slate-600 dark:text-slate-400 border border-slate-300 dark:border-slate-700'
                  }`}>
                    <span className={`w-2 h-2 rounded-full ${isRunning ? 'bg-emerald-500 animate-ping' : 'bg-slate-400'}`} />
                    {isRunning ? 'LIVE' : 'PAUSED'}
                  </span>
                </div>
                <p className="text-[11px] sm:text-xs font-mono text-slate-500 dark:text-slate-400 mt-0.5">
                  1 Simulated Day = 1 Real Minute (60s) &bull; Continuous Gemini 2.5 Flash loop &amp; freight lead times
                </p>
              </div>
            </div>

            {/* Time Machine Clock HUD */}
            <div className="flex items-center justify-between sm:justify-end gap-3 sm:gap-4 bg-white/90 dark:bg-slate-950/90 p-2.5 sm:p-3 rounded-2xl border border-slate-200 dark:border-slate-800">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-600 dark:text-indigo-400 shrink-0">
                  <Clock className="w-4 h-4" />
                </div>
                <div>
                  <div className="text-[9.5px] uppercase font-mono tracking-wider text-slate-500 dark:text-slate-400 font-semibold">
                    Simulated World Time
                  </div>
                  <div className="text-sm sm:text-base font-mono font-bold text-slate-900 dark:text-white whitespace-nowrap">
                    {formatSimTime()}
                  </div>
                </div>
              </div>

              <div className="h-7 w-px bg-slate-200 dark:bg-slate-800" />

              <div>
                <div className="text-[9.5px] uppercase font-mono tracking-wider text-slate-500 dark:text-slate-400 font-semibold">
                  Elapsed
                </div>
                <div className="text-xs sm:text-sm font-mono font-bold text-cyan-600 dark:text-cyan-400 whitespace-nowrap">
                  {formatRealElapsed()}
                </div>
              </div>
            </div>
          </div>

          {/* Master Simulation Controls */}
          <div className="flex flex-wrap items-center justify-between gap-3 pt-1">
            {/* Play/Pause & Speed Buttons */}
            <div className="flex items-center gap-2 flex-wrap">
              <button
                onClick={() => setIsRunning(!isRunning)}
                className={`flex items-center gap-2 px-4 sm:px-5 py-2 sm:py-2.5 rounded-xl font-mono text-xs font-bold transition-all shadow-xs ${
                  isRunning
                    ? 'bg-amber-500 hover:bg-amber-600 text-white'
                    : 'bg-indigo-600 hover:bg-indigo-700 text-white'
                }`}
              >
                {isRunning ? (
                  <>
                    <Pause className="w-4 h-4 fill-current" />
                    <span>Pause Simulation</span>
                  </>
                ) : (
                  <>
                    <Play className="w-4 h-4 fill-current" />
                    <span>Start Live Simulation</span>
                  </>
                )}
              </button>

              {/* Speed Switchers */}
              <div className="flex items-center bg-white dark:bg-slate-950 p-1 rounded-xl border border-slate-200 dark:border-slate-800 text-xs font-mono">
                {[1, 2, 5].map(spd => (
                  <button
                    key={spd}
                    onClick={() => setPlaybackSpeed(spd)}
                    className={`px-2.5 sm:px-3 py-1 rounded-lg transition-all ${
                      playbackSpeed === spd
                        ? 'bg-indigo-600 text-white font-bold shadow-xs'
                        : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                    }`}
                  >
                    {spd}x {spd === 1 ? '(60s)' : spd === 2 ? '(30s)' : '(12s)'}
                  </button>
                ))}
              </div>

              {/* Reset Button */}
              <button
                onClick={handleResetSimulation}
                className="flex items-center gap-1.5 px-3 py-1.5 sm:py-2 rounded-xl text-xs font-mono text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-900 transition-colors"
                title="Reset simulation time and catalog"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>Reset</span>
              </button>
            </div>

            {/* Automation Policy Toggles */}
            <div className="flex items-center gap-2.5 flex-wrap">
              <label className="flex items-center gap-2 cursor-pointer bg-white dark:bg-slate-950 px-3 py-1.5 sm:py-2 rounded-xl border border-slate-200 dark:border-slate-800 text-xs font-mono">
                <input
                  type="checkbox"
                  checked={autoApproveAi}
                  onChange={e => setAutoApproveAi(e.target.checked)}
                  className="rounded border-slate-300 dark:border-slate-700 text-indigo-600 focus:ring-indigo-500 w-3.5 h-3.5"
                />
                <span className="text-slate-700 dark:text-slate-300">
                  Auto-Approve AI (<strong className="text-indigo-600 dark:text-indigo-400">&ge;85% conf</strong>)
                </span>
              </label>

              {/* Surge Injector Shortcut */}
              <button
                onClick={() => handleInjectSurge()}
                className="flex items-center gap-1.5 px-3 py-1.5 sm:py-2 rounded-xl text-xs font-mono font-bold bg-cyan-500/15 hover:bg-cyan-500/25 text-cyan-700 dark:text-cyan-300 border border-cyan-500/30 transition-all"
              >
                <Zap className="w-3.5 h-3.5 text-cyan-500" />
                <span>Surge (+15 Orders)</span>
              </button>
            </div>
          </div>

          {/* Day Progress Ring Bar */}
          <div className="space-y-1.5 pt-1">
            <div className="flex items-center justify-between text-[11px] font-mono text-slate-500 dark:text-slate-400">
              <span>Day {simulatedDay} Progress</span>
              <span>{Math.round(dayProgressPct)}% Completed</span>
            </div>
            <div className="w-full h-2 rounded-full bg-white dark:bg-slate-950 overflow-hidden border border-slate-200 dark:border-slate-800/80">
              <div
                className="h-full bg-gradient-to-r from-indigo-500 via-cyan-500 to-emerald-400 transition-all duration-300 ease-linear rounded-full"
                style={{ width: `${dayProgressPct}%` }}
              />
            </div>
          </div>
        </div>
      </div>

      {/* Real-Time Telemetry HUD (4 Metric Cards) */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 font-mono">
        <div className="p-3.5 sm:p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs">
          <div className="flex items-center justify-between text-slate-400 text-xs">
            <span>Cumulative Revenue</span>
            <DollarSign className="w-4 h-4 text-emerald-500" />
          </div>
          <div className="text-lg sm:text-xl font-bold text-slate-900 dark:text-white mt-1 truncate">
            ${cumulativeRevenue.toFixed(2)}
          </div>
          <div className="text-[11px] text-emerald-600 dark:text-emerald-400 mt-1 flex items-center gap-1">
            <TrendingUp className="w-3 h-3 shrink-0" />
            <span className="truncate">{totalOrdersPlaced} orders</span>
          </div>
        </div>

        <div className="p-3.5 sm:p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs">
          <div className="flex items-center justify-between text-slate-400 text-xs">
            <span>Stockouts Prevented</span>
            <ShieldCheck className="w-4 h-4 text-indigo-500" />
          </div>
          <div className="text-lg sm:text-xl font-bold text-slate-900 dark:text-white mt-1 truncate">
            {stockoutsPrevented}
          </div>
          <div className="text-[11px] text-indigo-600 dark:text-indigo-400 mt-1 truncate">
            Autonomous replenishment POs
          </div>
        </div>

        <div className="p-3.5 sm:p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs">
          <div className="flex items-center justify-between text-slate-400 text-xs">
            <span>AI Price Updates</span>
            <Sparkles className="w-4 h-4 text-cyan-500" />
          </div>
          <div className="text-lg sm:text-xl font-bold text-slate-900 dark:text-white mt-1 truncate">
            {aiPriceChangesCount}
          </div>
          <div className="text-[11px] text-cyan-600 dark:text-cyan-400 mt-1 truncate">
            Dynamic margin optimizations
          </div>
        </div>

        <div className="p-3.5 sm:p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs">
          <div className="flex items-center justify-between text-slate-400 text-xs">
            <span>Inbound Freight POs</span>
            <Truck className="w-4 h-4 text-amber-500" />
          </div>
          <div className="text-lg sm:text-xl font-bold text-slate-900 dark:text-white mt-1 truncate">
            {inboundShipments.length} in transit
          </div>
          <div className="text-[11px] text-amber-600 dark:text-amber-400 mt-1 truncate">
            Live supplier lead times
          </div>
        </div>
      </div>

      {/* 2-Column Split: Active Inbound Freight POs vs Real-Time Simulation Event Feed */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Live Catalog Status & Inbound Shipments (5 cols) */}
        <div className="lg:col-span-5 space-y-6">
          {/* Active Inbound Shipments Tracker */}
          <div className="p-4 sm:p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs space-y-3.5">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-amber-500/10 text-amber-600 dark:text-amber-400 flex items-center justify-center shrink-0">
                  <Truck className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="font-bold text-sm text-slate-900 dark:text-white">
                    Inbound Freight Shipments
                  </h3>
                  <p className="text-[11px] font-mono text-slate-500 dark:text-slate-400">
                    Real-time supplier lead-time countdowns
                  </p>
                </div>
              </div>
              <span className="px-2 py-0.5 rounded-full text-xs font-mono font-bold bg-amber-500/15 text-amber-600 dark:text-amber-400 border border-amber-500/30 shrink-0">
                {inboundShipments.length} Active
              </span>
            </div>

            {inboundShipments.length === 0 ? (
              <div className="py-8 text-center text-slate-400 dark:text-slate-500 text-xs font-mono">
                No freight orders currently in transit.
                <div className="text-[11px] text-slate-400 mt-1">
                  When stock drops below threshold, the agent dispatches supplier POs.
                </div>
              </div>
            ) : (
              <div className="space-y-2.5 max-h-[260px] sm:max-h-[300px] overflow-y-auto">
                {inboundShipments.map(shipment => {
                  const progressPct = Math.min(
                    100,
                    Math.round(
                      ((shipment.totalDurationSeconds - shipment.remainingSeconds) /
                        shipment.totalDurationSeconds) *
                        100
                    )
                  );

                  return (
                    <div
                      key={shipment.id}
                      className="p-3 sm:p-3.5 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 space-y-2 font-mono text-xs"
                    >
                      <div className="flex items-center justify-between">
                        <div>
                          <span className="font-bold text-indigo-600 dark:text-indigo-400">{shipment.id}</span>
                          <span className="text-slate-400 ml-1.5">&bull; {shipment.sku}</span>
                        </div>
                        <span className="text-amber-500 font-bold">
                          +{shipment.quantity} units
                        </span>
                      </div>

                      <div className="text-[11px] text-slate-700 dark:text-slate-300 truncate">
                        {shipment.productName}
                      </div>

                      <div className="space-y-1">
                        <div className="flex items-center justify-between text-[10px] text-slate-400">
                          <span>Lead Time: {shipment.leadTimeDays} days</span>
                          <span className="font-bold text-slate-900 dark:text-white">
                            ETA: {shipment.remainingSeconds}s ({progressPct}%)
                          </span>
                        </div>
                        <div className="w-full h-1.5 rounded-full bg-slate-200 dark:bg-slate-800 overflow-hidden">
                          <div
                            className="h-full bg-amber-500 rounded-full transition-all duration-300"
                            style={{ width: `${progressPct}%` }}
                          />
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Live Catalog Stock Tracker */}
          <div className="p-4 sm:p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs space-y-3.5">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 flex items-center justify-center shrink-0">
                  <Box className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="font-bold text-sm text-slate-900 dark:text-white">
                    Live Catalog Stock Levels
                  </h3>
                  <p className="text-[11px] font-mono text-slate-500 dark:text-slate-400">
                    Real-time inventory monitor
                  </p>
                </div>
              </div>
            </div>

            <div className="space-y-2 max-h-[300px] sm:max-h-[380px] overflow-y-auto">
              {liveProducts.map(product => {
                const isLow = product.stockLevel <= product.reorderThreshold;
                const pct = Math.min(100, Math.round((product.stockLevel / (product.reorderThreshold * 2.5)) * 100));

                return (
                  <div
                    key={product.id}
                    className="p-3 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 font-mono text-xs space-y-1.5"
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-semibold text-slate-900 dark:text-white truncate max-w-[180px]">
                        {product.name}
                      </span>
                      <span className="font-bold text-indigo-600 dark:text-indigo-400">
                        ${product.currentPrice.toFixed(2)}
                      </span>
                    </div>

                    <div className="flex items-center justify-between text-[10.5px] text-slate-400">
                      <span className={isLow ? 'text-amber-500 font-bold' : ''}>
                        {product.stockLevel} units (min {product.reorderThreshold})
                      </span>
                      <span>{product.demandVelocity} orders/d</span>
                    </div>

                    <div className="w-full h-1 rounded-full bg-slate-200 dark:bg-slate-800 overflow-hidden">
                      <div
                        className={`h-full rounded-full transition-all ${
                          product.stockLevel === 0 ? 'bg-rose-500' : isLow ? 'bg-amber-500 animate-pulse' : 'bg-emerald-500'
                        }`}
                        style={{ width: `${Math.max(5, pct)}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Right Column: Master Real-Time Simulation Event Feed (7 cols) */}
        <div className="lg:col-span-7 space-y-4">
          <div className="p-4 sm:p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs flex flex-col h-[520px] sm:h-[680px] lg:h-[760px]">
            {/* Header & Filter Pills */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 sm:pb-4 border-b border-slate-200 dark:border-slate-800">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0">
                  <Radio className="w-4 h-4 animate-pulse" />
                </div>
                <div>
                  <h3 className="font-bold text-sm text-slate-900 dark:text-white">
                    Live Agent &amp; Market Event Feed
                  </h3>
                  <p className="text-[11px] font-mono text-slate-500 dark:text-slate-400">
                    Real-time chronological telemetry log
                  </p>
                </div>
              </div>

              {/* Filter Pills */}
              <div className="flex items-center gap-1 bg-slate-100 dark:bg-slate-950 p-1 rounded-xl border border-slate-200 dark:border-slate-800 text-[11px] font-mono overflow-x-auto">
                {['ALL', 'ORDERS', 'AI', 'SHIPMENTS', 'SURGES'].map(flt => (
                  <button
                    key={flt}
                    onClick={() => setSelectedFilter(flt)}
                    className={`px-2.5 py-1 rounded-lg transition-colors whitespace-nowrap ${
                      selectedFilter === flt
                        ? 'bg-indigo-600 text-white font-bold shadow-xs'
                        : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                    }`}
                  >
                    {flt}
                  </button>
                ))}
              </div>
            </div>

            {/* Event Stream Container */}
            <div
              ref={logsContainerRef}
              className="flex-1 overflow-y-auto space-y-3 p-1 sm:p-2 pt-3 sm:pt-4 divide-y divide-slate-100 dark:divide-slate-800/40"
            >
              {filteredLogs.length === 0 ? (
                <div className="py-20 text-center text-slate-400 dark:text-slate-500 font-mono text-xs">
                  No simulation events recorded yet. Click <strong>Start Live Simulation</strong> above.
                </div>
              ) : (
                filteredLogs.map(log => {
                  const isAiTab = selectedFilter === 'AI';
                  const isExpanded = isAiTab || expandedLogIds.has(log.id);

                  let badge = (
                    <span className="px-2 py-0.5 rounded-md text-[10px] font-mono font-bold bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-slate-700">
                      {log.type}
                    </span>
                  );

                  if (log.type === 'ORDER') {
                    badge = (
                      <span className="px-2 py-0.5 rounded-md text-[10px] font-mono font-bold bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30 flex items-center gap-1">
                        <ShoppingCart className="w-3 h-3" />
                        ORDER
                      </span>
                    );
                  } else if (log.type === 'AI_SIGNAL') {
                    badge = (
                      <span className="px-2 py-0.5 rounded-md text-[10px] font-mono font-bold bg-amber-500/15 text-amber-600 dark:text-amber-400 border border-amber-500/30 flex items-center gap-1 animate-pulse">
                        <AlertTriangle className="w-3 h-3" />
                        AI TRIGGER
                      </span>
                    );
                  } else if (log.type === 'LLM_REASONING') {
                    badge = (
                      <span className="px-2 py-0.5 rounded-md text-[10px] font-mono font-bold bg-indigo-500/15 text-indigo-600 dark:text-indigo-400 border border-indigo-500/30 flex items-center gap-1">
                        <Sparkles className="w-3 h-3" />
                        GEMINI 2.5
                      </span>
                    );
                  } else if (log.type === 'AUTO_APPROVED') {
                    badge = (
                      <span className="px-2 py-0.5 rounded-md text-[10px] font-mono font-bold bg-cyan-500/15 text-cyan-600 dark:text-cyan-400 border border-cyan-500/30 flex items-center gap-1">
                        <CheckCircle2 className="w-3 h-3" />
                        AUTO-APPROVED
                      </span>
                    );
                  } else if (log.type === 'PO_DISPATCHED') {
                    badge = (
                      <span className="px-2 py-0.5 rounded-md text-[10px] font-mono font-bold bg-purple-500/15 text-purple-600 dark:text-purple-400 border border-purple-500/30 flex items-center gap-1">
                        <Truck className="w-3 h-3" />
                        PO DISPATCH
                      </span>
                    );
                  } else if (log.type === 'SHIPMENT_DELIVERED') {
                    badge = (
                      <span className="px-2 py-0.5 rounded-md text-[10px] font-mono font-bold bg-emerald-500/20 text-emerald-600 dark:text-emerald-300 border border-emerald-500/40 flex items-center gap-1">
                        <Package className="w-3 h-3" />
                        DELIVERED
                      </span>
                    );
                  } else if (log.type === 'SURGE_INJECTED') {
                    badge = (
                      <span className="px-2 py-0.5 rounded-md text-[10px] font-mono font-bold bg-rose-500/15 text-rose-600 dark:text-rose-400 border border-rose-500/30 flex items-center gap-1">
                        <Flame className="w-3 h-3" />
                        VIRAL SURGE
                      </span>
                    );
                  }

                  return (
                    <div key={log.id} className="pt-3 first:pt-0 space-y-1.5">
                      <div className="flex items-center justify-between text-xs font-mono">
                        <div className="flex items-center gap-2">
                          {badge}
                          <span className="font-bold text-slate-900 dark:text-white text-xs">
                            {log.title}
                          </span>
                        </div>
                        <span className="text-[10px] text-slate-400">
                          Day {log.simulatedDay} ({log.realTimestamp})
                        </span>
                      </div>

                      {/* Main Detail Summary */}
                      <div className="text-xs text-slate-700 dark:text-slate-300 leading-relaxed font-sans pl-1 whitespace-pre-wrap break-words">
                        {log.detail}
                      </div>

                      {/* Full AI Reasoning Section (Expanded in AI tab or when toggled) */}
                      {log.fullReasoning && (
                        <div className="pl-1">
                          {isExpanded ? (
                            <div className="mt-2 p-3.5 rounded-xl bg-indigo-50/70 dark:bg-indigo-950/40 border border-indigo-200/80 dark:border-indigo-800/60 font-sans text-xs text-slate-800 dark:text-slate-200 leading-relaxed space-y-2 animate-in fade-in duration-150">
                              <div className="flex items-center justify-between">
                                <div className="font-mono font-bold text-[11px] text-indigo-600 dark:text-indigo-400 flex items-center gap-1.5">
                                  <Sparkles className="w-3.5 h-3.5 text-indigo-500" />
                                  <span>Gemini 2.5 Flash Autonomous Tradeoff Reasoning</span>
                                </div>
                                {!isAiTab && (
                                  <button
                                    onClick={() => toggleExpand(log.id)}
                                    className="text-[11px] font-mono text-indigo-600 dark:text-indigo-400 hover:underline flex items-center gap-0.5"
                                  >
                                    <span>Collapse</span>
                                    <ChevronUp className="w-3 h-3" />
                                  </button>
                                )}
                              </div>
                              <div className="whitespace-pre-wrap break-words text-slate-700 dark:text-slate-300 font-sans text-xs pt-1">
                                {log.fullReasoning}
                              </div>
                            </div>
                          ) : (
                            <button
                              onClick={() => toggleExpand(log.id)}
                              className="mt-1 text-[11px] font-mono font-semibold text-indigo-600 dark:text-indigo-400 hover:underline flex items-center gap-1"
                            >
                              <span>View Full AI Reasoning</span>
                              <ChevronDown className="w-3 h-3" />
                            </button>
                          )}
                        </div>
                      )}

                      {/* Badges / Metrics Footer */}
                      {(log.priceDiff || log.stockDiff || log.confidence) && (
                        <div className="flex items-center gap-2 pt-1 font-mono text-[10.5px] flex-wrap pl-1">
                          {log.priceDiff && (
                            <span className="px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-indigo-600 dark:text-indigo-400 border border-slate-200 dark:border-slate-700">
                              Price: {log.priceDiff}
                            </span>
                          )}
                          {log.stockDiff && (
                            <span className="px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-amber-600 dark:text-amber-400 border border-slate-200 dark:border-slate-700">
                              Stock: {log.stockDiff}
                            </span>
                          )}
                          {log.confidence && (
                            <span className="px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
                              {(log.confidence * 100).toFixed(0)}% AI Conf.
                            </span>
                          )}
                        </div>
                      )}
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
