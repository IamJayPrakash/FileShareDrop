import { Button } from '@/components/ui/button';
import { AlertCircle } from 'lucide-react';
import Link from 'next/link';

export default function NotFound() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <div className="text-center space-y-6">
        <AlertCircle className="h-16 w-16 text-destructive mx-auto" />
        <h1 className="text-4xl font-bold">404 - Page Not Found</h1>
        <p className="text-lg text-muted-foreground max-w-md">
          Oops! The page you’re looking for doesn’t exist or may have been
          moved.
        </p>
        <Button size="lg" asChild>
          <Link href="/">Return to Home</Link>
        </Button>
      </div>
    </div>
  );
}
