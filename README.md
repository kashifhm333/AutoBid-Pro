# 🏎️ AutoBid Pro — Enterprise Automobile Auction & Bidding Marketplace

[![Node.js](https://img.shields.io/badge/Node.js-22_LTS_(ESM)-339933?logo=node.js&logoColor=white)](https://nodejs.org/)
[![Pure JavaScript](https://img.shields.io/badge/Language-Pure_JavaScript-F7DF1E?logo=javascript&logoColor=black)](https://developer.mozilla.org/en-US/docs/Web/JavaScript)
[![React](https://img.shields.io/badge/React-18.3_Vite_6-61DAFB?logo=react&logoColor=black)](https://react.dev/)
[![PostgreSQL](https://img.shields.io/badge/Database-PostgreSQL_16-4169E1?logo=postgresql&logoColor=white)](https://www.postgresql.org/)
[![Redis](https://img.shields.io/badge/Cache-Redis_7-DC382D?logo=redis&logoColor=white)](https://redis.io/)
[![Socket.IO](https://img.shields.io/badge/Real--Time-Socket.IO_4.8-010101?logo=socket.io&logoColor=white)](https://socket.io/)
[![Docker](https://img.shields.io/badge/Containers-Docker_Compose-2496ED?logo=docker&logoColor=white)](https://www.docker.com/)
[![Security](https://img.shields.io/badge/Security-OWASP_ASVS_Level_2-brightgreen?logo=owasp&logoColor=white)](docs/security/asvs_security_audit.md)

**AutoBid Pro** is a production-grade, full-stack online car auction and real-time bidding platform engineered for high-value classic, collector, exotic, and luxury automobiles.

Authored strictly in **Pure Modern JavaScript (ECMAScript 2024+ / Node.js 22 LTS with native ES Modules `"type": "module"`)** and modern React JSX, the platform delivers the architecture, security, and concurrency controls demanded by serious commercial marketplace platforms.

---

## 📑 Table of Contents

- [The Problems It Solves](#-the-problems-it-solves)
- [Key Features](#-key-features)
- [System Architecture](#-system-architecture)
- [Monorepo Directory Structure](#-monorepo-directory-structure)
- [Prerequisites](#-prerequisites)
- [How to Run](#-how-to-run)
  - [Option 1: One-Command Docker Compose (Recommended)](#option-1-one-command-docker-compose-recommended)
  - [Option 2: Local Development Setup](#option-2-local-development-setup)
- [Pre-Configured Demo Accounts](#-pre-configured-demo-accounts)
- [Testing & Quality Assurance](#-testing--quality-assurance)
- [Core API Routes](#-core-api-routes)
- [Security & Compliance](#-security--compliance)

---

## 🎯 The Problems It Solves

Commercial automotive auction platforms face acute technical and operational hurdles that trivial CRUD systems cannot handle:

1. **The Bidding Concurrency Race Condition**:
   - *Problem*: High-frequency competing bids arriving at the exact same millisecond cause dirty reads, duplicate winning prices, and phantom outbids.
   - *Solution*: PostgreSQL **pessimistic row-level locking (`SELECT ... FOR UPDATE`)** inside an ACID transaction on the auction record, strictly serializing bids and enforcing monotonic increment ladders.
2. **The Last-Second Sniper Bot Attack**:
   - *Problem*: Automated bots submit bids milliseconds before auction close, denying human bidders a fair opportunity to react.
   - *Solution*: **Anti-Sniping Dynamic Soft Close**. Any valid bid placed within the final 120 seconds automatically extends the auction deadline by 120 seconds (up to 10 extensions), immediately broadcasting `auction:extended` to all active clients.
3. **Global Client Clock Drift**:
   - *Problem*: End-user system clocks regularly drift by seconds or minutes from true UTC epoch, causing premature or delayed countdown expirations on client UIs.
   - *Solution*: Authoritative server NTP-style handshake (`timer:sync`), calculating client-to-server offset ($\Delta t = T_{\text{server}} - T_{\text{client}}$) for synchronized millisecond countdown timers.
4. **Bidder Default & Non-Performance**:
   - *Problem*: Winning bidders failing to settle invoices after high-stakes auctions.
   - *Solution*: **$500 Pre-Authorization Hold Model**. Bidders establish an authorized hold (`capture_method: manual`) via Stripe prior to bidding. Unused holds release automatically upon auction closure.
5. **Cardholder Data Risk & PCI Liability**:
   - *Problem*: Storing raw card data introduces severe legal, regulatory, and security liabilities.
   - *Solution*: **PCI-DSS SAQ-A Compliance**. Zero raw cardholder numbers or CVVs touch application servers. All payments utilize client-side tokenization, and webhooks are cryptographically validated via HMAC SHA-256 signatures with database deduplication.
6. **Condition Ambiguity & Fraudulent Listings**:
   - *Problem*: Unreported bodywork damage and undocumented mechanical faults.
   - *Solution*: **Interactive 2D Damage Coordinate Hotspots** (`xCoord`, `yCoord`, severity, and photos) mapped onto vehicle silhouettes, paired with a mandatory 11-step vehicle lifecycle finite state machine.

---

## ✨ Key Features

- 🏎️ **Real-Time Bidding Gateway**: Instant bid broadcasting and outbid alerts via Socket.IO clustered through Redis Pub/Sub (`@socket.io/redis-adapter`).
- 🤖 **Proxy (Auto) Bidding Engine**: Bidders set private maximum ceilings; the system automatically places the minimum necessary counter-bid whenever challenged.
- ⏱️ **Anti-Sniping Soft Closes**: Configurable extension windows (+120s) with real-time UI synchronized updates.
- 🛡️ **11 Platform User Roles (Granular RBAC)**: Dual-guard authorization (`requireRole`, `requirePermission`) spanning Super Admin, Admin, Auction Manager, Inspector, Dealer, Seller, Buyer, Escrow Agent, Transport Partner, Detailer, and Support Agent.
- 🔍 **Vehicle Curation & Lifecycle FSM**: 11 validated status transitions (`DRAFT` $\rightarrow$ `SUBMITTED` $\rightarrow$ `UNDER_REVIEW` $\rightarrow$ `APPROVED` $\rightarrow$ `SCHEDULED` $\rightarrow$ `LIVE` $\rightarrow$ `EXTENDED` $\rightarrow$ `ENDED` $\rightarrow$ `SOLD` $\rightarrow$ `COMPLETED` $\rightarrow$ `CANCELLED`).
- 📍 **2D Damage Hotspot Inspection Mapping**: Coordinate-based inspection reports mapping exterior chips, scratches, and mechanical ratings.
- 💳 **PCI-DSS SAQ-A Financials**: Tiered 5% buyer's premium calculation bounded by a **$500 floor** and **$5,000 cap**, generating immutable `INV-YYYYMMDD-XXXX` invoices.
- 📜 **Immutable Governance Audit Trails**: Atomic recording of `AdminAction` and `AuditLog` records storing JSON state diffs (`previousStatus`, `newStatus`, `reason`).
- 🎨 **Dark Luxury Automotive UI**: Bespoke Obsidian (`#080B11`), Electric Amber (`#F59E0B`), and Racing Emerald (`#10B981`) aesthetic designed for high data density.
- 📦 **Multi-Stage Containerization**: Minimal Alpine images running unprivileged `node` users with `dumb-init` PID 1 signal supervisors.

---

## 🏗️ System Architecture

```
                                  ┌───────────────────────────┐
                                  │   React 18 SPA (Vite 6)   │
                                  │   Dark Luxury Automotive  │
                                  └─────────────┬─────────────┘
                                                │ HTTP / WSS
                                                ▼
                                  ┌───────────────────────────┐
                                  │    Nginx 1.27 (Alpine)    │
                                  │  SPA Fallback + Gzip/Cache│
                                  └─────────────┬─────────────┘
                                                │ Reverse Proxy
                                                ▼
┌─────────────────────────────────────────────────────────────────────────────────────────────┐
│                             Express 4.21 Modular Monolith (ESM)                             │
├──────────────────┬──────────────────┬──────────────────┬──────────────────┬─────────────────┤
│   Auth & IAM     │  Vehicles & FSM  │  Auctions & Soft │  Bidding Engine  │  Stripe SAQ-A   │
│  Rotating Tokens │ 2D Hotspot Insp. │   Anti-Sniping   │ Pessimistic Lock │ HMAC Webhooks   │
└────────┬─────────┴────────┬─────────┴────────┬─────────┴────────┬─────────┴────────┬────────┘
         │                  │                  │                  │                  │
         ▼                  ▼                  ▼                  ▼                  ▼
┌─────────────────────────────────────────────────────────┐  ┌────────────────────────────────┐
│             PostgreSQL 16 Relational DB                 │  │            Redis 7             │
│        (60 Normalized Models / Prisma ORM)              │  │  (Socket.IO PubSub & BullMQ)   │
└─────────────────────────────────────────────────────────┘  └────────────────────────────────┘
```

---

## 📂 Monorepo Directory Structure

```text
Online Bid/
├── apps/
│   ├── api/                               # Backend Express Application (Node.js 22 ESM)
│   │   ├── Dockerfile                     # Multi-stage production container with dumb-init
│   │   ├── prisma/
│   │   │   ├── schema.prisma              # 60-model comprehensive normalized schema
│   │   │   └── seed.js                    # Enterprise seeder (supercars, roles, auctions)
│   │   ├── src/
│   │   │   ├── config/                    # Database, Redis, Logger (Pino), Env (Zod)
│   │   │   ├── errors/                    # Standardized AppError taxonomy
│   │   │   ├── middlewares/               # Authenticate, Authorize, RateLimiter, Logger
│   │   │   ├── modules/
│   │   │   │   ├── admin/                 # AdminService, AdminController, AdminRoutes
│   │   │   │   ├── auctions/              # AuctionService, AuctionController, Routes
│   │   │   │   ├── auth/                  # AuthService, TokenService, AuthController
│   │   │   │   ├── bidding/               # BiddingService (Row-Locks), ProxyBidding
│   │   │   │   ├── inspections/           # InspectionService (2D Damage Hotspots)
│   │   │   │   ├── payments/              # PaymentService, PaymentAdapter, Invoicing
│   │   │   │   ├── users/                 # UserService, Profile management
│   │   │   │   └── vehicles/              # VehicleService, VehicleStateMachine (11 states)
│   │   │   ├── realtime/                  # SocketServer (Redis adapter, rooms, timer sync)
│   │   │   ├── workers/                   # BullMQ Auction Worker & 10s database sweeper
│   │   │   ├── app.js                     # Express app configuration & route mounting
│   │   │   └── server.js                  # HTTP & WebSocket initialization & graceful shutdown
│   │   └── test/                          # Comprehensive Vitest test suite (40 tests)
│   │       ├── admin.test.js              # Super Admin protection & curation tests
│   │       ├── concurrency.test.js        # High-concurrency serialized row-locking tests
│   │       ├── domain.test.js             # FSM transitions & anti-sniping formulas
│   │       ├── e2e.test.js                # Full marketplace lifecycle integration test
│   │       ├── foundation.test.js         # Token crypto & validation schemas
│   │       ├── payments.test.js           # Buyer premium tiers & HMAC webhook checks
│   │       └── realtime.test.js           # Clock-drift sync & room segregation
│   │
│   └── web/                               # Frontend Single Page Application (React 18)
│       ├── Dockerfile                     # Multi-stage container (Node build -> Nginx Alpine)
│       ├── nginx.conf                     # Nginx SPA fallback, security headers, gzip
│       ├── index.html                     # HTML5 entry with Google Fonts
│       └── src/
│           ├── components/
│           │   ├── common/                # Button, Badge, Card, PriceDisplay, Header, Footer
│           │   └── auction/               # AuctionTimer (drift-aware), VehicleCard, BidPanel
│           ├── context/                   # AuthContext, SocketContext
│           ├── pages/                     # Home, Catalog, AuctionDetails, Dashboards, Auth
│           ├── App.jsx                    # Route switch & layout shell
│           ├── index.css                  # Tailored Dark Luxury Automotive styling
│           └── main.jsx                   # React DOM root mounting
│
├── packages/
│   ├── config/                            # Shared constants, fee ladders, roles, statuses
│   │   └── src/index.js
│   └── validation/                        # Isomorphic Zod runtime schemas
│       └── src/index.js
│
├── docs/                                  # Full Platform Technical Documentation
│   ├── architecture/
│   │   └── system_architecture.md         # Comprehensive architecture & C4 diagrams
│   ├── database/
│   │   └── database_architecture.md       # 60-model ERD, indexing, table catalog
│   ├── operations/
│   │   └── operational_runbook.md         # Deployment, backup/restore (RPO/RTO), incidents
│   └── security/
│       └── asvs_security_audit.md         # OWASP ASVS Level 2 verification audit
│
├── .github/
│   └── workflows/
│       └── ci.yml                         # Automated CI/CD pipeline (tests, build, Docker)
├── .env.example                           # Documented environment variables template
├── docker-compose.yml                     # Multi-service container orchestration
└── package.json                           # Root monorepo workspace configuration
```

---

## 📋 Prerequisites

To run AutoBid Pro, ensure the following are installed on your host system:

- **Node.js**: `v22.0.0` or higher
- **npm**: `v10.0.0` or higher
- **Docker & Docker Compose**: (Optional, for containerized execution)
- **PostgreSQL**: `v16.0` or higher (If running locally without Docker)
- **Redis**: `v7.0` or higher (If running locally without Docker)

---

## 🚀 How to Run

### Option 1: One-Command Docker Compose (Recommended)

The easiest way to boot the entire stack (PostgreSQL, Redis, API Backend, BullMQ Worker, and Nginx Web Frontend) is with Docker Compose:

```bash
# 1. Clone or navigate to the project directory
cd "/home/kashifhm333/Desktop/Project/Online Bid"

# 2. Copy the environment configuration
cp .env.example .env

# 3. Launch all 5 containerized services with health checks
docker compose up --build
```

#### Accessing the Containerized Services:
- 🌐 **Web Frontend (Nginx)**: [http://localhost:3000](http://localhost:3000)
- 🔌 **API REST Endpoints**: [http://localhost:4000/api/v1](http://localhost:4000/api/v1)
- 🩺 **Health Check Liveness Probe**: [http://localhost:4000/health/live](http://localhost:4000/health/live)
- 🩺 **Health Check Readiness Probe**: [http://localhost:4000/health/ready](http://localhost:4000/health/ready)

To shut down the containers:
```bash
docker compose down
```

---

### Option 2: Local Development Setup

If you prefer to run services natively during active development:

#### 1. Install Monorepo Dependencies
```bash
npm install
```

#### 2. Configure Environment Variables
Create your local `.env` in the root directory (or copy from `.env.example`):
```bash
cp .env.example .env
```
Ensure your local PostgreSQL and Redis instances are running and that `DATABASE_URL` and `REDIS_URL` in `.env` reflect your local credentials.

#### 3. Generate the Prisma Client
```bash
npm run prisma:generate
```

#### 4. Run Database Migrations
```bash
npm run prisma:migrate
```

#### 5. Seed the Database with Supercars & Platform Data
Populate all 11 user roles, iconic supercars (Porsche GT3 RS, Ferrari 488 Pista, Mercedes-AMG Black Series, Ford GT, Shelby GT500), 2D damage inspection hotspots, live auctions, and invoices:
```bash
npm run seed
```

#### 6. Start the Backend API Server
```bash
npm run dev
```
*The API server will listen on `http://localhost:4000` with WebSocket gateway and BullMQ background sweeper active.*

#### 7. Start the Frontend React SPA
Open a separate terminal window and launch Vite:
```bash
npm run dev --workspace=apps/web
```
*The React client will launch at `http://localhost:5173` (or `http://localhost:3000`).*

---

## 👥 Pre-Configured Demo Accounts

The database seeder (`npm run seed`) provisions 11 verified user accounts across all platform roles with the default password: **`Password123!`**

| Platform Role | Demo Email | Access Permissions |
| :--- | :--- | :--- |
| **Super Administrator** | `superadmin@autobidpro.com` | Complete system ownership, user status control, settings registry |
| **Administrator** | `admin@autobidpro.com` | Platform moderation, audit log review, vehicle curation |
| **Auction Manager** | `manager@autobidpro.com` | Auction scheduling, emergency soft-close extension, cancellation |
| **Certified Inspector** | `inspector@autobidpro.com` | Vehicle condition grading, 2D damage coordinate hotspot entry |
| **Prestige Dealer** | `dealer@concoursmotors.com` | Multi-vehicle lot submissions, inventory management |
| **Collector Seller** | `seller@collectorcars.com` | Vehicle draft submissions, reserve price setting, seller dashboard |
| **VIP Buyer (Monaco)** | `buyer1@monacocars.com` | $500 pre-auth deposit hold active, high-value bidding, invoice checkout |
| **Speedhunters Buyer** | `buyer2@speedhunters.com` | Active competitive bidding, proxy bidding configurations |
| **Escrow Agent** | `escrow@autobidescrow.com` | Settlement verification, vehicle title & fund release |
| **Logistics Partner** | `logistics@supercartransport.com` | Vehicle shipping, carrier dispatch, tracking coordination |
| **Support Agent** | `support@autobidpro.com` | User ticket resolution, disputes, inquiry handling |

---

## 🧪 Testing & Quality Assurance

AutoBid Pro maintains a comprehensive test suite covering cryptographic primitives, state transitions, anti-sniping timers, concurrency serialization, and end-to-end integration.

Execute the complete test suite across all monorepo workspaces:
```bash
npm test
```

### Test Suite Breakdown:
- **`apps/api/test/concurrency.test.js`**:
  - Simulates simultaneous parallel bids arriving at the exact same millisecond.
  - Proves PostgreSQL row locks (`SELECT ... FOR UPDATE`) serialize execution, reject conflicting duplicate prices, and enforce monotonic increment ladders.
  - Verifies atomic proxy auto-counter-bids trigger without intermediate race windows.
- **`apps/api/test/e2e.test.js`**:
  - Tests the complete marketplace journey: Registration $\rightarrow$ $500 deposit pre-auth hold $\rightarrow$ 11-step vehicle curation $\rightarrow$ live auction launch $\rightarrow$ anti-sniping soft-close trigger (+120s) $\rightarrow$ reserve verification $\rightarrow$ 5% buyer premium calculation $\rightarrow$ immutable invoice generation.
- **`apps/api/test/payments.test.js`**:
  - Validates buyer premium fee schedule ($500 floor, $5,000 cap), HMAC SHA-256 Stripe webhook signature verification, and idempotency deduplication.
- **`apps/api/test/domain.test.js`**:
  - Enforces the 11-stage vehicle finite state machine matrix and role authorization rules.
- **`apps/api/test/realtime.test.js`**:
  - Verifies Socket.IO room isolation and client clock-drift compensation formulas.
- **`apps/api/test/foundation.test.js`**:
  - Tests JWT token signing/verification, opaque refresh token rotation, and Zod input schemas.
- **`apps/api/test/admin.test.js`**:
  - Tests role guards and verifies the inviolable protection blocking suspension of Super Admin accounts.
- **`apps/web`**:
  - Verifies clean production bundling via Vite build (298 kB JS, 28 kB CSS, 0 errors).

---

## 🌐 Core API Routes

All endpoints are versioned under `/api/v1` and return uniform standardized JSON contracts:

### Identity & Access (`/api/v1/auth`)
- `POST /register` — Register a new buyer or seller account.
- `POST /login` — Authenticate credentials, issue JWT access token, and set rotating refresh cookie.
- `POST /refresh` — Rotate refresh token family and issue new access token.
- `POST /logout` — Invalidate active session and revoke token family.

### Vehicle Inventory (`/api/v1/vehicles`)
- `GET /` — Search and filter vehicles with pagination, make, model, year, and condition.
- `GET /:id` — Retrieve full vehicle specifications, high-res gallery, and inspection report.
- `POST /` — Draft a new vehicle listing (`SELLER`, `DEALER`).
- `PATCH /:id/status` — Advance vehicle through the 11-step state machine.

### Real-Time Auctions (`/api/v1/auctions`)
- `GET /` — List live, scheduled, and completed auctions.
- `GET /:id` — Authoritative auction state, current price, countdown deadline, and bid count.
- `POST /` — Schedule an approved vehicle for auction (`AUCTION_MANAGER`).

### Bidding Engine (`/api/v1/bids`)
- `POST /` — Submit a bid inside a pessimistic row-lock transaction (`SELECT ... FOR UPDATE`).
- `POST /proxy` — Set or update a private maximum proxy auto-bid limit.
- `GET /history/:auctionId` — Retrieve chronological public bidding audit log.

### Payments & Invoicing (`/api/v1/payments`)
- `POST /deposit/hold` — Establish a $500 pre-authorization deposit hold.
- `POST /settlement/checkout` — Generate checkout session for winning bidder (hammer price + 5% premium).
- `POST /webhooks/stripe` — Cryptographically verified HMAC SHA-256 webhook ingestion.

### Administration & Governance (`/api/v1/admin`)
- `GET /overview` — Platform telemetry, total volume, pending approvals, and active auctions.
- `GET /users` — Search users, filter by role/status.
- `PATCH /users/:id/status` — Moderate user (Suspend, Ban, Reactivate) with audit logging.
- `POST /vehicles/:id/curate` — Review submitted vehicle (`APPROVE`, `REJECT`, `REQUEST_CHANGES`).
- `POST /auctions/:id/manage` — Emergency auction control (`EXTEND`, `CANCEL`).
- `GET /audit-logs` — Query immutable administrative state-diff audit logs.

### Observability & System Health (`/health`)
- `GET /health/live` — Kubernetes / Docker liveness probe (Process operational).
- `GET /health/ready` — Readiness probe (Verifies active PostgreSQL and Redis connections).

---

## 🔒 Security & Compliance

AutoBid Pro is engineered against the **OWASP Application Security Verification Standard (ASVS) Version 4.0.3 Level 2**:

- **PCI-DSS SAQ-A**: Zero cardholder data retention on platform servers. All credit card processing is delegated to Stripe Elements; application servers only store tokenized `PaymentIntent` IDs.
- **Race-Condition Immunity**: Concurrency locks on database rows eliminate double-spending, out-of-order bids, or price corruption.
- **Refresh Token Family Rotation**: Immediate revocation of all issued tokens if an already-consumed refresh token is re-submitted (replay attack detection).
- **Super Administrator Immutability**: Embedded code-level guard protecting root accounts from suspension by lower-tier admins.
- **Immutable Audit Logging**: Administrative interventions write structured before-and-after state diffs to `AdminAction` and `AuditLog` records within database transactions.
- **Container Hardening**: Minimal Alpine base images, `dumb-init` PID 1 process supervision, and dropping privileges to an unprivileged `node` user.

*For the complete audit certification and verification matrix, see [docs/security/asvs_security_audit.md](docs/security/asvs_security_audit.md).*

---

## 📜 Architectural Decisions & Runbooks

- 📖 **Architectural Decision Log (32 Decisions)**: [decision_log.md](decision_log.md)
- 📐 **System Architecture & Mermaid Diagrams**: [docs/architecture/system_architecture.md](docs/architecture/system_architecture.md)
- 🗄️ **Database Architecture & ERD**: [docs/database/database_architecture.md](docs/database/database_architecture.md)
- 🛠️ **Operational Runbook & Disaster Recovery**: [docs/operations/operational_runbook.md](docs/operations/operational_runbook.md)
- 🛡️ **OWASP ASVS Level 2 Security Audit**: [docs/security/asvs_security_audit.md](docs/security/asvs_security_audit.md)

---

## 📄 License

This project is licensed under the MIT License.
