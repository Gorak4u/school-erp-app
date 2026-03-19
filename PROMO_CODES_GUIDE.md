# Promo Code Creation Guide

## Method 1: Admin Panel (Recommended)
1. Go to: http://localhost:3000/admin/plans
2. Click "+ Create Promo Code"
3. Fill form and submit

## Method 2: API Endpoint

### Create Promo Code
```bash
curl -X POST "http://localhost:3000/api/admin/promo-codes" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_SESSION_TOKEN" \
  -d '{
    "code": "WELCOME20",
    "description": "Welcome discount for new schools",
    "discountType": "percentage",
    "discountValue": 20,
    "maxDiscountAmount": 5000,
    "applicablePlans": "all",
    "usageLimit": 100,
    "validFrom": "2026-03-19T00:00:00.000Z",
    "validTo": "2026-12-31T23:59:59.999Z",
    "createdBy": "admin@schoolerp.com"
  }'
```

### Response
```json
{
  "success": true,
  "promoCode": {
    "id": "cmmwydp4k0000j35614imx7im",
    "code": "WELCOME20",
    "description": "Welcome discount for new schools",
    "discountType": "percentage",
    "discountValue": 20,
    "maxDiscountAmount": 5000,
    "applicablePlans": "all",
    "usageLimit": 100,
    "usageCount": 0,
    "validFrom": "2026-03-19T04:11:25.169Z",
    "validTo": "2026-12-31T23:59:59.999Z",
    "isActive": true,
    "createdBy": "admin@schoolerp.com",
    "createdAt": "2026-03-19T04:11:25.172Z",
    "updatedAt": "2026-03-19T04:11:25.172Z"
  }
}
```

## Method 3: Test Endpoint (Quick Testing)

### Create Sample Promo
```bash
curl -X POST "http://localhost:3000/api/test/create-sample-promo"
```

## Field Explanations

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `code` | string | ✅ | Unique promo code (auto-uppercase) |
| `description` | string | ❌ | Human-readable description |
| `discountType` | enum | ✅ | "percentage" or "fixed" |
| `discountValue` | number | ✅ | Discount percentage or amount |
| `maxDiscountAmount` | number | ❌ | Max discount for percentage types |
| `applicablePlans` | string | ✅ | "all" or JSON array of plan names |
| `usageLimit` | number | ❌ | Max times promo can be used |
| `validFrom` | datetime | ✅ | When promo becomes active |
| `validTo` | datetime | ✅ | When promo expires |
| `createdBy` | string | ✅ | Admin email who created it |

## Popular Promo Code Examples

### Welcome Discount
```json
{
  "code": "WELCOME20",
  "description": "20% off for new schools",
  "discountType": "percentage",
  "discountValue": 20,
  "maxDiscountAmount": 5000,
  "applicablePlans": "all",
  "usageLimit": 100,
  "validFrom": "2026-03-19T00:00:00.000Z",
  "validTo": "2026-06-30T23:59:59.999Z"
}
```

### Fixed Amount Discount
```json
{
  "code": "SAVE1000",
  "description": "₹1000 off any plan",
  "discountType": "fixed",
  "discountValue": 1000,
  "applicablePlans": "all",
  "usageLimit": 50,
  "validFrom": "2026-03-19T00:00:00.000Z",
  "validTo": "2026-04-30T23:59:59.999Z"
}
```

### Plan-Specific Discount
```json
{
  "code": "BASIC50",
  "description": "50% off Basic plan",
  "discountType": "percentage",
  "discountValue": 50,
  "applicablePlans": "basic",
  "usageLimit": 25,
  "validFrom": "2026-03-19T00:00:00.000Z",
  "validTo": "2026-05-31T23:59:59.999Z"
}
```

## Testing Your Promo Code

### Validate Promo
```bash
curl -X POST "http://localhost:3000/api/promo-codes/validate" \
  -H "Content-Type: application/json" \
  -d '{"code": "WELCOME20", "plan": "basic"}'
```

### Check System Status
```bash
curl "http://localhost:3000/api/test/subscription-discounts"
```

## Managing Existing Promos

### List All Promos
```bash
curl "http://localhost:3000/api/admin/promo-codes"
```

### Update Promo
```bash
curl -X PUT "http://localhost:3000/api/admin/promo-codes" \
  -H "Content-Type: application/json" \
  -d '{
    "id": "cmmwydp4k0000j35614imx7im",
    "discountValue": 25,
    "usageLimit": 150
  }'
```

### Delete Promo
```bash
curl -X DELETE "http://localhost:3000/api/admin/promo-codes?id=PROMO_ID"
```

## Best Practices

1. **Use descriptive codes**: `WELCOME20` instead of `DISC1`
2. **Set reasonable limits**: Prevent abuse with usage limits
3. **Clear descriptions**: Help users understand the offer
4. **Proper expiry dates**: Create urgency with time limits
5. **Test thoroughly**: Always validate before publishing
