# Tracker App - Setup Complete ✅

## What Was Done

Successfully converted the humanitarian aid tracker from static HTML to a full-stack Next.js application with blockchain integration and real database-backed data.

### Frontend (Next.js 16 + React 19)

- ✅ Two main pages: **Dashboard** and **Transactions**
- ✅ Removed sidebar navigation (cleaner UI as requested)
- ✅ Integrated **Polygon blockchain** via wagmi + RainbowKit for wallet connection
- ✅ Custom **Tailwind theme** with ASEAN Relief branding
- ✅ **React Query** for data fetching and caching
- ✅ All components now use **real API data** instead of mocks

### Backend (NestJS + Prisma)

- ✅ Created **TrackerModule** with service + controller
- ✅ **6 REST API endpoints**:
  - `GET /api/tracker/shipments` (with optional status filter)
  - `GET /api/tracker/shipments/:id`
  - `GET /api/tracker/stats`
  - `GET /api/tracker/relief-zones`
  - `GET /api/tracker/validators`
  - `GET /api/tracker/donation-distribution`

### Database (Prisma + PostgreSQL)

- ✅ **4 new models** added to schema:
  - `TrackerShipment` - Aid shipment tracking
  - `TrackerStats` - Aggregated metrics
  - `TrackerReliefZone` - Map locations
  - `TrackerValidator` - Blockchain validator nodes
- ✅ **Comprehensive seed data** with 9 shipments, 4 zones, 6 validators, 1 stats record

## Next Steps to Run

### 1. Run Database Migration

```powershell
cd c:\Users\lazirein\Documents\LAINE's\Hackathons\wira\wira-borneo
npm run prisma:migrate-dev --filter=@wira-borneo/api
```

This will create the tracker tables in your database.

### 2. Seed the Database

```powershell
npm run prisma:seed --filter=@wira-borneo/api
```

This will populate the tracker tables with realistic ASEAN disaster relief data.

### 3. Start the API Server

```powershell
npm run api
```

The API will run on `http://localhost:3333`

### 4. Start the Tracker App

```powershell
# In a new terminal
npm run tracker
```

The tracker app will run on `http://localhost:4200` (or next available port)

## Configuration

### Environment Variables

Created `.env.local` for the tracker app with:

- `NEXT_PUBLIC_API_BASE_URL=http://localhost:3333/api`
- `NEXT_PUBLIC_CHAIN_ID=80002` (Polygon Amoy testnet)
- `NEXT_PUBLIC_POLYGON_RPC_URL=https://rpc-amoy.polygon.technology`
- `NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID` (needs your actual WalletConnect project ID)

### Get a WalletConnect Project ID

1. Go to https://cloud.walletconnect.com/
2. Create a free account
3. Create a new project
4. Copy the Project ID
5. Update `.env.local` with your actual project ID

## Features

### Dashboard Page (`/`)

- **3 Stats Cards**: Total Aid Disbursed, Verified Payouts, Network Trust Index
- **Interactive Map**: Shows relief zones with real-time data
- **Recent Impact Logs**: Latest 3 shipment transactions
- **Donation Distribution**: Category breakdown with progress bars
- **Node Validators**: Top 3 validator nodes with status and latency

### Transactions Page (`/transactions`)

- **Tab System**: Filter by DISPATCHED / IN_TRANSIT / DELIVERED
- **Shipment Table**: Sortable table with blockchain hash verification
- **Copy Hash**: Click to copy blockchain hash to clipboard
- **Verification Status**: Visual indicators for VERIFIED/PENDING shipments
- **ASEAN Trust Banner**: Regional cooperation messaging

## Tech Stack

### Frontend

- **Next.js 16** (App Router)
- **React 19**
- **Tailwind CSS 3.4.3** with custom theme
- **@tanstack/react-query 5.90.2** for data fetching
- **wagmi 2.12** + **viem 2.21** for blockchain
- **@rainbow-me/rainbowkit 2.1** for wallet UI
- **ethers 6.13** for contract interactions

### Backend

- **NestJS** with modular architecture
- **Prisma** ORM with PostgreSQL adapter
- **TypeScript** for type safety

### Blockchain

- **Polygon Network** (Amoy testnet + mainnet)
- Low-cost transactions for humanitarian aid tracking
- Smart contract structure ready for deployment

## Data Flow

```
User Action → React Component → React Query Hook →
→ API Fetch → NestJS Controller → TrackerService →
→ Prisma Query → PostgreSQL → Response → UI Update
```

## File Structure

```
apps/tracker/
├── src/
│   ├── app/
│   │   ├── page.tsx                    # Dashboard page
│   │   ├── transactions/page.tsx       # Transactions page
│   │   ├── components/
│   │   │   ├── RecentImpactLogs.tsx
│   │   │   ├── DonationDistribution.tsx
│   │   │   └── ReliefZonesMap.tsx
│   │   └── transactions/components/
│   │       ├── ShipmentTable.tsx
│   │       └── TrustBanner.tsx
│   ├── components/
│   │   ├── Header.tsx
│   │   ├── StatCard.tsx
│   │   ├── NodeValidators.tsx
│   │   └── NetworkStatus.tsx
│   └── lib/
│       ├── api/
│       │   └── hooks.ts                # React Query hooks
│       └── blockchain/
│           ├── config.ts               # Polygon configuration
│           ├── contracts.ts            # Smart contract ABI
│           └── hooks.ts                # Blockchain hooks
└── .env.local                          # Environment config

apps/api/
├── src/
│   └── modules/
│       └── tracker/
│           ├── tracker.module.ts
│           ├── tracker.service.ts
│           └── tracker.controller.ts
└── prisma/
    ├── schema/models/
    │   └── tracker.prisma              # Database schema
    └── seed.ts                         # Seed script (updated)
```

## Troubleshooting

### If migration fails

- Ensure PostgreSQL is running
- Check `DATABASE_URL` in your API `.env` file
- Verify you have proper database permissions

### If API returns empty data

- Run the seed script to populate data
- Check API is running on port 3333
- Verify TrackerModule is imported in app.module.ts

### If blockchain features don't work

- Update WalletConnect project ID in `.env.local`
- Install MetaMask or other Web3 wallet
- Switch to Polygon Amoy testnet in your wallet
- Get test MATIC from https://faucet.polygon.technology/

## Status

🟢 **Ready to Run** - All code complete, migration and seed ready to execute

---

_Built for WIRA Borneo Hackathon - ASEAN Relief Tracker_
