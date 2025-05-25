import React from 'react';
import {
  Accordion,
  AccordionItem,
  AccordionTrigger,
  AccordionContent,
} from '@radix-ui/react-accordion';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import {
  HelpCircle,
  Upload,
  Link2,
  Download,
  ShieldCheck,
  Info,
} from 'lucide-react';

export default function HelpPage() {
  return (
    <div className="min-h-screen px-4 py-20 bg-background text-foreground flex flex-col items-center justify-center">
      <div className="max-w-2xl w-full mx-auto">
        <div className="flex flex-col items-center gap-2 mb-8">
          <HelpCircle className="w-12 h-12 text-primary mb-2 animate-bounce" />
          <h1 className="mb-6 text-5xl font-extrabold text-primary drop-shadow-lg text-ellipsis text-center">
            How to Use FileShareDrop
          </h1>
        </div>
        <ol className="list-decimal pl-6 space-y-8 text-lg text-muted-foreground mb-10">
          <li className="flex gap-3 items-start">
            <Upload className="w-6 h-6 text-primary mt-1" />
            <span>
              <span className="font-semibold">Upload Your File:</span> Click the{' '}
              <span className="text-primary font-medium">
                Start Sharing Now
              </span>{' '}
              button or drag & drop your file on the homepage. Max file size is
              50MB.
            </span>
          </li>
          <li className="flex gap-3 items-start">
            <Link2 className="w-6 h-6 text-primary mt-1" />
            <span>
              <span className="font-semibold">Get a Shareable Link:</span> After
              upload, you’ll receive a secure link and QR code. Copy or scan to
              share with your recipient.
            </span>
          </li>
          <li className="flex gap-3 items-start">
            <Download className="w-6 h-6 text-primary mt-1" />
            <span>
              <span className="font-semibold">Recipient Downloads:</span> The
              recipient opens the link, enters the key if required, and
              downloads the file securely.
            </span>
          </li>
          <li className="flex gap-3 items-start">
            <ShieldCheck className="w-6 h-6 text-primary mt-1" />
            <span>
              <span className="font-semibold">Automatic Deletion:</span> Files
              are deleted automatically after 24 hours or after download for
              your privacy.
            </span>
          </li>
        </ol>
        <div className="flex flex-col sm:flex-row gap-4 justify-center mb-10">
          <Button asChild className="w-full sm:w-auto">
            <Link href="/upload">Start Sharing Now</Link>
          </Button>
          <Button asChild variant="outline" className="w-full sm:w-auto">
            <Link href="/">Back to Home</Link>
          </Button>
        </div>
        <div className="mt-12">
          <h2 className="text-2xl font-bold mb-4 flex items-center gap-2">
            <Info className="w-6 h-6 text-primary" />
            Frequently Asked Questions
          </h2>
          <Accordion type="single" collapsible className="w-full space-y-2">
            <AccordionItem
              value="q1"
              className="border rounded-lg bg-muted/50 dark:bg-muted-dark/50"
            >
              <AccordionTrigger className="px-4 py-3 font-semibold">
                Is FileShareDrop free to use?
              </AccordionTrigger>
              <AccordionContent className="px-4 pb-4 text-muted-foreground">
                Yes, FileShareDrop is completely free and open source.
              </AccordionContent>
            </AccordionItem>
            <AccordionItem
              value="q2"
              className="border rounded-lg bg-muted/50 dark:bg-muted-dark/50"
            >
              <AccordionTrigger className="px-4 py-3 font-semibold">
                How secure is my file transfer?
              </AccordionTrigger>
              <AccordionContent className="px-4 pb-4 text-muted-foreground">
                All files are end-to-end encrypted in your browser before
                upload. Only the recipient can decrypt and access the file.
              </AccordionContent>
            </AccordionItem>
            <AccordionItem
              value="q3"
              className="border rounded-lg bg-muted/50 dark:bg-muted-dark/50"
            >
              <AccordionTrigger className="px-4 py-3 font-semibold">
                How long are files stored?
              </AccordionTrigger>
              <AccordionContent className="px-4 pb-4 text-muted-foreground">
                Files are deleted automatically after 24 hours or after they are
                downloaded, whichever comes first.
              </AccordionContent>
            </AccordionItem>
            <AccordionItem
              value="q4"
              className="border rounded-lg bg-muted/50 dark:bg-muted-dark/50"
            >
              <AccordionTrigger className="px-4 py-3 font-semibold">
                What is the maximum file size?
              </AccordionTrigger>
              <AccordionContent className="px-4 pb-4 text-muted-foreground">
                You can upload files up to 50MB each.
              </AccordionContent>
            </AccordionItem>
            <AccordionItem
              value="q5"
              className="border rounded-lg bg-muted/50 dark:bg-muted-dark/50"
            >
              <AccordionTrigger className="px-4 py-3 font-semibold">
                Can I share multiple files at once?
              </AccordionTrigger>
              <AccordionContent className="px-4 pb-4 text-muted-foreground">
                Yes, you can select and share multiple files in a single
                transfer.
              </AccordionContent>
            </AccordionItem>
          </Accordion>
        </div>
      </div>
    </div>
  );
}
