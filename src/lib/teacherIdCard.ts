import QRCode from 'qrcode';

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

const createTeacherCardContent = async (data: TeacherIdCardData, showBack: boolean = false) => {
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

export const buildTeacherIdCardDocument = async (data: TeacherIdCardData, showBack: boolean = false): Promise<string> => {
  return createTeacherCardContent(data, showBack);
};

export const generateTeacherIdCardPDF = async (teacher: any, schoolConfig: any): Promise<Uint8Array> => {
  const jsPDF = (await import('jspdf')).default;
  const html2canvas = (await import('html2canvas')).default;
  
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

  // Generate front side
  const frontHtml = await buildTeacherIdCardDocument(teacherData, false);
  const tempDiv = document.createElement('div');
  tempDiv.innerHTML = frontHtml;
  tempDiv.style.position = 'absolute';
  tempDiv.style.left = '-9999px';
  tempDiv.style.width = '325px';
  tempDiv.style.height = '203px';
  document.body.appendChild(tempDiv);

  try {
    const canvas = await html2canvas(tempDiv, {
      scale: 2,
      useCORS: true,
      allowTaint: true,
      backgroundColor: null
    });

    const imgData = canvas.toDataURL('image/png', 1.0);
    pdf.addImage(imgData, 'PNG', 0, 0, 86, 54);
  } finally {
    document.body.removeChild(tempDiv);
  }

  return new Uint8Array(pdf.output('arraybuffer'));
};

export const downloadTeacherIdCard = async (teacher: any, schoolConfig: any): Promise<void> => {
  try {
    const jsPDF = (await import('jspdf')).default;
    const html2canvas = (await import('html2canvas')).default;
    
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

    // Generate front side
    const frontHtml = await buildTeacherIdCardDocument(teacherData, false);
    const tempDiv = document.createElement('div');
    tempDiv.innerHTML = frontHtml;
    tempDiv.style.position = 'absolute';
    tempDiv.style.left = '-9999px';
    tempDiv.style.width = '325px';
    tempDiv.style.height = '203px';
    document.body.appendChild(tempDiv);

    try {
      const canvas = await html2canvas(tempDiv, {
        scale: 2,
        useCORS: true,
        allowTaint: true,
        backgroundColor: null
      });

      const imgData = canvas.toDataURL('image/png', 1.0);
      pdf.addImage(imgData, 'PNG', 0, 0, 86, 54);
      
      // Download the PDF
      const pdfBlob = pdf.output('blob');
      const pdfUrl = URL.createObjectURL(pdfBlob);
      
      const pdfLink = document.createElement('a');
      pdfLink.href = pdfUrl;
      pdfLink.download = `Staff_ID_Card_${teacher.name.replace(/\s+/g, '_')}_${teacher.employeeId}.pdf`;
      document.body.appendChild(pdfLink);
      pdfLink.click();
      document.body.removeChild(pdfLink);
      
      URL.revokeObjectURL(pdfUrl);
    } finally {
      document.body.removeChild(tempDiv);
    }
  } catch (error) {
    console.error('Error generating teacher ID card:', error);
    throw error;
  }
};
