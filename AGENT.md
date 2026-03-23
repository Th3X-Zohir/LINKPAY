# LinkPay BD - Agent Instructions

> Mobile-first payment link platform for Bangladeshi freelancers

## Project Overview

LinkPay BD enables Bangladeshi freelancers to create and send professional payment links in under 30 seconds. Clients pay with international cards → money lands in aamarPay merchant account → LinkPay takes 0.75% platform fee → rest settles to freelancer's bKash or bank in 1–2 days.

**Business Model:** Aggregator (one aamarPay merchant account) + Freemium
**Startup Cost:** ৳25,000–40,000
**Year 1 Revenue Target:** ৳18–25 lakh

---

## Tech Stack

| Layer | Technology |
|-------|------------|
| Frontend | Next.js (web + PWA) |
| Backend | Node.js |
| Database | MongoDB or PostgreSQL |
| Payment Gateway | aamarPay REST API |
| Hosting | Vercel + Hostinger Bangladesh server |
| Mobile App | React Native (optional Year 1) |

---

## Project Structure

```
linkpay-bd/
├── src/
│   ├── app/              # Next.js App Router
│   ├── components/      # Reusable UI components
│   ├── pages/           # Pages (if using Pages Router)
│   ├── lib/             # Utilities, API clients
│   ├── hooks/           # Custom React hooks
│   ├── context/          # React context providers
│   └── styles/          # Global styles, Tailwind config
├── public/              # Static assets
├── tests/               # Test files
└── docs/                # Documentation
```

---

## UI/UX Guidelines

### Design Principles

For all UI work, follow the **ui-ux-pro-max** skill guidelines (loaded separately).

**Must-follow rules:**

1. **Accessibility (CRITICAL)**
   - Color contrast minimum 4.5:1 for normal text
   - Touch targets minimum 44×44px
   - Visible focus states on all interactive elements
   - aria-labels for icon-only buttons

2. **Mobile-First**
   - Design for 375px first, then scale up
   - No horizontal scroll on mobile
   - Readable font size minimum 16px body

3. **Style Consistency**
   - Use consistent shadow/elevation scale
   - Match style to product type (fintech → professional, clean)
   - No emoji as icons — use SVG (Heroicons, Lucide)

4. **Forms & Feedback**
   - Visible labels on all inputs
   - Error messages near the problem field
   - Loading states on async operations
   - Toast notifications for confirmations

### Recommended Design System

For a fintech/payment platform targeting freelancers:

- **Style:** Minimal, professional, trustworthy
- **Color Palette:** Blues and greens (trust, money), with Bengali-friendly contrast
- **Typography:** Clean sans-serif, excellent readability
- **Components:** Cards for payment links, clean forms, prominent CTAs

---

## Key Features (MVP)

### Core (Free Plan)
- [ ] Instant payment link & invoice generator
- [ ] International card acceptance (Visa, Mastercard)
- [ ] Transaction history
- [ ] Auto payout to bKash/bank
- [ ] Basic analytics dashboard

### Premium (৳999/month)
- [ ] Unlimited links
- [ ] Custom-branded invoices
- [ ] WhatsApp auto-send button
- [ ] Client reminder system
- [ ] Tax report (for Bangladesh Bank & NBR)

---

## aamarPay Integration

**Gateway Partner:** aamarPay

**Key API Features Needed:**
- Payment Link creation
- Invoice generation via SMS/Email
- Transaction status webhooks
- Payout initiation

**Setup:**
- Setup fee: ~৳10,000–15,000
- Transaction fee: 1.85%–2.55% (Visa/MC)
- Onboarding: 2–4 days

---

## Bangladeshi Market Considerations

1. **bKash Integration** — Primary payout method, ensure seamless
2. **Bengali Language Support** — Consider bilingual interface
3. **NID/TIN Handling** — Secure storage for compliance
4. **Mobile-First** — Most freelancers use phones
5. **WhatsApp Sharing** — Primary communication channel for links

---

## Agent Capabilities

### Built-in Tools
- `github_repo` — Search GitHub for aamarPay API examples, auth patterns
- `semantic_search` — Find code related to concepts in the codebase
- `grep_search` — Search for exact strings/regex
- `file_search` — Find files by glob pattern

### Available Skills & Tools
| Skill/Tool | Purpose | Status |
|------------|---------|--------|
| ui-ux-pro-max | UI/UX design intelligence | Loaded |
| github_repo | Search GitHub for code examples | Built-in tool |
| find-skills | Discover additional skills | Available |

> **Note:** `github-repo-agent` is not installed locally. Use the built-in `github_repo` tool to search GitHub for aamarPay API examples and fintech patterns.

---

## Common Tasks

### Create a new payment link page
1. Use `ui-ux-pro-max` for design guidance
2. Follow mobile-first approach
3. Include amount input, description, client email fields
4. Add share buttons (WhatsApp, Email, Facebook)

### Build transaction dashboard
1. Use cards for summary stats
2. Table for transaction history with status badges
3. Charts for analytics (follow chart guidelines)
4. Responsive layout (sidebar on desktop, bottom nav on mobile)

### Implement aamarPay webhook
1. Verify webhook signature
2. Update transaction status
3. Trigger payout if successful
4. Send confirmation notification

---

## Anti-Patterns to Avoid

- ❌ Complex KYC flows (keep onboarding simple)
- ❌ Multiple CTAs on same screen
- ❌ Hidden fees or confusing pricing
- ❌ bKash-only (support bank transfers too)
- ❌ Slow loading (keep TTI < 3s)
- ❌ Poor error messages on payment failures

---

## Quick Reference

**Client payment flow (৳100,000 example):**
```
aamarPay gateway fee: ~2.55% = ৳2,550
LinkPay platform fee: 0.75% = ৳750
Freelancer receives: ৳96,700 (96.7%)
```

**Break-even:** Month 4–5
**ROI target:** 400%+ in first year

---

## Documentation

- [Business Plan](./plan.txt) — Full business plan
- [aamarPay Docs](https://aamarpay.com/docs) — Gateway documentation
