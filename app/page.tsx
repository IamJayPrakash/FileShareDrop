import { Button } from '@/components/ui/button';
import { Upload, Shield, Clock } from 'lucide-react';
import FileDropzone from '@/components/FileDropzone';
import Link from 'next/link';

export default function Home() {
  return (
    <div className="space-y-16">
      {/* Hero Section */}
      <section className="py-20 bg-gradient-to-r from-primary/10 to-secondary/10">
        <div className="container px-4 mx-auto text-center">
          <h1 className="mb-6 text-4xl font-bold tracking-tight md:text-5xl">
            Share Files Securely with{' '}
            <span className="mb-6 text-4xl lg:text-5xl font-extrabold text-primary drop-shadow-lg">
              FileShareDrop
            </span>
          </h1>
          <p className="max-w-2xl mx-auto mb-8 text-lg text-muted-foreground">
            Upload files up to 50MB, get a shareable link, and rest easy knowing
            your files are deleted after 24 hours.
          </p>
          <Button size="lg" asChild>
            <Link href="/upload">Start Uploading Now</Link>
          </Button>
        </div>
      </section>

      {/* FileDropzone */}
      <section className="container px-4 mx-auto">
        <FileDropzone />
      </section>

      {/* Features Section */}
      <section className="container px-4 mx-auto">
        <h2 className="mb-12 text-4xl font-extrabold text-center text-primary drop-shadow-sm tracking-tight">
          Why Choose FileShareDrop?
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <div className="flex flex-col items-center bg-gradient-to-br from-blue-50/80 to-blue-100/60 dark:from-gray-900/80 dark:to-gray-800/60 rounded-2xl shadow-xl p-8 border border-blue-100 dark:border-gray-800 hover:scale-[1.03] transition-transform">
            <Upload className="w-12 h-12 mb-4 text-primary" />
            <h3 className="text-2xl font-bold mb-2 text-primary">
              Easy Uploads
            </h3>
            <p className="text-base text-muted-foreground text-center">
              Drag-and-drop or click to upload files quickly and effortlessly.
              No sign up, no hassle.
            </p>
          </div>
          <div className="flex flex-col items-center bg-gradient-to-br from-green-50/80 to-blue-100/60 dark:from-gray-900/80 dark:to-gray-800/60 rounded-2xl shadow-xl p-8 border border-green-100 dark:border-gray-800 hover:scale-[1.03] transition-transform">
            <Shield className="w-12 h-12 mb-4 text-green-600 dark:text-green-400" />
            <h3 className="text-2xl font-bold mb-2 text-green-700 dark:text-green-400">
              Secure Sharing
            </h3>
            <p className="text-base text-muted-foreground text-center">
              Files are end-to-end encrypted and automatically deleted after 24
              hours for your privacy.
            </p>
          </div>
          <div className="flex flex-col items-center bg-gradient-to-br from-purple-50/80 to-blue-100/60 dark:from-gray-900/80 dark:to-gray-800/60 rounded-2xl shadow-xl p-8 border border-purple-100 dark:border-gray-800 hover:scale-[1.03] transition-transform">
            <Clock className="w-12 h-12 mb-4 text-purple-600 dark:text-purple-400" />
            <h3 className="text-2xl font-bold mb-2 text-purple-700 dark:text-purple-400">
              Fast & Temporary
            </h3>
            <p className="text-base text-muted-foreground text-center">
              Share links instantly with a 24-hour expiration for maximum
              security and peace of mind.
            </p>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-gradient-to-r from-primary/5 to-secondary/10 dark:from-gray-900 dark:to-gray-800 mt-16">
        <div className="container px-4 mx-auto text-center flex flex-col items-center">
          <h2 className="mb-6 text-4xl font-extrabold text-primary drop-shadow-sm tracking-tight">
            Ready to Share?
          </h2>
          <p className="mb-8 text-lg text-muted-foreground max-w-xl">
            Join thousands of users securely sharing files with FileShareDrop.
            Experience the next generation of private, ephemeral file sharing.
          </p>
          <Button
            size="lg"
            variant="default"
            asChild
            className="px-10 py-5 text-lg font-bold shadow-lg hover:scale-105 transition-transform"
          >
            <Link href="/upload">Get Started</Link>
          </Button>
        </div>
      </section>
    </div>
  );
}
