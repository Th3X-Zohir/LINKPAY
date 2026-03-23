---
name: code-review-quality
description: Code review checklist, quality standards, and best practices for evaluating code quality
source: proffesor-for-testing/agentic-qe@code-review-quality (660 installs)
---

# Code Review Quality Skill

Comprehensive checklist and guidelines for conducting effective code reviews.

## When to Use

- Reviewing pull requests
- Performing code quality audits
- Validating implementations
- Pre-deployment checks

## Review Checklist

### 1. Correctness (15%)

- [ ] Code does what the specification says
- [ ] All edge cases handled
- [ ] No off-by-one errors
- [ ] Null/undefined handling
- [ ] Type safety enforced

### 2. Security (25%)

- [ ] Input validation on all user inputs
- [ ] SQL injection prevention (parameterized queries)
- [ ] XSS prevention (React auto-escapes)
- [ ] CSRF protection on state-changing operations
- [ ] Webhook signature verification (aamarPay)
- [ ] Sensitive data not logged
- [ ] Secrets not hardcoded

### 3. Error Handling (15%)

- [ ] Try-catch around async operations
- [ ] Meaningful error messages
- [ ] Errors logged with context
- [ ] Graceful degradation
- [ ] No unhandled promise rejections

### 4. Performance (10%)

- [ ] No N+1 queries
- [ ] Appropriate indexing
- [ ] Lazy loading where applicable
- [ ] Images optimized
- [ ] Bundle size reasonable

### 5. Testing (15%)

- [ ] Unit tests for business logic
- [ ] Integration tests for API
- [ ] Edge case coverage
- [ ] No commented-out tests

### 6. Maintainability (10%)

- [ ] Clear naming conventions
- [ ] Functions single-purpose
- [ ] No code duplication
- [ ] Appropriate comments
- [ ] Consistent style

### 7. Accessibility (10%)

- [ ] Color contrast ≥ 4.5:1
- [ ] Keyboard navigation
- [ ] Focus states visible
- [ ] aria-labels present
- [ ] Touch targets ≥ 44px

## Severity Levels

| Level | Impact | Action |
|-------|--------|--------|
| **Critical** | Security vulnerability, data loss | Must fix before merge |
| **Major** | Functional bug, broken feature | Should fix before merge |
| **Minor** | Code smell, style issue | Fix when convenient |
| **Info** | Suggestion, best practice | No blocking |

## Review Comments Template

```markdown
## [Critical/Major/Minor/Info] - Brief Title

**File:** `src/path/file.ts`
**Line:** 42

**Issue:**
Description of the problem.

**Suggestion:**
How to fix it.

**Example:**
```javascript
// Current (problematic)
const result = query;

// Recommended
const result = await query;
```
```

## Security Checklist (Fintech Critical)

### Authentication
- [ ] JWT tokens validated on every request
- [ ] Refresh tokens rotated properly
- [ ] Password hashing with bcrypt (cost factor 12+)
- [ ] MFA available for sensitive operations

### Payment Security
- [ ] Webhook signatures verified
- [ ] Transaction amounts validated server-side
- [ ] Idempotency keys enforced
- [ ] Audit logging for all transactions
- [ ] NID/TIN data encrypted at rest

### Data Protection
- [ ] PII not logged
- [ ] Database encryption
- [ ] TLS for all connections
- [ ] Environment variables for secrets

## Performance Checklist

- [ ] No blocking main thread
- [ ] Images use WebP/AVIF
- [ ] Code splitting enabled
- [ ] Dependencies tree-shaken
- [ ] Caching headers set
- [ ] Database queries optimized

## For LinkPay BD Reviews

Focus especially on:
1. **Payment security** — Never lose money data
2. **Webhook reliability** — aamarPay integration
3. **bKash payout accuracy** — Correct amounts
4. **NID/TIN compliance** — Legal requirements
5. **Transaction atomicity** — No partial states

## Rating Calculation

```
Score = (Correctness × 0.15) + (Security × 0.25) + 
        (ErrorHandling × 0.15) + (Performance × 0.10) +
        (Testing × 0.15) + (Maintainability × 0.10) +
        (Accessibility × 0.10)

≥80: APPROVED
60-79: CHANGES REQUESTED
<60: REJECTED
```
