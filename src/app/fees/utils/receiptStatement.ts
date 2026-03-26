export type ReceiptSectionKey = 'academic' | 'transport' | 'arrears' | 'fines' | 'refunds';

export interface ReceiptLineItem {
  id: string;
  section: ReceiptSectionKey;
  sectionLabel: string;
  name: string;
  category: string;
  academicYear: string;
  totalAmount: number;
  paidAmount: number;
  discount: number;
  balance: number;
  status: string;
  receiptNumber: string;
  transactionId: string;
  remarks: string;
  description: string;
  paidOn: string;
}

export interface ReceiptSummaryRow {
  key: ReceiptSectionKey;
  label: string;
  total: number;
  paid: number;
  discount: number;
  balance: number;
}

export interface ReceiptGrandTotalRow {
  key: 'grand';
  label: 'Grand Total';
  total: number;
  paid: number;
  discount: number;
  balance: number;
}

export interface ReceiptStatementModel {
  paymentLines: ReceiptLineItem[];
  statementLines: ReceiptLineItem[];
  summaryRows: ReceiptSummaryRow[];
  totals: ReceiptGrandTotalRow;
  receiptReferences: string[];
  currentPaymentTotal: number;
  statementPaidTotal: number;
  statementDiscountTotal: number;
  statementBalanceTotal: number;
  transactionRefs: string[];
}

const toNumber = (value: any) => {
  const parsed = Number(value ?? 0);
  return Number.isFinite(parsed) ? parsed : 0;
};

const normalizeText = (value?: string) => (typeof value === 'string' ? value.trim().toLowerCase() : '');

const isArrearsRecord = (record: any) => {
  const category = normalizeText(record?.category || record?.feeCategory || record?.feeStructure?.category || record?.feeStructureName);
  const name = normalizeText(record?.name || record?.feeName || record?.feeStructure?.name || record?.invoiceNumber);
  return record?.recordType === 'arrears'
    || record?.record_type === 'arrears'
    || category.includes('arrears')
    || name.includes('arrears')
    || String(record?.invoiceNumber || '').startsWith('ARR-')
    || Boolean(record?.fromAcademicYear)
    || Boolean(record?.toAcademicYear);
};

const resolveSection = (record: any): ReceiptSectionKey => {
  if (isArrearsRecord(record)) return 'arrears';
  if (record?.isFine || record?.category === 'fines' || normalizeText(record?.name || '').includes('fine')) return 'fines';
  const category = normalizeText(record?.category || record?.feeCategory || record?.feeStructure?.category || record?.feeStructureName);
  if (category.includes('transport')) return 'transport';
  return 'academic';
};

const resolveSectionLabel = (section: ReceiptSectionKey) => {
  if (section === 'transport') return 'Transport Fees';
  if (section === 'arrears') return 'Arrears From Previous Academic Year';
  if (section === 'fines') return 'Fines & Penalties';
  return 'Academic Fees';
};

const buildDescription = (record: any, section: ReceiptSectionKey) => {
  const explicit = record?.description || record?.remarks || '';
  if (section === 'arrears') {
    const fromYear = record?.fromAcademicYear || record?.referenceAcademicYear || '';
    if (fromYear) return `From ${fromYear}`;
  }
  return explicit;
};

const normalizeLine = (record: any, index: number, mode: 'payment' | 'statement', fallbackPaymentDate: string): ReceiptLineItem => {
  const section = resolveSection(record);
  const totalAmount = toNumber(record?.totalAmount ?? record?.amount ?? record?.feeAmount);
  const paidAmount = mode === 'statement'
    ? toNumber(record?.paidAmount ?? record?.totalPayments ?? record?.amountPaid)
    : toNumber(record?.amountPaid ?? record?.paidAmount ?? record?.paymentAmount ?? record?.amount);
  const discount = toNumber(record?.discount ?? record?.feeDiscount);
  const balance = record?.balance !== undefined || record?.pendingAmount !== undefined || record?.feePendingAmount !== undefined
    ? toNumber(record?.balance ?? record?.pendingAmount ?? record?.feePendingAmount)
    : Math.max(0, totalAmount - paidAmount - discount);
  const status = record?.status || record?.feeStatus || (balance <= 0 ? 'paid' : paidAmount > 0 ? 'partial' : 'pending');

  return {
    id: String(record?.id || record?.paymentId || record?.feeRecordId || `receipt-line-${mode}-${index}`),
    section,
    sectionLabel: resolveSectionLabel(section),
    name: record?.name || record?.feeName || record?.feeStructure?.name || record?.feeStructureName || (section === 'arrears' ? 'Arrears' : 'Fee'),
    category: record?.category || record?.feeCategory || record?.feeStructure?.category || record?.feeStructureName || section,
    academicYear: record?.academicYear || record?.toAcademicYear || record?.year || '—',
    totalAmount,
    paidAmount,
    discount,
    balance,
    status,
    receiptNumber: record?.receiptNumber || record?.lineReceiptNumber || '',
    transactionId: record?.transactionId || '',
    remarks: record?.remarks || '',
    description: buildDescription(record, section),
    paidOn: record?.paymentDate || record?.paidDate || fallbackPaymentDate,
  };
};

const buildSummaryRows = (statementLines: ReceiptLineItem[]): ReceiptSummaryRow[] => {
  const base: ReceiptSummaryRow[] = [
    { key: 'academic', label: 'Academic Fees', total: 0, paid: 0, discount: 0, balance: 0 },
    { key: 'transport', label: 'Transport Fees', total: 0, paid: 0, discount: 0, balance: 0 },
    { key: 'arrears', label: 'Arrears From Previous Academic Year', total: 0, paid: 0, discount: 0, balance: 0 },
    { key: 'fines', label: 'Fines & Penalties', total: 0, paid: 0, discount: 0, balance: 0 },
  ];

  for (const line of statementLines) {
    const target = base.find((row) => row.key === line.section);
    if (!target) continue;
    target.total += line.totalAmount;
    target.paid += line.paidAmount;
    target.discount += line.discount;
    target.balance += line.balance;
  }

  return base;
};

export const buildReceiptStatementModel = (
  paymentData: any,
  receiptNumber: string,
  paymentDate: string,
): ReceiptStatementModel => {
  const paymentSource = Array.isArray(paymentData)
    ? paymentData
    : paymentData?.currentYearFees || [paymentData].filter(Boolean);
  const statementSource = Array.isArray(paymentData?.statementRecords) && paymentData.statementRecords.length > 0
    ? paymentData.statementRecords
    : paymentSource;

  const paymentLines = paymentSource.map((record: any, index: number) => normalizeLine(record, index, 'payment', paymentDate));
  const statementLines = statementSource
    .map((record: any, index: number) => normalizeLine(record, index, 'statement', paymentDate))
    .sort((a: ReceiptLineItem, b: ReceiptLineItem) => {
      const order: Record<ReceiptSectionKey, number> = { academic: 0, transport: 1, fines: 2, arrears: 3, refunds: 4 };
      const sectionDiff = order[a.section] - order[b.section];
      if (sectionDiff !== 0) return sectionDiff;
      return a.name.localeCompare(b.name);
    });

  const summaryRows = buildSummaryRows(statementLines);
  const totals = summaryRows.reduce<ReceiptGrandTotalRow>(
    (acc: ReceiptGrandTotalRow, row: ReceiptSummaryRow) => ({
      ...acc,
      total: acc.total + row.total,
      paid: acc.paid + row.paid,
      discount: acc.discount + row.discount,
      balance: acc.balance + row.balance,
    }),
    { key: 'grand', label: 'Grand Total', total: 0, paid: 0, discount: 0, balance: 0 },
  );

  const receiptReferenceSource: string[] = [
    ...(Array.isArray(paymentData?.includedReceiptNumbers) ? paymentData.includedReceiptNumbers : []).filter((value: any): value is string => typeof value === 'string' && value.trim().length > 0),
    ...(typeof receiptNumber === 'string' && receiptNumber.trim().length > 0 ? [receiptNumber] : []),
    ...paymentLines.map((line: ReceiptLineItem) => line.receiptNumber).filter(Boolean),
  ];
  const receiptReferences: string[] = Array.from(new Set<string>(receiptReferenceSource));

  const transactionRefs: string[] = Array.from(
    new Set<string>(paymentLines.map((line: ReceiptLineItem) => line.transactionId).filter(Boolean))
  );

  return {
    paymentLines,
    statementLines,
    summaryRows,
    totals,
    receiptReferences,
    currentPaymentTotal: paymentLines.reduce((sum: number, line: ReceiptLineItem) => sum + line.paidAmount, 0),
    statementPaidTotal: totals.paid,
    statementDiscountTotal: totals.discount,
    statementBalanceTotal: totals.balance,
    transactionRefs,
  };
};
