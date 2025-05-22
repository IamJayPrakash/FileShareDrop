'use client';

import { useEffect, useState } from 'react';
import {
  Download,
  FileIcon,
  Calendar,
  HardDrive,
  AlertCircle,
  ArrowLeft,
} from 'lucide-react';
import { toast } from 'sonner';
import Link from 'next/link';

type FileMetadata = {
  id: string;
  originalName: string;
  size: number;
  createdAt: string;
};

interface SharePageProps {
  params: { id: string };
}

export default function SharePageClient({ params }: SharePageProps) {
  const [file, setFile] = useState<FileMetadata | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [downloading, setDownloading] = useState(false);

  useEffect(() => {
    async function fetchFile() {
      try {
        const res = await fetch(`/api/file/${params.id}`);
        if (!res.ok) {
          if (res.status === 404) {
            setError('File not found or may have expired');
          } else {
            setError('Failed to load file information');
          }
          return;
        }
        const data = await res.json();
        setFile(data);
      } catch (err) {
        setError('Network error occurred while loading file');
      } finally {
        setLoading(false);
      }
    }

    fetchFile();
  }, [params.id]);

  const handleDownload = async () => {
    if (!file) return;

    setDownloading(true);
    try {
      const response = await fetch(`/api/file/${file.id}?download=true`);

      if (!response.ok) {
        toast.error('Failed to download file');
        return;
      }

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = file.originalName;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);

      toast.success('Download started!');
    } catch (err) {
      toast.error('Download failed');
    } finally {
      setDownloading(false);
    }
  };

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const getFileExtension = (filename: string): string => {
    return filename.split('.').pop()?.toLowerCase() || '';
  };

  const formatDate = (dateString: string): string => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  if (loading) {
    return (
      <main className="min-h-screen bg-background">
        <div className="container mx-auto px-4 py-8">
          <div className="max-w-2xl mx-auto">
            <div className="animate-pulse space-y-6">
              <div className="h-8 bg-muted rounded w-1/2"></div>
              <div className="border border-border rounded-lg p-6 space-y-4">
                <div className="h-6 bg-muted rounded w-3/4"></div>
                <div className="h-4 bg-muted rounded w-1/2"></div>
                <div className="h-4 bg-muted rounded w-1/3"></div>
                <div className="h-10 bg-muted rounded w-1/4"></div>
              </div>
            </div>
          </div>
        </div>
      </main>
    );
  }

  if (error) {
    return (
      <main className="min-h-screen bg-background">
        <div className="container mx-auto px-4 py-8">
          <div className="max-w-2xl mx-auto text-center space-y-6">
            <div className="w-16 h-16 rounded-full bg-destructive/10 flex items-center justify-center mx-auto">
              <AlertCircle className="w-8 h-8 text-destructive" />
            </div>
            <div className="space-y-2">
              <h1 className="text-2xl font-bold text-foreground">
                File Not Available
              </h1>
              <p className="text-muted-foreground">{error}</p>
            </div>
            <Link
              href="/"
              className="inline-flex items-center space-x-2 px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90 transition-colors"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Upload New File</span>
            </Link>
          </div>
        </div>
      </main>
    );
  }

  if (!file) return null;

  return (
    <main className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-2xl mx-auto space-y-6">
          {/* Header */}
          <div className="flex items-center justify-between">
            <Link
              href="/"
              className="flex items-center space-x-2 text-muted-foreground hover:text-foreground transition-colors"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Back to Upload</span>
            </Link>
            <div className="text-sm text-muted-foreground">FileShareDrop</div>
          </div>

          {/* File Card */}
          <div className="border border-border rounded-lg overflow-hidden bg-card">
            {/* File Header */}
            <div className="p-6 border-b border-border">
              <div className="flex items-start space-x-4">
                <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
                  <FileIcon className="w-6 h-6 text-primary" />
                </div>
                <div className="flex-1 min-w-0">
                  <h1 className="text-xl font-semibold text-card-foreground break-all">
                    {file.originalName}
                  </h1>
                  <div className="flex flex-wrap items-center gap-4 mt-2 text-sm text-muted-foreground">
                    <div className="flex items-center space-x-1">
                      <HardDrive className="w-4 h-4" />
                      <span>{formatFileSize(file.size)}</span>
                    </div>
                    <div className="flex items-center space-x-1">
                      <Calendar className="w-4 h-4" />
                      <span>{formatDate(file.createdAt)}</span>
                    </div>
                    {getFileExtension(file.originalName) && (
                      <div className="px-2 py-1 bg-secondary text-secondary-foreground text-xs rounded font-medium uppercase">
                        {getFileExtension(file.originalName)}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* Actions */}
            <div className="p-6">
              <button
                onClick={handleDownload}
                disabled={downloading}
                className={`
                  w-full flex items-center justify-center space-x-2 px-6 py-3 rounded-lg font-medium transition-all
                  ${
                    downloading
                      ? 'bg-muted text-muted-foreground cursor-not-allowed'
                      : 'bg-primary text-primary-foreground hover:bg-primary/90 hover:scale-[1.02]'
                  }
                `}
              >
                {downloading ? (
                  <>
                    <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
                    <span>Downloading...</span>
                  </>
                ) : (
                  <>
                    <Download className="w-5 h-5" />
                    <span>Download File</span>
                  </>
                )}
              </button>

              <div className="mt-4 p-4 bg-muted/50 rounded-lg">
                <p className="text-sm text-muted-foreground text-center">
                  This file will be automatically deleted after 24 hours for
                  security.
                </p>
              </div>
            </div>
          </div>

          {/* Share Another File */}
          <div className="text-center">
            <Link
              href="/"
              className="inline-flex items-center space-x-2 text-primary hover:text-primary/80 transition-colors"
            >
              <span>Share another file</span>
            </Link>
          </div>
        </div>
      </div>
    </main>
  );
}
