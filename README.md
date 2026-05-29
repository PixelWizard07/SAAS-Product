# MeeshoHub — Unified Multi-Account Meesho Seller Dashboard

A full-stack SaaS platform for managing multiple Meesho seller accounts from a single dashboard. Automates data fetching via Puppeteer browser automation (no official Meesho API used).

## Features

- **Multi-Account Management** — Add unlimited Meesho seller accounts, switch instantly
- **Orders Panel** — Unified view across all accounts with filters, search, bulk actions
- **Returns Panel** — Track all return requests with status updates
- **Return OTP Panel** — View & copy return OTPs from all accounts in one place
- **Products / Catalogue** — Browse products, edit price & stock inline
- **Payments** — Settlement history with visual charts
- **Advertisements** — Campaign performance tracking
- **Reports** — Sales & returns analytics with Excel export
- **Notifications** — Unified feed from all accounts
- **Security** — AES-256 encrypted credentials, JWT auth, rate limiting

## Architecture

```
┌─────────────┐    ┌─────────────┐    ┌─────────────┐
│   Frontend  │───▶│   Backend   │───▶│   MongoDB   │
│  React+Vite │    │  Express.js │    │             │
│  Tailwind   │    │  JWT Auth   │◀──▶│   Redis     │
└─────────────┘    └─────────────┘    └─────────────┘
                          │
                   ┌─────────────┐
                   │   Scraper   │
                   │  Puppeteer  │
                   │  BullMQ     │
                   └─────────────┘
```

## Quick Start (Docker)

```bash
# 1. Clone and copy env file
cp .env.example .env
# Edit .env — set JWT_SECRET and AES_SECRET_KEY

# 2. Start all services
docker-compose up --build

# Frontend: http://localhost
# Backend API: http://localhost:5000/api/v1
```

## Local Development

### Backend
```bash
cd backend
npm install
# Copy .env.example to .env and fill values
npm run dev
```

### Frontend
```bash
cd frontend
npm install
npm run dev
# Visit http://localhost:5173
```

### Scraper
```bash
cd scraper
npm install
npm run dev
```

## Environment Variables

| Variable | Description | Required |
|---|---|---|
| `MONGO_URI` | MongoDB connection string | Yes |
| `REDIS_URL` | Redis connection string | Yes |
| `JWT_SECRET` | JWT signing secret (min 32 chars) | Yes |
| `AES_SECRET_KEY` | AES-256 encryption key (exactly 32 chars) | Yes |
| `FRONTEND_URL` | Allowed CORS origin | Yes |
| `PORT` | Backend port (default: 5000) | No |
| `PUPPETEER_EXECUTABLE_PATH` | Chromium path (Docker only) | No |
| `SCRAPER_HEADLESS` | Run browser headless (default: true) | No |

## API Endpoints

| Method | Path | Description |
|---|---|---|
| POST | `/api/v1/auth/register` | Register MeeshoHub user |
| POST | `/api/v1/auth/login` | Login |
| GET | `/api/v1/accounts` | List seller accounts |
| POST | `/api/v1/accounts` | Add seller account |
| POST | `/api/v1/accounts/:id/sync` | Trigger sync |
| GET | `/api/v1/orders` | List orders (filterable) |
| GET | `/api/v1/returns` | List returns |
| GET | `/api/v1/returns/otps` | Get active OTPs |
| GET | `/api/v1/products` | List products |
| PUT | `/api/v1/products/:id` | Update price/stock |
| GET | `/api/v1/payments` | Payment history |
| GET | `/api/v1/notifications` | Notifications feed |

## Security

- All Meesho passwords encrypted with AES-256-CBC (random IV per entry)
- JWT access tokens (7d) stored in memory; refresh tokens in httpOnly cookies
- Rate limiting: 200 req/15min globally
- User data isolation enforced at every query

## Tech Stack

| Layer | Technology |
|---|---|
| Frontend | React 18, Vite, Tailwind CSS, TanStack Query, Recharts |
| Backend | Node.js, Express.js, Mongoose |
| Database | MongoDB 7 |
| Cache/Queue | Redis 7, BullMQ |
| Scraper | Puppeteer + puppeteer-extra-plugin-stealth |
| Auth | JWT + bcryptjs |
| Encryption | Node.js crypto (AES-256-CBC) |
