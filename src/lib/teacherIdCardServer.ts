import * as QRCode from 'qrcode';
import { jsPDF } from 'jspdf';

export interface TeacherIdCardData {
  name: string;
  employeeId: string;
  department: string;
  schoolName: string;
  schoolLogo?: string;
  photo?: string;
  dateOfBirth?: string;
  issueDate?: string;
  phone?: string;
  address?: string;
  academicYear?: string;
  bloodGroup?: string;
  designation?: string;
  qualification?: string;
  email?: string;
  joiningDate?: string;
}

const createServerTeacherCardContent = async (data: TeacherIdCardData, showBack: boolean = false) => {
  const issueDate = data.issueDate || new Date().toISOString().split('T')[0];
  const dobLine = data.dateOfBirth
    ? `<p style="margin: 4px 0 0 0; font-size: 8px; color: #94a3b8; text-align: center;"><strong>DOB:</strong> ${data.dateOfBirth}</p>`
    : '';
  const logoBlock = data.schoolLogo
    ? `<img src="${data.schoolLogo}" alt="${data.schoolName}" style="width: 48px; height: 48px; object-fit: contain; border-radius: 12px; background: rgba(255,255,255,0.16); padding: 4px;" />`
    : '';
  const photoBlock = data.photo
    ? `<img src="${data.photo}" alt="Teacher" style="width: 70px; height: 70px; object-fit: cover; border-radius: 8px; border: 2px solid #fff;"/>${dobLine}`
    : `<div style="width: 70px; height: 70px; background: rgba(255,255,255,0.15); border-radius: 8px; display: flex; align-items: center; justify-content: center; font-size: 16px; color: rgba(255,255,255,0.6);">${data.name.charAt(0)}</div>${dobLine}`;

  // Generate real QR code
  const qrData = JSON.stringify({
    employeeId: data.employeeId,
    name: data.name,
    department: data.department,
    designation: data.designation,
    school: data.schoolName,
    phone: data.phone,
    email: data.email,
    verified: true
  });
  
  const qrCodeDataUrl = await QRCode.toDataURL(qrData, {
    width: 60,
    margin: 0,
    color: {
      dark: '#000000',
      light: '#FFFFFF'
    }
  });
  
  const qrCode = `<img src="${qrCodeDataUrl}" alt="QR Code" style="width: 60px; height: 60px; border-radius: 4px; border: 1px solid #ccc;" />`;

  if (showBack) {
    // Back side design - matching front side styling exactly
    return `
      <div style="width: 325px; height: 203px; border-radius: 16px; overflow: hidden; box-shadow: 0 25px 50px rgba(15,23,42,0.5); background: #1f2937; border: 1px solid rgba(255,255,255,0.1);">
        <!-- Header Section - Same green as front -->
        <div style="padding: 12px 16px; background: #059669; color: #f8fafc; display: flex; align-items: center; justify-content: space-between;">
          <div style="display: flex; align-items: center; gap: 10px;">
            ${logoBlock}
            <div>
              <span style="display: inline-flex; font-size: 9px; padding: 2px 6px; border-radius: 999px; background: #10b981; color: #a7f3d0; letter-spacing: 0.08em; font-weight: 600;">${data.schoolName}</span>
              <h1 style="margin: 2px 0 0; font-size: 12px; letter-spacing: 0.02em;">STAFF DETAILS</h1>
            </div>
          </div>
          <p style="margin: 0; font-size: 8px; color: rgba(248,250,252,0.8); text-align: right;">Valid: ${issueDate}</p>
        </div>
        <div style="height: 2px; background: rgba(255,255,255,0.6);"></div>
        
        <!-- Back Content - Same layout structure as front -->
        <div style="padding: 16px; color: #e2e8f0; font-family: 'Inter', 'Segoe UI', system-ui, sans-serif; display: flex; gap: 16px;">
          <!-- Left Section - QR Code -->
          <div style="flex-shrink: 0;">
            ${qrCode}
            <p style="margin: 4px 0 0 0; font-size: 8px; color: #94a3b8; text-align: center;"><strong>SCAN FOR</strong><br/>Staff Profile</p>
          </div>
          
          <!-- Right Section - Additional Info -->
          <div style="flex: 1; display: flex; flex-direction: column; justify-content: space-between;">
            <!-- Professional Info -->
            <div style="margin-bottom: 0px;">
              <div style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 1px; font-size: 11px;">
                <strong style="color: #f8fafc;">Qualification</strong>
                <span style="color: #f59e0b; font-weight: 600;">${data.qualification || 'N/A'}</span>
              </div>
              <div style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 1px; font-size: 11px;">
                <strong style="color: #f8fafc;">Experience</strong>
                <span>${data.joiningDate ? `${Math.floor((new Date().getTime() - new Date(data.joiningDate).getTime()) / (1000 * 60 * 60 * 24 * 365))}+ years` : 'N/A'}</span>
              </div>
              <div style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 1px; font-size: 11px;">
                <strong style="color: #f8fafc;">Blood Group</strong>
                <span style="color: #ef4444; font-weight: 600;">${data.bloodGroup || 'N/A'}</span>
              </div>
            </div>
            
            <!-- Contact Info -->
            <div style="font-size: 9px;">
              ${data.email ? `<div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:1px;"><strong style="color:#f8fafc;">Email</strong><span style="word-break:break-all;">${data.email}</span></div>` : ''}
              ${data.phone ? `<div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:1px;"><strong style="color:#f8fafc;">Phone</strong><span>${data.phone}</span></div>` : ''}
              ${data.address ? `<div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:1px;"><strong style="color:#f8fafc;">Address</strong><span style="word-break:break-all;">${data.address}</span></div>` : ''}
            </div>
            
            <!-- Status Badges -->
            <div style="font-size: 9px;">
              <div style="display: flex; gap: 2px; flex-wrap: wrap;">
                <span style="padding: 1px 4px; background: #22c55e; color: #86efac; border-radius: 999px; font-size: 7px; font-weight: 500;">Active</span>
                <span style="padding: 1px 4px; background: #10b981; color: #a7f3d0; border-radius: 999px; font-size: 7px; font-weight: 500;">${data.academicYear || '2024-25'}</span>
                <span style="padding: 1px 4px; background: #3b82f6; color: #93c5fd; border-radius: 999px; font-size: 7px; font-weight: 500;">Staff</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    `.trim();
  } else {
    // Front side design
    return `
      <div style="width: 325px; height: 203px; border-radius: 16px; overflow: hidden; box-shadow: 0 25px 50px rgba(15,23,42,0.5); background: #1f2937; border: 1px solid rgba(255,255,255,0.1);">
        <!-- Header Section -->
        <div style="padding: 12px 16px; background: #059669; color: #f8fafc; display: flex; align-items: center; justify-content: space-between;">
          <div style="display: flex; align-items: center; gap: 10px;">
            ${logoBlock}
            <div>
              <span style="display: inline-flex; font-size: 9px; padding: 2px 6px; border-radius: 999px; background: #10b981; color: #a7f3d0; letter-spacing: 0.08em; font-weight: 600;">${data.schoolName}</span>
              <h1 style="margin: 2px 0 0; font-size: 12px; letter-spacing: 0.02em;">STAFF ID CARD</h1>
            </div>
          </div>
          <p style="margin: 0; font-size: 8px; color: rgba(248,250,252,0.8); text-align: right;">Issued: ${issueDate}</p>
        </div>
        <div style="height: 2px; background: rgba(255,255,255,0.6);"></div>
        
        <!-- Main Content - Horizontal Layout -->
        <div style="padding: 16px; color: #e2e8f0; font-family: 'Inter', 'Segoe UI', system-ui, sans-serif; display: flex; gap: 16px;">
          <!-- Left Section - Photo -->
          <div style="flex-shrink: 0;">
            ${photoBlock}
          </div>
          
          <!-- Right Section - Teacher Information -->
          <div style="flex: 1; display: flex; flex-direction: column; justify-content: space-between;">
            <!-- Basic Info -->
            <div style="margin-bottom: 0px;">
              <div style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 1px; font-size: 11px;">
                <strong style="color: #f8fafc;">Name</strong>
                <span>${data.name}</span>
              </div>
              <div style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 1px; font-size: 11px;">
                <strong style="color: #f8fafc;">Employee ID</strong>
                <span style="color: #10b981; font-weight: 600;">${data.employeeId}</span>
              </div>
              <div style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 1px; font-size: 11px;">
                <strong style="color: #f8fafc;">Department</strong>
                <span>${data.department}</span>
              </div>
              <div style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 1px; font-size: 11px;">
                <strong style="color: #f8fafc;">Designation</strong>
                <span>${data.designation || 'Teacher'}</span>
              </div>
              <div style="display: flex; align-items: center; justify-content: space-between; margin-size: 11px;">
                <strong style="color: #f8fafc;">Phone</strong>
                <span>${data.phone || 'N/A'}</span>
              </div>
            </div>
            
            <!-- Status Badges -->
            <div style="font-size: 9px;">
              <div style="display: flex; gap: 2px; flex-wrap: wrap;">
                <span style="padding: 1px 4px; background: #22c55e; color: #86efac; border-radius: 999px; font-size: 7px; font-weight: 500;">Active</span>
                <span style="padding: 1px 4px; background: #10b981; color: #a7f3d0; border-radius: 999px; font-size: 7px; font-weight: 500;">${data.academicYear || '2024-25'}</span>
                <span style="padding: 1px 4px; background: #3b82f6; color: #93c5fd; border-radius: 999px; font-size: 7px; font-weight: 500;">Staff</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    `.trim();
  }
};

export const generateTeacherIdCardPDFServer = async (teacher: any, schoolConfig: any): Promise<Buffer> => {
  // For server-side generation, we'll create a simplified version that matches the design
  const pdf = new jsPDF({
    orientation: 'landscape',
    unit: 'mm',
    format: [86, 54] // Credit card size
  });

  // Prepare teacher data
  const teacherData: TeacherIdCardData = {
    name: teacher.name,
    employeeId: teacher.employeeId,
    department: teacher.department || 'General',
    designation: teacher.designation || 'Teacher',
    qualification: teacher.qualification,
    schoolName: schoolConfig.school?.name || 'School',
    schoolLogo: schoolConfig.schoolDetails?.logo_url,
    photo: teacher.photo,
    dateOfBirth: teacher.dateOfBirth,
    phone: teacher.phone,
    email: teacher.email,
    address: teacher.address,
    bloodGroup: teacher.bloodGroup,
    joiningDate: teacher.joiningDate,
    academicYear: new Date().getFullYear().toString() + '-' + (new Date().getFullYear() + 1).toString().slice(-2),
    issueDate: new Date().toISOString().split('T')[0]
  };

  // Generate QR code
  const qrData = JSON.stringify({
    employeeId: teacherData.employeeId,
    name: teacherData.name,
    department: teacherData.department,
    designation: teacherData.designation,
    school: teacherData.schoolName,
    phone: teacherData.phone,
    email: teacherData.email,
    verified: true
  });
  
  const qrCodeDataUrl = await QRCode.toDataURL(qrData, {
    width: 60,
    margin: 0,
    color: {
      dark: '#000000',
      light: '#FFFFFF'
    }
  });

  // Background
  pdf.setFillColor(31, 41, 55); // #1f2937
  pdf.rect(0, 0, 86, 54, 'F');

  // Header
  pdf.setFillColor(5, 150, 105); // #059669
  pdf.rect(0, 0, 86, 12, 'F');
  
  // School name in header
  pdf.setTextColor(255, 255, 255);
  pdf.setFont('helvetica', 'bold');
  pdf.setFontSize(7);
  pdf.text(teacherData.schoolName, 43, 7, { align: 'center' });
  
  // "STAFF ID CARD" in header
  pdf.setFontSize(5);
  pdf.text('STAFF ID CARD', 43, 10, { align: 'center' });

  // Issue date in header
  pdf.setFontSize(4);
  pdf.text(`Issued: ${teacherData.issueDate}`, 80, 10, { align: 'right' });

  // Main content area
  pdf.setTextColor(226, 232, 240); // #e2e8f0
  pdf.setFont('helvetica', 'normal');
  
  // Teacher info
  pdf.setFont('helvetica', 'bold');
  pdf.setFontSize(8);
  pdf.text(teacherData.name, 8, 20);
  
  pdf.setFont('helvetica', 'normal');
  pdf.setFontSize(6);
  pdf.text(`Employee ID: ${teacherData.employeeId}`, 8, 24);
  pdf.text(`Department: ${teacherData.department}`, 8, 28);
  pdf.text(`Designation: ${teacherData.designation}`, 8, 32);
  pdf.text(`Phone: ${teacherData.phone || 'N/A'}`, 8, 36);

  // Add QR code (simplified - just add a placeholder for now)
  pdf.setFillColor(255, 255, 255);
  pdf.rect(65, 20, 15, 15, 'F');
  pdf.setTextColor(0, 0, 0);
  pdf.setFontSize(3);
  pdf.text('QR', 72.5, 27.5, { align: 'center' });

  // Status badges
  pdf.setFillColor(34, 197, 94); // #22c55e
  pdf.rect(8, 42, 12, 3, 'F');
  pdf.setTextColor(255, 255, 255);
  pdf.setFontSize(3);
  pdf.text('Active', 14, 44, { align: 'center' });

  pdf.setFillColor(16, 185, 129); // #10b981
  pdf.rect(22, 42, 20, 3, 'F');
  pdf.text(teacherData.academicYear || '2024-25', 32, 44, { align: 'center' });

  pdf.setFillColor(59, 130, 246); // #3b82f6
  pdf.rect(44, 42, 12, 3, 'F');
  pdf.text('Staff', 50, 44, { align: 'center' });

  return Buffer.from(pdf.output('arraybuffer'));
};
