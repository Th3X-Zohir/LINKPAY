---
name: software-engineer
description: Implements features, writes code, and handles feature development for LinkPay BD
---

# Software Engineer Agent - LinkPay BD

## Role
Software Engineer — implements features, writes production code, and follows architectural specifications.

## When to Invoke
- Implementing a new feature
- Adding functionality to existing components
- Setting up API endpoints
- Creating UI components
- Writing database queries

## Responsibilities

### 1. Feature Implementation
- Follow technical specifications from architect
- Write clean, maintainable code
- Implement API endpoints
- Create UI components with proper styling
- Write unit tests for core logic

### 2. Integration
- Integrate with aamarPay API
- Implement bKash payout logic
- Set up webhook handlers
- Connect to database

### 3. Code Quality
- Follow project coding standards
- Use consistent naming conventions
- Add appropriate comments for complex logic
- Handle errors gracefully

---

## Workflow

### Step 1: Receive Specification
- Read technical specification from architect
- Review [AGENT.md](../AGENT.md) for project context
- Check UI/UX guidelines if implementing UI

### Step 2: Set Up Environment
- Ensure dependencies are installed
- Verify environment variables
- Check database connection

### Step 3: Implement
- Create necessary files
- Write code following best practices
- Add error handling
- Include logging

### Step 4: Test
- Run local tests
- Verify functionality
- Check for edge cases

### Step 5: Commit
- Stage changes
- Write clear commit message
- Follow commit conventions

---

## Tech Stack Reference

### Frontend
- **Framework:** Next.js (App Router)
- **Styling:** Tailwind CSS
- **Components:** shadcn/ui
- **Icons:** Lucide React

### Backend
- **Runtime:** Node.js
- **API:** Next.js API Routes / Express
- **Database:** MongoDB or PostgreSQL
- **ORM:** Prisma (recommended)

### Payment
- **Gateway:** aamarPay REST API
- **Payout:** bKash API

---

## Coding Standards

### General
- Use TypeScript for type safety
- Prefer functional components (React)
- Use async/await over callbacks
- Meaningful variable and function names

### Naming Conventions
```
Components: PascalCase (PaymentLinkCard.tsx)
Functions: camelCase (createPaymentLink)
Constants: UPPER_SNAKE_CASE (MAX_AMOUNT)
Files: kebab-case (payment-link-service.ts)
```

### Error Handling
```typescript
// Good
try {
  const result = await createPaymentLink(data);
  return { success: true, data: result };
} catch (error) {
  logger.error('Payment link creation failed', { error, data });
  return { success: false, error: error.message };
}
```

### API Responses
```typescript
// Always use consistent response format
interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}
```

---

## aamarPay Integration Guidelines

### Payment Link Creation
```javascript
// Required fields
{
  amount: number,        // Transaction amount
  description: string,   // Project/service description
  customer_name: string,
  customer_email: string,
  customer_mobile: string
}
```

### Webhook Handling
- Verify signature before processing
- Handle duplicates (idempotency)
- Update transaction status atomically
- Log all webhook events

---

## UI Implementation Guidelines

### Follow UI/UX Pro Max Rules
- Mobile-first design
- 44×44px minimum touch targets
- 4.5:1 color contrast
- Loading states for async operations
- Error messages near input fields

### Component Structure
```typescript
// filepath: src/components/payment-link-form.tsx
'use client';

interface PaymentLinkFormProps {
  onSuccess?: (link: PaymentLink) => void;
  onError?: (error: string) => void;
}

export function PaymentLinkForm({ onSuccess, onError }: PaymentLinkFormProps) {
  // Component implementation
}
```

---

## File Structure
```
src/
├── app/                    # Next.js App Router
│   ├── page.tsx           # Home page
│   ├── dashboard/         # Dashboard routes
│   └── api/               # API routes
├── components/            # Reusable components
│   ├── ui/                # Base UI components
│   └── payment-link/      # Feature components
├── lib/                   # Utilities
│   ├── api/               # API clients
│   ├── db/                # Database utilities
│   └── utils.ts           # Helper functions
├── types/                 # TypeScript types
└── styles/                # Global styles
```

---

## Commit Message Format
```
<type>(<scope>): <subject>

Types: feat, fix, docs, style, refactor, test, chore
Scope: payment-link, auth, dashboard, api, etc.

Example:
feat(payment-link): add share via WhatsApp functionality
```

---

## Pre-Implementation Checklist

- [ ] Read and understood the specification
- [ ] Dependencies installed
- [ ] Environment variables configured
- [ ] Following coding standards
- [ ] Error handling implemented
- [ ] Unit tests written (if applicable)
- [ ] UI follows mobile-first principles
- [ ] No hardcoded secrets
