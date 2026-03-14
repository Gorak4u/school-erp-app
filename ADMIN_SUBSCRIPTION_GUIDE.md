# Admin Subscription Management Guide

## 🎯 **How School Admins Can View and Manage Subscriptions**

School administrators have multiple ways to view their subscription details, renew plans, and upgrade their accounts from their login area.

---

## 📍 **Access Points for Subscription Management**

### **1. Navigation Sidebar** 💳
**Location**: Left sidebar in dashboard
- **Link**: `/subscription` 
- **Label**: "Subscription" with 💳 icon
- **Access**: Available to all logged-in school admins

### **2. Subscription Banner** 📢
**Location**: Top of every page (dismissible)
- **Shows**: Current subscription status and usage
- **Actions**: "Manage" and "Upgrade" buttons
- **Dynamic**: Different colors for different statuses

### **3. Billing Page** 💰
**Location**: `/billing`
- **Access**: Direct billing management
- **Focus**: Payment processing and plan selection
- **Actions**: Upgrade, renew, change billing cycle

---

## 📊 **What Admins Can See**

### **🎛️ Subscription Overview Page** (`/subscription`)

#### **Current Subscription Details:**
- ✅ **Plan Name**: Basic, Premium, Enterprise, etc.
- ✅ **Status**: Active, Trial, Expired, Cancelled, Pending Payment
- ✅ **Usage Metrics**: Students used/max, Teachers used/max
- ✅ **Visual Progress Bars**: Color-coded usage indicators
- ✅ **Next Billing Date**: When next payment is due

#### **Real-time Status Indicators:**
```typescript
// Status Colors & Meanings
🟢 Active: Green - Everything working fine
🔵 Trial: Blue - Free trial period
🔴 Expired: Red - Trial ended, need renewal
🟡 Pending: Yellow - Payment processing
⚪ Cancelled: Gray - Subscription cancelled
```

#### **Usage Analytics:**
- 📊 **Students**: `45/200` (22% used)
- 👨‍🏫 **Teachers**: `8/20` (40% used)
- 🎯 **Limits**: Visual bars with color coding:
  - 🟢 Green: < 70% usage
  - 🟡 Yellow: 70-90% usage  
  - 🔴 Red: > 90% usage

---

## 🔄 **Renewal & Upgrade Options**

### **1. Quick Actions from Banner**
```typescript
// Trial Banner (≤ 7 days left)
"Manage" → /subscription (view details)
"Upgrade" → /billing (choose new plan)

// Active Subscription Banner  
"Manage" → /subscription (view/change plan)

// Expired Banner
"Manage" → /subscription (view options)
"Choose a Plan" → /pricing (select new plan)
```

### **2. Plan Comparison & Upgrade**
**Location**: `/subscription` page bottom section

#### **Available Plans Display:**
- 💳 **Pricing**: Monthly/Yearly with 20% yearly discount
- 📊 **Side-by-side comparison** of all active plans
- 🎯 **Feature highlights** for each plan
- ✅ **Current plan indicator** (purple ring)
- 🔘 **Upgrade buttons** for non-current plans

#### **Upgrade Process:**
1. **Click "Upgrade"** on desired plan
2. **Redirect to `/billing`** with plan pre-selected
3. **Choose billing cycle** (monthly/yearly)
4. **Process payment** via Razorpay
5. **Immediate activation** of new plan

### **3. Billing Cycle Management**
```typescript
// Billing Toggle Options
Monthly: ₹999/month
Yearly: ₹799/month (Save 20%!)

// Benefits of Yearly:
- 20% cost savings
- One-time payment
- No monthly interruptions
```

---

## 🚨 **Status-Specific Actions**

### **🔵 Trial Users**
- **Days Remaining**: Countdown display
- **Urgency**: Red banner if ≤ 3 days left
- **Actions**: "Manage" details, "Upgrade" to paid plan
- **Auto-expiry**: Redirect to `/trial-expired` after expiry

### **🟢 Active Subscriptions**
- **Usage Monitoring**: Real-time student/teacher counts
- **Next Billing**: Shows upcoming payment date
- **Plan Changes**: Can upgrade anytime
- **Billing Cycle**: Switch monthly ↔ yearly

### **🔴 Expired Subscriptions**
- **Block Access**: Cannot use premium features
- **Redirect**: Sent to `/subscription-required`
- **Actions**: "Manage" to view options, "Choose a Plan"
- **Data Preservation**: Data kept for 30 days after expiry

### **🟡 Pending Payment**
- **Limited Access**: Can access billing pages only
- **Payment Retry**: Complete failed payment
- **Actions**: "Complete Payment" button
- **Restrictions**: Blocked from other features

---

## 📱 **User Experience Flow**

### **1. Admin Logs In**
```
Dashboard → Subscription Banner (top) → Shows current status
```

### **2. Admin Clicks "Subscription" in Sidebar**
```
/subscription → Full overview → Usage metrics → Plan options
```

### **3. Admin Wants to Upgrade**
```
View Plans → Click "Upgrade" → /billing → Payment → Confirmation
```

### **4. Admin Needs to Renew**
```
Subscription Banner → "Manage" → /subscription → "Renew Now"
```

---

## 🛠️ **Technical Implementation**

### **Data Sources:**
```typescript
// API Endpoint: /api/subscription
{
  plan: "basic",
  status: "trial", 
  isActive: true,
  isTrial: true,
  isExpired: false,
  trialDaysLeft: 5,
  trialEndsAt: "2026-03-20T00:00:00Z",
  maxStudents: 200,
  maxTeachers: 20,
  studentsUsed: 45,
  teachersUsed: 8,
  nextBillingDate: "2026-04-15T00:00:00Z",
  amount: 999
}
```

### **Real-time Updates:**
- ✅ **JWT Token**: Contains subscription status
- ✅ **Middleware**: Checks subscription on every request
- ✅ **API Refresh**: Subscription data fetched on page load
- ✅ **Banner Updates**: Status changes reflected immediately

---

## 🎯 **Admin Benefits**

### **📊 Complete Visibility**
- See exactly what they're paying for
- Monitor usage in real-time
- Track billing dates and amounts
- Understand plan limits and features

### **🔄 Easy Management**
- One-click upgrades and plan changes
- Clear renewal process
- Flexible billing cycle options
- Immediate activation of changes

### **💡 Smart Reminders**
- Trial expiry warnings
- Upcoming payment notifications
- Usage limit alerts
- Renewal reminders

### **🚀 Proactive Control**
- Upgrade before limits are reached
- Change plans as needs evolve
- Manage billing preferences
- Avoid service interruptions

---

## 📋 **Quick Reference**

| **What Admin Wants** | **Where to Go** | **What to Do** |
|---------------------|-----------------|----------------|
| **View Current Plan** | `/subscription` | See overview, usage, billing |
| **Check Usage** | `/subscription` | View student/teacher counts |
| **Upgrade Plan** | `/subscription` → "Upgrade" | Choose new plan, pay |
| **Renew Subscription** | `/subscription` → "Renew" | Extend current plan |
| **Change Billing** | `/billing` | Switch monthly/yearly |
| **View Invoices** | `/billing` | Payment history |
| **Update Payment** | `/billing` | Add new card/method |

---

## 🎉 **Summary**

School admins have **comprehensive subscription management** directly from their login area:

- ✅ **Multiple access points** (sidebar, banner, billing page)
- ✅ **Complete subscription visibility** (status, usage, billing)
- ✅ **Easy upgrade/renewal process** (one-click actions)
- ✅ **Real-time usage monitoring** (visual progress bars)
- ✅ **Flexible billing options** (monthly/yearly cycles)
- ✅ **Proactive notifications** (expiry warnings, limits)
- ✅ **Immediate plan changes** (no delays or waiting)

**The subscription management system is fully functional and user-friendly for school administrators!** 🚀
