# LinkPay BD - 10-Hour Build Roadmap

> **Version:** 2.0
> **Date:** March 2026
> **Goal:** Build complete LinkPay BD MVP in 10 hours
> **Agents:** Business Planner → Software Architect → Software Engineer → Evaluator → Fixer

---

## MVP Feature Scope (From plan.txt)

### Core (Free Plan) - MUST HAVE
| Feature | Priority |
|---------|----------|
| User registration/login | Critical |
| Payment link creation | Critical |
| Invoice generator (PDF) | Critical |
| International card acceptance (aamarPay) | Critical |
| Transaction history | Critical |
| Auto payout to bKash | Critical |
| Basic analytics | High |
| Share via WhatsApp/Email | High |
| QR code for payment link | Medium |
| Email notifications | Medium |

### Premium (৳999/month) - IF TIME
| Feature | Priority |
|---------|----------|
| Custom-branded invoices | High |
| WhatsApp auto-send | Medium |
| Client reminders | Medium |
| Tax reports (NBR) | Low |

---

## Agent System

```
┌─────────────────────────────────────────────────────────────┐
│                    BUSINESS PLANNER                         │
│  Requirements → User Stories → Acceptance Criteria          │
└─────────────────────────┬───────────────────────────────────┘
                          │
┌─────────────────────────▼───────────────────────────────────┐
│                    SOFTWARE ARCHITECT                        │
│  System Design → API Contracts → Database Schema            │
└─────────────────────────┬───────────────────────────────────┘
                          │
┌─────────────────────────▼───────────────────────────────────┐
│                    SOFTWARE ENGINEER                         │
│  Code Implementation → API Routes → Components             │
└─────────────────────────┬───────────────────────────────────┘
                          │
          ┌───────────────┴───────────────┐
          │                               │
┌─────────▼─────────┐           ┌─────────▼─────────┐
│    EVALUATOR       │           │      FIXER        │
│  Code Review       │           │  Bug Fixes        │
│  Testing           │           │  If Needed        │
└────────────────────┘           └────────────────────┘
```

---

## Hour-by-Hour Breakdown

### HOUR 1: Project Foundation
**Agent:** Software Architect → Software Engineer
**Skills:** `api-design`, `tailwind-design-system`

**Tasks:**
- [ ] Initialize Next.js 15 project with TypeScript
- [ ] Configure Tailwind CSS 4 + shadcn/ui
- [ ] Set up Prisma with PostgreSQL schema (from INFRASTRUCTURE.md)
- [ ] Configure Docker Compose (app + postgres + redis)
- [ ] Set up NextAuth.js v5 (credentials provider)
- [ ] Create project directory structure

**Files Created:**
```
src/app/(auth)/login/page.tsx
src/app/(auth)/register/page.tsx
src/app/api/auth/[...nextauth]/route.ts
src/lib/db.ts
src/lib/auth.ts
prisma/schema.prisma
docker-compose.yml
Dockerfile
```

**Success Criteria:** `npm run dev` starts, Prisma migrate works

---

### HOUR 2: Authentication + Landing Page
**Agent:** Software Engineer
**Skills:** `ui-ux-pro-max`, `debugging-troubleshooting`

**Tasks:**
- [ ] User registration API (`POST /api/auth/register`)
- [ ] User login API (`POST /api/auth/login`)
- [ ] Session management
- [ ] Protected route middleware
- [ ] Landing/marketing page (`/`)
- [ ] Login page UI
- [ ] Register page UI

**Success Criteria:** Can register, login, and logout. Landing page loads.

---

### HOUR 3: Dashboard + Payment Link Model
**Agent:** Software Engineer
**Skills:** `ui-ux-pro-max`, `api-design`

**Tasks:**
- [ ] Dashboard layout (sidebar for desktop, bottom nav for mobile)
- [ ] Payment links list page (`/dashboard/links`)
- [ ] Create payment link form
- [ ] `POST /api/payment-links` endpoint
- [ ] `GET /api/payment-links` endpoint
- [ ] Zod validation schemas
- [ ] Generate shareUrl (cuid-based)

**Success Criteria:** Dashboard shows, can create and view payment links

---

### HOUR 4: aamarPay Integration + Invoice PDF
**Agent:** Software Engineer
**Skills:** `api-design`

**Tasks:**
- [ ] Create `src/lib/api/aamarPay.ts` client
- [ ] Integrate with aamarPay sandbox API
- [ ] Payment link → aamarPay invoice creation
- [ ] Store `aamarPayId` and `aamarPayUrl`
- [ ] Invoice PDF generation (`src/lib/invoice.ts`)
- [ ] PDF template with freelancer details, amount, description
- [ ] Download invoice endpoint

**Success Criteria:** Payment link creation calls aamarPay. Can download PDF invoice.

---

### HOUR 5: Public Payment Page
**Agent:** Software Engineer
**Skills:** `ui-ux-pro-max`

**Tasks:**
- [ ] Public payment page (`/pay/[shareUrl]`)
- [ ] Display: freelancer name, amount, description, brand color
- [ ] Redirect to aamarPay hosted checkout
- [ ] Success page (`/pay/[shareUrl]/success`)
- [ ] Cancel page (`/pay/[shareUrl]/cancel`)
- [ ] Mobile-optimized responsive design

**Success Criteria:** Client can view payment page and be redirected to aamarPay

---

### HOUR 6: Webhook Handling + Transaction Recording
**Agent:** Software Engineer
**Skills:** `debugging-troubleshooting`, `api-design`

**Tasks:**
- [ ] `POST /api/webhooks/aamarpay` endpoint
- [ ] HMAC-SHA256 signature verification
- [ ] Idempotency check (store event_id in WebhookEvent table)
- [ ] Update PaymentLink status → PAID
- [ ] Create Transaction record
- [ ] Calculate fees:
  - Platform fee: 0.75%
  - Gateway fee: ~2.55%
  - Net amount to user
- [ ] `GET /api/transactions` endpoint
- [ ] Transaction detail page

**Success Criteria:** Webhook updates database on test payment

---

### HOUR 7: bKash Payout + Transaction History
**Agent:** Software Engineer
**Skills:** `api-design`

**Tasks:**
- [ ] Create `src/lib/api/bkash.ts` client
- [ ] `POST /api/payouts/request` endpoint
- [ ] `GET /api/payouts` endpoint
- [ ] `GET /api/payouts/balance` endpoint
- [ ] Payout status update on bKash callback
- [ ] Transaction history page (`/dashboard/transactions`)
- [ ] Transaction filters (date, status)
- [ ] Transaction detail view

**Success Criteria:** Can view transaction history and request payout

---

### HOUR 8: Analytics Dashboard + Share Features
**Agent:** Software Engineer
**Skills:** `ui-ux-pro-max`

**Tasks:**
- [ ] Analytics dashboard (`/dashboard/analytics`)
- [ ] Total earnings card
- [ ] Transaction volume chart (last 30 days)
- [ ] Success rate metric
- [ ] Share menu component (WhatsApp, Email, Copy Link)
- [ ] QR code generation for payment link
- [ ] WhatsApp share URL: `https://wa.me/?text=Pay%20here%3A%20[link]`
- [ ] Copy to clipboard functionality

**Success Criteria:** Dashboard shows charts, share buttons work

---

### HOUR 9: Email Notifications + Polish
**Agent:** Software Engineer → Evaluator
**Skills:** `debugging-troubleshooting`, `code-review-quality`

**Tasks:**
- [ ] Email service setup (Resend)
- [ ] Payment success email to freelancer
- [ ] Payout completion email
- [ ] Loading states on all forms
- [ ] Error handling + toast notifications
- [ ] Empty states for lists
- [ ] Mobile responsiveness final check
- [ ] Code review - find and fix issues

**Success Criteria:** Emails send, UI is polished, mobile works

---

### HOUR 10: Docker Deployment + Final Testing
**Agent:** Software Architect → Fixer (if needed)

**Tasks:**
- [ ] Final Docker configuration
- [ ] Caddy/Nginx SSL setup
- [ ] Environment variables production config
- [ ] Database migration on production
- [ ] End-to-end testing:
  - Register → Create link → Pay → Webhook → Payout
- [ ] Fix any critical bugs
- [ ] Update documentation

**Success Criteria:** Application runs in Docker, accessible via domain

---

## Critical Path

```
HOUR 1-2: Project Setup + Auth + Landing
     ↓
HOUR 3-4: Dashboard + Payment Links + aamarPay + Invoice PDF
     ↓
HOUR 5-6: Public Payment Page + Webhooks
     ↓
HOUR 7-8: Payouts + Transaction History + Analytics + Share
     ↓
HOUR 9-10: Email Notifications + Polish + Docker Deploy
```

---

## If Behind Schedule

**Cut in this order (first to cut):**

| Priority | Feature | Reason |
|----------|---------|--------|
| Cut 1st | Email notifications | Can add later |
| Cut 2nd | Analytics dashboard | Basic list works |
| Cut 3rd | QR code | WhatsApp sharing is key |
| Cut 4th | PDF invoice | Can show on screen first |
| Cut 5th | Transaction charts | Text-based summary works |
| Cut 6th | bKash auto-payout | Manual payout initially |

**Minimum Viable MVP (6 hours):**
1. User registration/login
2. Payment link creation
3. aamarPay integration
4. Public payment page
5. Webhook handling (updates status)
6. Transaction recording

---

## Skills Reference

| Task | Skill | File |
|------|-------|------|
| API Design | api-design | `docs/skills/api-design.md` |
| UI/UX | ui-ux-pro-max | `docs/skills/ui-ux-pro-max/SKILL.md` |
| Code Review | code-review-quality | `docs/skills/code-review-quality.md` |
| Debugging | debugging-troubleshooting | `docs/skills/debugging-troubleshooting.md` |
| Styling | tailwind-design-system | `docs/skills/tailwind-design-system.md` |

---

## Files to Create

```
linkpay-bd/
├── src/
│   ├── app/
│   │   ├── (auth)/login/page.tsx
│   │   ├── (auth)/register/page.tsx
│   │   ├── (dashboard)/
│   │   │   ├── page.tsx (overview)
│   │   │   ├── links/page.tsx
│   │   │   ├── transactions/page.tsx
│   │   │   └── analytics/page.tsx
│   │   ├── (marketing)/page.tsx (landing)
│   │   ├── pay/[shareUrl]/
│   │   │   ├── page.tsx
│   │   │   ├── success/page.tsx
│   │   │   └── cancel/page.tsx
│   │   └── api/
│   │       ├── auth/[...nextauth]/route.ts
│   │       ├── auth/register/route.ts
│   │       ├── payment-links/route.ts
│   │       ├── payment-links/[id]/route.ts
│   │       ├── transactions/route.ts
│   │       ├── payouts/route.ts
│   │       ├── webhooks/aamarpay/route.ts
│   │       └── public/pay/[shareUrl]/route.ts
│   ├── components/
│   │   ├── ui/ (shadcn)
│   │   ├── forms/create-link-form.tsx
│   │   ├── payment-link-card.tsx
│   │   ├── share-menu.tsx
│   │   ├── qr-code.tsx
│   │   └── dashboard/
│   ├── lib/
│   │   ├── db.ts
│   │   ├── auth.ts
│   │   ├── invoice.ts (PDF generation)
│   │   ├── api/
│   │   │   ├── aamarPay.ts
│   │   │   └── bkash.ts
│   │   └── validators.ts
│   └── actions/
│       ├── payment-link-actions.ts
│       └── transaction-actions.ts
├── prisma/schema.prisma
├── docker-compose.yml
├── Dockerfile
├── Caddyfile
└── .env.example
```

---

## Success Metrics

- [ ] User can register and login
- [ ] User can create payment link
- [ ] aamarPay integration works (sandbox)
- [ ] Public payment page displays correctly
- [ ] Webhook updates transaction on payment
- [ ] Transaction history shows all records
- [ ] Analytics dashboard displays charts
- [ ] Share via WhatsApp works
- [ ] Invoice PDF generates and downloads
- [ ] bKash payout can be requested
- [ ] Email notifications send
- [ ] Application runs in Docker
- [ ] Accessible via domain with SSL

---

## Build Commands

```bash
# Hour 1 - Setup
npm create next-app@latest linkpay-bd --typescript --tailwind --eslint
cd linkpay-bd && npx shadcn@latest init
npm install prisma @prisma/client next-auth@beta bcryptjs
npx prisma init

# Hour 2 - Auth
npm install react-hook-form zod @hookform/resolvers
npx prisma migrate dev

# Hour 4 - Invoice PDF
npm install pdfkit

# Hour 8 - Charts & QR
npm install recharts qrcode
npx shadcn@latest add chart

# Hour 9 - Email
npm install resend

# Hour 10 - Deploy
docker-compose up -d
```

---

*Built using LinkPay BD Multi-Agent System*
*Agent: Business Planner → Software Architect → Software Engineer → Evaluator → Fixer*
