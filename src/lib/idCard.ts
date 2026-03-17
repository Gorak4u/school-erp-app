export interface StudentIdCardData {
  name: string;
  admissionNo: string;
  className: string;
  schoolName: string;
  photo?: string;
  dateOfBirth?: string;
  issueDate?: string;
}

export function generateStudentIdCardHtml(data: StudentIdCardData) {
  const issueDate = data.issueDate || new Date().toISOString().split('T')[0];
  const dobLine = data.dateOfBirth ? `<p style="margin: 0; font-size: 14px; color: #94a3b8;"><strong>DOB:</strong> ${data.dateOfBirth}</p>` : '';
  const photoBlock = data.photo
    ? `<img src="${data.photo}" alt="Student" style="width: 110px; height: 110px; object-fit: cover; border-radius: 12px; border: 3px solid #fff;"/>`
    : `<div style="width: 110px; height: 110px; background: rgba(255,255,255,0.15); border-radius: 12px; display: flex; align-items: center; justify-content: center; font-size: 24px; color: rgba(255,255,255,0.6);">${data.name.charAt(0)}</div>`;

  return `<!doctype html>
<html>
  <head>
    <meta charset="utf-8" />
    <title>ID Card</title>
    <style>
      body {
        font-family: 'Inter', 'Segoe UI', system-ui, sans-serif;
        margin: 0;
        background: #0f172a;
        color: #e2e8f0;
      }
      .card {
        width: 360px;
        margin: 40px auto;
        border-radius: 24px;
        overflow: hidden;
        box-shadow: 0 25px 50px rgba(15,23,42,0.5);
        background: linear-gradient(145deg, #1f2937, #111827);
      }
      .card-header {
        padding: 24px;
        background: linear-gradient(135deg, #2563eb, #1e40af);
        color: #f8fafc;
      }
      .card-header h1 {
        margin: 0;
        font-size: 22px;
        letter-spacing: 0.02em;
      }
      .card body {
        padding: 24px;
      }
      .separator {
        height: 1px;
        background: rgba(255,255,255,0.15);
        margin: 16px 0;
      }
      .badge {
        display: inline-flex;
        font-size: 12px;
        padding: 4px 10px;
        border-radius: 999px;
        background: rgba(59,130,246,0.2);
        color: #93c5fd;
        letter-spacing: 0.08em;
      }
      .info-row {
        display: flex;
        align-items: center;
        justify-content: space-between;
        margin-bottom: 6px;
        font-size: 14px;
      }
      .info-row strong {
        color: #f8fafc;
      }
      .photo-wrapper {
        display: flex;
        justify-content: center;
        margin-top: 20px;
      }
    </style>
  </head>
  <body>
    <div class="card">
      <div class="card-header">
        <div class="badge">${data.schoolName}</div>
        <h1>ID CARD</h1>
        <p style="margin: 8px 0 0; font-size: 12px; color: rgba(248,250,252,0.8)">Issued: ${issueDate}</p>
      </div>
      <div style="padding: 24px;">
        <div class="photo-wrapper">
          ${photoBlock}
        </div>
        <div class="separator"></div>
        <div class="info-row">
          <span><strong>Name</strong></span>
          <span>${data.name}</span>
        </div>
        <div class="info-row">
          <span><strong>Admission No</strong></span>
          <span>${data.admissionNo}</span>
        </div>
        <div class="info-row">
          <span><strong>Class</strong></span>
          <span>${data.className}</span>
        </div>
        ${dobLine}
      </div>
    </div>
  </body>
</html>`;
}
