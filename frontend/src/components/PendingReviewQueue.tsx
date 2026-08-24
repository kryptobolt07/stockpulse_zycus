import React, { useState } from 'react';
import {
  PricingSuggestion,
  ReorderSuggestion,
  TriggerReason
} from '../types';
import {
  Check,
  X,
  Sparkles,
  Truck,
  AlertTriangle,
  Zap,
  HelpCircle,
  ArrowRight,
  ShieldCheck,
  ChevronDown,
  ChevronUp,
  CheckCheck
} from 'lucide-react';

interface PendingReviewQueueProps {
  pricingSuggestions: PricingSuggestion[];
  reorderSuggestions: ReorderSuggestion[];
  onDecidePricing: (id: number, decision: 'ACCEPTED' | 'REJECTED') => void;
  onDecideReorder: (id: number, decision: 'ACCEPTED' | 'REJECTED') => void;
  isLoading: boolean;
}

type QueueItem =
  | { type: 'pricing'; data: PricingSuggestion }
  | { type: 'reorder'; data: ReorderSuggestion };

export const PendingReviewQueue: React.FC<PendingReviewQueueProps> = ({
  pricingSuggestions,
  reorderSuggestions,
  onDecidePricing,
  onDecideReorder,
  isLoading
}) => {
  const [filter, setFilter] = useState<'ALL' | 'PRICING' | 'REORDER'>('ALL');
  // Global expansion state for reasoning
  const [expandAllReasoning, setExpandAllReasoning] = useState<boolean>(false);
  // Per-card expanded reasoning set
  const [expandedCardIds, setExpandedCardIds] = useState<Set<string>>(new Set());

  const pendingPricing = pricingSuggestions.filter(s => s.status === 'PENDING');
  const pendingReorders = reorderSuggestions.filter(s => s.status === 'PENDING');
  const totalPending = pendingPricing.length + pendingReorders.length;

  const toggleCardReasoning = (cardKey: string) => {
    setExpandedCardIds(prev => {
      const next = new Set(prev);
      if (next.has(cardKey)) {
        next.delete(cardKey);
      } else {
        next.add(cardKey);
      }
      return next;
    });
  };

  const isReasoningVisible = (cardKey: string) => {
    if (expandAllReasoning) return true;
    return expandedCardIds.has(cardKey);
  };

  const renderTriggerBadge = (trigger: TriggerReason) => {
    switch (trigger) {
      case 'INVENTORY_LOW':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-md text-[10.5px] font-mono font-semibold bg-amber-500/15 text-amber-600 dark:text-amber-400 border border-amber-500/30">
            <AlertTriangle className="w-3 h-3 text-amber-500" />
            Low Stock Trigger
          </span>
        );
      case 'DEMAND_SPIKE':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-md text-[10.5px] font-mono font-semibold bg-cyan-500/15 text-cyan-600 dark:text-cyan-400 border border-cyan-500/30">
            <Zap className="w-3 h-3 text-cyan-500" />
            Demand Surge
          </span>
        );
      case 'MANUAL':
      default:
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-md text-[10.5px] font-mono font-semibold bg-indigo-500/15 text-indigo-600 dark:text-indigo-400 border border-indigo-500/30">
            <HelpCircle className="w-3 h-3 text-indigo-500" />
            Manual Audit
          </span>
        );
    }
  };

  const handleBatchApproveHighConfidence = async () => {
    const highConfPricing = pendingPricing.filter(p => p.confidence >= 0.85);
    const highConfReorder = pendingReorders.filter(r => r.confidence >= 0.85);

    for (const p of highConfPricing) {
      await onDecidePricing(p.id, 'ACCEPTED');
    }
    for (const r of highConfReorder) {
      await onDecideReorder(r.id, 'ACCEPTED');
    }
  };

  if (totalPending === 0) {
    return (
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-8 text-center mb-8 shadow-xs">
        <div className="w-12 h-12 rounded-xl bg-emerald-500/10 text-emerald-500 flex items-center justify-center mx-auto mb-3">
          <ShieldCheck className="w-6 h-6" />
        </div>
        <h3 className="font-bold text-base text-slate-900 dark:text-white mb-1">
          Governance Checkpoint Clear
        </h3>
        <p className="text-xs text-slate-500 dark:text-slate-400 max-w-md mx-auto">
          The autonomous agent is monitoring inventory thresholds and velocity spikes in the background. Trigger an order or adjust stock to test recommendation generation.
        </p>
      </div>
    );
  }

  // Combine items for independent 2-column masonry flow
  const items: QueueItem[] = [];
  if (filter === 'ALL' || filter === 'PRICING') {
    pendingPricing.forEach(p => items.push({ type: 'pricing', data: p }));
  }
  if (filter === 'ALL' || filter === 'REORDER') {
    pendingReorders.forEach(r => items.push({ type: 'reorder', data: r }));
  }

  return (
    <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs overflow-hidden mb-8 transition-all">
      {/* Header Toolbar */}
      <div className="p-4 sm:p-5 border-b border-slate-200 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-950/40 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-indigo-600 text-white flex items-center justify-center font-bold shrink-0">
            <ShieldCheck className="w-4 h-4" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="font-bold text-base text-slate-900 dark:text-white">
                Pending Approvals
              </h2>
              <span className="px-2.5 py-0.5 rounded-full bg-amber-500/15 text-amber-600 dark:text-amber-400 text-xs font-mono font-bold border border-amber-500/30">
                {totalPending} Awaiting Sign-off
              </span>
            </div>
            <p className="text-xs font-mono text-slate-500 dark:text-slate-400 mt-0.5">
              Review and approve or dismiss autonomous proposals
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          {/* Type Filter Pills */}
          <div className="flex items-center bg-slate-100 dark:bg-slate-900 p-0.5 rounded-xl border border-slate-200 dark:border-slate-800 text-xs font-mono">
            <button
              onClick={() => setFilter('ALL')}
              className={`px-2.5 sm:px-3 py-1 rounded-lg transition-all ${
                filter === 'ALL'
                  ? 'bg-white dark:bg-slate-800 text-slate-900 dark:text-white font-semibold shadow-xs'
                  : 'text-slate-500 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              All ({totalPending})
            </button>
            <button
              onClick={() => setFilter('PRICING')}
              className={`px-2.5 sm:px-3 py-1 rounded-lg transition-all ${
                filter === 'PRICING'
                  ? 'bg-white dark:bg-slate-800 text-slate-900 dark:text-white font-semibold shadow-xs'
                  : 'text-slate-500 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              Pricing ({pendingPricing.length})
            </button>
            <button
              onClick={() => setFilter('REORDER')}
              className={`px-2.5 sm:px-3 py-1 rounded-lg transition-all ${
                filter === 'REORDER'
                  ? 'bg-white dark:bg-slate-800 text-slate-900 dark:text-white font-semibold shadow-xs'
                  : 'text-slate-500 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              Reorders ({pendingReorders.length})
            </button>
          </div>

          {/* Toggle All Reasoning Text */}
          <button
            onClick={() => setExpandAllReasoning(!expandAllReasoning)}
            className="flex items-center gap-1 px-3 py-1.5 rounded-xl text-xs font-mono font-medium bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700 transition-all"
            title="Toggle AI reasoning explanations for all cards"
          >
            {expandAllReasoning ? (
              <>
                <ChevronUp className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Collapse Reasoning</span>
                <span className="sm:hidden">Collapse</span>
              </>
            ) : (
              <>
                <ChevronDown className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Expand Reasoning</span>
                <span className="sm:hidden">Reasoning</span>
              </>
            )}
          </button>

          {/* Batch Approve High Confidence */}
          {totalPending > 1 && (
            <button
              onClick={handleBatchApproveHighConfidence}
              disabled={isLoading}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-mono font-semibold bg-emerald-600 hover:bg-emerald-500 text-white shadow-xs transition-all disabled:opacity-50"
              title="Batch approve all proposals with confidence >= 85%"
            >
              <CheckCheck className="w-3.5 h-3.5" />
              <span className="hidden md:inline">Approve High Conf (&ge;85%)</span>
              <span className="md:hidden">Approve All</span>
            </button>
          )}
        </div>
      </div>

      {/* Masonry Columns Layout: Expanding 1 card only moves items in its column */}
      <div className="p-4 sm:p-5">
        <div className="columns-1 lg:columns-2 gap-4 space-y-4">
          {items.map(item => {
            if (item.type === 'pricing') {
              const suggestion = item.data;
              const cardKey = `pricing-${suggestion.id}`;
              const isReasoningOpen = isReasoningVisible(cardKey);
              const priceDiff = suggestion.recommendedPrice - suggestion.currentPrice;
              const pctDiff = Math.round((priceDiff / suggestion.currentPrice) * 100);

              return (
                <div
                  key={cardKey}
                  className="break-inside-avoid bg-slate-50/70 dark:bg-slate-950/70 rounded-2xl border border-slate-200 dark:border-slate-800/90 shadow-xs p-4 sm:p-5 hover:border-indigo-500/40 transition-all mb-4"
                >
                  <div className="flex items-center justify-between gap-2 mb-2">
                    {renderTriggerBadge(suggestion.triggerReason)}
                    <span className="text-xs font-mono text-slate-400">
                      {suggestion.product.sku}
                    </span>
                  </div>

                  <h3 className="font-bold text-base text-slate-900 dark:text-white mb-3">
                    {suggestion.product.name}
                    <span className="ml-2 text-[10.5px] font-mono px-2 py-0.5 rounded bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-slate-700">
                      {suggestion.product.category}
                    </span>
                  </h3>

                  {/* Price Comparison Card */}
                  <div className="bg-white dark:bg-slate-900 rounded-xl p-3.5 mb-3 border border-slate-200 dark:border-slate-800">
                    <div className="flex items-center justify-between">
                      <div>
                        <div className="text-[10px] font-mono uppercase tracking-wider text-slate-500 dark:text-slate-400 font-medium">
                          Price Proposal
                        </div>
                        <div className="flex items-center gap-2 mt-1">
                          <span className="text-sm font-mono text-slate-400 line-through">
                            ${suggestion.currentPrice.toFixed(2)}
                          </span>
                          <ArrowRight className="w-3.5 h-3.5 text-slate-400" />
                          <span className="text-xl font-mono font-bold text-indigo-600 dark:text-indigo-400">
                            ${suggestion.recommendedPrice.toFixed(2)}
                          </span>
                          <span className={`text-xs font-mono font-bold px-2 py-0.5 rounded-full ${
                            priceDiff > 0
                              ? 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20'
                              : 'bg-rose-500/15 text-rose-600 dark:text-rose-400 border border-rose-500/20'
                          }`}>
                            {priceDiff > 0 ? `+${pctDiff}%` : `${pctDiff}%`}
                          </span>
                        </div>
                      </div>

                      <div className="text-right">
                        <div className="text-[10px] font-mono uppercase tracking-wider text-slate-500 dark:text-slate-400 font-medium">
                          Confidence
                        </div>
                        <div className="text-sm font-mono font-bold text-slate-900 dark:text-white mt-1">
                          {Math.round(suggestion.confidence * 100)}%
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Collapsible Reasoning Section */}
                  <div className="mb-3">
                    <button
                      onClick={() => toggleCardReasoning(cardKey)}
                      className="flex items-center gap-1 text-[11px] font-mono text-indigo-600 dark:text-indigo-400 hover:underline font-medium mb-1.5"
                    >
                      <Sparkles className="w-3.5 h-3.5" />
                      <span>{isReasoningOpen ? 'Hide AI Reasoning ▴' : 'View AI Reasoning ▾'}</span>
                    </button>
                    {isReasoningOpen && (
                      <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed bg-white dark:bg-slate-900 p-3 rounded-xl border border-slate-200 dark:border-slate-800 animate-in fade-in duration-150">
                        "{suggestion.reasoning}"
                      </p>
                    )}
                  </div>

                  {/* Actions */}
                  <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-200 dark:border-slate-800">
                    <button
                      onClick={() => onDecidePricing(suggestion.id, 'REJECTED')}
                      disabled={isLoading}
                      className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-mono text-slate-600 dark:text-slate-400 hover:text-rose-600 dark:hover:text-rose-400 hover:bg-rose-500/10 border border-slate-200 dark:border-slate-800 transition-all"
                    >
                      <X className="w-3.5 h-3.5" />
                      <span>Dismiss</span>
                    </button>
                    <button
                      onClick={() => onDecidePricing(suggestion.id, 'ACCEPTED')}
                      disabled={isLoading}
                      className="flex items-center gap-1.5 px-4 py-1.5 rounded-xl text-xs font-mono font-semibold bg-indigo-600 hover:bg-indigo-500 text-white shadow-sm shadow-indigo-600/30 transition-all"
                    >
                      <Check className="w-3.5 h-3.5" />
                      <span>Apply Price</span>
                    </button>
                  </div>
                </div>
              );
            } else {
              const suggestion = item.data;
              const cardKey = `reorder-${suggestion.id}`;
              const isReasoningOpen = isReasoningVisible(cardKey);

              return (
                <div
                  key={cardKey}
                  className="break-inside-avoid bg-slate-50/70 dark:bg-slate-950/70 rounded-2xl border border-slate-200 dark:border-slate-800/90 shadow-xs p-4 sm:p-5 hover:border-emerald-500/40 transition-all mb-4"
                >
                  <div className="flex items-center justify-between gap-2 mb-2">
                    {renderTriggerBadge(suggestion.triggerReason)}
                    <span className="text-xs font-mono text-slate-400">
                      {suggestion.product.sku}
                    </span>
                  </div>

                  <h3 className="font-bold text-base text-slate-900 dark:text-white mb-3">
                    {suggestion.product.name}
                    <span className="ml-2 text-[10.5px] font-mono px-2 py-0.5 rounded bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-slate-700">
                      {suggestion.product.category}
                    </span>
                  </h3>

                  {/* Reorder Card */}
                  <div className="bg-white dark:bg-slate-900 rounded-xl p-3.5 mb-3 border border-slate-200 dark:border-slate-800">
                    <div className="grid grid-cols-3 gap-2 text-left">
                      <div>
                        <div className="text-[10px] font-mono uppercase tracking-wider text-slate-500 dark:text-slate-400 font-medium">
                          Replenish
                        </div>
                        <div className="text-xl font-mono font-bold text-emerald-600 dark:text-emerald-400 mt-1">
                          +{suggestion.recommendedQuantity} <span className="text-xs font-normal text-slate-500">units</span>
                        </div>
                      </div>

                      <div>
                        <div className="text-[10px] font-mono uppercase tracking-wider text-slate-500 dark:text-slate-400 font-medium">
                          Freight Lead
                        </div>
                        <div className="text-sm font-mono font-semibold text-slate-900 dark:text-white mt-1.5 flex items-center gap-1">
                          <Truck className="w-3.5 h-3.5 text-slate-400" />
                          <span>{suggestion.suggestedLeadTimeDays}d lead</span>
                        </div>
                      </div>

                      <div>
                        <div className="text-[10px] font-mono uppercase tracking-wider text-slate-500 dark:text-slate-400 font-medium">
                          Confidence
                        </div>
                        <div className="text-sm font-mono font-bold text-slate-900 dark:text-white mt-1.5">
                          {Math.round(suggestion.confidence * 100)}%
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Collapsible Reasoning Section */}
                  <div className="mb-3">
                    <button
                      onClick={() => toggleCardReasoning(cardKey)}
                      className="flex items-center gap-1 text-[11px] font-mono text-emerald-600 dark:text-emerald-400 hover:underline font-medium mb-1.5"
                    >
                      <Sparkles className="w-3.5 h-3.5" />
                      <span>{isReasoningOpen ? 'Hide AI Reasoning ▴' : 'View AI Reasoning ▾'}</span>
                    </button>
                    {isReasoningOpen && (
                      <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed bg-white dark:bg-slate-900 p-3 rounded-xl border border-slate-200 dark:border-slate-800 animate-in fade-in duration-150">
                        "{suggestion.reasoning}"
                      </p>
                    )}
                  </div>

                  {/* Actions */}
                  <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-200 dark:border-slate-800">
                    <button
                      onClick={() => onDecideReorder(suggestion.id, 'REJECTED')}
                      disabled={isLoading}
                      className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-mono text-slate-600 dark:text-slate-400 hover:text-rose-600 dark:hover:text-rose-400 hover:bg-rose-500/10 border border-slate-200 dark:border-slate-800 transition-all"
                    >
                      <X className="w-3.5 h-3.5" />
                      <span>Dismiss</span>
                    </button>
                    <button
                      onClick={() => onDecideReorder(suggestion.id, 'ACCEPTED')}
                      disabled={isLoading}
                      className="flex items-center gap-1.5 px-4 py-1.5 rounded-lg text-xs font-mono font-semibold bg-emerald-600 hover:bg-emerald-500 text-white shadow-sm shadow-emerald-600/30 transition-all"
                    >
                      <Check className="w-3.5 h-3.5" />
                      <span>Receive Inbound Stock</span>
                    </button>
                  </div>
                </div>
              );
            }
          })}
        </div>
      </div>
    </div>
  );
};
