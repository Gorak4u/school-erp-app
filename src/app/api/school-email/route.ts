import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { sendSchoolEmail } from '@/lib/email';

/**
 * Utility endpoint for sending school-level emails
 * Uses school's own SMTP configuration (SchoolSetting group: smtp)
 * 
 * Usage examples:
 * - Fee receipts
 * - School notifications
 * - Admission confirmations
 * - Attendance reminders
 * 
 * Do NOT use for:
 * - Password reset (use /api/auth/forgot-password)
 * - Subscription emails (use SaaS email)
 * - Platform notifications (use SaaS email)
 */
export async function POST(req: Request) {
  try {
    const session = await getServerSession();
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { to, subject, html } = await req.json();

    if (!to || !subject || !html) {
      return NextResponse.json({ error: 'to, subject, and html are required' }, { status: 400 });
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(to)) {
      return NextResponse.json({ error: 'Invalid email address' }, { status: 400 });
    }

    const result = await sendSchoolEmail({ to, subject, html });

    if (result.success) {
      return NextResponse.json({ 
        success: true, 
        message: 'School email sent successfully',
        devMode: result.devMode || false 
      });
    } else {
      return NextResponse.json({ 
        error: 'Failed to send school email', 
        details: result.error 
      }, { status: 500 });
    }
  } catch (error: any) {
    console.error('School email API error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
