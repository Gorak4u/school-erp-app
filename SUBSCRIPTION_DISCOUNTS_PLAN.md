# Subscription Discounts - Promo Code System Implementation Plan

## 🎯 **Project Overview**
Implement a comprehensive promo code system for subscription discounts in the School ERP SaaS platform.

## 🏗️ **Architecture Decision**
**Chosen**: Promo Code System (flexible, trackable, marketing-friendly)

**Benefits**:
- ✅ Marketing campaigns support
- ✅ Usage tracking and analytics
- ✅ Flexible discount types (percentage/fixed)
- ✅ Plan-specific targeting
- ✅ Usage limits and expiry dates
- ✅ Audit trail for business compliance

## 📊 **Implementation Phases**

### **Phase 1: Foundation (High Priority)**
#### **1. Database Schema** ✅ IN PROGRESS
- **PromoCode Model**: Core promo code definition
- **SubscriptionPromo Model**: Track promo usage per subscription
- **Database Migration**: Apply schema changes

#### **2. Core APIs** (Next 4 tasks)
- **Admin CRUD API**: `/api/admin/promo-codes` (Create/Read/Update/Delete)
- **Validation API**: `/api/promo-codes/validate` (Public validation)
- **Apply Promo API**: `/api/subscription/apply-promo` (Apply to subscription)
- **Payment Integration**: Modify Razorpay order creation

### **Phase 2: User Experience (Medium Priority)**
#### **3. Admin Interface**
- **Promo Management UI**: Add to `/admin/plans` page
- **Bulk Operations**: Create/edit/delete promo codes
- **Analytics Dashboard**: Usage tracking

#### **4. Customer Interface**
- **Signup Flow**: Promo code input field
- **Real-time Validation**: Check validity as user types
- **Discount Preview**: Show savings before payment

### **Phase 3: Enhancement (Low Priority)**
#### **5. Advanced Features**
- **Analytics & Reporting**: Usage patterns, ROI tracking
- **Expiry Management**: Auto-cleanup, notifications
- **Testing**: Comprehensive test coverage
- **Documentation**: API docs and user guides

## 📋 **Detailed Task Breakdown**

### **Phase 1 Tasks**
| Task ID | Task Name | Status | Priority | Dependencies |
|---------|-----------|--------|----------|--------------|
| subscription-discounts-architecture | Design discount architecture | ✅ Completed | High | None |
| subscription-discounts-schema | Add PromoCode and SubscriptionPromo models | 🔄 In Progress | High | Architecture |
| subscription-discounts-migration | Create Prisma migration | ⏳ Pending | High | Schema |
| subscription-discounts-admin-api | Create /api/admin/promo-codes CRUD API | ⏳ Pending | High | Migration |
| subscription-discounts-validate-api | Create /api/promo-codes/validate API | ⏳ Pending | High | Migration |
| subscription-discounts-apply-api | Create /api/subscription/apply-promo API | ⏳ Pending | High | Migration |
| subscription-discounts-payment-integration | Modify payment processing for discounts | ⏳ Pending | High | Apply API |

### **Phase 2 Tasks**
| Task ID | Task Name | Status | Priority | Dependencies |
|---------|-----------|--------|----------|--------------|
| subscription-discounts-admin-ui | Add PromoCode management to /admin/plans | ⏳ Pending | Medium | Admin API |
| subscription-discounts-signup-ui | Add promo input to subscription flow | ⏳ Pending | Medium | Validate API |
| subscription-discounts-invoice-updates | Update invoice generation | ⏳ Pending | Medium | Payment Integration |
| subscription-discounts-lib-updates | Update subscription utilities | ⏳ Pending | Medium | Payment Integration |

### **Phase 3 Tasks**
| Task ID | Task Name | Status | Priority | Dependencies |
|---------|-----------|--------|----------|--------------|
| subscription-discounts-analytics | Add discount analytics | ⏳ Pending | Low | All Phase 1 & 2 |
| subscription-discounts-expiry-handling | Add expiry notifications/cleanup | ⏳ Pending | Low | All Phase 1 & 2 |
| subscription-discounts-testing | Add comprehensive tests | ⏳ Pending | Medium | All Phase 1 & 2 |
| subscription-discounts-documentation | Update documentation | ⏳ Pending | Low | All Phase 1 & 2 |

## 🗃️ **Database Schema Design**

### **PromoCode Model (saas schema)**
```prisma
model PromoCode {
  id                String    @id @default(cuid())
  code              String    @unique
  description       String?
  discountType      String    // "percentage" or "fixed"
  discountValue     Float     // e.g., 20.0 for 20% or ₹2000
  maxDiscountAmount Float?    // Cap for percentage discounts
  applicablePlans   String    // JSON array: ["basic", "professional"] or "all"
  usageLimit        Int?      // Max times usable across all users
  usageCount        Int       @default(0) // Current usage count
  validFrom         DateTime
  validTo           DateTime
  isActive          Boolean   @default(true)
  createdBy         String    // Super admin email
  createdAt         DateTime  @default(now())
  updatedAt         DateTime  @updatedAt

  subscriptionPromos SubscriptionPromo[]

  @@index([code])
  @@index([isActive])
  @@schema("saas")
}
```

### **SubscriptionPromo Model (saas schema)**
```prisma
model SubscriptionPromo {
  id             String    @id @default(cuid())
  subscriptionId String
  promoCodeId    String
  discountAmount Float     // Actual discount amount applied
  appliedAt      DateTime  @default(now())

  subscription   Subscription @relation(fields: [subscriptionId], references: [id])
  promoCode      PromoCode    @relation(fields: [promoCodeId], references: [id])

  @@unique([subscriptionId, promoCodeId]) // One promo per subscription
  @@schema("saas")
}
```

### **Subscription Model Updates**
Add to existing Subscription model:
```prisma
model Subscription {
  // ... existing fields ...

  // New discount-related fields
  promoCodeId      String?
  discountAmount   Float       @default(0)
  discountType     String?     // "percentage" or "fixed"
  originalAmount   Float?      // Store original price before discount

  // Relations
  promoCodes       SubscriptionPromo[]

  // ... rest of model ...
}
```

## 🔗 **API Endpoints Design**

### **1. Admin CRUD API** (`/api/admin/promo-codes`)
- **GET**: List all promo codes with filtering/pagination
- **POST**: Create new promo code
- **PUT**: Update existing promo code
- **DELETE**: Deactivate promo code (soft delete)

### **2. Validation API** (`/api/promo-codes/validate`)
- **POST**: `{ code: "WELCOME20", plan: "basic" }`
- **Response**: `{ valid: true, discount: { type: "percentage", value: 20, maxAmount: 1000 } }`

### **3. Apply Promo API** (`/api/subscription/apply-promo`)
- **POST**: `{ schoolId: "...", promoCode: "WELCOME20", plan: "basic" }`
- **Response**: `{ success: true, discountedAmount: 799, originalAmount: 999 }`

## 💰 **Discount Calculation Logic**

### **Percentage Discount**
```typescript
const calculatePercentageDiscount = (
  originalAmount: number,
  discountValue: number, // e.g., 20 for 20%
  maxDiscountAmount?: number // e.g., 1000 max discount
): number => {
  const calculatedDiscount = (originalAmount * discountValue) / 100;
  return maxDiscountAmount ? Math.min(calculatedDiscount, maxDiscountAmount) : calculatedDiscount;
};
```

### **Fixed Discount**
```typescript
const calculateFixedDiscount = (
  discountValue: number // e.g., 1000 for ₹1000 off
): number => {
  return discountValue;
};
```

## 🔄 **Business Logic Flow**

### **Signup Flow with Promo Code**
1. **User enters promo code** during signup
2. **Frontend validates** code via `/api/promo-codes/validate`
3. **Show discount preview** (original price vs discounted price)
4. **Apply promo** when creating subscription
5. **Store promo relationship** in SubscriptionPromo table
6. **Process payment** with discounted amount
7. **Generate invoice** showing discount breakdown

### **Admin Management Flow**
1. **Super admin creates** promo codes in admin panel
2. **Set validity period**, usage limits, applicable plans
3. **Monitor usage** through analytics dashboard
4. **Deactivate expired** or over-used promo codes

## 📈 **Success Metrics**

### **Business Metrics**
- **Conversion Rate**: Trial to paid conversion with discounts
- **Revenue Impact**: Discount cost vs additional revenue from conversions
- **Plan Distribution**: Which plans benefit most from discounts
- **Customer Lifetime Value**: LTV of discounted vs regular customers

### **Technical Metrics**
- **API Performance**: Response times for validation/apply endpoints
- **Error Rates**: Failed promo applications
- **Usage Patterns**: Peak usage times, most popular codes

## 🧪 **Testing Strategy**

### **Unit Tests**
- Discount calculation functions
- Promo code validation logic
- Database model relationships

### **Integration Tests**
- End-to-end promo application flow
- Payment processing with discounts
- Admin CRUD operations

### **Edge Cases**
- Expired promo codes
- Usage limit exceeded
- Invalid plan combinations
- Concurrent usage (race conditions)

## 🚀 **Rollout Strategy**

### **Phase 1 Rollout**
- Deploy schema changes and APIs
- Enable for super admin testing only
- Validate payment integration

### **Phase 2 Rollout**
- Enable admin interface for promo management
- Add customer-facing promo input
- Monitor usage and performance

### **Phase 3 Rollout**
- Enable analytics and reporting
- Add advanced features
- Full documentation release

## ⚠️ **Risk Mitigation**

### **Technical Risks**
- **Database Migration**: Test thoroughly in staging
- **Payment Integration**: Ensure Razorpay handles discounts correctly
- **Race Conditions**: Implement proper locking for usage limits

### **Business Risks**
- **Discount Abuse**: Monitor for fraudulent usage patterns
- **Revenue Impact**: Track ROI of discount campaigns
- **Customer Expectations**: Clear communication about discount terms

## 📅 **Timeline Estimate**

- **Phase 1**: 2-3 weeks (Foundation)
- **Phase 2**: 2-3 weeks (User Experience)
- **Phase 3**: 1-2 weeks (Enhancements)

**Total Estimated Time**: 5-8 weeks for complete implementation

---

## 🎯 **Current Status**
- ✅ **Architecture Decision**: Promo Code System selected
- 🔄 **Database Schema**: In progress (adding models)
- ⏳ **Migration**: Pending
- ⏳ **APIs**: Pending
- ⏳ **UI Components**: Pending
- ⏳ **Integration**: Pending

**Next Steps**: Complete schema implementation, create migration, then build core APIs.
