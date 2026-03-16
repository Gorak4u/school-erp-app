import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';

export interface ReceiptData {
  receiptNumber: string;
  paymentDate: string;
  paymentMethod: string;
  studentData: any;
  paymentData: any;
}

export class PDFGenerator {
  /**
   * Generate PDF from HTML element
   */
  static async generateFromElement(elementId: string, filename: string): Promise<void> {
    try {
      const element = document.getElementById(elementId);
      if (!element) {
        throw new Error('Element not found');
      }

      // Show loading state
      if ((window as any).toast) {
        (window as any).toast({
          type: 'info',
          title: 'Generating PDF...',
          message: 'Please wait while we create your receipt',
          duration: 2000
        });
      }

      // Create canvas from HTML element
      const canvas = await html2canvas(element, {
        scale: 2,
        useCORS: true,
        allowTaint: true,
        backgroundColor: '#ffffff',
        logging: false,
        width: element.scrollWidth,
        height: element.scrollHeight
      });

      // Create PDF
      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: 'a4'
      });

      // Calculate dimensions to fit A4 page
      const imgWidth = 210; // A4 width in mm
      const pageHeight = 297; // A4 height in mm
      const imgHeight = (canvas.height * imgWidth) / canvas.width;
      let heightLeft = imgHeight;
      let position = 0;

      // Add image to PDF
      pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
      heightLeft -= pageHeight;

      // Add new pages if content is longer than one page
      while (heightLeft >= 0) {
        position = heightLeft - imgHeight;
        pdf.addPage();
        pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
        heightLeft -= pageHeight;
      }

      // Save PDF
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
      console.error('PDF generation failed:', error);
      
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
        data.paymentData.currentYearFees.forEach((fee: any, index: number) => {
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
      const totalAmount = data.paymentData?.currentYearFees?.reduce((sum: number, fee: any) => sum + (fee.totalAmount || 0), 0) || 0;
      const totalDiscount = data.paymentData?.currentYearFees?.reduce((sum: number, fee: any) => sum + (fee.discount || 0), 0) || 0;
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
