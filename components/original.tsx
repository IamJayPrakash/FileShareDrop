'use client';

import { useState, useRef, useCallback, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Upload, CircleDot, Circle } from 'lucide-react';
import { Progress } from '@/components/ui/progress';
import io from 'socket.io-client';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { Loader2 } from 'lucide-react';
import FileList from './FileList';
import ProgressList from './ProgressList';
import QRShare from './QRShare';

// Helper: Generate random AES-GCM key
async function generateKey() {
  console.log(`[${new Date().toISOString()}] Generating AES-GCM key`);
  const key = await crypto.subtle.generateKey(
    {
      name: 'AES-GCM',
      length: 256,
    },
    true,
    ['encrypt', 'decrypt']
  );
  console.log(`[${new Date().toISOString()}] AES-GCM key generated`);
  return key;
}

// Helper: Export key to Base64 string
async function exportKey(key: CryptoKey) {
  console.log(`[${new Date().toISOString()}] Exporting key to Base64`);
  const rawKey = await crypto.subtle.exportKey('raw', key);
  const keyB64 = btoa(String.fromCharCode(...new Uint8Array(rawKey)));
  console.log(
    `[${new Date().toISOString()}] Key exported to Base64: ${keyB64.slice(0, 10)}...`
  );
  return keyB64;
}

// Helper: Import key from Base64 string
async function importKey(keyB64: string) {
  console.log(
    `[${new Date().toISOString()}] Importing key from Base64: ${keyB64.slice(0, 10)}...`
  );
  // URL-decode and validate Base64 string
  let decodedKeyB64 = decodeURIComponent(keyB64);
  // Ensure Base64 string is padded correctly
  decodedKeyB64 = decodedKeyB64.padEnd(
    decodedKeyB64.length + ((4 - (decodedKeyB64.length % 4)) % 4),
    '='
  );
  // Validate Base64 format
  if (!/^[A-Za-z0-9+/=]+$/.test(decodedKeyB64)) {
    throw new Error('Invalid Base64 key format');
  }
  try {
    const rawKey = new Uint8Array(
      atob(decodedKeyB64)
        .split('')
        .map((c) => c.charCodeAt(0))
    );
    const key = await crypto.subtle.importKey(
      'raw',
      rawKey,
      { name: 'AES-GCM' },
      true,
      ['encrypt', 'decrypt']
    );
    console.log(`[${new Date().toISOString()}] Key imported`);
    return key;
  } catch (err) {
    console.error(`[${new Date().toISOString()}] Failed to import key:`, err);
    throw new Error(
      'Failed to import encryption key: Invalid or corrupted key'
    );
  }
}

// Helper: Encrypt file using AES-GCM
async function encryptFile(file: File, key: CryptoKey) {
  console.log(
    `[${new Date().toISOString()}] Encrypting file: ${file.name}, size: ${file.size}`
  );
  const iv = crypto.getRandomValues(new Uint8Array(12));
  console.log(`[${new Date().toISOString()}] Generated IV:`, iv);
  const fileBuffer = await file.arrayBuffer();
  console.log(
    `[${new Date().toISOString()}] File buffer created, size: ${fileBuffer.byteLength}`
  );
  const encrypted = await crypto.subtle.encrypt(
    {
      name: 'AES-GCM',
      iv: iv,
    },
    key,
    fileBuffer
  );
  console.log(
    `[${new Date().toISOString()}] File encrypted, size: ${encrypted.byteLength}`
  );
  return { iv, encrypted, encryptedSize: encrypted.byteLength };
}

// Helper: Decrypt file using AES-GCM
async function decryptFile(
  encryptedData: Uint8Array,
  key: CryptoKey,
  iv: Uint8Array
) {
  console.log(
    `[${new Date().toISOString()}] Decrypting data, size: ${encryptedData.length}, IV:`,
    iv
  );
  const decrypted = await crypto.subtle.decrypt(
    {
      name: 'AES-GCM',
      iv: iv,
    },
    key,
    encryptedData
  );
  console.log(
    `[${new Date().toISOString()}] Data decrypted, size: ${decrypted.byteLength}`
  );
  return new Blob([decrypted]);
}

const CHUNK_SIZE = 256 * 1024; // 256KB per chunk

export default function FileDropzone({
  roomProp = '',
  keyProp = '',
}: {
  roomProp?: string;
  keyProp?: string;
}) {
  const [files, setFiles] = useState<File[]>([]);
  const [status, setStatus] = useState<string>('');
  const [downloadUrl, setDownloadUrl] = useState<string>('');
  const [isSender, setIsSender] = useState<boolean>(false);
  const [keyB64, setKeyB64] = useState<string>(keyProp);
  const [cryptoKey, setCryptoKey] = useState<CryptoKey | null>(null);
  const ivRef = useRef<Uint8Array | null>(null);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [isDragOver, setIsDragOver] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [qr, setQr] = useState<string>('');
  const [room, setRoom] = useState<string>(roomProp);
  const pcRef = useRef<RTCPeerConnection | null>(null);
  const dcRef = useRef<RTCDataChannel | null>(null);
  const socketRef = useRef<ReturnType<typeof io> | null>(null);
  const [receivedFiles, setReceivedFiles] = useState<
    { url: string; name: string }[]
  >([]);
  const [peerOnline, setPeerOnline] = useState(false);
  const [isWaiting, setIsWaiting] = useState(false);
  const [fileProgress, setFileProgress] = useState<number[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [peerId, setPeerId] = useState<string | null>(null);
  const [joined, setJoined] = useState(false);
  const [offerStarted, setOfferStarted] = useState(false);
  const [receiverReady, setReceiverReady] = useState(false);
  const [transferComplete, setTransferComplete] = useState(false); // New state to track transfer completion

  // Reset state
  const resetState = useCallback(() => {
    console.log(`[${new Date().toISOString()}] Resetting state`);
    setFiles([]);
    setStatus('');
    setDownloadUrl('');
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
    console.log(`[${new Date().toISOString()}] State reset complete`);
  }, []);

  // Check for WebRTC support
  useEffect(() => {
    console.log(`[${new Date().toISOString()}] Checking WebRTC support`);
    if (typeof window !== 'undefined' && !('RTCPeerConnection' in window)) {
      console.error(`[${new Date().toISOString()}] WebRTC not supported`);
      setError(
        'Your browser does not support secure peer-to-peer transfer. Please use a modern browser.'
      );
    } else {
      console.log(`[${new Date().toISOString()}] WebRTC supported`);
    }
  }, []);

  // Connect to signaling server
  function connectSocket(room: string) {
    if (socketRef.current) {
      console.log(
        `[${new Date().toISOString()}] Socket already connected, skipping`
      );
      return;
    }
    console.log(
      `[${new Date().toISOString()}] Connecting to signaling server, room: ${room}`
    );
    const socket = io('http://localhost:3001', { path: '/api/signaling' });
    socketRef.current = socket;
    console.log(
      `[${new Date().toISOString()}] Emitting 'join' event for room: ${room}`
    );
    socket.emit('join', room);
    socket.on('joined', ({ id }) => {
      console.log(`[${new Date().toISOString()}] Joined room with ID: ${id}`);
      setStatus('Joined room');
      setPeerId(id);
      setJoined(true);
    });
    socket.on('peer-online', () => {
      console.log(`[${new Date().toISOString()}] Peer-online event received`);
      setPeerOnline(true);
    });
    socket.on('peer-offline', () => {
      console.log(`[${new Date().toISOString()}] Peer-offline event received`);
      setPeerOnline(false);
    });
    socket.on(
      'signal',
      async ({ from, signal }: { from: string; signal: any }) => {
        if (!pcRef.current || from === peerId) {
          console.warn(
            `[${new Date().toISOString()}] Ignoring signal: no peer connection or from self, from: ${from}, peerId: ${peerId}`
          );
          return;
        }
        console.log(
          `[${new Date().toISOString()}] Received signal from ${from}, type: ${signal.type || 'candidate'}`
        );
        setPeerOnline(true);
        try {
          if (signal.sdp) {
            const signalingState = pcRef.current.signalingState;
            console.log(
              `[${new Date().toISOString()}] Current signaling state: ${signalingState}`
            );
            if (signal.type === 'offer' && signalingState !== 'stable') {
              console.warn(
                `[${new Date().toISOString()}] Ignoring offer in non-stable state: ${signalingState}`
              );
              return;
            }
            if (
              signal.type === 'answer' &&
              signalingState !== 'have-local-offer'
            ) {
              console.warn(
                `[${new Date().toISOString()}] Ignoring answer in non-have-local-offer state: ${signalingState}`
              );
              return;
            }
            console.log(
              `[${new Date().toISOString()}] Setting remote description, type: ${signal.type}`
            );
            await pcRef.current.setRemoteDescription(
              new RTCSessionDescription(signal)
            );
            console.log(
              `[${new Date().toISOString()}] Set remote description: ${signal.type}`
            );
            if (
              signal.type === 'offer' &&
              pcRef.current.signalingState === 'have-remote-offer'
            ) {
              console.log(`[${new Date().toISOString()}] Creating answer`);
              const answer = await pcRef.current.createAnswer();
              console.log(
                `[${new Date().toISOString()}] Setting local description for answer`
              );
              await pcRef.current.setLocalDescription(answer);
              console.log(
                `[${new Date().toISOString()}] Emitting answer signal to ${from}`
              );
              socket.emit('signal', { target: from, signal: answer });
              console.log(
                `[${new Date().toISOString()}] Sent answer to ${from}`
              );
            }
          } else if (signal.candidate) {
            try {
              console.log(
                `[${new Date().toISOString()}] Adding ICE candidate:`,
                signal.candidate
              );
              await pcRef.current.addIceCandidate(new RTCIceCandidate(signal));
              console.log(`[${new Date().toISOString()}] Added ICE candidate`);
            } catch (err) {
              console.warn(
                `[${new Date().toISOString()}] Failed to add ICE candidate:`,
                err
              );
            }
          }
        } catch (err) {
          console.error(`[${new Date().toISOString()}] Signaling error:`, err);
          if (signal.sdp) {
            setError(
              'Failed to establish connection. Please refresh and try again.'
            );
            console.error(
              `[${new Date().toISOString()}] Set error: Failed to establish connection`
            );
          }
        }
      }
    );
    socket.on('disconnect', () => {
      console.log(`[${new Date().toISOString()}] Socket disconnected`);
      setPeerOnline(false);
      setError('Connection lost. Please refresh and try again.');
      console.error(`[${new Date().toISOString()}] Set error: Connection lost`);
    });
  }

  // Setup WebRTC peer connection
  async function setupConnection(
    isSender: boolean,
    room: string,
    keyB64: string,
    files?: File[],
    key?: CryptoKey
  ) {
    console.log(
      `[${new Date().toISOString()}] Setting up WebRTC connection, isSender: ${isSender}, room: ${room}, files: ${files?.length || 0}, key: ${!!key}`
    );
    setStatus('Setting up connection...');
    connectSocket(room);
    setIsWaiting(!isSender);
    console.log(`[${new Date().toISOString()}] Creating RTCPeerConnection`);
    const pc = new RTCPeerConnection({
      iceServers: [{ urls: 'stun:stun.l.google.com:19302' }],
    });
    pcRef.current = pc;
    pc.onicecandidate = (e) => {
      console.log(
        `[${new Date().toISOString()}] ICE candidate generated:`,
        e.candidate
      );
      if (e.candidate && socketRef.current) {
        console.log(
          `[${new Date().toISOString()}] Emitting ICE candidate signal to room: ${room}`
        );
        socketRef.current.emit('signal', { target: room, signal: e.candidate });
      }
    };
    pc.onconnectionstatechange = () => {
      console.log(
        `[${new Date().toISOString()}] Connection state changed: ${pc.connectionState}`
      );
      if (pc.connectionState === 'failed') {
        setError('WebRTC connection failed. Please refresh and try again.');
        console.error(
          `[${new Date().toISOString()}] Set error: WebRTC connection failed`
        );
      } else if (pc.connectionState === 'connected') {
        setStatus('Connection established');
        console.log(
          `[${new Date().toISOString()}] Set status: Connection established`
        );
      }
    };
    if (isSender) {
      const startSenderOffer = async () => {
        if (
          offerStarted ||
          !pcRef.current ||
          pcRef.current.signalingState !== 'stable'
        ) {
          console.log(
            `[${new Date().toISOString()}] Offer not started: already started=${offerStarted}, signalingState=${pcRef.current?.signalingState}`
          );
          return;
        }
        console.log(`[${new Date().toISOString()}] Starting sender offer`);
        setOfferStarted(true);
        console.log(
          `[${new Date().toISOString()}] Creating data channel 'file'`
        );
        const dc = pc.createDataChannel('file', {
          ordered: true,
          maxRetransmits: 5,
        });
        dcRef.current = dc;
        dc.onopen = async () => {
          console.log(
            `[${new Date().toISOString()}] DataChannel opened, state: ${dc.readyState}, label: ${dc.label}`
          );
          setStatus('DataChannel open, waiting for receiver acknowledgment...');
          if (dc.readyState !== 'open') {
            console.error(
              `[${new Date().toISOString()}] DataChannel not open, state: ${dc.readyState}`
            );
            setError('Data channel not ready. Please try again.');
            return;
          }
          console.log(
            `[${new Date().toISOString()}] Waiting 500ms before sending handshake`
          );
          await new Promise((resolve) => setTimeout(resolve, 500));
          const sendHandshake = () => {
            if (dc.readyState !== 'open') {
              console.error(
                `[${new Date().toISOString()}] DataChannel not open for handshake, state: ${dc.readyState}`
              );
              return;
            }
            console.log(
              `[${new Date().toISOString()}] Sending handshake, bufferedAmount: ${dc.bufferedAmount}`
            );
            dc.send(JSON.stringify({ type: 'handshake', message: 'ready' }));
            console.log(
              `[${new Date().toISOString()}] Handshake sent: { type: 'handshake', message: 'ready' }`
            );
          };
          sendHandshake();
          console.log(
            `[${new Date().toISOString()}] Starting handshake retry interval (every 2s)`
          );
          const retryInterval = setInterval(() => {
            if (receiverReady || transferComplete || dc.readyState !== 'open') {
              console.log(
                `[${new Date().toISOString()}] Stopping handshake retry: receiverReady=${receiverReady}, transferComplete=${transferComplete}, dc.readyState=${dc.readyState}`
              );
              clearInterval(retryInterval);
              return;
            }
            console.log(`[${new Date().toISOString()}] Retrying handshake...`);
            sendHandshake();
          }, 2000);
          console.log(
            `[${new Date().toISOString()}] Setting handshake timeout (10s)`
          );
          setTimeout(() => {
            if (
              !receiverReady &&
              !transferComplete &&
              dc.readyState === 'open'
            ) {
              console.error(`[${new Date().toISOString()}] Handshake timeout`);
              setError('Receiver did not respond. Please try again.');
              clearInterval(retryInterval);
              console.error(
                `[${new Date().toISOString()}] Set error: Receiver did not respond`
              );
            }
          }, 10000);
        };
        dc.onmessage = async (ev) => {
          console.log(
            `[${new Date().toISOString()}] Sender received data channel message, raw:`,
            ev.data
          );
          console.log(
            `[${new Date().toISOString()}] Sender received data channel message, type:`,
            typeof ev.data
          );
          try {
            if (typeof ev.data !== 'string') {
              console.warn(
                `[${new Date().toISOString()}] Unexpected non-string message:`,
                ev.data
              );
              return;
            }
            const message = JSON.parse(ev.data);
            console.log(
              `[${new Date().toISOString()}] Sender parsed data channel message:`,
              message
            );
            if (
              message.type === 'ack' &&
              message.message === 'receiver-ready'
            ) {
              console.log(
                `[${new Date().toISOString()}] Receiver acknowledged, starting file transfer, files: ${files?.length || 0}, key: ${!!key}`
              );
              setReceiverReady(true);
              setStatus('DataChannel open, sending files...');
              if (!files || files.length === 0 || !key) {
                console.error(
                  `[${new Date().toISOString()}] Missing files or key for file transfer, files: ${files?.length || 0}, key: ${!!key}`
                );
                setError(
                  'Failed to start file transfer: missing files or encryption key.'
                );
                return;
              }
              try {
                // Precompute encrypted sizes for metadata
                const meta = [];
                for (const f of files) {
                  const { encryptedSize } = await encryptFile(f, key);
                  meta.push({
                    name: f.name,
                    size: encryptedSize, // Use encrypted size
                    originalSize: f.size, // Include original size for reference
                    type: f.type,
                  });
                }
                console.log(
                  `[${new Date().toISOString()}] Sending metadata:`,
                  meta
                );
                if (dc.readyState !== 'open') {
                  console.error(
                    `[${new Date().toISOString()}] DataChannel not open for metadata, state: ${dc.readyState}`
                  );
                  setError('Data channel not ready. Please try again.');
                  return;
                }
                dc.send(JSON.stringify({ type: 'meta', files: meta }));
                console.log(`[${new Date().toISOString()}] Metadata sent:`, {
                  type: 'meta',
                  files: meta,
                });
                setFileProgress(Array(files.length).fill(0));
                console.log(
                  `[${new Date().toISOString()}] Initialized file progress:`,
                  Array(files.length).fill(0)
                );
                for (let i = 0; i < files.length; i++) {
                  console.log(
                    `[${new Date().toISOString()}] Starting transfer for file ${i}: ${files[i].name}`
                  );
                  setStatus(`Encrypting and sending: ${files[i].name}`);
                  await sendFileInChunks(dc, files[i], key, i);
                }
                setStatus('All files sent!');
                setTransferComplete(true); // Mark transfer as complete
                console.log(`[${new Date().toISOString()}] All files sent`);
              } catch (err) {
                console.error(
                  `[${new Date().toISOString()}] Error sending files:`,
                  err
                );
                setError('Failed to send files. Please try again.');
                console.error(
                  `[${new Date().toISOString()}] Set error: Failed to send files`
                );
              }
            } else {
              console.warn(
                `[${new Date().toISOString()}] Unexpected message type:`,
                message
              );
            }
          } catch (err) {
            console.error(
              `[${new Date().toISOString()}] Sender error processing data channel message:`,
              err
            );
            setError(
              'Failed to process receiver acknowledgment. Please try again.'
            );
            console.error(
              `[${new Date().toISOString()}] Set error: Failed to process receiver acknowledgment`
            );
          }
        };
        dc.onerror = (error) => {
          console.error(
            `[${new Date().toISOString()}] DataChannel error:`,
            error
          );
          setError('Data channel error. Please try again.');
          console.error(
            `[${new Date().toISOString()}] Set error: Data channel error`
          );
        };
        dc.onclose = () => {
          console.log(`[${new Date().toISOString()}] DataChannel closed`);
          if (fileProgress.some((p) => p < 100)) {
            setError('Data channel closed before all files were sent.');
            console.error(
              `[${new Date().toISOString()}] Set error: Data channel closed before all files sent`
            );
          }
        };
        try {
          console.log(`[${new Date().toISOString()}] Creating offer`);
          const offer = await pc.createOffer();
          console.log(
            `[${new Date().toISOString()}] Setting local description for offer`
          );
          await pc.setLocalDescription(offer);
          if (socketRef.current) {
            console.log(
              `[${new Date().toISOString()}] Emitting offer signal to room: ${room}`
            );
            socketRef.current.emit('signal', { target: room, signal: offer });
            console.log(`[${new Date().toISOString()}] Sent offer`);
          }
        } catch (err) {
          console.error(
            `[${new Date().toISOString()}] Failed to create/send offer:`,
            err
          );
          setError(
            'Failed to initiate connection. Please refresh and try again.'
          );
          console.error(
            `[${new Date().toISOString()}] Set error: Failed to initiate connection`
          );
        }
      };
      socketRef.current?.off('peer-online');
      socketRef.current?.on('peer-online', () => {
        console.log(
          `[${new Date().toISOString()}] Peer-online event received, attempting to start offer`
        );
        startSenderOffer();
      });
      if (peerOnline) {
        console.log(
          `[${new Date().toISOString()}] Peer already online, starting offer`
        );
        startSenderOffer();
      }
    } else {
      console.log(
        `[${new Date().toISOString()}] Setting up receiver, waiting for data channel`
      );
      pc.ondatachannel = (e) => {
        console.log(
          `[${new Date().toISOString()}] Receiver ondatachannel fired, channel label: ${e.channel.label}`
        );
        setIsWaiting(false);
        const dc = e.channel;
        dcRef.current = dc;
        let meta: any = null;
        let receivedFilesMeta: {
          name: string;
          size: number;
          originalSize: number;
          type: string;
        }[] = [];
        let receivedCount = 0;
        let receivedIv: Uint8Array | null = null;
        let receivedChunks: Uint8Array[] = [];
        let currentFileIdx = 0;
        let key: CryptoKey | null = null;
        let fileBlobs: Blob[] = [];
        let fileTotal = 0;
        let fileReceived = 0;
        dc.onopen = () => {
          console.log(
            `[${new Date().toISOString()}] Receiver DataChannel opened, state: ${dc.readyState}, label: ${dc.label}`
          );
          setStatus('DataChannel open, ready to receive files...');
        };
        dc.onmessage = async (ev) => {
          console.log(
            `[${new Date().toISOString()}] Receiver received data channel message, raw:`,
            ev.data
          );
          console.log(
            `[${new Date().toISOString()}] Receiver received data channel message, type:`,
            typeof ev.data
          );
          try {
            // Handle string messages (handshake or meta)
            if (typeof ev.data === 'string') {
              const parsed = JSON.parse(ev.data);
              console.log(
                `[${new Date().toISOString()}] Receiver parsed message:`,
                parsed
              );
              if (parsed.type === 'handshake' && parsed.message === 'ready') {
                console.log(
                  `[${new Date().toISOString()}] Received sender handshake`
                );
                if (dc.readyState !== 'open') {
                  console.error(
                    `[${new Date().toISOString()}] DataChannel not open for ack, state: ${dc.readyState}`
                  );
                  setError('Data channel not ready. Please try again.');
                  return;
                }
                console.log(
                  `[${new Date().toISOString()}] Sending acknowledgment, bufferedAmount: ${dc.bufferedAmount}`
                );
                dc.send(
                  JSON.stringify({ type: 'ack', message: 'receiver-ready' })
                );
                console.log(
                  `[${new Date().toISOString()}] Acknowledgment sent: { type: 'ack', message: 'receiver-ready' }`
                );
                return;
              }
              if (parsed.type === 'meta' && !meta) {
                console.log(
                  `[${new Date().toISOString()}] Received metadata:`,
                  parsed
                );
                meta = parsed;
                receivedFilesMeta = meta.files;
                setStatus('Waiting for file data...');
                console.log(
                  `[${new Date().toISOString()}] Importing key for decryption`
                );
                key = await importKey(keyB64);
                setUploadProgress(0);
                setReceivedFiles([]);
                setFileProgress(Array(receivedFilesMeta.length).fill(0));
                console.log(
                  `[${new Date().toISOString()}] Initialized file progress:`,
                  Array(receivedFilesMeta.length).fill(0)
                );
                return;
              }
              console.warn(
                `[${new Date().toISOString()}] Unexpected string message:`,
                parsed
              );
              return;
            }
            // Handle binary data (IV or chunks) only if meta is set
            if (!meta) {
              console.warn(
                `[${new Date().toISOString()}] Unexpected binary message before metadata:`,
                ev.data
              );
              return;
            }
            if (!receivedIv) {
              receivedIv = new Uint8Array(ev.data);
              console.log(
                `[${new Date().toISOString()}] Received IV:`,
                receivedIv
              );
              fileTotal = receivedFilesMeta[currentFileIdx]?.size || 0; // Use encrypted size
              fileReceived = 0;
              receivedChunks = [];
              console.log(
                `[${new Date().toISOString()}] File ${currentFileIdx} total size: ${fileTotal}`
              );
              // Handle empty file
              if (fileTotal === 0) {
                console.log(
                  `[${new Date().toISOString()}] Processing empty file: ${receivedFilesMeta[currentFileIdx]?.name}`
                );
                const blob = new Blob([]); // Empty blob for 0-byte file
                fileBlobs.push(blob);
                receivedCount++;
                setStatus(
                  `Received: ${receivedFilesMeta[currentFileIdx]?.name || ''}`
                );
                setUploadProgress(
                  Math.round((receivedCount / receivedFilesMeta.length) * 100)
                );
                setReceivedFiles((prev) => [
                  ...prev,
                  {
                    url: URL.createObjectURL(blob),
                    name:
                      receivedFilesMeta[currentFileIdx]?.name ||
                      `file${currentFileIdx + 1}`,
                  },
                ]);
                console.log(
                  `[${new Date().toISOString()}] Empty file processed, receivedCount: ${receivedCount}`
                );
                receivedIv = null;
                receivedChunks = [];
                currentFileIdx++;
                setFileProgress((prev) => {
                  const copy = [...prev];
                  copy[currentFileIdx] = 100;
                  return copy;
                });
                if (receivedCount === receivedFilesMeta.length) {
                  setStatus('All files received!');
                  console.log(
                    `[${new Date().toISOString()}] All files received`
                  );
                }
                return;
              }
            } else {
              const chunk = new Uint8Array(ev.data);
              console.log(
                `[${new Date().toISOString()}] Received chunk of size ${chunk.length} for file ${currentFileIdx}`
              );
              receivedChunks.push(chunk);
              fileReceived += chunk.length;
              console.log(
                `[${new Date().toISOString()}] File ${currentFileIdx} received: ${fileReceived}/${fileTotal}`
              );
              setFileProgress((prev) => {
                const copy = [...prev];
                copy[currentFileIdx] = Math.min(
                  100,
                  Math.round((fileReceived / fileTotal) * 100)
                );
                return copy;
              });
              if (fileReceived >= fileTotal) {
                console.log(
                  `[${new Date().toISOString()}] Assembling file: ${receivedFilesMeta[currentFileIdx]?.name}`
                );
                const encryptedData = new Uint8Array(fileTotal);
                let offset = 0;
                for (const c of receivedChunks) {
                  if (offset + c.length > fileTotal) {
                    console.error(
                      `[${new Date().toISOString()}] Chunk size exceeds expected total: offset=${offset}, chunk.length=${c.length}, fileTotal=${fileTotal}`
                    );
                    setError('Received data exceeds expected file size.');
                    return;
                  }
                  encryptedData.set(c, offset);
                  offset += c.length;
                }
                if (offset !== fileTotal) {
                  console.error(
                    `[${new Date().toISOString()}] Assembled data size mismatch: offset=${offset}, fileTotal=${fileTotal}`
                  );
                  setError('Incomplete file data received.');
                  return;
                }
                console.log(
                  `[${new Date().toISOString()}] Decrypting file, size: ${encryptedData.length}`
                );
                if (!key) {
                  console.error(
                    `[${new Date().toISOString()}] Decryption key not available`
                  );
                  setError('Decryption key not available.');
                  return;
                }
                const blob = await decryptFile(encryptedData, key, receivedIv);
                fileBlobs.push(blob);
                receivedCount++;
                setStatus(
                  `Received: ${receivedFilesMeta[currentFileIdx]?.name || ''}`
                );
                setUploadProgress(
                  Math.round((receivedCount / receivedFilesMeta.length) * 100)
                );
                setReceivedFiles((prev) => [
                  ...prev,
                  {
                    url: URL.createObjectURL(blob),
                    name:
                      receivedFilesMeta[currentFileIdx]?.name ||
                      `file${currentFileIdx + 1}`,
                  },
                ]);
                console.log(
                  `[${new Date().toISOString()}] File received, receivedCount: ${receivedCount}, name: ${receivedFilesMeta[currentFileIdx]?.name}`
                );
                receivedIv = null;
                receivedChunks = [];
                currentFileIdx++;
                setFileProgress((prev) => {
                  const copy = [...prev];
                  copy[currentFileIdx - 1] = 100;
                  return copy;
                });
                if (receivedCount === receivedFilesMeta.length) {
                  setStatus('All files received!');
                  console.log(
                    `[${new Date().toISOString()}] All files received`
                  );
                }
              }
            }
          } catch (err) {
            console.error(
              `[${new Date().toISOString()}] Receiver error processing data channel theme:`,
              err
            );
            let errorMsg = 'Failed to process received data';
            if (err && typeof err === 'object' && 'message' in err) {
              errorMsg += ': ' + (err as any).message;
            }
            setError(errorMsg);
            console.error(
              `[${new Date().toISOString()}] Set error: Failed to process received data`
            );
          }
        };
        dc.onerror = (error) => {
          console.error(
            `[${new Date().toISOString()}] Receiver DataChannel error:`,
            error
          );
          setError('Data channel error. Please try again.');
          console.error(
            `[${new Date().toISOString()}] Set error: Data channel error`
          );
        };
        dc.onclose = () => {
          console.log(
            `[${new Date().toISOString()}] Receiver DataChannel closed`
          );
          if (receivedCount < receivedFilesMeta.length) {
            setError('Data channel closed before all files were received.');
            console.error(
              `[${new Date().toISOString()}] Set error: Data channel closed before all files received`
            );
          }
        };
      };
    }
  }

  async function sendFileInChunks(
    dc: RTCDataChannel,
    file: File,
    key: CryptoKey,
    idx: number
  ) {
    console.log(
      `[${new Date().toISOString()}] Preparing to send file: ${file.name}, size: ${file.size}`
    );
    if (dc.readyState !== 'open') {
      console.error(
        `[${new Date().toISOString()}] DataChannel not open, state: ${dc.readyState}`
      );
      setError('Data channel not ready. Please try again.');
      return;
    }
    const { encrypted, iv } = await encryptFile(file, key);
    console.log(
      `[${new Date().toISOString()}] Sending IV for file ${file.name}:`,
      iv
    );
    if (dc.bufferedAmount > 65535) {
      console.log(
        `[${new Date().toISOString()}] Waiting for buffer to clear, bufferedAmount: ${dc.bufferedAmount}`
      );
      await new Promise((resolve) => {
        dc.onbufferedamountlow = () => {
          console.log(
            `[${new Date().toISOString()}] Buffer cleared, bufferedAmount: ${dc.bufferedAmount}`
          );
          resolve(null);
        };
        dc.bufferedAmountLowThreshold = 16384;
      });
    }
    dc.send(iv);
    console.log(`[${new Date().toISOString()}] IV sent for file ${file.name}`);
    const total = encrypted.byteLength;
    console.log(
      `[${new Date().toISOString()}] Sending file ${file.name}, total size: ${total} bytes`
    );
    if (total === 0) {
      console.log(
        `[${new Date().toISOString()}] File ${file.name} is empty, marking as sent`
      );
      setFileProgress((prev) => {
        const copy = [...prev];
        copy[idx] = 100;
        return copy;
      });
      return;
    }
    let offset = 0;
    while (offset < total) {
      const chunk = encrypted.slice(offset, offset + CHUNK_SIZE);
      console.log(
        `[${new Date().toISOString()}] Sending chunk ${offset}-${offset + chunk.byteLength}, bufferedAmount: ${dc.bufferedAmount}`
      );
      if (dc.readyState !== 'open') {
        console.error(
          `[${new Date().toISOString()}] DataChannel closed during chunk send, state: ${dc.readyState}`
        );
        setError('Data channel closed during transfer. Please try again.');
        return;
      }
      if (dc.bufferedAmount > 65535) {
        console.log(
          `[${new Date().toISOString()}] Waiting for buffer to clear, bufferedAmount: ${dc.bufferedAmount}`
        );
        await new Promise((resolve) => {
          dc.onbufferedamountlow = () => {
            console.log(
              `[${new Date().toISOString()}] Buffer cleared, bufferedAmount: ${dc.bufferedAmount}`
            );
            resolve(null);
          };
          dc.bufferedAmountLowThreshold = 16384;
        });
      }
      dc.send(chunk);
      console.log(
        `[${new Date().toISOString()}] Chunk sent: ${offset}-${offset + chunk.byteLength}`
      );
      offset += CHUNK_SIZE;
      setFileProgress((prev) => {
        const copy = [...prev];
        copy[idx] = Math.min(100, Math.round((offset / total) * 100));
        return copy;
      });
      console.log(
        `[${new Date().toISOString()}] Updated progress for file ${idx}: ${Math.min(100, Math.round((offset / total) * 100))}%`
      );
      await new Promise((resolve) => setTimeout(resolve, 50));
    }
    console.log(
      `[${new Date().toISOString()}] Finished sending file ${file.name}`
    );
    setFileProgress((prev) => {
      const copy = [...prev];
      copy[idx] = 100;
      return copy;
    });
  }

  // Sender: handle file selection and start
  async function handleSend() {
    console.log(
      `[${new Date().toISOString()}] Handling send, files:`,
      files.map((f) => f.name)
    );
    if (!files.length) {
      console.warn(`[${new Date().toISOString()}] No files selected`);
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
    ); // Encode key in URL
    console.log(
      `[${new Date().toISOString()}] QR code generated: ${window.location.origin}/share/${roomToUse}?key=${encodeURIComponent(keyB64ToUse).slice(0, 10)}...`
    );
    let progress = 0;
    setUploadProgress(0);
    setStatus('Encrypting and uploading...');
    const progressInterval = setInterval(() => {
      progress += Math.random() * 10 + 5;
      setUploadProgress(Math.min(progress, 95));
      console.log(
        `[${new Date().toISOString()}] Updating upload progress: ${Math.min(progress, 95)}%`
      );
    }, 200);
    console.log(`[${new Date().toISOString()}] Setting up sender connection`);
    await setupConnection(true, roomToUse, keyB64ToUse, files, key);
    clearInterval(progressInterval);
    setUploadProgress(100);
    setUploading(false);
    setStatus('Ready to share!');
    setSendDisabled(true);
    console.log(
      `[${new Date().toISOString()}] Sender setup complete, status: Ready to share`
    );
  }

  // Receiver: join room and start
  async function handleReceive(room: string, keyB64: string) {
    console.log(
      `[${new Date().toISOString()}] Handling receive, room: ${room}, keyB64: ${keyB64.slice(0, 10)}...`
    );
    setRoom(room);
    setKeyB64(keyB64);
    setIsSender(false);
    setStatus('Connecting to sender...');
    await setupConnection(false, room, keyB64);
    console.log(`[${new Date().toISOString()}] Receiver setup complete`);
  }

  // On mount, if roomProp and keyProp are present, auto-join as receiver
  useEffect(() => {
    if (roomProp && keyProp) {
      console.log(
        `[${new Date().toISOString()}] Auto-joining as receiver, roomProp: ${roomProp}, keyProp: ${keyProp.slice(0, 10)}...`
      );
      setRoom(roomProp);
      setKeyB64(keyProp);
      setIsSender(false);
      setStatus('Connecting to sender...');
      setupConnection(false, roomProp, keyProp);
    }
  }, [roomProp, keyProp]);

  // If sender, and files are selected, and a QR is generated, allow sender to join as sender
  useEffect(() => {
    if (isSender && files.length > 0 && qr && room && keyB64 && cryptoKey) {
      console.log(
        `[${new Date().toISOString()}] Sender re-setup triggered, files: ${files.length}, room: ${room}, key: ${!!cryptoKey}`
      );
      setupConnection(true, room, keyB64, files, cryptoKey);
    }
  }, [isSender, files, qr, room, keyB64, cryptoKey]);

  // Drag-and-drop and click-to-browse logic
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

  // Add handleClick to trigger file input
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
          <Loader2 className="w-10 h-10 mb-2 animate-spin text-primary" />
          <div className="mb-2 text-base font-medium text-primary">
            Waiting for sender to transfer files...
          </div>
          <div className="mb-4 text-xs text-muted-foreground">
            Keep this page open. The transfer will start automatically when the
            sender is online.
          </div>
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
