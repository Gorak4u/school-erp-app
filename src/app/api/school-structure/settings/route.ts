import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const group = searchParams.get('group');

    const where = group ? { group } : {};

    const settings = await prisma.schoolSetting.findMany({ where, orderBy: { key: 'asc' } });

    // Convert to a grouped object for easy consumption
    const grouped: Record<string, Record<string, string>> = {};
    for (const s of settings) {
      if (!grouped[s.group]) grouped[s.group] = {};
      grouped[s.group][s.key] = s.value;
    }

    return NextResponse.json({ settings: grouped });
  } catch (error: any) {
    console.error('Error fetching settings:', error);
    return NextResponse.json({ error: 'Failed to fetch settings', details: error.message }, { status: 500 });
  }
}

// Upsert a single setting
export async function POST(request: NextRequest) {
  try {
    const { group, key, value } = await request.json();

    const setting = await prisma.schoolSetting.upsert({
      where: { group_key: { group, key } },
      update: { value },
      create: { group, key, value },
    });

    return NextResponse.json({ setting }, { status: 201 });
  } catch (error: any) {
    console.error('Error saving setting:', error);
    return NextResponse.json({ error: 'Failed to save setting', details: error.message }, { status: 500 });
  }
}

// Batch upsert: save an entire group at once
export async function PUT(request: NextRequest) {
  try {
    const { group, settings } = await request.json() as { group: string; settings: Record<string, string> };

    const ops = Object.entries(settings).map(([key, value]) =>
      prisma.schoolSetting.upsert({
        where: { group_key: { group, key } },
        update: { value },
        create: { group, key, value },
      })
    );

    await prisma.$transaction(ops);

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('Error batch-saving settings:', error);
    return NextResponse.json({ error: 'Failed to save settings', details: error.message }, { status: 500 });
  }
}
