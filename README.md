# Stellar Financial Audit

A production-ready financial audit platform built on the [Stellar](https://stellar.org) network. It enables compliance teams, fintech developers, and blockchain auditors to ingest, verify, and analyze on-chain payment activity with structured reporting, asynchronous job processing, and rule-based suspicious activity detection.

---

## Table of Contents

- [Overview](#overview)
- [Why Stellar?](#why-stellar)
- [How It Works](#how-it-works)
- [Architecture](#architecture)
- [Tech Stack](#tech-stack)
- [Project Structure](#project-structure)
- [Database Schema](#database-schema)
- [API Reference](#api-reference)
- [Audit Engine](#audit-engine)
- [Middleware Pipeline](#middleware-pipeline)
- [Authentication & Authorization](#authentication--authorization)
- [Async Job Processing](#async-job-processing)
- [Soroban Smart Contracts](#soroban-smart-contracts)
- [Getting Started](#getting-started)
- [Environment Variables](#environment-variables)
- [Running with Docker](#running-with-docker)
- [Running Tests](#running-tests)
- [Seeding the Database](#seeding-the-database)
- [Roadmap](#roadmap)

---

## Overview

Stellar Financial Audit is a backend service that bridges the Stellar blockchain and traditional compliance workflows. It connects to the Stellar Horizon API to fetch transactions for any Stellar account, persists them in a PostgreSQL database, and runs a configurable audit engine that flags suspicious activity across multiple severity levels.

The platform is designed with production concerns in mind:

- **Reliability** — unhandled rejections and uncaught exceptions are caught at the process level and logged before a clean exit
- **Observability** — every HTTP request is tagged with a correlation ID (from the `x-correlation-id` header or auto-generated) and logged with structured JSON via Pino, making it easy to trace requests across distributed systems
- **Security** — all sensitive routes are protected by JWT Bearer token authentication; passwords are hashed with bcrypt; environment variables are validated at startup so the service fails fast on misconfiguration
- **Scalability** — audit jobs are offloaded to a BullMQ queue backed by Redis, so the HTTP layer stays responsive even when processing large transaction sets
- **Extensibility** — the audit rule system is modular; new rules can be added to `auditRules.ts` without touching the engine or worker

---

## Why Stellar?

[Stellar](https://stellar.org) is an open, decentralized blockchain network optimized for fast, low-cost cross-border payments and asset transfers. It is widely used in fintech, remittance, and tokenized asset platforms. Key properties that make it well-suited for financial auditing:

- **Transparent ledger** — every transaction is publicly recorded and queryable via the Horizon REST API
- **Deterministic transaction IDs** — each transaction has a unique, immutable ID tied to its ledger entry, making integrity verification straightforward
- **Rich operation metadata** — transactions carry source account, operation type, asset code, amount, memo, and ledger sequence, providing all the fields needed for compliance analysis
- **Testnet availability** — a fully functional test network mirrors the public network, enabling safe development and testing without real funds

---

## How It Works

The platform follows a simple but robust pipeline:

1. **Ingest** — a client calls `GET /api/transactions/:accountId`. The service queries the Stellar Horizon API for the latest 25 transactions on that account and persists any new ones to PostgreSQL (deduplication is handled by the unique `stellarId` constraint).

2. **Verify** — each transaction record is run through `verifyTransaction()` in `stellarService.ts`, which checks that the record has a valid non-empty ID, a source account string, an amount string, and a numeric ledger value. The result is stored as the `verified` boolean on the `Transaction` model.

3. **Queue** — a client calls `POST /api/audit/run` with an `accountId`. The service immediately creates an `AuditReport` record in `PENDING` status and enqueues a job on the `audit-queue` BullMQ queue, returning HTTP 202 with the pending report.

4. **Process** — the BullMQ worker (`auditWorker.ts`) picks up the job, fetches the transactions for the account from Horizon, runs them through the audit engine, and updates the `AuditReport` record to `COMPLETED` with the findings and summary. If the worker throws at any point, the report is marked `FAILED`.

5. **Report** — a client polls `GET /api/audit/report/:id` to retrieve the final report, including the structured `findings` array and human-readable `summary`.

---

## Architecture

```
Client
  │
  ▼
Express API (src/app.ts)
  ├── Middleware: correlationId → logging → auth → error
  ├── POST /api/auth/register|login
  ├── GET  /api/transactions/:accountId   ──► Stellar Horizon API
  └── POST /api/audit/run                 ──► BullMQ (audit-queue)
      GET  /api/audit/report/:id          ──► PostgreSQL (AuditReport)

BullMQ Worker (src/jobs/auditWorker.ts)
  └── Fetches transactions → Audit Engine → Updates AuditReport in DB
```

The Express API and the BullMQ worker run in the same Node.js process (the worker is imported in `server.ts`). The worker connects to Redis independently of the HTTP layer, so queue processing continues even under HTTP load.

---

## Tech Stack

| Layer        | Technology                        | Notes                                              |
|--------------|-----------------------------------|----------------------------------------------------|
| Runtime      | Node.js 20 + TypeScript 5         | Strict mode, compiled to `dist/`                   |
| Framework    | Express.js 4                      | Minimal, middleware-driven HTTP server             |
| Blockchain   | Stellar SDK v13 (Horizon API)     | Connects to testnet or public Horizon endpoint     |
| Database     | PostgreSQL 15                     | Stores users, transactions, and audit reports      |
| ORM          | Prisma 5                          | Type-safe queries, migrations, and schema management |
| Auth         | JWT (jsonwebtoken)                | 8-hour token expiry, Bearer scheme                 |
| Password     | bcryptjs                          | 10 salt rounds                                     |
| Queue        | BullMQ + IORedis                  | Reliable job queue with failure handling           |
| Logging      | Pino                              | Structured JSON logs, child loggers per request    |
| Contracts    | Soroban (Rust stubs)              | Scaffolded for future on-chain enforcement         |
| Testing      | Jest + ts-jest + Supertest        | Serial test runs to avoid DB conflicts             |
| Containers   | Docker + Docker Compose           | App + PostgreSQL + Redis in one command            |
| Linting      | ESLint (standard-with-typescript) | Enforced code style                                |

---

## Project Structure

```
├── src/
│   ├── app.ts                    # Express app setup, middleware registration, health check
│   ├── server.ts                 # HTTP server entry point, starts worker on boot
│   ├── types.ts                  # Shared TypeScript interfaces (TransactionRecord, JwtUser, AuthRequest)
│   ├── config/
│   │   ├── index.ts              # Validates required env vars at startup, exports typed config
│   │   └── prismaClient.ts       # Prisma singleton to avoid multiple client instances
│   ├── routes/
│   │   ├── index.ts              # Aggregates all routers under /api
│   │   ├── authRoutes.ts         # POST /auth/register, POST /auth/login
│   │   ├── transactionRoutes.ts  # GET /transactions/:accountId (protected)
│   │   └── auditRoutes.ts        # POST /audit/run, GET /audit/report/:id (protected)
│   ├── controllers/
│   │   ├── authController.ts     # Handles register/login, delegates to authService
│   │   ├── transactionController.ts  # Handles transaction fetch, delegates to transactionService
│   │   └── auditController.ts    # Handles audit queue and report retrieval
│   ├── services/
│   │   ├── authService.ts        # User registration, bcrypt hashing, JWT issuance
│   │   ├── transactionService.ts # Fetches from Horizon, deduplicates, persists to DB
│   │   └── auditService.ts       # Creates AuditReport, enqueues job, retrieves report
│   ├── audit/
│   │   ├── auditEngine.ts        # Iterates transactions, applies all rules, builds summary
│   │   └── auditRules.ts         # Individual rule functions returning AuditFinding | null
│   ├── blockchain/
│   │   ├── stellarClient.ts      # Instantiates Horizon Server for testnet or public network
│   │   └── stellarService.ts     # fetchTransactions(), verifyTransaction(), maps raw records
│   ├── jobs/
│   │   ├── queue.ts              # Exports the BullMQ Queue instance (audit-queue)
│   │   └── auditWorker.ts        # Worker: fetches txns → runs engine → updates DB report
│   ├── middleware/
│   │   ├── authMiddleware.ts     # Extracts and verifies JWT Bearer token, attaches user to req
│   │   ├── correlationIdMiddleware.ts  # Reads or generates x-correlation-id per request
│   │   ├── loggingMiddleware.ts  # Logs incoming request and response status with correlation ID
│   │   └── errorMiddleware.ts    # Catches errors from next(err), returns structured JSON
│   └── utils/
│       ├── jwt.ts                # signJwt() and verifyJwt() wrappers around jsonwebtoken
│       └── logger.ts             # Pino logger instance with service name base field
├── prisma/
│   └── schema.prisma             # Defines User, Transaction, AuditReport models and enums
├── contracts/
│   ├── AuditTrail.rs             # Soroban stub: immutable on-chain audit event log
│   ├── AuditValidator.rs         # Soroban stub: on-chain transaction validation
│   └── ComplianceChecker.rs      # Soroban stub: KYC/AML compliance checks
├── tests/
│   ├── auth.test.ts              # Unit tests: JWT sign and verify round-trip
│   ├── audit.test.ts             # Unit tests: audit engine rule evaluation and summary
│   └── stellar.test.ts           # Unit tests: verifyTransaction() valid and invalid records
├── scripts/
│   └── seed.ts                   # Upserts a default ADMIN user into the database
├── Dockerfile                    # Multi-step build: install → compile → run dist/server.js
├── docker-compose.yml            # Orchestrates app, PostgreSQL 15, and Redis 7
└── .env.example                  # Template for all required and optional environment variables
```

---

## Database Schema

The Prisma schema defines three models and two enums. All primary keys use CUIDs for globally unique, URL-safe identifiers.

### `User`

Represents an authenticated platform user. Passwords are never stored in plaintext — only the bcrypt hash is persisted.

| Field          | Type       | Notes                                          |
|----------------|------------|------------------------------------------------|
| `id`           | String     | CUID primary key                               |
| `email`        | String     | Unique — used as the login identifier          |
| `passwordHash` | String     | bcrypt hash with 10 salt rounds                |
| `role`         | UserRole   | `USER` (default) or `ADMIN`                    |
| `createdAt`    | DateTime   | Auto-set on creation                           |
| `updatedAt`    | DateTime   | Auto-updated on every write                    |
| `reports`      | Relation   | One-to-many → AuditReport[]                    |

### `Transaction`

Represents a single Stellar transaction fetched from the Horizon API. The `stellarId` field maps to Horizon's transaction hash and is unique to prevent duplicate ingestion.

| Field           | Type    | Notes                                                        |
|-----------------|---------|--------------------------------------------------------------|
| `id`            | String  | CUID primary key                                             |
| `stellarId`     | String  | Unique Stellar transaction hash from Horizon                 |
| `accountId`     | String  | The Stellar account this transaction was fetched for         |
| `amount`        | String  | Transaction amount as a string (preserves decimal precision) |
| `assetCode`     | String  | Asset code, e.g. `XLM` for native Lumens                    |
| `memo`          | String? | Optional memo field from the transaction                     |
| `sourceAccount` | String  | The Stellar account that originated the transaction          |
| `operationType` | String  | Operation type, e.g. `payment`, `create_account`            |
| `verified`      | Boolean | `true` if the record passed all integrity checks             |
| `rawJson`       | Json    | Full raw Horizon response record for audit trail             |
| `createdAt`     | DateTime| Auto-set on creation                                         |

### `AuditReport`

Represents the result of an audit job for a given Stellar account. Created immediately in `PENDING` status when a job is queued, then updated by the worker on completion or failure.

| Field       | Type        | Notes                                                        |
|-------------|-------------|--------------------------------------------------------------|
| `id`        | String      | CUID primary key                                             |
| `accountId` | String      | The Stellar account that was audited                         |
| `summary`   | String      | Human-readable result, e.g. "3 suspicious item(s) found"    |
| `findings`  | Json        | Array of `AuditFinding` objects (rule, description, severity)|
| `status`    | AuditStatus | `PENDING` → `COMPLETED` or `FAILED`                         |
| `createdAt` | DateTime    | Auto-set on creation                                         |
| `updatedAt` | DateTime    | Auto-updated on every write                                  |
| `userId`    | String?     | Optional FK to the User who triggered the audit              |

### Enums

```prisma
enum UserRole {
  USER
  ADMIN
}

enum AuditStatus {
  PENDING
  COMPLETED
  FAILED
}
```


---

## API Reference

All routes are prefixed with `/api`. Protected routes require a `Bearer` JWT token in the `Authorization` header obtained from the login endpoint.

### Auth

| Method | Endpoint           | Auth | Description                        |
|--------|--------------------|------|------------------------------------|
| POST   | `/auth/register`   | No   | Register a new user account        |
| POST   | `/auth/login`      | No   | Authenticate and receive a JWT     |

**Register — request body:**
```json
{ "email": "user@example.com", "password": "yourpassword" }
```

**Register — response (201):**
```json
{ "id": "clx...", "email": "user@example.com", "role": "USER" }
```

**Login — request body:**
```json
{ "email": "user@example.com", "password": "yourpassword" }
```

**Login — response (200):**
```json
{ "token": "<jwt>" }
```

The JWT is valid for 8 hours. Include it in all subsequent requests as:
```
Authorization: Bearer <token>
```

---

### Transactions

| Method | Endpoint                   | Auth | Description                                                        |
|--------|----------------------------|------|--------------------------------------------------------------------|
| GET    | `/transactions/:accountId` | Yes  | Fetch and persist the latest 25 Stellar transactions for an account |

This endpoint queries the Stellar Horizon API in real time, maps each record to the internal `TransactionRecord` shape, runs integrity verification, and upserts into PostgreSQL using the `stellarId` as the deduplication key. Already-persisted transactions are returned from the database without re-fetching.

**Response (200):**
```json
{
  "accountId": "GABC...XYZ",
  "transactions": [
    {
      "id": "clx...",
      "stellarId": "abc123...",
      "accountId": "GABC...XYZ",
      "amount": "250.00",
      "assetCode": "XLM",
      "memo": "invoice-42",
      "sourceAccount": "GABC...XYZ",
      "operationType": "payment",
      "verified": true,
      "createdAt": "2026-04-16T12:00:00.000Z"
    }
  ]
}
```

---

### Audit

| Method | Endpoint              | Auth | Description                                       |
|--------|-----------------------|------|---------------------------------------------------|
| POST   | `/audit/run`          | Yes  | Queue an async audit job for a Stellar account    |
| GET    | `/audit/report/:id`   | Yes  | Retrieve an audit report by its ID                |

**Run audit — request body:**
```json
{ "accountId": "GABC...XYZ" }
```

The service immediately creates an `AuditReport` record in `PENDING` status, enqueues a job on the `audit-queue`, and returns HTTP 202. The actual analysis runs in the background worker.

**Run audit — response (202):**
```json
{
  "id": "clx...",
  "accountId": "GABC...XYZ",
  "status": "PENDING",
  "summary": "Queued for audit",
  "findings": [],
  "createdAt": "2026-04-16T12:00:00.000Z"
}
```

Poll `GET /api/audit/report/:id` until `status` is no longer `PENDING`.

**Report — response (200, completed):**
```json
{
  "id": "clx...",
  "accountId": "GABC...XYZ",
  "status": "COMPLETED",
  "summary": "2 suspicious item(s) found",
  "findings": [
    {
      "rule": "largePayment",
      "description": "Transaction amount 1300 exceeds threshold 1000",
      "severity": "medium"
    },
    {
      "rule": "unverifiedTransaction",
      "description": "Transaction verification failed or incomplete",
      "severity": "high"
    }
  ],
  "createdAt": "2026-04-16T12:00:00.000Z",
  "updatedAt": "2026-04-16T12:00:05.000Z"
}
```

**Report — response (200, failed):**
```json
{
  "id": "clx...",
  "status": "FAILED",
  "summary": "Audit failed"
}
```

---

### Health Check

| Method | Endpoint  | Auth | Description                        |
|--------|-----------|------|------------------------------------|
| GET    | `/health` | No   | Returns service liveness status    |

**Response (200):**
```json
{ "status": "ok", "service": "stellar-financial-audit" }
```

---

## Audit Engine

The audit engine (`src/audit/auditEngine.ts`) iterates over every transaction for an account and applies all rules defined in `src/audit/auditRules.ts`. Each rule is a pure function that receives transaction data and returns either an `AuditFinding` object or `null`.

### Rules

| Rule                    | Severity | Trigger Condition                                              |
|-------------------------|----------|----------------------------------------------------------------|
| `largePayment`          | medium   | Transaction `amount` ≥ 1000 (default threshold, configurable) |
| `unverifiedTransaction` | high     | `verified` is `false` — integrity check failed                |
| `sourceMismatch`        | low      | `sourceAccount` does not match the audited `accountId`        |

### `AuditFinding` shape

```ts
interface AuditFinding {
  rule: string;          // e.g. "largePayment"
  description: string;   // human-readable explanation
  severity: 'low' | 'medium' | 'high';
}
```

### Adding a new rule

Rules are fully decoupled from the engine. To add one, open `src/audit/auditRules.ts` and add a new function to the `auditRules` object:

```ts
myNewRule: (tx: TransactionRecord): AuditFinding | null => {
  // return a finding or null
}
```

Then reference it inside `auditEngine.ts` alongside the existing rule calls. No other files need to change.

---

## Middleware Pipeline

Every incoming HTTP request passes through the following middleware chain in order:

1. **`correlationIdMiddleware`** — reads the `x-correlation-id` request header. If absent, generates a UUID v4. Attaches the ID to `req.headers` so it flows through to all downstream logs.

2. **`loggingMiddleware`** — creates a Pino child logger scoped to the correlation ID, HTTP method, and path. Logs the incoming request (with query and body) and the outgoing response status code on `res.finish`.

3. **`authMiddleware`** (route-level) — extracts the `Bearer` token from the `Authorization` header, verifies it with `verifyJwt()`, and attaches the decoded `JwtUser` payload to `req.user`. Returns 401 if the header is missing or the token is invalid/expired.

4. **`errorMiddleware`** — Express error handler registered last. Catches any error passed to `next(err)`, logs it with Pino, and returns a structured JSON response with the appropriate HTTP status code.

---

## Authentication & Authorization

Authentication is handled with JSON Web Tokens (JWT):

- **Registration** — `POST /api/auth/register` accepts an email and password. The password is hashed with bcrypt (10 salt rounds) and stored. Plaintext passwords are never persisted.
- **Login** — `POST /api/auth/login` validates credentials and returns a signed JWT with a payload of `{ sub, email, role }` and an 8-hour expiry.
- **Protected routes** — the `authenticate` middleware verifies the Bearer token on every protected endpoint. The decoded user is available as `req.user` in controllers.
- **Roles** — users have a `role` of either `USER` or `ADMIN`. The `ADMIN` role is assigned via the seed script or direct database update. Role-based route guards are on the roadmap.

---

## Async Job Processing

Audit jobs are processed asynchronously using BullMQ backed by Redis:

1. `POST /api/audit/run` calls `auditService.queueAudit()`, which:
   - Creates an `AuditReport` in `PENDING` status in PostgreSQL
   - Adds a job to the `audit-queue` BullMQ queue with `{ reportId, accountId }`
   - Returns the pending report immediately (HTTP 202)

2. The worker (`src/jobs/auditWorker.ts`) runs in the same Node.js process (imported in `server.ts`) and listens on `audit-queue`. For each job it:
   - Fetches the latest transactions from Stellar Horizon for the account
   - Runs them through the audit engine
   - Updates the `AuditReport` to `COMPLETED` with findings and summary

3. If the worker throws at any point, the `failed` event handler updates the report to `FAILED` with a generic summary, ensuring the record is never left stuck in `PENDING`.

The HTTP server and the worker share the same process but use separate IORedis connections, so queue processing is not blocked by HTTP traffic.

---

## Soroban Smart Contracts

The `contracts/` directory contains Rust stubs for Stellar Soroban smart contracts intended for future on-chain enforcement. They are scaffolded but not yet deployed.

### `AuditTrail.rs`

Maintains an immutable on-chain audit event log. Intended functions:

- `record_audit_event(event_data, timestamp)` — appends an audit event to the ledger
- `get_audit_trail(start_time, end_time)` — retrieves events within a time range
- `verify_audit_integrity(event_id)` — confirms an event has not been tampered with

### `AuditValidator.rs`

Validates transaction integrity and compliance on-chain. Intended functions:

- `validate_transaction(transaction_id, audit_rules)` — checks a transaction against a set of rules
- `check_compliance(account_id, amount)` — returns whether an account/amount combination is compliant

### `ComplianceChecker.rs`

Enforces regulatory compliance rules. Intended functions:

- `check_kyc_compliance(account_id)` — verifies KYC status for an account
- `flag_suspicious_activity(transaction_id, risk_score)` — flags transactions with a risk score above 50
- `record_compliance_result(account_id, is_compliant)` — persists a compliance decision on-chain

> See [`contracts/README.md`](contracts/README.md) for Soroban development setup instructions.

---

## Getting Started

### Prerequisites

- Node.js 20+
- PostgreSQL 15+
- Redis 7+

### Installation

```bash
# 1. Clone the repository
git clone https://github.com/your-org/stellar-financial-audit.git
cd stellar-financial-audit

# 2. Copy and configure environment variables
cp .env.example .env
# Edit .env with your database, Redis, Stellar, and JWT values

# 3. Install dependencies
npm install

# 4. Generate the Prisma client
npx prisma generate

# 5. Run database migrations
npx prisma migrate dev

# 6. (Optional) Seed the default admin user
npx ts-node scripts/seed.ts

# 7. Start the development server with hot reload
npm run dev
```

The server starts on `http://localhost:4000` by default.

**Available npm scripts:**

| Script       | Description                                      |
|--------------|--------------------------------------------------|
| `npm run dev`   | Start with ts-node-dev (hot reload)           |
| `npm run build` | Compile TypeScript to `dist/`                 |
| `npm start`     | Run compiled output from `dist/server.js`     |
| `npm test`      | Run Jest test suite (serial)                  |
| `npm run lint`  | Run ESLint across all `.ts` files             |

---

## Environment Variables

All required variables are validated at startup in `src/config/index.ts`. The service will throw and exit immediately if any required variable is missing.

| Variable             | Required | Default | Description                                                  |
|----------------------|----------|---------|--------------------------------------------------------------|
| `DATABASE_URL`       | Yes      | —       | PostgreSQL connection string                                 |
| `STELLAR_NETWORK`    | Yes      | —       | `testnet` or `public`                                        |
| `STELLAR_SECRET_KEY` | Yes      | —       | Stellar secret key (`S...`) for the service account          |
| `JWT_SECRET`         | Yes      | —       | Random secret used to sign and verify JWT tokens             |
| `REDIS_URL`          | Yes      | —       | Redis connection URL, e.g. `redis://localhost:6379`          |
| `PORT`               | No       | `4000`  | HTTP server port                                             |
| `LOG_LEVEL`          | No       | `info`  | Pino log level: `trace`, `debug`, `info`, `warn`, `error`   |

Example `.env`:
```env
DATABASE_URL=postgresql://postgres:postgres@localhost:5432/stellar_audit
STELLAR_NETWORK=testnet
STELLAR_SECRET_KEY=SXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX
JWT_SECRET=replace-with-a-long-random-secret
REDIS_URL=redis://localhost:6379
PORT=4000
```

---

## Running with Docker

Docker Compose starts the app, PostgreSQL 15, and Redis 7 together with a single command:

```bash
docker-compose up --build
```

Services and ports:

| Service | Port  | Description                  |
|---------|-------|------------------------------|
| `app`   | 4000  | Node.js API + BullMQ worker  |
| `db`    | 5432  | PostgreSQL 15                |
| `redis` | 6379  | Redis 7                      |

PostgreSQL data is persisted in a named Docker volume (`db-data`) so it survives container restarts.

Run migrations inside the running container:

```bash
docker-compose exec app npx prisma migrate dev
```

Seed the admin user inside the container:

```bash
docker-compose exec app npx ts-node scripts/seed.ts
```

Stop all services:

```bash
docker-compose down
```

---

## Running Tests

```bash
npm test
```

Tests run serially (`--runInBand`) to prevent race conditions when multiple tests share database state. The suite covers three areas:

### `tests/auth.test.ts` — Authentication utilities
Tests the JWT sign/verify round-trip using `signJwt()` and `verifyJwt()`. Verifies that the decoded payload matches the original `sub`, `email`, and `role` fields.

### `tests/audit.test.ts` — Audit engine
Feeds a set of mock `TransactionRecord` objects (including a large payment and an unverified transaction) through `auditEngine.analyze()`. Asserts that the correct number of findings are returned and that the summary string contains the word "suspicious".

### `tests/stellar.test.ts` — Transaction verification
Tests `verifyTransaction()` directly with both a valid minimal record (has `id`, `source_account`, `amount`, `ledger`) and an invalid record (empty `id`, missing `ledger`). Asserts `true` and `false` respectively.

---

## Seeding the Database

The seed script upserts a default admin user so you can authenticate immediately after setup:

```bash
npx ts-node scripts/seed.ts
```

Default credentials:

| Field    | Value                        |
|----------|------------------------------|
| Email    | `admin@stellar-audit.local`  |
| Password | `ChangeMe123!`               |
| Role     | `ADMIN`                      |

> Change the password immediately after first login in any non-local environment. The seed script uses `upsert`, so re-running it will update the password hash without creating a duplicate user.

---

## Roadmap

- [ ] Role-based route guards (admin-only endpoints)
- [ ] Multi-account audit bundles in a single job
- [ ] Webhook / streaming listener for real-time Stellar ledger events
- [ ] Audit report export to CSV and PDF
- [ ] Advanced anomaly detection rules (velocity checks, round-number detection, pattern analysis)
- [ ] Support for non-native Stellar assets and custom asset codes
- [ ] Pagination for transaction and report list endpoints
- [ ] Deploy and integrate Soroban smart contracts on testnet
- [ ] Admin dashboard UI
