'use client';

import React, { useRef } from 'react';
import { motion } from 'framer-motion';
import { useSchoolConfig } from '@/contexts/SchoolConfigContext';

interface PaymentReceiptProps {
  theme: 'dark' | 'light';
  /** StudentFeeSummary from the fees hook */
  studentData: any;
  /** Array of fee records included in this payment / or a single FeeRecord */
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
  onClose,
}: PaymentReceiptProps) {
  const receiptRef = useRef<HTMLDivElement>(null);
  const { getSetting } = useSchoolConfig();
  
  // School info from config
  const schoolName    = getSetting('school_details', 'school_name',    'School');
  const schoolAddress = getSetting('school_details', 'address',        '');
  const schoolPhone   = getSetting('school_details', 'phone',          '');
  const schoolEmail   = getSetting('school_details', 'email',          '');
  const schoolWebsite = getSetting('school_details', 'website',        '');
  const logoUrl       = getSetting('school_details', 'logo_url',       '');

  // Normalize feeItems from paymentData (array or single object)
  const feeItems: any[] = Array.isArray(paymentData)
    ? paymentData
    : paymentData?.currentYearFees || [paymentData].filter(Boolean);
    
  
  // Student fields (support both StudentFeeSummary keys and legacy keys)
  const studentName  = studentData?.studentName  || studentData?.name        || 'N/A';
  const studentClass = studentData?.studentClass || studentData?.class        || 'N/A';
  const rollNo       = studentData?.rollNo       || studentData?.admissionNo  || 'N/A';
  const parentName   = studentData?.parentName   || studentData?.fatherName   || '';
  const collectedBy  = studentData?.collectedBy || 'Accounts Department';

  const grandTotal     = feeItems.reduce((s: number, f: any) => s + (f.totalAmount || f.amount || 0), 0);
  const totalPaid      = feeItems.reduce((s: number, f: any) => s + (f.paidAmount   || 0), 0);
  const totalDiscount  = feeItems.reduce((s: number, f: any) => s + (f.discount     || 0), 0);
  const totalBalance   = grandTotal - totalPaid - totalDiscount;
  
  
  const handlePrint = () => {
    if (onPrint) { onPrint(); return; }
    window.print();
  };

  const payMethodLabel = (m: string) =>
    ({ cash: 'Cash', cheque: 'Cheque', online: 'Online Transfer',
       bank_transfer: 'Bank Transfer', upi: 'UPI', card: 'Card' }[m] || m);

  return (
    <div className="bg-white overflow-hidden" id="receipt-print" ref={receiptRef} style={{ width: '100%', maxWidth: '800px', margin: '0 auto', padding: '0' }}>
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-[800px] mx-auto bg-white overflow-hidden"
        style={{ width: '100%', maxWidth: '800px', overflowX: 'hidden' }}
      >
        {/* ── Header ── */}
        <div className="border-b-4 border-blue-700 p-8 bg-gradient-to-br from-blue-50 to-indigo-50">
          <div className="flex justify-between items-start">
            <div className="flex items-start gap-4">
              {logoUrl && (
                <img src={logoUrl} alt="School Logo" className="h-16 w-16 object-contain rounded" />
              )}
              <div>
                <h1 className="text-2xl font-extrabold text-gray-900">{schoolName}</h1>
                {schoolAddress && <p className="text-gray-500 text-sm mt-0.5">{schoolAddress}</p>}
                <p className="text-gray-500 text-xs mt-0.5">
                  {schoolPhone && <span>📞 {schoolPhone}</span>}
                  {schoolEmail && <span className="ml-3">✉ {schoolEmail}</span>}
                  {schoolWebsite && <span className="ml-3">🌐 {schoolWebsite}</span>}
                </p>
              </div>
            </div>
            <div className="text-right shrink-0">
              <div className="bg-blue-700 text-white px-5 py-3 rounded-xl shadow">
                <p className="text-xs uppercase tracking-widest opacity-80">Receipt No.</p>
                <p className="text-lg font-bold font-mono">{receiptNumber}</p>
              </div>
              <p className="text-xs text-gray-500 mt-2">
                Date: <span className="font-medium text-gray-700">{paymentDate}</span>
              </p>
              <p className="text-xs text-gray-500">
                Method: <span className="font-medium text-gray-700">{payMethodLabel(paymentMethod)}</span>
              </p>
            </div>
          </div>
        </div>

        {/* ── PAYMENT RECEIPT title strip ── */}
        <div className="bg-blue-700 text-white text-center py-2 tracking-[0.25em] text-sm font-bold uppercase">
          Payment Receipt
        </div>

        {/* ── Student Info ── */}
        <div className="px-8 py-5 bg-gray-50 border-b grid grid-cols-2 md:grid-cols-4 gap-4">
          {[
            { label: 'Student Name', value: studentName },
            { label: 'Class & Section', value: studentClass },
            { label: 'Roll / Adm. No.', value: rollNo },
            { label: 'Parent / Guardian', value: parentName || '—' },
          ].map(({ label, value }) => (
            <div key={label}>
              <p className="text-xs text-gray-500 uppercase tracking-wide">{label}</p>
              <p className="font-semibold text-gray-900 text-sm mt-0.5">{value}</p>
            </div>
          ))}
        </div>

        {/* ── Fee Table ── */}
        <div className="p-8">
          <h3 className="text-base font-bold text-gray-900 mb-4 flex items-center gap-2">
            💰 Fee Details
          </h3>
          <div className="overflow-x-auto rounded-lg border border-gray-200">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-gray-900 text-white">
                  <th className="text-left px-4 py-3 font-semibold">#</th>
                  <th className="text-left px-4 py-3 font-semibold">Fee Name</th>
                  <th className="text-left px-4 py-3 font-semibold">Category</th>
                  <th className="text-left px-4 py-3 font-semibold">Academic Year</th>
                  <th className="text-right px-4 py-3 font-semibold">Total</th>
                  <th className="text-right px-4 py-3 font-semibold">Paid</th>
                  <th className="text-right px-4 py-3 font-semibold">Discount</th>
                  <th className="text-right px-4 py-3 font-semibold">Balance</th>
                  <th className="text-center px-4 py-3 font-semibold">Status</th>
                </tr>
              </thead>
              <tbody>
                {feeItems.length === 0 ? (
                  <tr>
                    <td colSpan={9} className="text-center py-8 text-gray-400">No fee data available</td>
                  </tr>
                ) : feeItems.map((fee: any, idx: number) => {
                  // Get the total amount from various possible fields
                  const totalAmt = Number(fee.totalAmount || fee.amount || 0);
                  const paid     = Number(fee.paidAmount || 0);
                  const disc     = Number(fee.discount || 0);
                  const balance  = totalAmt - paid - disc;
                  const status   = fee.status || (balance <= 0 ? 'paid' : paid > 0 ? 'partial' : 'pending');
                  
                  return (
                    <tr key={idx} className={idx % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                      <td className="px-4 py-3 text-gray-500">{idx + 1}</td>
                      <td className="px-4 py-3 font-medium text-gray-900">
                        {fee.name || fee.feeStructure?.name || fee.feeStructureName || 'Fee'}
                      </td>
                      <td className="px-4 py-3 text-gray-600 capitalize">
                        {fee.category || fee.feeStructure?.category || '—'}
                      </td>
                      <td className="px-4 py-3 text-gray-600">{fee.academicYear || '—'}</td>
                      <td className="px-4 py-3 text-right font-medium text-gray-900">
                      ₹{totalAmt.toLocaleString()}
                    </td>
                      <td className="px-4 py-3 text-right font-medium text-green-700">₹{paid.toLocaleString()}</td>
                      <td className="px-4 py-3 text-right font-medium text-blue-700">₹{disc.toLocaleString()}</td>
                      <td className={`px-4 py-3 text-right font-medium ${balance > 0 ? 'text-red-600' : 'text-green-600'}`}>
                        ₹{balance.toLocaleString()}
                      </td>
                      <td className="px-4 py-3 text-center">
                        <span className={`px-2 py-0.5 rounded-full text-xs font-semibold capitalize ${
                          status === 'paid'    ? 'bg-green-100 text-green-800'  :
                          status === 'partial' ? 'bg-yellow-100 text-yellow-800' :
                          status === 'overdue' ? 'bg-red-100 text-red-800'      :
                                                 'bg-gray-100 text-gray-700'
                        }`}>{status}</span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>

        {/* ── Summary ── */}
        <div className="mx-8 mb-8 bg-gray-900 text-white rounded-xl p-6">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
            {[
              { label: 'Grand Total',    value: grandTotal,    color: 'text-white'      },
              { label: 'Amount Paid',    value: totalPaid,     color: 'text-green-400'  },
              { label: 'Discount',       value: totalDiscount, color: 'text-blue-400'   },
              { label: 'Balance Due',    value: totalBalance,  color: totalBalance > 0 ? 'text-red-400' : 'text-green-400' },
            ].map(({ label, value, color }) => (
              <div key={label}>
                <p className="text-xs text-gray-400 uppercase tracking-wide mb-1">{label}</p>
                <p className={`text-2xl font-bold ${color}`}>₹{value.toLocaleString()}</p>
              </div>
            ))}
          </div>
        </div>

        {/* ── Signatures ── */}
        <div className="px-8 pb-8">
          <div className="bg-gray-50 rounded-lg p-4 mb-4">
            <p className="text-sm text-gray-600">
              <span className="font-semibold">Received By:</span> {collectedBy}
            </p>
          </div>
          <div className="grid grid-cols-3 gap-8 text-center mt-6">
            <div>
              <div className="border-t-2 border-gray-400 pt-3">
                <p className="text-sm font-medium text-gray-700">Cashier</p>
                <p className="text-xs text-gray-500 mt-1">{collectedBy}</p>
              </div>
            </div>
            <div>
              <div className="border-t-2 border-gray-400 pt-3">
                <p className="text-sm font-medium text-gray-700">Authorized Signatory</p>
                <p className="text-xs text-gray-500 mt-1">Principal / Administrator</p>
              </div>
            </div>
            <div>
              <div className="border-t-2 border-gray-400 pt-3">
                <p className="text-sm font-medium text-gray-700">Parent / Guardian</p>
                <p className="text-xs text-gray-500 mt-1">{parentName || 'Signature'}</p>
              </div>
            </div>
          </div>
          <div className="mt-6 p-3 bg-blue-50 rounded-lg border border-blue-200">
            <p className="text-xs text-center text-blue-700">
              <strong>Important:</strong> This is a computer-generated receipt and is valid without signature. 
              Please keep it for your records. For any queries, please contact the accounts department.
            </p>
          </div>
        </div>

        {/* ── Action Buttons (no-print) ── */}
        <div className="p-6 bg-gray-100 border-t flex flex-wrap justify-end gap-3 no-print">
          <button
            onClick={handlePrint}
            className="px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors flex items-center gap-2 text-sm"
          >
            🖨️ Print Receipt
          </button>
          {onDownload && (
            <button
              onClick={onDownload}
              className="px-5 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg font-medium transition-colors flex items-center gap-2 text-sm"
            >
              ⬇️ Download PDF
            </button>
          )}
          {onClose && (
            <button
              onClick={onClose}
              className="px-5 py-2 bg-gray-500 hover:bg-gray-600 text-white rounded-lg font-medium transition-colors text-sm"
            >
              ✕ Close
            </button>
          )}
        </div>
      </motion.div>

      <style jsx>{`
        @media print {
          .no-print { display: none !important; }
          #receipt-print { background: white !important; }
        }
      `}</style>
    </div>
  );
}
