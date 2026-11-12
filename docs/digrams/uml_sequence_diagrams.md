# AutoBid Pro UML Sequence Diagrams

This document details the critical runtime execution sequences for live real-time bidding, vehicle curation, and financial escrow settlement.

---

## 1. Real-Time Bidding & Anti-Sniping Soft-Close Sequence

Demonstrates sub-millisecond serialized bid processing utilizing PostgreSQL `SELECT ... FOR UPDATE` pessimistic locking, anti-sniping dynamic soft-close extension, automated proxy counter-bidding, and WebSocket multiplexing.

```mermaid
sequenceDiagram
    autonumber
    actor Bidder as Bidder (Client)
    participant WS as WebSocket Gateway (Socket.IO)
    participant BiddingSvc as BiddingService
    participant ProxySvc as ProxyBiddingService
    participant DB as PostgreSQL Database
    participant Redis as Redis Pub/Sub
    actor Room as Auction Room Bidders

    Bidder->>WS: emit('bid:place', { auctionId, amount })
    WS->>WS: Verify socket.user JWT authentication

    WS->>BiddingSvc: placeBid({ auctionId, bidderId, amount })
    BiddingSvc->>DB: BEGIN Transaction

    Note over BiddingSvc,DB: Pessimistic Row Lock (Serialization)
    BiddingSvc->>DB: SELECT * FROM auctions WHERE id = auctionId FOR UPDATE

    BiddingSvc->>BiddingSvc: Check Bidder != Seller
    BiddingSvc->>BiddingSvc: Check Auction is LIVE
    BiddingSvc->>BiddingSvc: Check Deposit Hold ($500 Pre-Auth Active)
    BiddingSvc->>BiddingSvc: Check amount >= currentHighestBid + minIncrement

    alt Time Remaining <= 120s (Anti-Sniping Window)
        BiddingSvc->>BiddingSvc: Calculate newEndTime = endTime + 120s
        BiddingSvc->>BiddingSvc: Set status = 'EXTENDED'
    end

    BiddingSvc->>DB: UPDATE bids SET status = 'OUTBID' WHERE auctionId = id AND status = 'ACTIVE'
    BiddingSvc->>DB: INSERT INTO bids (auctionId, bidderId, amount, status='ACTIVE')
    BiddingSvc->>DB: UPDATE auctions SET currentHighestBid=amount, bidCount=bidCount+1, endTime=newEndTime

    BiddingSvc->>ProxySvc: processProxyCounterBids(tx, auctionId, amount, bidderId)
    alt Competing Proxy Bid Exists
        ProxySvc->>DB: INSERT INTO bids (proxy auto-counter bid)
        ProxySvc->>DB: UPDATE auctions (increment leading bid)
    end

    BiddingSvc->>DB: INSERT INTO audit_logs (action='BID_PLACED')
    BiddingSvc->>DB: COMMIT Transaction

    BiddingSvc-->>WS: Return { bid, auction, isExtended, newEndTime }
    WS-->>Bidder: emit('bid:confirmed', { bidId, amount })

    WS->>Redis: Publish 'auction:bid' event
    Redis-->>WS: Broadcast to cluster
    WS->>Room: emit('bid:new', { bidId, amount, bidderName, isExtended, newEndTime })
```

---

## 2. Vehicle Intake, 150-Point Curation & Auction Launch Sequence

Illustrates the end-to-end seller listing, diagnostic inspection report, administrative curation review, and auction scheduling workflow.

```mermaid
sequenceDiagram
    autonumber
    actor Seller as Seller (Apex Motors)
    participant API as Express API Gateway
    participant VehicleSvc as VehicleService
    participant InspSvc as InspectionService
    actor Inspector as Diagnostic Inspector
    actor Admin as Admin Curator (Mark)
    participant AdminSvc as AdminService
    participant AuctionSvc as AuctionService
    participant DB as PostgreSQL Database

    Seller->>API: POST /api/v1/vehicles (VIN, Specs, Pricing)
    API->>VehicleSvc: createVehicle(sellerId, vehicleData)
    VehicleSvc->>DB: Check VIN uniqueness
    VehicleSvc->>DB: INSERT INTO vehicles (status='DRAFT')
    VehicleSvc-->>Seller: Return Draft Vehicle

    Seller->>API: PATCH /api/v1/vehicles/:id/status (status='SUBMITTED')
    API->>VehicleSvc: transitionStatus(id, 'SUBMITTED', sellerId)
    VehicleSvc->>VehicleSvc: Verify sellerId == vehicle.sellerId
    VehicleSvc->>DB: UPDATE vehicles SET status='SUBMITTED'

    Admin->>API: POST /api/v1/inspections/assign (vehicleId, inspectorId)
    API->>InspSvc: assignInspection(vehicleId, inspectorId)
    InspSvc->>DB: UPDATE vehicles SET status='INSPECTION'
    InspSvc->>DB: INSERT INTO vehicle_inspections (status='ASSIGNED')

    Inspector->>API: POST /api/v1/inspections/:id/submit (150-pt report, paint readings, OBD2)
    API->>InspSvc: submitInspectionReport(id, reportData)
    InspSvc->>DB: UPDATE vehicle_inspections (status='SUBMITTED', overallScore=9.8)
    InspSvc->>DB: UPDATE vehicles SET status='UNDER_REVIEW'

    Admin->>API: POST /api/v1/admin/vehicles/:id/curate (decision='APPROVE')
    API->>AdminSvc: curateVehicle(id, 'APPROVE', notes, adminId)
    AdminSvc->>DB: UPDATE vehicles SET status='APPROVED'

    Admin->>API: POST /api/v1/auctions (vehicleId, startingPrice, reservePrice, startTime, endTime)
    API->>AuctionSvc: createAuction(adminId, userRoles, auctionData)
    AuctionSvc->>AuctionSvc: Verify vehicle.status == 'APPROVED'
    AuctionSvc->>DB: INSERT INTO auctions (status='SCHEDULED')
    AuctionSvc->>DB: UPDATE vehicles SET status='SCHEDULED'
    AuctionSvc-->>Admin: Return Scheduled Auction
```

---

## 3. Pre-Authorization Deposit & Escrow Settlement Sequence

Details the financial transactions, Stripe pre-authorization hold, auction win finalization, capped buyer premium calculation, and escrow transfer.

```mermaid
sequenceDiagram
    autonumber
    actor Winner as Winning Bidder (Alex)
    participant Worker as Auction Closeout Worker
    participant PaymentSvc as PaymentService
    participant Stripe as Stripe Gateway (PCI SAQ-A)
    participant DB as PostgreSQL Database
    actor Seller as Seller (Vehicle Owner)

    Note over Worker: Authoritative End Time Elapsed
    Worker->>DB: SELECT * FROM auctions WHERE endTime <= NOW() AND status='LIVE' FOR UPDATE
    Worker->>DB: SELECT * FROM bids WHERE auctionId=id ORDER BY amount DESC LIMIT 1

    Worker->>DB: INSERT INTO auction_winners (winningBid=$295,000, buyerPremium=$5,000, total=$300,000)
    Worker->>DB: UPDATE auctions SET status='SOLD'
    Worker->>DB: UPDATE vehicles SET status='PAYMENT_PENDING'

    Winner->>PaymentSvc: POST /api/v1/payments/checkout/:auctionId
    PaymentSvc->>PaymentSvc: Verify userId == winner.winnerId
    PaymentSvc->>Stripe: Create PaymentIntent (amount=$300,000, wire/escrow)
    Stripe-->>Winner: Secure Wire & Escrow Instructions

    Winner->>PaymentSvc: Complete Bank Wire Transfer
    Stripe->>PaymentSvc: POST /api/v1/payments/webhooks/stripe (payment_intent.succeeded)
    PaymentSvc->>PaymentSvc: Verify HMAC SHA-256 signature
    PaymentSvc->>DB: UPDATE payments SET status='SUCCEEDED'
    PaymentSvc->>DB: UPDATE auction_winners SET settlementStatus='SETTLED'
    PaymentSvc->>DB: UPDATE vehicles SET status='COMPLETED'

    PaymentSvc->>PaymentSvc: Disburse Seller Proceeds ($295,000 to Seller Escrow)
    PaymentSvc->>PaymentSvc: Retain 5% Capped Fee ($5,000 Platform Commission)
    PaymentSvc->>PaymentSvc: Release $500 Pre-Authorization Hold back to Winner
```

