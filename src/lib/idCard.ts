import QRCode from 'qrcode';

export interface StudentIdCardData {
  name: string;
  admissionNo: string;
  className: string;
  schoolName: string;
  schoolLogo?: string;
  photo?: string;
  dateOfBirth?: string;
  issueDate?: string;
  phone?: string;
  address?: string;
  academicYear?: string;
  bloodGroup?: string;
  fatherName?: string;
  motherName?: string;
  transportRoute?: string;
}

const createCardContent = async (data: StudentIdCardData, showBack: boolean = false) => {
  const issueDate = data.issueDate || new Date().toISOString().split('T')[0];
  const dobLine = data.dateOfBirth
    ? `<p style="margin: 4px 0 0 0; font-size: 8px; color: #94a3b8; text-align: center;"><strong>DOB:</strong> ${data.dateOfBirth}</p>`
    : '';
  const logoBlock = data.schoolLogo
    ? `<img src="${data.schoolLogo}" alt="${data.schoolName}" style="width: 48px; height: 48px; object-fit: contain; border-radius: 12px; background: rgba(255,255,255,0.16); padding: 4px;" />`
    : '';
  const photoBlock = data.photo
    ? `<img src="${data.photo}" alt="Student" style="width: 70px; height: 70px; object-fit: cover; border-radius: 8px; border: 2px solid #fff;"/>${dobLine}`
    : `<div style="width: 70px; height: 70px; background: rgba(255,255,255,0.15); border-radius: 8px; display: flex; align-items: center; justify-content: center; font-size: 16px; color: rgba(255,255,255,0.6);">${data.name.charAt(0)}</div>${dobLine}`;

  // Generate real QR code
  const qrData = JSON.stringify({
    studentId: data.admissionNo,
    name: data.name,
    class: data.className,
    school: data.schoolName,
    phone: data.phone,
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
        <!-- Header Section - Same blue as front -->
        <div style="padding: 12px 16px; background: #2563eb; color: #f8fafc; display: flex; align-items: center; justify-content: space-between;">
          <div style="display: flex; align-items: center; gap: 10px;">
            ${logoBlock}
            <div>
              <span style="display: inline-flex; font-size: 9px; padding: 2px 6px; border-radius: 999px; background: #3b82f6; color: #93c5fd; letter-spacing: 0.08em; font-weight: 600;">${data.schoolName}</span>
              <h1 style="margin: 2px 0 0; font-size: 12px; letter-spacing: 0.02em;">EMERGENCY INFO</h1>
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
            <p style="margin: 4px 0 0 0; font-size: 8px; color: #94a3b8; text-align: center;"><strong>SCAN FOR</strong><br/>Student Profile</p>
          </div>
          
          <!-- Right Section - Emergency Info - Same structure as front -->
          <div style="flex: 1; display: flex; flex-direction: column; justify-content: space-between;">
            <!-- Medical Info -->
            <div style="margin-bottom: 0px;">
              <div style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 1px; font-size: 11px;">
                <strong style="color: #f8fafc;">Blood Group</strong>
                <span style="color: #f59e0b; font-weight: 600;">${data.bloodGroup || 'N/A'}</span>
              </div>
              <div style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 1px; font-size: 11px;">
                <strong style="color: #f8fafc;">Allergies</strong>
                <span>None on record</span>
              </div>
            </div>
            
            <!-- Emergency Contacts -->
            <div style="font-size: 9px;">
              ${data.fatherName ? `<div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:1px;"><strong style="color:#f8fafc;">Father</strong><span>${data.fatherName}</span></div>` : ''}
              ${data.motherName ? `<div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:1px;"><strong style="color:#f8fafc;">Mother</strong><span>${data.motherName}</span></div>` : ''}
              ${data.phone ? `<div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:1px;"><strong style="color:#f8fafc;">Emergency</strong><span>${data.phone}</span></div>` : ''}
            </div>
            
            <!-- Status Badges -->
            <div style="font-size: 9px;">
              <div style="display: flex; gap: 2px; flex-wrap: wrap;">
                <span style="padding: 1px 4px; background: #22c55e; color: #86efac; border-radius: 999px; font-size: 7px; font-weight: 500;">Active</span>
                <span style="padding: 1px 4px; background: #3b82f6; color: #93c5fd; border-radius: 999px; font-size: 7px; font-weight: 500;">${data.academicYear || '2024-25'}</span>
                ${data.transportRoute ? `<span style="padding: 1px 4px; background: #fb923c; color: #fbbf24; border-radius: 999px; font-size: 7px; font-weight: 500;">Bus</span>` : ''}
              </div>
            </div>
          </div>
        </div>
      </div>
    `.trim();
  } else {
    // Front side design (existing)
    return `
      <div style="width: 325px; height: 203px; border-radius: 16px; overflow: hidden; box-shadow: 0 25px 50px rgba(15,23,42,0.5); background: #1f2937; border: 1px solid rgba(255,255,255,0.1);">
        <!-- Header Section -->
        <div style="padding: 12px 16px; background: #2563eb; color: #f8fafc; display: flex; align-items: center; justify-content: space-between;">
          <div style="display: flex; align-items: center; gap: 10px;">
            ${logoBlock}
            <div>
              <span style="display: inline-flex; font-size: 9px; padding: 2px 6px; border-radius: 999px; background: #3b82f6; color: #93c5fd; letter-spacing: 0.08em; font-weight: 600;">${data.schoolName}</span>
              <h1 style="margin: 2px 0 0; font-size: 12px; letter-spacing: 0.02em;">STUDENT ID CARD</h1>
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
          
          <!-- Right Section - Student Information -->
          <div style="flex: 1; display: flex; flex-direction: column; justify-content: space-between;">
            <!-- Basic Info -->
            <div style="margin-bottom: 0px;">
              <div style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 1px; font-size: 11px;">
                <strong style="color: #f8fafc;">Name</strong>
                <span>${data.name}</span>
              </div>
              <div style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 1px; font-size: 11px;">
                <strong style="color: #f8fafc;">Admission No</strong>
                <span>${data.admissionNo}</span>
              </div>
              <div style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 1px; font-size: 11px;">
                <strong style="color: #f8fafc;">Class</strong>
                <span style="color: #ef4444; font-weight: 600;">${data.className}</span>
              </div>
            </div>
            
            <!-- Additional Info -->
            <div style="font-size: 9px;">
              ${data.bloodGroup ? `<div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:1px;"><strong style="color:#f8fafc;">Blood Group</strong><span style="color: #f59e0b; font-weight: 500;">${data.bloodGroup}</span></div>` : ''}
              ${data.academicYear ? `<div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:1px;"><strong style="color:#f8fafc;">Academic Year</strong><span>${data.academicYear}</span></div>` : ''}
              ${data.phone ? `<div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:1px;"><strong style="color:#f8fafc;">Phone</strong><span>${data.phone}</span></div>` : ''}
              ${data.address ? `<div style="margin-top:2px;font-size:8px;color:#94a3b8;line-height:1.1;"><strong style="color:#f8fafc;">Address:</strong> ${data.address}</div>` : ''}
            </div>
          </div>
        </div>
      </div>
    `.trim();
  }
};

export async function buildStudentIdCardSnippet(data: StudentIdCardData, showBack: boolean = false) {
  return await createCardContent(data, showBack);
}

export async function buildStudentIdCardDocument(data: StudentIdCardData, showBack: boolean = false) {
  const content = await createCardContent(data, showBack);
  return `<!doctype html>
    <html>
      <head>
        <meta charset="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
        <title>ID Card</title>
        <style>
          body { margin: 0; background: #0f172a; display: flex; justify-content: center; align-items: center; min-height: 100vh; padding: 20px; }
        </style>
      </head>
      <body>
        ${content}
      </body>
    </html>`;
}
