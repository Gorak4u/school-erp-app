// @ts-nocheck
'use client';

import { useCallback, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useSchoolConfig } from '@/contexts/SchoolConfigContext';
import { FeeItem, ProcessedPayment, ReceiptData, PaymentMethod } from '../types';
import { PDFGenerator } from '@/utils/pdfGenerator';

export function usePaymentProcessing(
  studentId: string | undefined,
  studentData: any,
  selectedFees: string[],
  filteredFees: FeeItem[],
  customAmounts: {[key: string]: number},
  paymentMethod: string,
  promoCode: string,
  setIsProcessing: (value: boolean) => void,
  setLatestReceipt: (receipt: any) => void,
  setSelectedFees: (fees: string[]) => void,
  setCustomAmounts: (amounts: {[key: string]: number}) => void,
  setShowReceipt: (show: boolean) => void,
  setShowSuccessModal: (show: boolean) => void,
  setShowUpiQr: (show: boolean) => void,
  setUpiQrCode: (code: string) => void,
  setUpiPaymentStatus: (status: 'pending' | 'checking' | 'confirmed') => void,
  setCheckingPayment: (checking: boolean) => void,
  fetchFines: () => Promise<void>,
  onPaymentSuccess?: () => void
) {
  const { data: session } = useSession();
  const { getSetting, refresh } = useSchoolConfig();

  // Get payment settings
  const razorpayKeyId = getSetting('payment_gateway', 'api_key', '');
  const razorpayKeySecret = getSetting('payment_gateway', 'api_secret', '');
  const upiId = getSetting('payment_gateway', 'upi_id', '');
  const paymentGatewayEnabled = getSetting('payment_gateway', 'enabled', 'false') === 'true';

  // Refresh settings on mount
  useEffect(() => {
    refresh();
  }, [refresh]);

  // Get current user's full name
  const getCurrentUserName = () => {
    if (session?.user) {
      const firstName = session.user.firstName || session.user.name?.split(' ')[0] || '';
      const lastName = session.user.lastName || session.user.name?.split(' ')[1] || '';
      return firstName && lastName ? `${firstName} ${lastName}` : session.user.name || 'Unknown User';
    }
    return 'Unknown User';
  };

  const buildReceiptStudentData = (collectedByOverride?: string) => ({
    studentName: studentData?.name || studentData?.studentName || 'N/A',
    studentClass: [studentData?.class || studentData?.studentClass, studentData?.section].filter(Boolean).join(' ') || studentData?.class || studentData?.studentClass || 'N/A',
    admissionNo: studentData?.admissionNo || studentData?.rollNo || 'N/A',
    rollNo: studentData?.rollNo || studentData?.admissionNo || 'N/A',
    fatherName: studentData?.fatherName || studentData?.parentName || 'Parent',
    parentName: studentData?.parentName || studentData?.fatherName || 'Parent',
    collectedBy: collectedByOverride || getCurrentUserName()
  });

  const buildLatestReceiptPayload = (processedPayments: ProcessedPayment[], fines: any[]): ReceiptData => {
    const includedReceiptNumbers = processedPayments
      .map(({ paymentResult }) => paymentResult?.receiptNumber || paymentResult?.payment?.receiptNumber)
      .filter(Boolean);

    const firstProcessed = processedPayments[0];
    
    const regularFeeRecords = (studentData?.feeRecords || []).map((record: any) => {
      const processedMatch = processedPayments.find(({ fee }) => fee.id === record.id && !fee.isFine);
      if (!processedMatch) return record;

      const updatedPaidAmount = Number(processedMatch.paymentResult?.feeRecord?.paidAmount ?? record.paidAmount ?? 0);
      const updatedDiscount = Number(processedMatch.paymentResult?.feeRecord?.discount ?? record.discount ?? processedMatch.fee.discount ?? 0);
      const updatedPendingAmount = Number(
        processedMatch.paymentResult?.feeRecord?.pendingAmount
        ?? Math.max(0, Number(record.amount ?? processedMatch.fee.amount ?? 0) - updatedPaidAmount - updatedDiscount)
      );

      return {
        ...record,
        amount: Number(record.amount ?? processedMatch.fee.amount ?? 0),
        paidAmount: updatedPaidAmount,
        pendingAmount: updatedPendingAmount,
        discount: updatedDiscount,
        status: processedMatch.paymentResult?.feeRecord?.status || record.status,
        academicYear: record.academicYear || processedMatch.fee.academicYear,
        feeStructure: record.feeStructure || { name: processedMatch.fee.name, category: processedMatch.fee.category },
        receiptNumber: processedMatch.paymentResult?.receiptNumber || processedMatch.paymentResult?.payment?.receiptNumber || record.receiptNumber,
      };
    });

    const finesRecords = fines.map((fine: any) => {
      const processedMatch = processedPayments.find(({ fee }) => fee.isFine && fee.fineId === fine.id);
      if (!processedMatch) return fine;

      const updatedPaidAmount = Number(processedMatch.paymentResult?.payment?.paidAmount ?? fine.paidAmount ?? 0);
      const updatedPendingAmount = Number(
        processedMatch.paymentResult?.payment?.pendingAmount
        ?? Math.max(0, Number(fine.amount) - updatedPaidAmount - fine.waivedAmount)
      );

      return {
        ...fine,
        amount: Number(fine.amount),
        paidAmount: updatedPaidAmount,
        pendingAmount: updatedPendingAmount,
        waivedAmount: fine.waivedAmount || 0,
        status: updatedPendingAmount > 0 ? 'partial' : 'paid',
        receiptNumber: processedMatch.paymentResult?.receiptNumber || processedMatch.paymentResult?.payment?.receiptNumber || fine.receiptNumber,
        isFine: true,
        fineNumber: fine.fineNumber,
        description: fine.description,
        category: 'fines',
        academicYear: '2025-26',
        feeStructure: { name: `Fine: ${fine.description}`, category: 'fines' },
      };
    });

    const statementRecords = [...regularFeeRecords, ...finesRecords];

    return {
      studentData: buildReceiptStudentData(firstProcessed?.paymentResult?.payment?.collectedBy),
      paymentData: {
        currentYearFees: processedPayments.map(({ fee, amount, paymentResult }) => ({
          id: paymentResult?.payment?.id || fee.id,
          feeRecordId: fee.id,
          name: fee.name,
          category: fee.category,
          academicYear: fee.academicYear,
          totalAmount: fee.amount,
          amountPaid: amount,
          paidAmount: amount,
          discount: fee.discount || 0,
          balance: Number(paymentResult?.feeRecord?.pendingAmount ?? Math.max(0, fee.amount - fee.paidAmount - (fee.discount || 0) - amount)),
          status: paymentResult?.feeRecord?.status || 'partial',
          receiptNumber: paymentResult?.receiptNumber || paymentResult?.payment?.receiptNumber || '',
          transactionId: paymentResult?.payment?.transactionId || '',
          remarks: paymentResult?.payment?.remarks || '',
          paymentDate: paymentResult?.payment?.paymentDate || paymentResult?.feeRecord?.paidDate || new Date().toISOString(),
          isFine: fee.isFine || false,
          fineNumber: fee.fineNumber || '',
        })),
        statementRecords,
        includedReceiptNumbers,
      },
      receiptNumber: includedReceiptNumbers[0] || `RCPT-${Date.now()}`,
      paymentDate: firstProcessed?.paymentResult?.payment?.paymentDate || firstProcessed?.paymentResult?.feeRecord?.paidDate || new Date().toISOString(),
      paymentMethod: firstProcessed?.paymentResult?.payment?.paymentMethod || paymentMethod,
    };
  };

  // Send payment confirmation email with PDF receipt
  const sendPaymentConfirmationEmail = async (receiptData: ReceiptData, paymentMethod: string) => {
    try {
      const pdfBlob = await PDFGenerator.generateReceiptPDF(receiptData);
      const pdfBase64 = await new Promise((resolve) => {
        const reader = new FileReader();
        reader.onloadend = () => resolve(reader.result);
        reader.readAsDataURL(pdfBlob);
      });

      const emailContent = {
        subject: `Payment Confirmation - ${studentData?.name || studentData?.studentName} - ₹${receiptData.paymentData?.currentYearFees?.reduce((sum: number, item: any) => sum + Number(item.amountPaid || item.paidAmount || 0), 0).toLocaleString()}`,
        body: `
Dear Parent/Guardian,

We are pleased to confirm that we have received your payment for the school fees.

Student: ${studentData?.name || studentData?.studentName}
Class: ${studentData?.class || studentData?.studentClass}
Amount Paid: ₹${receiptData.paymentData?.currentYearFees?.reduce((sum: number, item: any) => sum + Number(item.amountPaid || item.paidAmount || 0), 0).toLocaleString()}
Payment Method: ${paymentMethod.charAt(0).toUpperCase() + paymentMethod.slice(1)}
Payment Date: ${new Date().toLocaleDateString()}
Receipt Number: ${receiptData.receiptNumber}

The detailed receipt is attached to this email for your records.

Thank you for your prompt payment. If you have any questions, please feel free to contact the school office.

Best regards,
${getCurrentUserName()}
School Administration
        `,
        attachments: [{
          filename: `Receipt_${receiptData.receiptNumber}.pdf`,
          content: (pdfBase64 as string).split(',')[1],
          encoding: 'base64'
        }]
      };

      const emailRecipients = [
        studentData?.fatherEmail || studentData?.parentEmail,
        studentData?.motherEmail,
        studentData?.email,
        session?.user?.email
      ].filter(Boolean);

      if (emailRecipients.length === 0) {
        console.warn('No email recipients found for payment confirmation');
        return;
      }

      const emailPromises = emailRecipients.map(recipient => {
        const totalSize = emailContent.attachments?.reduce((total: number, att: any) => {
          const base64Size = att.content ? att.content.length * 0.75 : 0;
          return total + base64Size;
        }, 0) || 0;

        if (emailContent.attachments?.length > 0) {
          console.log(`Email attachment size for ${recipient}: ${Math.round(totalSize / 1024 / 1024)}MB, ${emailContent.attachments.length} files`);
        }

        if (totalSize > 8 * 1024 * 1024) {
          console.warn(`Email attachments too large (${Math.round(totalSize / 1024 / 1024)}MB), sending without attachments to:`, recipient);
          
          return fetch('/api/school-email', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              to: recipient,
              subject: emailContent.subject + (emailContent.attachments?.length ? ' (Large attachments omitted)' : ''),
              html: emailContent.body + '<br><br><p style="color: #666; font-size: 12px;">Note: Receipt PDF was too large to attach. Please download it from the system.</p>'
            })
          });
        }

        console.log(`Sending email with attachments (${Math.round(totalSize / 1024 / 1024)}MB) to:`, recipient);
        return fetch('/api/school-email', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            to: recipient,
            subject: emailContent.subject,
            html: emailContent.body,
            attachments: emailContent.attachments
          })
        });
      });

      Promise.all(emailPromises).then(() => {
        console.log('Payment confirmation emails sent successfully');
      }).catch(error => {
        console.error('Error sending payment confirmation emails:', error);
      });

    } catch (error) {
      console.error('Error generating payment confirmation email:', error);
    }
  };

  const handleCashPayment = async (stats: any, fines: any[]) => {
    setIsProcessing(true);
    
    if ((window as any).toast) {
      (window as any).toast({
        type: 'info',
        title: 'Processing Payment',
        message: `Processing ₹${stats.selectedFeesTotal.toLocaleString()} payment via Cash`,
        duration: 3000
      });
    }

    try {
      const { paymentsApi } = await import('@/lib/apiClient');
      const processedPayments: ProcessedPayment[] = [];

      for (const feeId of selectedFees) {
        const fee = filteredFees.find(f => f.id === feeId);
        if (!fee || fee.status === 'paid') continue;
        const amount = customAmounts[feeId] || (fee.amount - fee.paidAmount - (fee.discount || 0) - (fee.waivedAmount || 0));
        
        let paymentResult;
        if (fee.isFine) {
          const response = await fetch(`/api/fines/${fee.fineId}/pay`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              amount,
              paymentMethod: 'cash',
              remarks: promoCode ? `Promo: ${promoCode}` : 'Cash payment',
            }),
          });
          
          const data = await response.json();
          if (!data.success) {
            throw new Error(data.error || 'Failed to process fine payment');
          }
          
          paymentResult = {
            success: true,
            receiptNumber: data.receiptNumber,
            payment: data.payment,
          };
        } else {
          paymentResult = await paymentsApi.process({
            feeRecordId: feeId,
            amount,
            paymentMethod: 'cash',
            collectedBy: getCurrentUserName(),
            remarks: promoCode ? `Promo: ${promoCode}` : undefined,
          });
        }
        
        processedPayments.push({ fee, amount, paymentResult });
      }

      if (processedPayments.length === 0) {
        throw new Error('No unpaid fee selected for payment');
      }

      const receiptPayload = buildLatestReceiptPayload(processedPayments, fines);
      setLatestReceipt(receiptPayload);
      setSelectedFees([]);
      setCustomAmounts({});

      // Show success modal instead of toast
      setShowSuccessModal(true);
      
      if (onPaymentSuccess) {
        onPaymentSuccess();
      }
      
      fetchFines();
      sendPaymentConfirmationEmail(receiptPayload, 'cash');
      
    } catch (err: any) {
      if ((window as any).toast) {
        (window as any).toast({ type: 'error', title: 'Payment Failed', message: err.message || 'Something went wrong' });
      }
    } finally {
      setIsProcessing(false);
    }
  };

  const handleUpiPayment = async (stats: any) => {
    setIsProcessing(true);
    
    try {
      if (!paymentGatewayEnabled || !upiId) {
        throw new Error('UPI payment is not configured. Please configure UPI ID in settings.');
      }
      
      const upiAmount = stats.selectedFeesTotal;
      const upiUrl = `upi://pay?pa=${upiId}&pn=${encodeURIComponent(studentData?.name || studentData?.studentName || 'Student')}&am=${upiAmount}&cu=INR&tn=${encodeURIComponent('Fee Payment')}`;
      
      try {
        const QRCode = await import('qrcode');
        const qrDataUrl = await QRCode.toDataURL(upiUrl, {
          width: 256,
          margin: 2,
          color: { dark: '#000000', light: '#FFFFFF' }
        });
        setUpiQrCode(qrDataUrl);
        setShowUpiQr(true);
        
        if ((window as any).toast) {
          (window as any).toast({
            type: 'info',
            title: 'UPI QR Code Generated',
            message: 'Scan the QR code with any UPI app to complete payment.',
            duration: 5000
          });
        }
      } catch (qrError) {
        throw new Error('Failed to generate UPI QR code. Please try again.');
      }
      
      setUpiPaymentStatus('pending');
      
    } catch (err: any) {
      if ((window as any).toast) {
        (window as any).toast({ type: 'error', title: 'Payment Failed', message: err.message || 'Something went wrong' });
      }
    } finally {
      setIsProcessing(false);
    }
  };

  const handleUpiPaymentConfirmation = async (stats: any, fines: any[]) => {
    // Validate inputs before processing any payments
    if (!stats || typeof stats.selectedFeesTotal !== 'number') {
      if ((window as any).toast) {
        (window as any).toast({ 
          type: 'error', 
          title: 'Payment Failed', 
          message: 'Invalid payment statistics. Please refresh and try again.' 
        });
      }
      return;
    }
    
    // Ensure fines is an array (can be empty but not undefined)
    const safeFines = Array.isArray(fines) ? fines : [];
    
    setCheckingPayment(true);
    setUpiPaymentStatus('checking');
    
    try {
      const { paymentsApi } = await import('@/lib/apiClient');
      const processedPayments: ProcessedPayment[] = [];

      for (const feeId of selectedFees) {
        const fee = filteredFees.find(f => f.id === feeId);
        if (!fee || fee.status === 'paid') continue;
        const amount = customAmounts[feeId] || (fee.amount - fee.paidAmount - (fee.discount || 0) - (fee.waivedAmount || 0));
        
        let paymentResult;
        if (fee.isFine) {
          const response = await fetch(`/api/fines/${fee.fineId}/pay`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              amount,
              paymentMethod: 'upi',
              remarks: 'UPI payment - QR code',
            }),
          });
          
          const data = await response.json();
          if (!data.success) {
            throw new Error(data.error || 'Failed to process fine payment');
          }
          
          paymentResult = {
            success: true,
            receiptNumber: data.receiptNumber,
            payment: data.payment,
          };
        } else {
          paymentResult = await paymentsApi.process({
            feeRecordId: feeId,
            amount,
            paymentMethod: 'upi',
            collectedBy: getCurrentUserName(),
            remarks: 'UPI payment - QR code',
          });
        }
        
        processedPayments.push({ fee, amount, paymentResult });
      }

      if (processedPayments.length === 0) {
        throw new Error('No unpaid fee selected for payment');
      }

      const receiptPayload = buildLatestReceiptPayload(processedPayments, safeFines);
      setLatestReceipt(receiptPayload);
      setSelectedFees([]);
      setCustomAmounts({});
      setUpiPaymentStatus('confirmed');

      // Show success modal instead of toast
      setShowSuccessModal(true);
      
      if (onPaymentSuccess) {
        onPaymentSuccess();
      }
      
      fetchFines();
      sendPaymentConfirmationEmail(receiptPayload, 'upi');
      
      setTimeout(() => {
        setShowUpiQr(false);
      }, 2000);
      
    } catch (err: any) {
      setUpiPaymentStatus('pending');
      if ((window as any).toast) {
        (window as any).toast({ 
          type: 'error', 
          title: 'Payment Confirmation Failed', 
          message: err.message || 'Failed to confirm UPI payment' 
        });
      }
    } finally {
      setCheckingPayment(false);
    }
  };

  const handleShareQrCode = async (stats: any) => {
    setSharingQr(true);
    
    try {
      const emailContent = {
        subject: `UPI Payment Request - ${studentData?.name || studentData?.studentName} - ₹${stats.selectedFeesTotal.toLocaleString()}`,
        body: `
Dear Parent/Guardian,

Please find the UPI QR code below for the fee payment of ₹${stats.selectedFeesTotal.toLocaleString()}.

Student: ${studentData?.name || studentData?.studentName}
Amount: ₹${stats.selectedFeesTotal.toLocaleString()}
UPI ID: ${upiId}

Instructions:
1. Open any UPI app (PhonePe, PayTM, Google Pay, etc.)
2. Scan the QR code or click the UPI link below
3. Complete the payment
4. Share the payment screenshot with the school for confirmation

UPI Payment Link: upi://pay?pa=${upiId}&pn=${encodeURIComponent(studentData?.name || studentData?.studentName || 'Student')}&am=${stats.selectedFeesTotal}&cu=INR&tn=${encodeURIComponent('Fee Payment')}

The QR code is attached to this email for your convenience.

Best regards,
${getCurrentUserName()}
School Administration
        `,
        attachments: [{
          filename: `UPI_QR_${studentData?.name || studentData?.studentName}_${Date.now()}.png`,
          content: upiQrCode.split(',')[1],
          encoding: 'base64'
        }]
      };

      const emailRecipients = [
        studentData?.fatherEmail || studentData?.parentEmail,
        studentData?.motherEmail,
        session?.user?.email
      ].filter(Boolean);

      const attachmentPromises = emailRecipients.map(recipient => {
        const totalSize = emailContent.attachments.reduce((total: number, att: any) => {
          const base64Size = att.content ? att.content.length * 0.75 : 0;
          return total + base64Size;
        }, 0);

        if (totalSize > 8 * 1024 * 1024) {
          console.warn(`QR code attachments too large, sending without attachments to:`, recipient);
          
          return fetch('/api/school-email', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              to: recipient,
              subject: emailContent.subject + ' (QR code omitted)',
              html: emailContent.body.replace(/\n/g, '<br>') + '<br><br><p style="color: #666; font-size: 12px;">Note: QR code was too large to attach. Please generate it from the system.</p>'
            })
          });
        }

        return fetch('/api/school-email', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            to: recipient,
            subject: emailContent.subject,
            html: emailContent.body.replace(/\n/g, '<br>'),
            attachments: emailContent.attachments
          })
        });
      });
      
      await Promise.all(attachmentPromises);
      
    } catch (error) {
      console.error('Error sharing QR code:', error);
      if ((window as any).toast) {
        (window as any).toast({
          type: 'error',
          title: 'Failed to Share',
          message: 'Could not share QR code via email. Please try again.',
          duration: 5000
        });
      }
    } finally {
      setSharingQr(false);
    }
  };

  const handleRazorpayPayment = async (stats: any) => {
    setIsProcessing(true);
    
    try {
      if (!paymentGatewayEnabled || !razorpayKeyId) {
        throw new Error('Online payment is not configured. Please configure Razorpay in settings.');
      }
      
      const orderResponse = await fetch('/api/razorpay/create-order', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          amount: stats.selectedFeesTotal,
          currency: 'INR',
          receipt: `fee_receipt_${studentId}_${Date.now()}`,
          notes: {
            studentId,
            studentName: studentData?.name || studentData?.studentName,
            feeIds: selectedFees,
            paymentMethod,
          }
        })
      });

      const orderData = await orderResponse.json();
      
      if (!orderData.success) {
        throw new Error(orderData.error || 'Failed to create payment order');
      }

      const script = document.createElement('script');
      script.src = 'https://checkout.razorpay.com/v1/checkout.js';
      script.async = true;
      document.body.appendChild(script);
      
      script.onload = () => {
        const options = {
          key: razorpayKeyId,
          amount: orderData.order.amount,
          currency: orderData.order.currency,
          name: studentData?.name || studentData?.studentName || 'Student Fee Payment',
          description: `Fee payment for ${selectedFees.length} fees`,
          order_id: orderData.order.id,
          image: '/favicon.ico',
          prefill: {
            name: studentData?.name || studentData?.studentName || '',
            email: studentData?.email || '',
            contact: studentData?.phone || ''
          },
          theme: { color: '#3399cc' },
          modal: {
            ondismiss: function() {
              setIsProcessing(false);
              if ((window as any).toast) {
                (window as any).toast({
                  type: 'info',
                  title: 'Payment Cancelled',
                  message: 'Payment was cancelled by user.',
                  duration: 3000
                });
              }
            },
            escape: true,
            handleback: true,
          }
        };

        const rzp = new (window as any).Razorpay(options);
        
        rzp.on('payment.success', async (response: any) => {
          try {
            const verificationResponse = await fetch('/api/razorpay/verify-payment', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                razorpay_order_id: response.razorpay_order_id,
                razorpay_payment_id: response.razorpay_payment_id,
                razorpay_signature: response.razorpay_signature,
                feeIds: selectedFees,
                studentId,
                studentData,
                customAmounts,
              })
            });

            const verificationData = await verificationResponse.json();
            
            if (verificationData.success && verificationData.verified) {
              const receiptPayload = verificationData.receipt;
              setLatestReceipt(receiptPayload);
              setSelectedFees([]);
              setCustomAmounts({});

              // Show success modal instead of toast
              setShowSuccessModal(true);
              
              if (onPaymentSuccess) {
                onPaymentSuccess();
              }
              
              sendPaymentConfirmationEmail(receiptPayload, paymentMethod);
            } else {
              throw new Error('Payment verification failed');
            }
            
          } catch (error: any) {
            if ((window as any).toast) {
              (window as any).toast({
                type: 'error',
                title: 'Payment Processing Failed',
                message: 'Payment was successful but verification failed. Please contact support.',
                duration: 5000
              });
            }
          } finally {
            setIsProcessing(false);
          }
        });
        
        rzp.on('payment.failed', (response: any) => {
          setIsProcessing(false);
          if ((window as any).toast) {
            (window as any).toast({
              type: 'error',
              title: 'Payment Failed',
              message: `Payment failed: ${response.error.description || 'Unknown error'}`,
              duration: 5000
            });
          }
        });

        rzp.open();
      };
      
      script.onerror = () => {
        throw new Error('Failed to load Razorpay. Please try again.');
      };
      
    } catch (orderError: any) {
      if ((window as any).toast) {
        (window as any).toast({ type: 'error', title: 'Payment Failed', message: orderError.message || 'Something went wrong' });
      }
      setIsProcessing(false);
    }
  };

  const handlePayment = async (stats: any) => {
    if (paymentMethod === 'cash') {
      await handleCashPayment(stats, []);
    } else if (paymentMethod === 'upi') {
      await handleUpiPayment(stats);
    } else {
      await handleRazorpayPayment(stats);
    }
  };

  return {
    getCurrentUserName,
    buildReceiptStudentData,
    buildLatestReceiptPayload,
    sendPaymentConfirmationEmail,
    handlePayment,
    handleUpiPaymentConfirmation,
    handleShareQrCode,
    paymentGatewayEnabled,
    upiId,
    razorpayKeyId,
    getSetting,
  };
}
