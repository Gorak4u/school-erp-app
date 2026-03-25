'use client';

import React, { useMemo, useRef, useState } from 'react';
import { motion } from 'framer-motion';
import { useSchoolConfig } from '@/contexts/SchoolConfigContext';
import SchoolHeader from '@/components/SchoolHeader';
import { PDFGenerator } from '@/utils/pdfGenerator';
import { buildReceiptStatementModel } from '../utils/receiptStatement';

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

const formatCurrency = (value: number) => `₹${Number(value || 0).toLocaleString('en-IN')}`;

const payMethodLabel = (method: string) => (
  {
    cash: 'Cash',
    cheque: 'Cheque',
    online: 'Online Transfer',
    bank_transfer: 'Bank Transfer',
    upi: 'UPI',
    card: 'Card',
    netbanking: 'Net Banking',
    wallet: 'Wallet',
  }[method] || method || '—'
);

const statusBadgeClass = (status: string) => {
  if (status === 'paid') return 'bg-green-100 text-green-800';
  if (status === 'partial') return 'bg-amber-100 text-amber-800';
  if (status === 'overdue') return 'bg-red-100 text-red-800';
  return 'bg-gray-100 text-gray-700';
};

export default function UnifiedPaymentReceipt({
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
  const [isSharing, setIsSharing] = useState(false);

  const schoolName = getSetting('school_details', 'name', getSetting('school_details', 'school_name', 'School'));
  const schoolPhone = getSetting('school_details', 'phone', '');
  const schoolEmail = getSetting('school_details', 'email', '');
  const schoolWebsite = getSetting('school_details', 'website', '');

  const receiptModel = useMemo(
    () => buildReceiptStatementModel(paymentData, receiptNumber, paymentDate),
    [paymentData, receiptNumber, paymentDate]
  );

  const studentName = studentData?.studentName || studentData?.name || 'N/A';
  const studentClass = studentData?.studentClass || studentData?.class || 'N/A';
  const rollNo = studentData?.rollNo || studentData?.admissionNo || 'N/A';
  const parentName = studentData?.parentName || studentData?.fatherName || '—';
  const collectedBy = studentData?.collectedBy || 'Accounts Department';
  const paymentMeta = [schoolPhone && `Phone: ${schoolPhone}`, schoolEmail && `Email: ${schoolEmail}`, schoolWebsite && `Web: ${schoolWebsite}`].filter(Boolean);
  const normalizedReceiptDate = paymentDate
    ? new Date(paymentDate).toLocaleDateString('en-IN', { day: '2-digit', month: 'long', year: 'numeric' })
    : '—';
  const primaryReference = receiptModel.receiptReferences[0] || receiptNumber || 'Receipt';
  const receiptFileBase = `${primaryReference || studentName || 'receipt'}`.replace(/[^a-zA-Z0-9_-]/g, '_');
  const transactionReference = receiptModel.transactionRefs[0] || '—';
  const isDark = theme === 'dark';
  const card = `rounded-2xl border shadow-lg ${isDark ? 'bg-gradient-to-br from-gray-800 to-gray-900 border-gray-700' : 'bg-gradient-to-br from-white to-gray-50 border-gray-200'}`;
  const subtleCard = isDark ? 'rounded-2xl border border-gray-700 bg-gray-800/70' : 'rounded-2xl border border-gray-200 bg-white';

  const handlePrint = () => {
    if (onPrint) {
      onPrint();
      return;
    }

    const receiptHtml = receiptRef.current?.innerHTML;
    if (!receiptHtml) return;

    const printWindow = window.open('', '_blank', 'noopener,noreferrer,width=1024,height=900');
    if (!printWindow) return;

    printWindow.document.write(`
      <html>
        <head>
          <title>${primaryReference} - ${schoolName}</title>
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

  const handleDownloadPdf = async () => {
    if (onDownload) {
      onDownload();
      return;
    }
    await PDFGenerator.generateFromElement('receipt-print', `${receiptFileBase}.pdf`);
  };

  const handleDownloadImage = async () => {
    await PDFGenerator.downloadElementAsImage('receipt-print', `${receiptFileBase}.png`);
  };

  const handleShare = async () => {
    try {
      setIsSharing(true);
      await PDFGenerator.shareElementAsImage('receipt-print', {
        fileName: `${receiptFileBase}.png`,
        title: `${studentName} Fee Receipt`,
        text: `${schoolName} fee receipt ${primaryReference}`,
      });
    } finally {
      setIsSharing(false);
    }
  };

  return (
    <div className="bg-white overflow-hidden" id="receipt-print" ref={receiptRef} style={{ width: '100%', maxWidth: '900px', margin: '0 auto', padding: '0' }}>
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className={`w-full max-w-[900px] mx-auto overflow-hidden ${card}`}
        style={{ width: '100%', maxWidth: '900px', overflowX: 'hidden' }}
      >
        <div className={`p-8 pb-6 border-b ${isDark ? 'border-gray-700 bg-gradient-to-br from-gray-800 via-blue-950/20 to-indigo-950/20' : 'border-gray-200 bg-gradient-to-br from-white via-blue-50/40 to-indigo-50/60'} receipt-header`}>
          <SchoolHeader variant="print" className="mb-6" />

          <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
            <div>
              <div className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold uppercase tracking-[0.2em] ${isDark ? 'bg-blue-500/10 text-blue-300 border border-blue-500/20' : 'bg-blue-50 text-blue-700 border border-blue-100'}`}>
                Fee Statement Receipt
              </div>
              <h1 className={`mt-3 text-3xl font-black ${isDark ? 'text-white' : 'text-gray-900'} school-name`}>{schoolName}</h1>
              {paymentMeta.length > 0 && (
                <p className={`mt-2 text-sm ${isDark ? 'text-gray-300' : 'text-gray-500'}`}>{paymentMeta.join(' • ')}</p>
              )}
            </div>

            <div className="grid grid-cols-1 gap-3 min-w-[260px] payment-info">
              <div className={subtleCard}>
                <div className="p-4">
                  <p className={`text-xs font-semibold uppercase tracking-[0.18em] ${isDark ? 'text-blue-300' : 'text-blue-600'}`}>Receipt Reference</p>
                  <p className={`mt-1 text-lg font-bold font-mono break-all ${isDark ? 'text-white' : 'text-gray-900'} receipt-number`}>{primaryReference}</p>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className={subtleCard}>
                  <div className="p-4">
                    <p className={`text-xs font-semibold uppercase tracking-wide ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>Date</p>
                    <p className={`mt-1 text-sm font-semibold ${isDark ? 'text-white' : 'text-gray-900'} payment-date`}>{normalizedReceiptDate}</p>
                  </div>
                </div>
                <div className={subtleCard}>
                  <div className="p-4">
                    <p className={`text-xs font-semibold uppercase tracking-wide ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>Method</p>
                    <p className={`mt-1 text-sm font-semibold ${isDark ? 'text-white' : 'text-gray-900'} payment-method`}>{payMethodLabel(paymentMethod)}</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className={`px-8 py-6 border-b ${isDark ? 'border-gray-700 bg-gray-900/40' : 'border-gray-200 bg-white'}`}>
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4 student-info-section">
            {[
              { label: 'Student Name', value: studentName, className: 'student-name' },
              { label: 'Class & Section', value: studentClass, className: 'class-name' },
              { label: 'Admission / Roll', value: rollNo, className: 'admission-no' },
              { label: 'Parent / Guardian', value: parentName, className: 'father-name' },
              { label: 'Received By', value: collectedBy, className: 'collected-by' },
            ].map(({ label, value, className }) => (
              <div key={label} className={subtleCard}>
                <div className="px-4 py-3">
                  <p className={`text-[11px] font-semibold uppercase tracking-[0.18em] ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>{label}</p>
                  <p className={`mt-1 text-sm font-semibold break-words ${isDark ? 'text-white' : 'text-gray-900'} ${className}`}>{value}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {receiptModel.receiptReferences.length > 1 && (
          <div className={`px-8 py-4 border-b ${isDark ? 'border-amber-500/20 bg-amber-500/10' : 'border-gray-200 bg-amber-50/60'}`}>
            <p className={`text-xs font-semibold uppercase tracking-[0.18em] ${isDark ? 'text-amber-200' : 'text-amber-700'}`}>Included Receipt Numbers</p>
            <div className="mt-2 flex flex-wrap gap-2">
              {receiptModel.receiptReferences.map((reference: string) => (
                <span key={reference} className={`px-3 py-1 rounded-full text-xs font-mono ${isDark ? 'bg-gray-800 border border-amber-500/20 text-amber-100' : 'bg-white border border-amber-200 text-amber-800'}`}>
                  {reference}
                </span>
              ))}
            </div>
          </div>
        )}

        {receiptModel.paymentLines.length > 0 && (
          <div className={`p-8 border-b ${isDark ? 'border-gray-700 bg-gray-900/20' : 'border-gray-200 bg-white'}`}>
            <div className="flex items-center justify-between gap-4 mb-4">
              <div>
                <h3 className={`text-base font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>Payment Captured In This Receipt</h3>
                <p className={`text-sm ${isDark ? 'text-gray-300' : 'text-gray-500'}`}>These lines represent the specific amount collected for this receipt event.</p>
              </div>
              <div className={subtleCard}>
                <div className="px-4 py-3 text-right">
                  <p className={`text-[11px] font-semibold uppercase tracking-[0.18em] ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>Collected Now</p>
                  <p className={`mt-1 text-xl font-black ${isDark ? 'text-green-300' : 'text-green-700'}`}>{formatCurrency(receiptModel.currentPaymentTotal)}</p>
                </div>
              </div>
            </div>

            <div className={`overflow-x-auto rounded-2xl border ${isDark ? 'border-gray-700' : 'border-gray-200'}`}>
              <table className="w-full text-sm">
                <thead>
                  <tr className={isDark ? 'bg-gray-950 text-white' : 'bg-gray-900 text-white'}>
                    <th className="text-left px-4 py-3 font-semibold">#</th>
                    <th className="text-left px-4 py-3 font-semibold">Fee Head</th>
                    <th className="text-left px-4 py-3 font-semibold">Section</th>
                    <th className="text-left px-4 py-3 font-semibold">Receipt Ref</th>
                    <th className="text-left px-4 py-3 font-semibold">Txn Ref</th>
                    <th className="text-right px-4 py-3 font-semibold">Collected</th>
                  </tr>
                </thead>
                <tbody>
                  {receiptModel.paymentLines.map((line, index) => (
                    <tr key={`${line.id}-payment`} className={index % 2 === 0 ? (isDark ? 'bg-gray-900/50' : 'bg-white') : (isDark ? 'bg-gray-800/70' : 'bg-gray-50/60')}>
                      <td className={`px-4 py-3 ${isDark ? 'text-gray-300' : 'text-gray-500'}`}>{index + 1}</td>
                      <td className="px-4 py-3">
                        <div className={`font-medium ${isDark ? 'text-white' : 'text-gray-900'}`}>{line.name}</div>
                        {line.remarks && <div className={`text-xs mt-1 ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>{line.remarks}</div>}
                      </td>
                      <td className={`px-4 py-3 ${isDark ? 'text-gray-200' : 'text-gray-600'}`}>{line.sectionLabel}</td>
                      <td className="px-4 py-3">
                        {line.receiptNumber ? <span className={`inline-flex px-2 py-1 rounded-lg text-xs font-mono ${isDark ? 'bg-blue-500/10 text-blue-200 border border-blue-500/20' : 'bg-blue-50 text-blue-700 border border-blue-100'}`}>{line.receiptNumber}</span> : <span className={isDark ? 'text-gray-500' : 'text-gray-400'}>—</span>}
                      </td>
                      <td className={`px-4 py-3 ${isDark ? 'text-gray-200' : 'text-gray-600'}`}>{line.transactionId || '—'}</td>
                      <td className={`px-4 py-3 text-right font-semibold ${isDark ? 'text-green-300' : 'text-green-700'}`}>{formatCurrency(line.paidAmount)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        <div className={`p-8 border-b ${isDark ? 'border-gray-700 bg-gray-900/20' : 'border-gray-200 bg-white'}`}>
          <h3 className={`text-base font-bold mb-4 ${isDark ? 'text-white' : 'text-gray-900'}`}>Statement Summary</h3>
          <div className={`overflow-x-auto rounded-2xl border ${isDark ? 'border-gray-700' : 'border-gray-200'}`}>
            <table className="w-full text-sm">
              <thead>
                <tr className={isDark ? 'bg-gray-950 text-white' : 'bg-gray-900 text-white'}>
                  <th className="text-left px-4 py-3 font-semibold">Section</th>
                  <th className="text-right px-4 py-3 font-semibold">Total</th>
                  <th className="text-right px-4 py-3 font-semibold">Paid</th>
                  <th className="text-right px-4 py-3 font-semibold">Discount</th>
                  <th className="text-right px-4 py-3 font-semibold">Balance</th>
                </tr>
              </thead>
              <tbody>
                {receiptModel.summaryRows.map((row, index) => (
                  <tr key={row.key} className={index % 2 === 0 ? (isDark ? 'bg-gray-900/50' : 'bg-white') : (isDark ? 'bg-gray-800/70' : 'bg-gray-50/60')}>
                    <td className={`px-4 py-3 font-medium ${isDark ? 'text-white' : 'text-gray-900'}`}>{row.label}</td>
                    <td className={`px-4 py-3 text-right ${isDark ? 'text-gray-100' : 'text-gray-900'}`}>{formatCurrency(row.total)}</td>
                    <td className={`px-4 py-3 text-right ${isDark ? 'text-green-300' : 'text-green-700'}`}>{formatCurrency(row.paid)}</td>
                    <td className={`px-4 py-3 text-right ${isDark ? 'text-blue-300' : 'text-blue-700'}`}>{formatCurrency(row.discount)}</td>
                    <td className={`px-4 py-3 text-right font-semibold ${row.balance > 0 ? (isDark ? 'text-red-300' : 'text-red-600') : (isDark ? 'text-green-300' : 'text-green-600')}`}>{formatCurrency(row.balance)}</td>
                  </tr>
                ))}
                <tr className={isDark ? 'bg-blue-950/40 text-white' : 'bg-blue-50 text-gray-900'}>
                  <td className="px-4 py-3 font-bold">{receiptModel.totals.label}</td>
                  <td className="px-4 py-3 text-right font-bold">{formatCurrency(receiptModel.totals.total)}</td>
                  <td className="px-4 py-3 text-right font-bold">{formatCurrency(receiptModel.totals.paid)}</td>
                  <td className="px-4 py-3 text-right font-bold">{formatCurrency(receiptModel.totals.discount)}</td>
                  <td className="px-4 py-3 text-right font-bold">{formatCurrency(receiptModel.totals.balance)}</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        <div className={`p-8 ${isDark ? 'bg-gray-900/20' : 'bg-white'}`}>
          <h3 className={`text-base font-bold mb-4 ${isDark ? 'text-white' : 'text-gray-900'}`}>Itemized Statement</h3>
          <div className={`overflow-x-auto rounded-2xl border ${isDark ? 'border-gray-700' : 'border-gray-200'}`}>
            <table className="w-full text-sm">
              <thead>
                <tr className={isDark ? 'bg-gray-950 text-white' : 'bg-gray-900 text-white'}>
                  <th className="text-left px-4 py-3 font-semibold">#</th>
                  <th className="text-left px-4 py-3 font-semibold">Fee Head</th>
                  <th className="text-left px-4 py-3 font-semibold">Section</th>
                  <th className="text-left px-4 py-3 font-semibold">Academic Year</th>
                  <th className="text-right px-4 py-3 font-semibold">Total</th>
                  <th className="text-right px-4 py-3 font-semibold">Paid</th>
                  <th className="text-right px-4 py-3 font-semibold">Discount</th>
                  <th className="text-right px-4 py-3 font-semibold">Balance</th>
                  <th className="text-center px-4 py-3 font-semibold">Status</th>
                </tr>
              </thead>
              <tbody>
                {receiptModel.statementLines.length === 0 ? (
                  <tr>
                    <td colSpan={9} className={`text-center py-10 ${isDark ? 'text-gray-400 bg-gray-900/30' : 'text-gray-400 bg-white'}`}>No fee data available</td>
                  </tr>
                ) : receiptModel.statementLines.map((line, index) => (
                  <tr key={`${line.id}-statement`} className={index % 2 === 0 ? (isDark ? 'bg-gray-900/50' : 'bg-white') : (isDark ? 'bg-gray-800/70' : 'bg-gray-50/60')}>
                    <td className={`px-4 py-3 ${isDark ? 'text-gray-300' : 'text-gray-500'}`}>{index + 1}</td>
                    <td className="px-4 py-3">
                      <div className={`font-medium ${isDark ? 'text-white' : 'text-gray-900'}`}>{line.name}</div>
                      {line.description && <div className={`text-xs mt-1 ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>{line.description}</div>}
                    </td>
                    <td className={`px-4 py-3 ${isDark ? 'text-gray-200' : 'text-gray-600'}`}>{line.sectionLabel}</td>
                    <td className={`px-4 py-3 ${isDark ? 'text-gray-200' : 'text-gray-600'}`}>{line.academicYear}</td>
                    <td className={`px-4 py-3 text-right font-medium ${isDark ? 'text-gray-100' : 'text-gray-900'}`}>{formatCurrency(line.totalAmount)}</td>
                    <td className={`px-4 py-3 text-right font-medium ${isDark ? 'text-green-300' : 'text-green-700'}`}>{formatCurrency(line.paidAmount)}</td>
                    <td className={`px-4 py-3 text-right font-medium ${isDark ? 'text-blue-300' : 'text-blue-700'}`}>{formatCurrency(line.discount)}</td>
                    <td className={`px-4 py-3 text-right font-medium ${line.balance > 0 ? (isDark ? 'text-red-300' : 'text-red-600') : (isDark ? 'text-green-300' : 'text-green-600')}`}>{formatCurrency(line.balance)}</td>
                    <td className="px-4 py-3 text-center">
                      <span className={`px-2.5 py-1 rounded-full text-xs font-semibold capitalize ${statusBadgeClass(line.status)}`}>{line.status}</span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        <div className={`px-8 pb-8 ${isDark ? 'bg-gray-900/20' : 'bg-white'}`}>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[
              { label: 'Statement Total', value: receiptModel.totals.total, color: isDark ? 'text-white' : 'text-gray-900' },
              { label: 'Collected Now', value: receiptModel.currentPaymentTotal, color: isDark ? 'text-green-300' : 'text-green-600' },
              { label: 'Statement Discount', value: receiptModel.statementDiscountTotal, color: isDark ? 'text-blue-300' : 'text-blue-600' },
              { label: 'Balance Remaining', value: receiptModel.statementBalanceTotal, color: receiptModel.statementBalanceTotal > 0 ? (isDark ? 'text-red-300' : 'text-red-600') : (isDark ? 'text-green-300' : 'text-green-600') },
            ].map(({ label, value, color }) => (
              <div key={label} className={subtleCard}>
                <div className="px-4 py-4 text-center">
                  <p className={`text-[11px] font-semibold uppercase tracking-[0.18em] ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>{label}</p>
                  <p className={`mt-2 text-2xl font-black ${color}`}>{formatCurrency(value)}</p>
                </div>
              </div>
            ))}
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-6">
            {[
              { label: 'Receipt Date', value: normalizedReceiptDate },
              { label: 'Payment Method', value: payMethodLabel(paymentMethod) },
              { label: 'Primary Receipt', value: primaryReference },
              { label: 'Transaction Ref', value: transactionReference },
            ].map(({ label, value }) => (
              <div key={label} className={subtleCard}>
                <div className="px-4 py-3">
                  <p className={`text-[11px] font-semibold uppercase tracking-[0.18em] ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>{label}</p>
                  <p className={`mt-1 text-sm font-semibold break-words ${isDark ? 'text-white' : 'text-gray-900'}`}>{value}</p>
                </div>
              </div>
            ))}
          </div>

          <div className={`mt-6 rounded-2xl border p-4 ${isDark ? 'border-blue-500/20 bg-blue-500/10' : 'border-blue-100 bg-blue-50/70'}`}>
            <p className={`text-sm ${isDark ? 'text-blue-100' : 'text-blue-900'}`}>
              This receipt shows the complete student fee statement across academic, transport, and previous-year arrears. Please retain it for audit, parent communication, and future fee reconciliation.
            </p>
          </div>

          <div className="grid grid-cols-3 gap-8 text-center mt-8">
            <div>
              <div className={`border-t-2 pt-3 ${isDark ? 'border-gray-600' : 'border-gray-400'}`}>
                <p className={`text-sm font-medium ${isDark ? 'text-gray-200' : 'text-gray-700'}`}>Cashier</p>
                <p className={`text-xs mt-1 ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>{collectedBy}</p>
              </div>
            </div>
            <div>
              <div className={`border-t-2 pt-3 ${isDark ? 'border-gray-600' : 'border-gray-400'}`}>
                <p className={`text-sm font-medium ${isDark ? 'text-gray-200' : 'text-gray-700'}`}>Authorized Signatory</p>
                <p className={`text-xs mt-1 ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>Principal / Administrator</p>
              </div>
            </div>
            <div>
              <div className={`border-t-2 pt-3 ${isDark ? 'border-gray-600' : 'border-gray-400'}`}>
                <p className={`text-sm font-medium ${isDark ? 'text-gray-200' : 'text-gray-700'}`}>Parent / Guardian</p>
                <p className={`text-xs mt-1 ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>{parentName}</p>
              </div>
            </div>
          </div>
        </div>

        <div className={`p-6 border-t flex flex-wrap justify-end gap-3 no-print ${isDark ? 'bg-gray-900 border-gray-700' : 'bg-gray-50 border-gray-200'}`}>
          <button
            onClick={handlePrint}
            className="px-5 py-2.5 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white rounded-xl font-medium transition-all hover:scale-105 shadow-lg flex items-center gap-2 text-sm"
          >
            🖨️ Print
          </button>
          <button
            onClick={handleDownloadPdf}
            className="px-5 py-2.5 bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800 text-white rounded-xl font-medium transition-all hover:scale-105 shadow-lg flex items-center gap-2 text-sm"
          >
            ⬇️ PDF
          </button>
          <button
            onClick={handleDownloadImage}
            className="px-5 py-2.5 bg-gradient-to-r from-purple-600 to-purple-700 hover:from-purple-700 hover:to-purple-800 text-white rounded-xl font-medium transition-all hover:scale-105 shadow-lg flex items-center gap-2 text-sm"
          >
            🖼️ Image
          </button>
          <button
            onClick={handleShare}
            disabled={isSharing}
            className="px-5 py-2.5 bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-600 hover:to-orange-700 text-white rounded-xl font-medium transition-all hover:scale-105 shadow-lg flex items-center gap-2 text-sm disabled:opacity-60 disabled:cursor-not-allowed disabled:hover:scale-100"
          >
            📤 {isSharing ? 'Sharing...' : 'Share'}
          </button>
          {onClose && (
            <button
              onClick={onClose}
              className={`px-5 py-2.5 rounded-xl text-sm font-medium border transition-all hover:scale-105 ${isDark ? 'border-gray-600 text-gray-300 hover:bg-gray-700' : 'border-gray-300 text-gray-700 hover:bg-gray-100'}`}
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
