import { NextRequest, NextResponse } from 'next/server';
import { saasPrisma } from '@/lib/prisma';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const subdomain = searchParams.get('subdomain')?.toLowerCase().trim();

    if (!subdomain) {
      return NextResponse.json({ error: 'subdomain is required' }, { status: 400 });
    }

    const school = await (saasPrisma as any).school.findUnique({
      where: { subdomain },
      select: {
        id: true,
        name: true,
        slug: true,
        subdomain: true,
        logo: true,
        city: true,
        state: true,
        isActive: true,
      },
    });

    if (!school) {
      return NextResponse.json({ error: 'School not found' }, { status: 404 });
    }

    if (!school.isActive) {
      return NextResponse.json({ error: 'School account is inactive' }, { status: 403 });
    }

    return NextResponse.json({ school });
  } catch (error: any) {
    console.error('GET /api/school/by-subdomain:', error);
    return NextResponse.json({ error: 'Failed to look up school' }, { status: 500 });
  }
}
