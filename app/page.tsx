'use client';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
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
            <span className="text-primary">FileShareDrop</span>
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
        <h2 className="mb-12 text-3xl font-bold text-center">
          Why Choose FileShareDrop?
        </h2>
        <div className="grid grid-cols-1 gap-8 md:grid-cols-3">
          <Card className="transition-shadow hover:shadow-lg">
            <CardHeader>
              <Upload className="w-8 h-8 mb-2 text-primary" />
              <CardTitle>Easy Uploads</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground">
                Drag-and-drop or click to upload files quickly and effortlessly.
              </p>
            </CardContent>
          </Card>
          <Card className="transition-shadow hover:shadow-lg">
            <CardHeader>
              <Shield className="w-8 h-8 mb-2 text-primary" />
              <CardTitle>Secure Sharing</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground">
                Files are encrypted and automatically deleted after 24 hours.
              </p>
            </CardContent>
          </Card>
          <Card className="transition-shadow hover:shadow-lg">
            <CardHeader>
              <Clock className="w-8 h-8 mb-2 text-primary" />
              <CardTitle>Fast & Temporary</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground">
                Share links instantly with a 24-hour expiration for security.
              </p>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-16 bg-muted">
        <div className="container px-4 mx-auto text-center">
          <h2 className="mb-6 text-3xl font-bold">Ready to Share?</h2>
          <p className="mb-8 text-lg text-muted-foreground">
            Join thousands of users securely sharing files with FileShareDrop.
          </p>
          <Button size="lg" variant="default" asChild>
            <Link href="/upload">Get Started</Link>
          </Button>
        </div>
      </section>
    </div>
  );
}
