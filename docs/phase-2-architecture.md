# LinkPay BD - Phase 2 Technical Architecture

> **Document Version:** 1.0  
> **Date:** March 24, 2026  
> **Author:** Software Architect Agent  
> **Status:** Ready for Software Engineer Handoff

---

## Executive Summary

Phase 2 extends the MVP with complete payout functionality, admin operations, and enhanced security. The architecture prioritizes **transaction integrity**, **regulatory compliance** (NID/TIN encryption), and **operational visibility** (audit logs).

---

## Database Schema Changes

### Overview of Changes

| Model | Change Type | Reason |
|-------|-------------|--------|
| `User` | Add encrypted fields | NID/TIN compliance |
| `User` | Add `isAdmin` flag | Admin authorization |
| `Payout` | Add admin approval fields | Approval workflow |
| `AuditLog` | Expand actions | Full audit trail |
| `Invoice` | New model | PDF invoice storage |

### Complete Updated Schema

```prisma
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
  PENDING        // Awaiting admin approval
  APPROVED       // Admin approved, awaiting processing
  PROCESSING     // bKash/Bank API called
  COMPLETED      // Funds sent successfully
  REJECTED       // Admin rejected
  FAILED         // API or processing error
  CANCELLED      // User cancelled
}

enum PayoutMethod {
  BKASH
  BANK
  BANK_TRANSFER
}

enum AuditAction {
  // User actions
  USER_CREATED
  USER_LOGIN
  USER_LOGOUT
  USER_PROFILE_UPDATED
  USER_PASSWORD_CHANGED
  USER_PAYOUT_METHOD_UPDATED
  
  // Payment link actions
  PAYMENT_LINK_CREATED
  PAYMENT_LINK_UPDATED
  PAYMENT_LINK_CANCELLED
  PAYMENT_LINK_DELETED
  PAYMENT_LINK_SHARED
  
  // Transaction actions
  TRANSACTION_CREATED
  TRANSACTION_SUCCESS
  TRANSACTION_FAILED
  TRANSACTION_REFUNDED
  
  // Payout actions
  PAYOUT_REQUESTED
  PAYOUT_APPROVED
  PAYOUT_REJECTED
  PAYOUT_INITIATED
  PAYOUT_COMPLETED
  PAYOUT_FAILED
  PAYOUT_CANCELLED
  
  // Admin actions
  ADMIN_USER_SUSPENDED
  ADMIN_USER_UNSUSPENDED
  ADMIN_PLAN_CHANGED
  ADMIN_SETTINGS_CHANGED
}

// ============ MODELS ============

model User {
  id            String    @id @default(cuid())
  email         String    @unique
  passwordHash  String?
  name          String?
  phone         String?   @unique
  plan          Plan      @default(FREE)
  isAdmin       Boolean   @default(false)
  
  // Payout details (encrypted at application layer)
  bkashNumber   String?   // Encrypted
  bankAccount   String?   // Encrypted
  bankName      String?
  bankRouting   String?   // Encrypted
  
  // Sensitive data (encrypted at application layer)
  nid           String?   // Encrypted - National ID
  tin           String?   // Encrypted - Tax ID
  
  // Verification status
  emailVerified DateTime?
  bkashVerified Boolean   @default(false)
  bankVerified  Boolean   @default(false)
  
  // Security
  failedLoginAttempts Int      @default(0)
  lockedUntil         DateTime?
  
  createdAt     DateTime  @default(now())
  updatedAt     DateTime  @updatedAt

  paymentLinks  PaymentLink[]
  transactions  Transaction[]
  payouts       Payout[]
  auditLogs     AuditLog[]
  sessions      Session[]
  invoices      Invoice[]

  @@index([email])
  @@index([phone])
  @@index([plan])
  @@index([isAdmin])
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
  amount         Int
  description    String    @db.VarChar(500)
  customerName   String?
  customerEmail  String?
  customerMobile String?
  status         LinkStatus @default(PENDING)
  aamarPayId     String?
  aamarPayUrl    String?
  shareUrl       String    @unique
  expiresAt      DateTime?
  paidAt         DateTime?
  createdAt      DateTime  @default(now())
  updatedAt      DateTime  @updatedAt

  user         User          @relation(fields: [userId], references: [id], onDelete: Cascade)
  transactions Transaction[]

  @@index([userId])
  @@index([shareUrl])
  @@index([status])
}

model Transaction {
  id              String            @id @default(cuid())
  paymentLinkId   String
  userId          String
  amount          Int
  platformFee     Int
  gatewayFee      Int
  netAmount       Int
  status          TransactionStatus @default(PENDING)
  aamarPayTxnId   String?
  aamarPayFees    String?
  metadata        String?
  payoutStatus    PayoutStatus      @default(PENDING)
  payoutId        String?
  createdAt       DateTime          @default(now())
  updatedAt       DateTime          @updatedAt

  paymentLink PaymentLink @relation(fields: [paymentLinkId], references: [id], onDelete: Cascade)
  user       User        @relation(fields: [userId], references: [id], onDelete: Cascade)
  payout     Payout?     @relation(fields: [payoutId], references: [id], onDelete: SetNull)

  @@index([paymentLinkId])
  @@index([userId])
  @@index([status])
  @@index([payoutStatus])
  @@index([createdAt])
}

model Payout {
  id          String       @id @default(cuid())
  userId      String
  amount      Int
  method      PayoutMethod
  status      PayoutStatus @default(PENDING)
  
  // Admin tracking
  approvedBy  String?
  approvedAt  DateTime?
  rejectReason String?
  
  // External references
  bkashTxnId  String?
  bankTxnId   String?
  
  // Processing details
  processedAt DateTime?
  failureMsg  String?
  
  // Transaction linkage
  transactions Transaction[]
  
  createdAt   DateTime     @default(now())
  updatedAt   DateTime     @updatedAt

  user        User         @relation(fields: [userId], references: [id], onDelete: Cascade)
  approver    User?        @relation("PayoutApprover", fields: [approvedBy], references: [id], onDelete: SetNull)

  @@index([userId])
  @@index([status])
  @@index([approvedBy])
  @@index([createdAt])
}

// Relation for approver
model Payout @relation("PayoutApprover", ...) {
  // ...fields
  approver    User?        @relation("PayoutApprover", fields: [approvedBy], references: [id], onDelete: SetNull)
}

model Invoice {
  id          String   @id @default(cuid())
  userId      String
  invoiceNo   String   @unique
  transactionId String?
  amount      Int
  status      String   @default("GENERATED")
  pdfUrl      String?
  createdAt   DateTime @default(now())

  user        User     @relation(fields: [userId], references: [id], onDelete: Cascade)

  @@index([userId])
  @@index([invoiceNo])
}

model WebhookEvent {
  id          String   @id @default(cuid())
  eventId     String   @unique
  eventType   String
  payload     Json
  processed   Boolean  @default(false)
  processedAt DateTime?
  createdAt   DateTime @default(now())

  @@index([eventId])
  @@index([processed])
}

model AuditLog {
  id        String     @id @default(cuid())
  userId    String?
  action    AuditAction
  details   Json?
  ipAddress String?
  userAgent String?
  createdAt DateTime   @default(now())

  user User? @relation(fields: [userId], references: [id], onDelete: SetNull)

  @@index([userId])
  @@index([action])
  @@index([createdAt])
}
```

---

## Feature 1: Public Payment Page (`/pay/[shareUrl]`)

### Architecture

```
┌─────────────┐     ┌──────────────┐     ┌─────────────┐
│   Client    │────▶│  Next.js     │────▶│  aamarPay    │
│   Browser   │◀────│  Server      │◀────│  Gateway     │
└─────────────┘     └──────────────┘     └─────────────┘
                           │
                           ▼
                    ┌──────────────┐
                    │  PostgreSQL   │
                    └──────────────┘
```

### Data Flow

1. **Page Load (GET `/pay/[shareUrl]`)**
   - Server Component fetches PaymentLink by `shareUrl`
   - Validates link status (must be PENDING)
   - Returns merchant info + amount to display

2. **Payment Initiation (POST `/api/public/pay/init`)**
   - Validates payment link exists and is PENDING
   - Creates aamarPay payment session
   - Updates PaymentLink with `aamarPayId`
   - Returns `payment_url` for redirect

3. **Return URL Handling**
   - Success: Show confirmation, transaction details
   - Cancel: Show cancellation message with retry option
   - Fail: Show failure reason with retry option

4. **Webhook Processing** (existing, enhanced)
   - Verify signature
   - Idempotency check via `WebhookEvent`
   - Update PaymentLink status → PAID
   - Create Transaction record
   - Trigger payout eligibility check

### API Endpoints

| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| GET | `/api/public/pay/[shareUrl]` | Get payment page data | None |
| POST | `/api/public/pay/init` | Initialize aamarPay payment | None |

### Request/Response Schemas

```typescript
// GET /api/public/pay/[shareUrl]
interface GetPaymentPageResponse {
  success: true;
  data: {
    merchantName: string;
    merchantEmail: string;
    amount: number;
    description: string;
    status: 'PENDING' | 'PAID' | 'EXPIRED';
    customerName?: string;
  };
}

// POST /api/public/pay/init
interface InitPaymentRequest {
  shareUrl: string;
  customerName?: string;
  customerEmail?: string;
  customerMobile?: string;
}

interface InitPaymentResponse {
  success: true;
  data: {
    paymentUrl: string;
    paymentId: string;
  };
}
```

### Security Considerations

- Rate limit public endpoints (10 req/min per IP)
- Validate `shareUrl` format (CUID length)
- Verify PaymentLink belongs to active user
- Log all payment initiation attempts

---

## Feature 2: User Settings & Payout Configuration

### API Endpoints

| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| GET | `/api/users/profile` | Get user profile | Session |
| PUT | `/api/users/profile` | Update profile | Session |
| PUT | `/api/users/payout-methods` | Update payout details | Session |
| POST | `/api/users/verify-password` | Re-authenticate | Session |
| GET | `/api/users/balance` | Get available balance | Session |

### Request/Response Schemas

```typescript
// PUT /api/users/profile
interface UpdateProfileRequest {
  name?: string;
  businessName?: string;
  phone?: string;
}

interface UpdateProfileResponse {
  success: true;
  data: {
    id: string;
    name: string;
    email: string;
    phone: string;
  };
}

// PUT /api/users/payout-methods
interface UpdatePayoutMethodsRequest {
  bkashNumber?: string;      // Encrypted at rest
  bankAccount?: string;      // Encrypted at rest
  bankName?: string;
  bankRouting?: string;       // Encrypted at rest
  password: string;          // Required for sensitive changes
}

interface UpdatePayoutMethodsResponse {
  success: true;
  data: {
    bkashVerified: boolean;
    bankVerified: boolean;
    message: string;
  };
}

// GET /api/users/balance
interface GetBalanceResponse {
  success: true;
  data: {
    availableBalance: number;    // Net amount available for payout
    pendingPayouts: number;      // Amount in pending payouts
    totalEarnings: number;       // Lifetime net earnings
    currency: 'BDT';
  };
}
```

### Key Functions

```typescript
// src/lib/encryption.ts
export function encryptSensitiveData(data: string): string
export function decryptSensitiveData(encrypted: string): string
export function maskFinancialData(data: string, visibleDigits: number): string

// src/lib/payout.ts
export async function calculateUserBalance(userId: string): Promise<BalanceInfo>
export async function getEligibleForPayout(userId: string): Promise<number>
```

### Security Considerations

- **Encryption**: AES-256-GCM for NID, TIN, bank account, bKash number
- **Key Management**: Use `ENCRYPTION_KEY` env var, rotate annually
- **Re-authentication**: Required for payout method changes
- **Masking**: Display only last 4 digits of financial data
- **Audit Logging**: Log all payout method changes

---

## Feature 3: bKash Payout System

### Payout Flow

```
┌─────────┐    ┌─────────────┐    ┌─────────────┐    ┌─────────┐
│ User    │───▶│ Create      │───▶│ Admin       │───▶│ Process │
│ Request │    │ Payout      │    │ Approve     │    │ Payout  │
└─────────┘    └─────────────┘    └─────────────┘    └─────────┘
                    │                                       │
                    ▼                                       ▼
              ┌─────────────┐                        ┌─────────────┐
              │ Calculate   │                        │ bKash API    │
              │ Balance     │                        │ Disbursement │
              └─────────────┘                        └─────────────┘
```

### Payout Status State Machine

```
PENDING ──▶ APPROVED ──▶ PROCESSING ──▶ COMPLETED
    │            │
    │            └──▶ REJECTED
    │
    └──▶ CANCELLED
              │
              └──▶ FAILED
```

### API Endpoints

| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| GET | `/api/payouts` | List user payouts | Session |
| POST | `/api/payouts` | Request payout | Session |
| GET | `/api/payouts/[id]` | Get payout details | Session |
| POST | `/api/payouts/[id]/cancel` | Cancel payout | Session |
| GET | `/api/admin/payouts` | List all payouts | Admin |
| POST | `/api/admin/payouts/[id]/approve` | Approve payout | Admin |
| POST | `/api/admin/payouts/[id]/reject` | Reject payout | Admin |
| POST | `/api/admin/payouts/[id]/process` | Process payout | Admin |

### Request/Response Schemas

```typescript
// POST /api/payouts - Request Payout
interface CreatePayoutRequest {
  amount: number;
  method: 'BKASH' | 'BANK';
}

interface CreatePayoutResponse {
  success: true;
  data: {
    id: string;
    amount: number;
    method: string;
    status: 'PENDING';
    estimatedCompletion: string; // ISO date
    message: string;
  };
}

// POST /api/admin/payouts/[id]/approve
interface ApprovePayoutRequest {
  adminPassword: string; // Re-verify admin
}

// POST /api/admin/payouts/[id]/reject
interface RejectPayoutRequest {
  reason: string; // Required, shown to user
}
```

### Key Functions

```typescript
// src/lib/payout.ts

interface PayoutResult {
  success: boolean;
  transactionId?: string;
  error?: string;
}

export async function createPayoutRequest(
  userId: string,
  amount: number,
  method: PayoutMethod
): Promise<Payout>

export async function approvePayout(
  payoutId: string,
  adminId: string
): Promise<Payout>

export async function processPayout(
  payoutId: string
): Promise<PayoutResult>

export async function cancelPayout(
  payoutId: string,
  userId: string
): Promise<Payout>

export async function linkTransactionsToPayout(
  payoutId: string,
  userId: string
): Promise<void>

// Balance calculation
export async function calculateUserBalance(userId: string): Promise<{
  available: number;
  pending: number;
  total: number;
}> {
  // available = SUM(netAmount) WHERE userId AND payoutStatus != COMPLETED
  // pending = SUM(netAmount) WHERE payoutStatus = 'PENDING' or 'PROCESSING'
}
```

### bKash Integration

```typescript
// src/lib/api/bkash.ts - Additions

export async function processBkashDisbursement(
  payout: Payout,
  user: User
): Promise<{ trxId: string }> {
  // 1. Get bKash token (cached)
  // 2. Initiate disbursement
  // 3. Store transaction ID
  // 4. Return result
}

export async function verifyBkashNumber(number: string): Promise<boolean> {
  // Optional: bKash has verification API
  // For now, format validation only
  return /^01[3-9]\d{8}$/.test(number);
}
```

### Security Considerations

- **Admin verification**: All admin payout actions require password re-entry
- **Idempotency**: Prevent duplicate payout processing
- **Balance validation**: Cannot request more than available
- **Transaction locking**: Lock transactions when linking to payout
- **Webhook retry**: bKash may retry webhooks, handle gracefully

---

## Feature 4: Admin Panel Architecture

### Admin Dashboard Metrics

```typescript
interface PlatformMetrics {
  // User metrics
  totalUsers: number;
  newUsersToday: number;
  newUsersThisMonth: number;
  premiumUsers: number;
  
  // Transaction metrics
  totalTransactionVolume: number;      // All time
  transactionVolumeToday: number;
  transactionVolumeThisMonth: number;
  successfulTransactions: number;
  failedTransactions: number;
  
  // Payout metrics
  totalPayoutsPending: number;
  totalPayoutsProcessing: number;
  totalPayoutsCompleted: number;
  totalPayoutAmount: number;
  
  // Revenue metrics
  platformRevenue: number;             // Sum of platform fees
  revenueToday: number;
  revenueThisMonth: number;
  
  // Time-series for charts
  transactionVolumeHistory: TimeSeriesData[];
  userGrowthHistory: TimeSeriesData[];
}
```

### API Endpoints

| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| GET | `/api/admin/analytics/dashboard` | Dashboard metrics | Admin |
| GET | `/api/admin/analytics/transactions` | Transaction analytics | Admin |
| GET | `/api/admin/analytics/users` | User analytics | Admin |
| GET | `/api/admin/users` | List users (paginated) | Admin |
| GET | `/api/admin/users/[id]` | Get user details | Admin |
| PUT | `/api/admin/users/[id]` | Update user | Admin |
| POST | `/api/admin/users/[id]/suspend` | Suspend user | Admin |
| POST | `/api/admin/users/[id]/unsuspend` | Unsuspend user | Admin |
| GET | `/api/admin/payouts` | List all payouts | Admin |
| GET | `/api/admin/payouts/[id]` | Payout details | Admin |
| POST | `/api/admin/payouts/[id]/approve` | Approve payout | Admin |
| POST | `/api/admin/payouts/[id]/reject` | Reject payout | Admin |
| GET | `/api/admin/audit-logs` | Search audit logs | Admin |

### User Management

```typescript
interface AdminUserResponse {
  id: string;
  email: string;
  name: string;
  phone: string;
  plan: 'FREE' | 'PREMIUM';
  isAdmin: boolean;
  isSuspended: boolean;
  bkashVerified: boolean;
  bankVerified: boolean;
  balance: {
    available: number;
    pending: number;
  };
  stats: {
    totalLinks: number;
    totalTransactions: number;
    totalPayouts: number;
  };
  createdAt: string;
  lastLogin: string;
}
```

### Payout Management

```typescript
interface AdminPayoutResponse {
  id: string;
  userId: string;
  userEmail: string;
  userName: string;
  amount: number;
  method: 'BKASH' | 'BANK';
  status: PayoutStatus;
  bkashTxnId?: string;
  bankTxnId?: string;
  approvedBy?: string;
  approvedAt?: string;
  rejectReason?: string;
  failureMsg?: string;
  transactions: string[]; // IDs linked
  createdAt: string;
  processedAt?: string;
}
```

### Key Functions

```typescript
// src/lib/admin.ts - Additions

export async function getPlatformMetrics(
  period: 'today' | 'week' | 'month' | 'year' | 'all'
): Promise<PlatformMetrics>

export async function suspendUser(userId: string, adminId: string): Promise<void>

export async function unsuspendUser(userId: string, adminId: string): Promise<void>

export async function changeUserPlan(
  userId: string,
  newPlan: Plan,
  adminId: string
): Promise<void>
```

### Security Considerations

- **Admin authentication**: Separate admin-only session
- **Action logging**: All admin actions logged with admin ID
- **Re-verification**: Sensitive actions require password
- **Rate limiting**: Admin endpoints more restrictive
- **Audit trail**: Full visibility into admin actions

---

## Feature 5: Audit Logging System

### Audit Events

| Category | Events |
|----------|--------|
| Authentication | `USER_LOGIN`, `USER_LOGOUT`, `LOGIN_FAILED` |
| Profile | `USER_PROFILE_UPDATED`, `USER_PASSWORD_CHANGED` |
| Payout Methods | `USER_PAYOUT_METHOD_UPDATED` |
| Payment Links | `PAYMENT_LINK_CREATED`, `PAYMENT_LINK_UPDATED`, `PAYMENT_LINK_CANCELLED`, `PAYMENT_LINK_DELETED`, `PAYMENT_LINK_SHARED` |
| Transactions | `TRANSACTION_CREATED`, `TRANSACTION_SUCCESS`, `TRANSACTION_FAILED`, `TRANSACTION_REFUNDED` |
| Payouts | `PAYOUT_REQUESTED`, `PAYOUT_APPROVED`, `PAYOUT_REJECTED`, `PAYOUT_INITIATED`, `PAYOUT_COMPLETED`, `PAYOUT_FAILED`, `PAYOUT_CANCELLED` |
| Admin | `ADMIN_USER_SUSPENDED`, `ADMIN_USER_UNSUSPENDED`, `ADMIN_PLAN_CHANGED`, `ADMIN_SETTINGS_CHANGED` |

### API Endpoints

| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| GET | `/api/admin/audit-logs` | Search logs | Admin |
| GET | `/api/admin/audit-logs/export` | Export CSV | Admin |

### Request/Response Schemas

```typescript
// GET /api/admin/audit-logs
interface AuditLogQuery {
  userId?: string;
  action?: AuditAction;
  startDate?: string;
  endDate?: string;
  page?: number;
  limit?: number;
}

interface AuditLogResponse {
  id: string;
  userId?: string;
  userEmail?: string;
  action: AuditAction;
  details?: Record<string, unknown>;
  ipAddress?: string;
  userAgent?: string;
  createdAt: string;
}

interface AuditLogListResponse {
  success: true;
  data: AuditLogResponse[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}
```

### Implementation

```typescript
// src/lib/audit.ts

interface CreateAuditLogParams {
  userId?: string;
  action: AuditAction;
  details?: Record<string, unknown>;
  ipAddress?: string;
  userAgent?: string;
}

export async function createAuditLog(params: CreateAuditLogParams): Promise<void>

// Helper to extract IP and User-Agent from request
export function getRequestMetadata(request: Request): {
  ipAddress: string;
  userAgent: string;
}
```

### Security Considerations

- **Immutability**: Audit logs cannot be modified or deleted
- **Retention**: Keep logs for 7 years (Bangladesh tax compliance)
- **Encryption**: Encrypt log details containing sensitive data
- **Access control**: Only admins can view audit logs

---

## Implementation Order

### Phase 2A - Critical Path (Week 1-2)

1. **Database Migration**
   - Add encrypted fields to User
   - Add `isAdmin` field
   - Update Payout model with approval fields
   - Add Invoice model

2. **User Settings API**
   - Profile CRUD
   - Payout methods with encryption
   - Balance calculation

3. **Public Payment Page**
   - Server-side payment initiation
   - Return URL handling
   - Webhook enhancement

### Phase 2B - Payout System (Week 3-4)

4. **Payout Request Flow**
   - Create payout API
   - Transaction linking
   - Cancel payout API

5. **Admin Payout Management**
   - Payout approval/rejection
   - Payout processing (bKash integration)
   - Status webhooks

### Phase 2C - Admin & Audit (Week 5-6)

6. **Admin Dashboard**
   - Analytics endpoints
   - Metrics calculation

7. **Admin User Management**
   - User CRUD
   - Suspension/unsuspension
   - Plan changes

8. **Audit Logging**
   - Log creation helpers
   - Admin log viewer
   - Export functionality

---

## Security Checklist

- [ ] AES-256-GCM encryption for NID, TIN, bankAccount, bkashNumber
- [ ] Encryption key rotation mechanism
- [ ] Rate limiting on public payment endpoints
- [ ] Re-authentication for sensitive operations
- [ ] Webhook signature verification
- [ ] Admin action logging
- [ ] Input validation with Zod on all endpoints
- [ ] SQL injection prevention (Prisma handles this)
- [ ] XSS prevention (React handles this)
- [ ] CSRF protection (NextAuth handles this)

---

## File Structure Changes

```
src/
├── app/
│   ├── pay/
│   │   └── [shareUrl]/
│   │       └── page.tsx          # Public payment page
│   └── api/
│       ├── public/
│       │   └── pay/
│       │       ├── route.ts      # Init payment
│       │       └── [shareUrl]/
│       │           └── route.ts  # Get payment data
│       ├── admin/
│       │   ├── analytics/
│       │   │   └── dashboard/
│       │   │       └── route.ts
│       │   ├── users/
│       │   │   └── route.ts
│       │   └── payouts/
│       │       └── route.ts
│       ├── payouts/
│       │   ├── route.ts
│       │   └── [id]/
│       │       └── route.ts
│       └── users/
│           ├── profile/
│           │   └── route.ts
│           ├── payout-methods/
│           │   └── route.ts
│           └── balance/
│               └── route.ts
├── components/
│   ├── payment/
│   │   ├── payment-form.tsx
│   │   ├── payment-success.tsx
│   │   ├── payment-cancel.tsx
│   │   └── payment-fail.tsx
│   └── admin/
│       ├── payout-list.tsx
│       ├── user-list.tsx
│       └── metrics-dashboard.tsx
├── lib/
│   ├── encryption.ts              # NEW: Encryption utilities
│   ├── payout.ts                 # NEW: Payout logic
│   ├── audit.ts                  # NEW: Audit logging
│   ├── validators.ts             # UPDATED: Add payout schemas
│   └── api/
│       └── bkash.ts              # UPDATED: Add disbursement
└── types/
    └── index.ts                  # UPDATED: Add shared types
```

---

## Dependencies

| Package | Purpose | Version |
|---------|---------|---------|
| `zod` | Schema validation | ^3.22 |
| `nanoid` | Secure URL generation | ^5.0 |
| `date-fns` | Date manipulation | ^3.0 |
| `next-auth` | Authentication | ^5.0 |

---

## Environment Variables

```bash
# Encryption
ENCRYPTION_KEY=                    # 32-byte key for AES-256

# bKash (existing)
BKASH_URL=
BKASH_USERNAME=
BKASH_PASSWORD=
BKASH_APP_KEY=
BKASH_APP_SECRET=

# Admin
ADMIN_EMAILS=                      # Comma-separated admin emails
```
