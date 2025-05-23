import { Toaster } from 'sonner';
import './globals.css';
import { Inter } from 'next/font/google';
import { Metadata } from 'next';
import { ReactNode } from 'react';
import { ThemeProvider } from '@/components/ThemeProvider';
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
    'filesharedrop',
    'temporary file sharing',
    'privacy-focused file sharing',
    'end-to-end encryption',
    'file sharing platform',
    'upload files',
    'share files',
    'file sharing service',
    'file sharing website',
    'file sharing app',
    'file sharing solution',
    'file sharing for developers',
    'file sharing for businesses',
    'file sharing for teams',
    'file sharing for individuals',
    'file sharing for students',
    'file sharing for professionals',
    'file sharing for creatives',
    'file sharing for designers',
    'file sharing for marketers',
    'file sharing for educators',
    'file sharing for freelancers',
    'file sharing for creatives',
    'file sharing for photographers',
    'online file sharing',
    'file sharing with expiration',
    'file sharing with encryption',
    'file sharing with password protection',
    'file sharing with tracking',
    'file sharing with analytics',
    'file sharing with collaboration',
    'zip file sharing',
    'file sharing with comments',
    'file sharing with feedback',
    'file sharing with versioning',
    'file sharing with integrations',
    'file sharing with API',
    'file sharing with mobile app',
    'file sharing with desktop app',
    'file sharing with browser extension',
    'file sharing with cloud storage',
    'file sharing with social media',
    'file sharing with email',
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
        <ThemeProvider>
          {/* Navbar */}
          <Navbar />
          {/* Main Content */}
          <main>{children}</main>

          {/* Footer */}
          <Footer />
          <Toaster position="bottom-right" richColors closeButton />
        </ThemeProvider>
      </body>
    </html>
  );
}
