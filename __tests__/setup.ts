/**
 * Jest Setup File for Razorpay Integration Tests
 */

// Set test environment variables
process.env.NODE_ENV = 'test';
process.env.TEST_BASE_URL = process.env.TEST_BASE_URL || 'http://localhost:3001';
process.env.TEST_RAZORPAY_KEY_ID = process.env.TEST_RAZORPAY_KEY_ID || 'rzp_test_key_id';
process.env.TEST_RAZORPAY_KEY_SECRET = process.env.TEST_RAZORPAY_KEY_SECRET || 'test_secret';
process.env.TEST_WEBHOOK_SECRET = process.env.TEST_WEBHOOK_SECRET || 'test_webhook_secret';

// Mock console methods in tests to reduce noise
global.console = {
  ...console,
  log: jest.fn(),
  debug: jest.fn(),
  info: jest.fn(),
  warn: jest.fn(),
  error: jest.fn(),
};

// Setup global test timeout
jest.setTimeout(30000);

// Mock fetch for testing
global.fetch = jest.fn();

// Before each test, clear all mocks
beforeEach(() => {
  jest.clearAllMocks();
});

// Global test utilities
declare global {
  namespace jest {
    interface Matchers<R> {
      toBeValidRazorpayOrder(): R;
      toBeValidPaymentSignature(): R;
    }
  }
}

// Custom matchers
expect.extend({
  toBeValidRazorpayOrder(received: any) {
    const pass = received && 
      received.id && 
      received.amount && 
      received.currency && 
      received.receipt;
    
    return {
      message: () => `expected ${received} to be a valid Razorpay order`,
      pass,
    };
  },
  
  toBeValidPaymentSignature(received: string) {
    const pass = typeof received === 'string' && received.length > 0;
    
    return {
      message: () => `expected ${received} to be a valid payment signature`,
      pass,
    };
  },
});

export {};
