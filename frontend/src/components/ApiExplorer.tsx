import React, { useState } from 'react';
import axios from 'axios';
import {
  Send,
  Code2,
  CheckCircle2,
  AlertCircle,
  Clock,
  Copy,
  Check,
  Radio,
  Layers,
  Sparkles,
  Database,
  ArrowRight,
  RefreshCw,
  Terminal
} from 'lucide-react';

interface EndpointDef {
  id: string;
  category: 'Products' | 'AI & Strategies' | 'Governance' | 'System & Telemetry';
  method: 'GET' | 'POST' | 'PATCH' | 'SSE';
  path: string;
  description: string;
  defaultParams?: Record<string, string>;
  defaultBody?: any;
  isStream?: boolean;
}

const ENDPOINTS: EndpointDef[] = [
  // Products
  {
    id: 'get-products',
    category: 'Products',
    method: 'GET',
    path: '/products',
    description: 'Retrieve catalog products with optional category, status, and search filters.',
    defaultParams: { category: '', status: '', search: '' },
  },
  {
    id: 'get-product-by-id',
    category: 'Products',
    method: 'GET',
    path: '/products/{id}',
    description: 'Fetch complete metadata and live metrics for a specific SKU.',
    defaultParams: { id: 'PRD-001' },
  },
  {
    id: 'create-product',
    category: 'Products',
    method: 'POST',
    path: '/products',
    description: 'Register a new catalog SKU with initial price, stock, and thresholds.',
    defaultBody: {
      sku: 'SKU-ELEC-099',
      name: 'Noise-Cancelling Headphones',
      category: 'ELECTRONICS',
      currentPrice: 129.99,
      stockLevel: 40,
      reorderThreshold: 15,
      costPrice: 65.00,
      marginFloor: 85.00,
    },
  },
  {
    id: 'update-stock',
    category: 'Products',
    method: 'PATCH',
    path: '/products/{id}/stock',
    description: 'Directly update stock level. Fires reactive agent loop if stock drops below threshold.',
    defaultParams: { id: 'PRD-003' },
    defaultBody: { stockLevel: 7 },
  },
  {
    id: 'simulate-order',
    category: 'Products',
    method: 'POST',
    path: '/products/{id}/orders',
    description: 'Simulate customer order. Decrements stock, bumps 24h velocity, and triggers low-stock or surge loops.',
    defaultParams: { id: 'PRD-008' },
    defaultBody: { quantity: 5 },
  },

  // AI & Strategies
  {
    id: 'suggest-pricing',
    category: 'AI & Strategies',
    method: 'POST',
    path: '/products/{id}/suggest-pricing',
    description: 'Trigger on-demand pricing evaluation for a SKU (badge: MANUAL).',
    defaultParams: { id: 'PRD-008' },
  },
  {
    id: 'suggest-reorder',
    category: 'AI & Strategies',
    method: 'POST',
    path: '/products/{id}/suggest-reorder',
    description: 'Trigger on-demand replenishment evaluation for a SKU (badge: MANUAL).',
    defaultParams: { id: 'PRD-003' },
  },
  {
    id: 'suggest-pricing-stream',
    category: 'AI & Strategies',
    method: 'POST',
    path: '/products/{id}/suggest-pricing/stream',
    description: 'Stream AI reasoning tokens in real time via Server-Sent Events (SSE).',
    defaultParams: { id: 'PRD-008' },
    isStream: true,
  },

  // Governance
  {
    id: 'get-pricing-suggestions',
    category: 'Governance',
    method: 'GET',
    path: '/pricing-suggestions',
    description: 'Retrieve pending or decided pricing proposals from the governance queue.',
    defaultParams: { status: 'PENDING' },
  },
  {
    id: 'decide-pricing-suggestion',
    category: 'Governance',
    method: 'PATCH',
    path: '/pricing-suggestions/{id}',
    description: 'Approve (ACCEPTED) or dismiss (REJECTED) a pricing proposal. Acceptance updates product price live.',
    defaultParams: { id: '1' },
    defaultBody: { status: 'ACCEPTED' },
  },
  {
    id: 'get-reorder-suggestions',
    category: 'Governance',
    method: 'GET',
    path: '/reorder-suggestions',
    description: 'Retrieve pending or decided replenishment proposals from the governance queue.',
    defaultParams: { status: 'PENDING' },
  },
  {
    id: 'decide-reorder-suggestion',
    category: 'Governance',
    method: 'PATCH',
    path: '/reorder-suggestions/{id}',
    description: 'Approve (ACCEPTED) or dismiss (REJECTED) a reorder proposal. Acceptance receives inbound stock units.',
    defaultParams: { id: '1' },
    defaultBody: { status: 'ACCEPTED' },
  },

  // System & Telemetry
  {
    id: 'get-dashboard-metrics',
    category: 'System & Telemetry',
    method: 'GET',
    path: '/api/analytics/dashboard',
    description: 'Aggregated store metrics: active SKUs, pending reviews, low-stock count, and category velocity averages.',
  },
  {
    id: 'get-strategy-config',
    category: 'System & Telemetry',
    method: 'GET',
    path: '/api/config/strategy',
    description: 'Get current active commerce strategy (AI_POWERED or RULE_BASED).',
  },
  {
    id: 'set-strategy-config',
    category: 'System & Telemetry',
    method: 'POST',
    path: '/api/config/strategy',
    description: 'Hot-swap commerce strategy at runtime without restarting the server.',
    defaultBody: { mode: 'AI_POWERED' },
  },
  {
    id: 'reset-database',
    category: 'System & Telemetry',
    method: 'POST',
    path: '/api/seed/reset',
    description: 'Reset H2 in-memory database back to Addendum A reference state.',
  },
];

export const ApiExplorer: React.FC = () => {
  const [selectedEndpoint, setSelectedEndpoint] = useState<EndpointDef>(ENDPOINTS[0]);
  const [params, setParams] = useState<Record<string, string>>(ENDPOINTS[0].defaultParams || {});
  const [bodyText, setBodyText] = useState<string>(
    ENDPOINTS[0].defaultBody ? JSON.stringify(ENDPOINTS[0].defaultBody, null, 2) : ''
  );

  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [responseStatus, setResponseStatus] = useState<number | null>(null);
  const [latencyMs, setLatencyMs] = useState<number | null>(null);
  const [responseHeaders, setResponseHeaders] = useState<Record<string, string>>({});
  const [responseData, setResponseData] = useState<any>(null);
  const [streamChunks, setStreamChunks] = useState<string[]>([]);
  const [copied, setCopied] = useState<boolean>(false);
  const [filterCategory, setFilterCategory] = useState<string>('ALL');

  const handleSelectEndpoint = (ep: EndpointDef) => {
    setSelectedEndpoint(ep);
    setParams(ep.defaultParams || {});
    setBodyText(ep.defaultBody ? JSON.stringify(ep.defaultBody, null, 2) : '');
    setResponseStatus(null);
    setLatencyMs(null);
    setResponseData(null);
    setStreamChunks([]);
  };

  const handleExecuteRequest = async () => {
    setIsLoading(true);
    setResponseStatus(null);
    setLatencyMs(null);
    setResponseData(null);
    setStreamChunks([]);

    // Construct final URL with path parameter replacement
    let finalPath = selectedEndpoint.path;
    const queryParams: Record<string, string> = {};

    Object.entries(params).forEach(([k, v]) => {
      if (finalPath.includes(`{${k}}`)) {
        finalPath = finalPath.replace(`{${k}}`, encodeURIComponent(v));
      } else if (v.trim()) {
        queryParams[k] = v.trim();
      }
    });

    const fullUrl = `http://localhost:8080${finalPath}`;

    // Handle SSE Stream request
    if (selectedEndpoint.isStream) {
      const startTime = performance.now();
      try {
        const response = await fetch(fullUrl, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
        });

        setResponseStatus(response.status);
        setLatencyMs(Math.round(performance.now() - startTime));

        if (!response.body) throw new Error('ReadableStream not supported');

        const reader = response.body.getReader();
        const decoder = new TextDecoder('utf-8');

        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          const chunk = decoder.decode(value, { stream: true });
          const lines = chunk.split('\n');
          lines.forEach(l => {
            if (l.startsWith('data:')) {
              setStreamChunks(prev => [...prev, l.replace('data:', '').trim()]);
            }
          });
        }
      } catch (err: any) {
        setResponseData({ error: err.message });
      } finally {
        setIsLoading(false);
      }
      return;
    }

    // Handle standard REST request
    let parsedBody: any = undefined;
    if (bodyText.trim() && (selectedEndpoint.method === 'POST' || selectedEndpoint.method === 'PATCH')) {
      try {
        parsedBody = JSON.parse(bodyText);
      } catch (err) {
        setResponseData({ error: 'Invalid JSON payload in request body' });
        setIsLoading(false);
        return;
      }
    }

    const startTime = performance.now();
    try {
      const res = await axios({
        method: selectedEndpoint.method.toLowerCase(),
        url: fullUrl,
        params: Object.keys(queryParams).length ? queryParams : undefined,
        data: parsedBody,
        headers: { 'Content-Type': 'application/json' },
      });

      const endTime = performance.now();
      setResponseStatus(res.status);
      setLatencyMs(Math.round(endTime - startTime));
      setResponseHeaders(res.headers as any);
      setResponseData(res.data);
    } catch (err: any) {
      const endTime = performance.now();
      setLatencyMs(Math.round(endTime - startTime));
      if (err.response) {
        setResponseStatus(err.response.status);
        setResponseHeaders(err.response.headers);
        setResponseData(err.response.data);
      } else {
        setResponseStatus(0);
        setResponseData({ error: err.message || 'Network error connecting to backend' });
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleCopyResponse = () => {
    const text = selectedEndpoint.isStream
      ? streamChunks.join('\n')
      : JSON.stringify(responseData, null, 2);
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const getMethodBadge = (method: string) => {
    switch (method) {
      case 'GET':
        return <span className="px-2 py-0.5 rounded text-[11px] font-mono font-bold bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30">GET</span>;
      case 'POST':
        return <span className="px-2 py-0.5 rounded text-[11px] font-mono font-bold bg-indigo-500/15 text-indigo-600 dark:text-indigo-400 border border-indigo-500/30">POST</span>;
      case 'PATCH':
        return <span className="px-2 py-0.5 rounded text-[11px] font-mono font-bold bg-amber-500/15 text-amber-600 dark:text-amber-400 border border-amber-500/30">PATCH</span>;
      case 'SSE':
        return <span className="px-2 py-0.5 rounded text-[11px] font-mono font-bold bg-cyan-500/15 text-cyan-600 dark:text-cyan-400 border border-cyan-500/30">SSE</span>;
      default:
        return null;
    }
  };

  const categories = ['ALL', 'Products', 'AI & Strategies', 'Governance', 'System & Telemetry'];
  const filteredEndpoints = ENDPOINTS.filter(ep => {
    if (filterCategory === 'ALL') return true;
    return ep.category === filterCategory;
  });

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      {/* Top Description Banner */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-5 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-indigo-600/10 text-indigo-600 dark:text-indigo-400 flex items-center justify-center font-bold">
              <Terminal className="w-4 h-4" />
            </div>
            <h2 className="font-bold text-base text-slate-900 dark:text-white">
              Interactive API Explorer &amp; Request Playground
            </h2>
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400 font-mono mt-1">
            Send real live HTTP REST and SSE requests to <code>http://localhost:8080</code> with instant telemetry breakdown
          </p>
        </div>

        {/* Category Filter Tabs */}
        <div className="flex items-center gap-1.5 flex-wrap bg-slate-100 dark:bg-slate-950 p-1 rounded-xl border border-slate-200 dark:border-slate-800 text-xs font-mono">
          {categories.map(cat => (
            <button
              key={cat}
              onClick={() => setFilterCategory(cat)}
              className={`px-3 py-1 rounded-lg transition-all ${
                filterCategory === cat
                  ? 'bg-indigo-600 text-white font-semibold shadow-xs'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      {/* Main Split Console: Left Sidebar List / Right Request-Response Cockpit */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left: Endpoint Navigator (4 cols) */}
        <div className="lg:col-span-4 space-y-2">
          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-3 shadow-xs max-h-[750px] overflow-y-auto space-y-1.5">
            <div className="text-[10.5px] font-mono uppercase tracking-wider text-slate-400 font-semibold px-3 py-1">
              Available Routes ({filteredEndpoints.length})
            </div>
            {filteredEndpoints.map(ep => {
              const isSelected = selectedEndpoint.id === ep.id;
              return (
                <button
                  key={ep.id}
                  onClick={() => handleSelectEndpoint(ep)}
                  className={`w-full text-left p-3 rounded-xl transition-all border flex items-start gap-2.5 ${
                    isSelected
                      ? 'bg-indigo-50/70 dark:bg-indigo-950/40 border-indigo-500/40 shadow-xs'
                      : 'bg-slate-50/50 dark:bg-slate-950/40 border-transparent hover:border-slate-200 dark:hover:border-slate-800'
                  }`}
                >
                  <div className="shrink-0 mt-0.5">{getMethodBadge(ep.method)}</div>
                  <div className="overflow-hidden">
                    <div className="font-mono text-xs font-semibold text-slate-900 dark:text-white truncate">
                      {ep.path}
                    </div>
                    <div className="text-[11px] text-slate-500 dark:text-slate-400 line-clamp-1 mt-0.5">
                      {ep.description}
                    </div>
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* Right: Interactive Request & Response Workbench (8 cols) */}
        <div className="lg:col-span-8 space-y-5">
          {/* 1. Request Builder Box */}
          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-5 shadow-xs space-y-4">
            {/* Header URL Bar */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-200 dark:border-slate-800">
              <div className="flex items-center gap-2 flex-wrap">
                {getMethodBadge(selectedEndpoint.method)}
                <span className="font-mono font-bold text-sm text-slate-900 dark:text-white">
                  http://localhost:8080{selectedEndpoint.path}
                </span>
              </div>
              <button
                onClick={handleExecuteRequest}
                disabled={isLoading}
                className="flex items-center justify-center gap-2 px-5 py-2 rounded-xl text-xs font-mono font-bold bg-indigo-600 hover:bg-indigo-500 text-white shadow-sm shadow-indigo-600/30 transition-all disabled:opacity-50"
              >
                {isLoading ? (
                  <>
                    <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                    <span>Executing...</span>
                  </>
                ) : (
                  <>
                    <Send className="w-3.5 h-3.5" />
                    <span>Send Request</span>
                  </>
                )}
              </button>
            </div>

            <p className="text-xs text-slate-600 dark:text-slate-300 font-sans">
              {selectedEndpoint.description}
            </p>

            {/* Path / Query Parameters */}
            {selectedEndpoint.defaultParams && Object.keys(selectedEndpoint.defaultParams).length > 0 && (
              <div className="space-y-2 pt-2">
                <div className="text-[11px] font-mono uppercase tracking-wider text-slate-400 font-semibold">
                  Parameters &amp; Path Variables
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  {Object.keys(selectedEndpoint.defaultParams).map(k => (
                    <div key={k} className="flex items-center bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl px-3 py-1.5">
                      <span className="font-mono text-xs text-slate-400 mr-2">{k}:</span>
                      <input
                        type="text"
                        value={params[k] ?? ''}
                        onChange={e => setParams({ ...params, [k]: e.target.value })}
                        className="w-full bg-transparent font-mono text-xs text-slate-900 dark:text-white focus:outline-none"
                      />
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* JSON Request Body (For POST / PATCH) */}
            {(selectedEndpoint.method === 'POST' || selectedEndpoint.method === 'PATCH') && (
              <div className="space-y-2 pt-2">
                <div className="flex items-center justify-between text-[11px] font-mono uppercase tracking-wider text-slate-400 font-semibold">
                  <span>Request Payload (JSON Body)</span>
                  <span className="text-indigo-500 text-[10px]">application/json</span>
                </div>
                <textarea
                  rows={5}
                  value={bodyText}
                  onChange={e => setBodyText(e.target.value)}
                  className="w-full p-3 font-mono text-xs bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl focus:outline-none focus:border-indigo-500 text-slate-900 dark:text-white leading-relaxed"
                  placeholder="{}"
                />
              </div>
            )}
          </div>

          {/* 2. Response Inspector Box */}
          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs overflow-hidden">
            {/* Response Toolbar */}
            <div className="p-4 border-b border-slate-200 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-950/40 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <span className="text-xs font-mono font-bold text-slate-900 dark:text-white">
                  Response Telemetry
                </span>
                {responseStatus !== null && (
                  <span className={`px-2.5 py-0.5 rounded-full text-xs font-mono font-bold border ${
                    responseStatus >= 200 && responseStatus < 300
                      ? 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border-emerald-500/30'
                      : 'bg-rose-500/15 text-rose-600 dark:text-rose-400 border-rose-500/30'
                  }`}>
                    {responseStatus === 0 ? 'Network Error' : `${responseStatus} ${responseStatus === 200 ? 'OK' : responseStatus === 201 ? 'CREATED' : ''}`}
                  </span>
                )}
                {latencyMs !== null && (
                  <span className="flex items-center gap-1 text-xs font-mono text-slate-400">
                    <Clock className="w-3 h-3 text-indigo-500" />
                    <span>{latencyMs} ms</span>
                  </span>
                )}
              </div>

              {(responseData || streamChunks.length > 0) && (
                <button
                  onClick={handleCopyResponse}
                  className="flex items-center gap-1.5 text-xs font-mono text-slate-500 hover:text-slate-900 dark:hover:text-white px-2.5 py-1 rounded-lg border border-slate-200 dark:border-slate-800 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                >
                  {copied ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>{copied ? 'Copied' : 'Copy JSON'}</span>
                </button>
              )}
            </div>

            {/* Response Content Viewer */}
            <div className="p-4 bg-slate-50 dark:bg-slate-950/90 min-h-[220px] max-h-[480px] overflow-y-auto">
              {isLoading && (
                <div className="flex flex-col items-center justify-center py-12 text-slate-400 space-y-2">
                  <RefreshCw className="w-6 h-6 animate-spin text-indigo-500" />
                  <span className="text-xs font-mono">Awaiting response from backend on localhost:8080...</span>
                </div>
              )}

              {!isLoading && !responseData && streamChunks.length === 0 && (
                <div className="flex flex-col items-center justify-center py-12 text-slate-400 space-y-2">
                  <Code2 className="w-8 h-8 text-slate-300 dark:text-slate-700" />
                  <span className="text-xs font-mono">Click "Send Request" to execute this endpoint.</span>
                </div>
              )}

              {/* Streaming token display */}
              {!isLoading && selectedEndpoint.isStream && streamChunks.length > 0 && (
                <div className="space-y-1 font-mono text-xs">
                  <div className="text-[10px] text-cyan-400 font-bold uppercase tracking-wider flex items-center gap-1 pb-2">
                    <Radio className="w-3 h-3 animate-pulse" />
                    <span>Live SSE Token Stream ({streamChunks.length} chunks)</span>
                  </div>
                  <div className="p-3 bg-slate-900 text-slate-200 rounded-xl border border-slate-800 whitespace-pre-wrap leading-relaxed">
                    {streamChunks.join('')}
                  </div>
                </div>
              )}

              {/* JSON response viewer */}
              {!isLoading && responseData && (
                <pre className="font-mono text-xs text-slate-800 dark:text-slate-200 leading-relaxed overflow-x-auto">
                  {JSON.stringify(responseData, null, 2)}
                </pre>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

