'use client';

import React, { useMemo, useRef } from 'react';
import { motion } from 'framer-motion';
import { useSchoolConfig } from '@/contexts/SchoolConfigContext';
import SchoolHeader from '@/components/SchoolHeader';

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

  const schoolName = getSetting('school_details', 'name', getSetting('school_details', 'school_name', 'School'));
  const schoolPhone = getSetting('school_details', 'phone', '');
  const schoolEmail = getSetting('school_details', 'email', '');
  const schoolWebsite = getSetting('school_details', 'website', '');

  const feeItems = useMemo(() => {
    const source = Array.isArray(paymentData)
      ? paymentData
      : paymentData?.currentYearFees || [paymentData].filter(Boolean);

    return source.map((fee: any, index: number) => {
      const totalAmount = Number(fee.totalAmount ?? fee.amount ?? fee.feeAmount ?? fee.paidAmount ?? fee.amountPaid ?? 0);
      const paidAmount = Number(fee.amountPaid ?? fee.paidAmount ?? fee.paymentAmount ?? 0);
      const discount = Number(fee.discount ?? 0);
      const balance = fee.balance !== undefined
        ? Number(fee.balance)
        : Math.max(0, totalAmount - paidAmount - discount);
      const status = fee.status || (balance <= 0 ? 'paid' : paidAmount > 0 ? 'partial' : 'pending');

      return {
        id: fee.id || fee.paymentId || fee.feeRecordId || `receipt-item-${index}`,
        name: fee.name || fee.feeName || fee.feeStructure?.name || fee.feeStructureName || 'Fee',
        category: fee.category || fee.feeCategory || fee.feeStructure?.category || 'General',
        academicYear: fee.academicYear || fee.year || '—',
        totalAmount,
        paidAmount,
        discount,
        balance,
        status,
        receiptNumber: fee.receiptNumber || fee.lineReceiptNumber || '',
        transactionId: fee.transactionId || '',
        remarks: fee.remarks || '',
        paidOn: fee.paymentDate || fee.paidDate || paymentDate,
      };
    });
  }, [paymentData, paymentDate]);

  const studentName  = studentData?.studentName  || studentData?.name        || 'N/A';
  const studentClass = studentData?.studentClass || studentData?.class        || 'N/A';
  const rollNo       = studentData?.rollNo       || studentData?.admissionNo  || 'N/A';
  const parentName   = studentData?.parentName   || studentData?.fatherName   || '';
  const collectedBy  = studentData?.collectedBy || 'Accounts Department';

  const receiptReferences = useMemo(() => {
    const refsFromPayload = Array.isArray(paymentData?.includedReceiptNumbers) ? paymentData.includedReceiptNumbers : [];
    const refsFromItems = feeItems.map((item: any) => item.receiptNumber).filter(Boolean);
    return Array.from(new Set([...refsFromPayload, ...refsFromItems]));
  }, [feeItems, paymentData]);

  const grandTotal     = feeItems.reduce((s: number, f: any) => s + (f.totalAmount || 0), 0);
  const totalPaid      = feeItems.reduce((s: number, f: any) => s + (f.paidAmount   || 0), 0);
  const totalDiscount  = feeItems.reduce((s: number, f: any) => s + (f.discount     || 0), 0);
  const totalBalance   = grandTotal - totalPaid - totalDiscount;

  const handlePrint = () => {
    if (onPrint) { onPrint(); return; }
    const receiptHtml = receiptRef.current?.innerHTML;
    if (!receiptHtml) return;

    const printWindow = window.open('', '_blank', 'noopener,noreferrer,width=1024,height=900');
    if (!printWindow) return;

    printWindow.document.write(`
      <html>
        <head>
          <title>${receiptNumber} - ${schoolName}</title>
          <style>
            :root { color-scheme: light; }
            body { margin: 0; padding: 24px; font-family: Inter, Arial, sans-serif; background: #f3f4f6; color: #111827; }
            .receipt-print-shell { max-width: 900px; margin: 0 auto; background: #ffffff; }
            table { width: 100%; border-collapse: collapse; }
            th, td { border-bottom: 1px solid #e5e7eb; }
            @page { size: A4; margin: 10mm; }
            @media print {
              body { padding: 0; background: #ffffff; }
              .receipt-print-shell { max-width: none; }
            }
          </style>
        </head>
        <body>
          <div class="receipt-print-shell">${receiptHtml}</div>
        </body>
      </html>
    `);
    printWindow.document.close();
    printWindow.focus();
    setTimeout(() => printWindow.print(), 250);
  };

  const payMethodLabel = (m: string) =>
    ({ cash: 'Cash', cheque: 'Cheque', online: 'Online Transfer',
       bank_transfer: 'Bank Transfer', upi: 'UPI', card: 'Card', netbanking: 'Net Banking', wallet: 'Wallet' }[m] || m);

  const normalizedReceiptDate = paymentDate
    ? new Date(paymentDate).toLocaleDateString('en-IN', { day: '2-digit', month: 'long', year: 'numeric' })
    : '—';

  const paymentMeta = [schoolPhone && `Phone: ${schoolPhone}`, schoolEmail && `Email: ${schoolEmail}`, schoolWebsite && `Web: ${schoolWebsite}`].filter(Boolean);

  return (
    <div className="bg-white overflow-hidden" id="receipt-print" ref={receiptRef} style={{ width: '100%', maxWidth: '900px', margin: '0 auto', padding: '0' }}>
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-[900px] mx-auto bg-white overflow-hidden rounded-2xl border border-gray-200 shadow-xl"
        style={{ width: '100%', maxWidth: '900px', overflowX: 'hidden' }}
      >
        <div className="p-8 pb-6 bg-gradient-to-br from-white via-blue-50/40 to-indigo-50/60 border-b border-gray-200">
          <SchoolHeader variant="print" className="mb-6" />

          <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
            <div>
              <div className="inline-flex items-center px-3 py-1 rounded-full bg-blue-50 text-blue-700 border border-blue-100 text-xs font-semibold uppercase tracking-[0.2em]">
                Payment Receipt
              </div>
              <h1 className="mt-3 text-3xl font-black text-gray-900">{schoolName}</h1>
              {paymentMeta.length > 0 && (
                <p className="mt-2 text-sm text-gray-500">{paymentMeta.join(' • ')}</p>
              )}
            </div>

            <div className="grid grid-cols-1 gap-3 min-w-[260px]">
              <div className="rounded-2xl border border-blue-100 bg-white p-4 shadow-sm">
                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-blue-600">Receipt Reference</p>
                <p className="mt-1 text-lg font-bold font-mono text-gray-900 break-all">{receiptNumber}</p>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="rounded-2xl border border-gray-200 bg-white p-4">
                  <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">Date</p>
                  <p className="mt-1 text-sm font-semibold text-gray-900">{normalizedReceiptDate}</p>
                </div>
                <div className="rounded-2xl border border-gray-200 bg-white p-4">
                  <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">Method</p>
                  <p className="mt-1 text-sm font-semibold text-gray-900">{payMethodLabel(paymentMethod)}</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="px-8 py-6 border-b border-gray-200 bg-white">
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
            {[
              { label: 'Student Name', value: studentName },
              { label: 'Class & Section', value: studentClass },
              { label: 'Admission / Roll', value: rollNo },
              { label: 'Parent / Guardian', value: parentName || '—' },
              { label: 'Received By', value: collectedBy || '—' },
            ].map(({ label, value }) => (
              <div key={label} className="rounded-2xl border border-gray-200 bg-gray-50/70 px-4 py-3">
                <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-gray-500">{label}</p>
                <p className="mt-1 text-sm font-semibold text-gray-900 break-words">{value}</p>
              </div>
            ))}
          </div>
        </div>

        {receiptReferences.length > 1 && (
          <div className="px-8 py-4 border-b border-gray-200 bg-amber-50/60">
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-amber-700">Included Receipt Numbers</p>
            <div className="mt-2 flex flex-wrap gap-2">
              {receiptReferences.map((reference: string) => (
                <span key={reference} className="px-3 py-1 rounded-full bg-white border border-amber-200 text-xs font-mono text-amber-800">
                  {reference}
                </span>
              ))}
            </div>
          </div>
        )}

        <div className="p-8 bg-white">
          <h3 className="text-base font-bold text-gray-900 mb-4">Fee Details</h3>
          <div className="overflow-x-auto rounded-2xl border border-gray-200">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-gray-900 text-white">
                  <th className="text-left px-4 py-3 font-semibold">#</th>
                  <th className="text-left px-4 py-3 font-semibold">Fee</th>
                  <th className="text-left px-4 py-3 font-semibold">Category</th>
                  <th className="text-left px-4 py-3 font-semibold">Academic Year</th>
                  <th className="text-left px-4 py-3 font-semibold">Receipt Ref</th>
                  <th className="text-right px-4 py-3 font-semibold">Gross</th>
                  <th className="text-right px-4 py-3 font-semibold">Collected</th>
                  <th className="text-right px-4 py-3 font-semibold">Discount</th>
                  <th className="text-right px-4 py-3 font-semibold">Balance</th>
                  <th className="text-center px-4 py-3 font-semibold">Status</th>
                </tr>
              </thead>
              <tbody>
                {feeItems.length === 0 ? (
                  <tr>
                    <td colSpan={10} className="text-center py-10 text-gray-400">No fee data available</td>
                  </tr>
                ) : feeItems.map((fee: any, idx: number) => (
                  <tr key={fee.id} className={idx % 2 === 0 ? 'bg-white' : 'bg-gray-50/60'}>
                    <td className="px-4 py-3 text-gray-500">{idx + 1}</td>
                    <td className="px-4 py-3">
                      <div className="font-medium text-gray-900">{fee.name}</div>
                      {fee.remarks && <div className="text-xs text-gray-500 mt-1">{fee.remarks}</div>}
                    </td>
                    <td className="px-4 py-3 text-gray-600 capitalize">{fee.category}</td>
                    <td className="px-4 py-3 text-gray-600">{fee.academicYear}</td>
                    <td className="px-4 py-3">
                      {fee.receiptNumber ? (
                        <span className="inline-flex px-2 py-1 rounded-lg bg-blue-50 text-blue-700 border border-blue-100 text-xs font-mono break-all">
                          {fee.receiptNumber}
                        </span>
                      ) : (
                        <span className="text-gray-400">—</span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-right font-medium text-gray-900">₹{fee.totalAmount.toLocaleString()}</td>
                    <td className="px-4 py-3 text-right font-medium text-green-700">₹{fee.paidAmount.toLocaleString()}</td>
                    <td className="px-4 py-3 text-right font-medium text-blue-700">₹{fee.discount.toLocaleString()}</td>
                    <td className={`px-4 py-3 text-right font-medium ${fee.balance > 0 ? 'text-red-600' : 'text-green-600'}`}>₹{fee.balance.toLocaleString()}</td>
                    <td className="px-4 py-3 text-center">
                      <span className={`px-2.5 py-1 rounded-full text-xs font-semibold capitalize ${
                        fee.status === 'paid' ? 'bg-green-100 text-green-800' :
                        fee.status === 'partial' ? 'bg-amber-100 text-amber-800' :
                        fee.status === 'overdue' ? 'bg-red-100 text-red-800' :
                        'bg-gray-100 text-gray-700'
                      }`}>{fee.status}</span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
        <div className="px-8 pb-8">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[
              { label: 'Gross Amount', value: grandTotal, color: 'text-gray-900' },
              { label: 'Collected Now', value: totalPaid, color: 'text-green-600' },
              { label: 'Discount', value: totalDiscount, color: 'text-blue-600' },
              { label: 'Balance Remaining', value: totalBalance, color: totalBalance > 0 ? 'text-red-600' : 'text-green-600' },
            ].map(({ label, value, color }) => (
              <div key={label} className="rounded-2xl border border-gray-200 bg-gray-50/70 px-4 py-4 text-center">
                <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-gray-500">{label}</p>
                <p className={`mt-2 text-2xl font-black ${color}`}>₹{value.toLocaleString()}</p>
              </div>
            ))}
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-6">
            {[
              { label: 'Receipt Date', value: normalizedReceiptDate },
              { label: 'Payment Method', value: payMethodLabel(paymentMethod) },
              { label: 'Primary Receipt', value: receiptReferences[0] || receiptNumber },
              { label: 'Transaction Ref', value: feeItems.find((item: any) => item.transactionId)?.transactionId || '—' },
            ].map(({ label, value }) => (
              <div key={label} className="rounded-2xl border border-gray-200 bg-white px-4 py-3">
                <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-gray-500">{label}</p>
                <p className="mt-1 text-sm font-semibold text-gray-900 break-words">{value}</p>
              </div>
            ))}
          </div>

          <div className="mt-6 rounded-2xl border border-blue-100 bg-blue-50/70 p-4">
            <p className="text-sm text-blue-900">
              This is a computer-generated receipt and remains valid without a physical signature. Please retain it for audit, parent communication, and future fee reconciliation.
            </p>
          </div>

          <div className="grid grid-cols-3 gap-8 text-center mt-8">
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
        </div>

        <div className="p-6 bg-gray-50 border-t border-gray-200 flex flex-wrap justify-end gap-3 no-print">
          <button
            onClick={handlePrint}
            className="px-5 py-2.5 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white rounded-xl font-medium transition-all shadow-lg flex items-center gap-2 text-sm"
          >
            🖨️ Print Receipt
          </button>
          {onDownload && (
            <button
              onClick={onDownload}
              className="px-5 py-2.5 bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800 text-white rounded-xl font-medium transition-all shadow-lg flex items-center gap-2 text-sm"
            >
              ⬇️ Download PDF
            </button>
          )}
          {onClose && (
            <button
              onClick={onClose}
              className="px-5 py-2.5 bg-gray-500 hover:bg-gray-600 text-white rounded-xl font-medium transition-colors text-sm"
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
