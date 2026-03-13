# Arcium Explorer

A real-time explorer for the [Arcium](https://arcium.com) Multi-Party Computation (MPC) network on Solana. Track clusters, ARX nodes, confidential computations, programs, and MXE accounts across devnet and mainnet.

**Live:** [arc-explore.io](https://arc-explore.io)

## Features

- Real-time indexing via Yellowstone gRPC (mainnet) and WebSocket (devnet)
- Computation grid with queue/callback phase visualization and error detection
- Full-text search across all entity types
- Throughput charting and network statistics
- Transaction signature enrichment with Arcium error code lookup
- Responsive dark theme

## Tech Stack

- **Frontend:** Next.js 16, React 19, Tailwind CSS v4, TanStack Query/Table, Recharts
- **Backend:** Next.js API routes, Drizzle ORM, PostgreSQL
- **Indexer:** Standalone worker process — gRPC streaming, WebSocket subscriptions, polling fallback
- **Blockchain:** @solana/web3.js, Yellowstone gRPC

## Architecture

```
Solana (Arcium Program)
  ├── gRPC Stream (mainnet)
  └── WebSocket (devnet)
        ↓
  Worker Process
  (index → parse → upsert)
        ↓
    PostgreSQL
        ↓
  Next.js App
  (API + Frontend)
```

Two runtime processes:
- **Next.js App** — serves pages and API routes
- **Worker** — indexes on-chain data into PostgreSQL

## Getting Started

### Prerequisites

- Node.js 20+ (see `.nvmrc`)
- PostgreSQL database

### Setup

```bash
# Install dependencies
npm install

# Copy environment variables
cp .env.example .env
# Edit .env with your DATABASE_URL and RPC endpoints

# Run database migrations
npm run db:migrate

# Start development server
npm run dev

# Start the indexer worker (separate terminal)
npm run worker
```

### Environment Variables

| Variable | Required | Description |
|----------|----------|-------------|
| `DATABASE_URL` | Yes | PostgreSQL connection string |
| `MAINNET_RPC_URL` | No | Mainnet RPC endpoint |
| `DEVNET_RPC_URL` | No | Devnet RPC endpoint |
| `MAINNET_GRPC_ENDPOINT` | No | Yellowstone gRPC endpoint for mainnet streaming |
| `MAINNET_GRPC_TOKEN` | No | gRPC auth token |
| `MAINNET_ENRICHER_RPC_URL` | No | Separate RPC for tx signature enrichment |
| `ENABLE_MAINNET` | No | Enable mainnet indexing (default: true) |
| `ENABLE_DEVNET` | No | Enable devnet indexing (default: true) |

### Scripts

```bash
npm run dev          # Next.js dev server
npm run build        # Production build
npm run start        # Production server
npm run worker       # Run indexer worker
npm run worker:dev   # Worker with watch mode
npm run db:generate  # Generate Drizzle migrations
npm run db:migrate   # Apply migrations
npm run db:studio    # Drizzle Studio (DB GUI)
```

## Project Structure

```
src/
  app/              Next.js App Router (pages + API routes)
  components/       React components (layout, shared)
  lib/              Database, hooks, indexer, Solana utilities
  types/            TypeScript interfaces
worker/             Standalone indexer process
drizzle/            Database migrations
```

## Deployment

The app runs on **Vercel** (Next.js) + **Railway** (PostgreSQL + Worker). See `railway.toml` for service configuration.

## License

MIT
