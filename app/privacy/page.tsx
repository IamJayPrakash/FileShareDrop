import React from 'react';
import { Button } from '../../components/ui/button';
import Link from 'next/link';

export default function PrivacyPage() {
  return (
    <div className="min-h-screen px-4 py-20 bg-background text-foreground flex flex-col items-center justify-center">
      <div className="max-w-2xl w-full mx-auto">
        <h1 className="mb-6 text-5xl font-extrabold text-primary drop-shadow-lg text-ellipsis text-center">
          Privacy Policy
        </h1>
        <p className="text-lg text-muted-foreground mb-6 text-center">
          Your privacy is important to us. File Share Drop is designed for
          secure, private, and ephemeral file sharing. We do not store your
          files or personal data longer than necessary.
        </p>
        <ul className="list-disc pl-6 space-y-3 text-lg text-muted-foreground mb-8">
          <li>
            <span className="font-semibold">No File Retention:</span> Files are
            deleted automatically after 24 hours or after download.
          </li>
          <li>
            <span className="font-semibold">End-to-End Encryption:</span> Files
            are encrypted in your browser before upload and decrypted only by
            the recipient.
          </li>
          <li>
            <span className="font-semibold">No Tracking:</span> We do not use
            cookies or trackers for advertising or analytics.
          </li>
          <li>
            <span className="font-semibold">Minimal Metadata:</span> Only
            essential metadata (like file size and type) is temporarily stored
            to facilitate transfers.
          </li>
          <li>
            <span className="font-semibold">Open Source:</span> Our code is open
            for review and contributions on GitHub.
          </li>
        </ul>
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Button asChild className="w-full sm:w-auto">
            <Link href="/">Back to Home</Link>
          </Button>
          <Button asChild variant="ghost" className="w-full sm:w-auto">
            <a
              href="https://github.com/IamJayPrakash/FileShareDrop"
              target="_blank"
              rel="noopener noreferrer"
            >
              Star on GitHub
            </a>
          </Button>
        </div>
      </div>
    </div>
  );
}
