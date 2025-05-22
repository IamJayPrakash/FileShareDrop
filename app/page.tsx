import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Upload, Shield, Clock } from 'lucide-react';
import FileDropzone from '@/components/FileDropzone';
import Link from 'next/link';

export default function Home() {
  return (
    <div className="space-y-16">
      {/* Hero Section */}
      <section className="bg-gradient-to-r from-primary/10 to-secondary/10 py-20">
        <div className="container mx-auto px-4 text-center">
          <h1 className="text-4xl md:text-5xl font-bold tracking-tight mb-6">
            Share Files Securely with{' '}
            <span className="text-primary">FileShareDrop</span>
          </h1>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto mb-8">
            Upload files up to 50MB, get a shareable link, and rest easy knowing
            your files are deleted after 24 hours.
          </p>
          <Button size="lg" asChild>
            <Link href="/upload">Start Uploading Now</Link>
          </Button>
        </div>
      </section>

      {/* FileDropzone */}
      <section className="container mx-auto px-4">
        <FileDropzone />
      </section>

      {/* Features Section */}
      <section className="container mx-auto px-4">
        <h2 className="text-3xl font-bold text-center mb-12">
          Why Choose FileShareDrop?
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <Card className="hover:shadow-lg transition-shadow">
            <CardHeader>
              <Upload className="h-8 w-8 text-primary mb-2" />
              <CardTitle>Easy Uploads</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground">
                Drag-and-drop or click to upload files quickly and effortlessly.
              </p>
            </CardContent>
          </Card>
          <Card className="hover:shadow-lg transition-shadow">
            <CardHeader>
              <Shield className="h-8 w-8 text-primary mb-2" />
              <CardTitle>Secure Sharing</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground">
                Files are encrypted and automatically deleted after 24 hours.
              </p>
            </CardContent>
          </Card>
          <Card className="hover:shadow-lg transition-shadow">
            <CardHeader>
              <Clock className="h-8 w-8 text-primary mb-2" />
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
      <section className="bg-muted py-16">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-3xl font-bold mb-6">Ready to Share?</h2>
          <p className="text-lg text-muted-foreground mb-8">
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
