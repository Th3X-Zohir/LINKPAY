# LinkPay BD - Complete Infrastructure Specification

## Table of Contents
1. [System Architecture](#1-system-architecture)
2. [Database Schema (Prisma)](#2-database-schema-prisma)
3. [API Design](#3-api-design)
4. [Directory Structure](#4-directory-structure)
5. [Environment Variables](#5-environment-variables)
6. [Security Considerations](#6-security-considerations)
7. [Deployment Strategy](#7-deployment-strategy-vercel--hostinger)

---

## 1. System Architecture

### 1.1 High-Level Architecture

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                              CLIENT LAYER                                    │
│  ┌─────────────────┐     ┌──────────────────┐     ┌─────────────────────┐    │
│  │   Mobile Web    │     │   Desktop Web    │     │   PWA (Installable) │    │
│  │   (375px first) │     │   (Responsive)   │     │   (Service Worker)  │    │
│  └────────┬────────┘     └────────┬─────────┘     └──────────┬──────────┘    │
└───────────┼─────────────────────────┼───────────────────────────┼──────────────┘
            │                         │                            │
            └─────────────────────────┼────────────────────────────┘
                                      │ HTTPS
┌─────────────────────────────────────┴───────────────────────────────────────┐
│                              EDGE / CDN LAYER                                 │
│  ┌─────────────────────┐              ┌─────────────────────────────────┐    │
│  │   Vercel Edge       │              │   Vercel ISR / Static Cache    │    │
│  │   Network           │              │   (Landing pages, assets)       │    │
│  └─────────────────────┘              └─────────────────────────────────┘    │
└─────────────────────────────────────┬───────────────────────────────────────┘
                                      │
┌─────────────────────────────────────┴───────────────────────────────────────┐
│                           NEXT.JS APPLICATION LAYER                          │
│                              (Vercel Serverless)                             │
│                                                                              │
│  ┌─────────────────────────────────────────────────────────────────────────┐ │
│  │                      APP ROUTER (Next.js 15)                           │ │
│  │  ┌───────────────┐ ┌───────────────┐ ┌───────────────────────────┐  │ │
│  │  │  (auth)/      │ │  (dashboard)/  │ │  (marketing)/             │  │ │
│  │  │  - login      │ │  - overview    │ │  - landing                │  │ │
│  │  │  - register   │ │  - links       │ │  - pricing                │  │ │
│  │  │  - forgot-pw   │ │  - transactions│ │  - about                  │  │ │
│  │  └───────────────┘ │  - payouts     │ └───────────────────────────┘  │ │
│  │                    │  - settings    │                                 │ │
│  │                    │  - analytics    │                                 │ │
│  │                    └───────────────┘                                  │ │
│  │  ┌─────────────────────────────────────────────────────────────────┐  │ │
│  │  │                    API ROUTES                                    │  │ │
│  │  │  /api/auth/*  /api/payment-links/*  /api/transactions/*        │  │ │
│  │  │  /api/webhooks/*  /api/users/*  /api/payouts/*                │  │ │
│  │  └─────────────────────────────────────────────────────────────────┘  │ │
│  └─────────────────────────────────────────────────────────────────────────┘ │
│                                                                              │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐    │
│  │  Server      │  │  Server       │  │  API Route   │  │  Webhook     │    │
│  │  Components   │  │  Actions     │  │  Handlers    │  │  Handlers    │    │
│  └──────────────┘  └──────────────┘  └──────────────┘  └──────────────┘    │
└─────────────────────────────────────┬───────────────────────────────────────┘
                                      │
            ┌─────────────────────────┼──────────────────────────────┐
            │                         │                              │
┌───────────┴───────────┐ ┌──────────┴──────────┐ ┌────────────────┴────────┐
│   DATABASE CLUSTER    │ │   EXTERNAL SERVICES  │ │   CACHE / SESSIONS      │
│   (Neon PostgreSQL)   │ │                      │ │   (Vercel KV / Upstash) │
│   - Primary RW        │ │  ┌────────────────┐  │ │                         │
│   - Read Replicas     │ │  │  aamarPay      │  │ │  - NextAuth sessions    │
│   - Branching         │ │  │  Gateway API   │  │ │  - Rate limiting        │
│   └───────────────────┘ │  └────────────────┘  │ │  - API caching          │
│                         │  ┌────────────────┐  │ └─────────────────────────┘
│                         │  │  bKash         │  │
│                         │  │  Payout API    │  │
│                         │  └────────────────┘  │
│                         │  ┌────────────────┐  │
│                         │  │  Email (Resend)│  │
│                         │  │  SMS (Twilio)  │  │
│                         │  └────────────────┘  │
│                         │  ┌────────────────┐  │
│                         │  │  File Storage  │  │
│                         │  │  (Vercel Blob) │  │
│                         │  └────────────────┘  │
└─────────────────────────┴───────────────────────────────────────────────────┘
                                      │
┌─────────────────────────────────────┴───────────────────────────────────────┐
│                         HOSTINGER (Bangladesh)                               │
│  ┌─────────────────────────────────────────────────────────────────────────┐ │
│  │   VMS: 2 vCPU, 4GB RAM, 80GB SSD                                      │ │
│  │   - Reverse Proxy (Nginx) for bKash webhook callbacks                 │ │
│  │   - Background Job Runner (BullMQ + Redis)                           │ │
│  │   - Cron Jobs for payout processing                                   │ │
│  │   - Database backups (daily)                                           │ │
│  │   - SSL certificates (Let's Encrypt)                                  │ │
│  └─────────────────────────────────────────────────────────────────────────┘ │
└──────────────────────────────────────────────────────────────────────────────┘
```

### 1.2 Payment Flow Architecture

```
1. LINK CREATION
   Freelancer → Dashboard → Enter amount + description → "Create Link"
   │
   │  Next.js Server Action
   ▼
   - Generate unique shareUrl (cuid-based)
   - Create PaymentLink record in PostgreSQL (status: PENDING)
   - Call aamarPay API to create payment invoice
   - Store aamarPay invoice ID on PaymentLink record
   - Return shareable URL: https://linkpay.bd/pay/{shareUrl}

2. CLIENT PAYMENT
   Client opens URL → Payment page → Select method → Redirect to aamarPay

3. GATEWAY PROCESSING (aamarPay)
   Client enters card details on aamarPay hosted page

4. WEBHOOK NOTIFICATION
   aamarPay → POST /api/webhooks/aamarpay
   - Verify HMAC signature
   - Idempotency check
   - Update PaymentLink status: PENDING → PAID
   - Create Transaction record
   - Trigger payout queue job

5. PAYOUT PROCESSING (BullMQ on Hostinger)
   Daily at 9:00 AM Bangladesh Time
   - Query all PAID transactions with PayoutStatus = PENDING
   - Call bKash Payout API
   - Update statuses
```

---

## 2. Database Schema (Prisma)

```prisma
generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

// ============================================================
// AUTH & USERS
// ============================================================

model User {
  id            String    @id @default(cuid())
  email         String    @unique
  emailVerified DateTime?
  passwordHash  String?
  name          String?
  phone         String?   @unique

  // Payout Info
  bkashNumber   String?   @db.VarChar(15)
  bankName      String?
  bankAccount   String?
  bankRouting   String?

  // Plan & Billing
  plan          Plan      @default(FREE)
  monthlyLimit  Int       @default(10)

  // Referral
  referralCode    String?   @unique
  referredBy     String?
  referralCredits Int      @default(0)

  // Analytics
  totalEarnings  BigInt    @default(0)
  totalPayouts   BigInt    @default(0)

  // Timestamps
  createdAt      DateTime  @default(now())
  updatedAt      DateTime  @updatedAt
  lastLoginAt    DateTime?

  // Relations
  accounts       Account[]
  sessions       Session[]
  paymentLinks   PaymentLink[]
  transactions   Transaction[]
  payouts        Payout[]
  auditLogs      AuditLog[]
}

model Account {
  id                String  @id @default(cuid())
  userId            String
  type              String
  provider          String
  providerAccountId String
  refresh_token     String? @db.Text
  access_token      String? @db.Text
  expires_at        Int?
  token_type        String?
  scope             String?
  id_token          String? @db.Text
  session_state     String?

  user User @relation(fields: [userId], references: [id], onDelete: Cascade)

  @@unique([provider, providerAccountId])
}

model Session {
  id           String   @id @default(cuid())
  sessionToken String   @unique
  userId       String
  expires      DateTime
  user         User     @relation(fields: [userId], references: [id], onDelete: Cascade)
}

model VerificationToken {
  identifier String
  token      String   @unique
  expires    DateTime

  @@unique([identifier, token])
}

// ============================================================
// PAYMENT LINKS
// ============================================================

model PaymentLink {
  id          String    @id @default(cuid())
  shareUrl    String    @unique @default(cuid())

  userId      String
  user        User      @relation(fields: [userId], references: [id], onDelete: Cascade)

  amount      Int       // In poisha (10000 = 100 BDT)
  description String    @db.VarChar(500)
  currency    String    @default("BDT")

  customerName        String?
  customerEmail       String?
  customerMobile      String?
  customerAddress     String?

  serviceCategory     ServiceCategory @default(OTHER)

  status      LinkStatus @default(PENDING)

  aamarPayInvoiceId String?
  aamarPayUrl       String?

  expiresAt   DateTime?

  customBranding Boolean @default(false)
  brandColor     String? @default("#1E40AF")

  clickCount   Int       @default(0)
  viewCount    Int       @default(0)

  createdAt    DateTime  @default(now())
  updatedAt    DateTime  @updatedAt
  paidAt       DateTime?

  transactions Transaction[]

  @@index([userId])
  @@index([status])
  @@index([shareUrl])
}

enum Plan {
  FREE
  PREMIUM
}

enum LinkStatus {
  PENDING
  PAID
  EXPIRED
  CANCELLED
  REFUNDED
}

enum ServiceCategory {
  SOFTWARE_DEVELOPMENT
  GRAPHIC_DESIGN
  CONTENT_WRITING
  DIGITAL_MARKETING
  VIDEO_EDITING
  CONSULTING
  COACHING
  OTHER
}

// ============================================================
// TRANSACTIONS
// ============================================================

model Transaction {
  id              String   @id @default(cuid())

  paymentLinkId   String
  paymentLink     PaymentLink @relation(fields: [paymentLinkId], references: [id], onDelete: Cascade)

  userId          String
  user            User     @relation(fields: [userId], references: [id], onDelete: Cascade)

  grossAmount     Int
  platformFee     Int      // Our 0.75%
  gatewayFee      Int      // aamarPay ~2.55%
  netAmount       Int
  currency        String   @default("BDT")

  status          TransactionStatus @default(PENDING)

  aamarPayTxnId   String?   @unique
  aamarPayPaymentType String?

  payerName       String?
  payerEmail      String?
  payerCardLast4  String?

  payoutStatus    PayoutStatus @default(PENDING)
  payoutId        String?
  payout          Payout?  @relation(fields: [payoutId], references: [id])

  refundedAt      DateTime?

  createdAt       DateTime  @default(now())
  updatedAt       DateTime  @updatedAt
  paidAt          DateTime?

  @@index([userId])
  @@index([paymentLinkId])
  @@index([status])
  @@index([aamarPayTxnId])
  @@index([createdAt])
}

enum TransactionStatus {
  PENDING
  PROCESSING
  SUCCESS
  FAILED
  REFUNDED
  DISPUTED
}

enum PayoutStatus {
  PENDING
  PROCESSING
  COMPLETED
  FAILED
}

// ============================================================
// PAYOUTS
// ============================================================

model Payout {
  id            String   @id @default(cuid())

  userId        String
  user          User     @relation(fields: [userId], references: [id], onDelete: Cascade)

  totalAmount   Int
  fee           Int      @default(0)
  netAmount     Int

  method        PayoutMethod @default(BKASH)

  status        PayoutStatus @default(PENDING)

  bkashTxnId    String?
  bankRef       String?

  transactionIds String[]

  createdAt     DateTime  @default(now())
  processedAt   DateTime?
  completedAt   DateTime?

  @@index([userId])
  @@index([status])
}

enum PayoutMethod {
  BKASH
  BANK
  NAGAD
}

// ============================================================
// WEBHOOK EVENTS (Idempotency)
// ============================================================

model WebhookEvent {
  id          String   @id @default(cuid())

  source      String
  eventId     String   @unique
  eventType   String

  payload     Json
  headers     Json?

  status      WebhookEventStatus @default(PENDING)
  processedAt DateTime?
  error       String?  @db.Text

  userId      String?

  createdAt   DateTime @default(now())

  @@index([eventId])
  @@index([status])
  @@index([createdAt])
}

enum WebhookEventStatus {
  PENDING
  PROCESSING
  PROCESSED
  FAILED
  DUPLICATE
}

// ============================================================
// AUDIT LOGS
// ============================================================

model AuditLog {
  id          String   @id @default(cuid())

  userId      String?
  user        User?    @relation(fields: [userId], references: [id])

  action      String
  entityType  String
  entityId    String?

  metadata    Json?

  ipAddress   String?
  userAgent   String?

  createdAt   DateTime @default(now())

  @@index([userId])
  @@index([entityType, entityId])
  @@index([createdAt])
}
```

---

## 3. API Design

### 3.1 API Response Format

```typescript
interface ApiResponse<T> {
  success: true;
  data: T;
  message?: string;
  meta?: {
    pagination?: PaginationMeta;
  };
}

interface ApiError {
  success: false;
  error: {
    code: string;
    message: string;
    details?: Record<string, string[]>;
  };
}
```

### 3.2 Authentication Endpoints

```
POST   /api/auth/register
POST   /api/auth/login
POST   /api/auth/logout
POST   /api/auth/forgot-password
POST   /api/auth/reset-password
GET    /api/auth/session
```

### 3.3 Payment Link Endpoints

```
GET    /api/payment-links              # List user's payment links
POST   /api/payment-links              # Create new payment link
GET    /api/payment-links/:id          # Get single payment link
PUT    /api/payment-links/:id          # Update payment link
DELETE /api/payment-links/:id          # Delete/cancel payment link
POST   /api/payment-links/:id/share   # Get share options
```

### 3.4 Public Payment Page

```
GET  /pay/:shareUrl                   # Public payment page (no auth)
POST /api/public/pay/:shareUrl        # Process payment
```

### 3.5 Transaction Endpoints

```
GET    /api/transactions               # List user's transactions
GET    /api/transactions/:id           # Get single transaction
```

### 3.6 Payout Endpoints

```
GET  /api/payouts                     # List payout history
GET  /api/payouts/balance             # Get available balance
POST /api/payouts/request             # Request manual payout
```

### 3.7 Webhook Endpoints

```
POST /api/webhooks/aamarpay           # aamarPay notifications
POST /api/webhooks/bkash              # bKash payout notifications
```

---

## 4. Directory Structure

```
linkpay-bd/
├── src/
│   ├── app/
│   │   ├── (auth)/                  # Auth routes
│   │   ├── (dashboard)/             # Protected dashboard
│   │   ├── (marketing)/             # Public pages
│   │   ├── (public)/               # Public payment pages
│   │   │   └── pay/[shareUrl]/     # Payment page
│   │   ├── api/                     # API Routes
│   │   │   ├── auth/
│   │   │   ├── payment-links/
│   │   │   ├── transactions/
│   │   │   ├── webhooks/
│   │   │   └── public/
│   │   └── admin/                   # Admin panel
│   ├── components/
│   │   ├── ui/                      # shadcn/ui components
│   │   ├── forms/                   # Form components
│   │   ├── payment/                 # Payment-specific
│   │   ├── dashboard/               # Dashboard widgets
│   │   └── layout/                  # Layout components
│   ├── lib/
│   │   ├── db.ts                   # Prisma client
│   │   ├── auth.ts                 # NextAuth config
│   │   ├── api/                    # API clients
│   │   │   ├── aamarpay.ts
│   │   │   └── bkash.ts
│   │   ├── utils.ts
│   │   └── validators.ts           # Zod schemas
│   ├── hooks/                      # Custom hooks
│   ├── types/                     # TypeScript types
│   ├── actions/                    # Server Actions
│   └── stores/                     # Zustand stores
├── prisma/
│   ├── schema.prisma
│   └── migrations/
├── public/
│   ├── icons/
│   └── images/
├── tests/
│   ├── unit/
│   └── e2e/
└── docs/
```

---

## 5. Environment Variables

```bash
# Database
DATABASE_URL=postgresql://user:password@host:5432/linkpay

# Auth (NextAuth v5)
NEXTAUTH_URL=https://linkpay.bd
NEXTAUTH_SECRET=

# aamarPay
AAMARPAY_STORE_ID=
AAMARPAY_KEY=
AAMARPAY_URL=https://www.aamarpay.com/api/v2
AAMARPAY_WEBHOOK_SECRET=

# bKash Payout
BKASH_USERNAME=
BKASH_PASSWORD=
BKASH_APP_KEY=
BKASH_APP_SECRET=
BKASH_BASE_URL=https://dev.kendolitec.com

# Email (Resend)
RESEND_API_KEY=
EMAIL_FROM=noreply@linkpay.bd

# SMS (Twilio)
TWILIO_ACCOUNT_SID=
TWILIO_AUTH_TOKEN=
TWILIO_PHONE_NUMBER=

# File Storage (Vercel Blob)
BLOB_READ_WRITE_TOKEN=

# Cache & Sessions
KV_REST_API_URL=
KV_REST_API_TOKEN=

# Monitoring
SENTRY_DSN=
POSTHOG_API_KEY=

# Application
NEXT_PUBLIC_APP_URL=https://linkpay.bd
PLATFORM_FEE_PERCENT=0.75
DEFAULT_LINK_EXPIRY_DAYS=7
```

---

## 6. Security Considerations

### Authentication & Authorization
- Session Strategy: JWT with database session
- Password: min 8 chars, 1 uppercase, 1 number, 1 special
- Rate Limiting: 5 login attempts per 15 min per IP

### API Security
- Rate Limiting with Upstash Redis
- CORS: Allow only linkpay.bd origins
- Security Headers: HSTS, X-Frame-Options, etc.
- Input Validation: Zod schemas on all inputs

### Payment Security
- Webhook Signature: HMAC-SHA256 verification
- Idempotency: Store event_id to prevent double-processing
- Transaction Atomicity: Prisma transactions for multi-step updates
- Amount Validation: Server-side validation against stored amount

### Data Protection
- Sensitive data (NID, bank accounts): AES-256-GCM encryption
- PII Minimization: Public pages show only name + initial
- Audit Logging: All sensitive operations logged

---

## 7. Deployment Strategy (Vercel + Hostinger)

### Infrastructure Overview

```
VERCEL (Primary Platform)
├── Edge Network (CDN, SSL, DDoS)
├── Serverless Functions (API Routes, ISR)
├── Blob Storage (documents)
├── KV (Sessions, Rate Limiting)
└── Cron Jobs

HOSTINGER (Bangladesh-Optimized)
├── Nginx Reverse Proxy (webhook forwarding)
├── BullMQ Worker (background jobs)
├── Redis (job queue)
└── Database Backups

NEON (Database)
├── Primary (Singapore)
├── Read Replicas
└── Branching (preview deployments)
```

### Deployment Pipeline

```
Push → GitHub Actions
  ├── Install & Lint
  ├── Type Check
  ├── Test
  ├── Preview Deploy (PR)
  └── Production Deploy (main)
```

### Critical Implementation Notes

1. **Webhook Handling**: Hostinger receives callbacks from aamarPay/bKash (Bangladesh IPs), forwards to Vercel
2. **Payout Processing**: BullMQ on Hostinger runs daily at 9 AM BDT
3. **Database**: Neon PostgreSQL with daily backups at 2 AM BDT
4. **RTO**: 4 hours | **RPO**: 24 hours

---

## Implementation Phases

### Phase 1: Foundation (Weeks 1-2)
1. Project setup: Next.js 15, Tailwind 4, shadcn/ui v2
2. Database schema: Prisma models
3. Authentication: NextAuth v5
4. Basic dashboard layout

### Phase 2: Core MVP (Weeks 3-4)
1. Payment link creation
2. Public payment page
3. aamarPay integration (sandbox)
4. Webhook handler

### Phase 3: Payouts (Weeks 5-6)
1. bKash payout API integration
2. BullMQ job queue
3. Payout dashboard
4. Email notifications

### Phase 4: Polish (Weeks 7-8)
1. Analytics dashboard
2. Mobile responsiveness
3. Beta testing with 100 users

---

*Last updated: March 2026*
