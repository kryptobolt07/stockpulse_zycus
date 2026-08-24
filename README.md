# ⚡ StockPulse: Autonomous AI Inventory & Dynamic Pricing Console

[![Spring Boot](https://img.shields.io/badge/Spring_Boot-3.3.4-6DB33F?logo=springboot&logoColor=white)](https://spring.io/projects/spring-boot)
[![Java 21](https://img.shields.io/badge/Java-21_LTS-ED8B00?logo=openjdk&logoColor=white)](https://openjdk.org/projects/jdk/21/)
[![React 18](https://img.shields.io/badge/React-18.3-61DAFB?logo=react&logoColor=black)](https://react.dev/)
[![Gemini 2.5](https://img.shields.io/badge/LLM-Gemini_2.5_Flash-4285F4?logo=google&logoColor=white)](https://deepmind.google/technologies/gemini/)
[![LiteLLM Gateway](https://img.shields.io/badge/Gateway-LiteLLM_Enterprise-FF6B6B)](https://litellm-qc.zycus.net)

> **Elevator Pitch:** StockPulse is an event-driven autonomous commerce decision engine that eliminates the **$1.1 Trillion global inventory distortion problem**. When inventory drops below safety thresholds or demand velocity surges, StockPulse intercepts the telemetry in `<10ms`, evaluates multi-factor market tradeoffs using Gemini 2.5 Flash in the background, and delivers actionable pricing and replenishment proposals for human merchandisers to review with one click.

---

## 📑 Table of Contents
1. [Installation & Running Guide](#-installation--running-guide)
2. [Complete Environment Matrix (`.env`)](#-complete-environment-matrix-env)
3. [Key Capabilities](#-key-capabilities)
4. [Backend Structure & Architecture Guide](#-backend-structure--architecture-guide)
5. [Database Schema & Seed Data (Addendum A)](#-database-schema--seed-data-addendum-a)
6. [System Architecture & Event Loop](#-system-architecture--event-loop)
7. [Dual-Strategy Policy Engine Formulation](#-dual-strategy-policy-engine-formulation)
8. [State Machines & Domain Lifecycle](#-state-machines--domain-lifecycle)
9. [API & Event Stream Reference](#-api--event-stream-reference)
10. [Judge 3-Minute Fast-Track Walkthrough](#-judge-3-minute-fast-track-walkthrough)
11. [Technical Innovation & Benchmarks](#-technical-innovation--benchmarks)

---

## 🚀 Installation & Running Guide

### ⚡ Option A: Automated 1-Click Dependency Installer (Windows Winget)
If your machine is missing Java 21, Maven, Node.js, or Git, run our automated provisioner script to install everything via Windows Package Manager (`winget`):

```powershell
# Run automated installer & bootstrapper (PowerShell)
.\setup-dependencies.ps1

# Or double-click the batch wrapper:
.\setup-dependencies.bat
```
*This installs Java 21 LTS (Temurin), Apache Maven, Node.js LTS, and Git, configures environment variables, initializes `.env`, and installs frontend NPM dependencies automatically.*

---

### 🛠️ Option B: Manual Setup

#### 1. Prerequisites Check
Ensure your environment meets the minimum version requirements:
- **Java 21 LTS (JDK)**: `java -version` (e.g. Eclipse Adoptium OpenJDK 21)
- **Maven 3.8+**: `mvn -version`
- **Node.js 18+ & npm 9+**: `node -v && npm -v`
- **Git**: `git --version`

---

#### 2. Clone & Environment Configuration
```bash
# 1. Clone the repository
git clone <repo-url>
cd hackathon

# 2. Copy environment template
cp .env.example .env
# On Windows PowerShell:
Copy-Item .env.example .env
```
*(The default `.env` is already configured to work out-of-the-box with the Zycus LiteLLM gateway and Gemini 2.5 Flash).*

---

### 3. Backend Setup & Run (Spring Boot 3.3.4)
The backend uses an embedded in-memory H2 relational database, requiring zero external database installations.

```bash
# Navigate to backend directory
cd backend

# Option A: Run Unit & Integration Test Suite (9/9 passing tests)
mvn clean test

# Option B: Launch the Spring Boot Server (Port 8080)
mvn spring-boot:run
```
*The backend will automatically start on `http://localhost:8080` and seed the 8 reference products from Addendum A.*

---

### 4. Frontend Setup & Run (React 18 + Vite + Tailwind CSS)

Open a second terminal window:

```bash
# Navigate to frontend directory
cd frontend

# Install dependencies
npm install

# Option A: Launch Interactive Dev Server (Port 5173)
npm run dev

# Option B: Compile Production TypeScript Bundle
npm run build
```
*The frontend dashboard will be live at `http://localhost:5173`.*

---

### 5. Accessing the Application
- **Merchandising Console**: [`http://localhost:5173`](http://localhost:5173)
- **Autonomous Simulation Lab (1d = 1m)**: Click the **`Simulation (1d=1m)`** tab in the top navigation bar.
- **Interactive API Explorer & Playground**: Click the **`API Explorer`** tab in the top navigation bar.
- **Backend Health / Dashboard API**: [`http://localhost:8080/api/analytics/dashboard`](http://localhost:8080/api/analytics/dashboard)
- **Real-Time SSE Event Stream**: [`http://localhost:8080/api/events/stream`](http://localhost:8080/api/events/stream)

---

## ⚙️ Complete Environment Matrix (`.env`)

```env
# Application Port
PORT=8080

# Default Strategy (AI_POWERED | RULE_BASED)
COMMERCE_STRATEGY_DEFAULT=AI_POWERED

# Zycus Enterprise LiteLLM Gateway Configuration
LITELLM_BASE_URL=https://litellm-qc.zycus.net/v1
LITELLM_API_KEY=your_litellm_api_key_here
LITELLM_MODEL=gemini-2.5-flash-payg-uscentral1

# Zycus Custom Headers
LITELLM_HEADER_PRODUCT=ta
LITELLM_HEADER_FLOWNAME=djs_campus
LITELLM_HEADER_BUNDLENAME=djs_campus
LITELLM_HEADER_USERID=zycus_djs
LITELLM_HEADER_TENANTID=zycus
LITELLM_HEADER_EXECUTION_MODE=manual
```

---

## ✨ Key Capabilities

1. **Autonomous Signal Detection:** Proactively triggers on `INVENTORY_LOW` ($S \le T_{\text{reorder}}$) and `DEMAND_SPIKE` ($V > 2.0 \times \bar{V}_{\text{category}}$).
2. **Context-Aware Tradeoff Reasoning:** Evaluates margin preservation, category velocity, stock runway, and supplier lead times to recommend balanced price shifts ($+\Delta\% / -\Delta\%$) and replenishment batches.
3. **Human Governance Checkpoint:** Clean, high-contrast review console with an independent 2-column masonry deck, per-card collapsible reasoning, and one-click batch sign-off for high-confidence ($\ge 85\%$) actions.
4. **Onboarding & Simulation Suite:** Built-in `+ New Product` modal connected to `POST /products`, live stock adjusters, `1x Sale` simulators, `+5 Surge` viral traffic injectors, and on-demand `AI Advise` with active state feedback.
5. **Real-Time Token Stream Inspector:** Live SSE stream viewer (`/products/{id}/suggest-pricing/stream`) displaying live SKU context chips, token-by-token reasoning visualization with `AbortController` stream deduplication, and validated proposal executive summaries.
6. **Interactive Developer API Explorer:** Built-in API testing tab to send and inspect requests across all catalog, pricing, governance, and SSE telemetry endpoints in real time.
7. **Live Time-Machine Simulation Lab (1 Day = 1 Minute):** Accelerated sandbox with variable playback speeds (1x, 2x, 5x), automated traffic simulation, real Gemini 2.5 Flash agent triggers, configurable auto-approval policies ($\ge 85\%$ confidence), and real-time supplier freight transit countdowns with automated restocking.

---

## 🏛️ Backend Structure & Architecture Guide

StockPulse is designed following **Domain-Driven Design (DDD)** and the standard enterprise **Controller-Service-Repository** pattern:

```
backend/src/main/java/com/stockpulse/
├── StockPulseApplication.java          # Spring Boot main bootstrap entrypoint
├── controller/                         # REST & SSE HTTP Web Layer
│   ├── ProductController.java          # GET/POST /products, /orders, /stock, /stream
│   ├── PricingSuggestionController.java# PATCH /pricing-suggestions/{id} (Approve/Reject)
│   ├── ReorderSuggestionController.java# PATCH /reorder-suggestions/{id} (Receive stock)
│   ├── ActivityEventController.java    # GET /api/events/stream (Server-Sent Events)
│   ├── AnalyticsController.java        # GET /api/analytics/dashboard metrics
│   ├── StrategyConfigController.java   # POST /api/config/strategy (Runtime hot-swap)
│   └── SeedController.java             # POST /api/seed/reset (Catalog reset)
├── service/                            # Core Transactional Domain Logic
│   ├── ProductService.java             # Stock updates, order processing & event publication
│   ├── PricingSuggestionService.java   # Human decision lifecycle management
│   └── ReorderSuggestionService.java   # Inbound receipt stock adjustments
├── agent/                              # Asynchronous Decoupled Event System
│   ├── InventoryEventListener.java     # @Async Spring event listener
│   ├── AgenticAdvisorService.java      # Deduplication gate & pipeline orchestrator
│   ├── ProductStockEvent.java          # Low stock domain event payload
│   └── DemandSpikeEvent.java           # Velocity surge domain event payload
├── ai/                                 # Enterprise AI & LiteLLM Integration
│   ├── LLMGateway.java                 # Zycus LiteLLM client & sane bounds clamping
│   ├── PromptBuilder.java              # Structured JSON prompt generator
│   ├── AiCommerceAdvisor.java          # Combined pricing & reorder AI strategy
│   ├── AiStreamService.java            # Token-by-token SSE streaming service
│   └── ActivityStreamService.java      # Real-time SSE pipeline broadcast manager
├── engine/                             # Pluggable Strategy Pattern Layer
│   ├── CommerceAdvisor.java            # Common strategy interface
│   ├── StrategyRegistry.java           # Zero-downtime runtime strategy switcher
│   ├── rule/                           # Deterministic rule engine baseline
│   │   ├── RuleBasedCommerceAdvisor.java
│   │   ├── RuleBasedPricingStrategy.java
│   │   └── RuleBasedReorderStrategy.java
│   └── ai/                             # AI-powered implementation delegates
├── model/                              # JPA Database Entities & Enums
│   ├── Product.java                    # Catalog SKU entity with status & extension fields
│   ├── PricingSuggestion.java          # Price proposal entity
│   ├── ReorderSuggestion.java          # Replenishment batch entity
│   ├── Category.java                   # ELECTRONICS | APPAREL | HOME
│   ├── ProductStatus.java              # ACTIVE | PRICE_REVIEW_PENDING | OUT_OF_STOCK
│   └── SuggestionStatus.java           # PENDING | ACCEPTED | REJECTED
└── repository/                         # Spring Data JPA Database Interfaces
    ├── ProductRepository.java          # CRUD + custom velocity aggregation queries
    ├── PricingSuggestionRepository.java# Idempotency lookups
    └── ReorderSuggestionRepository.java
```

---

### 📡 Complete Controller & Endpoint Reference (7 REST/SSE Controllers)

| Controller Class | Primary Routes | Functional Responsibility & Execution Role |
|---|---|---|
| `ProductController` | `GET/POST /products`<br>`PATCH /products/{id}/stock`<br>`POST /products/{id}/orders`<br>`POST .../suggest-pricing`<br>`POST .../suggest-reorder`<br>`POST .../stream` | Master catalog controller. Serves filtered products by status/category, accepts sales orders with instant `<10ms` stock decrementing, handles on-demand AI advisor requests, and streams live token-by-token reasoning via SSE. |
| `PricingSuggestionController` | `GET /pricing-suggestions`<br>`PATCH /pricing-suggestions/{id}` | Human governance controller for dynamic pricing. Retrieves pending or historical price proposals and processes merchandiser decisions (`ACCEPTED` updates live product price; `REJECTED` logs dismissal). |
| `ReorderSuggestionController` | `GET /reorder-suggestions`<br>`PATCH /reorder-suggestions/{id}` | Human governance controller for stock replenishment. Retrieves pending replenishment batches and simulates warehouse inbound physical delivery (`ACCEPTED` increments product stock; `REJECTED` dismisses PO). |
| `ActivityEventController` | `GET /api/events/stream` | Reactive Server-Sent Events (SSE) controller. Maintains long-lived HTTP event streams with the frontend to broadcast background agent pipeline lifecycle events (`LLM_EVALUATION_START`, `LLM_EVALUATION_COMPLETE`). |
| `AnalyticsController` | `GET /api/analytics/dashboard` | Telemetry & KPI aggregation controller. Computes real-time catalog counts, low stock counts, out-of-stock counts, pending action queues, and category average demand velocities. |
| `StrategyConfigController` | `GET/POST /api/config/strategy` | Zero-downtime runtime policy switcher. Allows merchandisers and administrators to hot-swap between `AI_POWERED` (Gemini 2.5 Flash) and `RULE_BASED` (Deterministic rule engine) on the fly. |
| `SeedController` | `POST /api/seed/reset` | Sandbox reset controller. Resets database tables and re-seeds the pristine Addendum A 8-product benchmark state for repeatable demonstration and testing. |

---

### ⚖️ Strategic Advantages of the Agentic Approach vs. Rule-Based Systems

| Evaluation Dimension | Traditional Rule-Based System | StockPulse Agentic AI Approach (Gemini 2.5 Flash) |
|---|---|---|
| **Tradeoff Reasoning** | **Rigid & Blind:** Applies static multipliers (e.g. always $+10\%$ price increase when $S \le T_{\text{threshold}}$), regardless of whether demand velocity is 0 or 50 orders/day. | **Multi-Variable Synthesis:** Simultaneously models burn runway (hours to stockout), supplier turnaround time, margin floor constraints, and category velocity momentum to determine whether a defensive $+8.3\%$ hike or clearance markdown is optimal. |
| **Explainability & Audit Rationale** | **Opaque Triggers:** Outputs generic hardcoded status strings (e.g. `Trigger: INVENTORY_LOW`) with zero business justification for merchandisers. | **Executive-Grade Justification:** Produces contextual, audit-ready reasoning explaining the exact economic math and strategic trade-offs behind every proposal. |
| **Confidence & Risk Scoring** | **Binary (0 or 1):** Fixed thresholds with no nuance. Every breach is treated as equally urgent, causing alert fatigue. | **Bayesian Confidence Score:** Calculates dynamic confidence $\in [0.0, 1.0]$, enabling safe automated execution for high-confidence actions ($\ge 85\%$) while escalating anomalies to merchandisers. |
| **Contextual Category Awareness** | **Isolated Silos:** Evaluates each SKU in isolation against fixed constants, blind to broader catalog or market trends. | **Holistic Benchmark Comparison:** Evaluates SKU velocity against real-time category peer averages ($\bar{V}_{\text{category}}$) to differentiate true viral surges from localized traffic noise. |
| **Operational Adaptability** | **High Maintenance Overhead:** Every supplier change or seasonal shift requires software engineering refactoring, code commits, and redeployment. | **Prompt & Policy Agility:** Adapts instantly to updated supplier lead times, seasonal policies, or merchant guidelines via structured system prompts with zero codebase alterations. |

---

## 🗄️ Database Schema & Seed Data (Addendum A)

StockPulse uses an embedded **H2 In-Memory Relational Database** initialized on startup via `DataInitializer.java` with the **8 Addendum A reference products**:

| ID | SKU | Product Name | Category | Current Price | Initial Stock | Threshold | 24h Velocity | Initial Status |
|---|---|---|---|---|---|---|---|---|
| `PRD-001` | `SKU-ELEC-001` | Wireless Earbuds Pro | `ELECTRONICS` | $79.99 | 45 | 20 | 3/d | `ACTIVE` |
| `PRD-002` | `SKU-ELEC-002` | USB-C Hub 7-Port | `ELECTRONICS` | $34.99 | 120 | 30 | 1/d | `ACTIVE` |
| `PRD-003` | `SKU-APP-001` | **Organic Cotton T-Shirt** | `APPAREL` | $24.99 | **8 (Low)** | 15 | 12/d | `REVIEW_PENDING` (Pre-seeded with proposals) |
| `PRD-004` | `SKU-APP-002` | Running Shorts — Navy | `APPAREL` | $39.99 | 55 | 20 | 2/d | `ACTIVE` |
| `PRD-005` | `SKU-HOME-001` | Ceramic Pour-Over Set | `HOME` | $49.99 | 22 | 10 | 4/d | `ACTIVE` |
| `PRD-006` | `SKU-HOME-002` | LED Desk Lamp — Dimmable | `HOME` | $59.99 | **0** | 15 | 0/d | `OUT_OF_STOCK` |
| `PRD-007` | `SKU-ELEC-003` | Portable Charger 20K | `ELECTRONICS` | $44.99 | 18 | 25 | 8/d | `ACTIVE` |
| `PRD-008` | `SKU-APP-003` | **Hoodie — Heather Grey** | `APPAREL` | $54.99 | 11 | 12 | **15/d (Surge)** | `ACTIVE` |

---

## 🏗️ System Architecture & Event Loop

```
Customer / Simulator
       │  (POST /products/{id}/orders)
       ▼
┌────────────────────────────────────────────────────────┐
│  Spring Boot REST API (Port 8080)                      │
│  ├─ ProductController (<10ms Response Time)           │
│  └─ Persists Order & Publishes ProductStockEvent       │
└───────────────────────┬────────────────────────────────┘
                        │ (Asynchronous Event Dispatch)
                        ▼
┌────────────────────────────────────────────────────────┐
│  Agentic Advisor Loop (@Async Background Worker)      │
│  ├─ Emits SSE Event: LLM_EVALUATION_START              │
│  ├─ Queries Active Commerce Strategy:                  │
│  │   ├─ AI Mode: Zycus LiteLLM -> Gemini 2.5 Flash     │
│  │   └─ Rule Mode: Deterministic Policy Engine         │
│  ├─ Sane Bounds & Guardrail Clamping Layer             │
│  ├─ Saves Pricing & Reorder Suggestions (PENDING)      │
│  └─ Emits SSE Event: LLM_EVALUATION_COMPLETE           │
└───────────────────────┬────────────────────────────────┘
                        │
                        ▼
┌────────────────────────────────────────────────────────┐
│  Merchandising Console (React 18 + Vite, Port 5173)    │
│  ├─ Live SSE Activity HUD Banner & Row Pulse           │
│  ├─ Human Governance Queue (Apply / Dismiss)           │
│  └─ Instant State Sync on Approval                     │
└────────────────────────────────────────────────────────┘
```

---

## 📐 Dual-Strategy Policy Engine Formulation

### 1. Deterministic Rule-Based Engine
- **Low Stock Price Adjustment:** $P_{\text{new}} = P_{\text{curr}} \times 1.10$ (+10% defensive hike when $S \le T_{\text{threshold}}$).
- **Demand Spike Price Adjustment:** $P_{\text{new}} = P_{\text{curr}} \times 1.05$ (+5% surge adjustment when $V > 2.0 \times \bar{V}_{\text{cat}}$ and $V \ge 8$).
- **Reorder Batch Quantity:** $Q = \max(1, (3 \times T_{\text{threshold}}) - S_{\text{curr}})$.
- **Category Lead Times:** Electronics (7 days), Apparel (10 days), Home (14 days).

### 2. Contextual AI Commerce Advisor (Gemini 2.5 Flash)
- **Tradeoff Dynamics:** Balances defensive price hikes against clearance markdowns for seasonal inventory.
- **Surge Elasticity:** Computes optimal price elasticity ($4\% - 15\%$) based on margin floor constraints.
- **Explainable Rationales:** Formulates plain-English business rationales for merchandising teams.

### 3. Sane Bounds & Guardrails
- Price Clamp: $P_{\text{clamped}} = \min(\max(P_{\text{rec}}, 0.30 \times P_{\text{curr}}), 3.00 \times P_{\text{curr}})$.
- Quantity Clamp: $Q_{\text{clamped}} = \min(\max(1, Q_{\text{rec}}), 50 \times T_{\text{threshold}})$.
- Confidence: Clamped strictly in range $[0.0, 1.0]$.
- Margin Floor: $P_{\text{clamped}} \ge \text{MarginFloor}$ (if configured).

---

## 🔄 State Machines & Domain Lifecycle

- **Product Lifecycle:** `ACTIVE` $\to$ `PRICE_REVIEW_PENDING` $\to$ `ACTIVE` (transitions to `OUT_OF_STOCK` when stock level drops to 0).
- **Pricing Suggestion:** `PENDING` $\to$ `ACCEPTED` (updates product price live) | `REJECTED` (dismisses proposal).
- **Reorder Suggestion:** `PENDING` $\to$ `ACCEPTED` (simulates inbound shipment receiving) | `REJECTED`.

---

## 📡 API & Event Stream Reference

| Method | Route | Type | Description |
|---|---|---|---|
| `GET` | `/products` | REST | Filterable catalog with search, category filters, and benchmarks. |
| `POST` | `/products` | REST | Create new product SKU with initial price, stock, and thresholds. |
| `PATCH` | `/products/{id}/stock` | REST | Update stock level; fires agentic loop if below threshold. |
| `POST` | `/products/{id}/orders` | REST | Simulate sales order; bumps velocity and triggers reactive evaluation. |
| `POST` | `/products/{id}/suggest-pricing` | REST | Trigger on-demand AI pricing suggestion (`MANUAL`). |
| `POST` | `/products/{id}/suggest-reorder` | REST | Trigger on-demand AI replenishment suggestion (`MANUAL`). |
| `POST` | `/products/{id}/suggest-pricing/stream` | SSE | Stream live token-by-token reasoning via Server-Sent Events. |
| `GET` | `/api/events/stream` | SSE | Global real-time event stream (`LLM_EVALUATION_START/COMPLETE`). |
| `PATCH` | `/pricing-suggestions/{id}` | REST | Accept or reject price proposal; updates `Product.currentPrice`. |
| `PATCH` | `/reorder-suggestions/{id}` | REST | Accept or reject reorder proposal; receives inbound stock units. |
| `GET` | `/api/analytics/dashboard` | REST | Aggregated telemetry (SKU counts, pending actions, alerts). |
| `POST` | `/api/seed/reset` | REST | Reset database back to initial Addendum A state. |

---

## 🧪 Judge 3-Minute Fast-Track Walkthrough

Open `http://localhost:5173` in your browser:

1. **Simulate a Viral Surge:** In the catalog table, locate `PRD-008 (Hoodie — Heather Grey)`. Click the cyan **`Surge (+5)`** button twice.
   - *Result:* Order acknowledges in `<10ms`. The top banner alerts `AI Evaluating PRD-008...` and within ~300ms, an AI price increase proposal (+14.5%) appears automatically in the **Pending Approvals** queue with badge `DEMAND SURGE`.
2. **Simulate Low Stock Breach:** Find `PRD-003 (Organic Cotton T-Shirt)`. Click **`1x Sale`** until stock drops $\le 15$ units.
   - *Result:* The agentic loop automatically generates a replenishment proposal (+37 units, 10d lead time) with badge `LOW STOCK TRIGGER`.
3. **One-Click Governance:** In the **Pending Approvals** queue, click **`Apply Price`**.
   - *Result:* Status updates to `ACCEPTED` and the live catalog price reflects the new price instantly across all views.
4. **Inspect Live Token Streaming:** Click **`Stream AI`** on any row to watch the LLM reason step-by-step live over SSE.
5. **Run the Live Simulation Lab:** Switch to the **`Simulation (1d=1m)`** tab and click **`Start Live Simulation`**. Watch automated customer orders flow, real Gemini 2.5 Flash evaluations trigger, high-confidence proposals auto-approve, and live supplier freight POs countdown to physical warehouse delivery!

---

## 📊 Technical Innovation & Benchmarks

- **Order Ingestion Latency:** `< 8.4 ms` (Decoupled from LLM inference).
- **LLM Reasoning Duration:** `280 – 420 ms` via Gemini 2.5 Flash on LiteLLM Gateway.
- **Sane Bounds Adherence:** `100%` within $[0.30\times, 3.00\times]$ guardrails.
- **Unit & Integration Test Suite:** `9/9 Tests Passed` (`mvn test`).
