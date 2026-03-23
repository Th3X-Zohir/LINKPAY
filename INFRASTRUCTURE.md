# LinkPay BD - Complete Infrastructure Specification

> Self-hosted Docker infrastructure on bare metal
> Web-based (100% responsive, PWA-ready for future mobile app)
> Last updated: March 2026

---

## Table of Contents
1. [System Architecture](#1-system-architecture)
2. [Docker Setup](#2-docker-setup)
3. [Database Schema (Prisma)](#3-database-schema-prisma)
4. [API Design](#4-api-design)
5. [Directory Structure](#5-directory-structure)
6. [Environment Variables](#6-environment-variables)
7. [Security Considerations](#7-security-considerations)

---

## 1. System Architecture

### 1.1 High-Level Architecture (Self-Hosted)

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                              CLIENT LAYER                                    │
│  ┌─────────────────┐     ┌──────────────────┐     ┌─────────────────────┐ │
│  │   Mobile Web    │     │   Desktop Web    │     │   PWA Ready         │ │
│  │   (375px first) │     │   (Responsive)   │     │   (Future Mobile)   │ │
│  └────────┬────────┘     └────────┬─────────┘     └──────────┬──────────┘ │
└───────────┼─────────────────────────┼───────────────────────────┼────────────┘
            │                         │                            │
            └─────────────────────────┼────────────────────────────┘
                                      │ HTTPS
┌─────────────────────────────────────┴───────────────────────────────────────┐
│                              LOAD BALANCER / CDN                             │
│                         (Nginx with SSL Termination)                        │
└─────────────────────────────────────┬───────────────────────────────────────┘
                                      │
┌─────────────────────────────────────┴───────────────────────────────────────┐
│                         DOCKER SWARM / SINGLE SERVER                        │
│                           (Bare Metal - Your Server)                        │
│                                                                             │
│  ┌──────────────────────────────────────────────────────────────────────┐  │
│  │                        NGINX REVERSE PROXY                             │  │
│  │   ┌─────────────┐  ┌─────────────┐  ┌─────────────┐  ┌──────────┐ │  │
│  │   │ Frontend    │  │   API       │  │  Webhook    │  │ Static   │ │  │
│  │   │ (Next.js)   │  │  (Node.js)  │  │  Handler    │  │ Files    │ │  │
│  │   └─────────────┘  └─────────────┘  └─────────────┘  └──────────┘ │  │
│  └──────────────────────────────────────────────────────────────────────┘  │
│                                                                             │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐  ┌─────────────────┐   │
│  │ PostgreSQL  │  │   Redis     │  │  Worker     │  │   Caddy         │   │
│  │  Database   │  │  (Cache/Q) │  │  (BullMQ)   │  │   (SSL/Reverse) │   │
│  └─────────────┘  └─────────────┘  └─────────────┘  └─────────────────┘   │
└─────────────────────────────────────────────────────────────────────────────┘
```

### 1.2 Service Breakdown

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                         SINGLE SERVER SERVICES                              │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  NGINX (Reverse Proxy + Load Balancer)                                      │
│  ├── Port 80 (HTTP → HTTPS redirect)                                       │
│  ├── Port 443 (SSL termination)                                            │
│  ├── Rate limiting                                                         │
│  └── WebSocket support for real-time                                       │
│                                                                             │
│  ────────────────────────────────────────────────────────────────────────  │
│                                                                             │
│  CADDY (Alternative Reverse Proxy - Easier SSL)                             │
│  ├── Automatic HTTPS with Let's Encrypt                                    │
│  ├── Docker integration                                                    │
│  └── HTTP/3 support                                                        │
│                                                                             │
│  ────────────────────────────────────────────────────────────────────────  │
│                                                                             │
│  POSTGRESQL (Database)                                                     │
│  ├── Port 5432                                                             │
│  ├── Persistent volume                                                    │
│  ├── Daily backups to local storage                                        │
│  └── Connection pooling via PgBouncer                                       │
│                                                                             │
│  ────────────────────────────────────────────────────────────────────────  │
│                                                                             │
│  REDIS (Cache + Sessions + Queue)                                          │
│  ├── Port 6379                                                            │
│  ├── Persistent storage                                                    │
│  └── Used by BullMQ for job queue                                          │
│                                                                             │
│  ────────────────────────────────────────────────────────────────────────  │
│                                                                             │
│  NEXT.JS APP (Frontend + API)                                              │
│  ├── Containerized Next.js 15                                             │
│  ├── Server Components                                                     │
│  ├── API Routes                                                            │
│  └── Server Actions                                                        │
│                                                                             │
│  ────────────────────────────────────────────────────────────────────────  │
│                                                                             │
│  WORKER (Background Jobs)                                                  │
│  ├── BullMQ for job processing                                             │
│  ├── Payout processing (daily at 9 AM BDT)                                │
│  ├── Email queue                                                           │
│  └── Webhook retry logic                                                   │
│                                                                             │
│  ────────────────────────────────────────────────────────────────────────  │
│                                                                             │
│  FILE STORAGE (Local / MinIO for S3-compatible)                            │
│  ├── Document uploads                                                     │
│  └── Future: S3-compatible storage                                         │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

### 1.3 Payment Flow Architecture

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
   - Idempotency check (store event_id)
   - Update PaymentLink status: PENDING → PAID
   - Create Transaction record
   - Queue payout job in Redis/BullMQ

5. PAYOUT PROCESSING (Worker Container)
   Daily at 9:00 AM Bangladesh Time
   - Query all PAID transactions with PayoutStatus = PENDING
   - Group by user
   - Call bKash Payout API
   - Update statuses
```

---

## 2. Docker Setup

### 2.1 Docker Compose (Single Server)

```yaml
# docker-compose.yml
version: '3.9'

services:
  # ============================================================
  # REVERSE PROXY
  # ============================================================
  caddy:
    image: caddy:3-alpine
    container_name: linkpay-caddy
    restart: unless-stopped
    ports:
      - "80:80"
      - "443:443"
      - "443:443/udp"  # HTTP/3
    volumes:
      - ./caddy/data:/data
      - ./caddy/config:/config
      - ./Caddyfile:/etc/caddy/Caddyfile
      - ./public:/var/www/public
    networks:
      - linkpay-network
    depends_on:
      - app

  # ============================================================
  # POSTGRESQL DATABASE
  # ============================================================
  postgres:
    image: postgres:16-alpine
    container_name: linkpay-db
    restart: unless-stopped
    environment:
      POSTGRES_DB: linkpay
      POSTGRES_USER: ${POSTGRES_USER:-linkpay}
      POSTGRES_PASSWORD: ${POSTGRES_PASSWORD}
    volumes:
      - postgres_data:/var/lib/postgresql/data
      - ./backups:/backups
    networks:
      - linkpay-network
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U linkpay"]
      interval: 10s
      timeout: 5s
      retries: 5

  # ============================================================
  # REDIS (Cache + Sessions + Queue)
  # ============================================================
  redis:
    image: redis:7-alpine
    container_name: linkpay-redis
    restart: unless-stopped
    command: redis-server --appendonly yes --requirepass ${REDIS_PASSWORD}
    volumes:
      - redis_data:/data
    networks:
      - linkpay-network
    healthcheck:
      test: ["CMD", "redis-cli", "-a", "${REDIS_PASSWORD}", "ping"]
      interval: 10s
      timeout: 5s
      retries: 5

  # ============================================================
  # NEXT.JS APPLICATION
  # ============================================================
  app:
    build:
      context: .
      dockerfile: Dockerfile
    container_name: linkpay-app
    restart: unless-stopped
    environment:
      DATABASE_URL: postgresql://${POSTGRES_USER:-linkpay}:${POSTGRES_PASSWORD}@postgres:5432/linkpay
      REDIS_URL: redis://:${REDIS_PASSWORD}@redis:6379
      NODE_ENV: production
    volumes:
      - app_data:/app/.next
      - ./uploads:/app/uploads
    networks:
      - linkpay-network
    depends_on:
      postgres:
        condition: service_healthy
      redis:
        condition: service_healthy

  # ============================================================
  # WORKER (Background Jobs)
  # ============================================================
  worker:
    build:
      context: .
      dockerfile: Dockerfile.worker
    container_name: linkpay-worker
    restart: unless-stopped
    environment:
      DATABASE_URL: postgresql://${POSTGRES_USER:-linkpay}:${POSTGRES_PASSWORD}@postgres:5432/linkpay
      REDIS_URL: redis://:${REDIS_PASSWORD}@redis:6379
      NODE_ENV: production
    volumes:
      - ./uploads:/app/uploads
    networks:
      - linkpay-network
    depends_on:
      postgres:
        condition: service_healthy
      redis:
        condition: service_healthy

  # ============================================================
  # BACKUP SERVICE (Daily)
  # ============================================================
  backup:
    image: postgres:16-alpine
    container_name: linkpay-backup
    restart: unless-stopped
    environment:
      POSTGRES_HOST: postgres
      POSTGRES_DB: linkpay
      POSTGRES_USER: ${POSTGRES_USER:-linkpay}
      POSTGRES_PASSWORD: ${POSTGRES_PASSWORD}
      BACKUP_DIR: /backups
    volumes:
      - ./backups:/backups
      - ./scripts/backup.sh:/backup.sh
    networks:
      - linkpay-network
    depends_on:
      postgres:
        condition: service_healthy
    command: ["sh", "-c", "while true; do sh /backup.sh; sleep 86400; done"]

networks:
  linkpay-network:
    driver: bridge

volumes:
  postgres_data:
  redis_data:
  app_data:
```

### 2.2 Caddyfile (Reverse Proxy Configuration)

```caddy
# Caddyfile

# Production Domain
linkpay.bd, www.linkpay.bd {
    # Reverse proxy to Next.js app
    reverse_proxy app:3000

    # Static files
    handle_path /uploads/* {
        root * /var/www/public/uploads
        file_server
    }

    # Security headers
    header {
        X-Frame-Options "SAMEORIGIN"
        X-Content-Type-Options "nosniff"
        X-XSS-Protection "1; mode=block"
        Referrer-Policy "strict-origin-when-cross-origin"
        Permissions-Policy "camera=(), microphone=(), geolocation=()"
    }

    # Compression
    encode gzip zstd

    # Logging
    log {
        output file /var/log/caddy/linkpay.log
    }
}

# API Subdomain (optional)
api.linkpay.bd {
    reverse_proxy app:3000

    # Stricter rate limiting for API
    header {
        X-Frame-Options "DENY"
    }
}

# Webhook endpoints (Bangladesh IPs only - via nginx geo blocking)
webhooks.linkpay.bd {
    reverse_proxy app:3000

    # IP restriction can be handled via nginx in front or iptables
}

# Local development
localhost {
    reverse_proxy app:3000
    log {
        output file /var/log/caddy/local.log
    }
}
```

### 2.3 Dockerfile (Next.js App)

```dockerfile
# Dockerfile
FROM node:20-alpine AS base

# Install dependencies only when needed
FROM base AS deps
RUN apk add --no-cache libc6-compat
WORKDIR /app

COPY package.json package-lock.json* ./
RUN npm ci

# Rebuild the source code only when needed
FROM base AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .

# Generate Prisma client
RUN npx prisma generate

# Build the application
RUN npm run build

# Production image, copy all the files and run next
FROM base AS runner
WORKDIR /app

ENV NODE_ENV=production

RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

COPY --from=builder /app/public ./public

# Set the correct permission for prerender cache
RUN mkdir .next
RUN chown nextjs:nodejs .next

# Automatically leverage output traces to reduce image size
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static

USER nextjs

EXPOSE 3000

ENV PORT=3000
ENV HOSTNAME="0.0.0.0"

CMD ["node", "server.js"]
```

### 2.4 Dockerfile.worker (Background Jobs)

```dockerfile
# Dockerfile.worker
FROM node:20-alpine

WORKDIR /app

# Install dependencies
COPY package.json package-lock.json* ./
RUN npm ci --only=production

# Copy prisma schema
COPY prisma ./prisma

# Generate Prisma client
RUN npx prisma generate

# Copy worker code
COPY worker ./worker

# Run worker
CMD ["node", "worker/index.js"]
```

### 2.5 Nginx Configuration (Alternative - If Not Using Caddy)

```nginx
# /etc/nginx/conf.d/linkpay.conf

upstream linkpay_app {
    least_conn;
    server app:3000 max_fails=3 fail_timeout=30s;
}

server {
    listen 80;
    server_name linkpay.bd www.linkpay.bd;

    # Redirect to HTTPS
    return 301 https://$server_name$request_uri;
}

server {
    listen 443 ssl http2;
    server_name linkpay.bd www.linkpay.bd;

    # SSL Configuration
    ssl_certificate /etc/letsencrypt/live/linkpay.bd/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/linkpay.bd/privkey.pem;
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers ECDHE-ECDSA-AES128-GCM-SHA256:ECDHE-RSA-AES128-GCM-SHA256;
    ssl_prefer_server_ciphers off;

    # Security Headers
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header X-XSS-Protection "1; mode=block" always;
    add_header Referrer-Policy "strict-origin-when-cross-origin" always;

    # Gzip
    gzip on;
    gzip_types text/plain text/css application/json application/javascript text/xml application/xml;

    # Client max body size for file uploads
    client_max_body_size 10M;

    # Rate limiting zones
    limit_req_zone $binary_remote_addr zone=api_limit:10m rate=10r/s;
    limit_req_zone $binary_remote_addr zone=auth_limit:5r/s;

    # Location rules
    location / {
        limit_req zone=api_limit burst=20 nodelay;

        proxy_pass http://linkpay_app;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;

        # Timeouts
        proxy_connect_timeout 60s;
        proxy_send_timeout 60s;
        proxy_read_timeout 60s;
    }

    location /api/auth/login {
        limit_req zone=auth_limit burst=5 nodelay;

        proxy_pass http://linkpay_app;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
    }

    location /uploads/ {
        alias /var/www/public/uploads/;
        expires 1y;
        add_header Cache-Control "public, immutable";
    }
}
```

---

## 3. Database Schema (Prisma)

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

## 4. API Design

### 4.1 API Response Format

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

### 4.2 Endpoints

```
# Authentication
POST   /api/auth/register
POST   /api/auth/login
POST   /api/auth/logout
POST   /api/auth/forgot-password
POST   /api/auth/reset-password
GET    /api/auth/session

# Payment Links
GET    /api/payment-links
POST   /api/payment-links
GET    /api/payment-links/:id
PUT    /api/payment-links/:id
DELETE /api/payment-links/:id
POST   /api/payment-links/:id/share

# Public Payment Page
GET    /pay/:shareUrl
POST   /api/public/pay/:shareUrl

# Transactions
GET    /api/transactions
GET    /api/transactions/:id

# Payouts
GET    /api/payouts
GET    /api/payouts/balance
POST   /api/payouts/request

# Webhooks
POST   /api/webhooks/aamarpay
POST   /api/webhooks/bkash
```

---

## 5. Directory Structure

```
linkpay-bd/
├── src/
│   ├── app/
│   │   ├── (auth)/
│   │   ├── (dashboard)/
│   │   ├── (marketing)/
│   │   ├── (public)/
│   │   │   └── pay/[shareUrl]/
│   │   └── api/
│   ├── components/
│   │   ├── ui/
│   │   ├── forms/
│   │   ├── payment/
│   │   ├── dashboard/
│   │   └── layout/
│   ├── lib/
│   │   ├── db.ts
│   │   ├── auth.ts
│   │   ├── api/
│   │   ├── utils.ts
│   │   └── validators.ts
│   ├── hooks/
│   ├── types/
│   ├── actions/
│   └── stores/
├── worker/
│   ├── index.ts
│   ├── jobs/
│   │   ├── payout.ts
│   │   └── email.ts
│   └── processors/
├── prisma/
│   └── schema.prisma
├── docker/
│   ├── docker-compose.yml
│   ├── Dockerfile
│   ├── Dockerfile.worker
│   ├── Caddyfile
│   └── nginx.conf
├── scripts/
│   └── backup.sh
├── public/
├── uploads/
├── tests/
└── docs/
```

---

## 6. Environment Variables

```bash
# ============================================================
# DATABASE
# ============================================================
POSTGRES_USER=linkpay
POSTGRES_PASSWORD=your_secure_password_here
DATABASE_URL=postgresql://linkpay:your_secure_password_here@postgres:5432/linkpay

# ============================================================
# REDIS
# ============================================================
REDIS_PASSWORD=your_redis_password_here
REDIS_URL=redis://:your_redis_password_here@redis:6379

# ============================================================
# AUTHENTICATION
# ============================================================
NEXTAUTH_URL=https://linkpay.bd
NEXTAUTH_SECRET=your_nextauth_secret_here
# Generate with: openssl rand -base64 32

# ============================================================
# PAYMENT GATEWAY (aamarPay)
# ============================================================
AAMARPAY_STORE_ID=
AAMARPAY_KEY=
AAMARPAY_URL=https://www.aamarpay.com/api/v2
AAMARPAY_SANDBOX_URL=https://sandbox.aamarpay.com/api/v2
AAMARPAY_WEBHOOK_SECRET=

# ============================================================
# PAYOUT (bKash)
# ============================================================
BKASH_USERNAME=
BKASH_PASSWORD=
BKASH_APP_KEY=
BKASH_APP_SECRET=
BKASH_BASE_URL=https://dev.kendolitec.com

# ============================================================
# EMAIL (Resend)
# ============================================================
RESEND_API_KEY=
EMAIL_FROM=noreply@linkpay.bd

# ============================================================
# APPLICATION
# ============================================================
NEXT_PUBLIC_APP_URL=https://linkpay.bd
PLATFORM_FEE_PERCENT=0.75
DEFAULT_LINK_EXPIRY_DAYS=7
CRON_TIMEZONE=Asia/Dhaka
```

---

## 7. Security Considerations

### 7.1 Server Security

```bash
# Firewall (UFW)
ufw default deny incoming
ufw default allow outgoing
ufw allow ssh
ufw allow 80/tcp
ufw allow 443/tcp
ufw enable

# Fail2ban for SSH protection
apt install fail2ban

# Automatic security updates
apt install unattended-upgrades
dpkg-reconfigure -plow unattended-upgrades

# Docker security
# Ensure Docker daemon runs as non-root
# Use Docker's built-in seccomp profile
# Enable AppArmor/SELinux
```

### 7.2 SSL/TLS

```bash
# Using Let's Encrypt with Caddy (automatic)
# Caddy handles this automatically

# Or with Certbot (nginx)
certbot --nginx -d linkpay.bd -d www.linkpay.bd
```

### 7.3 Backup Strategy

```bash
# Daily backup script (scripts/backup.sh)
#!/bin/bash
DATE=$(date +%Y%m%d_%H%M%S)
BACKUP_DIR=/backups
POSTGRES_HOST=postgres
POSTGRES_DB=linkpay
POSTGRES_USER=linkpay

pg_dump -h $POSTGRES_HOST -U $POSTGRES_USER $POSTGRES_DB | gzip > $BACKUP_DIR/linkpay_$DATE.sql.gz

# Keep last 30 days
find $BACKUP_DIR -name "linkpay_*.sql.gz" -mtime +30 -delete

# Upload to remote storage (optional - S3/rclone)
rclone copy $BACKUP_DIR remote:linkpay-backups/
```

### 7.4 Docker Security Best Practices

```yaml
# Use specific version tags, not 'latest'
image: postgres:16-alpine

# Run as non-root user
USER nextjs

# Read-only root filesystem (where possible)
read_only: true

# Limit resources
deploy:
  resources:
    limits:
      cpus: '1'
      memory: 2G

# Scan images for vulnerabilities
docker scan linkpay-app
```

---

## 8. Deployment Checklist

### 8.1 Server Setup

- [ ] Install Ubuntu 22.04 LTS on bare metal
- [ ] Configure network (static IP)
- [ ] Set up DNS A record for linkpay.bd
- [ ] Install Docker & Docker Compose
- [ ] Configure firewall (UFW)
- [ ] Set up Fail2Ban
- [ ] Create Docker network

### 8.2 Application Deployment

- [ ] Clone repository to server
- [ ] Copy .env.production file
- [ ] Run `docker-compose build`
- [ ] Run `docker-compose up -d`
- [ ] Check logs: `docker-compose logs -f`
- [ ] Verify SSL certificate auto-issued
- [ ] Test payment link creation

### 8.3 Monitoring

- [ ] Set up Uptime Kuma (self-hosted monitoring)
- [ ] Configure log rotation
- [ ] Set up backup schedule
- [ ] Test backup restoration

---

*Last updated: March 2026*
