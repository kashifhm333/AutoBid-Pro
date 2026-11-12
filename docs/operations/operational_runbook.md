# AutoBid Pro — Operational Runbook & Disaster Recovery Plan

**Document Version:** 1.0  
**Target Environment:** Production (Linux / Docker / Kubernetes)  
**Audience:** Site Reliability Engineers (SRE), DevOps Engineers, Platform Administrators  

---

## 1. System Architecture Overview & Components

AutoBid Pro operates as a containerized distributed system comprising:
- **API Pods (`@autobid/api`)**: Node.js 22 LTS Express instances handling REST APIs and Socket.IO real-time bidding rooms.
- **Worker Pods (`@autobid/worker`)**: Standalone BullMQ consumers executing delayed auction expiration checks and email dispatches.
- **Web Frontend (`@autobid/web`)**: Nginx 1.27 Alpine containers delivering fingerprinted static React SPA assets.
- **Data Layer (PostgreSQL 16)**: Primary transactional database with row-locking support and ACID guarantees.
- **Cache & PubSub (Redis 7)**: Distributed session store, Socket.IO multi-pod cluster adapter, and rate-limiting store.

---

## 2. Deployment Procedures

### 2.1 Zero-Downtime Rolling Deployment Checklist
1. **Schema Pre-Migration**:
   ```bash
   # Always execute non-breaking database schema migrations first
   npm run prisma:deploy --workspace=@autobid/api
   ```
2. **Container Build & Tagging**:
   ```bash
   docker compose build --pull
   ```
3. **Rolling Pod Restart**:
   - Update API pods incrementally with maximum surge $25\%$ and maximum unavailable $0\%$.
   - The `/health/ready` probe ensures new pods are accepting traffic before old pods receive `SIGTERM`.
4. **Graceful Connection Draining**:
   - Upon receiving `SIGTERM`, `dumb-init` signals the Node process.
   - The server stops accepting new connections, allows in-flight bids to complete, drains WebSocket clients, disconnects Prisma and Redis, and terminates within 10 seconds.

---

## 3. Database Backup & Disaster Recovery (DR)

### 3.1 Backup Strategy & RPO / RTO Objectives
- **Recovery Point Objective (RPO)**: $\le 5\text{ minutes}$ (Continuous WAL archiving).
- **Recovery Time Objective (RTO)**: $\le 30\text{ minutes}$ (Automated snapshot restoration).

### 3.2 Automated Daily Logical Snapshot
Run automated daily dumps using `pg_dump`:
```bash
#!/bin/bash
TIMESTAMP=$(date +%Y%m%d_%H%M%S)
BACKUP_DIR="/var/backups/postgresql"
DB_NAME="autobid"

mkdir -p "$BACKUP_DIR"

# Perform compressed custom-format backup
pg_dump -h localhost -U autobid_user -Fc -b -v -f "$BACKUP_DIR/${DB_NAME}_${TIMESTAMP}.dump" "$DB_NAME"

# Encrypt and upload to secondary cloud storage
gpg --symmetric --batch --passphrase-file /etc/backup.key "$BACKUP_DIR/${DB_NAME}_${TIMESTAMP}.dump"
aws s3 cp "$BACKUP_DIR/${DB_NAME}_${TIMESTAMP}.dump.gpg" s3://autobid-backups-secure/db/

# Retain local snapshots for 7 days
find "$BACKUP_DIR" -type f -name "*.dump" -mtime +7 -delete
```

### 3.3 Database Restoration Procedure
In the event of database failure or corrupted state:
```bash
# 1. Stop all API and Worker services to prevent writes
docker compose stop api worker

# 2. Re-create clean target database
dropdb -h localhost -U postgres autobid
createdb -h localhost -U postgres -O autobid_user autobid

# 3. Restore from verified snapshot
pg_restore -h localhost -U autobid_user -d autobid -v "/var/backups/postgresql/autobid_TARGET_DATE.dump"

# 4. Verify table row counts and integrity
psql -h localhost -U autobid_user -d autobid -c "SELECT COUNT(*) FROM auctions;"
psql -h localhost -U autobid_user -d autobid -c "SELECT COUNT(*) FROM bids;"

# 5. Restart services
docker compose start api worker
```

---

## 4. Redis High Availability & Failover

- **Topology**: Redis Sentinel deployment with 1 Master and 2 Read Replicas.
- **Failover**: If the Master is unreachable for $> 5000\text{ms}$, Sentinel promotes a replica automatically.
- **Client Handling**: `ioredis` is configured with automated reconnection backoff and Sentinel discovery:
  ```javascript
  const redis = new Redis({
    sentinels: [{ host: 'sentinel-1', port: 26379 }, { host: 'sentinel-2', port: 26379 }],
    name: 'autobid-master',
    retryStrategy: (times) => Math.min(times * 100, 3000)
  });
  ```

---

## 5. Incident Response Playbooks

### Playbook 1: High Bidding Lock Contention / Slow Transactions
- **Symptoms**: `POST /api/v1/bids` latency exceeds $500\text{ms}$; elevated transaction duration warnings in Pino logs.
- **Cause**: High volume of competing bids on a viral live auction executing `SELECT ... FOR UPDATE`.
- **Mitigation**:
  1. Inspect active database locks:
     ```sql
     SELECT pid, usename, pg_blocking_pids(pid) AS blocked_by, query, now() - query_start AS duration
     FROM pg_stat_activity
     WHERE wait_event_type = 'Lock';
     ```
  2. If a hanging transaction is holding the lock:
     ```sql
     SELECT pg_terminate_backend(<pid>);
     ```
  3. Ensure auction transactions are confined to $< 20\text{ms}$ execution windows.

### Playbook 2: Anti-Sniping Runaway Extensions
- **Symptoms**: An auction has been extended past normal operating hours due to persistent micro-increments.
- **Guardrail**: The system enforces `max_extensions` (default 10 extensions).
- **Admin Action**:
  - The Auction Manager can trigger `POST /api/v1/admin/auctions/:id/manage` with `{ action: "CANCEL" }` or set an authoritative fixed final deadline.

### Playbook 3: Compromised Account or Token Replay Attack
- **Symptoms**: Warning log: *"Refresh token reuse detected for family [familyId]"*.
- **Automatic Protection**: The system revokes all refresh tokens in that family immediately.
- **Admin Immediate Intervention**:
  ```bash
  # Suspend user and invalidate all active sessions
  curl -X PATCH http://localhost:4000/api/v1/admin/users/<USER_ID>/status \
    -H "Authorization: Bearer <ADMIN_TOKEN>" \
    -H "Content-Type: application/json" \
    -d '{"status": "SUSPENDED", "reason": "Compromised token detection"}'
  ```

### Playbook 4: Stripe Payment Gateway Latency or Outage
- **Symptoms**: Stripe API returns 5xx or connection timeouts during pre-auth deposit holds.
- **Handling**:
  - `PaymentService` catches gateway timeout errors and responds with standard `503 Service Unavailable` (`GATEWAY_TIMEOUT`).
  - Webhooks queued on Stripe are retried with exponential backoff.
  - SRE monitors Stripe Status Dashboard (`status.stripe.com`).

---

## 6. Observability, Telemetry & Health Checks

| Endpoint | Protocol | Purpose | Expected Status |
| :--- | :---: | :--- | :---: |
| `/health/live` | HTTP | Kubernetes liveness probe (Process healthy) | `200 OK` |
| `/health/ready` | HTTP | Readiness probe (PostgreSQL + Redis connected) | `200 OK` |
| `/api/v1/admin/overview` | HTTP | Administrative platform telemetry | `200 OK` |
| `/health` (Web) | HTTP | Nginx static server healthcheck | `200 OK` |
