import { NextResponse } from 'next/server';
import path from 'path';
import fs from 'fs/promises';
import { existsSync } from 'fs';

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const uploadDir = path.join(process.cwd(), 'uploads');
    const files = await fs.readdir(uploadDir);
    const fileName = files.find((file) => file.startsWith(id));
    if (!fileName) {
      return NextResponse.json({ error: 'File not found' }, { status: 404 });
    }

    const filePath = path.join(uploadDir, fileName);
    if (!existsSync(filePath)) {
      return NextResponse.json({ error: 'File not found' }, { status: 404 });
    }

    const stats = await fs.stat(filePath);
    const originalName = fileName.replace(`${id}-`, '');
    const url = new URL(request.url);
    const download = url.searchParams.get('download') === 'true';

    if (download) {
      const fileBuffer = await fs.readFile(filePath);
      return new NextResponse(fileBuffer, {
        headers: {
          'Content-Type': 'application/octet-stream',
          'Content-Disposition': `attachment; filename="${originalName}"`,
          'Content-Length': stats.size.toString(),
        },
      });
    }

    return NextResponse.json({
      id,
      originalName,
      size: stats.size,
      createdAt: stats.birthtime.toISOString(),
    });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}
