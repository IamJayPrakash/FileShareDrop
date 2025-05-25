'use client';

import { useState, useRef, useCallback, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import {
  Upload,
  CircleDot,
  Circle,
  AlertCircle,
  CheckCircle2,
} from 'lucide-react';
import { Progress } from '@/components/ui/progress';
import { toast } from 'sonner';
import QRShare from './QRShare';
import FileList from './FileList';
import ProgressList from './ProgressList';
import { generateKey, exportKey, importKey } from './crypto';
import { setupConnection } from './webrtc';
import { ReceivedFile, FileMeta } from './types';
import io from 'socket.io-client';
import { motion } from 'framer-motion';
import { useRouter } from 'next/navigation';

export default function FileDropzone({
  roomProp = '',
  keyProp = '',
}: {
  roomProp?: string;
  keyProp?: string;
}) {
  const [files, setFiles] = useState<File[]>([]);
  const [status, setStatus] = useState<string>('');
  const [isSender, setIsSender] = useState<boolean>(false);
  const [keyB64, setKeyB64] = useState<string>(keyProp);
  const [cryptoKey, setCryptoKey] = useState<CryptoKey | undefined>(undefined);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [isDragOver, setIsDragOver] = useState(false);
  const [qr, setQr] = useState<string>('');
  const [room, setRoom] = useState<string>(roomProp);
  const [receivedFiles, setReceivedFiles] = useState<ReceivedFile[]>([]);
  const [receivedFilesMeta, setReceivedFilesMeta] = useState<FileMeta[]>([]);
  const [peerOnline, setPeerOnline] = useState(false);
  const [isWaiting, setIsWaiting] = useState(false);
  const [fileProgress, setFileProgress] = useState<number[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [transferComplete, setTransferComplete] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const socketRef = useRef<ReturnType<typeof io> | null>(null);
  const pcRef = useRef<RTCPeerConnection | null>(null);
  const dcRef = useRef<RTCDataChannel | null>(null);
  const isSetupRef = useRef(false);
  const router = useRouter();
  const MAX_FILE_SIZE = 50 * 1024 * 1024; // 50MB

  const resetState = useCallback(() => {
    console.log(`[${new Date().toISOString()}] Resetting state`);
    if (dcRef.current && dcRef.current.readyState === 'open') {
      dcRef.current.close();
    }
    if (pcRef.current) {
      pcRef.current.close();
      pcRef.current = null;
    }
    if (socketRef.current) {
      socketRef.current.disconnect();
      socketRef.current = null;
    }
    dcRef.current = null;
    setFiles([]);
    setStatus('');
    setUploading(false);
    setUploadProgress(0);
    setQr('');
    setRoom('');
    setIsSender(false);
    setKeyB64('');
    setCryptoKey(undefined);
    setPeerOnline(false);
    setError(null);
    setReceivedFiles([]);
    setReceivedFilesMeta([]);
    setFileProgress([]);
    setTransferComplete(false);
    setIsWaiting(false);
    isSetupRef.current = false;
  }, []);

  useEffect(() => {
    console.log(`[${new Date().toISOString()}] Checking WebRTC support`);
    if (!('RTCPeerConnection' in window)) {
      setError('Your browser does not support WebRTC.');
      toast.error('Your browser does not support WebRTC.');
    }
  }, []);

  useEffect(() => {
    if (transferComplete) {
      console.log(
        `[${new Date().toISOString()}] Transfer complete, resetting state`
      );
      setError(null); // Clear any existing error
      toast.success(
        isSender ? 'Files sent successfully!' : 'Files received successfully!'
      );
      setTimeout(() => {
        if (socketRef.current && room) {
          socketRef.current.emit('transfer-complete', { room });
        }
        resetState();
        router.push('/');
      }, 140000); // 2 minutes and 20 seconds for manual downloads
    }
  }, [transferComplete, resetState, room, isSender, router]);

  async function handleSend() {
    console.log(
      `[${new Date().toISOString()}] Handling send, files:`,
      files.map((f) => f.name)
    );
    if (!files.length) {
      toast.error('No files selected.');
      return;
    }
    setUploading(true);
    setStatus('Preparing files...');
    let key: CryptoKey;
    let keyB64ToUse = keyB64;
    let roomToUse = room;
    if (!roomProp && !keyProp) {
      key = await generateKey();
      keyB64ToUse = await exportKey(key);
      setKeyB64(keyB64ToUse);
      setCryptoKey(key);
      roomToUse = Math.random().toString(36).substring(2, 10);
      setRoom(roomToUse);
      console.log(`[${new Date().toISOString()}] Generated room: ${roomToUse}`);
    } else {
      key = await importKey(keyB64ToUse);
      setCryptoKey(key);
    }
    setIsSender(true);
    setQr(
      `${window.location.origin}/share/${roomToUse}?key=${encodeURIComponent(
        keyB64ToUse
      )}`
    );
    setStatus('Waiting for receiver...');
    setUploading(false);
  }

  const handleReceive = useCallback(async (room: string, keyB64: string) => {
    console.log(
      `[${new Date().toISOString()}] Handling receive, room: ${room}, key: ${keyB64}`
    );
    setRoom(room);
    setKeyB64(keyB64);
    setIsSender(false);
    setStatus('Connecting to sender...');
    setFiles([]); // Ensure no sender files are set
    setQr(''); // Clear QR code
  }, []);

  useEffect(() => {
    if (isSetupRef.current || !room || !keyB64 || (!isSender && !roomProp)) {
      console.log(
        `[${new Date().toISOString()}] Skipping WebRTC setup, isSetup: ${isSetupRef.current}, room: ${!!room}, keyB64: ${!!keyB64}, isSender: ${isSender}, roomProp: ${!!roomProp}`
      );
      return;
    }
    isSetupRef.current = true;
    console.log(
      `[${new Date().toISOString()}] Setting up WebRTC for ${isSender ? 'sender' : 'receiver'}, room: ${room}`
    );
    setupConnection(
      isSender,
      room,
      keyB64,
      isSender ? files : undefined,
      cryptoKey,
      setStatus,
      setIsWaiting,
      setError,
      setFileProgress,
      setReceivedFiles,
      setUploadProgress,
      socketRef,
      pcRef,
      dcRef,
      setPeerOnline,
      setTransferComplete,
      setReceivedFilesMeta
    );

    return () => {
      console.log(`[${new Date().toISOString()}] Cleaning up WebRTC setup`);
      if (dcRef.current && dcRef.current.readyState === 'open') {
        dcRef.current.close();
      }
      if (pcRef.current) {
        pcRef.current.close();
        pcRef.current = null;
      }
      if (socketRef.current) {
        socketRef.current.disconnect();
        socketRef.current = null;
      }
      dcRef.current = null;
      isSetupRef.current = false;
    };
  }, [
    isSender,
    room,
    keyB64,
    files,
    cryptoKey,
    roomProp,
    setReceivedFilesMeta,
  ]);

  useEffect(() => {
    if (roomProp && keyProp) {
      console.log(
        `[${new Date().toISOString()}] Auto-joining as receiver, roomProp: ${roomProp}, keyProp: ${keyProp}`
      );
      handleReceive(roomProp, keyProp);
    } else if (roomProp || keyProp) {
      console.warn(
        `[${new Date().toISOString()}] Invalid receiver URL, roomProp: ${roomProp}, keyProp: ${keyProp}`
      );
      setError('Invalid share link. Please check the URL and try again.');
    }
  }, [roomProp, keyProp, handleReceive]);

  const handleReload = useCallback(() => {
    console.log(`[${new Date().toISOString()}] Handling reload`);
    resetState();
    router.push('/');
    window.location.reload();
  }, [resetState, router]);

  const onDrop = useCallback(
    (e: React.DragEvent<HTMLDivElement>) => {
      console.log(`[${new Date().toISOString()}] File dropped`);
      e.preventDefault();
      setIsDragOver(false);
      const droppedFiles = Array.from(e.dataTransfer.files).filter((f) => {
        if (f.size > MAX_FILE_SIZE) {
          toast.error(`File ${f.name} exceeds 50MB and was ignored.`);
          return false;
        }
        return true;
      });
      if (droppedFiles.length > 0) {
        console.log(
          `[${new Date().toISOString()}] Dropped files:`,
          droppedFiles.map((f) => f.name)
        );
        setFiles((prev) => [...prev, ...droppedFiles]);
      }
    },
    [MAX_FILE_SIZE]
  );

  const onDragOver = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    console.log(`[${new Date().toISOString()}] Drag over`);
    e.preventDefault();
    setIsDragOver(true);
  }, []);

  const onDragLeave = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    console.log(`[${new Date().toISOString()}] Drag leave`);
    e.preventDefault();
    setIsDragOver(false);
  }, []);

  const onFileSelect = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      console.log(`[${new Date().toISOString()}] File selected via input`);
      const selectedFiles = e.target.files
        ? Array.from(e.target.files).filter((f) => {
            if (f.size > MAX_FILE_SIZE) {
              toast.error(`File ${f.name} exceeds 50MB and was ignored.`);
              return false;
            }
            return true;
          })
        : [];
      if (selectedFiles.length > 0) {
        console.log(
          `[${new Date().toISOString()}] Selected files:`,
          selectedFiles.map((f) => f.name)
        );
        setFiles((prev) => [...prev, ...selectedFiles]);
      }
    },
    [MAX_FILE_SIZE]
  );

  const handleClick = useCallback(() => {
    console.log(`[${new Date().toISOString()}] Dropzone clicked`);
    if (fileInputRef.current && !uploading) {
      fileInputRef.current.click();
    }
  }, [uploading]);

  const isReceiveMode = !!roomProp && !!keyProp;

  const renderReceiveMode = () => {
    if (transferComplete) {
      return (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex flex-col items-center gap-4 py-12 px-4"
        >
          <CheckCircle2 className="w-12 h-12 text-green-500" />
          <p className="text-base font-medium text-center text-foreground">
            All files have been downloaded successfully!
          </p>
          {receivedFiles.length > 0 && (
            <div className="w-full max-w-md mt-4">
              <p className="text-sm font-medium mb-2 text-foreground">
                Downloaded Files:
              </p>
              {receivedFiles.map((file, idx) => (
                <div
                  key={idx}
                  className="flex items-center justify-between mb-2 bg-muted rounded-lg p-2"
                >
                  <span className="text-sm truncate max-w-[200px] text-foreground">
                    {file.name}
                  </span>
                  <Button
                    variant="outline"
                    size="sm"
                    className="bg-primary text-primary-foreground hover:bg-primary/90"
                    onClick={() => {
                      const link = document.createElement('a');
                      link.href = file.url;
                      link.download = file.name;
                      link.click();
                    }}
                  >
                    Download
                  </Button>
                </div>
              ))}
            </div>
          )}
          <p className="text-sm text-muted-foreground text-center">
            Redirecting to homepage in 2 minutes and 20 seconds...
          </p>
        </motion.div>
      );
    }

    if (error) {
      return (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex flex-col items-center gap-4 py-12 px-4"
        >
          <AlertCircle className="w-12 h-12 text-destructive" />
          <p className="text-base font-medium text-center text-destructive">
            {error}
          </p>
          <Button
            variant="outline"
            className="mt-4 bg-primary text-primary-foreground hover:bg-primary/90"
            onClick={handleReload}
          >
            Retry
          </Button>
        </motion.div>
      );
    }

    if (isWaiting && !receivedFilesMeta.length) {
      return (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex flex-col items-center gap-4 py-12 px-4"
        >
          <div className="w-12 h-12 border-4 rounded-full border-primary border-t-transparent animate-spin" />
          <p className="text-base font-medium text-center text-foreground">
            Waiting for sender to connect...
          </p>
          <p className="mt-2 text-sm text-muted-foreground text-center max-w-md">
            Please keep this page open. Files will be downloaded automatically
            once the sender starts the transfer.
          </p>
        </motion.div>
      );
    }

    if (receivedFilesMeta.length > 0) {
      return (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="w-full max-w-md mt-6 px-4"
        >
          <p className="text-base font-medium text-center mb-4 text-foreground">
            Downloading {receivedFilesMeta.length}{' '}
            {receivedFilesMeta.length > 1 ? 'files' : 'file'}...
          </p>
          <ProgressList
            files={Array(receivedFilesMeta.length).fill({
              name: '',
              size: 0,
            })}
            progress={fileProgress}
            isSender={false}
            receivedFilesMeta={receivedFilesMeta}
          />
          {receivedFiles.length > 0 && (
            <div className="mt-4">
              <p className="text-sm font-medium mb-2 text-foreground">
                Received Files:
              </p>
              {receivedFiles.map((file, idx) => (
                <div
                  key={idx}
                  className="flex items-center justify-between mb-2 bg-muted rounded-lg p-2"
                >
                  <span className="text-sm truncate max-w-[200px] text-foreground">
                    {file.name}
                  </span>
                  <Button
                    variant="outline"
                    size="sm"
                    className="bg-primary text-primary-foreground hover:bg-primary/90"
                    onClick={() => {
                      const link = document.createElement('a');
                      link.href = file.url;
                      link.download = file.name;
                      link.click();
                    }}
                  >
                    Download
                  </Button>
                </div>
              ))}
            </div>
          )}
        </motion.div>
      );
    }

    return null;
  };

  console.log(
    `[${new Date().toISOString()}] Render, isReceiveMode: ${isReceiveMode}, isSender: ${isSender}, files: ${files.length}, roomProp: ${roomProp}, keyProp: ${keyProp}`
  );

  return (
    <Card
      className="w-full max-w-2xl mx-auto bg-card text-card-foreground shadow-lg"
      role="region"
      aria-label="File transfer interface"
    >
      {isReceiveMode ? (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="flex flex-col items-center justify-center py-12 px-4 bg-gradient-to-br from-background to-muted/20 rounded-lg shadow-md bg-white/80 dark:bg-stone-600/80 backdrop-blur-md"
        >
          <h2 className="text-xl font-semibold text-primary mb-4">
            Receiving Files
          </h2>
          {renderReceiveMode()}
          {room && !isSender && keyB64 && (
            <div className="flex items-center gap-2 mt-4">
              {peerOnline ? (
                <CircleDot className="w-4 h-4 text-green-500" />
              ) : (
                <Circle className="w-4 h-4 text-gray-400 animate-pulse" />
              )}
              <span
                className={`text-xs font-semibold ${peerOnline ? 'text-green-600' : 'text-gray-500'}`}
              >
                {peerOnline ? 'Peer Online' : 'Peer Offline'}
              </span>
              <span className="text-xs text-foreground">
                You are the Receiver
              </span>
            </div>
          )}
        </motion.div>
      ) : (
        <>
          {error && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="p-3 mb-4 text-center text-destructive bg-destructive/10 rounded"
              role="alert"
            >
              {error}
            </motion.div>
          )}
          <div
            title="Upload files"
            onDrop={onDrop}
            onDragOver={onDragOver}
            onDragLeave={onDragLeave}
            onClick={handleClick}
            className={`
              border-2 border-dashed rounded-lg p-8 text-center cursor-pointer
              transition-all duration-300 ease-in-out
              ${isDragOver ? 'border-primary bg-primary/10 scale-[1.02]' : 'border-border hover:border-primary/50 hover:bg-accent/20'}
              ${uploading ? 'pointer-events-none opacity-75' : ''}
              bg-background text-foreground
            `}
          >
            <input
              ref={fileInputRef}
              type="file"
              onChange={onFileSelect}
              className="hidden"
              disabled={uploading}
              multiple
              aria-label="Select files to send"
            />
            <div className="flex flex-col items-center space-y-4">
              {files.length > 0 ? (
                <>
                  <FileList
                    files={files}
                    onRemove={(idx) => {
                      console.log(
                        `[${new Date().toISOString()}] Removing file at index: ${idx}`
                      );
                      setFiles((prev) => prev.filter((_, i) => i !== idx));
                      setQr('');
                      setStatus('');
                    }}
                    disabled={uploading}
                  />
                  <Button
                    className="px-4 py-2 mt-2 text-primary-foreground rounded bg-primary hover:bg-primary/90"
                    type="button"
                    onClick={(e) => {
                      console.log(
                        `[${new Date().toISOString()}] Send button clicked`
                      );
                      e.stopPropagation();
                      handleSend();
                    }}
                    disabled={uploading || files.length === 0}
                    aria-label="Send files"
                  >
                    Send {files.length > 1 ? 'Files' : 'File'}
                  </Button>
                  {(qr || transferComplete) && (
                    <Button
                      className="px-4 py-2 mt-2 text-secondary-foreground rounded bg-secondary hover:bg-secondary/90"
                      type="button"
                      onClick={handleReload}
                      aria-label="Reload to send new files"
                    >
                      Send New Files
                    </Button>
                  )}
                </>
              ) : (
                <>
                  <Upload className="w-12 h-12 text-primary" />
                  <div className="space-y-2">
                    <p className="text-lg font-semibold text-foreground">
                      Drop your files here
                    </p>
                    <p className="text-sm text-muted-foreground">
                      or{' '}
                      <span className="font-medium text-primary">
                        click to browse
                      </span>
                    </p>
                    <p className="text-xs text-muted-foreground">
                      Maximum file size: 50MB each
                    </p>
                  </div>
                </>
              )}
            </div>
          </div>
          {uploading && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="flex flex-col items-center mt-6"
            >
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 border-4 rounded-full border-primary border-t-transparent animate-spin" />
                <span className="font-medium text-primary">Processing...</span>
              </div>
              <Progress value={uploadProgress} className="w-full mt-2" />
            </motion.div>
          )}
          {qr && !uploading && <QRShare qr={qr} />}
          <div className="mt-4 text-sm text-center text-foreground">
            {status}
          </div>
          {room && qr && isSender && (
            <div className="flex items-center justify-center gap-2 mt-2">
              {peerOnline ? (
                <CircleDot className="w-4 h-4 text-green-500" />
              ) : (
                <Circle className="w-4 h-4 text-gray-400 animate-pulse" />
              )}
              <span
                className={`text-xs font-semibold ${peerOnline ? 'text-green-600' : 'text-gray-500'}`}
              >
                {peerOnline ? 'Peer Online' : 'Peer Offline'}
              </span>
              <span className="text-xs text-foreground">
                You are the Sender
              </span>
            </div>
          )}
        </>
      )}
    </Card>
  );
}
