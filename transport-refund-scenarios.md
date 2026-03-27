# Transport Refund Scenarios - Complete Analysis

## Transport Fee Cancellation Options Comparison

### Base Scenario: Transport Fee ₹6000

| Payment Status | Paid Amount | Pending Amount | Action | Refund Amount | Admin Fee | Net Refund | Student Benefit | School Loss | Approval Required | Fee Record Status |
|---------------|-------------|---------------|---------|---------------|-----------|------------|-----------------|------------|------------------|------------------|
| **Unpaid** | ₹0 | ₹6000 | **Waive Off** | ₹0 | ₹0 | ₹0 | ₹6000 saved | ₹6000 revenue loss | Auto (₹6000 ≥ ₹1000) | Cancelled, amount=0, pending=0 |
| **Unpaid** | ₹0 | ₹6000 | **Keep for Recovery** | ₹0 | ₹0 | ₹0 | ₹0 | ₹0 | No | Cancelled, amount=6000, pending=6000 |
| **Partial** | ₹3000 | ₹3000 | **Waive Off** | ₹0 | ₹0 | ₹0 | ₹3000 saved | ₹0 (keeps earned) | Auto (₹3000 ≥ ₹1000) | Cancelled, amount=3000, pending=0 |
| **Partial** | ₹3000 | ₹3000 | **Keep for Recovery** | ₹0 | ₹0 | ₹0 | ₹0 | ₹0 | No | Cancelled, amount=6000, pending=3000 |
| **Partial** | ₹3000 | ₹3000 | **Refund ₹1500** | ₹1500 | ₹0 | ₹1500 | ₹1500 refund + ₹3000 waived = ₹4500 total | ₹1500 loss | Auto (₹1500 < ₹1000) | Cancelled, amount=1500, pending=0 |
| **Partial** | ₹3000 | ₹3000 | **Refund ₹1500 + Waive** | ₹1500 | ₹0 | ₹1500 | ₹1500 refund + ₹3000 waived = ₹4500 total | ₹1500 loss | Auto (₹1500 < ₹1000) | Cancelled, amount=1500, pending=0 |
| **Full** | ₹6000 | ₹0 | **Refund ₹6000** | ₹6000 | ₹0 | ₹6000 | ₹6000 refund | ₹6000 loss | Pending (₹6000 ≥ ₹1000) | Cancelled, amount=0, pending=0 |
| **Full** | ₹6000 | ₹0 | **Refund ₹3000** | ₹3000 | ₹0 | ₹3000 | ₹3000 refund | ₹3000 loss | Pending (₹3000 ≥ ₹1000) | Cancelled, amount=3000, pending=0 |
| **Full** | ₹6000 | ₹0 | **Refund ₹6000 + ₹100 Admin** | ₹6000 | ₹100 | ₹5900 | ₹5900 refund | ₹5900 loss | Pending (₹5900 ≥ ₹1000) | Cancelled, amount=0, pending=0 |

## Detailed Refund Logic

### Refund Eligibility Rules
- **Maximum Refundable:** Paid amount only (cannot refund more than paid)
- **Auto-Approval:** Net refund < ₹1000
- **Manager Approval:** Net refund ≥ ₹1000
- **Priority Levels:**
  - Low: Net refund < ₹1000
  - Normal: ₹1000 ≤ Net refund < ₹5000
  - High: Net refund ≥ ₹5000

### Refund Processing Flow
1. **Calculate Eligibility** → Based on paid amount
2. **Validate Amount** → Cannot exceed paid amount
3. **Create Refund Request** → Status: 'approved' or 'pending'
4. **Auto-Approved** → Create approval + transaction records
5. **Pending** → Requires manager approval

### Fee Record Updates
| Scenario | Amount | PaidAmount | PendingAmount | WaivedAmount | Status |
|----------|--------|------------|---------------|--------------|--------|
| **Refund Only** | Original - Refund | Original | 0 | 0 | Cancelled |
| **Refund + Waive** | Original - Refund | Original | 0 | Pending | Cancelled |
| **Waive Only** | PaidAmount | PaidAmount | 0 | Pending | Cancelled |

## Financial Impact Summary

### Student Benefits
- **Waive Off:** Saves pending amount
- **Refund:** Gets money back + pending waived
- **Combined:** Maximum financial benefit

### School Impact
- **Waive Off:** Loses pending amount, keeps earned revenue
- **Refund:** Loses refunded amount, keeps unrefunded portion
- **Combined:** Highest financial loss but best customer service

### Audit Trail
- **All scenarios** create RefundRequest records
- **Waivers** create waiver requests
- **Fee records** preserved with detailed notes
- **Transactions** tracked for refunds

## Example: Your Scenario (₹3000 Paid, ₹3000 Pending)

| Option | Refund | Waiver | Net Student Benefit | Net School Loss | Approval |
|--------|--------|--------|-------------------|----------------|----------|
| **Waive Only** | ₹0 | ₹3000 | ₹3000 saved | ₹0 (keeps earned) | Required (₹3000 ≥ ₹1000) |
| **Refund ₹1500** | ₹1500 | ₹0 | ₹1500 back | ₹1500 loss | Auto (₹1500 < ₹1000) |
| **Refund ₹1500 + Waive** | ₹1500 | ₹3000 | ₹4500 total | ₹1500 loss | Auto (₹1500 < ₹1000) |
| **Refund ₹3000** | ₹3000 | ₹0 | ₹3000 back | ₹3000 loss | Pending (₹3000 ≥ ₹1000) |

## Key Takeaways

1. **Waiver Only** = Best for school (keeps earned revenue)
2. **Refund + Waiver** = Best for student (maximum benefit)
3. **Small Refunds** (<₹1000) = Auto-approved
4. **Large Refunds** (≥₹1000) = Manager approval required
5. **All scenarios** preserve complete audit trail
