# Stellar Financial Audit

A production-ready audit application for financial organizations using the Stellar network. This app helps teams track, verify, and audit on-chain payments with transparency, compliance, and asynchronous reporting.

## Features

- Stellar network integration with testnet and public network support
- JWT-based authentication and user management
- Transaction ingestion and verification
- Audit engine to analyze transactions and flag suspicious activity
- Background worker queue for async audit processing
- Structured JSON logging with request correlation IDs
- PostgreSQL storage via Prisma ORM
- Comprehensive TypeScript-first architecture

## Tech Stack

- Backend: Node.js + TypeScript
- Framework: Express.js
- Blockchain: Stellar SDK
- Database: PostgreSQL
- ORM: Prisma
- Auth: JWT
- Queue: BullMQ
- Logging: Pino
- Config: dotenv
- Testing: Jest

## Setup Instructions

1. Clone the repository.
2. Copy environment variables:

```bash
cp .env.example .env
```

3. Install dependencies:

```bash
npm install
```

4. Generate Prisma client:

```bash
npx prisma generate
```

5. Run the development server:

```bash
npm run dev
```

## Environment Variables

- `DATABASE_URL` - PostgreSQL connection string
- `STELLAR_NETWORK` - `testnet` or `public`
- `STELLAR_SECRET_KEY` - Stellar secret key for the service account
- `JWT_SECRET` - Secret used to sign JWT tokens
- `REDIS_URL` - Redis connection URL for BullMQ queue
- `PORT` - HTTP server port

## Run Locally

- Development:

```bash
npm run dev
```

- Build and run:

```bash
npm run build
npm start
```

- Tests:

```bash
npm test
```

## API Endpoints Overview

- `POST /auth/register` - Register a new user
- `POST /auth/login` - Authenticate and receive a JWT
- `GET /transactions/:accountId` - Fetch and inspect Stellar transactions for an account
- `POST /audit/run` - Trigger an audit job for one or more accounts
- `GET /audit/report/:id` - Fetch an audit report by ID

## Future Roadmap

- Add role-based permissions and admin dashboards
- Support multi-account audit bundles
- Add webhook event listeners for Stellar ledger updates
- Add report export to CSV/PDF
- Add advanced anomaly detection rules
- Add support for non-native Stellar assets
# -Stellar-Financial-Audit
