import { formidable } from 'formidable';
import { NextResponse } from 'next/server';
import { v4 as uuidv4 } from 'uuid';
import path from 'path';
import fs from 'fs/promises';

const uploadDir = path.join(process.cwd(), 'uploads');
await fs.mkdir(uploadDir, { recursive: true });

export async function POST(request: Request) {
  try {
    const form = formidable({
      uploadDir,
      keepExtensions: true,
      maxFileSize: 50 * 1024 * 1024,
      multiples: false,
    });

    const body = await request.arrayBuffer();
    const stream = require('stream');
    const readable = new stream.Readable();
    readable._read = () => {};
    readable.push(Buffer.from(body));
    readable.push(null);

    const [fields, files] = await form.parse(readable);
    const file = Array.isArray(files.file) ? files.file[0] : files.file;
    if (!file) {
      return NextResponse.json({ error: 'No file uploaded' }, { status: 400 });
    }

    const fileId = uuidv4();
    const filePath = path.join(uploadDir, `${fileId}-${file.originalFilename}`);
    await fs.rename(file.filepath, filePath);

    const url = `${request.headers.get('origin')}/share/${fileId}`;
    const metadata = {
      id: fileId,
      originalName: file.originalFilename,
      size: file.size,
      createdAt: new Date().toISOString(),
    };

    return NextResponse.json({ url, ...metadata });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: 'Upload failed' }, { status: 500 });
  }
}
