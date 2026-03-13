'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { PDFGenerator } from '@/utils/pdfGenerator';

interface PaymentReceiptProps {
  theme: 'dark' | 'light';
  studentData: any;
  paymentData: any;
  receiptNumber: string;
  paymentDate: string;
  paymentMethod: string;
  onPrint?: () => void;
  onDownload?: () => void;
  onClose?: () => void;
}

export default function PaymentReceipt({
  theme,
  studentData,
  paymentData,
  receiptNumber,
  paymentDate,
  paymentMethod,
  onPrint,
  onDownload,
  onClose
}: PaymentReceiptProps) {
  const isDark = theme === 'dark';
  const textPrimary = isDark ? 'text-gray-900' : 'text-gray-900';
  const textSecondary = isDark ? 'text-gray-600' : 'text-gray-600';
  const borderCls = 'border-gray-300';

  // Calculate totals
  const calculateTotals = () => {
    let grandTotal = 0;
    let totalPaid = 0;
    let totalDiscount = 0;
    let totalBalance = 0;

    const academicYears: { [key: string]: any } = {};

    // Process current year fees
    if (paymentData.currentYearFees) {
      academicYears['2024-25'] = {
        total: 0,
        paid: 0,
        discount: 0,
        balance: 0,
        fees: []
      };

      paymentData.currentYearFees.forEach((fee: any) => {
        const feeTotal = fee.totalAmount || 0;
        const feePaid = fee.paidAmount || 0;
        const feeDiscount = fee.discount || 0;
        const feeBalance = feeTotal - feePaid - feeDiscount;

        academicYears['2024-25'].total += feeTotal;
        academicYears['2024-25'].paid += feePaid;
        academicYears['2024-25'].discount += feeDiscount;
        academicYears['2024-25'].balance += feeBalance;
        academicYears['2024-25'].fees.push({
          ...fee,
          balance: feeBalance
        });

        grandTotal += feeTotal;
        totalPaid += feePaid;
        totalDiscount += feeDiscount;
        totalBalance += feeBalance;
      });
    }

    // Process previous year fees
    if (studentData?.previousYearPending) {
      Object.entries(studentData.previousYearPending).forEach(([year, data]: [string, any]) => {
        if (data.pending > 0) {
          academicYears[year] = {
            total: data.total,
            paid: data.paid,
            discount: data.discount || 0,
            balance: data.pending,
            fees: data.overdueFees.map((feeName: string) => ({
              name: feeName,
              totalAmount: data.total / data.overdueFees.length,
              paidAmount: 0,
              discount: 0,
              balance: data.pending / data.overdueFees.length,
              category: 'Previous Year',
              status: 'overdue'
            }))
          };

          grandTotal += data.total;
          totalPaid += data.paid;
          totalBalance += data.pending;
        }
      });
    }

    return {
      grandTotal,
      totalPaid,
      totalDiscount,
      totalBalance,
      academicYears
    };
  };

  const totals = calculateTotals();

  return (
    <div className="min-h-screen bg-white p-8" id="receipt-print">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="max-w-4xl mx-auto bg-white rounded-lg shadow-lg overflow-hidden"
      >
        {/* Receipt Header */}
        <div className="border-b-4 border-blue-600 p-8 bg-gradient-to-r from-blue-50 to-indigo-50">
          <div className="flex justify-between items-start mb-6">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 mb-2">PAYMENT RECEIPT</h1>
              <p className="text-gray-600">Official Fee Payment Receipt</p>
            </div>
            <div className="text-right">
              <div className="bg-blue-600 text-white px-4 py-2 rounded-lg">
                <p className="text-sm font-medium">Receipt No.</p>
                <p className="text-xl font-bold">{receiptNumber}</p>
              </div>
            </div>
          </div>

          {/* School Info */}
          <div className="grid grid-cols-2 gap-8">
            <div>
              <h2 className="text-xl font-bold text-gray-900 mb-3">Springfield International School</h2>
              <p className="text-gray-600 text-sm">123 Education Avenue, Knowledge City</p>
              <p className="text-gray-600 text-sm">Phone: +91 98765 43210 | Email: accounts@springfield.edu</p>
              <p className="text-gray-600 text-sm">Website: www.springfield.edu</p>
            </div>
            <div className="text-right">
              <div className="bg-white p-4 rounded-lg border border-gray-200">
                <p className="text-sm text-gray-600">Payment Date</p>
                <p className="text-lg font-bold text-gray-900">{paymentDate}</p>
                <p className="text-sm text-gray-600 mt-2">Payment Method</p>
                <p className="font-bold text-gray-900">{paymentMethod}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Student Information */}
        <div className="p-8 bg-gray-50 border-b">
          <h3 className="text-lg font-bold text-gray-900 mb-4">Student Information</h3>
          <div className="grid grid-cols-4 gap-4">
            <div>
              <p className="text-sm text-gray-600">Student Name</p>
              <p className="font-bold text-gray-900">{studentData?.name || 'N/A'}</p>
            </div>
            <div>
              <p className="text-sm text-gray-600">Class & Section</p>
              <p className="font-bold text-gray-900">{studentData?.studentClass || 'N/A'}</p>
            </div>
            <div>
              <p className="text-sm text-gray-600">Admission No.</p>
              <p className="font-bold text-gray-900">{studentData?.admissionNo || 'N/A'}</p>
            </div>
            <div>
              <p className="text-sm text-gray-600">Parent Name</p>
              <p className="font-bold text-gray-900">{studentData?.parentName || 'N/A'}</p>
            </div>
          </div>
        </div>

        {/* Fee Details by Academic Year */}
        <div className="p-8">
          <h3 className="text-lg font-bold text-gray-900 mb-6">Fee Details</h3>
          
          {Object.entries(totals.academicYears).map(([year, yearData]: [string, any]) => (
            <div key={year} className="mb-8">
              {/* Academic Year Header */}
              <div className="bg-gradient-to-r from-blue-500 to-indigo-500 text-white p-4 rounded-t-lg">
                <div className="flex justify-between items-center">
                  <h4 className="text-lg font-bold">Academic Year {year}</h4>
                  <div className="flex gap-6 text-sm">
                    <div>
                      <span className="opacity-90">Total:</span>
                      <span className="font-bold ml-1">₹{yearData.total.toLocaleString()}</span>
                    </div>
                    <div>
                      <span className="opacity-90">Paid:</span>
                      <span className="font-bold ml-1">₹{yearData.paid.toLocaleString()}</span>
                    </div>
                    <div>
                      <span className="opacity-90">Discount:</span>
                      <span className="font-bold ml-1">₹{yearData.discount.toLocaleString()}</span>
                    </div>
                    <div>
                      <span className="opacity-90">Balance:</span>
                      <span className={`font-bold ml-1 ${yearData.balance > 0 ? 'text-yellow-300' : 'text-green-300'}`}>
                        ₹{yearData.balance.toLocaleString()}
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Fee Items Table */}
              <div className="border border-gray-200 border-t-0">
                <table className="w-full">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="text-left p-3 font-medium text-gray-900 border-b">Fee Name</th>
                      <th className="text-left p-3 font-medium text-gray-900 border-b">Category</th>
                      <th className="text-right p-3 font-medium text-gray-900 border-b">Total Amount</th>
                      <th className="text-right p-3 font-medium text-gray-900 border-b">Paid Amount</th>
                      <th className="text-right p-3 font-medium text-gray-900 border-b">Discount</th>
                      <th className="text-right p-3 font-medium text-gray-900 border-b">Balance</th>
                      <th className="text-center p-3 font-medium text-gray-900 border-b">Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {yearData.fees.map((fee: any, index: number) => (
                      <tr key={index} className="hover:bg-gray-50">
                        <td className="p-3 border-b font-medium text-gray-900">{fee.name}</td>
                        <td className="p-3 border-b text-gray-600">{fee.category}</td>
                        <td className="p-3 border-b text-right font-medium">₹{fee.totalAmount.toLocaleString()}</td>
                        <td className="p-3 border-b text-right text-green-600 font-medium">₹{fee.paidAmount.toLocaleString()}</td>
                        <td className="p-3 border-b text-right text-blue-600 font-medium">₹{fee.discount.toLocaleString()}</td>
                        <td className={`p-3 border-b text-right font-medium ${fee.balance > 0 ? 'text-red-600' : 'text-green-600'}`}>
                          ₹{fee.balance.toLocaleString()}
                        </td>
                        <td className="p-3 border-b text-center">
                          <span className={`px-2 py-1 text-xs rounded-full font-medium ${
                            fee.status === 'paid' ? 'bg-green-100 text-green-800' :
                            fee.status === 'partial' ? 'bg-yellow-100 text-yellow-800' :
                            fee.status === 'overdue' ? 'bg-red-100 text-red-800' :
                            'bg-gray-100 text-gray-800'
                          }`}>
                            {fee.status ? fee.status.charAt(0).toUpperCase() + fee.status.slice(1) : 'Pending'}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          ))}
        </div>

        {/* Grand Total Summary */}
        <div className="p-8 bg-gradient-to-r from-gray-900 to-gray-800 text-white">
          <div className="flex justify-between items-center">
            <div>
              <h3 className="text-xl font-bold mb-2">Payment Summary</h3>
              <p className="text-gray-300 text-sm">Total across all academic years</p>
            </div>
            <div className="text-right">
              <div className="grid grid-cols-4 gap-8 text-sm">
                <div>
                  <p className="text-gray-300">Grand Total</p>
                  <p className="text-2xl font-bold">₹{totals.grandTotal.toLocaleString()}</p>
                </div>
                <div>
                  <p className="text-gray-300">Total Paid</p>
                  <p className="text-2xl font-bold text-green-400">₹{totals.totalPaid.toLocaleString()}</p>
                </div>
                <div>
                  <p className="text-gray-300">Total Discount</p>
                  <p className="text-2xl font-bold text-blue-400">₹{totals.totalDiscount.toLocaleString()}</p>
                </div>
                <div>
                  <p className="text-gray-300">Total Balance</p>
                  <p className={`text-2xl font-bold ${totals.totalBalance > 0 ? 'text-red-400' : 'text-green-400'}`}>
                    ₹{totals.totalBalance.toLocaleString()}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="p-8 bg-gray-50 border-t">
          <div className="grid grid-cols-3 gap-8 text-center">
            <div>
              <div className="border-t-2 border-gray-300 pt-2">
                <p className="text-sm text-gray-600">Cashier Signature</p>
              </div>
            </div>
            <div>
              <div className="border-t-2 border-gray-300 pt-2">
                <p className="text-sm text-gray-600">Authorized Signature</p>
              </div>
            </div>
            <div>
              <div className="border-t-2 border-gray-300 pt-2">
                <p className="text-sm text-gray-600">Parent Signature</p>
              </div>
            </div>
          </div>
          <div className="mt-6 text-center text-sm text-gray-500">
            <p>This is a computer-generated receipt and does not require a physical signature.</p>
            <p>For any queries, please contact the accounts department.</p>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="p-6 bg-gray-100 border-t flex justify-end gap-3 no-print">
          <button
            onClick={onPrint}
            className="px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors flex items-center gap-2"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" />
            </svg>
            Print Receipt
          </button>
          <button
            onClick={onDownload}
            className="px-6 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg font-medium transition-colors flex items-center gap-2"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            Download PDF
          </button>
          {onClose && (
            <button
              onClick={onClose}
              className="px-6 py-2 bg-gray-600 hover:bg-gray-700 text-white rounded-lg font-medium transition-colors"
            >
              Close
            </button>
          )}
        </div>
      </motion.div>

      <style jsx>{`
        @media print {
          .no-print {
            display: none !important;
          }
          #receipt-print {
            background: white !important;
            padding: 0 !important;
          }
        }
      `}</style>
    </div>
  );
}
