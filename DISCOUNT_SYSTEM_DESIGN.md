# Discount Approval System — Complete Design

## 1. Current State Analysis

### What Exists
| Model | Fields | Gap |
|-------|--------|-----|
| `Discount` | name, type, value, applicableClasses (JSON), applicableCategories (JSON), schoolId | No student targeting, no approval, no audit |
| `FeeRecord` | discount: Float | Applied directly, no tracking of who/when/why |
| `school_User` | role: admin/teacher/accountant/principal, schoolId | Roles exist but no discount permission model |
| `AuditLog` | actorEmail, action, target | Only in saas schema, not school schema |

### Problems with Current System
- Discount applied directly to `FeeRecord.discount` with no audit trail
- No approval workflow — anyone can apply any discount
- No student-level targeting (only class/category)
- No per-fee-structure discount targeting
- No bulk select capability
- No tracking of who requested vs. who approved

---

## 2. Proposed DB Schema Additions

> ⚠️ These are NEW models only. No existing models are modified.

### Model 1: `DiscountRequest`

```prisma
model DiscountRequest {
  id               String   @id @default(cuid())
  schoolId         String

  // What discount
  name             String                          // e.g. "Sibling Discount - Class 5A"
  description      String?
  discountType     String                          // "percentage" | "fixed" | "full_waiver"
  discountValue    Float                           // % or ₹ amount
  maxCapAmount     Float?                          // optional cap e.g. max ₹2000

  // Scope of application
  scope            String                          // "student" | "class" | "bulk"
  targetType       String                          // "fee_structure" | "total"
  feeStructureIds  String   @default("[]")         // JSON: [] = all structures
  studentIds       String   @default("[]")         // JSON: for student/bulk scope
  classIds         String   @default("[]")         // JSON: for class scope
  sectionIds       String   @default("[]")         // JSON: optional section filter
  academicYear     String

  // Reason / justification
  reason           String                          // mandatory justification
  supportingDoc    String?                         // file URL if any

  // Workflow status
  status           String   @default("pending")   // "pending"|"approved"|"rejected"|"cancelled"|"applied"

  // Requester
  requestedBy      String                          // userId
  requestedByEmail String
  requestedByName  String
  requestedAt      DateTime @default(now())

  // Approver
  approvedBy       String?
  approvedByEmail  String?
  approvedByName   String?
  approvedAt       DateTime?
  approvalNote     String?

  // Rejection
  rejectedBy       String?
  rejectedByEmail  String?
  rejectedAt       DateTime?
  rejectionReason  String?

  // Applied
  appliedBy        String?
  appliedByEmail   String?
  appliedAt        DateTime?
  appliedCount     Int?                            // how many students/records were updated

  // Validity
  validFrom        String
  validTo          String

  createdAt        DateTime @default(now())
  updatedAt        DateTime @updatedAt

  applications     DiscountApplication[]
  auditLogs        DiscountRequestAuditLog[]

  @@index([schoolId])
  @@index([schoolId, status])
  @@index([schoolId, academicYear])
  @@index([schoolId, status, academicYear])
  @@index([requestedBy])
  @@index([approvedBy])
  @@index([status])
  @@index([createdAt])
  @@schema("school")
}
```

### Model 2: `DiscountApplication` (per-student record of applied discounts)

```prisma
model DiscountApplication {
  id                String          @id @default(cuid())
  schoolId          String

  discountRequestId String
  discountRequest   DiscountRequest @relation(fields: [discountRequestId], references: [id], onDelete: Cascade)

  studentId         String
  feeRecordId       String          // which FeeRecord was updated
  feeStructureId    String?         // which structure (if targeted)

  discountAmount    Float           // actual ₹ amount applied
  previousDiscount  Float           // what was on FeeRecord.discount before

  // Reversal support
  isReversed        Boolean  @default(false)
  reversedBy        String?
  reversedByEmail   String?
  reversedAt        DateTime?
  reversalReason    String?

  appliedAt         DateTime @default(now())
  appliedBy         String
  appliedByEmail    String

  @@index([schoolId])
  @@index([schoolId, studentId])
  @@index([discountRequestId])
  @@index([studentId])
  @@index([feeRecordId])
  @@index([studentId, feeRecordId])
  @@index([schoolId, isReversed])
  @@schema("school")
}
```

### Model 3: `DiscountRequestAuditLog` (every state change, every action)

```prisma
model DiscountRequestAuditLog {
  id                String          @id @default(cuid())
  schoolId          String

  discountRequestId String
  discountRequest   DiscountRequest @relation(fields: [discountRequestId], references: [id], onDelete: Cascade)

  action            String          // "created"|"approved"|"rejected"|"cancelled"|"applied"|"reversed"|"modified"
  actorUserId       String
  actorEmail        String
  actorName         String
  actorRole         String

  previousStatus    String?
  newStatus         String?
  details           String?         // JSON: what changed (diff)
  ipAddress         String?

  createdAt         DateTime @default(now())

  @@index([schoolId])
  @@index([discountRequestId])
  @@index([schoolId, createdAt])
  @@index([actorEmail])
  @@index([action])
  @@schema("school")
}
```

---

## 3. API Design (New Endpoints Only)

Base: `/api/fees/discount-requests`

| Method | Endpoint | Role | Description |
|--------|----------|------|-------------|
| `POST` | `/api/fees/discount-requests` | accountant, admin, principal | Create a new discount request |
| `GET` | `/api/fees/discount-requests` | all authenticated | List with filters + pagination |
| `GET` | `/api/fees/discount-requests/[id]` | all authenticated | Get single request + audit trail |
| `PATCH` | `/api/fees/discount-requests/[id]` | admin only | Approve / Reject / Cancel |
| `POST` | `/api/fees/discount-requests/[id]/apply` | admin only | Apply approved discount to fee records |
| `POST` | `/api/fees/discount-requests/[id]/reverse` | admin only | Reverse an applied discount |
| `GET` | `/api/fees/discount-requests/[id]/audit` | admin, principal | Full audit trail for one request |
| `GET` | `/api/fees/discount-audit` | admin only | School-wide discount audit log (paginated) |

### POST `/api/fees/discount-requests` — Payload

```json
{
  "name": "Sibling Discount Q1",
  "description": "10% off for siblings",
  "discountType": "percentage",
  "discountValue": 10,
  "maxCapAmount": 2000,
  "scope": "student",
  "targetType": "fee_structure",
  "feeStructureIds": ["cuid1", "cuid2"],
  "studentIds": ["student1", "student2"],
  "reason": "Both siblings enrolled this year",
  "validFrom": "2025-04-01",
  "validTo": "2026-03-31",
  "academicYear": "2025-26"
}
```

### PATCH `/api/fees/discount-requests/[id]` — Approve/Reject

```json
{
  "action": "approve",
  "note": "Verified with admission records"
}
```
```json
{
  "action": "reject",
  "rejectionReason": "Insufficient documentation"
}
```

### POST `/api/fees/discount-requests/[id]/apply` — Apply

- No body required. Server resolves target students + fee records.
- Uses raw SQL batch UPDATE for 10M scale:
  ```sql
  UPDATE "school"."FeeRecord"
  SET discount = discount + $amount, "pendingAmount" = "pendingAmount" - $amount
  WHERE id IN (...batch of 1000 IDs...)
    AND "schoolId" = $schoolId
  ```
- Writes one `DiscountApplication` row per `FeeRecord` updated
- Writes one `DiscountRequestAuditLog` with `action = "applied"` and `appliedCount`

---

## 4. Complete Workflow

```
┌─────────────────────────────────────────────────────────────────────────┐
│                    DISCOUNT REQUEST LIFECYCLE                           │
│                                                                         │
│  [Accountant/Teacher/Admin]          [School Admin]                     │
│                                                                         │
│  1. Fill Discount Request Form                                          │
│     - Select scope: single / class / bulk                               │
│     - Select target: fee structure / total                              │
│     - Enter discount type + value                                       │
│     - Mandatory reason/justification                                    │
│     - Optional: upload supporting doc                                   │
│                                                                         │
│  2. Submit → status = "pending"                                         │
│     → AuditLog: action="created"                                        │
│     → Notification to school admin (optional)                           │
│                                                                         │
│                    ↓                                                    │
│                                                                         │
│  3. Admin reviews in Approval Queue                                     │
│     - Sees: requester, students affected, amount impact                 │
│     - Can add approval note                                             │
│                                                                         │
│  4a. APPROVE → status = "approved"                                      │
│      → AuditLog: action="approved", actorEmail, approvalNote           │
│                                                                         │
│  4b. REJECT → status = "rejected"                                       │
│      → AuditLog: action="rejected", rejectionReason                    │
│      → Requester can see reason                                         │
│                                                                         │
│  5. Admin clicks "Apply" (only for approved)                            │
│     → Batch UPDATE FeeRecord.discount                                   │
│     → Creates DiscountApplication per student/record                   │
│     → status = "applied"                                                │
│     → AuditLog: action="applied", appliedCount                         │
│                                                                         │
│  6. [Optional] Reverse → DiscountApplication.isReversed = true         │
│     → FeeRecord.discount restored                                       │
│     → AuditLog: action="reversed"                                       │
│                                                                         │
└─────────────────────────────────────────────────────────────────────────┘
```

---

## 5. UI Pages & Components (New)

### 5.1 Discount Request Form (`/fees/discount-requests/new`)

**Step 1 — Scope Selection**
```
┌─────────────────────────────────────────────────┐
│  Who gets this discount?                        │
│  ○ Single Student  ○ Class Level  ○ Bulk Select │
│                                                 │
│  [Single] → Student search dropdown            │
│  [Class]  → Class + Section picker             │
│  [Bulk]   → Multi-select student table         │
│             with search/filter by class         │
└─────────────────────────────────────────────────┘
```

**Step 2 — Discount Details**
```
┌─────────────────────────────────────────────────┐
│  Apply discount on:                             │
│  ○ Total Fee  ○ Specific Fee Structures         │
│                                                 │
│  [Fee Structures] → Checklist of structures    │
│                     e.g. ✓ Tuition  □ Transport│
│                                                 │
│  Discount Type: ○ Percentage  ○ Fixed Amount   │
│  Value: [____]    Max Cap: [____] (optional)   │
│                                                 │
│  Valid From: [Date]   Valid To: [Date]          │
└─────────────────────────────────────────────────┘
```

**Step 3 — Justification**
```
┌─────────────────────────────────────────────────┐
│  Reason (mandatory):                            │
│  [______________________________________]       │
│                                                 │
│  Supporting Document: [Upload File]             │
│                                                 │
│  Preview: X students affected                   │
│           Estimated discount: ₹XX,XXX          │
│                                                 │
│  [Cancel]              [Submit for Approval]    │
└─────────────────────────────────────────────────┘
```

---

### 5.2 Approval Queue (Admin Tab in Fees page)

```
┌──────────────────────────────────────────────────────────────────────┐
│  Discount Approvals    [Pending: 3]  [All]  [Approved]  [Rejected]   │
│                                                                      │
│  ┌────────┬──────────────┬────────┬──────────┬───────┬────────────┐ │
│  │Request │ Requested By │ Scope  │ Discount │Impact │  Action    │ │
│  ├────────┼──────────────┼────────┼──────────┼───────┼────────────┤ │
│  │Sibling │ John (acct)  │2 stud. │10%       │₹2,400 │[✓][✗][👁] │ │
│  │SC/ST   │ Priya (prin) │Class 5 │Fixed ₹500│₹8,500 │[✓][✗][👁] │ │
│  │Merit   │ Admin        │12 bulk │15%       │₹18K   │[✓][✗][👁] │ │
│  └────────┴──────────────┴────────┴──────────┴───────┴────────────┘ │
│                                                                      │
│  [✓] Approve  [✗] Reject  [👁] View Details                         │
└──────────────────────────────────────────────────────────────────────┘
```

---

### 5.3 Discount Detail Modal

```
┌──────────────────────────────────────────────────────┐
│  Discount Request: Sibling Discount Q1               │
│  ─────────────────────────────────────               │
│  Status: ● PENDING APPROVAL                          │
│  Requested by: John Doe (Accountant) • Mar 15, 2026  │
│                                                      │
│  Scope:     2 Students — Rahul (9A), Priya (6B)     │
│  Target:    Tuition Fee + Lab Fee                    │
│  Discount:  10% (max cap ₹2,000)                    │
│  Validity:  Apr 1, 2026 – Mar 31, 2027              │
│  Reason:    Both siblings enrolled this year         │
│                                                      │
│  Impact Preview                                      │
│  ┌──────────┬────────────┬──────────┬────────────┐  │
│  │ Student  │ Fee        │ Original │ After Disc │  │
│  ├──────────┼────────────┼──────────┼────────────┤  │
│  │ Rahul    │ Tuition    │ ₹12,000  │ ₹10,800    │  │
│  │ Priya    │ Tuition    │ ₹10,000  │ ₹9,000     │  │
│  └──────────┴────────────┴──────────┴────────────┘  │
│  Total impact: ₹2,200                               │
│                                                      │
│  Approval Note: [________________________]           │
│                                                      │
│  [Reject with Reason]          [Approve & Apply]    │
└──────────────────────────────────────────────────────┘
```

---

### 5.4 Audit Log Page (`/fees/discount-audit`)

```
┌──────────────────────────────────────────────────────────────────────┐
│  Discount Audit Log                  Filter: [All Actions ▼] [Date] │
│                                                                      │
│  ┌──────────────┬──────────┬──────────────┬──────────┬───────────┐  │
│  │ Timestamp    │ Action   │ By           │ Request  │ Details   │  │
│  ├──────────────┼──────────┼──────────────┼──────────┼───────────┤  │
│  │ Mar 15 10:30 │ APPLIED  │ Admin (arun) │ Sibling  │ 2 records │  │
│  │ Mar 15 10:25 │ APPROVED │ Admin (arun) │ Sibling  │ Note: OK  │  │
│  │ Mar 15 09:10 │ CREATED  │ John (acct)  │ Sibling  │ Submitted │  │
│  │ Mar 14 15:00 │ REJECTED │ Admin (arun) │ Merit    │ No docs   │  │
│  └──────────────┴──────────┴──────────────┴──────────┴───────────┘  │
│                              [Export CSV]                            │
└──────────────────────────────────────────────────────────────────────┘
```

---

## 6. Role-Based Access Matrix

| Action | super_admin | admin | principal | accountant | teacher |
|--------|-------------|-------|-----------|------------|---------|
| Create request | ✅ | ✅ | ✅ | ✅ | ❌ |
| View own requests | ✅ | ✅ | ✅ | ✅ | ❌ |
| View all requests | ✅ | ✅ | ✅ | ❌ | ❌ |
| Approve / Reject | ✅ | ✅ | ❌ | ❌ | ❌ |
| Apply approved | ✅ | ✅ | ❌ | ❌ | ❌ |
| Reverse applied | ✅ | ✅ | ❌ | ❌ | ❌ |
| View audit log | ✅ | ✅ | ✅ | ❌ | ❌ |

> Requester cannot approve their own request (enforced at API level).

---

## 7. Performance Design for 10M Records

### DB Index Strategy

All three new models have `@@index([schoolId])` as primary partition key.
Critical compound indexes:

```prisma
@@index([schoolId, status])           -- approval queue filter
@@index([schoolId, academicYear])     -- year-wise reports
@@index([schoolId, status, academicYear]) -- combined filter
@@index([studentId, feeRecordId])     -- per-student discount lookup
@@index([discountRequestId])          -- audit trail lookup
```

### Batch Apply (Raw SQL)

When admin clicks "Apply", the system:
1. Resolves affected `FeeRecord` IDs in memory (based on scope + feeStructureIds)
2. Batches in chunks of **1,000 records** using `prisma.$executeRawUnsafe`
3. Writes `DiscountApplication` rows in bulk INSERT
4. Uses a DB transaction per batch to ensure atomicity

```sql
-- Batch UPDATE example
UPDATE "school"."FeeRecord"
SET   discount        = discount + $1,
      "pendingAmount" = GREATEST(0, "pendingAmount" - $1)
WHERE id = ANY($2::text[])
  AND "schoolId" = $3;
```

### API Pagination

All list endpoints use cursor-based pagination:
```
GET /api/fees/discount-requests?page=1&pageSize=25&status=pending&academicYear=2025-26
```

---

## 8. New Files to Create (No existing files touched)

```
src/
  app/
    api/
      fees/
        discount-requests/
          route.ts              ← POST (create), GET (list)
          [id]/
            route.ts            ← GET (detail), PATCH (approve/reject)
            apply/
              route.ts          ← POST (apply to fee records)
            reverse/
              route.ts          ← POST (reverse)
            audit/
              route.ts          ← GET (audit trail for one request)
        discount-audit/
          route.ts              ← GET (school-wide audit)
    fees/
      components/
        DiscountRequestForm.tsx   ← 3-step form
        DiscountApprovalQueue.tsx ← Admin approval table
        DiscountRequestDetail.tsx ← Modal with impact preview
        DiscountAuditLog.tsx      ← Audit trail table
  
prisma/
  migrations/
    YYYYMMDD_add_discount_approval_system/
      migration.sql
```

---

## 9. Summary of Design Decisions

| Decision | Choice | Reason |
|----------|--------|--------|
| Discount stored on FeeRecord | Keep existing `discount` Float field | No breaking changes |
| Audit log location | New `DiscountRequestAuditLog` in school schema | Tenant-scoped, supports 10M |
| Approval flow | Requester ≠ Approver enforced at API | Prevent self-approval fraud |
| Batch apply method | Raw SQL in chunks of 1000 | Handles 10M without timeout |
| Scope types | student / class / bulk | Covers all requested use cases |
| Target types | total / fee_structure | Flexible per requirement |
| Reversal | Soft reversal with audit trail | Allows undo without data loss |
| Who can approve | admin + super_admin only | Consistent with existing role model |
