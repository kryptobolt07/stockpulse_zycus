import axios from 'axios';
import {
  Product,
  PricingSuggestion,
  ReorderSuggestion,
  DashboardMetrics,
  StrategyConfig,
  Category,
  ProductStatus,
  SuggestionStatus
} from '../types';

const API_BASE = 'http://localhost:8080';

const client = axios.create({
  baseURL: API_BASE,
  headers: {
    'Content-Type': 'application/json',
  },
});

export const api = {
  // Products
  async getProducts(params?: { status?: ProductStatus; category?: Category; search?: string }): Promise<Product[]> {
    const res = await client.get<Product[]>('/products', { params });
    return res.data;
  },

  async getProduct(id: string): Promise<Product> {
    const res = await client.get<Product>(`/products/${id}`);
    return res.data;
  },

  async createProduct(product: Partial<Product>): Promise<Product> {
    const res = await client.post<Product>('/products', product);
    return res.data;
  },

  async updateStock(id: string, stockLevel: number): Promise<Product> {
    const res = await client.patch<Product>(`/products/${id}/stock`, { stockLevel });
    return res.data;
  },

  async simulateOrder(id: string, quantity: number = 1): Promise<Product> {
    const res = await client.post<Product>(`/products/${id}/orders`, { quantity });
    return res.data;
  },

  async suggestPricing(id: string): Promise<PricingSuggestion> {
    const res = await client.post<PricingSuggestion>(`/products/${id}/suggest-pricing`);
    return res.data;
  },

  async suggestReorder(id: string): Promise<ReorderSuggestion> {
    const res = await client.post<ReorderSuggestion>(`/products/${id}/suggest-reorder`);
    return res.data;
  },

  // Pricing Suggestions
  async getPricingSuggestions(params?: { status?: SuggestionStatus; productId?: string }): Promise<PricingSuggestion[]> {
    const res = await client.get<PricingSuggestion[]>('/pricing-suggestions', { params });
    return res.data;
  },

  async decidePricingSuggestion(id: number, decision: 'ACCEPTED' | 'REJECTED'): Promise<PricingSuggestion> {
    const res = await client.patch<PricingSuggestion>(`/pricing-suggestions/${id}`, { status: decision });
    return res.data;
  },

  // Reorder Suggestions
  async getReorderSuggestions(params?: { status?: SuggestionStatus; productId?: string }): Promise<ReorderSuggestion[]> {
    const res = await client.get<ReorderSuggestion[]>('/reorder-suggestions', { params });
    return res.data;
  },

  async decideReorderSuggestion(id: number, decision: 'ACCEPTED' | 'REJECTED'): Promise<ReorderSuggestion> {
    const res = await client.patch<ReorderSuggestion>(`/reorder-suggestions/${id}`, { status: decision });
    return res.data;
  },

  // Analytics & Config
  async getDashboardMetrics(): Promise<DashboardMetrics> {
    const res = await client.get<DashboardMetrics>('/api/analytics/dashboard');
    return res.data;
  },

  async getStrategyConfig(): Promise<StrategyConfig> {
    const res = await client.get<StrategyConfig>('/api/config/strategy');
    return res.data;
  },

  async setStrategyConfig(mode: 'RULE_BASED' | 'AI_POWERED'): Promise<StrategyConfig> {
    const res = await client.post<StrategyConfig>('/api/config/strategy', { mode });
    return res.data;
  },

  async resetDatabase(): Promise<{ message: string }> {
    const res = await client.post<{ message: string }>('/api/seed/reset');
    return res.data;
  },
};
