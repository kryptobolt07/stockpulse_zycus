export type Category = 'ELECTRONICS' | 'APPAREL' | 'HOME';
export type ProductStatus = 'ACTIVE' | 'PRICE_REVIEW_PENDING' | 'OUT_OF_STOCK';
export type TriggerReason = 'INITIAL' | 'INVENTORY_LOW' | 'DEMAND_SPIKE' | 'MANUAL';
export type ChangeDirection = 'INCREASE' | 'DECREASE' | 'HOLD';
export type SuggestionStatus = 'PENDING' | 'ACCEPTED' | 'REJECTED';
export type ViewMode = 'UNIFIED' | 'GOVERNANCE_EXPANDED' | 'CATALOG_EXPANDED';

export interface Product {
  id: string;
  sku: string;
  name: string;
  category: Category;
  currentPrice: number;
  stockLevel: number;
  reorderThreshold: number;
  demandVelocity: number;
  status: ProductStatus;
  costPrice?: number;
  marginFloor?: number;
  supplierId?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface PricingSuggestion {
  id: number;
  product: Product;
  currentPrice: number;
  recommendedPrice: number;
  changeDirection: ChangeDirection;
  confidence: number;
  reasoning: string;
  status: SuggestionStatus;
  triggerReason: TriggerReason;
  createdAt: string;
  decidedAt?: string;
}

export interface ReorderSuggestion {
  id: number;
  product: Product;
  currentStock: number;
  recommendedQuantity: number;
  suggestedLeadTimeDays: number;
  confidence: number;
  reasoning: string;
  status: SuggestionStatus;
  triggerReason: TriggerReason;
  createdAt: string;
  decidedAt?: string;
}

export interface DashboardMetrics {
  totalProducts: number;
  lowStockCount: number;
  outOfStockCount: number;
  pendingReviewCount: number;
  pendingPricingSuggestions: number;
  pendingReorderSuggestions: number;
  categoryAverages: Record<string, number>;
}

export interface StrategyConfig {
  activeMode: 'RULE_BASED' | 'AI_POWERED';
  availableStrategies: string[];
  message?: string;
}
