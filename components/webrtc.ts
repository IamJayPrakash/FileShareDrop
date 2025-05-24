import io from 'socket.io-client';
import { toast } from 'sonner';
import JSZip from 'jszip';
import { encryptFile, decryptFile, importKey } from './crypto';
import { FileMeta, ReceivedFile } from './types';

const CHUNK_SIZE = 256 * 1024; // 256KB per chunk
const ZIP_SIZE_THRESHOLD = 10 * 1024 * 1024; // 10MB

function debounce<T extends (...args: any[]) => void>(func: T, wait: number) {
  let timeout: NodeJS.Timeout | null = null;
  return (...args: Parameters<T>) => {
    if (timeout) clearTimeout(timeout);
    timeout = setTimeout(() => func(...args), wait);
  };
}

async function getIceServers(setError: (error: string | null) => void) {
  console.log(`[${new Date().toISOString()}] Using public STUN servers`);
  return [
    { urls: 'stun:stun.l.google.com:19302' },
    { urls: 'stun:stun1.l.google.com:19302' },
    { urls: 'stun:stun2.l.google.com:19302' },
    { urls: 'stun:stun3.l.google.com:19302' },
    { urls: 'stun:stun4.l.google.com:19302' },
  ];
}

export async function connectSocket(
  room: string,
  setStatus: (status: string) => void,
  setPeerOnline: (online: boolean) => void,
  setError: (error: string | null) => void,
  socketRef: React.MutableRefObject<ReturnType<typeof io> | null>
) {
  if (socketRef.current) {
    console.log(
      `[${new Date().toISOString()}] Socket already connected, skipping`
    );
    return socketRef.current;
  }
  console.log(
    `[${new Date().toISOString()}] Connecting to signaling server, room: ${room}`
  );
  const socket = io(
    process.env.NEXT_PUBLIC_SIGNALING_URL ?? 'http://localhost:3001',
    {
      path: '/api/signaling',
      query: { room },
      reconnection: true,
      reconnectionAttempts: 5,
      reconnectionDelay: 1000,
    }
  );
  socketRef.current = socket;
  const sessionId = Math.random().toString(36).substring(2);
  console.log(
    `[${new Date().toISOString()}] Generated sessionId: ${sessionId}`
  );
  socket.emit('join', { room, sessionId });
  socket.on('joined', (id: string) => {
    console.log(`[${new Date().toISOString()}] Joined room with ID: ${id}`);
    setStatus('Joined room');
  });
  socket.on('peer-online', () => {
    console.log(`[${new Date().toISOString()}] Peer-online event received`);
    setPeerOnline(true);
  });
  socket.on('peer-offline', () => {
    console.log(`[${new Date().toISOString()}] Peer-offline event received`);
    setPeerOnline(false);
  });
  socket.on('transfer-complete', () => {
    console.log(
      `[${new Date().toISOString()}] Transfer complete event received`
    );
    setPeerOnline(false);
    if (socketRef.current) {
      socketRef.current.disconnect();
      socketRef.current = null;
    }
  });
  socket.on('disconnect', () => {
    console.log(`[${new Date().toISOString()}] Socket disconnected`);
    setPeerOnline(false);
    setError('Connection lost. Please refresh and try again.');
    toast.error('Connection lost. Please refresh and try again.');
  });
  return socket;
}

export async function setupConnection(
  isSender: boolean,
  room: string,
  keyB64: string,
  files: File[] | undefined,
  key: CryptoKey | undefined,
  setStatus: (status: string) => void,
  setIsWaiting: (waiting: boolean) => void,
  setError: (error: string | null) => void,
  setFileProgress: React.Dispatch<React.SetStateAction<number[]>>,
  setReceivedFiles: (files: ReceivedFile[]) => void,
  setUploadProgress: (progress: number) => void,
  socketRef: React.MutableRefObject<ReturnType<typeof io> | null>,
  pcRef: React.MutableRefObject<RTCPeerConnection | null>,
  dcRef: React.MutableRefObject<RTCDataChannel | null>,
  setPeerOnline: (online: boolean) => void,
  setTransferComplete: (complete: boolean) => void,
  setReceivedFilesMeta: (meta: FileMeta[]) => void
) {
  console.log(
    `[${new Date().toISOString()}] Setting up WebRTC connection, isSender: ${isSender}, room: ${room}, files: ${files?.length ?? 0}, key: ${!!key}`
  );
  setStatus('Connecting to peer...');
  const sessionId = Math.random().toString(36).substring(2);
  const socket = await connectSocket(
    room,
    setStatus,
    setPeerOnline,
    setError,
    socketRef
  );
  setIsWaiting(!isSender);

  const iceServers = await getIceServers(setError);
  const pc = new RTCPeerConnection({ iceServers });
  pcRef.current = pc;

  pc.onicegatheringstatechange = () => {
    console.log(
      `[${new Date().toISOString()}] ICE gathering state: ${pc.iceGatheringState}`
    );
  };

  const connectionTimeout = setTimeout(() => {
    if (pc.connectionState !== 'connected') {
      setError(
        'Connection timed out. The peer may be on a restrictive network. Try a different network or refresh.'
      );
      toast.error(
        'Connection timed out. The peer may be on a restrictive network. Try a different network or refresh.'
      );
      pc.close();
      if (socketRef.current) {
        socketRef.current.disconnect();
      }
    }
  }, 30000);

  pc.onicecandidate = (e) => {
    if (e.candidate && socketRef.current) {
      console.log(
        `[${new Date().toISOString()}] Sending ICE candidate:`,
        e.candidate.candidate
      );
      socketRef.current.emit('signal', {
        target: `room-${room}`,
        signal: e.candidate,
        sessionId,
      });
    }
  };

  pc.onconnectionstatechange = () => {
    console.log(
      `[${new Date().toISOString()}] Connection state: ${pc.connectionState}, ICE: ${pc.iceConnectionState}`
    );
    if (
      pc.connectionState === 'failed' ||
      pc.connectionState === 'disconnected'
    ) {
      setError(
        'Connection failed. The peer may be on a restrictive network. Try a different network or refresh.'
      );
      toast.error(
        'Connection failed. The peer may be on a restrictive network. Try a different network or refresh.'
      );
      clearTimeout(connectionTimeout);
    } else if (pc.connectionState === 'connected') {
      setStatus('Connected to peer');
      clearTimeout(connectionTimeout);
    }
  };

  let isReceiverReady = false;
  let transferComplete = false;

  if (isSender) {
    const dc = pc.createDataChannel('file', {
      ordered: true,
      maxRetransmits: 5,
    });
    dcRef.current = dc;
    let retryInterval: NodeJS.Timeout | null = null;
    dc.onopen = async () => {
      console.log(
        `[${new Date().toISOString()}] DataChannel opened for sender`
      );
      setStatus('Connected, waiting for receiver...');
      const sendHandshake = () => {
        if (dc.readyState !== 'open') return;
        dc.send(JSON.stringify({ type: 'handshake', message: 'ready' }));
      };
      sendHandshake();
      retryInterval = setInterval(sendHandshake, 2000);
    };
    dc.onmessage = async (ev) => {
      try {
        if (typeof ev.data !== 'string') return;
        const message = JSON.parse(ev.data);
        if (message.type === 'ack' && message.message === 'receiver-ready') {
          isReceiverReady = true;
          if (retryInterval) clearInterval(retryInterval);
          setStatus('Sending files...');
          if (!files || files.length === 0 || !key) {
            setError('Missing files or encryption key.');
            toast.error('Missing files or encryption key.');
            return;
          }
          const meta: FileMeta[] = [];
          for (const f of files) {
            const { encryptedSize } = await encryptFile(f, key);
            meta.push({
              name: f.name,
              size: encryptedSize,
              originalSize: f.size,
              type: f.type,
            });
          }
          dc.send(JSON.stringify({ type: 'meta', files: meta }));
          setFileProgress(new Array(files.length).fill(0));
          for (let i = 0; i < files.length; i++) {
            setStatus(`Sending: ${files[i].name}`);
            await sendFileInChunks(
              dc,
              files[i],
              key,
              i,
              setFileProgress,
              setError
            );
          }
          setStatus('Files sent, waiting for receiver confirmation...');
          toast.success('Files sent successfully!');
        } else if (message.type === 'complete') {
          setTransferComplete(true);
          setStatus('Transfer complete');
          setTimeout(() => {
            dc.close();
            pc.close();
            if (socketRef.current) {
              socketRef.current.emit('transfer-complete', { room });
            }
          }, 2000);
        }
      } catch (err) {
        setError('Error during transfer: ' + (err as Error).message);
        toast.error('Error during transfer: ' + (err as Error).message);
      }
    };
    dc.onerror = (error) => {
      let errorMessage = 'Data channel error';
      if (error && typeof error === 'object' && 'message' in error) {
        errorMessage += ': ' + (error as any).message;
      } else if (
        error &&
        typeof error === 'object' &&
        'error' in error &&
        typeof (error as any).error?.message === 'string'
      ) {
        errorMessage += ': ' + (error as any).error.message;
      } else {
        errorMessage += ': ' + String(error);
      }
      setError(errorMessage);
      toast.error(errorMessage);
    };
    dc.onclose = () => {
      console.log(`[${new Date().toISOString()}] DataChannel closed`);
      if (!isReceiverReady && !transferComplete) {
        setError('Data channel closed unexpectedly.');
        toast.error('Data channel closed unexpectedly.');
      }
    };
    const startSenderOffer = async () => {
      if (pc.signalingState !== 'stable') {
        console.log(
          `[${new Date().toISOString()}] Skipping offer, signalingState: ${pc.signalingState}`
        );
        return;
      }
      try {
        const offer = await pc.createOffer();
        await pc.setLocalDescription(offer);
        socketRef.current?.emit('signal', {
          target: `room-${room}`,
          signal: offer,
          sessionId,
        });
        console.log(`[${new Date().toISOString()}] Sent offer`);
      } catch (err) {
        setError('Failed to create offer: ' + (err as Error).message);
        toast.error('Failed to create offer: ' + (err as Error).message);
      }
    };
    socket.off('peer-online');
    socket.on('peer-online', () => {
      console.log(`[${new Date().toISOString()}] Peer online, sending offer`);
      setPeerOnline(true);
      startSenderOffer();
    });
  } else {
    pc.ondatachannel = (e) => {
      setIsWaiting(false);
      const dc = e.channel;
      dcRef.current = dc;
      let meta: { files: FileMeta[] } | null = null;
      let receivedFilesMeta: FileMeta[] = [];
      let receivedCount = 0;
      let receivedIv: Uint8Array | null = null;
      let receivedChunks: Uint8Array[] = [];
      let currentFileIdx = 0;
      let key: CryptoKey | null = null;
      let fileBlobs: Blob[] = [];
      let fileTotal = 0;
      let fileReceived = 0;
      let receivedFiles: ReceivedFile[] = [];
      dc.onopen = () => {
        console.log(
          `[${new Date().toISOString()}] Receiver DataChannel opened`
        );
        setStatus('Connected, ready to receive files...');
      };
      dc.onmessage = async (ev) => {
        try {
          if (typeof ev.data === 'string') {
            const parsed = JSON.parse(ev.data);
            if (parsed.type === 'handshake' && parsed.message === 'ready') {
              console.log(
                `[${new Date().toISOString()}] Received sender handshake`
              );
              dc.send(
                JSON.stringify({ type: 'ack', message: 'receiver-ready' })
              );
              return;
            }
            if (parsed.type === 'meta' && !meta) {
              console.log(
                `[${new Date().toISOString()}] Received metadata:`,
                parsed
              );
              if (
                !Array.isArray(parsed.files) ||
                parsed.files.some(
                  (f: FileMeta) =>
                    !f.name ||
                    typeof f.size !== 'number' ||
                    typeof f.originalSize !== 'number'
                )
              ) {
                setError('Invalid metadata received.');
                toast.error('Invalid metadata received.');
                return;
              }
              meta = parsed;
              receivedFilesMeta = meta?.files ?? [];
              setReceivedFilesMeta(receivedFilesMeta);
              key = await importKey(keyB64);
              setUploadProgress(0);
              setReceivedFiles([]);
              setFileProgress(new Array(receivedFilesMeta.length).fill(0));
              setStatus('Receiving files...');
              return;
            }
            return;
          }
          if (!meta || !receivedFilesMeta[currentFileIdx]) return;
          if (!receivedIv) {
            receivedIv = new Uint8Array(ev.data);
            console.log(
              `[${new Date().toISOString()}] Received IV:`,
              receivedIv
            );
            fileTotal = receivedFilesMeta[currentFileIdx].size;
            fileReceived = 0;
            receivedChunks = [];
            if (fileTotal === 0) {
              console.log(
                `[${new Date().toISOString()}] Processing empty file`
              );
              const blob = new Blob([]);
              fileBlobs.push(blob);
              await handleFileReceived(
                fileBlobs,
                receivedFilesMeta,
                receivedCount,
                currentFileIdx,
                setStatus,
                setUploadProgress,
                setReceivedFiles,
                setFileProgress,
                setError,
                receivedFiles
              );
              receivedFiles.push({
                url: URL.createObjectURL(fileBlobs[currentFileIdx]),
                name: receivedFilesMeta[currentFileIdx].name,
              });
              receivedCount++;
              receivedIv = null;
              currentFileIdx++;
              return;
            }
          } else {
            const chunk = new Uint8Array(ev.data);
            console.log(
              `[${new Date().toISOString()}] Received chunk of size ${chunk.length}`
            );
            receivedChunks.push(chunk);
            fileReceived += chunk.length;
            setFileProgress((prev: number[]) => {
              const copy = [...prev];
              copy[currentFileIdx] = Math.min(
                100,
                Math.round((fileReceived / fileTotal) * 100)
              );
              return copy;
            });
            if (fileReceived >= fileTotal) {
              console.log(
                `[${new Date().toISOString()}] Assembling file: ${receivedFilesMeta[currentFileIdx].name}`
              );
              const encryptedData = new Uint8Array(fileTotal);
              let offset = 0;
              for (const c of receivedChunks) {
                encryptedData.set(c, offset);
                offset += c.length;
              }
              if (!key) {
                setError('Decryption key missing.');
                toast.error('Decryption key missing.');
                return;
              }
              const blob = await decryptFile(encryptedData, key, receivedIv);
              fileBlobs.push(blob);
              await handleFileReceived(
                fileBlobs,
                receivedFilesMeta,
                receivedCount,
                currentFileIdx,
                setStatus,
                setUploadProgress,
                setReceivedFiles,
                setFileProgress,
                setError,
                receivedFiles
              );
              receivedFiles.push({
                url: URL.createObjectURL(fileBlobs[currentFileIdx]),
                name: receivedFilesMeta[currentFileIdx].name,
              });
              receivedCount++;
              receivedIv = null;
              receivedChunks = [];
              currentFileIdx++;
              if (receivedCount === receivedFilesMeta.length) {
                setStatus('All files received');
                toast.success('All files received successfully!');
                setTransferComplete(true);
                dc.send(JSON.stringify({ type: 'complete' }));
                setTimeout(() => {
                  dc.close();
                  pc.close();
                }, 2000);
              }
            }
          }
        } catch (err) {
          console.error(`[${new Date().toISOString()}] Receiver error:`, err);
          setError('Error receiving files: ' + (err as Error).message);
          toast.error('Error receiving files: ' + (err as Error).message);
        }
      };
      dc.onerror = (error) => {
        let errorMessage = 'Data channel error';
        if (error && typeof error === 'object' && 'message' in error) {
          errorMessage += ': ' + (error as any).message;
        } else if (
          error &&
          typeof error === 'object' &&
          'error' in error &&
          typeof (error as any).error?.message === 'string'
        ) {
          errorMessage += ': ' + (error as any).error.message;
        } else {
          errorMessage += ': ' + String(error);
        }
        setError(errorMessage);
        toast.error(errorMessage);
      };
      dc.onclose = () => {
        console.log(
          `[${new Date().toISOString()}] Receiver DataChannel closed`
        );
        if (receivedCount < receivedFilesMeta.length && !transferComplete) {
          setError('Connection closed before all files were received.');
          toast.error('Connection closed before all files were received.');
        }
      };
    };
  }

  socket.on(
    'signal',
    async ({
      from,
      signal,
      sessionId: incomingSessionId,
    }: {
      from: string;
      signal: any;
      sessionId: string;
    }) => {
      if (!pcRef.current) {
        console.warn(
          `[${new Date().toISOString()}] No peer connection available`
        );
        return;
      }
      console.log(
        `[${new Date().toISOString()}] Received signal from ${from}, type: ${signal.type ?? 'candidate'}`
      );
      try {
        if (signal.sdp) {
          await pcRef.current.setRemoteDescription(
            new RTCSessionDescription(signal)
          );
          console.log(
            `[${new Date().toISOString()}] Set remote description: ${signal.type}`
          );
          if (signal.type === 'offer') {
            const answer = await pcRef.current.createAnswer();
            await pcRef.current.setLocalDescription(answer);
            socketRef.current?.emit('signal', {
              target: from,
              signal: answer,
              sessionId,
            });
            console.log(`[${new Date().toISOString()}] Sent answer to ${from}`);
          }
        } else if (signal.candidate) {
          await pcRef.current.addIceCandidate(new RTCIceCandidate(signal));
          console.log(`[${new Date().toISOString()}] Added ICE candidate`);
        }
      } catch (err) {
        console.error(`[${new Date().toISOString()}] Signaling error:`, err);
        setError('Signaling error: ' + (err as Error).message);
        toast.error('Signaling error: ' + (err as Error).message);
      }
    }
  );
}

async function handleFileReceived(
  fileBlobs: Blob[],
  receivedFilesMeta: FileMeta[],
  receivedCount: number,
  currentFileIdx: number,
  setStatus: (status: string) => void,
  setUploadProgress: (progress: number) => void,
  setReceivedFiles: (files: ReceivedFile[]) => void,
  setFileProgress: React.Dispatch<React.SetStateAction<number[]>>,
  setError: (error: string | null) => void,
  receivedFiles: ReceivedFile[]
) {
  try {
    setStatus(`Received: ${receivedFilesMeta[currentFileIdx]?.name || ''}`);
    setUploadProgress(
      Math.round(((receivedCount + 1) / receivedFilesMeta.length) * 100)
    );
    setFileProgress((prev: number[]) => {
      const copy = [...prev];
      copy[currentFileIdx] = 100;
      return copy;
    });

    const receivedFile: ReceivedFile = {
      url: URL.createObjectURL(fileBlobs[currentFileIdx]),
      name: receivedFilesMeta[currentFileIdx].name,
    };
    setReceivedFiles([...receivedFiles, receivedFile]);

    // Auto-download
    const link = document.createElement('a');
    link.href = receivedFile.url;
    link.download = receivedFile.name;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    if (receivedCount + 1 === receivedFilesMeta.length) {
      if (
        receivedFilesMeta.length > 1 ||
        receivedFilesMeta[0].originalSize > ZIP_SIZE_THRESHOLD
      ) {
        console.log(
          `[${new Date().toISOString()}] Creating ZIP for ${receivedFilesMeta.length} files`
        );
        const zip = new JSZip();
        fileBlobs.forEach((blob, i) => {
          zip.file(receivedFilesMeta[i].name, blob);
        });
        const zipBlob = await zip.generateAsync({ type: 'blob' });
        const zipUrl = URL.createObjectURL(zipBlob);
        const zipLink = document.createElement('a');
        zipLink.href = zipUrl;
        zipLink.download = `received_files_${new Date().toISOString().replace(/[:.]/g, '-')}.zip`;
        document.body.appendChild(zipLink);
        zipLink.click();
        document.body.removeChild(zipLink);
        setReceivedFiles([
          ...receivedFiles.filter((f) => f.name !== receivedFile.name),
          { url: zipUrl, name: zipLink.download },
        ]);
      }
    }
  } catch (err) {
    console.error(
      `[${new Date().toISOString()}] Error processing received file:`,
      err
    );
    setError('Failed to process received file.');
    toast.error('Failed to process received file.');
  }
}

async function sendFileInChunks(
  dc: RTCDataChannel,
  file: File,
  key: CryptoKey,
  idx: number,
  setFileProgress: React.Dispatch<React.SetStateAction<number[]>>,
  setError: (error: string | null) => void
) {
  console.log(
    `[${new Date().toISOString()}] Preparing to send file: ${file.name}, size: ${file.size}`
  );
  if (dc.readyState !== 'open') {
    setError('Data channel not ready. Please try again.');
    toast.error('Data channel not ready. Please try again.');
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
    setFileProgress((prev: number[]) => {
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
      setError('Data channel closed during transfer. Please try again.');
      toast.error('Data channel closed during transfer. Please try again.');
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
    offset += chunk.byteLength;
    setFileProgress((prev: number[]) => {
      const copy = [...prev];
      copy[idx] = Math.min(100, Math.round((offset / total) * 100));
      return copy;
    });
    await new Promise((resolve) => setTimeout(resolve, 50));
  }
  console.log(
    `[${new Date().toISOString()}] Finished sending file ${file.name}`
  );
  setFileProgress((prev: number[]) => {
    const copy = [...prev];
    copy[idx] = 100;
    return copy;
  });
}
