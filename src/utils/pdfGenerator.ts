import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';

export interface ReceiptData {
  receiptNumber: string;
  paymentDate: string;
  paymentMethod: string;
  studentData: Record<string, unknown>;
  paymentData: Record<string, unknown>;
}

export class PDFGenerator {
  private static showToast(payload: { type: string; title: string; message: string; duration: number }) {
    if ((window as any).toast) {
      (window as any).toast(payload);
    }
  }

  private static getElement(elementId: string): HTMLElement {
    const element = document.getElementById(elementId);
    if (!element) {
      throw new Error('Element not found');
    }
    return element;
  }

  private static async captureElementCanvas(elementId: string): Promise<HTMLCanvasElement> {
    const element = this.getElement(elementId);
    
    // Extract receipt data from the original element (like ID cards do)
    const receiptData = this.extractReceiptData(element);
    
    // Create PURE HTML with inline styles (exactly like ID cards)
    const cleanHTML = this.createPureReceiptHTML(receiptData);
    
    // Create temporary container (exactly like ID cards)
    const tempDiv = document.createElement('div');
    tempDiv.innerHTML = cleanHTML;
    tempDiv.style.position = 'absolute';
    tempDiv.style.left = '-9999px';
    tempDiv.style.top = '-9999px';
    tempDiv.style.width = '800px';
    tempDiv.style.background = '#ffffff';
    document.body.appendChild(tempDiv);

    try {
      // Wait for content to render
      await new Promise(resolve => setTimeout(resolve, 100));
      
      // Capture with simple settings (exactly like ID cards)
      return await html2canvas(tempDiv, {
        scale: 2,
        backgroundColor: '#ffffff',
        useCORS: true,
        allowTaint: true,
        width: 800,
        height: tempDiv.scrollHeight,
        logging: false
      });
    } finally {
      // Clean up
      if (tempDiv.parentNode) {
        tempDiv.parentNode.removeChild(tempDiv);
      }
    }
  }

  private static extractReceiptData(element: HTMLElement): Record<string, unknown> {
    // Extract data from the original receipt element
    const data: Record<string, unknown> = {
      schoolName: '',
      receiptNumber: '',
      paymentDate: '',
      paymentMethod: '',
      studentName: '',
      admissionNo: '',
      className: '',
      fatherName: '',
      feeItems: [],
      totalAmount: 0
    };

    // Try to extract data from common selectors
    const titleElement = element.querySelector('h1, .title, .school-name');
    if (titleElement) data.schoolName = titleElement.textContent || '';

    const receiptNumberElement = element.querySelector('.receipt-number, .reference, [data-receipt]');
    if (receiptNumberElement) data.receiptNumber = receiptNumberElement.textContent || '';

    const dateElement = element.querySelector('.date, .payment-date, [data-date]');
    if (dateElement) data.paymentDate = dateElement.textContent || '';

    const methodElement = element.querySelector('.method, .payment-method, [data-method]');
    if (methodElement) data.paymentMethod = methodElement.textContent || '';

    const studentNameElement = element.querySelector('.student-name, .name, [data-student]');
    if (studentNameElement) data.studentName = studentNameElement.textContent || '';

    const admissionElement = element.querySelector('.admission-no, .admission, [data-admission]');
    if (admissionElement) data.admissionNo = admissionElement.textContent || '';

    const classElement = element.querySelector('.class, .grade, [data-class]');
    if (classElement) data.className = classElement.textContent || '';

    const fatherElement = element.querySelector('.father-name, .parent-name, [data-father]');
    if (fatherElement) data.fatherName = fatherElement.textContent || '';

    // Extract fee items from table rows
    const tableRows = element.querySelectorAll('table tr, .fee-row, .payment-row');
    tableRows.forEach((row, index) => {
      if (index === 0) return; // Skip header
      
      const cells = row.querySelectorAll('td, .fee-cell, .payment-cell');
      if (cells.length >= 2) {
        (data.feeItems as any).push({
          description: cells[0].textContent || 'Fee Payment',
          amount: this.extractAmount(cells[1].textContent),
          paid: this.extractAmount(cells[2]?.textContent || cells[1].textContent),
          balance: this.extractAmount(cells[3]?.textContent || '0')
        });
      }
    });

    // Calculate total
    data.totalAmount = (data.feeItems as any).reduce((sum: number, item: Record<string, unknown>) => sum + ((item.paid as number) || 0), 0);

    return data;
  }

  private static extractAmount(text: string | null | undefined): number {
    if (!text) return 0;
    const match = text.toString().match(/[\d,]+/);
    return match ? parseInt(match[0].replace(/,/g, '')) : 0;
  }

  private static createPureReceiptHTML(data: Record<string, unknown>): string {
    // Create PURE HTML with inline styles (exactly like ID cards)
    return `
      <div style="width: 800px; background: #ffffff; color: #000000; padding: 40px; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6;">
        <!-- Header Section -->
        <div style="text-align: center; margin-bottom: 30px; padding-bottom: 20px; border-bottom: 2px solid #e5e7eb;">
          <div style="font-size: 24px; font-weight: bold; color: #000000; margin-bottom: 10px;">${data.schoolName || 'School Fee Receipt'}</div>
          <div style="font-size: 14px; color: #6b7280; margin-bottom: 5px;">Fee Statement Receipt</div>
          <div style="font-size: 14px; color: #6b7280; margin-bottom: 5px;">Receipt: ${data.receiptNumber}</div>
          <div style="font-size: 14px; color: #6b7280; margin-bottom: 5px;">Date: ${data.paymentDate}</div>
        </div>
        
        <!-- Student Information -->
        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 30px; margin-bottom: 30px;">
          <div style="background: #f9fafb; padding: 20px; border-radius: 8px; border: 1px solid #e5e7eb;">
            <div style="font-size: 16px; font-weight: bold; color: #000000; margin-bottom: 15px; padding-bottom: 10px; border-bottom: 1px solid #e5e7eb;">Student Information</div>
            <div style="display: flex; justify-content: space-between; margin-bottom: 8px; font-size: 14px;">
              <span style="color: #6b7280; font-weight: 500;">Name:</span>
              <span style="color: #000000; font-weight: 600;">${data.studentName || 'N/A'}</span>
            </div>
            <div style="display: flex; justify-content: space-between; margin-bottom: 8px; font-size: 14px;">
              <span style="color: #6b7280; font-weight: 500;">Admission No:</span>
              <span style="color: #000000; font-weight: 600;">${data.admissionNo || 'N/A'}</span>
            </div>
            <div style="display: flex; justify-content: space-between; margin-bottom: 8px; font-size: 14px;">
              <span style="color: #6b7280; font-weight: 500;">Class:</span>
              <span style="color: #000000; font-weight: 600;">${data.className || 'N/A'}</span>
            </div>
            <div style="display: flex; justify-content: space-between; margin-bottom: 8px; font-size: 14px;">
              <span style="color: #6b7280; font-weight: 500;">Father Name:</span>
              <span style="color: #000000; font-weight: 600;">${data.fatherName || 'N/A'}</span>
            </div>
          </div>
          
          <div style="background: #f9fafb; padding: 20px; border-radius: 8px; border: 1px solid #e5e7eb;">
            <div style="font-size: 16px; font-weight: bold; color: #000000; margin-bottom: 15px; padding-bottom: 10px; border-bottom: 1px solid #e5e7eb;">Payment Information</div>
            <div style="display: flex; justify-content: space-between; margin-bottom: 8px; font-size: 14px;">
              <span style="color: #6b7280; font-weight: 500;">Receipt No:</span>
              <span style="color: #000000; font-weight: 600;">${data.receiptNumber}</span>
            </div>
            <div style="display: flex; justify-content: space-between; margin-bottom: 8px; font-size: 14px;">
              <span style="color: #6b7280; font-weight: 500;">Payment Date:</span>
              <span style="color: #000000; font-weight: 600;">${data.paymentDate}</span>
            </div>
            <div style="display: flex; justify-content: space-between; margin-bottom: 8px; font-size: 14px;">
              <span style="color: #6b7280; font-weight: 500;">Payment Method:</span>
              <span style="color: #000000; font-weight: 600;">${data.paymentMethod}</span>
            </div>
            <div style="display: flex; justify-content: space-between; margin-bottom: 8px; font-size: 14px;">
              <span style="color: #6b7280; font-weight: 500;">Status:</span>
              <span style="color: #059669; font-weight: 600;">Paid</span>
            </div>
          </div>
        </div>
        
        <!-- Fee Table -->
        <table style="width: 100%; border-collapse: collapse; margin-bottom: 30px;">
          <thead>
            <tr>
              <th style="background: #f3f4f6; color: #000000; font-weight: 600; padding: 12px; text-align: left; border: 1px solid #e5e7eb;">Description</th>
              <th style="background: #f3f4f6; color: #000000; font-weight: 600; padding: 12px; text-align: left; border: 1px solid #e5e7eb;">Amount</th>
              <th style="background: #f3f4f6; color: #000000; font-weight: 600; padding: 12px; text-align: left; border: 1px solid #e5e7eb;">Paid</th>
              <th style="background: #f3f4f6; color: #000000; font-weight: 600; padding: 12px; text-align: left; border: 1px solid #e5e7eb;">Balance</th>
            </tr>
          </thead>
          <tbody>
            ${(data.feeItems as any)?.map((item: Record<string, unknown>) => `
              <tr>
                <td style="padding: 12px; border: 1px solid #e5e7eb; color: #000000;">${item.description || 'Fee Payment'}</td>
                <td style="padding: 12px; border: 1px solid #e5e7eb; color: #000000;">₹${Number(item.amount || 0).toLocaleString('en-IN')}</td>
                <td style="padding: 12px; border: 1px solid #e5e7eb; color: #000000;">₹${Number(item.paid || 0).toLocaleString('en-IN')}</td>
                <td style="padding: 12px; border: 1px solid #e5e7eb; color: #000000;">₹${Number(item.balance || 0).toLocaleString('en-IN')}</td>
              </tr>
            `).join('') || '<tr><td colspan="4" style="padding: 12px; border: 1px solid #e5e7eb; color: #000000;">No fee details available</td></tr>'}
          </tbody>
        </table>
        
        <!-- Total -->
        <div style="text-align: right; font-size: 18px; font-weight: bold; color: #000000; margin-top: 20px; padding-top: 20px; border-top: 2px solid #e5e7eb;">
          Total Amount Paid: ₹${Number(data.totalAmount || 0).toLocaleString('en-IN')}
        </div>
        
        <!-- Footer -->
        <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #e5e7eb; text-align: center; color: #6b7280; font-size: 12px;">
          <div>This is a computer-generated receipt and does not require signature</div>
          <div>Generated on ${new Date().toLocaleDateString('en-IN')}</div>
        </div>
      </div>
    `;
  }

  private static async canvasToBlob(canvas: HTMLCanvasElement): Promise<Blob> {
    const blob = await new Promise<Blob | null>((resolve) => {
      canvas.toBlob(resolve, 'image/png');
    });
    if (!blob) {
      throw new Error('Failed to create image blob');
    }
    return blob;
  }

  private static downloadBlob(blob: Blob, filename: string) {
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  }

  /**
   * Generate PDF receipt and return as blob (for email attachments)
   */
  static async generateReceiptPDF(receiptData: ReceiptData): Promise<Blob> {
    try {
      // Create a temporary div to render the receipt
      const tempDiv = document.createElement('div');
      tempDiv.style.position = 'absolute';
      tempDiv.style.left = '-9999px';
      tempDiv.style.top = '0';
      tempDiv.style.width = '210mm'; // A4 width
      tempDiv.style.backgroundColor = '#ffffff';
      tempDiv.style.padding = '20px';
      tempDiv.style.fontFamily = 'Arial, sans-serif';

      // Generate receipt HTML (similar to ID card approach)
      const receiptHTML = this.createReceiptHTML(receiptData);
      tempDiv.innerHTML = receiptHTML;
      document.body.appendChild(tempDiv);

      // Capture as canvas
      const canvas = await html2canvas(tempDiv, {
        scale: 2,
        useCORS: true,
        allowTaint: true,
        backgroundColor: '#ffffff',
        width: 794, // A4 width in pixels at 96 DPI
        height: 1123 // A4 height in pixels at 96 DPI
      });

      // Remove temporary div
      document.body.removeChild(tempDiv);

      // Create PDF
      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: 'a4'
      });

      const imgWidth = 210; // A4 width in mm
      const imgHeight = (canvas.height * imgWidth) / canvas.width;

      pdf.addImage(imgData, 'PNG', 0, 0, imgWidth, imgHeight);

      // Return as blob
      return pdf.output('blob');

    } catch (error) {
      console.error('PDF receipt generation failed:', error);
      throw error;
    }
  }

  /**
   * Create receipt HTML string
   */
  private static createReceiptHTML(receiptData: ReceiptData): string {
    const { receiptNumber, paymentDate, paymentMethod, studentData, paymentData } = receiptData;
    
    const totalAmount = (paymentData.currentYearFees as any)?.reduce((sum: number, item: Record<string, unknown>) => 
      sum + Number((item.amountPaid as unknown) || (item.paidAmount as unknown) || 0), 0) || 0;

    return `
      <div style="width: 100%; padding: 20px; font-family: Arial, sans-serif;">
        <div style="text-align: center; margin-bottom: 30px;">
          <h1 style="margin: 0; color: #1f2937; font-size: 24px;">Payment Receipt</h1>
          <p style="margin: 5px 0; color: #6b7280; font-size: 14px;">Receipt #: ${receiptNumber}</p>
        </div>
        
        <div style="margin-bottom: 30px;">
          <h2 style="margin: 0 0 15px 0; color: #374151; font-size: 18px; border-bottom: 2px solid #e5e7eb; padding-bottom: 5px;">Student Details</h2>
          <p style="margin: 5px 0; color: #4b5563;"><strong>Name:</strong> ${studentData?.studentName || studentData?.name || 'N/A'}</p>
          <p style="margin: 5px 0; color: #4b5563;"><strong>Class:</strong> ${studentData?.studentClass || studentData?.class || 'N/A'}</p>
          <p style="margin: 5px 0; color: #4b5563;"><strong>Admission No:</strong> ${studentData?.admissionNo || studentData?.rollNo || 'N/A'}</p>
        </div>
        
        <div style="margin-bottom: 30px;">
          <h2 style="margin: 0 0 15px 0; color: #374151; font-size: 18px; border-bottom: 2px solid #e5e7eb; padding-bottom: 5px;">Payment Details</h2>
          <p style="margin: 5px 0; color: #4b5563;"><strong>Date:</strong> ${new Date(paymentDate).toLocaleDateString()}</p>
          <p style="margin: 5px 0; color: #4b5563;"><strong>Method:</strong> ${paymentMethod.charAt(0).toUpperCase() + paymentMethod.slice(1)}</p>
          <p style="margin: 5px 0; color: #4b5563;"><strong>Total Amount:</strong> ₹${totalAmount.toLocaleString()}</p>
        </div>
        
        <div style="margin-bottom: 30px;">
          <h2 style="margin: 0 0 15px 0; color: #374151; font-size: 18px; border-bottom: 2px solid #e5e7eb; padding-bottom: 5px;">Fee Breakdown</h2>
          <table style="width: 100%; border-collapse: collapse;">
            <thead>
              <tr style="background-color: #f3f4f6;">
                <th style="padding: 10px; text-align: left; border: 1px solid #d1d5db; color: #374151;">Fee Name</th>
                <th style="padding: 10px; text-align: right; border: 1px solid #d1d5db; color: #374151;">Amount</th>
              </tr>
            </thead>
            <tbody>
              ${(paymentData.currentYearFees as any)?.map((fee: Record<string, unknown>) => `
                <tr>
                  <td style="padding: 8px; border: 1px solid #d1d5db; color: #4b5563;">${fee.feeName || fee.name || 'Fee'}</td>
                  <td style="padding: 8px; text-align: right; border: 1px solid #d1d5db; color: #4b5563;">₹${Number(fee.amountPaid || fee.paidAmount || 0).toLocaleString()}</td>
                </tr>
              `).join('') || ''}
              <tr style="background-color: #f3f4f6; font-weight: bold;">
                <td style="padding: 10px; border: 1px solid #d1d5db; color: #374151;">Total</td>
                <td style="padding: 10px; text-align: right; border: 1px solid #d1d5db; color: #374151;">₹${totalAmount.toLocaleString()}</td>
              </tr>
            </tbody>
          </table>
        </div>
        
        <div style="text-align: center; margin-top: 40px; padding-top: 20px; border-top: 2px solid #e5e7eb;">
          <p style="margin: 5px 0; color: #6b7280; font-size: 12px;">This is a computer-generated receipt</p>
          <p style="margin: 5px 0; color: #6b7280; font-size: 12px;">Generated on ${new Date().toLocaleDateString()} at ${new Date().toLocaleTimeString()}</p>
        </div>
      </div>
    `;
  }

  /**
   * Generate PDF from HTML element
   */
  static async generateFromElement(elementId: string, filename: string): Promise<void> {
    try {
      this.showToast({
        type: 'info',
        title: 'Generating PDF...',
        message: 'Please wait while we create your receipt',
        duration: 2000
      });

      const canvas = await this.captureElementCanvas(elementId);

      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: 'a4'
      });

      const imgWidth = 210; // A4 width in mm
      const pageHeight = 297; // A4 height in mm
      const imgHeight = (canvas.height * imgWidth) / canvas.width;
      let heightLeft = imgHeight;
      let position = 0;

      pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
      heightLeft -= pageHeight;

      while (heightLeft >= 0) {
        position = heightLeft - imgHeight;
        pdf.addPage();
        pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
        heightLeft -= pageHeight;
      }

      pdf.save(filename);

      this.showToast({
        type: 'success',
        title: 'PDF Downloaded Successfully',
        message: `Receipt saved as ${filename}`,
        duration: 3000
      });

    } catch (error) {
      console.error('PDF generation failed:', error);
      this.showToast({
        type: 'error',
        title: 'PDF Generation Failed',
        message: 'Unable to generate PDF. Please try again.',
        duration: 5000
      });
    }
  }

  static async downloadElementAsImage(elementId: string, filename: string): Promise<void> {
    try {
      this.showToast({
        type: 'info',
        title: 'Generating Image...',
        message: 'Please wait while we create your receipt image',
        duration: 2000
      });
      const canvas = await this.captureElementCanvas(elementId);
      const blob = await this.canvasToBlob(canvas);
      this.downloadBlob(blob, filename);
      this.showToast({
        type: 'success',
        title: 'Image Downloaded Successfully',
        message: `Receipt saved as ${filename}`,
        duration: 3000
      });
    } catch (error) {
      console.error('Image generation failed:', error);
      this.showToast({
        type: 'error',
        title: 'Image Generation Failed',
        message: 'Unable to generate image. Please try again.',
        duration: 5000
      });
    }
  }

  static async shareElementAsImage(elementId: string, options: { fileName: string; title: string; text: string }): Promise<void> {
    try {
      const canvas = await this.captureElementCanvas(elementId);
      const blob = await this.canvasToBlob(canvas);

      if (typeof navigator === 'undefined' || typeof navigator.share !== 'function') {
        this.downloadBlob(blob, options.fileName);
        this.showToast({
          type: 'info',
          title: 'Share Not Supported',
          message: 'Saved the receipt image instead because sharing is not supported on this device.',
          duration: 4000
        });
        return;
      }

      const file = new File([blob], options.fileName, { type: 'image/png' });
      const shareNavigator = navigator as Navigator & { canShare?: (data: Record<string, unknown>) => boolean };
      const shareDataWithFile = { title: options.title, text: options.text, files: [file] };
      const shareData = shareNavigator.canShare?.(shareDataWithFile)
        ? shareDataWithFile
        : { title: options.title, text: options.text };

      await navigator.share(shareData as Record<string, unknown>);

      this.showToast({
        type: 'success',
        title: 'Receipt Shared',
        message: 'Receipt shared successfully.',
        duration: 3000
      });
    } catch (error) {
      if ((error as Error)?.name === 'AbortError') return;
      console.error('Receipt share failed:', error);
      this.showToast({
        type: 'error',
        title: 'Share Failed',
        message: 'Unable to share receipt. Please try again.',
        duration: 5000
      });
    }
  }

  /**
   * Generate simple receipt PDF without HTML
   */
  static generateSimpleReceipt(data: ReceiptData): void {
    try {
      const pdf = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: 'a4'
      });

      // Add custom font for better text rendering
      pdf.setFont('helvetica');

      // Header
      pdf.setFontSize(24);
      pdf.setTextColor(0, 0, 0);
      pdf.text('PAYMENT RECEIPT', 105, 20, { align: 'center' });

      pdf.setFontSize(10);
      pdf.text('Official Fee Payment Receipt', 105, 26, { align: 'center' });

      // School Information
      pdf.setFontSize(12);
      pdf.text('Springfield International School', 20, 40);
      pdf.setFontSize(9);
      pdf.text('123 Education Avenue, Knowledge City', 20, 45);
      pdf.text('Phone: +91 98765 43210 | Email: accounts@springfield.edu', 20, 50);
      pdf.text('Website: www.springfield.edu', 20, 55);

      // Receipt Info
      pdf.setFontSize(10);
      pdf.text(`Receipt No: ${data.receiptNumber}`, 140, 40);
      pdf.text(`Payment Date: ${data.paymentDate}`, 140, 45);
      pdf.text(`Payment Method: ${data.paymentMethod}`, 140, 50);

      // Student Information
      pdf.line(20, 65, 190, 65);
      pdf.setFontSize(12);
      pdf.text('Student Information', 20, 75);
      pdf.setFontSize(10);
      pdf.text(`Name: ${data.studentData?.name || 'N/A'}`, 20, 85);
      pdf.text(`Class: ${data.studentData?.studentClass || 'N/A'}`, 20, 90);
      pdf.text(`Admission No: ${data.studentData?.admissionNo || 'N/A'}`, 20, 95);
      pdf.text(`Parent: ${data.studentData?.parentName || 'N/A'}`, 20, 100);

      // Fee Details
      pdf.line(20, 110, 190, 110);
      pdf.setFontSize(12);
      pdf.text('Fee Details', 20, 120);
      
      let yPosition = 130;
      
      if (data.paymentData?.currentYearFees) {
        (data.paymentData.currentYearFees as any).forEach((fee: any, index: number) => {
          pdf.setFontSize(9);
          pdf.text(`${fee.name} - ${fee.category}`, 20, yPosition);
          pdf.text(`₹${fee.totalAmount.toLocaleString()}`, 120, yPosition);
          if (fee.discount && fee.discount > 0) {
            pdf.text(`-₹${fee.discount.toLocaleString()}`, 140, yPosition);
            pdf.text(`₹${(fee.totalAmount - fee.discount).toLocaleString()}`, 160, yPosition);
          } else {
            pdf.text('', 140, yPosition);
            pdf.text(`₹${fee.totalAmount.toLocaleString()}`, 160, yPosition);
          }
          yPosition += 6;
        });
      }

      // Header for totals
      yPosition += 5;
      pdf.setFontSize(9);
      pdf.text('Fee Details:', 20, yPosition);
      pdf.text('Total:', 120, yPosition);
      pdf.text('Discount:', 140, yPosition);
      pdf.text('Net:', 160, yPosition);
      yPosition += 8;

      // Total
      pdf.line(20, yPosition + 5, 190, yPosition + 5);
      pdf.setFontSize(11);
      pdf.text('Total Amount:', 120, yPosition + 15);
      const totalAmount = (data.paymentData.currentYearFees as any)?.reduce((sum: number, fee: any) => sum + (fee.totalAmount || 0), 0) || 0;
      const totalDiscount = (data.paymentData.currentYearFees as any)?.reduce((sum: number, fee: any) => sum + (fee.discount || 0), 0) || 0;
      const netAmount = totalAmount - totalDiscount;
      
      pdf.setFontSize(12);
      pdf.text(`₹${totalAmount.toLocaleString()}`, 150, yPosition + 15);
      
      if (totalDiscount > 0) {
        yPosition += 8;
        pdf.setFontSize(10);
        pdf.text('Less: Discount:', 130, yPosition + 15);
        pdf.text(`-₹${totalDiscount.toLocaleString()}`, 150, yPosition + 15);
        yPosition += 8;
        pdf.setFontSize(11);
        pdf.text('Net Payable:', 130, yPosition + 15);
        pdf.text(`₹${netAmount.toLocaleString()}`, 150, yPosition + 15);
      }

      // Footer
      pdf.setFontSize(8);
      pdf.text('This is a computer-generated receipt and does not require a physical signature.', 105, 280, { align: 'center' });
      pdf.text('For any queries, please contact the accounts department.', 105, 285, { align: 'center' });

      // Save PDF
      const filename = `Receipt_${data.receiptNumber.replace(/[^a-zA-Z0-9]/g, '_')}.pdf`;
      pdf.save(filename);

      // Show success message
      if ((window as any).toast) {
        (window as any).toast({
          type: 'success',
          title: 'PDF Downloaded Successfully',
          message: `Receipt saved as ${filename}`,
          duration: 3000
        });
      }

    } catch (error) {
      console.error('Simple PDF generation failed:', error);
      
      // Show error message
      if ((window as any).toast) {
        (window as any).toast({
          type: 'error',
          title: 'PDF Generation Failed',
          message: 'Unable to generate PDF. Please try again.',
          duration: 5000
        });
      }
    }
  }

  /**
   * Generate bulk receipt PDF for multiple students
   */
  static async generateBulkReceipt(students: any[], filename: string): Promise<void> {
    try {
      if ((window as any).toast) {
        (window as any).toast({
          type: 'info',
          title: 'Generating Bulk Receipt...',
          message: `Creating receipt for ${students.length} students`,
          duration: 2000
        });
      }

      const pdf = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: 'a4'
      });

      students.forEach((student, index) => {
        if (index > 0) pdf.addPage();

        // Add student receipt content
        pdf.setFontSize(16);
        pdf.text(`Receipt for ${student.name}`, 105, 20, { align: 'center' });
        
        pdf.setFontSize(10);
        pdf.text(`Class: ${student.class}`, 20, 40);
        pdf.text(`Amount: ₹${student.amount?.toLocaleString() || '0'}`, 20, 45);
        pdf.text(`Date: ${new Date().toLocaleDateString()}`, 20, 50);
      });

      pdf.save(filename);

      if ((window as any).toast) {
        (window as any).toast({
          type: 'success',
          title: 'Bulk Receipt Generated',
          message: `Created receipt for ${students.length} students`,
          duration: 3000
        });
      }

    } catch (error) {
      console.error('Bulk PDF generation failed:', error);
      
      if ((window as any).toast) {
        (window as any).toast({
          type: 'error',
          title: 'Bulk PDF Generation Failed',
          message: 'Unable to generate bulk receipt. Please try again.',
          duration: 5000
        });
      }
    }
  }
}
