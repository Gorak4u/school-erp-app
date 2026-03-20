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

    // Check content length before parsing
    const contentLength = req.headers.get('content-length');
    if (contentLength && parseInt(contentLength) > 50 * 1024 * 1024) { // 50MB limit
      return NextResponse.json({ 
        error: 'Request body too large. Maximum size is 50MB.' 
      }, { status: 413 });
    }

    let body;
    try {
      body = await req.json();
    } catch (parseError) {
      console.error('JSON parse error:', parseError);
      return NextResponse.json({ 
        error: 'Invalid JSON format. Request body may be too large or malformed.' 
      }, { status: 400 });
    }

    const { to, subject, html } = body;

    if (!to || !subject || !html) {
      return NextResponse.json({ error: 'to, subject, and html are required' }, { status: 400 });
    }

    // Check HTML content size
    if (html.length > 40 * 1024 * 1024) { // 40MB limit for HTML content
      return NextResponse.json({ 
        error: 'Email content too large. Maximum HTML size is 40MB.' 
      }, { status: 413 });
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
    return NextResponse.json({ 
      error: error.message || 'Internal server error' 
    }, { status: 500 });
  }
}
