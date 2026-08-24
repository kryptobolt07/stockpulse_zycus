import React, { useEffect, useState } from 'react';
import { Product } from '../types';
import {
  X,
  Radio,
  ArrowRight,
  CheckCircle2,
  RefreshCw,
  Sparkles,
  TrendingUp,
  TrendingDown,
  Minus,
  ShieldCheck,
  BrainCircuit,
  Copy,
  Check,
  Layers,
  Clock
} from 'lucide-react';

interface AiStreamModalProps {
  product: Product | null;
  onClose: () => void;
}

export const AiStreamModal: React.FC<AiStreamModalProps> = ({ product, onClose }) => {
  if (!product) return null;

  const [statusLog, setStatusLog] = useState<string[]>([]);
  const [streamedText, setStreamedText] = useState<string>('');
  const [finalResult, setFinalResult] = useState<any>(null);
  const [isStreaming, setIsStreaming] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState<boolean>(false);
  const activeControllerRef = React.useRef<AbortController | null>(null);

  const startStream = async () => {
    // Cancel any existing running stream
    if (activeControllerRef.current) {
      activeControllerRef.current.abort();
    }

    const controller = new AbortController();
    activeControllerRef.current = controller;

    setStatusLog([]);
    setStreamedText('');
    setFinalResult(null);
    setIsStreaming(true);
    setError(null);

    try {
      const response = await fetch(`http://localhost:8080/products/${product.id}/suggest-pricing/stream`, {
        method: 'POST',
        signal: controller.signal,
      });

      if (!response.body) {
        throw new Error('No readable stream available on backend');
      }

      const reader = response.body.getReader();
      const decoder = new TextDecoder('utf-8');
      let buffer = '';

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n\n');
        buffer = lines.pop() || '';

        for (const block of lines) {
          const trimmed = block.trim();
          if (!trimmed) continue;

          let eventType = 'message';
          let data = '';

          const blockLines = trimmed.split('\n');
          for (const line of blockLines) {
            if (line.startsWith('event:')) {
              eventType = line.substring(6).trim();
            } else if (line.startsWith('data:')) {
              data = line.substring(5);
              if (data.startsWith(' ')) {
                data = data.substring(1);
              }
            }
          }

          if (eventType === 'status') {
            const statusMsg = data.trim();
            if (statusMsg) {
              setStatusLog(prev => prev.includes(statusMsg) ? prev : [...prev, statusMsg]);
            }
          } else if (eventType === 'token') {
            const word = data.trim();
            if (word) {
              setStreamedText(prev => prev ? `${prev} ${word}` : word);
            }
          } else if (eventType === 'complete') {
            try {
              const parsed = JSON.parse(data);
              setFinalResult(parsed);
              if (parsed.reasoning) {
                setStreamedText(parsed.reasoning);
              }
            } catch {
              setFinalResult({ raw: data });
            }
            setIsStreaming(false);
          }
        }
      }
      setIsStreaming(false);
    } catch (err: any) {
      if (err.name === 'AbortError') {
        // Stream cancelled by next trigger or unmount
        return;
      }
      console.error('SSE streaming error:', err);
      setError(err.message || 'Stream connection failed');
      setIsStreaming(false);
    }
  };

  useEffect(() => {
    startStream();
    return () => {
      if (activeControllerRef.current) {
        activeControllerRef.current.abort();
      }
    };
  }, [product.id]);

  const handleCopy = () => {
    const textToCopy = finalResult?.reasoning || streamedText;
    navigator.clipboard.writeText(textToCopy);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const recPrice = finalResult?.recommendedPrice || product.currentPrice;
  const priceDiff = recPrice - product.currentPrice;
  const pctChange = product.currentPrice > 0 ? (priceDiff / product.currentPrice) * 100 : 0;
  const direction = finalResult?.changeDirection || (priceDiff > 0 ? 'INCREASE' : priceDiff < 0 ? 'DECREASE' : 'HOLD');

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-xs p-4 animate-in fade-in duration-150">
      <div className="bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-2xl max-w-2xl w-full overflow-hidden flex flex-col max-h-[90vh]">
        {/* Top Accent Line */}
        <div className="h-1 w-full bg-gradient-to-r from-indigo-500 via-cyan-500 to-emerald-500" />

        {/* Modal Header */}
        <div className="p-5 pb-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-indigo-600/10 text-indigo-600 dark:text-indigo-400 border border-indigo-500/20 flex items-center justify-center">
              <Radio className="w-5 h-5 animate-pulse" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-bold text-base text-slate-900 dark:text-white">
                  Live AI Commerce Reasoning Stream
                </h3>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-indigo-500/15 text-indigo-600 dark:text-indigo-400 border border-indigo-500/30">
                  SSE Token Stream
                </span>
              </div>
              <p className="text-xs font-mono text-slate-500 dark:text-slate-400 mt-0.5">
                {product.name} &bull; <span className="text-indigo-500">{product.sku}</span> &bull; Current: ${product.currentPrice.toFixed(2)}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-900 dark:hover:text-white rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Scrollable Body */}
        <div className="p-5 space-y-4 overflow-y-auto flex-1">
          {/* Telemetry Context Chips */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs font-mono">
            <div className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800">
              <div className="text-[10px] uppercase text-slate-400">Stock Level</div>
              <div className="font-bold text-slate-900 dark:text-white mt-0.5">{product.stockLevel} units</div>
            </div>
            <div className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800">
              <div className="text-[10px] uppercase text-slate-400">Reorder Target</div>
              <div className="font-bold text-slate-900 dark:text-white mt-0.5">{product.reorderThreshold} units</div>
            </div>
            <div className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800">
              <div className="text-[10px] uppercase text-slate-400">24h Sales Velocity</div>
              <div className="font-bold text-slate-900 dark:text-white mt-0.5">{product.demandVelocity}/day</div>
            </div>
            <div className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800">
              <div className="text-[10px] uppercase text-slate-400">Target Category</div>
              <div className="font-bold text-indigo-600 dark:text-indigo-400 mt-0.5">{product.category}</div>
            </div>
          </div>

          {/* Pipeline Step Progress */}
          {statusLog.length > 0 && (
            <div className="space-y-1.5 pt-1">
              <div className="text-[10.5px] font-mono font-semibold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
                <BrainCircuit className="w-3.5 h-3.5 text-indigo-500" />
                <span>Agent Signal Processing Pipeline</span>
              </div>
              <div className="space-y-1">
                {statusLog.map((log, i) => (
                  <div
                    key={i}
                    className="flex items-center gap-2 text-xs font-mono bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 px-3 py-1.5 rounded-xl border border-emerald-500/20"
                  >
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                    <span>{log}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Formatted Streaming Reasoning Box */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <div className="text-[10.5px] font-mono font-semibold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-indigo-500" />
                <span>Real-Time AI Market &amp; Elasticity Analysis</span>
              </div>
              {isStreaming && (
                <div className="flex items-center gap-1.5 text-xs font-mono text-indigo-500">
                  <RefreshCw className="w-3 h-3 animate-spin" />
                  <span>Streaming tokens...</span>
                </div>
              )}
            </div>

            <div className="p-5 rounded-2xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 min-h-[160px] max-h-[300px] overflow-y-auto">
              {streamedText ? (
                <p className="text-sm font-sans leading-relaxed text-slate-800 dark:text-slate-200 whitespace-pre-wrap break-words">
                  {streamedText}
                  {isStreaming && (
                    <span className="inline-block w-2 h-4 bg-indigo-500 ml-1.5 animate-pulse align-middle rounded-xs" />
                  )}
                </p>
              ) : (
                <div className="flex flex-col items-center justify-center py-8 text-slate-400 space-y-2">
                  <RefreshCw className="w-6 h-6 animate-spin text-indigo-500" />
                  <span className="font-mono text-xs">Waiting for first token from LiteLLM / Gemini 2.5...</span>
                </div>
              )}

              {error && (
                <div className="mt-3 p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-600 dark:text-rose-400 text-xs font-mono">
                  Error: {error}
                </div>
              )}
            </div>
          </div>

          {/* Validated Proposal Output Card (When Stream Completes) */}
          {finalResult && (
            <div className="p-4 rounded-2xl bg-indigo-50/60 dark:bg-indigo-950/40 border border-indigo-500/30 space-y-3 animate-in fade-in slide-in-from-bottom-2 duration-200">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <ShieldCheck className="w-4 h-4 text-emerald-500" />
                  <span className="font-bold text-xs text-slate-900 dark:text-white font-mono uppercase tracking-wider">
                    Validated Pricing Decision
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-xs font-mono font-bold text-emerald-600 dark:text-emerald-400">
                    {Math.round((finalResult.confidence || 0.88) * 100)}% Confidence
                  </span>
                  <button
                    onClick={handleCopy}
                    className="flex items-center gap-1 text-[11px] font-mono text-slate-500 hover:text-slate-900 dark:hover:text-white px-2 py-0.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900"
                    title="Copy AI Reasoning"
                  >
                    {copied ? <Check className="w-3 h-3 text-emerald-500" /> : <Copy className="w-3 h-3" />}
                    <span>{copied ? 'Copied' : 'Copy'}</span>
                  </button>
                </div>
              </div>

              {/* Price comparison card */}
              <div className="flex items-center justify-between p-3 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
                <div className="flex items-center gap-3">
                  <div>
                    <div className="text-[10px] font-mono text-slate-400">Current Price</div>
                    <div className="text-xs font-mono line-through text-slate-400">${product.currentPrice.toFixed(2)}</div>
                  </div>
                  <ArrowRight className="w-4 h-4 text-slate-400" />
                  <div>
                    <div className="text-[10px] font-mono text-slate-400">Recommended Price</div>
                    <div className="text-base font-mono font-bold text-indigo-600 dark:text-indigo-400">
                      ${recPrice.toFixed(2)}
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <span className={`px-2.5 py-1 rounded-lg text-xs font-mono font-bold flex items-center gap-1 ${
                    direction === 'INCREASE'
                      ? 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30'
                      : direction === 'DECREASE'
                      ? 'bg-rose-500/15 text-rose-600 dark:text-rose-400 border border-rose-500/30'
                      : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 border border-slate-300 dark:border-slate-700'
                  }`}>
                    {direction === 'INCREASE' && <TrendingUp className="w-3.5 h-3.5" />}
                    {direction === 'DECREASE' && <TrendingDown className="w-3.5 h-3.5" />}
                    {direction === 'HOLD' && <Minus className="w-3.5 h-3.5" />}
                    <span>{pctChange > 0 ? `+${pctChange.toFixed(1)}%` : pctChange < 0 ? `${pctChange.toFixed(1)}%` : 'HOLD (0%)'}</span>
                  </span>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="p-4 border-t border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950/40 flex items-center justify-between">
          <button
            onClick={startStream}
            disabled={isStreaming}
            className="flex items-center gap-1.5 text-xs font-mono text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white transition-all disabled:opacity-40"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            <span>Re-run Stream</span>
          </button>
          <button
            onClick={onClose}
            className="px-5 py-2 text-xs font-mono font-semibold bg-slate-900 dark:bg-white text-white dark:text-slate-900 hover:bg-slate-800 dark:hover:bg-slate-100 rounded-xl transition-all shadow-xs"
          >
            Close Stream
          </button>
        </div>
      </div>
    </div>
  );
};
