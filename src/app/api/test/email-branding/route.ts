import { NextResponse } from 'next/server';
import { wrapEmailWithBranding } from '@/lib/email';
import { saasPrisma } from '@/lib/prisma';

export async function GET() {
  try {
    // Get first school for testing
    const school = await (saasPrisma as any).school.findFirst({
      select: { id: true, name: true }
    });

    if (!school) {
      return NextResponse.json({ error: 'No school found' }, { status: 404 });
    }

    // Test email branding
    const testHtml = '<h1>Test Email</h1><p>This is a test email.</p>';
    const brandedHtml = await wrapEmailWithBranding(testHtml, school.id);

    return NextResponse.json({
      success: true,
      schoolId: school.id,
      schoolName: school.name,
      brandedHtml: brandedHtml.substring(0, 500) + '...', // First 500 chars
    });
  } catch (error: any) {
    return NextResponse.json({
      error: error.message,
      stack: error.stack,
    }, { status: 500 });
  }
}
