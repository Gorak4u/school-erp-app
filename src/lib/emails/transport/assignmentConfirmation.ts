export const assignmentConfirmationTemplate = (data: {
  studentName: string;
  routeNumber: string;
  routeName: string;
  pickupStop: string;
  dropStop?: string;
  monthlyFee: number;
  academicYear: string;
  schoolName: string;
}) => `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Transport Assignment Confirmation</title>
</head>
<body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
  <div style="background: linear-gradient(135deg, #10b981 0%, #059669 100%); padding: 30px; border-radius: 10px 10px 0 0; text-align: center;">
    <h1 style="color: white; margin: 0; font-size: 24px;">✅ Transport Assignment Confirmed</h1>
  </div>
  
  <div style="background: #f9fafb; padding: 30px; border-radius: 0 0 10px 10px; border: 1px solid #e5e7eb;">
    <p style="font-size: 16px; margin-bottom: 20px;">Dear Parent/Guardian,</p>
    
    <p style="font-size: 14px; margin-bottom: 20px;">
      We are pleased to confirm that <strong>${data.studentName}</strong> has been successfully assigned to the school transport service for Academic Year <strong>${data.academicYear}</strong>.
    </p>
    
    <div style="background: white; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #10b981;">
      <h3 style="margin-top: 0; color: #10b981;">Transport Details</h3>
      
      <p style="margin: 5px 0;"><strong>Route Number:</strong> <span style="color: #10b981; font-size: 18px;">${data.routeNumber}</span></p>
      <p style="margin: 5px 0;"><strong>Route Name:</strong> ${data.routeName}</p>
      <p style="margin: 5px 0;"><strong>Pickup Stop:</strong> ${data.pickupStop}</p>
      ${data.dropStop ? `<p style="margin: 5px 0;"><strong>Drop Stop:</strong> ${data.dropStop}</p>` : ''}
      <p style="margin: 5px 0;"><strong>Monthly Fee:</strong> ₹${data.monthlyFee.toLocaleString('en-IN')}</p>
      <p style="margin: 5px 0;"><strong>Academic Year:</strong> ${data.academicYear}</p>
    </div>
    
    <div style="background: #dbeafe; padding: 15px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #3b82f6;">
      <h4 style="margin-top: 0; color: #1e40af;">📋 Important Guidelines</h4>
      <ul style="margin: 10px 0; padding-left: 20px;">
        <li style="margin: 5px 0;">Students must be ready at the pickup stop 5 minutes before scheduled time</li>
        <li style="margin: 5px 0;">Transport fees must be paid by the 10th of each month</li>
        <li style="margin: 5px 0;">Inform the school in advance if your child will not use transport on any day</li>
        <li style="margin: 5px 0;">Emergency contact numbers should be updated with the transport office</li>
      </ul>
    </div>
    
    <div style="background: #fef3c7; padding: 15px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #f59e0b;">
      <p style="margin: 0; font-size: 14px;">
        <strong>💰 Payment Information:</strong> Transport fee of ₹${data.monthlyFee.toLocaleString('en-IN')} per month has been added to your fee structure. You can pay through the fee collection portal.
      </p>
    </div>
    
    <p style="font-size: 14px; margin-top: 20px;">
      For any queries regarding transport services, please contact the school transport office during working hours.
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

export const assignmentConfirmationText = (data: {
  studentName: string;
  routeNumber: string;
  routeName: string;
  pickupStop: string;
  dropStop?: string;
  monthlyFee: number;
  academicYear: string;
  schoolName: string;
}) => `
Transport Assignment Confirmation - ${data.schoolName}

Dear Parent/Guardian,

We are pleased to confirm that ${data.studentName} has been successfully assigned to the school transport service for Academic Year ${data.academicYear}.

Transport Details:
Route Number: ${data.routeNumber}
Route Name: ${data.routeName}
Pickup Stop: ${data.pickupStop}
${data.dropStop ? `Drop Stop: ${data.dropStop}\n` : ''}
Monthly Fee: ₹${data.monthlyFee.toLocaleString('en-IN')}
Academic Year: ${data.academicYear}

Important Guidelines:
- Students must be ready at the pickup stop 5 minutes before scheduled time
- Transport fees must be paid by the 10th of each month
- Inform the school in advance if your child will not use transport on any day
- Emergency contact numbers should be updated with the transport office

Payment Information: Transport fee of ₹${data.monthlyFee.toLocaleString('en-IN')} per month has been added to your fee structure. You can pay through the fee collection portal.

For any queries regarding transport services, please contact the school transport office during working hours.

Best regards,
${data.schoolName}
Transport Department

---
This is an automated notification. Please do not reply to this email.
`;
