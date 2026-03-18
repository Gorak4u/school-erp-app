import { NextRequest, NextResponse } from 'next/server';
import { saasPrisma, schoolPrisma } from '@/lib/prisma';

/**
 * Public API for fetching school theme settings
 * Used by school login pages to apply custom themes
 * No authentication required - extracts school from subdomain
 */
export async function GET(request: NextRequest) {
  try {
    const host = request.headers.get('host') || '';
    const appDomain = process.env.NEXT_PUBLIC_APP_DOMAIN || 'localhost';
    const hostname = host.split(':')[0]; // Remove port
    
    // Extract subdomain from hostname
    let schoolId = null;
    if (appDomain === 'localhost') {
      if (hostname.endsWith('.localhost')) {
        const subdomain = hostname.slice(0, -('.localhost'.length));
        // Find school by domain (School model is in saas schema)
        const school = await (saasPrisma as any).school.findUnique({
          where: { domain: subdomain }
        });
        schoolId = school?.id;
      }
    } else {
      if (hostname.endsWith('.' + appDomain)) {
        const subdomain = hostname.replace('.' + appDomain, '');
        // Find school by domain (School model is in saas schema)
        const school = await (saasPrisma as any).school.findUnique({
          where: { domain: subdomain }
        });
        schoolId = school?.id;
      }
    }

    if (!schoolId) {
      // Return empty theme settings if no school found
      return NextResponse.json({ 
        theme: null,
        error: 'School not found' 
      }, { status: 404 });
    }

    // Fetch theme settings for this school (SchoolSetting is in school schema)
    const settings = await schoolPrisma.schoolSetting.findMany({
      where: { schoolId, group: 'theme' },
      orderBy: { key: 'asc' }
    });

    // Build theme object
    let themeData = null;
    const themeSetting = settings.find(s => s.key === 'theme');
    
    if (themeSetting?.value) {
      try {
        themeData = JSON.parse(themeSetting.value);
      } catch (e) {
        console.warn('Failed to parse theme settings for school:', schoolId);
      }
    }

    return NextResponse.json({ 
      theme: themeData,
      schoolId 
    });

  } catch (error: any) {
    console.error('Error fetching school theme:', error);
    return NextResponse.json({ 
      error: 'Failed to fetch theme', 
      details: error.message 
    }, { status: 500 });
  }
}
