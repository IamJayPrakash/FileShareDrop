import FileDropzone from '@/components/FileDropzone';
import { Button } from '@/components/ui/button';
import Link from 'next/link';

export default function UploadPage() {
  return (
    <div className="container mx-auto px-4 py-12">
      <h1 className="text-3xl font-bold mb-8 text-center">Upload Your File</h1>
      <FileDropzone />
      <div className="mt-8 text-center">
        <Button variant="outline" asChild>
          <Link href="/">Back to Home</Link>
        </Button>
      </div>
    </div>
  );
}
