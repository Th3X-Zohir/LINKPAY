# LinkPay BD - Phase 2 Feature Specifications

> **Document Version:** 1.0  
> **Date:** March 24, 2026  
> **Prepared by:** Business Planner Agent  
> **For:** LinkPay BD Development Team

---

## Executive Summary

This document provides detailed user stories, acceptance criteria, and technical requirements for Phase 2 features of LinkPay BD. These features extend the MVP completed in Phase 1 and enable the platform to scale operations, serve premium users, and maintain compliance.

**Revenue Impact:** Premium subscriptions (৳999/month) + Improved transaction volume through professional features

---

## Feature Overview

| # | Feature | Priority | Complexity |
|---|---------|----------|------------|
| 1 | Public Payment Page Polish | Must Have | Medium |
| 2 | User Settings & Payout Configuration | Must Have | Medium |
| 3 | bKash Payout System (Complete) | Must Have | High |
| 4 | Admin Panel - User Management | Should Have | High |
| 5 | Admin Panel - Payout Management | Should Have | High |
| 6 | Admin Panel - Platform Analytics | Should Have | Medium |
| 7 | Premium Subscription Flow | Should Have | High |
| 8 | Invoice PDF Generation (Enhanced) | Should Have | Medium |
| 9 | Audit Logging & Security | Must Have | Medium |

---

## Feature 1: Public Payment Page Polish

### User Story

```
## User Story: Public Payment Page

**As a** client (international customer or Bangladesh cardholder)
**I want to** view a professional, mobile-optimized payment page
**So that** I can understand what I'm paying for and complete the payment securely

**Business Impact:** Direct impact on conversion rate. Poor payment page = lost revenue.
Current implementation has client redirect issues affecting payment flow.

**Priority:** Must Have
```

### Acceptance Criteria

- [ ] **Given** a client opens a payment link (`/pay/[shareUrl]`)
- **When** the page loads
- **Then** display freelancer's name, amount in BDT, and payment description clearly
- **And** show LinkPay branding with professional appearance
- **And** redirect to aamarPay checkout seamlessly

- [ ] **Given** a client completes payment on aamarPay
- **When** they return to the success page
- **Then** show clear success confirmation with transaction ID
- **And** display expected payout timeline to freelancer

- [ ] **Given** a client cancels payment
- **When** they return to the cancel page
- **Then** show cancellation message with option to retry
- **And** provide contact info for freelancer

- [ ] **Given** a client has payment failure
- **When** they return to the fail page
- **Then** show failure reason if available
- **And** offer retry option

### Technical Requirements

| Component | Requirement |
|-----------|-------------|
| Page Load | LCP < 2.5s on mobile 3G |
| Responsive | 375px width optimized |
| Redirect | Server-side redirect to aamarPay, not client-side `window.location` |
| Branding | Customizable color accent from user settings |
| SSL | All pages must be HTTPS |

### API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/public/pay/[shareUrl]` | Fetch payment link details for public page |

---

## Feature 2: User Settings & Payout Configuration

### User Story

```
## User Story: Payout Configuration

**As a** freelancer
**I want to** configure my payout preferences (bKash number, bank details)
**So that** I can receive payments directly to my preferred account

**Business Impact:** Required for payout system. Without this, users can't receive money.

**Priority:** Must Have
```

```
## User Story: Profile Management

**As a** freelancer
**I want to** update my profile information
**So that** my clients see accurate details on payment pages

**Business Impact:** Professionalism drives client trust and conversion.

**Priority:** Should Have
```

### Acceptance Criteria

- [ ] **Given** a user is on the settings page
- **When** they enter/update their bKash number
- **Then** validate format (`01[3-9]\d{8}`)
- **And** show confirmation before saving
- **And** mask number in display (show last 4 digits only)

- [ ] **Given** a user is on the settings page
- **When** they enter/update bank account details
- **Then** collect: bank name, account number, account holder name
- **And** validate account number format per bank
- **And** store securely (encrypted at rest)

- [ ] **Given** a user is on the settings page
- **When** they update their display name
- **Then** reflect changes on new payment pages immediately
- **And** keep old payment pages unchanged (historical accuracy)

- [ ] **Given** a user adds/updates payout details
- **When** saving
- **Then** require re-authentication (password confirmation)
- **And** log the change in audit log

### Technical Requirements

| Field | Validation | Security |
|-------|------------|----------|
| bKash Number | Regex `^01[3-9]\d{8}$` | Encrypted storage |
| Bank Name | Dropdown + custom | Plain text |
| Account Number | 13-17 digits | Encrypted storage |
| Account Holder | Min 2 chars | Plain text |
| Display Name | Min 2, Max 50 chars | Plain text |

### API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/users/profile` | Get current user profile |
| PUT | `/api/users/profile` | Update profile (name, business name) |
| PUT | `/api/users/payout-methods` | Update bKash/bank details |
| POST | `/api/users/verify-password` | Re-authenticate for sensitive changes |

---

## Feature 3: bKash Payout System (Complete)

### User Story

```
## User Story: Request Payout

**As a** freelancer
**I want to** request a payout of my earnings to bKash
**So that** I can access my money within 1-2 days

**Business Impact:** Core value proposition. Users must be able to withdraw earnings.

**Priority:** Must Have
```

```
## User Story: Payout History

**As a** freelancer
**I want to** track my payout history and status
**So that** I know when to expect money in my bKash

**Business Impact:** Transparency builds trust. Reduces support queries.

**Priority:** Should Have
```

```
## User Story: Payout Balance

**As a** freelancer
**I want to** see my available balance for payout
**So that** I know how much I can withdraw

**Business Impact:** Prevents failed payout requests due to insufficient balance.

**Priority:** Must Have
```

### Acceptance Criteria

- [ ] **Given** a user has available balance
- **When** they request a payout to bKash
- **Then** validate balance >= requested amount
- **And** validate bKash number is configured
- **And** initiate bKash payout via API
- **And** create payout record with PENDING status
- **And** send confirmation email

- [ ] **Given** a payout request is initiated
- **When** bKash processes the payout
- **Then** webhook updates status to PROCESSING or COMPLETED/FAILED
- **And** user receives email notification on status change
- **And** audit log records the transaction

- [ ] **Given** a user views their payout history
- **When** the page loads
- **Then** show list of all payouts with status badges
- **And** include: amount, method, created date, completed date
- **And** paginate results (20 per page)

- [ ] **Given** a user views their dashboard
- **When** the page loads
- **Then** display available balance prominently
- **And** show last payout date and amount
- **And** indicate pending payouts

- [ ] **Given** a user has no bKash configured
- **When** they attempt to request payout
- **Then** show clear message directing them to settings
- **And** prevent the payout request

### Technical Requirements

| Component | Requirement |
|-----------|-------------|
| Minimum Payout | ৳500 |
| Maximum Payout | ৳50,000 per transaction |
| Processing Time | bKash: 1-2 days, Bank: 2-3 days |
| Balance Calculation | `totalEarnings - pendingPayouts - platformFees` |
| bKash API | Use sandbox for testing, production credentials required |
| Idempotency | Payout requests must be idempotent (prevent duplicate payouts) |

### API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/payouts` | List user's payout history |
| POST | `/api/payouts` | Request new payout |
| GET | `/api/payouts/:id` | Get payout details |
| GET | `/api/payouts/balance` | Get available balance |
| POST | `/api/webhooks/bkash` | bKash payout status webhook |
| POST | `/api/payouts/bank` | Request bank transfer payout |

### Data Model

```prisma
model Payout {
  id              String      @id @default(cuid())
  userId          String
  user            User        @relation(fields: [userId], references: [id])
  amount          Int         // In poisas (BDT * 100)
  method          PayoutMethod
  status          PayoutStatus @default(PENDING)
  bkashTxnId      String?     // bKash transaction ID
  bankTxnId       String?     // Bank reference
  failureReason   String?
  createdAt       DateTime    @default(now())
  processedAt     DateTime?
  
  @@index([userId, status])
  @@index([createdAt])
}

enum PayoutMethod {
  BKASH
  BANK
}

enum PayoutStatus {
  PENDING
  PROCESSING
  COMPLETED
  FAILED
}
```

---

## Feature 4: Admin Panel - User Management

### User Story

```
## User Story: Admin User Management

**As a** platform administrator
**I want to** view and manage user accounts
**So that** I can support users and handle disputes

**Business Impact:** Operational necessity. Required for day-to-day platform management.

**Priority:** Should Have
```

### Acceptance Criteria

- [ ] **Given** an admin is logged in
- **When** they navigate to user management
- **Then** display paginated list of all users
- **And** show: email, name, plan type, created date, status
- **And** allow filtering by plan (FREE/PREMIUM)
- **And** allow searching by email or name

- [ ] **Given** an admin views a user
- **When** they access user details
- **Then** show: profile info, payout settings, payment links, transactions, payouts
- **And** show user activity summary (total volume, earnings)

- [ ] **Given** an admin needs to help a user
- **When** they view the user's payment links
- **Then** show all links with status and analytics
- **And** allow manual status changes if needed

- [ ] **Given** a user reports an issue
- **When** admin needs to investigate
- **Then** access full transaction history for that user
- **And** view all payout requests and statuses

### Technical Requirements

| Requirement | Details |
|-------------|---------|
| Pagination | 50 users per page |
| Search | Email, name fields |
| Filters | Plan type, status, date range |
| Export | CSV export for user list |
| Access Control | Admin role required (middleware check) |

### API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/admin/users` | List all users (admin) |
| GET | `/api/admin/users/:id` | Get user details (admin) |
| PUT | `/api/admin/users/:id` | Update user (admin) |
| PUT | `/api/admin/users/:id/plan` | Change user plan |
| DELETE | `/api/admin/users/:id` | Deactivate user |

---

## Feature 5: Admin Panel - Payout Management

### User Story

```
## User Story: Admin Payout Oversight

**As a** platform administrator
**I want to** monitor and manage all payout requests
**So that** I can resolve issues and ensure timely payments

**Business Impact:** Platform credibility depends on reliable payouts.

**Priority:** Should Have
```

### Acceptance Criteria

- [ ] **Given** an admin views payout management
- **When** the page loads
- **Then** show all payout requests across users
- **And** filter by status (PENDING, PROCESSING, COMPLETED, FAILED)
- **And** filter by date range
- **And** filter by payout method (bKash/Bank)

- [ ] **Given** a payout is stuck in PROCESSING
- **When** admin investigates
- **Then** view bKash API response and transaction details
- **And** manually update status if API response was missed
- **And** log the manual intervention

- [ ] **Given** a payout fails
- **When** admin reviews the failure
- **Then** see failure reason from bKash/bank
- **And** can initiate retry or mark as resolved
- **And** notify user via email of resolution

### API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/admin/payouts` | List all payouts (admin) |
| GET | `/api/admin/payouts/:id` | Payout details (admin) |
| PUT | `/api/admin/payouts/:id/status` | Manual status update |
| POST | `/api/admin/payouts/:id/retry` | Retry failed payout |

---

## Feature 6: Admin Panel - Platform Analytics

### User Story

```
## User Story: Platform Analytics

**As a** platform administrator
**I want to** view platform-wide metrics
**So that** I can make data-driven business decisions

**Business Impact:** Revenue tracking, growth metrics, and identifying issues early.

**Priority:** Should Have
```

### Acceptance Criteria

- [ ] **Given** an admin views analytics dashboard
- **When** the page loads
- **Then** display: total users, active users (30d), total volume, total revenue
- **And** show growth percentages vs previous period
- **And** display charts for volume over time

- [ ] **Given** an admin wants transaction insights
- **When** viewing analytics
- **Then** show: transaction count, success rate, average transaction size
- **And** show failed transaction breakdown by reason

- [ ] **Given** an admin monitors payout health
- **When** viewing analytics
- **Then** show: total payouts, pending payouts, completed payouts, failed payouts
- **And** display payout volume over time

### Metrics Definitions

| Metric | Calculation |
|--------|-------------|
| Active Users | Users with >=1 transaction in last 30 days |
| Total Volume | Sum of all successful transaction amounts |
| Platform Revenue | Sum of 0.75% platform fees |
| Success Rate | (Successful transactions / Total transactions) * 100 |
| Average Transaction | Total volume / Number of transactions |

### API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/admin/analytics/overview` | Platform overview metrics |
| GET | `/api/admin/analytics/transactions` | Transaction analytics |
| GET | `/api/admin/analytics/payouts` | Payout analytics |
| GET | `/api/admin/analytics/users` | User growth analytics |

---

## Feature 7: Premium Subscription Flow

### User Story

```
## User Story: Upgrade to Premium

**As a** freelancer using the free plan
**I want to** upgrade to premium
**So that** I can access unlimited links, branded invoices, and priority support

**Business Impact:** Secondary revenue stream. 20-30% conversion target.

**Priority:** Should Have
```

```
## User Story: Premium Features Access

**As a** premium user
**I want to** access my premium features
**So that** I get value from my subscription

**Business Impact:** Churn prevention. Must deliver promised features.

**Priority:** Should Have
```

### Acceptance Criteria

- [ ] **Given** a free user views pricing page
- **When** they click "Upgrade to Premium"
- **Then** show premium features comparison
- **And** display price (৳999/month)
- **And** provide bKash/Nagad payment instructions

- [ ] **Given** a user submits premium payment proof
- **When** admin verifies payment
- **Then** activate premium plan for user
- **And** set subscription end date (1 month from activation)
- **And** send confirmation email

- [ ] **Given** a premium user creates a payment link
- **When** generating the link
- **Then** allow unlimited links (vs 10 limit for free)
- **And** include premium badge option

- [ ] **Given** a premium user generates an invoice
- **When** PDF is created
- **Then** include custom branding (logo, colors)
- **And** remove "Powered by LinkPay" footer
- **And** include additional fields (VAT, custom notes)

- [ ] **Given** a premium subscription expires
- **When** user attempts premium actions
- **Then** show subscription expired message
- **And** revert to free plan limits
- **And** offer renewal options

### Premium Features

| Feature | Free | Premium |
|---------|------|---------|
| Payment Links | 10/month | Unlimited |
| Branded Invoice | No | Yes |
| WhatsApp Auto-Send | No | Yes |
| Client Reminders | No | Yes |
| Tax Reports | No | Yes |
| Priority Support | No | Yes |
| API Access | No | Yes (future) |

### API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/subscriptions/plans` | Get plan details |
| POST | `/api/subscriptions/upgrade` | Submit upgrade request |
| GET | `/api/subscriptions/status` | Get current subscription |
| POST | `/api/subscriptions/renew` | Renew subscription |
| POST | `/api/admin/subscriptions/approve` | Admin approves upgrade |

### Data Model

```prisma
model Subscription {
  id              String      @id @default(cuid())
  userId          String      @unique
  user            User        @relation(fields: [userId], references: [id])
  plan            Plan        @default(FREE)
  startedAt       DateTime    @default(now())
  expiresAt       DateTime
  autoRenew       Boolean     @default(false)
  paymentMethod   String?     // bKash/Nagad reference
  createdAt       DateTime    @default(now())
  
  @@index([userId])
}

enum Plan {
  FREE
  PREMIUM
}
```

---

## Feature 8: Invoice PDF Generation (Enhanced)

### User Story

```
## User Story: Professional Invoice

**As a** freelancer
**I want to** generate professional PDF invoices for my clients
**So that** I maintain a professional image and simplify accounting

**Business Impact:** Key differentiator. Professional invoicing drives premium upgrades.

**Priority:** Should Have
```

### Acceptance Criteria

- [ ] **Given** a user generates an invoice for a payment
- **When** the PDF is created
- **Then** include: freelancer name, client name, amount, description, date
- **And** include transaction ID from aamarPay
- **And** show fee breakdown (platform fee, gateway fee)
- **And** show net amount received

- [ ] **Given** a premium user generates an invoice
- **When** the PDF is created
- **Then** include custom logo upload
- **And** include custom brand colors
- **And** exclude "Powered by LinkPay" branding
- **And** include custom fields (VAT number, notes)

- [ ] **Given** a user downloads an invoice
- **When** they request the PDF
- **Then** generate and stream PDF in response
- **And** filename should be: `invoice-{transaction-id}.pdf`

### Invoice Layout

```
+------------------------------------------+
|  [Logo if Premium]        INVOICE        |
|                                          |
|  From:                     To:            |
|  Freelancer Name           Client Name    |
|  Email                     Email          |
|                                          |
|  Invoice #: {transaction_id}             |
|  Date: {date}                            |
|                                          |
|  Description         Amount              |
|  --------------------- ------            |
|  {description}        ৳{amount}          |
|                                          |
|  ------------------------------------    |
|  Subtotal:              ৳{amount}         |
|  Gateway Fee (2.55%):  ৳{gateway_fee}    |
|  Platform Fee (0.75%): ৳{platform_fee}    |
|  ------------------------------------    |
|  NET RECEIVED:         ৳{net_amount}     |
|                                          |
|  [Powered by LinkPay]  [Your VAT #]      |
+------------------------------------------+
```

### API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/invoices/[transactionId]` | Download invoice PDF |
| POST | `/api/users/branding` | Upload custom logo |
| PUT | `/api/users/branding` | Update brand colors |

---

## Feature 9: Audit Logging & Security

### User Story

```
## User Story: Security Audit Trail

**As a** platform administrator
**I want to** track all sensitive operations
**So that** I can investigate issues and maintain compliance

**Business Impact:** Security and compliance. Required for dispute resolution.

**Priority:** Must Have
```

```
## User Story: User Action History

**As a** user
**I want to** see my account activity
**So that** I can verify all actions taken on my account

**Business Impact:** Trust. Users want to know their account is secure.

**Priority:** Should Have
```

### Acceptance Criteria

- [ ] **Given** a sensitive operation occurs
- **When** it completes (success or failure)
- **Then** log to audit log: user ID, action, IP address, timestamp, result
- **And** encrypt sensitive data in transit and at rest

- [ ] **Given** admin views audit logs
- **When** they access the logs
- **Then** filter by user, action type, date range
- **And** export logs for compliance reporting
- **And** retain logs for minimum 2 years

- [ ] **Given** user updates payout details
- **When** the change is saved
- **Then** log: field changed, old value masked, new value masked, IP, timestamp
- **And** send email notification to user

- [ ] **Given** a webhook is received
- **When** it contains sensitive data
- **Then** mask card numbers, bank details in logs
- **And** store only necessary identifiers

### Tracked Actions

| Category | Actions |
|----------|---------|
| Authentication | LOGIN, LOGOUT, LOGIN_FAILED, PASSWORD_CHANGE |
| Profile | PROFILE_UPDATE, PAYOUT_CONFIG_CHANGE |
| Payment | PAYMENT_INITIATED, PAYMENT_COMPLETED, PAYMENT_FAILED |
| Payout | PAYOUT_REQUESTED, PAYOUT_INITIATED, PAYOUT_COMPLETED, PAYOUT_FAILED |
| Admin | ADMIN_LOGIN, USER_SUSPENDED, PLAN_CHANGED |

### API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/admin/audit-logs` | List audit logs (admin) |
| GET | `/api/admin/audit-logs/:id` | Get audit log details |
| GET | `/api/users/activity` | User's own activity history |

### Data Model

```prisma
model AuditLog {
  id          String   @id @default(cuid())
  userId      String?
  action      String   // LOGIN, PAYOUT_REQUESTED, etc.
  entityType  String?  // User, PaymentLink, Payout
  entityId    String?
  ipAddress   String?
  userAgent   String?
  metadata    Json?    // Additional context
  result      String   // SUCCESS, FAILURE
  createdAt   DateTime @default(now())
  
  @@index([userId, createdAt])
  @@index([action, createdAt])
  @@index([entityType, entityId])
}
```

---

## Priority Summary

### Must Have (MVP Complete)
1. Public Payment Page Polish
2. User Settings & Payout Configuration
3. bKash Payout System (Complete)
4. Audit Logging & Security

### Should Have (Professional)
5. Admin Panel - User Management
6. Admin Panel - Payout Management
7. Admin Panel - Platform Analytics
8. Premium Subscription Flow
9. Invoice PDF Generation (Enhanced)

---

## Implementation Notes

### Dependencies
- Invoice PDF: Uses `pdfkit` (already in project)
- Charts: Install `recharts` for analytics
- Tables: Use shadcn/ui Table component
- Forms: React Hook Form + Zod (already in project)

### Security Considerations
- All admin endpoints require admin role middleware
- Rate limiting on payout endpoints (prevent abuse)
- Webhook signature verification for bKash
- Encryption for stored bank details (AES-256)

### Performance Targets
- Admin pages: < 1s load time for lists
- Payment page: < 2.5s LCP
- API responses: < 200ms p95

---

## Next Steps

1. **Software Architect** to create technical designs for each feature
2. **Software Engineer** to implement in priority order
3. **Evaluator** to review each implementation
4. **Fixer** to resolve any issues before moving to next feature

---

*Document End*
