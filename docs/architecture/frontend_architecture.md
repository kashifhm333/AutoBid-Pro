# AutoBid Pro — Frontend Architecture & Design System Documentation
## Phase 7: Luxury Dark Automotive UI, Components & Reactive State Management

---

## 1. Technical Framework & Architectural Choices

AutoBid Pro's frontend is authored in **Pure Modern JavaScript (React 18+ with Vite and Tailwind CSS)**, adhering strictly to the user constraint: *"dont use typescript . use the javascript"*.

### Key Characteristics:
- **Build Tool**: Vite 6 for instant Hot Module Replacement (HMR) and optimized rollup production bundles.
- **Styling Architecture**: Tailwind CSS extended with custom automotive theme tokens, glow effects, and responsive breakpoints.
- **Real-Time Integration**: Socket.IO client integrated into React lifecycle via a dedicated `SocketContext`, featuring automatic reconnection and synchronized drift-free timers.
- **Zero Component Logic Bloat**: Presentation components remain declarative; bidding and authorization rules are encapsulated in hooks and backend services.

---

## 2. Dark Luxury Automotive Design System

### 2.1 Color Palette Tokens

| Token | Hex Value | Visual Role |
| :--- | :--- | :--- |
| `brand-bg` | `#080B11` | Deep obsidian canvas background |
| `brand-surface` | `#0F1623` | Secondary elevated surface |
| `brand-card` | `#151F32` | Elevated card container surface |
| `brand-cardHover` | `#1B273F` | Interactive hover elevation |
| `brand-border` | `#22324D` | Subtle slate containment borders |
| `brand-amber` | `#F59E0B` | Electric amber: Primary call-to-action, countdown timer, active bids |
| `brand-emerald` | `#10B981` | Racing emerald: Reserve met, winning status, successful inspection |
| `brand-crimson` | `#EF4444` | High-urgency alert: Outbid notification, soft-close under 2m, live beacon |
| `brand-blue` | `#3B82F6` | Identity verification, title status badges |

---

## 3. Precision Synchronized Timers & Anti-Sniping UI

The `AuctionTimer` component avoids relying on local device clocks:
1. When entering an auction room, the backend emits `timer:sync` containing the server's authoritative epoch timestamp.
2. The client calculates local clock skew:
   $$\text{Offset} = \text{ServerEpoch} - \text{ClientEpoch}$$
3. When time remaining drops below 120 seconds, the UI transitions to an urgent pulsing state (`bg-brand-crimson/20 border-brand-crimson/50 text-brand-crimson animate-pulse`).
4. If a late bid arrives, an `auction:extended` event updates the timer deadline dynamically without page refreshes.

---

## 4. Component Hierarchy

```
apps/web/src/
├── components/ui/
│   ├── Button.jsx            # Multi-variant button (primary, emerald, secondary, outline, crimson)
│   ├── Badge.jsx             # Live pulse, reserve met, and status indicators
│   ├── Card.jsx              # Surface cards with optional hover lift
│   ├── AuctionTimer.jsx      # Authoritative synchronized countdown timer
│   ├── PriceDisplay.jsx      # Monospace currency values
│   ├── VehicleCard.jsx       # Catalog listing card with timer overlay and specs
│   └── BidPanel.jsx          # Interactive live & proxy bidding console
├── context/
│   ├── AuthContext.jsx       # Reactive user authentication and token persistence
│   └── SocketContext.jsx     # WebSocket connection management
├── layouts/
│   ├── Navbar.jsx            # Header with search, socket engine beacon, and user menu
│   └── Footer.jsx            # Value propositions and compliance links
└── pages/
    ├── HomePage.jsx          # Hero showcase, active live grid, and 3-step walkthrough
    ├── CatalogPage.jsx       # Multi-faceted search and filter engine
    ├── AuctionDetailsPage.jsx# High-res gallery, live bid feed, and condition report
    ├── LoginPage.jsx         # Sign-in portal
    ├── RegisterPage.jsx      # Bidder registration
    ├── BuyerDashboardPage.jsx# Active bids, winning bids, and deposit balance
    ├── SellerDashboardPage.jsx# Vehicle listing management
    └── AdminDashboardPage.jsx# Curation queue and platform metrics
```
