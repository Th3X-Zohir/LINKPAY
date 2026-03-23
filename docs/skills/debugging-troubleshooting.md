---
name: debugging-troubleshooting
description: Systematic debugging approaches, troubleshooting techniques, and problem-solving strategies
source: josiahsiegel/claude-plugin-marketplace@debugging-troubleshooting-2025 (74 installs)
---

# Debugging & Troubleshooting Skill

Systematic approaches to diagnosing and fixing issues efficiently.

## When to Use

- Investigating bugs
- Troubleshooting failures
- Diagnosing performance issues
- Debugging integrations

## Systematic Debugging Workflow

### Step 1: Gather Information

```
Questions to answer:
- What is the expected behavior?
- What is the actual behavior?
- When did it start happening?
- Can you reproduce it consistently?
- What has changed recently?
```

### Step 2: Create Reproduction Case

```javascript
// Minimal reproduction
const testCase = {
  input: { amount: 1000 },
  expected: { status: 'pending' },
  actual: { status: 'failed' }
};
```

### Step 3: Narrow Down

```
Divide and conquer:
1. Is it frontend or backend?
2. Is it API or database?
3. Is it authentication?
4. Is it a specific field/value?
```

### Step 4: Apply Fix

```javascript
// Fix principle: Minimal change
// Before: Complex refactor
// After: Targeted fix
```

### Step 5: Verify

```
- Run the specific test case
- Run related tests
- Check for side effects
- Deploy to test environment
```

## Common Issue Patterns

### Payment Issues

#### Webhook Not Processing

```javascript
// Diagnosis
1. Check server logs for incoming webhooks
   grep "webhook" logs/server.log

2. Verify signature
   const isValid = verifySignature(payload, signature);

3. Check database
   db.transactions.findOne({ webhookId: event.id });

// Solution
- Restart webhook processor
- Manually reconcile transactions
- Add retry queue
```

#### Payment Link Creation Fails

```javascript
// Diagnosis
1. Verify aamarPay API credentials
2. Check request body validation
3. Test API endpoint directly

// Common causes
- Expired API key
- Missing required fields
- Amount below minimum (৳10)
- Amount above maximum (৳500000)
```

### Database Issues

#### Slow Queries

```javascript
// Diagnosis
1. Check query plan
   db.transactions.find({ userId: id }).explain()

2. Look for missing indexes
3. Check query complexity

// Solutions
- Add index: db.transactions.createIndex({ userId: 1, createdAt: -1 })
- Optimize query
- Cache frequently accessed data
```

#### Connection Issues

```javascript
// Diagnosis
1. Check connection pool
2. Verify database server
3. Check network connectivity

// Common causes
- Connection pool exhausted
- Database server down
- Network timeout
```

### Frontend Issues

#### Form Submission Fails

```javascript
// Diagnosis
1. Check browser console
2. Verify API endpoint
3. Check request/response

// Common causes
- CSRF token expired
- Request too large
- CORS policy
- Missing auth header
```

#### Performance Issues

```javascript
// Diagnosis
1. Check Network tab
2. Measure Core Web Vitals
3. Check bundle size

// Solutions
- Lazy load components
- Optimize images
- Code split routes
- Enable compression
```

## Diagnostic Commands

### Node.js

```bash
# Check for unhandled rejections
node --unhandled-rejections=strict app.js

# Memory leaks
node --inspect app.js
# Then use Chrome DevTools

# CPU profiling
node --prof app.js
```

### Database

```bash
# MongoDB
db.currentOp()
db.killOp(opid)

# PostgreSQL
SELECT * FROM pg_stat_activity;
SELECT * FROM pg_locks;
```

### Network

```bash
# Check webhook delivery
curl -I https://api.aamarpay.com/webhook

# Test API response
curl -X POST https://api.aamarpay.com/payment \
  -H "Content-Type: application/json" \
  -d '{}'
```

## Logging Best Practices

```javascript
// Good logging
logger.info('Payment link created', {
  userId: user.id,
  paymentLinkId: paymentLink.id,
  amount: paymentLink.amount,
  duration: Date.now() - startTime
});

// Bad logging
logger.info('Created'); // No context
```

## For LinkPay BD

### Critical Debug Paths

1. **Payment Flow**
   ```
   Client → Form Submit → API → aamarPay → Webhook → DB → Payout
   ```

2. **Checkpoints**
   - [ ] Form validation
   - [ ] API request sent
   - [ ] aamarPay response
   - [ ] Webhook received
   - [ ] DB updated
   - [ ] Payout triggered

### Quick Diagnostics

```bash
# Check recent errors
Get-Content logs/error.log -Tail 50 | Select-String "payment"

# Check webhook queue
curl http://localhost:3000/api/debug/webhooks

# Check aamarPay status
curl https://status.aamarpay.com
```

## Escalation Path

```
Can't fix in 30 min?
1. Check logs thoroughly
2. Try reproduction case
3. Check recent changes
4. Escalate to architect
```
