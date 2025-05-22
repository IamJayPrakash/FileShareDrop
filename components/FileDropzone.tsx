'use client';

import { useState, useRef, useCallback } from 'react';
import { Upload, FileIcon, CheckCircle, AlertCircle, Copy } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Card } from '@/components/ui/card';

interface UploadResponse {
  url: string;
  id: string;
}

export default function FileDropzone() {
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [shareUrl, setShareUrl] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isDragOver, setIsDragOver] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const resetState = useCallback(() => {
    setError(null);
    setShareUrl(null);
    setSelectedFile(null);
    setUploadProgress(0);
  }, []);

  const handleFileUpload = useCallback(
    async (file: File) => {
      if (!file) return;

      resetState();
      setSelectedFile(file);

      const formData = new FormData();
      formData.append('file', file);

      setUploading(true);

      try {
        const progressInterval = setInterval(() => {
          setUploadProgress((prev) => {
            if (prev >= 90) {
              clearInterval(progressInterval);
              return prev;
            }
            return prev + Math.random() * 10;
          });
        }, 200);

        const res = await fetch('/api/upload', {
          method: 'POST',
          body: formData,
        });

        clearInterval(progressInterval);
        setUploadProgress(100);

        if (!res.ok) {
          const errData = await res.json();
          setError(errData.error || 'Upload failed');
          toast.error(errData.error || 'Upload failed');
        } else {
          const data: UploadResponse = await res.json();
          setShareUrl(data.url);
          toast.success('File uploaded successfully!');
        }
      } catch (err) {
        setError('Upload error occurred');
        toast.error('Upload error occurred');
      } finally {
        setUploading(false);
      }
    },
    [resetState]
  );

  const onDrop = useCallback(
    (e: React.DragEvent<HTMLDivElement>) => {
      e.preventDefault();
      setIsDragOver(false);

      const files = e.dataTransfer.files;
      if (files.length > 0) {
        handleFileUpload(files[0]);
      }
    },
    [handleFileUpload]
  );

  const onDragOver = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragOver(true);
  }, []);

  const onDragLeave = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragOver(false);
  }, []);

  const onFileSelect = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const files = e.target.files;
      if (files && files.length > 0) {
        handleFileUpload(files[0]);
      }
    },
    [handleFileUpload]
  );

  const handleClick = useCallback(() => {
    fileInputRef.current?.click();
  }, []);

  const copyToClipboard = useCallback(async () => {
    if (shareUrl) {
      try {
        await navigator.clipboard.writeText(shareUrl);
        toast.success('Link copied to clipboard!');
      } catch (err) {
        toast.error('Failed to copy link');
      }
    }
  }, [shareUrl]);

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  return (
    <Card className="w-full max-w-2xl mx-auto">
      <div
        onDrop={onDrop}
        onDragOver={onDragOver}
        onDragLeave={onDragLeave}
        onClick={handleClick}
        className={`
          border-2 border-dashed rounded-lg p-8 text-center cursor-pointer
          transition-all duration-300 ease-in-out
          ${isDragOver ? 'border-primary bg-primary/10 scale-[1.02]' : 'border-border hover:border-primary/50 hover:bg-accent/20'}
          ${uploading ? 'pointer-events-none opacity-75' : ''}
        `}
      >
        <input
          ref={fileInputRef}
          type="file"
          onChange={onFileSelect}
          className="hidden"
          disabled={uploading}
        />

        <div className="flex flex-col items-center space-y-4">
          {uploading ? (
            <>
              <div className="relative">
                <div className="h-16 w-16 rounded-full border-4 border-primary/20 border-t-primary animate-spin" />
                <div className="absolute inset-0 flex items-center justify-center">
                  <span className="text-sm font-medium text-primary">
                    {Math.round(uploadProgress)}%
                  </span>
                </div>
              </div>
              <div className="space-y-2 w-full max-w-md">
                <p className="text-sm text-muted-foreground">
                  Uploading {selectedFile?.name}...
                </p>
                <Progress value={uploadProgress} className="h-2" />
              </div>
            </>
          ) : shareUrl ? (
            <>
              <CheckCircle className="h-12 w-12 text-green-500" />
              <div className="space-y-2">
                <p className="text-lg font-semibold">Upload Complete!</p>
                <p className="text-sm text-muted-foreground">
                  {selectedFile?.name} (
                  {formatFileSize(selectedFile?.size || 0)})
                </p>
              </div>
            </>
          ) : error ? (
            <>
              <AlertCircle className="h-12 w-12 text-destructive" />
              <div className="space-y-2">
                <p className="text-lg font-semibold text-destructive">
                  Upload Failed
                </p>
                <p className="text-sm text-muted-foreground">{error}</p>
              </div>
            </>
          ) : (
            <>
              <Upload className="h-12 w-12 text-primary" />
              <div className="space-y-2">
                <p className="text-lg font-semibold">Drop your file here</p>
                <p className="text-sm text-muted-foreground">
                  or{' '}
                  <span className="text-primary font-medium">
                    click to browse
                  </span>
                </p>
                <p className="text-xs text-muted-foreground">
                  Maximum file size: 50MB
                </p>
              </div>
            </>
          )}
        </div>
      </div>

      {shareUrl && (
        <div className="p-4 space-y-4">
          <div className="flex items-center space-x-2 p-4 bg-muted rounded-lg">
            <FileIcon className="h-5 w-5 text-primary" />
            <p className="text-sm font-medium truncate">{shareUrl}</p>
            <Button size="sm" onClick={copyToClipboard}>
              <Copy className="h-4 w-4 mr-2" />
              Copy
            </Button>
          </div>
          <div className="flex space-x-4">
            <Button asChild>
              <a href={shareUrl} target="_blank" rel="noopener noreferrer">
                Open Share Page
              </a>
            </Button>
            <Button
              variant="outline"
              onClick={() => {
                resetState();
                if (fileInputRef.current) fileInputRef.current.value = '';
              }}
            >
              Upload Another
            </Button>
          </div>
        </div>
      )}

      {error && (
        <Button
          variant="destructive"
          className="w-full mt-4"
          onClick={() => {
            resetState();
            if (fileInputRef.current) fileInputRef.current.value = '';
          }}
        >
          Try Again
        </Button>
      )}
    </Card>
  );
}
