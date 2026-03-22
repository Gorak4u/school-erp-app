import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';

export interface TCCertificateData {
  studentName: string;
  admissionNo: string;
  rollNo: string;
  class: string;
  section: string;
  gender: string;
  dateOfBirth: string;
  admissionDate: string;
  category: string;
  bloodGroup: string;
  fatherName: string;
  motherName: string;
  contactNo: string;
  email: string;
  residentialAddress: string;
  tcNumber: string;
  tcIssueDate: string;
  exitDate: string;
  exitReason: string;
  exitRemarks?: string;
  academicYear: string;
  status: string;
  schoolName: string;
  schoolAddress: string;
  schoolPhone: string;
  schoolEmail: string;
  schoolWebsite: string;
  schoolLogo?: string;
  principalName: string;
  principalSignature?: string;
  classTeacherName: string;
  classTeacherSignature?: string;
  schoolSeal?: string;
  photo?: string;
  affiliationNo?: string;
}

export class TCCertificateGenerator {
  /**
   * Generate enhanced TC certificate with realistic features
   */
  static async generateEnhancedTC(data: TCCertificateData): Promise<void> {
    try {
      // Show loading toast
      if ((window as any).toast) {
        (window as any).toast({
          type: 'info',
          title: 'Generating Transfer Certificate...',
          message: 'Please wait while we create your certificate',
          duration: 3000
        });
      }

      // Create PDF with two pages
      const pdf = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: 'a4'
      });

      // Page 1: Original Certificate
      await this.addCertificatePage(pdf, data, 'ORIGINAL', 1);
      
      // Page 2: Duplicate Copy
      pdf.addPage();
      await this.addCertificatePage(pdf, data, 'DUPLICATE', 2);

      // Save PDF
      const filename = `TC_Certificate_${data.studentName.replace(/[^a-zA-Z0-9]/g, '_')}_${data.tcNumber}.pdf`;
      pdf.save(filename);

      // Show success toast
      if ((window as any).toast) {
        (window as any).toast({
          type: 'success',
          title: 'Certificate Generated Successfully',
          message: `Transfer Certificate saved as ${filename}`,
          duration: 3000
        });
      }

    } catch (error) {
      console.error('TC Certificate generation failed:', error);
      if ((window as any).toast) {
        (window as any).toast({
          type: 'error',
          title: 'Certificate Generation Failed',
          message: 'Unable to generate certificate. Please try again.',
          duration: 5000
        });
      }
    }
  }

  /**
   * Add certificate page to PDF
   */
  private static async addCertificatePage(pdf: jsPDF, data: TCCertificateData, copyType: 'ORIGINAL' | 'DUPLICATE', pageNumber: number): Promise<void> {
    const pageWidth = 210; // A4 width in mm
    const pageHeight = 297; // A4 height in mm
    const margin = 15;
    const contentWidth = pageWidth - (margin * 2);

    // Set up fonts
    pdf.setFont('helvetica');
    
    // Header with school branding
    pdf.setFillColor(245, 245, 245);
    pdf.rect(0, 0, pageWidth, 40, 'F');
    
    // School logo (if available)
    if (data.schoolLogo) {
      try {
        // Add school logo
        pdf.addImage(data.schoolLogo, 'PNG', margin, 5, 25, 25);
      } catch (error) {
        console.log('School logo could not be loaded');
      }
    }
    
    // School name and details
    pdf.setFontSize(20);
    pdf.setFont('helvetica', 'bold');
    pdf.setTextColor(0, 0, 0);
    pdf.text(data.schoolName.toUpperCase(), data.schoolLogo ? 50 : margin, 15);
    
    pdf.setFontSize(10);
    pdf.setFont('helvetica', 'normal');
    pdf.setTextColor(60, 60, 60);
    const schoolAddressLines = this.splitText(data.schoolAddress, 50);
    schoolAddressLines.forEach((line, index) => {
      pdf.text(line, data.schoolLogo ? 50 : margin, 20 + (index * 4));
    });
    
    // Contact info
    pdf.setFontSize(8);
    pdf.text(`Phone: ${data.schoolPhone} | Email: ${data.schoolEmail}`, data.schoolLogo ? 50 : margin, 30);
    if (data.schoolWebsite) {
      pdf.text(`Website: ${data.schoolWebsite}`, data.schoolLogo ? 50 : margin, 33);
    }
    if (data.affiliationNo) {
      pdf.text(`Affiliation No: ${data.affiliationNo}`, data.schoolLogo ? 50 : margin, 36);
    }

    // Certificate title
    pdf.setFontSize(16);
    pdf.setFont('helvetica', 'bold');
    pdf.setTextColor(0, 0, 139); // Dark blue
    pdf.text('TRANSFER CERTIFICATE', pageWidth / 2, 55, { align: 'center' });
    
    // Copy type indicator
    pdf.setFontSize(12);
    pdf.setTextColor(255, 0, 0); // Red for original, blue for duplicate
    pdf.text(copyType, pageWidth / 2, 62, { align: 'center' });

    // Certificate border
    pdf.setDrawColor(0, 0, 139);
    pdf.rect(margin, 70, contentWidth, 180);

    // Certificate content
    let yPos = 80;
    
    // Certificate number and date
    pdf.setFontSize(10);
    pdf.setFont('helvetica', 'bold');
    pdf.setTextColor(0, 0, 0);
    pdf.text(`Certificate No: ${data.tcNumber}`, margin + 5, yPos);
    pdf.text(`Date of Issue: ${this.formatDate(data.tcIssueDate)}`, pageWidth - margin - 5, yPos, { align: 'right' });
    
    yPos += 15;
    
    // Student photo box
    pdf.setDrawColor(0, 0, 0);
    pdf.rect(pageWidth - margin - 35, yPos - 5, 30, 40);
    if (data.photo) {
      try {
        pdf.addImage(data.photo, 'PNG', pageWidth - margin - 33, yPos - 3, 26, 36);
      } catch (error) {
        pdf.setFontSize(8);
        pdf.text('PHOTO', pageWidth - margin - 20, yPos + 15, { align: 'center' });
      }
    } else {
      pdf.setFontSize(8);
      pdf.text('PHOTO', pageWidth - margin - 20, yPos + 15, { align: 'center' });
    }
    
    // Certificate text
    yPos += 5;
    pdf.setFontSize(11);
    pdf.setFont('helvetica', 'normal');
    const certText = `This is to certify that ${data.studentName}, son/daughter of ${data.fatherName} and ${data.motherName},`;
    const certLines = this.splitText(certText, contentWidth - 50);
    certLines.forEach((line, index) => {
      pdf.text(line, margin + 5, yPos + (index * 5));
    });
    
    yPos += certLines.length * 5 + 5;
    
    // Student details in table format
    pdf.setFontSize(10);
    pdf.setFont('helvetica', 'bold');
    pdf.text('Student Details:', margin + 5, yPos);
    
    yPos += 8;
    pdf.setFont('helvetica', 'normal');
    const details = [
      ['Name of Student:', data.studentName],
      ['Admission No:', data.admissionNo],
      ['Roll No:', data.rollNo],
      ['Class & Section:', `${data.class}${data.section ? ' - ' + data.section : ''}`],
      ['Date of Birth:', this.formatDate(data.dateOfBirth)],
      ['Date of Admission:', this.formatDate(data.admissionDate)],
      ['Gender:', data.gender],
      ['Blood Group:', data.bloodGroup || 'N/A'],
      ['Category:', data.category || 'N/A']
    ];
    
    details.forEach(([label, value]) => {
      pdf.text(`${label} ${value}`, margin + 5, yPos);
      yPos += 6;
    });
    
    // Parent details
    yPos += 5;
    pdf.setFont('helvetica', 'bold');
    pdf.text('Parent Details:', margin + 5, yPos);
    
    yPos += 8;
    pdf.setFont('helvetica', 'normal');
    const parentDetails = [
      ['Father\'s Name:', data.fatherName],
      ['Mother\'s Name:', data.motherName],
      ['Contact No:', data.contactNo],
      ['Email:', data.email],
      ['Residential Address:', data.residentialAddress]
    ];
    
    parentDetails.forEach(([label, value]) => {
      if (label === 'Residential Address:') {
        const addressLines = this.splitText(value, contentWidth - 80);
        pdf.text(label + ' ' + addressLines[0], margin + 5, yPos);
        addressLines.slice(1).forEach((line) => {
          yPos += 5;
          pdf.text('    ' + line, margin + 5, yPos);
        });
      } else {
        pdf.text(`${label} ${value}`, margin + 5, yPos);
      }
      yPos += 6;
    });
    
    // Academic details
    yPos += 5;
    pdf.setFont('helvetica', 'bold');
    pdf.text('Academic Details:', margin + 5, yPos);
    
    yPos += 8;
    pdf.setFont('helvetica', 'normal');
    const academicDetails = [
      ['Academic Year:', data.academicYear],
      ['Status:', data.status],
      ['Date of Leaving:', this.formatDate(data.exitDate)],
      ['Reason for Leaving:', data.exitReason]
    ];
    
    academicDetails.forEach(([label, value]) => {
      pdf.text(`${label} ${value}`, margin + 5, yPos);
      yPos += 6;
    });
    
    // Remarks
    if (data.exitRemarks) {
      yPos += 5;
      pdf.setFont('helvetica', 'bold');
      pdf.text('Remarks:', margin + 5, yPos);
      
      yPos += 8;
      pdf.setFont('helvetica', 'normal');
      const remarkLines = this.splitText(data.exitRemarks, contentWidth - 20);
      remarkLines.forEach((line) => {
        pdf.text(line, margin + 5, yPos);
        yPos += 5;
      });
    }
    
    // Certificate statement
    yPos += 10;
    pdf.setFontSize(10);
    pdf.setFont('helvetica', 'normal');
    const statement = `The above mentioned student was studying in this institution and has been relieved from the school as per the records. All school dues have been cleared and the student's library and laboratory returnables have been returned.`;
    const statementLines = this.splitText(statement, contentWidth - 20);
    statementLines.forEach((line) => {
      pdf.text(line, margin + 5, yPos);
      yPos += 5;
    });
    
    // Signatures section
    yPos = 230;
    
    // Class Teacher Signature
    pdf.setFontSize(10);
    pdf.setFont('helvetica', 'bold');
    pdf.text('Class Teacher', margin + 5, yPos);
    
    pdf.setDrawColor(0, 0, 0);
    pdf.line(margin + 5, yPos + 5, margin + 50, yPos + 5);
    
    pdf.setFontSize(9);
    pdf.setFont('helvetica', 'normal');
    pdf.text(data.classTeacherName, margin + 5, yPos + 10);
    pdf.text('(Signature)', margin + 5, yPos + 14);
    
    // Principal Signature
    pdf.text('Principal', pageWidth - margin - 50, yPos);
    
    pdf.line(pageWidth - margin - 50, yPos + 5, pageWidth - margin - 5, yPos + 5);
    
    pdf.text(data.principalName, pageWidth - margin - 50, yPos + 10);
    pdf.text('(Signature)', pageWidth - margin - 50, yPos + 14);
    
    // School Seal
    if (data.schoolSeal) {
      try {
        pdf.addImage(data.schoolSeal, 'PNG', pageWidth / 2 - 15, yPos + 20, 30, 30);
      } catch (error) {
        // Draw seal placeholder
        pdf.setDrawColor(255, 0, 0);
        pdf.circle(pageWidth / 2, yPos + 35, 15);
        pdf.setFontSize(8);
        pdf.text('SCHOOL SEAL', pageWidth / 2, yPos + 35, { align: 'center' });
      }
    } else {
      // Draw seal placeholder
      pdf.setDrawColor(255, 0, 0);
      pdf.circle(pageWidth / 2, yPos + 35, 15);
      pdf.setFontSize(8);
      pdf.text('SCHOOL SEAL', pageWidth / 2, yPos + 35, { align: 'center' });
    }
    
    // Footer
    pdf.setFontSize(8);
    pdf.setFont('helvetica', 'italic');
    pdf.setTextColor(100, 100, 100);
    pdf.text(`This is a computer-generated certificate. Generated on ${this.formatDate(new Date().toISOString())}`, pageWidth / 2, pageHeight - 10, { align: 'center' });
    
    // Page number
    pdf.setFontSize(6);
    pdf.text(`Page ${pageNumber}`, pageWidth / 2, pageHeight - 5, { align: 'center' });
  }

  /**
   * Helper function to format date
   */
  private static formatDate(dateString: string): string {
    if (!dateString) return 'N/A';
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString('en-IN', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric'
      });
    } catch {
      return dateString;
    }
  }

  /**
   * Helper function to split text into lines
   */
  private static splitText(text: string, maxLength: number): string[] {
    if (!text) return [''];
    const words = text.split(' ');
    const lines: string[] = [];
    let currentLine = '';
    
    words.forEach(word => {
      if ((currentLine + ' ' + word).length <= maxLength) {
        currentLine = currentLine ? currentLine + ' ' + word : word;
      } else {
        if (currentLine) {
          lines.push(currentLine);
          currentLine = word;
        } else {
          lines.push(word);
        }
      }
    });
    
    if (currentLine) {
      lines.push(currentLine);
    }
    
    return lines;
  }

  /**
   * Generate HTML preview for TC certificate
   */
  static generateHTMLPreview(data: TCCertificateData): string {
    return `
      <div class="tc-certificate-preview" style="width: 100%; max-width: 800px; margin: 0 auto; background: white; padding: 40px; font-family: 'Times New Roman', serif; border: 2px solid #1e40af;">
        <!-- Header -->
        <div style="text-align: center; margin-bottom: 30px; border-bottom: 3px solid #1e40af; padding-bottom: 20px;">
          <div style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 20px;">
            <div style="flex: 1;">
              ${data.schoolLogo ? `<img src="${data.schoolLogo}" alt="${data.schoolName}" style="max-height: 80px; object-fit: contain;" />` : ''}
            </div>
            <div style="flex: 2; text-align: center;">
              <h1 style="margin: 0; font-size: 24px; font-weight: bold; color: #1e40af;">${data.schoolName.toUpperCase()}</h1>
              <p style="margin: 5px 0; font-size: 12px; color: #666;">${data.schoolAddress}</p>
              <p style="margin: 3px 0; font-size: 11px; color: #666;">Phone: ${data.schoolPhone} | Email: ${data.schoolEmail}</p>
              ${data.schoolWebsite ? `<p style="margin: 3px 0; font-size: 11px; color: #666;">Website: ${data.schoolWebsite}</p>` : ''}
              ${data.affiliationNo ? `<p style="margin: 3px 0; font-size: 11px; color: #666;">Affiliation No: ${data.affiliationNo}</p>` : ''}
            </div>
            <div style="flex: 1;">
              ${data.photo ? `<img src="${data.photo}" alt="${data.studentName}" style="width: 80px; height: 100px; object-fit: cover; border: 2px solid #1e40af;" />` : '<div style="width: 80px; height: 100px; border: 2px solid #ccc; display: flex; align-items: center; justify-content: center; color: #999;">PHOTO</div>'}
            </div>
          </div>
        </div>

        <!-- Certificate Title -->
        <div style="text-align: center; margin-bottom: 30px;">
          <h2 style="margin: 0; font-size: 20px; font-weight: bold; color: #1e40af; text-transform: uppercase;">Transfer Certificate</h2>
          <div style="margin-top: 10px; font-size: 12px; color: #666;">Certificate No: ${data.tcNumber} | Date of Issue: ${this.formatDate(data.tcIssueDate)}</div>
        </div>

        <!-- Certificate Content -->
        <div style="margin-bottom: 30px; line-height: 1.6;">
          <p style="margin: 0 0 20px 0; text-align: justify; font-size: 14px;">
            This is to certify that <strong>${data.studentName}</strong>, son/daughter of <strong>${data.fatherName}</strong> and <strong>${data.motherName}</strong>, was a bona fide student of this institution.
          </p>
          
          <!-- Student Details Table -->
          <div style="margin-bottom: 20px;">
            <h3 style="margin: 0 0 10px 0; font-size: 14px; font-weight: bold; color: #1e40af;">Student Details:</h3>
            <table style="width: 100%; border-collapse: collapse; font-size: 12px;">
              <tr>
                <td style="padding: 5px; border: 1px solid #ddd; font-weight: bold; width: 30%;">Name of Student:</td>
                <td style="padding: 5px; border: 1px solid #ddd;">${data.studentName}</td>
                <td style="padding: 5px; border: 1px solid #ddd; font-weight: bold; width: 30%;">Admission No:</td>
                <td style="padding: 5px; border: 1px solid #ddd;">${data.admissionNo}</td>
              </tr>
              <tr>
                <td style="padding: 5px; border: 1px solid #ddd; font-weight: bold;">Roll No:</td>
                <td style="padding: 5px; border: 1px solid #ddd;">${data.rollNo}</td>
                <td style="padding: 5px; border: 1px solid #ddd; font-weight: bold;">Class & Section:</td>
                <td style="padding: 5px; border: 1px solid #ddd;">${data.class}${data.section ? ' - ' + data.section : ''}</td>
              </tr>
              <tr>
                <td style="padding: 5px; border: 1px solid #ddd; font-weight: bold;">Date of Birth:</td>
                <td style="padding: 5px; border: 1px solid #ddd;">${this.formatDate(data.dateOfBirth)}</td>
                <td style="padding: 5px; border: 1px solid #ddd; font-weight: bold;">Date of Admission:</td>
                <td style="padding: 5px; border: 1px solid #ddd;">${this.formatDate(data.admissionDate)}</td>
              </tr>
              <tr>
                <td style="padding: 5px; border: 1px solid #ddd; font-weight: bold;">Gender:</td>
                <td style="padding: 5px; border: 1px solid #ddd;">${data.gender}</td>
                <td style="padding: 5px; border: 1px solid #ddd; font-weight: bold;">Blood Group:</td>
                <td style="padding: 5px; border: 1px solid #ddd;">${data.bloodGroup || 'N/A'}</td>
              </tr>
            </table>
          </div>

          <!-- Parent Details -->
          <div style="margin-bottom: 20px;">
            <h3 style="margin: 0 0 10px 0; font-size: 14px; font-weight: bold; color: #1e40af;">Parent Details:</h3>
            <table style="width: 100%; border-collapse: collapse; font-size: 12px;">
              <tr>
                <td style="padding: 5px; border: 1px solid #ddd; font-weight: bold; width: 30%;">Father's Name:</td>
                <td style="padding: 5px; border: 1px solid #ddd;">${data.fatherName}</td>
                <td style="padding: 5px; border: 1px solid #ddd; font-weight: bold; width: 30%;">Mother's Name:</td>
                <td style="padding: 5px; border: 1px solid #ddd;">${data.motherName}</td>
              </tr>
              <tr>
                <td style="padding: 5px; border: 1px solid #ddd; font-weight: bold;">Contact No:</td>
                <td style="padding: 5px; border: 1px solid #ddd;">${data.contactNo}</td>
                <td style="padding: 5px; border: 1px solid #ddd; font-weight: bold;">Email:</td>
                <td style="padding: 5px; border: 1px solid #ddd;">${data.email}</td>
              </tr>
              <tr>
                <td style="padding: 5px; border: 1px solid #ddd; font-weight: bold;">Residential Address:</td>
                <td colspan="3" style="padding: 5px; border: 1px solid #ddd;">${data.residentialAddress}</td>
              </tr>
            </table>
          </div>

          <!-- Academic Details -->
          <div style="margin-bottom: 20px;">
            <h3 style="margin: 0 0 10px 0; font-size: 14px; font-weight: bold; color: #1e40af;">Academic Details:</h3>
            <table style="width: 100%; border-collapse: collapse; font-size: 12px;">
              <tr>
                <td style="padding: 5px; border: 1px solid #ddd; font-weight: bold; width: 30%;">Academic Year:</td>
                <td style="padding: 5px; border: 1px solid #ddd;">${data.academicYear}</td>
                <td style="padding: 5px; border: 1px solid #ddd; font-weight: bold; width: 30%;">Status:</td>
                <td style="padding: 5px; border: 1px solid #ddd;">${data.status}</td>
              </tr>
              <tr>
                <td style="padding: 5px; border: 1px solid #ddd; font-weight: bold;">Date of Leaving:</td>
                <td style="padding: 5px; border: 1px solid #ddd;">${this.formatDate(data.exitDate)}</td>
                <td style="padding: 5px; border: 1px solid #ddd; font-weight: bold;">Reason for Leaving:</td>
                <td style="padding: 5px; border: 1px solid #ddd;">${data.exitReason}</td>
              </tr>
            </table>
          </div>

          ${data.exitRemarks ? `
          <div style="margin-bottom: 20px;">
            <h3 style="margin: 0 0 10px 0; font-size: 14px; font-weight: bold; color: #1e40af;">Remarks:</h3>
            <p style="margin: 0; padding: 10px; background: #f8f9fa; border: 1px solid #ddd; font-size: 12px;">${data.exitRemarks}</p>
          </div>
          ` : ''}

          <!-- Certificate Statement -->
          <div style="margin-bottom: 30px; padding: 15px; background: #f8f9fa; border: 1px solid #ddd; font-size: 12px;">
            <p style="margin: 0; line-height: 1.6;">
              The above mentioned student was studying in this institution and has been relieved from the school as per the records. All school dues have been cleared and the student's library and laboratory returnables have been returned.
            </p>
          </div>
        </div>

        <!-- Signatures -->
        <div style="display: flex; justify-content: space-between; align-items: flex-end; margin-top: 40px;">
          <div style="text-align: center; width: 30%;">
            <div style="border-bottom: 1px solid #000; margin-bottom: 5px; padding-bottom: 20px;">
              ${data.classTeacherSignature ? `<img src="${data.classTeacherSignature}" alt="Class Teacher Signature" style="max-height: 40px;" />` : ''}
            </div>
            <p style="margin: 0; font-size: 12px; font-weight: bold;">Class Teacher</p>
            <p style="margin: 0; font-size: 10px; color: #666;">${data.classTeacherName}</p>
          </div>
          
          <div style="text-align: center; width: 30%;">
            <div style="border: 2px solid #dc2626; width: 80px; height: 80px; border-radius: 50%; margin: 0 auto 10px; display: flex; align-items: center; justify-content: center;">
              ${data.schoolSeal ? `<img src="${data.schoolSeal}" alt="School Seal" style="max-width: 70px; max-height: 70px; border-radius: 50%;" />` : '<div style="font-size: 10px; color: #dc2626; text-align: center;">SCHOOL<br/>SEAL</div>'}
            </div>
            <p style="margin: 0; font-size: 10px; color: #666;">Official Seal</p>
          </div>
          
          <div style="text-align: center; width: 30%;">
            <div style="border-bottom: 1px solid #000; margin-bottom: 5px; padding-bottom: 20px;">
              ${data.principalSignature ? `<img src="${data.principalSignature}" alt="Principal Signature" style="max-height: 40px;" />` : ''}
            </div>
            <p style="margin: 0; font-size: 12px; font-weight: bold;">Principal</p>
            <p style="margin: 0; font-size: 10px; color: #666;">${data.principalName}</p>
          </div>
        </div>

        <!-- Footer -->
        <div style="margin-top: 40px; padding-top: 20px; border-top: 1px solid #ddd; text-align: center;">
          <p style="margin: 0; font-size: 10px; color: #666; font-style: italic;">
            This is a computer-generated certificate. Generated on ${this.formatDate(new Date().toISOString())}
          </p>
        </div>
      </div>
    `;
  }
}
