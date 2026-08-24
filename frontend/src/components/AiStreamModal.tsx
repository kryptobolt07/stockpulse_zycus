import React, { useEffect, useState } from 'react';
import { Product } from '../types';
import { X, Radio, ArrowRight, CheckCircle, RefreshCw, Sparkles } from 'lucide-react';

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

  const startStream = async () => {
    setStatusLog([]);
    setStreamedText('');
    setFinalResult(null);
    setIsStreaming(true);
    setError(null);

    try {
      const response = await fetch(`http://localhost:8080/products/${product.id}/suggest-pricing/stream`, {
        method: 'POST',
      });

      if (!response.body) {
        throw new Error('No readable stream available');
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
              data = line.substring(5).trim();
            }
          }

          if (eventType === 'status') {
            setStatusLog(prev => [...prev, data]);
          } else if (eventType === 'token') {
            setStreamedText(prev => prev + data);
          } else if (eventType === 'complete') {
            try {
              const parsed = JSON.parse(data);
              setFinalResult(parsed);
            } catch {
              setFinalResult({ raw: data });
            }
            setIsStreaming(false);
          }
        }
      }
      setIsStreaming(false);
    } catch (err: any) {
      console.error('SSE streaming error:', err);
      setError(err.message || 'Stream connection failed');
      setIsStreaming(false);
    }
  };

  useEffect(() => {
    startStream();
  }, [product.id]);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/85 backdrop-blur-sm p-4">
      <div className="bg-slate-950 text-slate-100 rounded-2xl border border-slate-800/80 shadow-2xl shadow-indigo-950/30 max-w-xl w-full animate-scale-in overflow-hidden">
        {/* Gradient accent bar at top */}
        <div className="h-0.5 w-full bg-gradient-to-r from-indigo-500 via-violet-500 to-cyan-500" />

        <div className="p-6">
        {/* Modal Header */}
        <div className="flex items-center justify-between pb-4 border-b border-slate-800/80">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-indigo-600/30 to-violet-600/20 text-indigo-400 border border-indigo-500/30 flex items-center justify-center icon-glow-indigo">
              <Radio className="w-4 h-4 animate-pulse" />
            </div>
            <div>
              <h3 className="font-bold text-base text-white tracking-tight">Live AI Reasoning Stream</h3>
              <p className="text-xs font-mono text-slate-400 mt-0.5">
                {product.name} · <span className="text-indigo-400">{product.sku}</span> · <span className="text-slate-500">${product.currentPrice.toFixed(2)}</span>
              </p>
            </div>
          </div>
          <button onClick={onClose} className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-800 rounded-xl transition-all">
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Status Pipeline Log */}
        <div className="mt-4 flex flex-wrap gap-1.5">
          {statusLog.map((log, i) => (
            <div key={i} className="flex items-center gap-1.5 text-[10px] font-mono bg-emerald-500/10 text-emerald-400 px-2.5 py-1 rounded-lg border border-emerald-500/20">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 shrink-0" />
              <span>{log}</span>
            </div>
          ))}
        </div>

        {/* Live Token Stream Terminal */}
        <div className="mt-3 bg-[#050a0f] p-4 rounded-xl border border-slate-800/60 min-h-[120px] max-h-[200px] overflow-y-auto font-mono text-xs leading-relaxed text-emerald-400">
          <div className="text-[9.5px] uppercase tracking-widest text-slate-600 mb-2.5 flex items-center justify-between">
            <span className="flex items-center gap-1.5">
              <span className="text-slate-700">›</span>
              products/{product.id}/suggest-pricing/stream
            </span>
            {isStreaming && (
              <span className="text-indigo-400 flex items-center gap-1">
                <RefreshCw className="w-3 h-3 animate-spin" />
                streaming
              </span>
            )}
          </div>
          <p className="whitespace-pre-wrap">
            {streamedText}
            {isStreaming && <span className="cursor-blink inline-block w-1.5 h-[1em] bg-emerald-400 ml-0.5 align-middle" />}
          </p>
          {error && (
            <p className="text-rose-400 mt-2 flex items-center gap-1.5 bg-rose-500/10 px-2 py-1.5 rounded-lg border border-rose-500/20">
              ⚠ {error}
            </p>
          )}
        </div>

        {/* Final Structured Recommendation Result Card */}
        {finalResult && (
          <div className="mt-4 bg-slate-900/80 p-4 rounded-xl border border-indigo-500/20 shadow-glow-indigo">
            <div className="flex items-center justify-between mb-3">
              <span className="text-[9.5px] font-mono text-slate-400 uppercase tracking-widest font-semibold flex items-center gap-1.5">
                <Sparkles className="w-3 h-3 text-indigo-400" />
                Validated Price Proposal
              </span>
              <span className="text-xs font-mono text-emerald-400 flex items-center gap-1">
                <CheckCircle className="w-3.5 h-3.5" />
                <span>{Math.round((finalResult.confidence || 0.85) * 100)}% conf.</span>
              </span>
            </div>
            <div className="flex items-center justify-between bg-slate-950/80 p-3 rounded-lg border border-slate-800/80">
              <div className="flex items-center gap-2">
                <span className="text-xs font-mono text-slate-500 line-through">${product.currentPrice.toFixed(2)}</span>
                <ArrowRight className="w-3.5 h-3.5 text-slate-600" />
                <span className="text-lg font-mono font-bold text-indigo-400">
                  ${(finalResult.recommendedPrice || product.currentPrice).toFixed(2)}
                </span>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-emerald-500/15 text-emerald-400 border border-emerald-500/25 font-semibold">
                  {finalResult.changeDirection || 'HOLD'}
                </span>
              </div>
              <div className="text-[10px] font-mono text-slate-500">
                {finalResult.strategyUsed || 'AI_POWERED'}
              </div>
            </div>
            <div className="mt-2.5 confidence-bar-track">
              <div className="confidence-bar-fill" style={{ width: `${Math.round((finalResult.confidence || 0.85) * 100)}%` }} />
            </div>
          </div>
        )}

        {/* Footer Actions */}
        <div className="flex items-center justify-between mt-5 pt-3.5 border-t border-slate-800/80">
          <button
            onClick={startStream}
            disabled={isStreaming}
            className="flex items-center gap-1.5 text-xs font-mono text-slate-500 hover:text-white transition-all disabled:opacity-40"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            <span>Re-run Stream</span>
          </button>
          <button
            onClick={onClose}
            className="px-5 py-2 text-xs font-mono bg-slate-800/80 hover:bg-slate-700 text-white rounded-xl transition-all border border-slate-700/60"
          >
            Close
          </button>
        </div>
        </div>
      </div>
    </div>
  );
};
