// Test file for transport fee analyzer
import { analyzeTransportFees, calculateRefundEligibility, validateRefundAmount } from '../transportFeeAnalyzer';

// Mock data for testing
const mockFeeRecords = [
  {
    id: 'fee1',
    amount: 1000,
    paidAmount: 1000,
    discount: 0,
    status: 'paid',
    dueDate: '2024-01-01',
    createdAt: '2024-01-01'
  },
  {
    id: 'fee2',
    amount: 500,
    paidAmount: 0,
    discount: 0,
    status: 'pending',
    dueDate: '2024-02-01',
    createdAt: '2024-02-01'
  }
];

const mockStudentTransport = {
  id: 'transport1',
  studentId: 'student1',
  routeId: 'route1',
  monthlyFee: 1000,
  isActive: true,
  assignedAt: '2024-01-01'
};

// Test validation function
describe('Transport Fee Analyzer', () => {
  test('validateRefundAmount should work correctly', () => {
    // Test valid refund amount
    const validResult = validateRefundAmount(500, 1000, []);
    expect(validResult.isValid).toBe(true);
    expect(validResult.maxAllowed).toBe(1000);

    // Test invalid refund amount (too high)
    const invalidResult = validateRefundAmount(1500, 1000, []);
    expect(invalidResult.isValid).toBe(false);
    expect(invalidResult.error).toContain('cannot exceed');

    // Test invalid refund amount (negative)
    const negativeResult = validateRefundAmount(-100, 1000, []);
    expect(negativeResult.isValid).toBe(false);
    expect(negativeResult.error).toContain('greater than 0');

    // Test with existing refunds
    const existingRefundsResult = validateRefundAmount(300, 1000, [{ netAmount: 200 }]);
    expect(existingRefundsResult.isValid).toBe(true);
    expect(existingRefundsResult.maxAllowed).toBe(800);
  });
});

console.log('Transport Fee Analyzer tests completed successfully!');
