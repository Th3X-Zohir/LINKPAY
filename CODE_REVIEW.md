# LinkPay BD - Code Review Report

**Review Date:** 2026-03-24
**Reviewer:** Evaluator Agent
**Files Reviewed:**
- `src/lib/api/aamarPay.ts`
- `src/lib/api/bkash.ts`
- `src/app/api/webhooks/aamarpay/route.ts`
- `src/lib/invoice.ts`
- `prisma/schema.prisma`
- `src/lib/auth.ts`
- `src/lib/validators.ts`
- `src/app/api/payment-links/route.ts`
- `src/app/api/payouts/route.ts`
- `src/components/ui/input.tsx`
- `src/components/ui/button.tsx`

---

## Overall Assessment

| Category | Score | Status |
|----------|-------|--------|
| Correctness | 65% | CHANGES REQUESTED |
| Security | 55% | CHANGES REQUESTED |
| Error Handling | 70% | CHANGES REQUESTED |
| Performance | 80% | APPROVED |
| Testing | 0% | REJECTED |
| Maintainability | 75% | CHANGES REQUESTED |
| Accessibility | 60% | CHANGES REQUESTED |

**Overall Score: 60/100** - CHANGES REQUESTED

---

## 1. Critical Issues

### CRITICAL-1: Webhook Signature Verification Flaw

**File:** `src/lib/api/aamarPay.ts` (lines 90-100)

**Issue:**
```javascript
export function verifyWebhookSignature(payload: unknown, signature: string | null): boolean {
  if (!signature || !SIGNATURE_KEY) return false

  const crypto = require('crypto')
  const expectedSignature = crypto
    .createHmac('sha256', SIGNATURE_KEY)
    .update(JSON.stringify(payload))  // BUG: JSON.stringify order/spacing may differ
    .digest('hex')

  return signature === expectedSignature
}
```

The signature is computed using `JSON.stringify(payload)`, but different JavaScript runtimes or serialization methods may produce different JSON strings (key order, spacing). aamarpay likely sends a canonical JSON string. This can cause legitimate webhooks to be rejected or allow forged webhooks if the attacker can predict the JSON format.

**Recommendation:** Verify the exact JSON serialization method aamarpay uses. Consider using a canonical JSON serializer or matching their format exactly.

---

### CRITICAL-2: Race Condition in Webhook Idempotency

**File:** `src/app/api/webhooks/aamarpay/route.ts` (lines 35-51)

**Issue:**
```javascript
const existingEvent = await db.webhookEvent.findUnique({
  where: { eventId }
})

if (existingEvent?.processed) {
  return NextResponse.json({ message: 'Event already processed' })
}

await db.webhookEvent.create({...})  // Creates new event AFTER check
```

If two identical webhooks arrive simultaneously, both could pass the `existingEvent?.processed` check before either creates the record, leading to double-processing.

**Recommendation:** Use database unique constraint on `eventId` with `ON CONFLICT DO NOTHING`, or use a transaction with `SELECT FOR UPDATE`.

---

### CRITICAL-3: Missing Transaction Atomicity in Webhook

**File:** `src/app/api/webhooks/aamarpay/route.ts` (lines 69-104)

**Issue:**
Three separate database operations are performed without a transaction:
1. `db.paymentLink.update(...)`
2. `db.transaction.create(...)`
3. `db.auditLog.create(...)`

If any operation fails after a previous one succeeds, the system is left in an inconsistent state (e.g., payment marked as PAID but no transaction record created).

**Recommendation:** Wrap these operations in `db.$transaction()`.

---

### CRITICAL-4: Payout Marks All Transactions Without Reservation

**File:** `src/app/api/payouts/route.ts` (lines 113-123)

**Issue:**
```javascript
await db.transaction.updateMany({
  where: {
    userId: session.user.id,
    status: 'SUCCESS',
    payoutStatus: 'PENDING'
  },
  data: {
    payoutStatus: 'PROCESSING',
    payoutId: payout.id
  }
})
```

This marks ALL pending transactions for this user as PROCESSING when a single payout is initiated. If the payout fails, there's no mechanism to rollback - transactions remain stuck in PROCESSING state permanently.

**Recommendation:** Implement a reservation system that only marks the specific transactions being paid out, or implement proper rollback on payout failure.

---

## 2. Major Issues

### MAJOR-1: No Amount Validation in Webhook

**File:** `src/app/api/webhooks/aamarpay/route.ts` (line 64)

**Issue:**
```javascript
const amount = Math.round(parseFloat(payload.amount || '0') * 100)
```

The webhook accepts any amount from aamarpay without validating it matches the original payment link amount. An attacker could potentially send a forged webhook with a different amount.

**Recommendation:** Fetch the payment link and validate `payload.amount` matches `paymentLink.amount`.

---

### MAJOR-2: Missing Environment Variable Validation

**File:** `src/lib/api/aamarPay.ts` (lines 1-4)

**Issue:**
```javascript
const STORE_ID = process.env.AAMARPAY_STORE_ID
const SIGNATURE_KEY = process.env.AAMARPAY_SIGNATURE_KEY
const API_KEY = process.env.AAMARPAY_KEY
```

These critical secrets could be `undefined` if not set, leading to silent failures or security issues.

**Recommendation:** Add startup validation that throws an error if required environment variables are missing.

---

### MAJOR-3: bKash Token Caching Has No Persistence

**File:** `src/lib/api/bkash.ts` (lines 21-26)

**Issue:**
```javascript
let cachedToken: { token: string; expiresAt: number } | null = null
```

The token is cached in-memory only. In serverless environments (Vercel, etc.), this cache is lost between invocations, causing unnecessary token refresh calls. More critically, there's no handling for token refresh failure.

**Recommendation:** Implement token refresh with proper error handling and consider using a more persistent cache (Redis) for serverless deployments.

---

### MAJOR-4: Webhook Logs Potentially Sensitive Data

**File:** `src/app/api/webhooks/aamarpay/route.ts` (line 29)

**Issue:**
```javascript
console.log('Invalid webhook signature')
```

While this specific log is fine, the webhook payload contains `card_number` field. Ensure no PII/sensitive data is ever logged. Consider using a structured logger that redacts sensitive fields automatically.

---

### MAJOR-5: No Rate Limiting on Webhook Endpoint

**File:** `src/app/api/webhooks/aamarpay/route.ts`

**Issue:**
The webhook endpoint has no rate limiting, making it vulnerable to abuse.

**Recommendation:** Implement rate limiting middleware.

---

### MAJOR-6: Bank Transfer Endpoint Returns 501 But Still Processes

**File:** `src/app/api/payouts/route.ts` (lines 144-147)

**Issue:**
```javascript
return NextResponse.json(
  { error: 'Bank transfer not yet implemented' },
  { status: 501 }
)
```

The endpoint returns 501 but the data flow doesn't prevent a user from selecting BANK method through the UI and hitting this error. The UI should also disable this option.

---

## 3. Minor Issues

### MINOR-1: Invoice Amount Display Assumes 2 Decimal Places

**File:** `src/lib/invoice.ts` (lines 95, 114-115, 129)

**Issue:**
```javascript
text(`৳${(paymentLink.amount / 100).toLocaleString('en-BD', { minimumFractionDigits: 2 })}`, ...)
```

While the schema stores amounts as integers (cents/taka-pox), the display formatting assumes specific decimal behavior. This is actually correct, but the comment would help.

---

### MINOR-2: Missing Type Safety on aamarpay Response

**File:** `src/lib/api/aamarPay.ts` (lines 51-55)

**Issue:**
```javascript
const data = await response.json()
if (data.result !== 'true' && data.result !== true) {
```

The response type is not defined, relying on `any`. While there's basic type checking, the response structure from aamarpay could change silently.

---

### MINOR-3: No Exponential Backoff on Retry Logic

**File:** `src/lib/api/bkash.ts`

**Issue:** Token refresh or payout calls don't implement exponential backoff for transient failures.

---

### MINOR-4: getInvoiceStream Returns Promise<Buffer> as ReadableStream

**File:** `src/lib/invoice.ts` (lines 146-148)

**Issue:**
```javascript
export function getInvoiceStream(data: InvoiceData): Promise<NodeJS.ReadableStream> {
  return generateInvoicePDF(data) as Promise<NodeJS.ReadableStream>
}
```

The return type is misleading - `generateInvoicePDF` returns `Promise<Buffer>`, not `Promise<ReadableStream>`. This type cast is incorrect and could cause runtime errors.

---

### MINOR-5: shareUrl Generation Uses Math.random

**File:** `src/app/api/payment-links/route.ts` (line 58)

**Issue:**
```javascript
const shareUrl = `${Date.now().toString(36)}-${Math.random().toString(36).substring(2, 8)}`
```

`Math.random()` is not cryptographically secure. While not a critical issue for share URLs (they're not secrets), it's a code smell.

**Recommendation:** Use `crypto.randomUUID()` or `crypto.getRandomValues()`.

---

## 4. Security Vulnerabilities

### VULN-1: Webhook Signature Bypass Risk

- **Severity:** Critical
- **Vector:** If aamarpay's JSON serialization differs from `JSON.stringify()`, signature verification always fails, potentially causing legitimate payments to not be recorded.
- **Mitigation:** Confirm aamarpay's signature format and test with sandbox.

### VULN-2: Payment Amount Manipulation

- **Severity:** Major
- **Vector:** Webhook accepts arbitrary amount from payload without server-side validation against original payment link.
- **Mitigation:** Add amount validation in webhook handler.

### VULN-3: No CSRF Protection Detected

- **Severity:** Major
- **Vector:** State-changing operations (payout, payment link creation) may lack CSRF tokens.
- **Mitigation:** Verify all POST endpoints validate CSRF tokens via NextAuth.

### VULN-4: Sensitive Data in Logs

- **Severity:** Minor
- **Vector:** Webhook payloads may contain card numbers or other PII.
- **Mitigation:** Implement structured logging with automatic PII redaction.

---

## 5. UI/UX Compliance

### UX-1: Button Touch Target Too Small

**File:** `src/components/ui/button.tsx` (line 19)

**Issue:**
```javascript
default: 'h-9 px-4 py-2',  // h-9 = 36px height
```

Buttons are 36px tall, but accessibility guidelines require minimum 44px (iOS) / 48px (Android) touch targets.

**UI/UX Standards Violated:**
- `touch-target-size` - Minimum 44x44pt
- `touch-spacing` - Minimum 8px gap

---

### UX-2: No Loading State on Buttons

**Issue:** Buttons don't have built-in loading spinner support. When submitting forms or initiating payouts, users don't get visual feedback that the action is in progress.

**UI/UX Standards Violated:**
- `loading-buttons` - Disable button during async operations; show spinner

---

### UX-3: Input Component Missing Explicit Label Association

**File:** `src/components/ui/input.tsx`

**Issue:** The Input component accepts `placeholder` and `aria-label` via spread props, but shadcn/ui's default pattern relies on external labels (e.g., using `Label` component with `htmlFor`). This is fine if used correctly, but the component alone doesn't enforce visible labels.

**UI/UX Standards Violated:**
- `form-labels` - Visible label per input (not placeholder-only)

---

### UX-4: No Dark Mode Support

**Issue:** No CSS variable system for dark mode detected. The app only supports light theme.

**UI/UX Standards Violated:**
- `dark-mode-pairing` - Design light/dark variants together

---

### UX-5: Error Messages Not Near Fields

**Issue:** API routes return validation errors that would be displayed at the top of forms, not near the specific fields that failed.

**UI/UX Standards Violated:**
- `error-placement` - Show error below the related field
- `error-clarity` - Error messages must state cause + how to fix

---

## 6. Test Coverage

### TEST-1: No Unit Tests Found

**Severity:** Critical

No test files (`.test.ts`, `.spec.ts`, `*.test.js`, `*.spec.js`) found in the repository.

**Coverage Needed:**
- Payment link creation flow
- bKash payout initiation and status checking
- aamarpay webhook processing
- Invoice PDF generation
- Fee calculations (platform: 0.75%, gateway: 2.55%)
- Input validation (zod schemas)

---

## 7. Recommendations

### Immediate (Before Next Release)

1. **Fix webhook signature verification** - Verify aamarpay's JSON format and update `verifyWebhookSignature`
2. **Add database transaction** to webhook handler
3. **Fix idempotency race condition** using unique constraint + conflict handling
4. **Add amount validation** in webhook against payment link amount
5. **Add unit tests** for core payment logic

### Short Term (This Sprint)

1. Implement proper token caching strategy for bKash (consider Redis for serverless)
2. Add environment variable validation at startup
3. Fix button touch targets to meet 44px minimum
4. Implement loading states on buttons
5. Add rate limiting to webhook endpoint

### Medium Term (Next Release)

1. Add comprehensive integration tests
2. Implement dark mode support
3. Add proper error boundary components
4. Implement PII redaction in logging
5. Add payout rollback mechanism

---

## Appendix: Code Quality Ratings

| File | Issues | Rating |
|------|--------|--------|
| `src/lib/api/aamarPay.ts` | 3 Critical, 2 Major | 55% |
| `src/lib/api/bkash.ts` | 1 Major, 2 Minor | 70% |
| `src/app/api/webhooks/aamarpay/route.ts` | 3 Critical, 2 Major | 50% |
| `src/lib/invoice.ts` | 1 Minor | 85% |
| `prisma/schema.prisma` | 0 | 90% |
| `src/app/api/payment-links/route.ts` | 1 Minor | 80% |
| `src/app/api/payouts/route.ts` | 1 Critical, 1 Major | 65% |
| UI Components | 3 Major UX | 60% |

---

*Report generated by Evaluator Agent for LinkPay BD*
