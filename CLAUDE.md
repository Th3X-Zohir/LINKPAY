# LinkPay BD - Claude Code Instructions

> Primary instruction file for Claude Code AI assistant working on LinkPay BD
> Updated: March 2026

---

## Project Overview

LinkPay BD is a **mobile-first payment link platform** for Bangladeshi freelancers. The platform enables freelancers to create and send professional payment links in under 30 seconds, accepting international card payments with automatic settlement to bKash or bank accounts.

**Stack:** Multi-agent development system + Next.js full-stack application
**Business Model:** Aggregator (aamarPay) + Freemium (0.75% platform fee)
**Target:** 650,000+ Bangladeshi freelancers

---

## Tech Stack (2026 Standards)

### Core Stack
| Layer | Technology | Notes |
|-------|------------|-------|
| Frontend | Next.js 15 (App Router) | React 19, Server Components |
| Styling | Tailwind CSS 4 | CSS-first configuration |
| UI Components | shadcn/ui v2 | Accessible, customizable |
| Icons | Lucide React | Tree-shakeable, consistent |
| Backend | Next.js API Routes | Edge Runtime ready |
| Database | PostgreSQL | With Prisma ORM |
| Auth | NextAuth.js v5 | Better Auth |
| State | Zustand | Lightweight, simple |
| Forms | React Hook Form + Zod | Type-safe validation |

### Payment Integration
| Service | Purpose |
|---------|---------|
| aamarPay | Payment gateway (cards, bKash) |
| bKash API | Payout to users |

### Development Tools
| Tool | Purpose |
|------|---------|
| TypeScript 5.4+ | Strict mode enabled |
| ESLint 9 | Code linting |
| Prettier | Code formatting |
| Vitest | Unit testing |
| Playwright | E2E testing |
| Turborepo | Monorepo (if needed) |

---

## Project Structure

```
linkpay-bd/
├── src/
│   ├── app/                    # Next.js App Router
│   │   ├── (auth)/            # Auth routes (login, register)
│   │   ├── (dashboard)/       # Protected dashboard
│   │   ├── (marketing)/       # Landing, pricing, about
│   │   └── api/               # API routes
│   ├── components/
│   │   ├── ui/                # shadcn/ui components
│   │   ├── forms/             # Form components
│   │   └── payment/           # Payment-specific components
│   ├── lib/
│   │   ├── db.ts              # Prisma client
│   │   ├── aamarPay.ts        # aamarPay API client
│   │   ├── bkash.ts           # bKash API client
│   │   └── utils.ts           # Utility functions
│   ├── hooks/                 # Custom React hooks
│   ├── types/                 # TypeScript types
│   └── actions/               # Server Actions
├── prisma/
│   └── schema.prisma          # Database schema
└── tests/
    ├── unit/
    └── e2e/
```

---

## Coding Standards

### TypeScript
- Use `strict: true` in tsconfig
- Prefer `interface` over `type` for object shapes
- Use explicit return types for functions
- No `any` types — use `unknown` and type narrow

### React Patterns
```typescript
// Server Component (default)
async function PaymentPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  // ...
}

// Client Component — use 'use client' sparingly
'use client';
import { useState } from 'react';

export function PaymentLinkForm() {
  const [loading, setLoading] = useState(false);
  // ...
}
```

### Naming Conventions
| Item | Convention | Example |
|------|------------|---------|
| Components | PascalCase | `PaymentLinkCard.tsx` |
| Files | kebab-case | `payment-link-service.ts` |
| Functions | camelCase | `createPaymentLink()` |
| Constants | UPPER_SNAKE_CASE | `MAX_AMOUNT` |
| Types/Interfaces | PascalCase | `PaymentLinkProps` |
| Database tables | snake_case | `payment_links` |

### API Design
```typescript
// API Response shape
interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

// Use Zod for request validation
import { z } from 'zod';

const CreatePaymentLinkSchema = z.object({
  amount: z.number().min(100).max(10000000),
  description: z.string().min(10).max(500),
  customerEmail: z.string().email().optional(),
  customerMobile: z.string().regex(/^01[3-9]\d{8}$/).optional(),
});

type CreatePaymentLinkInput = z.infer<typeof CreatePaymentLinkSchema>;
```

### Error Handling
```typescript
// Always handle errors gracefully
try {
  const result = await createPaymentLink(data);
  return { success: true, data: result };
} catch (error) {
  logger.error('Payment link creation failed', { error, data });
  return {
    success: false,
    error: error instanceof Error ? error.message : 'Unknown error'
  };
}
```

---

## UI/UX Guidelines

### Critical Rules (Non-Negotiable)
1. **Accessibility** — WCAG 2.1 AA compliance
   - Color contrast ≥ 4.5:1
   - Touch targets ≥ 44×44px
   - All images have alt text
   - Keyboard navigation works

2. **Mobile-First** — Design for 375px first
   - No horizontal scroll
   - Font size ≥ 16px body text
   - Thumb-friendly navigation

3. **Performance** — Core Web Vitals targets
   - LCP < 2.5s
   - FID < 100ms
   - CLS < 0.1

### Design System
- **Style:** Minimal, professional fintech
- **Colors:** Blues (#0A1628, #1E40AF) + Greens (#059669) for success
- **Typography:** Inter or Geist Sans
- **Spacing:** 4px base unit (4, 8, 12, 16, 24, 32, 48)
- **Border Radius:** 8px cards, 6px buttons, 4px inputs
- **Shadows:** Subtle, layered (sm, md, lg)

### Component Guidelines
```typescript
// Always include loading and error states
interface PaymentCardProps {
  payment: Payment;
  onShare?: (platform: 'whatsapp' | 'email' | 'copy') => void;
}

// Loading skeleton pattern
export function PaymentCardSkeleton() {
  return (
    <div className="animate-pulse p-4 bg-white rounded-lg">
      <div className="h-4 bg-gray-200 rounded w-3/4" />
      <div className="h-8 bg-gray-200 rounded mt-2" />
    </div>
  );
}
```

---

## Database Schema (Prisma Reference)

```prisma
model User {
  id            String    @id @default(cuid())
  email         String    @unique
  name          String?
  bkashNumber   String?
  bankAccount   String?
  plan          Plan      @default(FREE)
  createdAt    DateTime  @default(now())
  updatedAt    DateTime  @updatedAt
  paymentLinks PaymentLink[]
  transactions  Transaction[]
}

model PaymentLink {
  id          String   @id @default(cuid())
  userId      String
  user        User     @relation(fields: [userId], references: [id])
  amount      Int
  description String
  status      LinkStatus @default(PENDING)
  aamarPayId  String?
  shareUrl    String   @unique
  createdAt   DateTime @default(now())
  expiresAt   DateTime?
  transactions Transaction[]
}

model Transaction {
  id              String   @id @default(cuid())
  paymentLinkId   String
  paymentLink     PaymentLink @relation(fields: [paymentLinkId], references: [id])
  userId          String
  user            User     @relation(fields: [userId], references: [id])
  amount          Int
  platformFee     Int
  aamarPayFee     Int
  netAmount       Int
  status          TransactionStatus
  aamarPayTxnId   String?
  createdAt       DateTime @default(now())
  payoutStatus    PayoutStatus @default(PENDING)
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
```

---

## aamarPay Integration

### Key Endpoints
| Endpoint | Purpose |
|----------|---------|
| `POST /api/payment/init` | Initialize payment |
| `POST /api/payment/checkout` | Redirect to gateway |
| `POST /api/webhooks/aamarpay` | Handle payment callback |
| `POST /api/payout/bkash` | Initiate bKash payout |

### Webhook Security
```typescript
// Always verify webhook signatures
import { verifyAamarPayWebhook } from '@/lib/aamarPay';

export async function POST(request: Request) {
  const payload = await request.json();
  const signature = request.headers.get('x-aamarpay-signature');

  if (!verifyAamarPayWebhook(payload, signature)) {
    return Response.json({ error: 'Invalid signature' }, { status: 401 });
  }

  // Process webhook...
}
```

---

## Bangladesh Market Considerations

| Factor | Implementation |
|--------|----------------|
| bKash | Primary payout — ensure seamless integration |
| Bengali | Consider bilingual interface (BN/EN) |
| Mobile | WhatsApp sharing critical for link distribution |
| Banking | SupportNagad,bank transfer alongside bKash |
| NID | Secure storage if collected for premium |

---

## Workflow Guidelines

### Starting a New Feature
1. Check `plan.txt` for business requirements
2. Review relevant agent file for context
3. Create branch: `git checkout -b feat/feature-name`
4. Implement with tests
5. Ensure CI passes
6. Create PR with description

### Commit Convention
```
<type>(<scope>): <description>

Types: feat, fix, docs, style, refactor, test, chore
Scope: payment-link, auth, dashboard, api, ui

Examples:
feat(payment-link): add WhatsApp share functionality
fix(auth): resolve session expiration bug
docs(api): add webhook documentation
```

### PR Description Template
```markdown
## Summary
Brief description of changes

## Type
- [ ] Bug fix
- [ ] New feature
- [ ] Breaking change
- [ ] Documentation update

## Testing
How was this tested?

## Checklist
- [ ] Code follows project conventions
- [ ] Tests pass
- [ ] UI follows design guidelines
- [ ] No console errors
```

---

## Important Notes

1. **Security First**
   - Never commit secrets to git
   - Use environment variables for all credentials
   - Validate and sanitize all inputs
   - Use parameterized queries (Prisma handles this)

2. **Performance**
   - Use Server Components by default
   - Stream UI for slow data
   - Optimize images with next/image
   - Implement proper caching

3. **User Experience**
   - Show loading states
   - Handle offline gracefully
   - Provide clear error messages
   - Confirm destructive actions

---

## GitHub Rules (CRITICAL)

### Commit Attribution
- **ALWAYS** use the following author for all commits:
  - Name: `Th3X-Zohir`
  - Email: `zohirrayhan@users.noreply.github.com`
- Set via `git config user.name "Th3X-Zohir"` and `git config user.email "zohirrayhan@users.noreply.github.com"`
- NEVER use "Claude Opus" or any other author name in commits

### Before Any Git Push
1. Verify `git config user.name` returns `Th3X-Zohir`
2. Verify `git config user.email` returns `zohirrayhan@users.noreply.github.com`
3. If not set, run:
   ```bash
   git config user.name "Th3X-Zohir"
   git config user.email "zohirrayhan@users.noreply.github.com"
   ```

### Branch Convention
- Default branch: `main`
- Use `git branch -M main` if accidentally created as `master`

---

## Quick Reference

### Common Tasks
| Task | Command/Pattern |
|------|-----------------|
| Create payment link | `createPaymentLink(data)` from `@/lib/aamarPay` |
| Verify webhook | `verifyAamarPayWebhook(payload, signature)` |
| Format currency | `Intl.NumberFormat('bn-BD', { style: 'currency', currency: 'BDT' })` |
| Validate mobile | `/^01[3-9]\d{8}$/` |

### Environment Variables
```
DATABASE_URL=
AAMARPAY_STORE_ID=
AAMARPAY_KEY=
AAMARPAY_URL=
BKASH_USERNAME=
BKASH_PASSWORD=
BKASH_APP_KEY=
BKASH_APP_SECRET=
NEXTAUTH_SECRET=
NEXTAUTH_URL=
```

---

## File Locations

| File | Purpose |
|------|---------|
| `AGENT.md` | Multi-agent workflow overview |
| `AGENTS.md` | Agent roster and capabilities |
| `agents/*.md` | Individual agent specifications |
| `plan.txt` | Business plan |
| `docs/skills/*.md` | Specialized skill guides |
