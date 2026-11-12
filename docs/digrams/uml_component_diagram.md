# AutoBid Pro UML System Architecture & Component Diagram

This document illustrates the tiered architectural layers of AutoBid Pro, showing component boundaries, communication protocols, security perimeters, and data persistence models.

```mermaid
flowchart TD
    subgraph ClientTier ["1. Presentation & Client Tier"]
        SPA["Vite + React 18 SPA<br/>(Tailwind CSS, Glassmorphic UI)"]
        WSClient["Socket.IO Client<br/>(Real-Time Engine Sync)"]
        StripeElem["Stripe Elements<br/>(PCI-DSS SAQ-A Client Tokenization)"]
    end

    subgraph SecurityPerimeter ["2. Network & Security Perimeter"]
        LB["Reverse Proxy / Nginx / Cloudflare<br/>(TLS 1.3 Termination, DDoS Mitigation)"]
        WAF["WAF & Rate Limiting<br/>(IP-based & Token-Bucket)"]
    end

    subgraph APITier ["3. API Gateway & Middleware Layer (Express ESM)"]
        CorsHelmet["Helmet + CORS + CSP"]
        AuthMiddleware["authenticate.js<br/>(JWT Bearer / httpOnly Cookie)"]
        RbacMiddleware["authorize.js<br/>(requireRole, requirePermission)"]
        ZodValidator["validate.js<br/>(Zod Isomorphic Validation)"]
        PinoLogger["Pino Structured Logger + Request ID"]
    end

    subgraph RealTimeTier ["4. Real-Time Streaming Gateway"]
        SocketServer["Socket.IO Server Engine"]
        AuctionRoom["Room: 'auction:id'<br/>(Live Bids & Viewers)"]
        TimerSync["Authoritative Clock Sync"]
        RedisAdapter["Redis Pub/Sub Socket Adapter<br/>(Horizontal Scale)"]
    end

    subgraph DomainModules ["5. Core Modular Monolith Domains"]
        AuthMod["Auth & Session Module<br/>(Bcrypt, Token Families, Lockouts)"]
        BiddingMod["Bidding Engine<br/>(Pessimistic Locks, Anti-Sniping)"]
        ProxyMod["Proxy Bidding Engine<br/>(Auto Counter-Bids)"]
        VehicleMod["Vehicle State Machine<br/>(12 Status Graph, Vin Decode)"]
        AuctionMod["Auction Controller<br/>(Scheduled, Live, Soft-Close)"]
        InspectionMod["150-Pt Curation Module<br/>(Paint Micrometer, OBD-II)"]
        PaymentMod["Payment & Escrow Module<br/>(Stripe Adapters, Pre-Auth Holds)"]
        AdminMod["Governance Command Center<br/>(Dossier Reviews, Audit Trails)"]
    end

    subgraph WorkersTier ["6. Background Processing & Workers"]
        AuctionWorker["Auction Lifecycle Worker<br/>(Closing, Soft-Close, Winner Declaration)"]
    end

    subgraph PersistenceTier ["7. Data Persistence & External APIs"]
        Postgres[(PostgreSQL 16 Database<br/>Prisma ORM, ACID Transactions)]
        RedisCache[(Redis In-Memory Store<br/>Rate Limits, Pub/Sub, Locks)]
        StripeAPI["Stripe API Gateway<br/>(Pre-Auth Holds, Webhooks, Wire Escrow)"]
    end

    %% Client Connections
    SPA -->|HTTPS REST| LB
    WSClient -->|WSS WebSocket| LB
    StripeElem -.->|Direct Tokenization| StripeAPI

    %% Perimeter to API
    LB --> WAF
    WAF --> CorsHelmet
    CorsHelmet --> PinoLogger
    PinoLogger --> AuthMiddleware
    AuthMiddleware --> RbacMiddleware
    RbacMiddleware --> ZodValidator

    %% API to Domains
    ZodValidator --> AuthMod
    ZodValidator --> BiddingMod
    ZodValidator --> VehicleMod
    ZodValidator --> AuctionMod
    ZodValidator --> InspectionMod
    ZodValidator --> PaymentMod
    ZodValidator --> AdminMod

    %% Real-Time Interconnections
    LB --> SocketServer
    SocketServer --> AuctionRoom
    SocketServer --> TimerSync
    SocketServer <--> RedisAdapter
    RedisAdapter <--> RedisCache

    BiddingMod -.->|Emit Bid Event| SocketServer
    BiddingMod <--> ProxyMod

    %% Worker Connections
    AuctionWorker <--> Postgres
    AuctionWorker -.->|Closeout Event| SocketServer

    %% Persistence Connections
    AuthMod <--> Postgres
    BiddingMod <-->|FOR UPDATE Row Locks| Postgres
    VehicleMod <--> Postgres
    AuctionMod <--> Postgres
    InspectionMod <--> Postgres
    PaymentMod <--> Postgres
    PaymentMod <--> StripeAPI
    AdminMod <--> Postgres

    CorsHelmet <--> RedisCache
```

