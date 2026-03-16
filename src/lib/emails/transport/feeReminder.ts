export const transportFeeReminderTemplate = (data: {
  studentName: string;
  routeNumber: string;
  routeName: string;
  monthlyFee: number;
  dueDate: string;
  pendingAmount: number;
  academicYear: string;
  schoolName: string;
  isOverdue?: boolean;
}) => `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Transport Fee ${data.isOverdue ? 'Overdue' : 'Reminder'}</title>
</head>
<body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
  <div style="background: linear-gradient(135deg, ${data.isOverdue ? '#ef4444' : '#f59e0b'} 0%, ${data.isOverdue ? '#dc2626' : '#d97706'} 100%); padding: 30px; border-radius: 10px 10px 0 0; text-align: center;">
    <h1 style="color: white; margin: 0; font-size: 24px;">💰 Transport Fee ${data.isOverdue ? 'Overdue Notice' : 'Reminder'}</h1>
  </div>
  
  <div style="background: #f9fafb; padding: 30px; border-radius: 0 0 10px 10px; border: 1px solid #e5e7eb;">
    <p style="font-size: 16px; margin-bottom: 20px;">Dear Parent/Guardian,</p>
    
    <p style="font-size: 14px; margin-bottom: 20px;">
      This is a ${data.isOverdue ? '<strong style="color: #dc2626;">reminder that the transport fee payment is overdue</strong>' : 'friendly reminder about the upcoming transport fee payment'} for <strong>${data.studentName}</strong>.
    </p>
    
    <div style="background: white; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid ${data.isOverdue ? '#ef4444' : '#f59e0b'};">
      <h3 style="margin-top: 0; color: ${data.isOverdue ? '#dc2626' : '#d97706'};">Payment Details</h3>
      
      <p style="margin: 5px 0;"><strong>Student Name:</strong> ${data.studentName}</p>
      <p style="margin: 5px 0;"><strong>Route Number:</strong> ${data.routeNumber}</p>
      <p style="margin: 5px 0;"><strong>Route Name:</strong> ${data.routeName}</p>
      <p style="margin: 5px 0;"><strong>Monthly Fee:</strong> ₹${data.monthlyFee.toLocaleString('en-IN')}</p>
      <p style="margin: 5px 0;"><strong>Pending Amount:</strong> <span style="color: ${data.isOverdue ? '#dc2626' : '#d97706'}; font-size: 20px; font-weight: bold;">₹${data.pendingAmount.toLocaleString('en-IN')}</span></p>
      <p style="margin: 5px 0;"><strong>Due Date:</strong> ${data.dueDate}</p>
      <p style="margin: 5px 0;"><strong>Academic Year:</strong> ${data.academicYear}</p>
    </div>
    
    ${data.isOverdue ? `
    <div style="background: #fee2e2; padding: 15px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #dc2626;">
      <p style="margin: 0; font-size: 14px; color: #991b1b;">
        <strong>⚠️ OVERDUE NOTICE:</strong> This payment is now overdue. Please make the payment immediately to avoid disruption of transport services.
      </p>
    </div>
    ` : `
    <div style="background: #fef3c7; padding: 15px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #f59e0b;">
      <p style="margin: 0; font-size: 14px;">
        <strong>📅 Payment Due:</strong> Please ensure payment is made by ${data.dueDate} to avoid late fees and service disruption.
      </p>
    </div>
    `}
    
    <div style="background: #dbeafe; padding: 15px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #3b82f6;">
      <h4 style="margin-top: 0; color: #1e40af;">💳 Payment Methods</h4>
      <ul style="margin: 10px 0; padding-left: 20px;">
        <li style="margin: 5px 0;">Online Payment: Login to the fee collection portal</li>
        <li style="margin: 5px 0;">Bank Transfer: Use school account details</li>
        <li style="margin: 5px 0;">Cash/Cheque: Visit the school accounts office</li>
      </ul>
    </div>
    
    <div style="text-align: center; margin: 30px 0;">
      <a href="#" style="display: inline-block; background: #3b82f6; color: white; padding: 12px 30px; text-decoration: none; border-radius: 6px; font-weight: bold;">Pay Now</a>
    </div>
    
    <p style="font-size: 14px; margin-top: 20px;">
      For any payment-related queries, please contact the school accounts office during working hours.
    </p>
    
    <p style="font-size: 14px; margin-top: 20px;">
      Best regards,<br>
      <strong>${data.schoolName}</strong><br>
      Accounts Department
    </p>
  </div>
  
  <div style="text-align: center; margin-top: 20px; padding: 20px; color: #6b7280; font-size: 12px;">
    <p style="margin: 5px 0;">This is an automated notification from ${data.schoolName}</p>
    <p style="margin: 5px 0;">Please do not reply to this email</p>
  </div>
</body>
</html>
`;

export const transportFeeReminderText = (data: {
  studentName: string;
  routeNumber: string;
  routeName: string;
  monthlyFee: number;
  dueDate: string;
  pendingAmount: number;
  academicYear: string;
  schoolName: string;
  isOverdue?: boolean;
}) => `
Transport Fee ${data.isOverdue ? 'Overdue Notice' : 'Reminder'} - ${data.schoolName}

Dear Parent/Guardian,

This is a ${data.isOverdue ? 'reminder that the transport fee payment is OVERDUE' : 'friendly reminder about the upcoming transport fee payment'} for ${data.studentName}.

Payment Details:
Student Name: ${data.studentName}
Route Number: ${data.routeNumber}
Route Name: ${data.routeName}
Monthly Fee: ₹${data.monthlyFee.toLocaleString('en-IN')}
Pending Amount: ₹${data.pendingAmount.toLocaleString('en-IN')}
Due Date: ${data.dueDate}
Academic Year: ${data.academicYear}

${data.isOverdue ? 
`OVERDUE NOTICE: This payment is now overdue. Please make the payment immediately to avoid disruption of transport services.` :
`Payment Due: Please ensure payment is made by ${data.dueDate} to avoid late fees and service disruption.`}

Payment Methods:
- Online Payment: Login to the fee collection portal
- Bank Transfer: Use school account details
- Cash/Cheque: Visit the school accounts office

For any payment-related queries, please contact the school accounts office during working hours.

Best regards,
${data.schoolName}
Accounts Department

---
This is an automated notification. Please do not reply to this email.
`;
