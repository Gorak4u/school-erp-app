// @ts-nocheck
'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { 
  TrendingUp, 
  DollarSign, 
  CreditCard, 
  Award, 
  Clock, 
  FileText,
  Zap,
  Shield
} from 'lucide-react';

import { EnhancedFeeCollectionProps } from './types';
import { useFeeCollection } from './hooks/useFeeCollection';
import { usePaymentProcessing } from './hooks/usePaymentProcessing';

import OverviewTab from './components/OverviewTab';
import FeesTab from './components/FeesTab';
import PaymentTab from './components/PaymentTab';
import DiscountsTab from './components/DiscountsTab';
import HistoryTab from './components/HistoryTab';
import FinesTab from './components/FinesTab';
import ReceiptModals from './components/ReceiptModals';

export default function EnhancedFeeCollection({ 
  theme, 
  onClose, 
  studentId, 
  studentData, 
  onPaymentSuccess 
}: EnhancedFeeCollectionProps) {
  
  const {
    // State
    activeTab,
    setActiveTab,
    selectedFees,
    setSelectedFees,
    selectedYear,
    setSelectedYear,
    academicYears,
    historySearch,
    setHistorySearch,
    selectedCategory,
    setSelectedCategory,
    feeCategories,
    customAmounts,
    setCustomAmounts,
    discountSearch,
    setDiscountSearch,
    discountTypeFilter,
    setDiscountTypeFilter,
    discountStatusFilter,
    setDiscountStatusFilter,
    fines,
    finesStats,
    loadingFines,
    fetchFines,
    paymentHistoryData,
    loadingPaymentHistory,
    discountHistoryData,
    loadingDiscountHistory,
    showReceipt,
    setShowReceipt,
    showDetailedReceipt,
    setShowDetailedReceipt,
    showHistoryReceipt,
    setShowHistoryReceipt,
    selectedHistoryEntry,
    setSelectedHistoryEntry,
    isProcessing,
    setIsProcessing,
    paymentStep,
    setPaymentStep,
    paymentMethod,
    setPaymentMethod,
    promoCode,
    setPromoCode,
    installmentPlan,
    setInstallmentPlan,
    showUpiQr,
    setShowUpiQr,
    upiQrCode,
    setUpiQrCode,
    upiPaymentStatus,
    setUpiPaymentStatus,
    checkingPayment,
    setCheckingPayment,
    sharingQr,
    setSharingQr,
    latestReceipt,
    setLatestReceipt,
    
    // Computed
    filteredFees,
    stats,
    selectedFeesTotal,
    
    // Styles
    isDark,
    colors,
    cardCls,
    textPrimary,
    textSecondary,
    inputCls,
    
    // Helpers
    getStatusColor,
    getPriorityColor,
    normalizeCategory,
  } = useFeeCollection(studentId, studentData, theme);

  const {
    getCurrentUserName,
    buildReceiptStudentData,
    sendPaymentConfirmationEmail,
    handlePayment,
    handleUpiPaymentConfirmation,
    handleShareQrCode,
    paymentGatewayEnabled,
    upiId,
    razorpayKeyId,
  } = usePaymentProcessing(
    studentId,
    studentData,
    selectedFees,
    filteredFees,
    customAmounts,
    paymentMethod,
    promoCode,
    setIsProcessing,
    setLatestReceipt,
    setSelectedFees,
    setCustomAmounts,
    setShowReceipt,
    setShowUpiQr,
    setUpiQrCode,
    setUpiPaymentStatus,
    setCheckingPayment,
    fetchFines,
    onPaymentSuccess
  );

  // Payment methods configuration
  const paymentMethods = [
    { 
      id: 'cash', 
      name: 'Cash Payment', 
      icon: <DollarSign className="w-5 h-5" />, 
      color: colors.success,
      description: 'Pay with cash at the counter',
      fee: 0
    },
    { 
      id: 'card', 
      name: 'Credit/Debit Card', 
      icon: <CreditCard className="w-5 h-5" />, 
      color: colors.primary,
      description: 'Secure card payment (2% processing fee)',
      fee: 50
    },
    { 
      id: 'upi', 
      name: 'UPI Payment', 
      icon: <Zap className="w-5 h-5" />, 
      color: colors.cyan,
      description: 'Instant UPI transfer (0% processing fee)',
      fee: 0
    },
    { 
      id: 'netbanking', 
      name: 'Net Banking', 
      icon: <Shield className="w-5 h-5" />, 
      color: colors.purple,
      description: 'Bank transfer (₹10 processing fee)',
      fee: 10
    },
    { 
      id: 'wallet', 
      name: 'Digital Wallet', 
      icon: <Award className="w-5 h-5" />, 
      color: colors.pink,
      description: 'PayTM, PhonePe etc. (₹5 processing fee)',
      fee: 5
    },
  ];

  // Event handlers
  const handleFeeSelection = (feeId: string) => {
    const wasSelected = selectedFees.includes(feeId);
    const newSelection = wasSelected 
      ? selectedFees.filter(id => id !== feeId)
      : [...selectedFees, feeId];
    
    setSelectedFees(newSelection);
    
    if ((window as any).toast) {
      const fee = filteredFees.find(f => f.id === feeId);
      if (fee) {
        (window as any).toast({
          type: wasSelected ? 'info' : 'success',
          title: wasSelected ? 'Fee Deselected' : 'Fee Selected',
          message: `${fee.name} ${wasSelected ? 'removed from' : 'added to'} payment`,
          duration: 2000
        });
      }
    }
  };

  const handleSelectAll = () => {
    const unpaidFees = filteredFees.filter(fee => fee.status !== 'paid');
    const unpaidIds = unpaidFees.map(fee => fee.id);
    setSelectedFees(unpaidIds);
    
    if ((window as any).toast) {
      (window as any).toast({
        type: 'success',
        title: 'All Fees Selected',
        message: `${unpaidIds.length} unpaid fees added to payment`,
        duration: 2000
      });
    }
  };

  const handleClearSelection = () => {
    const count = selectedFees.length;
    setSelectedFees([]);
    setCustomAmounts({});
    
    if ((window as any).toast && count > 0) {
      (window as any).toast({
        type: 'info',
        title: 'Selection Cleared',
        message: `${count} fees removed from payment`,
        duration: 2000
      });
    }
  };

  const handleCustomAmountChange = (feeId: string, amount: number) => {
    const fee = filteredFees.find(f => f.id === feeId);
    if (!fee) return;
    
    const maxAmount = fee.amount - fee.paidAmount - (fee.discount || 0) - (fee.waivedAmount || 0);
    const validAmount = Math.min(Math.max(0, amount), maxAmount);
    
    setCustomAmounts(prev => ({
      ...prev,
      [feeId]: validAmount
    }));
    
    if (validAmount > 0 && !selectedFees.includes(feeId)) {
      setSelectedFees(prev => [...prev, feeId]);
    } else if (validAmount === 0) {
      setSelectedFees(prev => prev.filter(id => id !== feeId));
    }
  };

  const handleProceedToPayment = () => {
    setActiveTab('payment');
  };

  const handleUpiConfirmation = async () => {
    await handleUpiPaymentConfirmation();
  };

  const handleShareQr = async () => {
    await handleShareQrCode();
  };

  const handleCopyUpiLink = () => {
    const upiUrl = `upi://pay?pa=${upiId}&pn=${encodeURIComponent(studentData?.name || studentData?.studentName || 'Student')}&am=${stats.selectedFeesTotal}&cu=INR&tn=${encodeURIComponent('Fee Payment')}`;
    navigator.clipboard.writeText(upiUrl);
    if ((window as any).toast) {
      (window as any).toast({
        type: 'success',
        title: 'UPI Link Copied',
        message: 'UPI payment link copied to clipboard',
        duration: 3000
      });
    }
  };

  const handleViewReceiptFromUpi = () => {
    setShowUpiQr(false);
    setShowReceipt(true);
  };

  const handleViewHistoryReceipt = (entry: any) => {
    const paymentDate = new Date(entry.paymentDate);
    const cumulativePaid = paymentHistoryData?.payments
      ?.filter((p: any) => {
        const pDate = new Date(p.paymentDate);
        return pDate <= paymentDate && p.feeRecordId === entry.feeRecordId;
      })
      ?.reduce((sum: number, p: any) => sum + (p.amount || 0), 0) || 0;

    setSelectedHistoryEntry({
      ...entry,
      cumulativePaidAmount: cumulativePaid
    });
    setShowHistoryReceipt(true);
  };

  return (
    <div className="space-y-6">
      {/* Tab Navigation */}
      <div className={`rounded-xl border overflow-hidden ${cardCls}`}>
        <div className={`flex gap-1 p-2 border-b ${isDark ? 'border-gray-700 bg-gray-900/40' : 'border-gray-100'}`}>
          {[
            { id: 'overview', label: 'Overview', icon: <TrendingUp className="w-4 h-4" /> },
            { id: 'fees', label: 'Fee Details', icon: <DollarSign className="w-4 h-4" /> },
            { id: 'fines', label: 'Fines', icon: <FileText className="w-4 h-4" /> },
            { id: 'payment', label: 'Make Payment', icon: <CreditCard className="w-4 h-4" /> },
            { id: 'discounts', label: 'Discounts', icon: <Award className="w-4 h-4" /> },
            { id: 'history', label: 'History', icon: <Clock className="w-4 h-4" /> },
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold transition-all ${
                activeTab === tab.id
                  ? 'bg-blue-600 text-white shadow'
                  : isDark
                    ? 'text-gray-400 hover:text-white hover:bg-gray-700'
                    : 'text-gray-500 hover:text-gray-900 hover:bg-gray-100'
              }`}
            >
              {tab.icon}
              {tab.label}
            </button>
          ))}
        </div>

        <div className="p-6">
          {activeTab === 'overview' && (
            <OverviewTab
              stats={stats}
              finesStats={finesStats}
              filteredFees={filteredFees}
              selectedFees={selectedFees}
              selectedFeesTotal={selectedFeesTotal}
              isDark={isDark}
              cardCls={cardCls}
              textPrimary={textPrimary}
              textSecondary={textSecondary}
              onSelectAll={handleSelectAll}
              onClearSelection={handleClearSelection}
              onProceedToPayment={handleProceedToPayment}
            />
          )}

          {activeTab === 'fees' && (
            <FeesTab
              filteredFees={filteredFees}
              selectedFees={selectedFees}
              customAmounts={customAmounts}
              stats={stats}
              selectedYear={selectedYear}
              setSelectedYear={setSelectedYear}
              academicYears={academicYears}
              selectedCategory={selectedCategory}
              setSelectedCategory={setSelectedCategory}
              feeCategories={feeCategories}
              isDark={isDark}
              cardCls={cardCls}
              textPrimary={textPrimary}
              textSecondary={textSecondary}
              inputCls={inputCls}
              onFeeSelection={handleFeeSelection}
              onSelectAll={handleSelectAll}
              onClearSelection={handleClearSelection}
              onCustomAmountChange={handleCustomAmountChange}
              onProceedToPayment={handleProceedToPayment}
              getStatusColor={getStatusColor}
              getPriorityColor={getPriorityColor}
            />
          )}

          {activeTab === 'payment' && (
            <PaymentTab
              paymentMethods={paymentMethods}
              paymentMethod={paymentMethod}
              setPaymentMethod={setPaymentMethod}
              selectedFees={selectedFees}
              stats={stats}
              promoCode={promoCode}
              setPromoCode={setPromoCode}
              isProcessing={isProcessing}
              isDark={isDark}
              cardCls={cardCls}
              textPrimary={textPrimary}
              textSecondary={textSecondary}
              inputCls={inputCls}
              paymentGatewayEnabled={paymentGatewayEnabled}
              upiId={upiId}
              razorpayKeyId={razorpayKeyId}
              onPayment={() => handlePayment(stats)}
            />
          )}

          {activeTab === 'discounts' && (
            <DiscountsTab
              loadingDiscountHistory={loadingDiscountHistory}
              discountHistoryData={discountHistoryData}
              discountSearch={discountSearch}
              setDiscountSearch={setDiscountSearch}
              discountTypeFilter={discountTypeFilter}
              setDiscountTypeFilter={setDiscountTypeFilter}
              discountStatusFilter={discountStatusFilter}
              setDiscountStatusFilter={setDiscountStatusFilter}
              isDark={isDark}
              cardCls={cardCls}
              textPrimary={textPrimary}
              textSecondary={textSecondary}
              inputCls={inputCls}
            />
          )}

          {activeTab === 'history' && (
            <HistoryTab
              loadingPaymentHistory={loadingPaymentHistory}
              paymentHistoryData={paymentHistoryData}
              historySearch={historySearch}
              setHistorySearch={setHistorySearch}
              studentData={studentData}
              isDark={isDark}
              cardCls={cardCls}
              textPrimary={textPrimary}
              textSecondary={textSecondary}
              inputCls={inputCls}
              onViewReceipt={handleViewHistoryReceipt}
            />
          )}

          {activeTab === 'fines' && (
            <FinesTab
              fines={fines}
              finesStats={finesStats}
              loadingFines={loadingFines}
              isDark={isDark}
              cardCls={cardCls}
              textPrimary={textPrimary}
              textSecondary={textSecondary}
              inputCls={inputCls}
            />
          )}
        </div>
      </div>

      <ReceiptModals
        showReceipt={showReceipt}
        setShowReceipt={setShowReceipt}
        showDetailedReceipt={showDetailedReceipt}
        setShowDetailedReceipt={setShowDetailedReceipt}
        showHistoryReceipt={showHistoryReceipt}
        setShowHistoryReceipt={setShowHistoryReceipt}
        showUpiQr={showUpiQr}
        setShowUpiQr={setShowUpiQr}
        latestReceipt={latestReceipt}
        selectedHistoryEntry={selectedHistoryEntry}
        studentData={studentData}
        paymentMethod={paymentMethod}
        paymentMethods={paymentMethods}
        upiQrCode={upiQrCode}
        upiPaymentStatus={upiPaymentStatus}
        checkingPayment={checkingPayment}
        sharingQr={sharingQr}
        stats={stats}
        upiId={upiId}
        isDark={isDark}
        cardCls={cardCls}
        textPrimary={textPrimary}
        textSecondary={textSecondary}
        getCurrentUserName={getCurrentUserName}
        buildReceiptStudentData={buildReceiptStudentData}
        onUpiPaymentConfirmation={handleUpiConfirmation}
        onShareQrCode={handleShareQr}
        onViewReceipt={handleViewReceiptFromUpi}
        onDownloadReceipt={() => {
          const receiptNum = latestReceipt?.receiptNumber || 'Receipt';
          const filename = `Receipt_${receiptNum.replace(/[^a-zA-Z0-9]/g, '_')}.pdf`;
          PDFGenerator.generateFromElement('receipt-print', filename);
        }}
        onCopyUpiLink={handleCopyUpiLink}
      />
    </div>
  );
}
