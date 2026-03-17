export interface StudentIdCardData {
  name: string;
  admissionNo: string;
  className: string;
  schoolName: string;
  photo?: string;
  dateOfBirth?: string;
  issueDate?: string;
}

const createCardContent = (data: StudentIdCardData) => {
  const issueDate = data.issueDate || new Date().toISOString().split('T')[0];
  const dobLine = data.dateOfBirth
    ? `<p style="margin: 0; font-size: 14px; color: #94a3b8;"><strong>DOB:</strong> ${data.dateOfBirth}</p>`
    : '';
  const photoBlock = data.photo
    ? `<img src="${data.photo}" alt="Student" style="width: 110px; height: 110px; object-fit: cover; border-radius: 12px; border: 3px solid #fff;"/>`
    : `<div style="width: 110px; height: 110px; background: rgba(255,255,255,0.15); border-radius: 12px; display: flex; align-items: center; justify-content: center; font-size: 24px; color: rgba(255,255,255,0.6);">${data.name.charAt(0)}</div>`;

  return `
    <div style="width: 360px; border-radius: 24px; overflow: hidden; box-shadow: 0 25px 50px rgba(15,23,42,0.5); background: linear-gradient(145deg, #1f2937, #111827);">
      <div style="padding: 24px; background: linear-gradient(135deg, #2563eb, #1e40af); color: #f8fafc;">
        <span style="display: inline-flex; font-size: 12px; padding: 4px 10px; border-radius: 999px; background: rgba(59,130,246,0.2); color: #93c5fd; letter-spacing: 0.08em;">${data.schoolName}</span>
        <h1 style="margin: 8px 0 0; font-size: 22px; letter-spacing: 0.02em;">ID CARD</h1>
        <p style="margin: 8px 0 0; font-size: 12px; color: rgba(248,250,252,0.8);">Issued: ${issueDate}</p>
      </div>
      <div style="padding: 24px; color: #e2e8f0; font-family: 'Inter', 'Segoe UI', system-ui, sans-serif;">
        <div style="display: flex; justify-content: center; margin-top: 20px;">${photoBlock}</div>
        <div style="height: 1px; background: rgba(255,255,255,0.15); margin: 16px 0;"></div>
        <div style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 6px; font-size: 14px;">
          <strong style="color: #f8fafc;">Name</strong>
          <span>${data.name}</span>
        </div>
        <div style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 6px; font-size: 14px;">
          <strong style="color: #f8fafc;">Admission No</strong>
          <span>${data.admissionNo}</span>
        </div>
        <div style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 6px; font-size: 14px;">
          <strong style="color: #f8fafc;">Class</strong>
          <span>${data.className}</span>
        </div>
        ${dobLine}
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
          body { margin: 0; background: #0f172a; display: flex; justify-content: center; padding: 40px; }
        </style>
      </head>
      <body>
        ${content}
      </body>
    </html>`;
}
