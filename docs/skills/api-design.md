---
name: api-design
description: REST API design principles, patterns, and best practices for building scalable backend services
source: supercent-io/skills-template@api-design (11.5K installs)
---

# API Design Skill

Comprehensive guide to designing RESTful APIs that are intuitive, scalable, and maintainable.

## When to Use

- Designing new API endpoints
- Creating API contracts
- Structuring request/response formats
- Planning backend architecture

## REST Principles

### Resource Naming

| Action | Method | Endpoint | Description |
|--------|--------|----------|-------------|
| List | GET | `/payment-links` | Get all payment links |
| Get one | GET | `/payment-links/:id` | Get single payment link |
| Create | POST | `/payment-links` | Create payment link |
| Update | PUT | `/payment-links/:id` | Update payment link |
| Delete | DELETE | `/payment-links/:id` | Delete payment link |

### URL Structure
```
# Good
GET /users/123/payment-links
GET /payment-links?status=pending&sort=created_at

# Bad
GET /getUser?id=123
GET /api/v2/payment/link/create
```

## Request/Response Format

### Standard Response Envelope
```json
{
  "success": true,
  "data": { },
  "message": "Operation successful",
  "error": null
}
```

### Error Response
```json
{
  "success": false,
  "data": null,
  "message": "Validation failed",
  "error": {
    "code": "VALIDATION_ERROR",
    "details": [
      { "field": "amount", "message": "Amount must be positive" }
    ]
  }
}
```

### Pagination
```json
{
  "success": true,
  "data": [ ],
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 100,
    "totalPages": 5
  }
}
```

## HTTP Status Codes

| Code | Meaning | When to Use |
|------|---------|-------------|
| 200 | OK | Successful GET, PUT |
| 201 | Created | Successful POST |
| 204 | No Content | Successful DELETE |
| 400 | Bad Request | Validation errors |
| 401 | Unauthorized | Missing/invalid auth |
| 403 | Forbidden | Authenticated but no permission |
| 404 | Not Found | Resource doesn't exist |
| 409 | Conflict | Duplicate resource |
| 422 | Unprocessable | Business rule violation |
| 500 | Server Error | Unexpected error |

## Authentication

### Bearer Token
```
Authorization: Bearer <token>
```

### API Key (for webhooks)
```
X-API-Key: <api_key>
X-Signature: <hmac_signature>
```

## Webhook Design (aamarPay)

### Verification
```javascript
// Verify webhook signature
const crypto = require('crypto');

function verifyWebhookSignature(payload, signature, secret) {
  const expected = crypto
    .createHmac('sha256', secret)
    .update(JSON.stringify(payload))
    .digest('hex');
  return signature === expected;
}
```

### Idempotency
```javascript
// Process webhook idempotently
async function handleWebhook(event) {
  const existing = await db.webhookEvents.findOne({ 
    eventId: event.id 
  });
  
  if (existing) {
    return { status: 'already_processed' };
  }
  
  await db.webhookEvents.create({ eventId: event.id, ...event });
  // Process event...
}
```

## Versioning

```
# URL versioning
GET /api/v1/payment-links
GET /api/v2/payment-links

# Header versioning (alternative)
Accept: application/vnd.api.v1+json
```

## Rate Limiting

```
X-RateLimit-Limit: 100
X-RateLimit-Remaining: 95
X-RateLimit-Reset: 1640000000
```

## Best Practices

1. **Consistency** — Use same patterns across all endpoints
2. **Simplicity** — Keep URLs simple and intuitive
3. **Documentation** — Document every endpoint with examples
4. **Validation** — Validate all input, return clear errors
5. **Security** — Always authenticate, sanitize output
6. **Idempotency** — POST/PUT/DELETE should be idempotent
7. **Pagination** — Always paginate list endpoints

## For LinkPay BD API

### Core Endpoints

```
# Authentication
POST   /api/auth/register
POST   /api/auth/login
POST   /api/auth/refresh

# Payment Links
GET    /api/payment-links
POST   /api/payment-links
GET    /api/payment-links/:id
PUT    /api/payment-links/:id
DELETE /api/payment-links/:id

# Transactions
GET    /api/transactions
GET    /api/transactions/:id

# Payouts
GET    /api/payouts
POST   /api/payouts/request
GET    /api/payouts/:id

# Webhooks
POST   /api/webhooks/aamarpay
POST   /api/webhooks/bkash

# Users
GET    /api/users/me
PUT    /api/users/me
GET    /api/users/me/analytics
```

### Request Examples

```javascript
// Create payment link
POST /api/payment-links
{
  "amount": 5000,
  "description": "Website development project",
  "customerEmail": "client@example.com",
  "customerName": "John Doe"
}

// Response
{
  "success": true,
  "data": {
    "id": "plink_abc123",
    "url": "https://linkpay.bd/pay/abc123",
    "amount": 5000,
    "status": "pending"
  }
}
```
