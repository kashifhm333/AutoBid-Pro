# AutoBid Pro — Backend Foundation Documentation
## Phase 4: Project Structure, Security Middlewares, Error Contracts & RBAC

---

## 1. Modular Monolith Architecture (Pure JavaScript ESM)

AutoBid Pro's backend runs on **Node.js 22 LTS** utilizing native ES Modules (`"type": "module"`). The backend architecture is strictly decoupled from the presentation and database layers using Clean Architecture principles:

```
apps/api/src/
├── app.js                      # Express application composition & middleware pipeline
├── server.js                   # HTTP server entrypoint & graceful shutdown handlers
├── config/
│   ├── env.js                  # Strongly-typed environment configuration via Zod
│   ├── database.js             # Prisma ORM singleton & database health checks
│   ├── redis.js                # ioredis client singleton & cache health checks
│   └── logger.js               # Structured JSON logger (Pino)
├── errors/
│   ├── AppError.js             # Base operational error class
│   └── index.js                # ValidationError, AuthenticationError, ForbiddenError, etc.
├── middlewares/
│   ├── requestContext.js       # Injects X-Request-ID correlation ID
│   ├── requestLogger.js        # High-performance structured HTTP logging
│   ├── validate.js             # Isomorphic Zod request payload validator
│   ├── authenticate.js         # JWT access token & httpOnly cookie authentication
│   ├── authorize.js            # Granular RBAC and permission guards
│   ├── rateLimiter.js          # Sliding-window rate limiter (Redis + memory fallback)
│   ├── errorHandler.js         # Centralized error response contract formatter
│   └── notFoundHandler.js      # 404 handler for undefined routes
└── modules/
    ├── auth/                   # Authentication, registration, token rotation, sessions
    └── health/                 # Liveness, readiness, and dependency health checks
```

---

## 2. Standardized Error Response Contract

All errors emitted by the API strictly follow the format prescribed in Section 25:

```json
{
  "success": false,
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Request validation failed",
    "details": [
      {
        "field": "email",
        "message": "Invalid email address",
        "rule": "invalid_string"
      }
    ],
    "requestId": "f81d4fae-7dec-11d0-a765-00a0c91e6bf6"
  }
}
```

- **Zero Stack Trace Leaks**: Full stack traces are captured exclusively in secure server-side structured logs.
- **Client Predictability**: Frontend applications and SDKs parse `error.code` to trigger contextual UI notifications or field-level form errors.

---

## 3. Granular RBAC & Authorization Pipeline

Every protected endpoint is guarded by two declarative middlewares:
1. `requireRole(...roles)`: Verifies user membership in specific roles (e.g. `BUYER`, `SELLER`, `AUCTION_MANAGER`).
2. `requirePermission(...permissions)`: Verifies granular permissions (e.g. `vehicles.approve`, `auctions.start`, `bids.create`).
3. `SUPER_ADMINISTRATOR` role inherently satisfies all role and permission assertions.

---

## 4. Token Rotation & Session Lifecycle

- **Access Token**: Short-lived JWT (15-minute expiration) encoding user ID, email, roles, and granular permissions. Signed using HMAC SHA-256.
- **Refresh Token**: High-entropy 40-byte cryptographic random string, stored as a SHA-256 hash in PostgreSQL.
- **Automatic Rotation**: Every call to `POST /api/v1/auth/refresh-token` revokes the used token and issues a new pair.
- **Reuse Detection**: If a previously revoked token is presented, the entire token family is immediately revoked to thwart token theft and session hijacking.
