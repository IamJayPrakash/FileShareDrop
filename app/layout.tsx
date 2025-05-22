import { Toaster } from 'sonner';
import './globals.css';
import { Inter } from 'next/font/google';
import { Metadata } from 'next';
import { ReactNode, useState } from 'react';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { Menu, X } from 'lucide-react';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';

const inter = Inter({ subsets: ['latin'], variable: '--font-inter' });

export const metadata: Metadata = {
  title: {
    default: 'FileShareDrop - Secure File Sharing',
    template: '%s | FileShareDrop',
  },
  description:
    'Share files securely with ease. Upload up to 50MB and get a shareable link that expires in 24 hours.',
  keywords: [
    'file sharing',
    'secure upload',
    'file transfer',
    'Next.js',
    'Shadcn UI',
  ],
  openGraph: {
    title: 'FileShareDrop',
    description: 'Fast and secure file sharing platform.',
    url: 'https://file-share-drop.vercel.app',
    images: ['/og-image.jpg'], // Add an OG image in public/
  },
  twitter: {
    card: 'summary_large_image',
    site: '@FileShareDrop',
  },
};

interface RootLayoutProps {
  children: ReactNode;
}

export default function RootLayout({ children }: RootLayoutProps) {
  return (
    <html lang="en" className={inter.variable}>
      <body className="bg-background text-foreground">
        {/* Navbar */}
        <Navbar />
        {/* Main Content */}
        <main>{children}</main>

        {/* Footer */}
        <Footer />
        <Toaster position="top-right" />
      </body>
    </html>
  );
}
