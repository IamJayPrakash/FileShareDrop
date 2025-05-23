'use client';

import { useState, useRef, useCallback, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Upload, CircleDot, Circle } from 'lucide-react';
import { Progress } from '@/components/ui/progress';
import { toast } from 'sonner';
import QRCode from 'react-qr-code';
import FileList from './FileList';
import ProgressList from './ProgressList';
import QRShare from './QRShare';
import { generateKey, exportKey, importKey } from './crypto';
import { setupConnection } from './webrtc';
import { ReceivedFile } from './types';
import io from 'socket.io-client'; // Added import for io

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
  const [cryptoKey, setCryptoKey] = useState<CryptoKey | null>(null);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [isDragOver, setIsDragOver] = useState(false);
  const [qr, setQr] = useState<string>('');
  const [room, setRoom] = useState<string>(roomProp);
  const [receivedFiles, setReceivedFiles] = useState<ReceivedFile[]>([]);
  const [peerOnline, setPeerOnline] = useState(false);
  const [isWaiting, setIsWaiting] = useState(false);
  const [fileProgress, setFileProgress] = useState<number[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [peerId, setPeerId] = useState<string | null>(null);
  const [joined, setJoined] = useState(false);
  const [offerStarted, setOfferStarted] = useState(false);
  const [receiverReady, setReceiverReady] = useState(false);
  const [transferComplete, setTransferComplete] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const socketRef = useRef<ReturnType<typeof io> | null>(null);
  const pcRef = useRef<RTCPeerConnection | null>(null);
  const dcRef = useRef<RTCDataChannel | null>(null);

  const resetState = useCallback(() => {
    console.log(`[${new Date().toISOString()}] Resetting state`);
    setFiles([]);
    setStatus('');
    setUploading(false);
    setUploadProgress(0);
    setQr('');
    setRoom('');
    setIsSender(false);
    setKeyB64('');
    setCryptoKey(null);
    setPeerOnline(false);
    setOfferStarted(false);
    setError(null);
    setReceiverReady(false);
    setTransferComplete(false);
    setReceivedFiles([]);
    setFileProgress([]);
    setPeerId(null);
    setJoined(false);
    if (dcRef.current && dcRef.current.readyState === 'open') {
      console.log(`[${new Date().toISOString()}] Closing data channel`);
      dcRef.current.close();
    }
    if (pcRef.current) {
      console.log(`[${new Date().toISOString()}] Closing peer connection`);
      pcRef.current.close();
      pcRef.current = null;
    }
    if (socketRef.current) {
      console.log(`[${new Date().toISOString()}] Disconnecting socket`);
      socketRef.current.disconnect();
      socketRef.current = null;
    }
    dcRef.current = null;
    console.log(`[${new Date().toISOString()}] State reset complete`);
  }, []);

  useEffect(() => {
    console.log(`[${new Date().toISOString()}] Checking WebRTC support`);
    if (typeof window !== 'undefined' && !('RTCPeerConnection' in window)) {
      console.error(`[${new Date().toISOString()}] WebRTC not supported`);
      setError(
        'Your browser does not support secure peer-to-peer transfer. Please use a modern browser.'
      );
      toast.error(
        'Your browser does not support secure peer-to-peer transfer. Please use a modern browser.'
      );
    } else {
      console.log(`[${new Date().toISOString()}] WebRTC supported`);
    }
  }, []);

  async function handleSend() {
    console.log(
      `[${new Date().toISOString()}] Handling send, files:`,
      files.map((f) => f.name)
    );
    if (!files.length) {
      console.warn(`[${new Date().toISOString()}] No files selected`);
      toast.error('No files selected.');
      return;
    }
    setUploading(true);
    setUploadProgress(0);
    setStatus('Encrypting and preparing files...');
    let key: CryptoKey;
    let keyB64ToUse = keyB64;
    let roomToUse = room;
    if (!roomProp && !keyProp) {
      console.log(`[${new Date().toISOString()}] Generating new key and room`);
      key = await generateKey();
      keyB64ToUse = await exportKey(key);
      setKeyB64(keyB64ToUse);
      setCryptoKey(key);
      roomToUse = Math.random().toString(36).substring(2, 10);
      setRoom(roomToUse);
      console.log(
        `[${new Date().toISOString()}] Generated room: ${roomToUse}, keyB64: ${keyB64ToUse.slice(0, 10)}...`
      );
    } else {
      console.log(`[${new Date().toISOString()}] Importing existing key`);
      key = await importKey(keyB64ToUse);
      setCryptoKey(key);
    }
    setIsSender(true);
    setQr(
      `${window.location.origin}/share/${roomToUse}?key=${encodeURIComponent(keyB64ToUse)}`
    );
    console.log(
      `[${new Date().toISOString()}] QR code generated: ${window.location.origin}/share/${roomToUse}?key=${encodeURIComponent(keyB64ToUse).slice(0, 10)}...`
    );
    setStatus('Encrypting and uploading...');
    await setupConnection(
      true,
      roomToUse,
      keyB64ToUse,
      files,
      key,
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
      setPeerId,
      setJoined,
      setOfferStarted,
      setReceiverReady,
      setTransferComplete,
      peerId
    );
    setUploading(false);
    setSendDisabled(true);
    console.log(
      `[${new Date().toISOString()}] Sender setup complete, status: Ready to share`
    );
  }

  async function handleReceive(room: string, keyB64: string) {
    console.log(
      `[${new Date().toISOString()}] Handling receive, room: ${room}, keyB64: ${keyB64.slice(0, 10)}...`
    );
    setRoom(room);
    setKeyB64(keyB64);
    setIsSender(false);
    setStatus('Connecting to sender...');
    await setupConnection(
      false,
      room,
      keyB64,
      undefined,
      undefined,
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
      setPeerId,
      setJoined,
      setOfferStarted,
      setReceiverReady,
      setTransferComplete,
      peerId
    );
    console.log(`[${new Date().toISOString()}] Receiver setup complete`);
  }

  useEffect(() => {
    if (roomProp && keyProp) {
      console.log(
        `[${new Date().toISOString()}] Auto-joining as receiver, roomProp: ${roomProp}, keyProp: ${keyProp.slice(0, 10)}...`
      );
      handleReceive(roomProp, keyProp);
    }
  }, [roomProp, keyProp]);

  useEffect(() => {
    if (isSender && files.length > 0 && qr && room && keyB64 && cryptoKey) {
      console.log(
        `[${new Date().toISOString()}] Sender re-setup triggered, files: ${files.length}, room: ${room}, key: ${!!cryptoKey}`
      );
      setupConnection(
        true,
        room,
        keyB64,
        files,
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
        setPeerId,
        setJoined,
        setOfferStarted,
        setReceiverReady,
        setTransferComplete,
        peerId
      );
    }
  }, [isSender, files, qr, room, keyB64, cryptoKey]);

  const [sendDisabled, setSendDisabled] = useState(false);
  const handleReload = useCallback(() => {
    console.log(`[${new Date().toISOString()}] Handling reload`);
    resetState();
    setSendDisabled(false);
  }, [resetState]);

  const onDrop = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    console.log(`[${new Date().toISOString()}] File dropped`);
    e.preventDefault();
    setIsDragOver(false);
    const droppedFiles = Array.from(e.dataTransfer.files);
    if (droppedFiles.length > 0) {
      console.log(
        `[${new Date().toISOString()}] Dropped files:`,
        droppedFiles.map((f) => f.name)
      );
      setFiles((prev) => [...prev, ...droppedFiles]);
    }
  }, []);

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

  const onFileSelect = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    console.log(`[${new Date().toISOString()}] File selected via input`);
    const selectedFiles = e.target.files ? Array.from(e.target.files) : [];
    if (selectedFiles.length > 0) {
      console.log(
        `[${new Date().toISOString()}] Selected files:`,
        selectedFiles.map((f) => f.name)
      );
      setFiles((prev) => [...prev, ...selectedFiles]);
    }
  }, []);

  const handleClick = useCallback(() => {
    console.log(`[${new Date().toISOString()}] Dropzone clicked`);
    if (fileInputRef.current && !uploading) {
      fileInputRef.current.click();
    }
  }, [uploading]);

  const isReceiveMode = !!roomProp && !!keyProp;
  console.log(
    `[${new Date().toISOString()}] Render, isReceiveMode: ${isReceiveMode}, isSender: ${isSender}, files: ${files.length}`
  );

  return (
    <Card
      className="w-full max-w-2xl mx-auto bg-card text-card-foreground"
      aria-label="File transfer card"
    >
      {error && (
        <div
          className="p-3 mb-4 text-center text-red-700 bg-red-100 rounded"
          role="alert"
        >
          {error}
        </div>
      )}
      {!isReceiveMode && (
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
            {isSender || (!roomProp && !keyProp) ? (
              files.length > 0 ? (
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
                      setSendDisabled(false);
                    }}
                    disabled={uploading || sendDisabled}
                  />
                  {!sendDisabled ? (
                    <Button
                      className="px-4 py-2 mt-2 text-white rounded dark:text-stone-950 bg-primary"
                      type="button"
                      onClick={(e) => {
                        console.log(
                          `[${new Date().toISOString()}] Send button clicked`
                        );
                        e.stopPropagation();
                        handleSend();
                      }}
                      disabled={uploading || files.length === 0 || sendDisabled}
                      aria-label="Send files"
                    >
                      Send {files.length > 1 ? 'Files' : 'File'}
                    </Button>
                  ) : (
                    <Button
                      className="px-4 py-2 mt-2 text-white rounded dark:text-stone-950 bg-secondary"
                      type="button"
                      onClick={handleReload}
                      aria-label="Reload to send new files"
                    >
                      Reload / Send New Files
                    </Button>
                  )}
                </>
              ) : (
                <>
                  <Upload className="w-12 h-12 text-primary" />
                  <div className="space-y-2">
                    <p className="text-lg font-semibold">
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
              )
            ) : null}
          </div>
        </div>
      )}
      {isReceiveMode && (
        <div className="flex flex-col items-center justify-center py-12">
          {isWaiting && (
            <>
              <div className="w-10 h-10 mb-2 border-4 rounded-full border-primary border-t-transparent animate-spin" />
              <div className="mb-2 text-base font-medium text-primary">
                Waiting for sender to transfer files...
              </div>
              <div className="mb-4 text-xs text-muted-foreground">
                Keep this page open. The transfer will start automatically when
                the sender is online.
              </div>
            </>
          )}
          {fileProgress.length > 0 && (
            <div className="flex flex-col w-full max-w-xs gap-2 mx-auto mt-4 sm:max-w-full">
              {fileProgress.map((prog, idx) => (
                <div key={idx} className="flex flex-col gap-1">
                  <div className="flex justify-between text-xs">
                    <span>Receiving {idx + 1}</span>
                    <span>{prog}%</span>
                  </div>
                  <Progress value={prog} className="h-2" />
                </div>
              ))}
            </div>
          )}
          {receivedFiles.length > 0 && (
            <div className="flex flex-col gap-2 mt-4">
              <div className="mb-1 font-medium">
                Download Received File{receivedFiles.length > 1 ? 's' : ''}:
              </div>
              {receivedFiles.map((f, i) => (
                <a
                  key={i}
                  href={f.url}
                  download={f.name}
                  className="underline text-primary"
                >
                  {f.name}
                </a>
              ))}
            </div>
          )}
        </div>
      )}
      {uploading && (
        <div className="flex flex-col items-center mt-6">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 border-4 rounded-full border-primary border-t-transparent animate-spin" />
            <span className="font-medium text-primary">Uploading...</span>
          </div>
          <Progress value={uploadProgress} className="w-full mt-2" />
        </div>
      )}
      {qr && !uploading && <QRShare qr={qr} />}
      <div className="mt-4 text-sm text-center">{status}</div>
      {room && (qr || (!isSender && keyB64)) && (
        <div className="flex flex-col items-center justify-center gap-2 mt-2">
          <div className="flex items-center gap-2">
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
            <span className="ml-2 text-xs">
              {isSender ? 'You are the Sender' : 'You are the Receiver'}
            </span>
          </div>
          {!isSender && !peerOnline && (
            <div className="mt-2 text-sm text-center text-muted-foreground">
              Waiting for the sender to connect...
              <br />
              Please keep this page open. The transfer will start automatically
              when the sender is online.
            </div>
          )}
        </div>
      )}
      {fileProgress.length > 0 && (
        <ProgressList
          files={
            isSender
              ? files
              : Array(fileProgress.length).fill({ name: '', size: 0 })
          }
          progress={fileProgress}
          isSender={isSender}
        />
      )}
    </Card>
  );
}
