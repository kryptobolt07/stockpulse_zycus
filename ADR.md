# Architecture Decision Record (ADR)
**Project**: StockPulse — AI Inventory & Dynamic Pricing Engine  
**Author**: Solo Engineer  
**Date**: August 2026  

This document records the key architectural choices made during the development of StockPulse. Every decision follows the format: **Context $\to$ Options $\to$ Decision $\to$ Tradeoffs**.

---

## ADR-1: Placement of Commerce and Replenishment Logic

### Context
In reactive e-commerce architectures, domain operations such as threshold checks, price adjustments, and lead-time calculations frequently get entangled across HTTP controller methods, domain models, and background event listeners. We needed a clean boundary that avoids `ProductService` accumulating pricing rules, replenishment algorithms, AI prompts, and persistence logic into an unmaintainable god-class.

### Options Considered
1. **Rich Domain Model**: Embedding pricing and reorder logic directly inside `Product.java`.
2. **Fat Service Layer**: Placing all mathematical calculations, LLM calls, and trigger logic within `ProductService.java`.
3. **Dedicated Strategy & Commerce Advisor Layer** (Chosen): Extracting calculation logic behind pluggable strategy interfaces (`PricingStrategy`, `ReorderStrategy`, `CommerceAdvisor`), orchestrated by a dedicated `AgenticAdvisorService` and `StrategyRegistry`.

### Decision
We chose **Option 3: Dedicated Strategy & Commerce Advisor Layer**.
- `Product.java` remains a JPA entity with explicit state machine invariants.
- `PricingStrategy` and `ReorderStrategy` encapsulate the math and heuristic logic.
- `CommerceAdvisor` coordinates the generation of recommendations.
- `ProductService` only manages persistence and publishes decoupled lifecycle events.
- Both synchronous on-demand HTTP controllers (`ProductController`) and asynchronous event consumers (`InventoryEventListener`) invoke the exact same advisor interfaces.

### Tradeoffs
- *Cost*: Introduces more interfaces, DTOs (`CategoryContext`, `PricingRecommendation`, `ReorderRecommendation`), and Spring bean wiring.
- *Benefit*: High testability (strategies can be tested in pure isolation without database/Spring context) and zero coupling between persistence and calculation algorithms.

---

## ADR-2: Unified AI Call vs Separate Pricing and Reorder Calls

### Context
When an inventory signal fires (e.g., stock falls below threshold or demand spikes), the system must generate both a `PricingSuggestion` and a `ReorderSuggestion`. We needed to decide whether to query the LLM once with a combined prompt or make two separate HTTP calls to the LLM.

### Options Considered
1. **Two Separate LLM Calls**: One call for dynamic pricing and a second call for replenishment quantity.
2. **Unified LLM Call returning Combined JSON** (Chosen): A single structured prompt that provides holistic inventory telemetry (stock, threshold, run-rate, category velocity benchmark) and expects a JSON payload containing both `pricing` and `reorder` objects.

### Decision
We chose **Option 2: Unified LLM Call with Individual Interface Fallbacks**.
- In e-commerce merchandising, pricing elasticity and replenishment lead time are deeply interdependent. An advisor cannot intelligently price a low-stock item without knowing supplier lead times and reorder batch feasibility.
- A single call halves network latency and API token costs.
- To preserve interface flexibility, `AiCommerceAdvisor` implements both `evaluatePricing` and `evaluateReorder` individually for on-demand single-endpoint requests, while providing `evaluate(product, trigger, context)` for the unified agentic loop.

### Tradeoffs
- *Cost*: If the LLM generates a valid pricing proposal but fails schema validation on the reorder section, the parser must either partially rescue the output or trigger a fallback.
- *Benefit*: 50% lower LLM latency, half the API cost, and commercially coherent reasoning between pricing and replenishment recommendations.

---

## ADR-3: Runtime Strategy Switching Mechanism

### Context
The commerce engine must support switching between deterministic `RULE_BASED` and `AI_POWERED` strategies at runtime without restarting the application or redeploying code. Furthermore, Sprint 2 introduces a third strategy (`CompetitorAwareStrategy`).

### Options Considered
1. **Conditional If/Else in Service**: Checking a boolean property on every request.
2. **Spring `@RefreshScope` / Application Restart**: Triggering property reload via Actuator.
3. **Dynamic Strategy Registry with Atomic Resolution** (Chosen): A dedicated `StrategyRegistry` Spring component that manages active strategy references using `AtomicReference<String>` and exposes runtime mutation via `/api/config/strategy`.

### Decision
We chose **Option 3: Dynamic Strategy Registry**.
- All strategy beans are registered in Spring's application context (`ruleBasedPricingStrategy`, `aiPricingStrategy`, etc.).
- `StrategyRegistry` injects all available implementations and dynamically resolves the active strategy on every call using atomic reference lookups.
- Merchandising teams can toggle between Rule-Based and AI mode on the fly from the UI console or via `POST /api/config/strategy`.
- For Sprint 2, adding `CompetitorAwareStrategy` only requires implementing the `PricingStrategy` interface and adding its identifier to the registry—existing caller code remains untouched (Open-Closed Principle).

### Tradeoffs
- *Cost*: Requires an extra layer of indirection when resolving strategies.
- *Benefit*: Zero downtime switching, instant fallback during LLM outages, and seamless Sprint 2 extensibility.

---

## ADR-4: LLM Failure Handling, Sane Bounds, and Fallback Chain

### Context
LLMs can experience network timeouts, quota limits, JSON formatting errors, or produce absurd hallucinations (e.g., proposing \$0.01 or \$100,000 for a \$50 item). The system must guarantee that background recommendation loops never drop silently and never publish unsafe proposals to merchandisers.

### Options Considered
1. **Fail-Fast & Abort**: Throw exception and drop the recommendation event.
2. **Retry Loop with Exponential Backoff**: Retry the LLM up to 3 times synchronously.
3. **Multi-Tier Defense-in-Depth with Deterministic Fallback** (Chosen):
   - Tier 1: JSON markdown extraction (````json ... ```` cleaner).
   - Tier 2: Sane Bounds Validation (Prices clamped to $[0.3 \times, 3.0 \times]$ current price; reorder quantities clamped to positive integers $\le 50 \times$ threshold; confidence clamped to $[0.0, 1.0]$).
   - Tier 3: Immediate Fallback to `RuleBasedCommerceAdvisor` with transparent audit reason logging.

### Decision
We chose **Option 3: Multi-Tier Defense-in-Depth**.
- If the LLM call times out, returns malformed text, or hallucinates absurd numbers, `AiCommerceAdvisor` intercepts the failure and invokes `RuleBasedCommerceAdvisor`.
- The resulting suggestion is persisted with the reasoning prefixed: `[AI Fallback: reason]`.
- This ensures merchandisers always receive actionable, mathematically grounded proposals even during total AI provider outages.

### Tradeoffs
- *Cost*: Writing additional validator and fallback code.
- *Benefit*: High system resilience, zero silent drops in asynchronous tasks, and protection against catastrophic pricing hallucinations.

---

## ADR-5: Agentic Recommendation Loop Decoupling & Idempotency

### Context
When sales orders arrive via `POST /products/{id}/orders` or stock is updated via `PATCH /products/{id}/stock`, the API caller must receive an immediate HTTP 200 response without waiting for AI prompt construction, LLM roundtrips, or reorder modeling. Additionally, repeated orders on an already low-stock product must not flood the merchandising queue with duplicate pending suggestions.

### Options Considered
1. **Synchronous Invocation**: Calling AI suggestions directly inside `ProductService.updateStock()`.
2. **Scheduled Poller (Cron Job)**: Running a periodic timer every 5 minutes to scan for low stock.
3. **Event-Driven Asynchronous Decoupling with Idempotency Gate** (Chosen):
   - `ProductService` publishes `ProductStockEvent` or `DemandSpikeEvent` via Spring's `ApplicationEventPublisher`.
   - `InventoryEventListener` receives events asynchronously via `@Async` and `@EventListener` on a dedicated thread pool (`StockPulseAsync-`).
   - `AgenticAdvisorService` checks `PricingSuggestionRepository.existsByProductIdAndTriggerReasonAndStatus(...)` to reject duplicate pending requests for the same trigger.

### Decision
We chose **Option 3: Event-Driven Asynchronous Decoupling with Idempotency Gate**.
- The API response time for orders and stock updates remains under 10ms.
- The loop reacts immediately to state changes rather than waiting for a cron interval.
- The idempotency gate prevents suggestion spam while allowing new suggestions once previous proposals have been accepted or rejected.

### Tradeoffs
- *Cost*: Requires asynchronous event handling, transactional boundary management, and thread pool configuration.
- *Benefit*: Sub-10ms API latency, non-blocking AI reasoning, and duplicate prevention.

---

## ADR-6: Extensibility Seams for Sprint 2 & Deliberate Exclusions

### Context
To ensure the system is architected for future expansion without over-engineering Sprint 1, we defined explicit extension seams and deliberate exclusions.

### Code Seams Built for Sprint 2:
1. **Product Entity Extension Fields**: `costPrice`, `marginFloor`, and `supplierId` are already mapped on `Product.java`.
2. **Competitor Strategy Seam**: `StrategyRegistry` allows plugging in `CompetitorAwareStrategy` simply by implementing `PricingStrategy`.
3. **Category Benchmark Context**: `CategoryContext` is passed to all strategies, allowing category-level margin ceilings and velocity comparisons.

### Deliberate Exclusions:
1. **Automated Purchase Order Execution**: Deferred to Sprint 3. In Sprint 1, accepting a reorder suggestion simulates inbound stock receipt and updates inventory, maintaining human oversight.
2. **External Competitor Web Scraping**: Deferred to Sprint 2. Sprint 1 focuses strictly on internal telemetry (stock ratios and demand velocity).
3. **Storefront Checkout & Payment Gateway**: Excluded as specified in the hackathon brief; the focus is the inventory-signal $\to$ AI proposal $\to$ human approval loop.

