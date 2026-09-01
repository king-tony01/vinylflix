# Vinylflix 🎬

**Vinylflix** is a high-performance content attention and rewarded video streaming ecosystem built with a clean modular monolith architecture, double-entry financial ledger, Paystack payments & bank payouts, and YouTube Data API v3 integrations.

---

## 🏗️ Architecture & Core Systems

1. **Modular Monolith**: Clean domain boundaries (`auth`, `users`, `memberships`, `referrals`, `wallet`, `ledger`, `youtube`, `videos`, `campaigns`, `watch-sessions`, `payments`, `withdrawals`, `risk`, `admin`, `audit`).
2. **Immutable Double-Entry Financial Ledger**: Wallet balances are strictly derived from and synchronized with immutable `LedgerEntry` transactions. No direct balance mutations from client or backend controllers.
3. **Multi-Bucket Wallet Projections**:
   - `Available Balance`: Directly withdrawable cash to verified bank accounts.
   - `Locked Balance`: Conditional milestone rewards (e.g. ₦10,000 membership bonus requiring 10 qualified referrals to unlock).
   - `Pending Balance`: Funds undergoing withdrawal review or settlement.
4. **Server-Controlled Rewarded Viewing**:
   - Cryptographic watch sessions (`WatchSession`) with periodic heartbeat synchronization.
   - Server-side duration, continuity, and anti-fraud evaluation.
   - Client is strictly prohibited from dictating reward amounts.
5. **Server-Side Referral Qualification Engine**:
   - Referrals are verified based on new account status, settled paid membership, and clean fraud score.
   - Automatic milestone evaluation unlocks conditional rewards into available balance.
6. **Real Payment Gateway & Webhook Infrastructure**:
   - Production Paystack integration with HMAC SHA512 signature verification.
   - Live Nigerian bank directory and real-time NUBAN account name resolution before payout submissions.
7. **Official Google OAuth & YouTube Data API v3**:
   - Creator channel OAuth connection with real subscriber metrics.
   - Direct YouTube URL import with automatic duration, thumbnail, and title resolution.

---

## 📁 Repository Structure

```
├── backend/                  # Modular Monolith Express API & Database Engine (Port 4000)
│   ├── prisma/
│   │   ├── schema.prisma        # Relational schema (18+ models)
│   │   └── seed.ts              # Clean slate seed (Super Admin + Standard tiers)
│   ├── src/
│   │   ├── config/              # Centralized configuration & environment
│   │   ├── middleware/          # JWT auth, RBAC guard, Zod validation, error handler
│   │   ├── modules/             # Core business modules
│   │   ├── server.ts            # Server bootstrap
│   │   └── app.ts               # Express configuration & SPA static router
│   └── tests/                   # Vitest unit & integration test suites
├── frontend/                 # Vinylflix Client Web App (React + Vite + Tailwind CSS)
├── admin/                    # Vinylflix Admin & Governance Console (React + Vite)
├── Dockerfile                # Multi-stage production container
├── docker-entrypoint.sh      # Container bootstrapper & Prisma auto-sync
├── docker-compose.yml        # Local full-stack container testing with PostgreSQL
└── render.yaml               # Render 1-click infrastructure blueprint
```

---

## 🚀 Quick Start (Local Development)

### 1. Backend Setup
```bash
cd backend
npm install
npx prisma generate
npx prisma db push
npm run prisma:seed
npm run dev
```

### 2. Frontend Setup
```bash
cd frontend
npm install
npm run dev
```

### 3. Admin Console Setup
```bash
cd admin
npm install
npm run dev
```

---

## 🐳 Docker & Render Deployment

### Local Docker Testing (with PostgreSQL)
```bash
docker compose up --build
```
- **Web App**: `http://localhost:10000/`
- **Admin Console**: `http://localhost:10000/admin/`
- **API Health Check**: `http://localhost:10000/health`

### Render Deployment
1. Connect your repository to Render.
2. Select **Blueprint** and use [`render.yaml`](render.yaml) to automatically provision PostgreSQL and the Docker web service.
3. Configure your `PAYSTACK_SECRET_KEY`, `PAYSTACK_PUBLIC_KEY`, and `YOUTUBE_API_KEY` in the Render dashboard.

---

## 🧪 Testing

```bash
cd backend
npx vitest run
```
