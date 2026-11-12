# AutoBid Pro UML State Machine Diagrams

This document formalizes the lifecycle state transitions enforced by the domain state machines across Vehicles, Auctions, and Bids.

---

## 1. Vehicle Lifecycle State Machine

Enforced by `vehicleStateMachine.js` with role-based access validation.

```mermaid
stateDiagram-v2
    [*] --> DRAFT : Seller creates listing

    DRAFT --> SUBMITTED : Seller submits listing
    DRAFT --> ARCHIVED : Seller deletes draft

    SUBMITTED --> UNDER_REVIEW : Curator accepts intake
    SUBMITTED --> DRAFT : Curator rejects submission

    UNDER_REVIEW --> INSPECTION : Curator orders 150-pt inspection
    UNDER_REVIEW --> APPROVED : Curator approves without inspection
    UNDER_REVIEW --> DRAFT : Curator requests modifications

    INSPECTION --> APPROVED : Inspection score >= 8.5/10
    INSPECTION --> UNDER_REVIEW : Further diagnostics requested
    INSPECTION --> DRAFT : Failed structural/frame check

    APPROVED --> SCHEDULED : Auction date & reserve configured
    APPROVED --> DRAFT : Seller withdraws approval

    SCHEDULED --> LIVE : Authoritative startTime arrives
    SCHEDULED --> APPROVED : Admin postpones start

    LIVE --> SOLD : Auction ends & reserve met
    LIVE --> UNSOLD : Auction ends & reserve not met

    SOLD --> PAYMENT_PENDING : Winning bidder declared
    UNSOLD --> APPROVED : Relist with revised reserve
    UNSOLD --> ARCHIVED : Listing retired

    PAYMENT_PENDING --> COMPLETED : Escrow wire settled & title transferred
    PAYMENT_PENDING --> UNSOLD : Bidder default (deposit forfeited)

    COMPLETED --> ARCHIVED : Historical record archived
    ARCHIVED --> [*]
```

---

## 2. Auction Lifecycle State Machine

Enforced by `auctionWorker.js` and `biddingService.js`.

```mermaid
stateDiagram-v2
    [*] --> DRAFT : Initial creation

    DRAFT --> SCHEDULED : Start/End time & reserve configured

    SCHEDULED --> LIVE : Clock reaches startTime
    SCHEDULED --> CANCELLED : Cancelled before start

    LIVE --> EXTENDED : Bid received in final 120s (+120s soft close)
    EXTENDED --> EXTENDED : Late counter-bid received (up to 10 max)
    EXTENDED --> LIVE : Timer > 120s remaining

    LIVE --> ENDED : Clock reaches endTime (no pending bids)
    EXTENDED --> ENDED : Final extended timer elapses

    ENDED --> SOLD : Current highest bid >= reservePrice
    ENDED --> UNSOLD : Reserve not met

    LIVE --> CANCELLED : Emergency admin cancellation
    SCHEDULED --> CANCELLED : Pre-launch cancellation

    SOLD --> [*]
    UNSOLD --> [*]
    CANCELLED --> [*]
```

---

## 3. Bid Status State Machine

Tracks individual bid lifecycles inside `bids` database table.

```mermaid
stateDiagram-v2
    [*] --> ACTIVE : Authorized bid placed

    ACTIVE --> OUTBID : Higher bid or proxy placed
    ACTIVE --> WINNING : Highest bid at live auction close
    ACTIVE --> REJECTED : Concurrency conflict or failure

    OUTBID --> [*] : Recorded in audit log
    REJECTED --> [*] : Transaction rolled back

    WINNING --> WON : Escrow settlement completed
    WINNING --> CANCELLED : Bidder settlement default (48h expiry)

    WON --> [*] : Vehicle awarded
    CANCELLED --> [*] : Secondary bidder offered buy-it-now
```

