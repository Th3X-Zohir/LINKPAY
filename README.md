# LinkPay BD

> The Simplest Payment Link Platform for Bangladeshi Freelancers

![Next.js](https://img.shields.io/badge/Next.js-15-black)
![TypeScript](https://img.shields.io/badge/TypeScript-5.4-blue)
![PostgreSQL](https://img.shields.io/badge/PostgreSQL-16-blue)
![Docker](https://img.shields.io/badge/Docker-Ready-blue)

## Overview

LinkPay BD enables Bangladeshi freelancers to create and send professional payment links in under 30 seconds, accepting international card payments with automatic settlement to bKash or bank accounts.

**Business Model:** Aggregator (aamarPay) + Freemium (0.75% platform fee)

## Features

### Core (Free)
- ✅ User registration/login with NextAuth.js
- ✅ Payment link creation with shareable URLs
- ✅ International card acceptance via aamarPay
- ✅ Transaction history
- ✅ Basic analytics dashboard
- ✅ Share via WhatsApp/Email/Copy
- ✅ Invoice PDF generation
- ✅ bKash payout support

### Premium (৳999/month)
- Custom-branded invoices
- WhatsApp auto-send
- Client reminders
- Tax reports (NBR)

## Tech Stack

| Layer | Technology |
|-------|------------|
| Frontend | Next.js 15 (App Router), React 19 |
| Styling | Tailwind CSS 4, shadcn/ui |
| Backend | Next.js API Routes (Edge Runtime) |
| Database | PostgreSQL 16, Prisma ORM |
| Auth | NextAuth.js v5 (Better Auth) |
| Cache/Queue | Redis 7, BullMQ |
| Storage | MinIO (S3-compatible) |
| Email | Resend |
| Payments | aamarPay API |
| Payouts | bKash API |

## Getting Started

### Prerequisites

- Node.js 20+
- Docker & Docker Compose
- PostgreSQL 16 (or Docker)
- Redis 7 (or Docker)

### Installation

1. **Clone and install dependencies:**
```bash
cd linkpay-bd
npm install
```

2. **Set up environment variables:**
```bash
cp .env.example .env
# Edit .env with your credentials
```

3. **Set up the database:**
```bash
npx prisma generate
npx prisma db push
```

4. **Run the development server:**
```bash
npm run dev
```

5. **Open [http://localhost:9100](http://localhost:9100)**

### Docker Deployment

```bash
# Build and run
docker-compose up -d

# View logs
docker-compose logs -f app

# Stop
docker-compose down

### Docker Exposed Ports (9100 range)

- App: `9100 -> 3000`
- PostgreSQL: `9101 -> 5432`
- Redis: `9102 -> 6379`
- MinIO API: `9103 -> 9000`
- MinIO Console: `9104 -> 9001`

The app container runs startup initialization automatically:
- `prisma db push` to ensure schema is applied
- first-run seed only (skips seeding when users already exist)
```

## Project Structure

```
linkpay-bd/
├── src/
│   ├── app/
│   │   ├── (auth)/           # Login, Register
│   │   ├── (dashboard)/      # Protected dashboard
│   │   │   ├── links/        # Payment links CRUD
│   │   │   ├── transactions/ # Transaction history
│   │   │   ├── payouts/      # Payout management
│   │   │   ├── analytics/   # Earnings analytics
│   │   │   └── settings/     # Profile settings
│   │   ├── (marketing)/      # Landing page
│   │   ├── pay/[shareUrl]/   # Public payment page
│   │   └── api/              # API routes
│   ├── components/           # React components
│   │   ├── ui/               # shadcn/ui components
│   │   └── forms/            # Form components
│   ├── lib/                  # Utilities
│   │   ├── api/              # External API clients
│   │   └── validators.ts     # Zod schemas
│   └── actions/              # Server Actions
├── prisma/
│   └── schema.prisma         # Database schema
└── docs/                     # Documentation
```

## API Routes

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/auth/*` | GET/POST | NextAuth.js routes |
| `/api/payment-links` | GET/POST | List/Create payment links |
| `/api/transactions` | GET | Transaction history |
| `/api/payouts` | GET/POST | Payout management |
| `/api/webhooks/aamarpay` | POST | Payment webhooks |
| `/api/invoices/[id]` | GET | Download invoice PDF |

## Environment Variables

See [.env.example](.env.example) for all required variables:

- `DATABASE_URL` - PostgreSQL connection
- `REDIS_URL` - Redis connection
- `NEXTAUTH_SECRET` - Auth secret key
- `AAMARPAY_*` - aamarPay gateway credentials
- `BKASH_*` - bKash API credentials
- `RESEND_API_KEY` - Email service

## Development

```bash
# Run linter
npm run lint

# Type check
npx tsc --noEmit

# Database studio
npm run db:studio

# Format code
npx prettier --write .
```

## Deployment

The app is designed for Docker deployment on bare metal:

```bash
# Production build
docker build -t linkpay-bd .

# Run with environment
docker run -d \
  --name linkpay \
  -p 9100:3000 \
  -e DATABASE_URL=... \
  -e NEXTAUTH_SECRET=... \
  linkpay-bd
```

## License

MIT License - See [plan.txt](../plan.txt) for business plan details.

---

Built with ❤️ for Bangladeshi freelancers
