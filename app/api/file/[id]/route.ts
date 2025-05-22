import { NextResponse } from 'next/server';
import path from 'path';
import fs from 'fs';

const uploadDir = path.join(process.cwd(), 'uploads');

export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  const { id } = params;

  const metadataPath = path.join(uploadDir, `${id}.json`);
  if (!fs.existsSync(metadataPath)) {
    return NextResponse.json({ error: 'File not found' }, { status: 404 });
  }

  const metadata = JSON.parse(fs.readFileSync(metadataPath, 'utf-8'));

  // If ?download=true, serve the actual file for download
  const url = new URL(request.url);
  if (url.searchParams.get('download') === 'true') {
    if (!fs.existsSync(metadata.path)) {
      return NextResponse.json({ error: 'File not found' }, { status: 404 });
    }
    const fileBuffer = fs.readFileSync(metadata.path);
    return new NextResponse(fileBuffer, {
      status: 200,
      headers: {
        'Content-Type': 'application/octet-stream',
        'Content-Disposition': `attachment; filename="${metadata.originalName}"`,
      },
    });
  }

  // Otherwise return metadata json
  return NextResponse.json(metadata);
}
