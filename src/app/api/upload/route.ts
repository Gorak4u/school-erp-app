import { NextRequest, NextResponse } from 'next/server';
import { writeFile, mkdir } from 'fs/promises';
import path from 'path';

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get('file') as File;
    const type = formData.get('type') as string || 'general';

    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 });
    }

    // Validate file type
    const allowedTypes = ['image/png', 'image/jpeg', 'image/jpg', 'image/webp', 'image/svg+xml'];
    if (!allowedTypes.includes(file.type)) {
      return NextResponse.json({ error: 'Invalid file type. Allowed: PNG, JPG, WEBP, SVG' }, { status: 400 });
    }

    // Max 2MB
    if (file.size > 2 * 1024 * 1024) {
      return NextResponse.json({ error: 'File too large. Max 2MB.' }, { status: 400 });
    }

    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    const ext = file.name.split('.').pop() || 'png';
    const filename = `${type}_${Date.now()}.${ext}`;
    const uploadDir = path.join(process.cwd(), 'public', 'uploads');

    await mkdir(uploadDir, { recursive: true });
    const filePath = path.join(uploadDir, filename);
    await writeFile(filePath, buffer);

    const url = `/uploads/${filename}`;
    return NextResponse.json({ url, filename }, { status: 201 });
  } catch (error: any) {
    console.error('Upload error:', error);
    return NextResponse.json({ error: error.message || 'Upload failed' }, { status: 500 });
  }
}
