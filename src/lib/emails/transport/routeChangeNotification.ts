export const routeChangeNotificationTemplate = (data: {
  studentName: string;
  oldRoute?: string;
  newRoute: string;
  routeNumber: string;
  pickupStop: string;
  dropStop?: string;
  monthlyFee: number;
  effectiveDate: string;
  schoolName: string;
}) => `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Transport Route Change Notification</title>
</head>
<body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
  <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 30px; border-radius: 10px 10px 0 0; text-align: center;">
    <h1 style="color: white; margin: 0; font-size: 24px;">🚌 Transport Route Update</h1>
  </div>
  
  <div style="background: #f9fafb; padding: 30px; border-radius: 0 0 10px 10px; border: 1px solid #e5e7eb;">
    <p style="font-size: 16px; margin-bottom: 20px;">Dear Parent/Guardian,</p>
    
    <p style="font-size: 14px; margin-bottom: 20px;">
      This is to inform you that the transport route for <strong>${data.studentName}</strong> has been updated.
    </p>
    
    <div style="background: white; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #667eea;">
      <h3 style="margin-top: 0; color: #667eea;">Route Details</h3>
      
      ${data.oldRoute ? `
      <div style="margin-bottom: 15px; padding-bottom: 15px; border-bottom: 1px solid #e5e7eb;">
        <p style="margin: 5px 0; color: #6b7280;"><strong>Previous Route:</strong> ${data.oldRoute}</p>
      </div>
      ` : ''}
      
      <p style="margin: 5px 0;"><strong>New Route Number:</strong> <span style="color: #667eea; font-size: 18px;">${data.routeNumber}</span></p>
      <p style="margin: 5px 0;"><strong>Route Name:</strong> ${data.newRoute}</p>
      <p style="margin: 5px 0;"><strong>Pickup Stop:</strong> ${data.pickupStop}</p>
      ${data.dropStop ? `<p style="margin: 5px 0;"><strong>Drop Stop:</strong> ${data.dropStop}</p>` : ''}
      <p style="margin: 5px 0;"><strong>Monthly Fee:</strong> ₹${data.monthlyFee.toLocaleString('en-IN')}</p>
      <p style="margin: 5px 0;"><strong>Effective From:</strong> ${data.effectiveDate}</p>
    </div>
    
    <div style="background: #fef3c7; padding: 15px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #f59e0b;">
      <p style="margin: 0; font-size: 14px;">
        <strong>⚠️ Important:</strong> Please ensure your child is ready at the pickup stop 5 minutes before the scheduled time.
      </p>
    </div>
    
    <p style="font-size: 14px; margin-top: 20px;">
      If you have any questions or concerns about this route change, please contact the school transport office.
    </p>
    
    <p style="font-size: 14px; margin-top: 20px;">
      Best regards,<br>
      <strong>${data.schoolName}</strong><br>
      Transport Department
    </p>
  </div>
  
  <div style="text-align: center; margin-top: 20px; padding: 20px; color: #6b7280; font-size: 12px;">
    <p style="margin: 5px 0;">This is an automated notification from ${data.schoolName}</p>
    <p style="margin: 5px 0;">Please do not reply to this email</p>
  </div>
</body>
</html>
`;

export const routeChangeNotificationText = (data: {
  studentName: string;
  oldRoute?: string;
  newRoute: string;
  routeNumber: string;
  pickupStop: string;
  dropStop?: string;
  monthlyFee: number;
  effectiveDate: string;
  schoolName: string;
}) => `
Transport Route Update - ${data.schoolName}

Dear Parent/Guardian,

This is to inform you that the transport route for ${data.studentName} has been updated.

Route Details:
${data.oldRoute ? `Previous Route: ${data.oldRoute}\n` : ''}
New Route Number: ${data.routeNumber}
Route Name: ${data.newRoute}
Pickup Stop: ${data.pickupStop}
${data.dropStop ? `Drop Stop: ${data.dropStop}\n` : ''}
Monthly Fee: ₹${data.monthlyFee.toLocaleString('en-IN')}
Effective From: ${data.effectiveDate}

IMPORTANT: Please ensure your child is ready at the pickup stop 5 minutes before the scheduled time.

If you have any questions or concerns about this route change, please contact the school transport office.

Best regards,
${data.schoolName}
Transport Department

---
This is an automated notification. Please do not reply to this email.
`;
