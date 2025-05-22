import { formidable } from 'formidable';
import { NextResponse } from 'next/server';
import { v4 as uuidv4 } from 'uuid';
import path from 'path';
import fs from 'fs/promises';

// Configure upload directory
const uploadDir = path.join(process.cwd(), 'uploads');
// Ensure upload directory exists
await fs.mkdir(uploadDir, { recursive: true });

export async function POST(request: Request) {
  try {
    // Create formidable form
    const form = formidable({
      uploadDir,
      keepExtensions: true,
      maxFileSize: 50 * 1024 * 1024, // 50MB limit
      multiples: false,
    });

    // Parse the incoming request
    const contentType = request.headers.get('content-type') || '';
    const body = request.body;
    if (!body) {
      return NextResponse.json({ error: 'No body found' }, { status: 400 });
    }
    // @ts-ignore
    const [fields, files] = await new Promise((resolve, reject) => {
      form.parse(
        // @ts-ignore
        {
          headers: { 'content-type': contentType },
          // Convert web ReadableStream to Node.js Readable
          // @ts-ignore
          stream: require('stream').Readable.from(body as any),
        },
        (err, fields, files) => {
          if (err) reject(err);
          else resolve([fields, files]);
        }
      );
    });

    // Get the uploaded file
    const file = Array.isArray(files.file) ? files.file[0] : files.file;
    if (!file) {
      return NextResponse.json({ error: 'No file uploaded' }, { status: 400 });
    }

    // Generate a unique ID for the file
    const fileId = uuidv4();
    const filePath = path.join(uploadDir, `${fileId}-${file.originalFilename}`);

    // Rename the file to include the ID
    await fs.rename(file.filepath, filePath);

    // Generate shareable URL
    const url = `${request.headers.get('origin')}/share/${fileId}`;

    // Store file metadata (e.g., in memory or database)
    const metadata = {
      id: fileId,
      originalName: file.originalFilename,
      size: file.size,
      createdAt: new Date().toISOString(),
    };

    // TODO: Save metadata to a database or file
    // For now, return metadata in response
    return NextResponse.json({ url, ...metadata });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: 'Upload failed' }, { status: 500 });
  }
}
