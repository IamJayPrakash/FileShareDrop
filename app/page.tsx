'use client';

import { useState } from 'react';
import QRCode from 'react-qr-code';
import { v4 as uuidv4 } from 'uuid';

export default function Home() {
  const [file, setFile] = useState<File | null>(null);
  const [shareId, setShareId] = useState<string | null>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0] || null;
    setFile(selectedFile);
  };

  const generateLink = () => {
    if (!file) return;
    const id = uuidv4();
    setShareId(id);
    // Send file to backend later here (not implemented in MVP)
  };

  return (
    <main className="p-10">
      <h1 className="text-3xl font-bold mb-4">FileShareDrop</h1>
      <input type="file" onChange={handleFileChange} />
      <button
        onClick={generateLink}
        className="bg-blue-500 text-white px-4 py-2 mt-2 rounded"
      >
        Generate Link
      </button>
      {shareId && (
        <div className="mt-4">
          <p className="mb-2">Share this link:</p>
          <a
            className="text-blue-600 underline"
            href={`/share/${shareId}`}
            target="_blank"
          >
            {`${window.location.origin}/share/${shareId}`}
          </a>
          <div className="mt-4">
            <QRCode value={`${window.location.origin}/share/${shareId}`} />
          </div>
        </div>
      )}
    </main>
  );
}
