import './globals.css';
import { Inter } from 'next/font/google';
import { Metadata } from 'next';
import { ReactNode } from 'react';
import { ThemeProvider } from '@/components/ThemeProvider';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import { Toaster } from 'sonner';
import Head from 'next/head';

const inter = Inter({ subsets: ['latin'], variable: '--font-inter' });

export const metadata: Metadata = {
  metadataBase: new URL('https://file-share-drop.vercel.app'),
  title: {
    default: 'FileShareDrop - Free File Sharing & Secure File Transfer',
    template: '%s | FileShareDrop',
  },
  description:
    'FileShareDrop is the ultimate tool for fast, secure, and anonymous file sharing. Upload up to 50MB and generate a private, auto-expiring download link. No signup required!',
  keywords: [
    'filesharedrop',
    'file share drop',
    'file share drop app',
    'file share drop site',
    'file share drop online file transfer',
    'file share drop vercel',
    'file share drop file sharing',
    'file share drop file transfer',
    'file share drop upload',
    'file share drop file upload',
    'file share drop file sharing site',
    'file share drop file transfer app',
    'file share drop online file sharing',
    'file share drop secure file sharing',
    'file share drop send files online',
    'file share drop share files',
    'file share drop file upload site',
    'file share drop upload files',
    'file-share-drop',
    'file-share-drop.com',
    'file-share-drop app',
    'file-share-drop vercel app',
    'https://file-share-drop.vercel.app/',
    'file-share-drop vercel site',
    'file-share-drop site',
    'file-share-drop online file transfer',
    'file-share-drop.vercel.app',
    'file-share-drop file sharing',
    'file-share-drop file transfer',
    'file-share-drop upload',
    'file-share-drop file upload',
    'file-share-drop file sharing site',
    'file-share-drop file transfer app',
    'file-share-drop online file sharing',
    'file-share-drop secure file sharing',
    'file-share-drop send files online',
    'file-share-drop share files',
    'file-share-drop file upload site',
    'file-share-drop upload files',
    'file-share-drop temporary file upload',
    'filesharedrop.com',
    'filesharedrop app',
    'filesharedrop site',
    'filesharedrop online file transfer',
    'filesharedrop.vercel.app',
    'filesharedrop file sharing',
    'filesharedrop file transfer',
    'filesharedrop upload',
    'filesharedrop file upload',
    'filesharedrop file sharing site',
    'filesharedrop file transfer app',
    'filesharedrop online file sharing',
    'filesharedrop secure file sharing',
    'filesharedrop send files online',
    'filesharedrop share files',
    'filesharedrop file upload site',
    'filesharedrop upload files',
    'filesharedrop temporary file upload',
    'filesharedrop anonymous file sharing',
    'filesharedrop transfer files',
    'file sharedrop file drop',
    'online file share',
    'online file share by link',
    'online zip file share',
    'folder share',
    'transfer zip file',
    'online file transfer',
    'online file transfer by link',
    'filesharedroponline',
    'filesharedrop vercel',
    'file sharing',
    'file sharing site',
    'fast file sharing',
    'fast share files',
    'large file share',
    'large file transfer',
    'large file upload',
    'large file sharing site',
    'large file transfer site',
    'large file upload site',
    'file sharing without registration',
    'file sharing without signup',
    'online file sharing',
    'file transfer',
    'secure file sharing',
    'send files online',
    'share files',
    'file upload',
    'upload files',
    'temporary file upload',
    'anonymous file sharing',
    'transfer files',
    'file drop',
    'file sharing without registration',
    'file sharing without signup',
    'free file sharing',
    'file sharing without account',
    'free online file sharing',
    'free file transfer',
    'no signup file sharing',
    'no registration file sharing',
    'file sharing without login',
    'file sharing site',
    'file transfer app',
    'online file transfer',
    'file hosting',
    'free file sharing',
    'private file sharing',
    'encrypted file sharing',
    'send documents',
    'zip file sharing',
    'send files to client',
    'cloud file transfer',
    'one-time file sharing',
    'quick file upload',
    'large file sharing',
    'easy file upload',
    'send images online',
    'instant file sharing',
    'filesharedrop',
    'drop file transfer',
    'fast file sharing',
    'file sharing with expiration',
    'fileshare without registration',
    'upload and share files',
    'send PDF files online',
    'share large files',
    'secure document transfer',
    'confidential file sharing',
    'upload link generator',
    '24 hour file sharing',
    'file drop zone',
    'privacy-focused file sharing',
    'data sharing tool',
    'file transfer free tool',
    'best file sharing website',
    'filesharedrop.com',
    'filesharedrop app',
    'filesharedrop site',
    'filesharedrop online file transfer',
    'file sharing India',
    'alternative to WeTransfer',
    'no signup file transfer',
    'send code files online',
    'best secure file upload site',
    'share files with link',
    'send files to friends',
    'upload document online',
    'send files instantly',
    'free document sharing',
    'share files quickly',
    'upload video files',
    'share files privately',
    'filesharedrop upload',
    'send files link',
    'best file sharing app',
    'upload files India',
    'temporary file link',
    'send large files quickly',
    'simple file transfer',
    'fast document sharing',
    'share code files online',
    'file transfer no login',
    'free temporary file upload',
    'best tool to share files',
    'send files to client fast',
    'file sharing with auto-delete',
    'file sharing with password',
    'file sharing with expiration',
    // New additions for broader coverage
    'file sharing without account',
    'anonymous file upload',
    'secure file drop',
    'instant upload and share',
    'upload files anonymously',
    'private file transfer link',
    'free online file drop',
    'share files without email',
    'file transfer no signup',
    'upload and share instantly',
    'best file transfer site',
    'no registration file sharing',
    'safe file transfer online',
    'quick file send',
    'share files securely online',
    'free file upload and share',
    'file sharing platform',
    'easy online file sharing',
    'secure cloud file sharing',
    'fastest file sharing site',
    'share files with password',
    'temporary file hosting',
    'send files with expiry',
    'online file send without login',
    'best free file sharing site',
    'upload and share files free',
    'send files via link',
    'large file upload free',
    'fileshare no account needed',
    'best anonymous file sharing site',
    'upload files fast and safe',
    'free encrypted file sharing',
    'simple file sharing app',
    'instant file upload and share',
    'quick and secure file transfer',
    'private and secure file sharing',
    'file sharing service without registration',
  ],
  openGraph: {
    title: 'FileShareDrop - Free File Sharing & Secure File Transfer',
    description:
      'Send and share files instantly with FileShareDrop. Fast, private, and secure file transfer with auto-expiring links. No account needed.',
    url: 'https://file-share-drop.vercel.app',
    siteName: 'FileShareDrop',
    images: [
      {
        url: '/og-image.jpg',
        width: 1200,
        height: 630,
        alt: 'Secure file transfer and sharing platform – FileShareDrop',
      },
    ],
    type: 'website',
    locale: 'en_US',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'FileShareDrop - Free File Sharing & Secure File Transfer',
    description:
      'Share and transfer files safely online using FileShareDrop. Upload up to 50MB, get a link, and protect privacy with auto-delete. Free and fast!',
    site: '@FileShareDrop',
    creator: '@FileShareDrop',
    images: ['/og-image.jpg'],
  },
  authors: [
    { name: 'Jay Prakash', url: 'https://heyjayprakash.netlify.app' },
    { name: 'FileShareDrop Team' },
  ],
  themeColor: '#0f172a',
  colorScheme: 'light dark',
  robots:
    'index, follow, max-snippet:-1, max-image-preview:large, max-video-preview:-1',
  manifest: '/site.webmanifest',
  icons: {
    icon: '/favicon.ico',
    shortcut: '/favicon.ico',
    apple: '/apple-touch-icon.png',
    other: [{ rel: 'icon', url: '/favicon.ico' }],
  },
  viewport:
    'width=device-width, initial-scale=1, maximum-scale=5, user-scalable=1',
  alternates: {
    canonical: 'https://file-share-drop.vercel.app',
  },
  category: 'File Sharing',
  generator: 'Next.js',
  applicationName: 'FileShareDrop',
  referrer: 'origin-when-cross-origin',
  verification: {
    google: '1mlwv5pCe6_Ncql6DKNDstpFNiDWNEt8FPKblJ0fAI0',
  },
};

interface RootLayoutProps {
  children: ReactNode;
}

export default function RootLayout({ children }: RootLayoutProps) {
  return (
    <html lang="en" className={inter.variable}>
      <Head>
        <meta
          name="google-site-verification"
          content="1mlwv5pCe6_Ncql6DKNDstpFNiDWNEt8FPKblJ0fAI0"
        />
        {/* JSON-LD Structured Data */}
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              '@context': 'https://schema.org',
              '@type': 'WebApplication',
              name: 'FileShareDrop',
              url: 'https://file-share-drop.vercel.app',
              description:
                'A free file sharing and transfer platform that offers secure, anonymous, and fast file uploads up to 50MB with private links.',
              applicationCategory: 'UtilitiesApplication',
              operatingSystem: 'All',
              offers: {
                '@type': 'Offer',
                price: '0',
                priceCurrency: 'USD',
              },
              aggregateRating: {
                '@type': 'AggregateRating',
                ratingValue: '4.9',
                reviewCount: '1291',
              },
              publisher: {
                '@type': 'Organization',
                name: 'FileShareDrop',
                url: 'https://file-share-drop.vercel.app',
              },
            }),
          }}
        />
      </Head>
      <body className="bg-background text-foreground">
        <ThemeProvider>
          <Navbar />
          <main>{children}</main>
          <Footer />
          <Toaster
            position="bottom-right"
            richColors
            closeButton
            toastOptions={{
              className: 'toast-success',
            }}
          />
        </ThemeProvider>
      </body>
    </html>
  );
}
