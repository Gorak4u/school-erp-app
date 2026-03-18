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
}

const createCardContent = (data: StudentIdCardData) => {
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

  return `
    <div style="width: 325px; height: 203px; border-radius: 16px; overflow: hidden; box-shadow: 0 25px 50px rgba(15,23,42,0.5); background: linear-gradient(145deg, #1f2937, #111827); border: 1px solid rgba(255,255,255,0.1);">
      <!-- Header Section -->
      <div style="padding: 12px 16px; background: linear-gradient(135deg, #2563eb, #1e40af); color: #f8fafc; display: flex; align-items: center; justify-content: space-between;">
        <div style="display: flex; align-items: center; gap: 10px;">
          ${logoBlock}
          <div>
            <span style="display: inline-flex; font-size: 9px; padding: 2px 6px; border-radius: 999px; background: rgba(59,130,246,0.2); color: #93c5fd; letter-spacing: 0.08em; font-weight: 600;">${data.schoolName}</span>
            <h1 style="margin: 2px 0 0; font-size: 12px; letter-spacing: 0.02em;">STUDENT ID CARD</h1>
          </div>
        </div>
        <p style="margin: 0; font-size: 8px; color: rgba(248,250,252,0.8); text-align: right;">Issued: ${issueDate}</p>
      </div>
      
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
};

export function buildStudentIdCardSnippet(data: StudentIdCardData) {
  return createCardContent(data);
}

export function buildStudentIdCardDocument(data: StudentIdCardData) {
  const content = createCardContent(data);
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
