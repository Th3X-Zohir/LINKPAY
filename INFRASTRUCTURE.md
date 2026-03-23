# LinkPay BD - Infrastructure Specification

> **Version:** 1.0  
> **Date:** March 2026  
> **Status:** Draft for Review

---

## Executive Summary

LinkPay BD is a mobile-first payment link platform enabling Bangladeshi freelancers to accept international card payments with automatic settlement to bKash or bank accounts. This document specifies the complete technical infrastructure.

**Business Model:** Aggregator (one aamarPay merchant account) + Freemium  
**Platform Fee:** 0.75% per transaction  
**Premium:** ৳999/month

---

## 1. System Architecture

### 1.1 High-Level Architecture

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                              CLIENT LAYER                                     │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐  ┌─────────────────────┐│
│  │   Web App   │  │  Mobile PWA │  │  Dashboard  │  │   Admin Panel       ││
│  │  (Next.js)  │  │  (Next.js)  │  │  (Next.js)  │  │   (Next.js)         ││
│  └──────┬──────┘  └──────┬──────┘  └──────┬──────┘  └──────────┬──────────┘│
└─────────┼─────────────────┼─────────────────┼───────────────────┼───────────┘
          │                 │                 │                   │
          └────────────────┬┴─────────────────┴───────────────────┘
                           │ HTTPS
                           ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                              API GATEWAY                                     │
│  ┌─────────────────────────────────────────────────────────────────────────┐│
│  │                        Next.js API Routes /api/*                         ││
│  │  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────┐  ││
│  │  │   /auth  │  │ /payment │  │ /payout  │  │ /webhook │  │  /users  │  ││
│  │  │          │  │  -links  │  │          │  │          │  │          │  ││
│  │  └──────────┘  └──────────┘  └──────────┘  └──────────┘  └──────────┘  ││
│  └─────────────────────────────────────────────────────────────────────────┘│
└─────────────────────────────────────────────────────────────────────────────┘
          │                 │                 │                   │
          │                 │                 │                   │
          ▼                 ▼                 ▼                   ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                           SERVICE LAYER                                      │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐     │
│  │ Auth Service │  │ Payment Svc  │  │ Payout Svc  │  │ User Svc    │     │
│  │ (NextAuth)  │  │ (aamarPay)   │  │ (bKash API) │  │             │     │
│  └──────────────┘  └──────────────┘  └──────────────┘  └──────────────┘     │
│                                                                              │
│  ┌──────────────────────────────────────────────────────────────────────┐    │
│  │                      BullMQ Job Queue                                │    │
│  │  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐ │    │
│  │  │ Payout Job  │  │Webhook Job  │  │Email/SMS Job│  │Analytics Job│ │    │
│  │  └─────────────┘  └─────────────┘  └─────────────┘  └─────────────┘ │    │
│  └──────────────────────────────────────────────────────────────────────┘    │
└─────────────────────────────────────────────────────────────────────────────┘
          │                 │                 │                   │
          ▼                 ▼                 ▼                   ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                             DATA LAYER                                       │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐     │
│  │ PostgreSQL   │  │    Redis     │  │   MinIO/S3   │  │   Logger    │     │
│  │  (Primary)   │  │   (Cache)    │  │  (Documents) │  │  (Audit)    │     │
│  └──────────────┘  └──────────────┘  └──────────────┘  └──────────────┘     │
└─────────────────────────────────────────────────────────────────────────────┘
          │                                   │
          ▼                                   ▼
┌─────────────────────────────────┐  ┌─────────────────────────────────────────┐
│        EXTERNAL SERVICES         │  │           EXTERNAL SERVICES              │
│  ┌─────────────┐ ┌───────────┐  │  │  ┌─────────────┐ ┌─────────────────┐  │
│  │  aamarPay   │ │   bKash   │  │  │  │    SMTP     │ │      SMS        │  │
│  │  Gateway    │ │   Payout  │  │  │  │  (Resend)  │ │   (Twilio)     │  │
│  └─────────────┘ └───────────┘  │  │  └─────────────┘ └─────────────────┘  │
└─────────────────────────────────┘  └─────────────────────────────────────────┘
```

### 1.2 Technology Stack

| Layer | Technology | Justification |
|-------|------------|---------------|
| **Frontend** | Next.js 15 (App Router) | React 19, Server Components, Edge Runtime |
| **Styling** | Tailwind CSS 4 | CSS-first configuration, shadcn/ui |
| **UI Components** | shadcn/ui v2 | Accessible, customizable |
| **Icons** | Lucide React | Tree-shakeable, consistent |
| **Backend** | Next.js API Routes | Edge Runtime ready |
| **Database** | PostgreSQL 16 | ACID compliance for transactions |
| **ORM** | Prisma | Type-safe, migrations |
| **Cache** | Redis 7 | Session, rate limiting, job queue |
| **Auth** | NextAuth.js v5 | Better Auth |
| **State** | Zustand | Lightweight, simple |
| **Forms** | React Hook Form + Zod | Type-safe validation |
| **Queue** | BullMQ | Reliable background jobs |
| **Storage** | MinIO (S3-compatible) | Invoice PDFs, documents |
| **Email** | Resend | Transactional emails |
| **SMS** | Twilio | Bangladesh local SMS |
| **Hosting** | Self-hosted Docker | Not Vercel (bare metal) |
| **Reverse Proxy** | Caddy | Auto SSL |

---

## 2. Database Schema

### 2.1 Entity Relationship Diagram

```
┌─────────────┐       ┌─────────────────┐       ┌─────────────────┐
│    User     │       │  PaymentLink    │       │  Transaction    │
├─────────────┤       ├─────────────────┤       ├─────────────────┤
│ id          │──┐    │ id              │──┐    │ id              │
│ email       │  │    │ userId          │  │    │ paymentLinkId   │──┐
│ name        │  └───►│ amount          │  └───►│ userId          │  │
│ phone       │       │ description     │       │ amount          │  │
│ bkashNumber │       │ status          │       │ platformFee     │  │
│ bankAccount │       │ aamarPayId      │       │ gatewayFee      │  │
│ plan        │       │ shareUrl        │       │ netAmount       │  │
│ nid         │       │ expiresAt       │       │ status          │  │
│ tin         │       │ createdAt       │       │ aamarPayTxnId   │  │
│ createdAt   │       └─────────────────┘       │ payoutStatus    │  │
└─────────────┘                                 │ createdAt       │  │
      │                                         └─────────────────┘  │
      │                                                   │          │
      │                    ┌─────────────────┐             │          │
      │                    │     Payout      │◄────────────┘          │
      │                    ├─────────────────┤                       │
      └───►               │ id              │                       │
                          │ userId          │───────────────────────┘
                          │ transactionId   │
                          │ amount          │
                          │ method          │
                          │ status          │
                          │ bkashTxnId      │
                          │ processedAt     │
                          │ createdAt       │
                          └─────────────────┘
```

### 2.2 Prisma Schema

```prisma
// filepath: prisma/schema.prisma

generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

// ============ ENUMS ============

enum Plan {
  FREE
  PREMIUM
}

enum LinkStatus {
  PENDING
  PAID
  EXPIRED
  CANCELLED
}

enum TransactionStatus {
  PENDING
  SUCCESS
  FAILED
  REFUNDED
}

enum PayoutStatus {
  PENDING
  PROCESSING
  COMPLETED
  FAILED
}

enum PayoutMethod {
  BKASH
  BANK
}

enum AuditAction {
  USER_CREATED
  USER_UPDATED
  LOGIN
  PAYMENT_LINK_CREATED
  PAYMENT_LINK_SHARED
  TRANSACTION_CREATED
  TRANSACTION_SUCCESS
  TRANSACTION_FAILED
  PAYOUT_INITIATED
  PAYOUT_COMPLETED
  PAYOUT_FAILED
}

// ============ MODELS ============

model User {
  id            String    @id @default(cuid())
  email         String    @unique
  passwordHash  String?
  name          String?
  phone         String?   @unique
  bkashNumber   String?
  bankAccount   String?
  bankName      String?
  bankRouting   String?
  plan          Plan      @default(FREE)
  nid           String?   // Encrypted
  tin           String?   // Encrypted
  emailVerified DateTime?
  createdAt     DateTime  @default(now())
  updatedAt     DateTime  @updatedAt

  // Relations
  paymentLinks  PaymentLink[]
  transactions  Transaction[]
  payouts       Payout[]
  auditLogs     AuditLog[]
  sessions      Session[]

  @@index([email])
  @@index([phone])
}

model Session {
  id           String   @id @default(cuid())
  sessionToken String   @unique
  userId       String
  expires      DateTime
  createdAt    DateTime @default(now())

  user User @relation(fields: [userId], references: [id], onDelete: Cascade)

  @@index([sessionToken])
}

model PaymentLink {
  id             String    @id @default(cuid())
  userId         String
  amount         Int       // In poisha (100 poisha = 1 BDT)
  description     String    @db.VarChar(500)
  customerName   String?
  customerEmail  String?
  customerMobile String?
  status         LinkStatus @default(PENDING)
  aamarPayId    String?   @unique
  aamarPayUrl   String?
  shareUrl       String    @unique
  metadata       Json?
  expiresAt      DateTime?
  createdAt      DateTime  @default(now())
  updatedAt      DateTime  @updatedAt

  // Relations
  user         User          @relation(fields: [userId], references: [id], onDelete: Cascade)
  transactions Transaction[]

  @@index([userId])
  @@index([status])
  @@index([shareUrl])
}

model Transaction {
  id              String            @id @default(cuid())
  paymentLinkId   String
  userId          String
  amount          Int              // In poisha
  platformFee     Int              // Our 0.75%
  gatewayFee      Int              // aamarPay 2.55%
  netAmount       Int              // User receives
  status          TransactionStatus @default(PENDING)
  aamarPayTxnId   String?          @unique
  aamarPayData    Json?
  metadata        Json?
  processedAt     DateTime?
  createdAt       DateTime         @default(now())
  updatedAt       DateTime         @updatedAt

  // Relations
  paymentLink PaymentLink @relation(fields: [paymentLinkId], references: [id], onDelete: Cascade)
  user       User        @relation(fields: [userId], references: [id], onDelete: Cascade)
  payout     Payout?

  @@index([userId])
  @@index([status])
  @@index([aamarPayTxnId])
}

model Payout {
  id           String        @id @default(cuid())
  userId       String
  transactionId String        @unique
  amount       Int           // In poisha
  method       PayoutMethod
  status       PayoutStatus  @default(PENDING)
  bkashTxnId   String?
  bankTxnId    String?
  failureReason String?
  processedAt  DateTime?
  createdAt    DateTime      @default(now())
  updatedAt    DateTime      @updatedAt

  // Relations
  user       User        @relation(fields: [userId], references: [id], onDelete: Cascade)
  transaction Transaction @relation(fields: [transactionId], references: [id])

  @@index([userId])
  @@index([status])
}

model AuditLog {
  id        String      @id @default(cuid())
  userId    String?
  action    AuditAction
  entity    String?
  entityId  String?
  metadata  Json?
  ipAddress String?
  userAgent String?
  createdAt DateTime     @default(now())

  user User? @relation(fields: [userId], references: [id], onDelete: SetNull)

  @@index([userId])
  @@index([action])
  @@index([createdAt])
}
```

---

## 3. API Architecture

### 3.1 REST API Endpoints

```
Authentication
───────────────────────────────────────────────────────────────────────
POST   /api/auth/register          - Register new user
POST   /api/auth/login            - Login user
POST   /api/auth/logout           - Logout user
POST   /api/auth/refresh          - Refresh token
GET    /api/auth/session          - Get current session

Users
───────────────────────────────────────────────────────────────────────
GET    /api/users/me              - Get current user profile
PUT    /api/users/me              - Update profile
PUT    /api/users/me/password     - Change password
PUT    /api/users/me/bkash        - Update bKash number
PUT    /api/users/me/bank         - Update bank details
GET    /api/users/me/analytics    - Get user analytics

Payment Links
───────────────────────────────────────────────────────────────────────
GET    /api/payment-links          - List user's payment links
POST   /api/payment-links          - Create payment link
GET    /api/payment-links/:id      - Get payment link details
PUT    /api/payment-links/:id      - Update payment link
DELETE /api/payment-links/:id      - Delete payment link
POST   /api/payment-links/:id/share - Share payment link

Transactions
───────────────────────────────────────────────────────────────────────
GET    /api/transactions           - List transactions
GET    /api/transactions/:id       - Get transaction details

Payouts
───────────────────────────────────────────────────────────────────────
GET    /api/payouts                - List payouts
POST   /api/payouts/request        - Request payout
GET    /api/payouts/:id            - Get payout details

Webhooks (aamarPay)
───────────────────────────────────────────────────────────────────────
POST   /api/webhooks/aamarpay      - aamarPay payment webhook
POST   /api/webhooks/bkash        - bKash payout webhook

Admin (Protected)
───────────────────────────────────────────────────────────────────────
GET    /api/admin/users            - List all users
GET    /api/admin/transactions     - List all transactions
GET    /api/admin/payouts          - List all payouts
POST   /api/admin/payouts/process  - Manually process payout
```

### 3.2 API Response Format

```typescript
// Success Response
interface ApiResponse<T> {
  success: true;
  data: T;
  message?: string;
}

// Error Response
interface ApiError {
  success: false;
  error: {
    code: string;
    message: string;
    details?: Record<string, string[]>;
  };
}

// Paginated Response
interface PaginatedResponse<T> {
  success: true;
  data: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}
```

### 3.3 Error Codes

| Code | HTTP Status | Description |
|------|------------|-------------|
| `VALIDATION_ERROR` | 400 | Request validation failed |
| `UNAUTHORIZED` | 401 | Authentication required |
| `FORBIDDEN` | 403 | Insufficient permissions |
| `NOT_FOUND` | 404 | Resource not found |
| `CONFLICT` | 409 | Resource already exists |
| `RATE_LIMITED` | 429 | Too many requests |
| `INTERNAL_ERROR` | 500 | Server error |

---

## 4. Security Architecture

### 4.1 Security Principles

1. **Defense in Depth** — Multiple layers of security
2. **Zero Trust** — Never trust, always verify
3. **Least Privilege** — Minimal permissions
4. **Secure by Default** — Safe defaults

### 4.2 Authentication Flow

```
┌──────────┐     ┌──────────┐     ┌──────────┐     ┌──────────┐
│  Client  │────►│ NextAuth │────►│   DB     │────►│  JWT     │
│          │     │  Login   │     │ Sessions │     │  Token   │
└──────────┘     └──────────┘     └──────────┘     └──────────┘
     │                                                         │
     │         ┌──────────────────────────────────────────┐    │
     └────────►│              Protected Routes             │◄───┘
               │  1. Verify JWT                            │
               │  2. Check session in DB                  │
               │  3. Validate CSRF token                   │
               │  4. Rate limiting                         │
               └──────────────────────────────────────────┘
```

### 4.3 Data Encryption

| Data | At Rest | In Transit |
|------|---------|------------|
| User passwords | bcrypt (12 rounds) | TLS 1.3 |
| NID/TIN | AES-256-GCM | TLS 1.3 |
| API keys | AES-256-GCM | TLS 1.3 |
| Payment data | PCI-DSS vault | TLS 1.3 |
| Session tokens | Redis (encrypted) | HttpOnly cookie |

### 4.4 Webhook Security

```typescript
// aamarPay webhook verification
import crypto from 'crypto';

function verifyAamarPayWebhook(
  payload: unknown,
  signature: string,
  secret: string
): boolean {
  const expected = crypto
    .createHmac('sha256', secret)
    .update(JSON.stringify(payload))
    .digest('hex');
  
  return crypto.timingSafeEqual(
    Buffer.from(signature),
    Buffer.from(expected)
  );
}
```

### 4.5 Rate Limiting

| Endpoint | Limit | Window |
|----------|-------|--------|
| `/api/auth/*` | 10 | per minute |
| `/api/payment-links` | 30 | per minute |
| `/api/transactions` | 60 | per minute |
| `/api/payouts/request` | 5 | per hour |

---

## 5. Payment Flow

### 5.1 Payment Link Creation

```
User                    LinkPay API              aamarPay
  │                         │                       │
  │  POST /payment-links    │                       │
  │  {amount, desc, ...}    │                       │
  │────────────────────────►│                       │
  │                         │                       │
  │                         │  Create Payment Link  │
  │                         │──────────────────────►│
  │                         │                       │
  │                         │  {id, payment_url}    │
  │                         │◄─────────────────────│
  │                         │                       │
  │  {shareUrl, aamarPayId} │                       │
  │◄────────────────────────│                       │
  │                         │                       │
  │  Share via WhatsApp     │                       │
  │◄────────────────────────│                       │
```

### 5.2 Payment Completion

```
Client Browser           LinkPay              aamarPay              bKash
      │                     │                    │                    │
      │  Click link         │                    │                    │
      │────────────────────►│                    │                    │
      │                     │                    │                    │
      │  Redirect to        │                    │                    │
      │  aamarPay           │                    │                    │
      │◄────────────────────│                    │                    │
      │                     │                    │                    │
      │  Payment form       │                    │                    │
      │────────────────────│────────────────────►│                    │
      │                     │                    │                    │
      │  Enter card         │                    │                    │
      │  details            │                    │                    │
      │────────────────────│────────────────────►│                    │
      │                     │                    │      Process       │
      │                     │                    │◄──────────────────►│
      │                     │                    │                    │
      │                     │   Webhook: payment │
      │                     │   status           │
      │                     │◄───────────────────│                    │
      │                     │                    │                    │
      │                     │   Update DB        │
      │                     │   (transaction)   │
      │                     │                    │                    │
      │  Redirect to        │                    │                    │
      │  success page       │                    │                    │
      │◄────────────────────│                    │                    │
      │                     │                    │                    │
      │                     │   Trigger payout   │
      │                     │────────────────────│                    │
      │                     │                    │      bKash payout  │
      │                     │                    │◄─────────────────  │
      │                     │                    │                    │
```

### 5.3 Payout Flow

```
Transaction Success     Job Queue          bKash API            User
        │                   │                  │                  │
        │  Job triggered    │                  │                  │
        │◄──────────────────│                  │                  │
        │                   │                  │                  │
        │                   │  Initiate payout │                  │
        │                   │─────────────────►│                  │
        │                   │                  │                  │
        │                   │  {bkash_txn_id}  │                  │
        │                   │◄─────────────────│                  │
        │                   │                  │                  │
        │                   │  Update DB       │                  │
        │                   │  (payout status)  │                  │
        │                   │                  │                  │
        │                   │                  │  BDT credited     │
        │                   │                  │◄─────────────────│
        │                   │                  │                  │
        │  Notify user      │                  │                  │
        │◄──────────────────│                  │                  │
        │                   │                  │                  │
```

---

## 6. Infrastructure

### 6.1 Docker Compose Setup

```yaml
# filepath: docker-compose.yml

version: '3.8'

services:
  # Frontend/Backend
  app:
    build: .
    ports:
      - "3000:3000"
    environment:
      - DATABASE_URL=postgresql://postgres:${POSTGRES_PASSWORD}@db:5432/linkpay
      - REDIS_URL=redis://redis:6379
      - NEXTAUTH_SECRET=${NEXTAUTH_SECRET}
    depends_on:
      - db
      - redis
    restart: unless-stopped

  # Database
  db:
    image: postgres:16-alpine
    volumes:
      - postgres_data:/var/lib/postgresql/data
    environment:
      - POSTGRES_USER=postgres
      - POSTGRES_PASSWORD=${POSTGRES_PASSWORD}
      - POSTGRES_DB=linkpay
    restart: unless-stopped

  # Cache & Queue
  redis:
    image: redis:7-alpine
    volumes:
      - redis_data:/data
    restart: unless-stopped

  # Reverse Proxy with Auto-SSL
  caddy:
    image: caddy:2-alpine
    ports:
      - "80:80"
      - "443:443"
    volumes:
      - ./Caddyfile:/etc/caddy/Caddyfile
      - caddy_data:/data
    depends_on:
      - app
    restart: unless-stopped

  # Optional: MinIO for file storage
  minio:
    image: minio/minio
    ports:
      - "9000:9000"
      - "9001:9001"
    environment:
      - MINIO_ROOT_USER=${MINIO_USER}
      - MINIO_ROOT_PASSWORD=${MINIO_PASSWORD}
    volumes:
      - minio_data:/data
    command: server /data --console-address ":9001"
    restart: unless-stopped

volumes:
  postgres_data:
  redis_data:
  caddy_data:
  minio_data:
```

### 6.2 Caddy Configuration

```caddy
# filepath: Caddyfile

linkpay.bd {
    reverse_proxy app:3000
    tls {
        dns cloudflare {env.CLOUDFLARE_API_TOKEN}
    }
}

api.linkpay.bd {
    reverse_proxy app:3000
    tls {
        dns cloudflare {env.CLOUDFLARE_API_TOKEN}
    }
}
```

### 6.3 Environment Variables

```bash
# .env.example

# Database
DATABASE_URL=postgresql://postgres:password@localhost:5432/linkpay

# Redis
REDIS_URL=redis://localhost:6379

# Auth
NEXTAUTH_URL=https://linkpay.bd
NEXTAUTH_SECRET=your-secret-here

# aamarPay
AAMARPAY_STORE_ID=your-store-id
AAMARPAY_KEY=your-key
AAMARPAY_URL=https://sandbox.aamarpay.com
AAMARPAY_SIGNATURE_KEY=your-signature-key

# bKash
BKASH_USERNAME=your-username
BKASH_PASSWORD=your-password
BKASH_APP_KEY=your-app-key
BKASH_APP_SECRET=your-app-secret
BKASH_URL=https://checkout.pay.bka.sh/v1.2

# Email (Resend)
RESEND_API_KEY=re_xxxxx

# SMS (Twilio)
TWILIO_ACCOUNT_SID=xxx
TWILIO_AUTH_TOKEN=xxx
TWILIO_PHONE_NUMBER=+1234567890

# Storage (MinIO)
MINIO_ENDPOINT=localhost:9000
MINIO_ACCESS_KEY=xxx
MINIO_SECRET_KEY=xxx
MINIO_BUCKET=linkpay

# Cloudflare (for DNS)
CLOUDFLARE_API_TOKEN=xxx
```

---

## 7. Monitoring & Observability

### 7.1 Logging Strategy

```typescript
// Structured logging with Winston
import winston from 'winston';

export const logger = winston.createLogger({
  level: process.env.LOG_LEVEL || 'info',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.json()
  ),
  transports: [
    new winston.transports.Console(),
    new winston.transports.File({ filename: 'logs/error.log', level: 'error' }),
    new winston.transports.File({ filename: 'logs/combined.log' }),
  ],
});
```

### 7.2 Metrics to Track

| Metric | Description | Alert Threshold |
|--------|-------------|-----------------|
| Payment Success Rate | % of successful payments | < 95% |
| Payout Success Rate | % of successful payouts | < 98% |
| API Latency | p95 response time | > 500ms |
| Error Rate | 5xx errors / total requests | > 1% |
| Queue Depth | Pending jobs | > 100 |
| DB Connections | Active connections | > 80% pool |

### 7.3 Health Checks

```
GET /api/health          - Basic health
GET /api/health/ready    - Readiness (DB, Redis, External APIs)
GET /api/health/live     - Liveness
```

---

## 8. Acceptance Criteria

### 8.1 MVP Features

| Feature | Priority | Status |
|---------|----------|--------|
| User registration/login | P0 | ⬜ |
| Payment link creation | P0 | ⬜ |
| aamarPay integration | P0 | ⬜ |
| Webhook handling | P0 | ⬜ |
| bKash payout | P0 | ⬜ |
| Transaction history | P1 | ⬜ |
| Dashboard analytics | P1 | ⬜ |
| Share via WhatsApp | P1 | ⬜ |
| Email notifications | P2 | ⬜ |

### 8.2 Non-Functional Requirements

| Requirement | Target |
|-------------|--------|
| Availability | 99.9% |
| Payment processing | < 5s |
| Page load (LCP) | < 2.5s |
| Mobile-first | 375px support |
| Security | PCI-DSS Level 4 |

---

## 9. Future Considerations

### 9.2 Year 2+ Features

- Multiple payout methods (Nagad, Rocket)
- White-label for agencies
- Mobile app (React Native)
- Tax report generation (NBR compliance)
- Client portal

### 9.2 Scalability

- Database sharding at 10,000 users
- Read replicas for analytics
- CDN for static assets
- Kubernetes for orchestration

---

*Document maintained by: Software Architect*  
*Next review: Before MVP launch*
