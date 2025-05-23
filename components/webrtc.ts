import io from 'socket.io-client';
import { toast } from 'sonner';
import JSZip from 'jszip';
import { encryptFile, decryptFile, importKey } from './crypto';
import { FileMeta, ReceivedFile } from './types';

const CHUNK_SIZE = 256 * 1024; // 256KB per chunk
const ZIP_SIZE_THRESHOLD = 10 * 1024 * 1024; // 10MB

// Utility function for debouncing
function debounce<T extends (...args: any[]) => void>(func: T, wait: number) {
  let timeout: NodeJS.Timeout | null = null;
  return (...args: Parameters<T>) => {
    if (timeout) clearTimeout(timeout);
    timeout = setTimeout(() => func(...args), wait);
  };
}

export async function connectSocket(
  room: string,
  setStatus: (status: string) => void,
  setPeerOnline: (online: boolean) => void,
  setPeerId: (id: string | null) => void,
  setJoined: (joined: boolean) => void,
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
  socket.on('disconnect', () => {
    console.log(`[${new Date().toISOString()}] Socket disconnected`);
    setPeerOnline(false);
    setError('Connection lost. Please refresh and try again.');
    toast.error('Connection lost. Please refresh and try again.');
    console.error(`[${new Date().toISOString()}] Set error: Connection lost`);
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
  setFileProgress: (progress: number[]) => void,
  setReceivedFiles: (files: ReceivedFile[]) => void,
  setUploadProgress: (progress: number) => void,
  socketRef: React.MutableRefObject<ReturnType<typeof io> | null>,
  pcRef: React.MutableRefObject<RTCPeerConnection | null>,
  dcRef: React.MutableRefObject<RTCDataChannel | null>,
  setPeerOnline: (online: boolean) => void,
  setPeerId: (id: string | null) => void,
  setJoined: (joined: boolean) => void,
  setOfferStarted: (started: boolean) => void,
  setReceiverReady: (ready: boolean) => void,
  setTransferComplete: (complete: boolean) => void,
  peerId: string | null // Added peerId parameter
) {
  console.log(
    `[${new Date().toISOString()}] Setting up WebRTC connection, isSender: ${isSender}, room: ${room}, files: ${files?.length || 0}, key: ${!!key}`
  );
  setStatus('Setting up connection...');
  const socket = await connectSocket(
    room,
    setStatus,
    setPeerOnline,
    setPeerId,
    setJoined,
    setError,
    socketRef
  );
  setIsWaiting(!isSender);
  console.log(`[${new Date().toISOString()}] Creating RTCPeerConnection`);
  const pc = new RTCPeerConnection({
    iceServers: [{ urls: 'stun:stun.l.google.com:19302' }],
  });
  pcRef.current = pc;
  let offerStarted = false; // Local variable to track offer state
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
      toast.error('WebRTC connection failed. Please refresh and try again.');
      console.error(
        `[${new Date().toISOString()}] Set error: WebRTC connection failed`
      );
      offerStarted = false; // Reset offerStarted on failure
      setOfferStarted(false);
    } else if (pc.connectionState === 'connected') {
      setStatus('Connection established');
      console.log(
        `[${new Date().toISOString()}] Set status: Connection established`
      );
    }
  };
  if (isSender) {
    const startSenderOffer = async () => {
      if (pc.signalingState !== 'stable' || offerStarted) {
        console.log(
          `[${new Date().toISOString()}] Offer not started: signalingState=${pc.signalingState}, offerStarted=${offerStarted}`
        );
        return;
      }
      console.log(`[${new Date().toISOString()}] Starting sender offer`);
      offerStarted = true;
      setOfferStarted(true);
      console.log(`[${new Date().toISOString()}] Creating data channel 'file'`);
      const dc = pc.createDataChannel('file', {
        ordered: true,
        maxRetransmits: 5,
      });
      dcRef.current = dc;
      let retryInterval: NodeJS.Timeout | null = null;
      dc.onopen = async () => {
        console.log(
          `[${new Date().toISOString()}] DataChannel opened, state: ${dc.readyState}, label: ${dc.label}`
        );
        setStatus('DataChannel open, waiting for receiver acknowledgment...');
        if (dc.readyState !== 'open') {
          setError('Data channel not ready. Please try again.');
          toast.error('Data channel not ready. Please try again.');
          console.error(
            `[${new Date().toISOString()}] DataChannel not open, state: ${dc.readyState}`
          );
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
        retryInterval = setInterval(() => {
          if (dc.readyState !== 'open') {
            console.log(
              `[${new Date().toISOString()}] Stopping handshake retry: dc.readyState=${dc.readyState}`
            );
            if (retryInterval) clearInterval(retryInterval);
            return;
          }
          console.log(`[${new Date().toISOString()}] Retrying handshake...`);
          sendHandshake();
        }, 2000);
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
          if (message.type === 'ack' && message.message === 'receiver-ready') {
            console.log(
              `[${new Date().toISOString()}] Receiver acknowledged, starting file transfer, files: ${files?.length || 0}, key: ${!!key}`
            );
            setReceiverReady(true);
            if (retryInterval) {
              console.log(
                `[${new Date().toISOString()}] Clearing handshake retry interval`
              );
              clearInterval(retryInterval);
            }
            setStatus('DataChannel open, sending files...');
            if (!files || files.length === 0 || !key) {
              setError(
                'Failed to start file transfer: missing files or encryption key.'
              );
              toast.error(
                'Failed to start file transfer: missing files or encryption key.'
              );
              console.error(
                `[${new Date().toISOString()}] Missing files or key for file transfer, files: ${files?.length || 0}, key: ${!!key}`
              );
              return;
            }
            try {
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
              console.log(
                `[${new Date().toISOString()}] Sending metadata:`,
                meta
              );
              if (dc.readyState !== 'open') {
                setError('Data channel not ready. Please try again.');
                toast.error('Data channel not ready. Please try again.');
                console.error(
                  `[${new Date().toISOString()}] DataChannel not open for metadata, state: ${dc.readyState}`
                );
                return;
              }
              dc.send(JSON.stringify({ type: 'meta', files: meta }));
              console.log(`[${new Date().toISOString()}] Metadata sent:`, {
                type: 'meta',
                files: meta,
              });
              setFileProgress(new Array(files.length).fill(0));
              console.log(
                `[${new Date().toISOString()}] Initialized file progress:`,
                new Array(files.length).fill(0)
              );
              for (let i = 0; i < files.length; i++) {
                console.log(
                  `[${new Date().toISOString()}] Starting transfer for file ${i}: ${files[i].name}`
                );
                setStatus(`Encrypting and sending: ${files[i].name}`);
                await sendFileInChunks(
                  dc,
                  files[i],
                  key,
                  i,
                  setFileProgress,
                  setError
                );
              }
              setStatus('All files sent!');
              toast.success('All files sent successfully!');
              setTransferComplete(true);
              console.log(`[${new Date().toISOString()}] All files sent`);
              if (dc.readyState === 'open') {
                console.log(
                  `[${new Date().toISOString()}] Closing data channel`
                );
                dc.close();
              }
              if (pc.connectionState === 'connected') {
                console.log(
                  `[${new Date().toISOString()}] Closing peer connection`
                );
                pc.close();
              }
            } catch (err) {
              console.error(
                `[${new Date().toISOString()}] Error sending files:`,
                err
              );
              setError('Failed to send files. Please try again.');
              toast.error('Failed to send files. Please try again.');
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
          toast.error(
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
        toast.error('Data channel error. Please try again.');
        console.error(
          `[${new Date().toISOString()}] Set error: Data channel error`
        );
      };
      dc.onclose = () => {
        console.log(`[${new Date().toISOString()}] DataChannel closed`);
        // Cannot use fileProgress here as it's not defined
        setError('Data channel closed before all files were sent.');
        toast.error('Data channel closed before all files were sent.');
        console.error(
          `[${new Date().toISOString()}] Set error: Data channel closed before all files sent`
        );
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
        toast.error(
          'Failed to initiate connection. Please refresh and try again.'
        );
        console.error(
          `[${new Date().toISOString()}] Set error: Failed to initiate connection`
        );
      }
    };
    const debouncedStartSenderOffer = debounce(startSenderOffer, 500);
    socket.off('peer-online');
    socket.on('peer-online', () => {
      console.log(
        `[${new Date().toISOString()}] Peer-online event received, attempting to start offer`
      );
      debouncedStartSenderOffer();
    });
    // Removed peerOnline check as it's not defined
    console.log(
      `[${new Date().toISOString()}] Sender ready, waiting for peer-online event`
    );
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
      dc.onopen = () => {
        console.log(
          `[${new Date().toISOString()}] Receiver DataChannel opened, state: ${dc.readyState}, label: ${dc.label}, bufferedAmount: ${dc.bufferedAmount}`
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
          typeof ev.data,
          'size:',
          typeof ev.data === 'string' ? ev.data.length : ev.data.byteLength
        );
        try {
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
                setError('Data channel not ready. Please try again.');
                toast.error('Data channel not ready. Please try again.');
                console.error(
                  `[${new Date().toISOString()}] DataChannel not open for ack, state: ${dc.readyState}`
                );
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
                console.error(
                  `[${new Date().toISOString()}] Invalid metadata:`,
                  parsed
                );
                return;
              }
              meta = parsed;
              receivedFilesMeta = meta?.files;
              receivedCount = 0;
              currentFileIdx = 0;
              receivedChunks = [];
              receivedIv = null;
              fileBlobs = [];
              fileTotal = 0;
              fileReceived = 0;
              setStatus('Waiting for file data...');
              console.log(
                `[${new Date().toISOString()}] Importing key for decryption`
              );
              key = await importKey(keyB64);
              setUploadProgress(0);
              setReceivedFiles([]);
              setFileProgress(new Array(receivedFilesMeta.length).fill(0));
              console.log(
                `[${new Date().toISOString()}] Initialized file progress:`,
                new Array(receivedFilesMeta.length).fill(0)
              );
              return;
            }
            console.warn(
              `[${new Date().toISOString()}] Unexpected string message:`,
              parsed
            );
            return;
          }
          if (!meta || !meta.files) {
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
            fileTotal = receivedFilesMeta[currentFileIdx]?.size || 0;
            fileReceived = 0;
            receivedChunks = [];
            console.log(
              `[${new Date().toISOString()}] File ${currentFileIdx} total size: ${fileTotal}`
            );
            if (fileTotal === 0) {
              console.log(
                `[${new Date().toISOString()}] Processing empty file: ${receivedFilesMeta[currentFileIdx]?.name}`
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
                setError
              );
              receivedCount++;
              receivedIv = null;
              receivedChunks = [];
              currentFileIdx++;
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
                `[${new Date().toISOString()}] Assembling file: ${receivedFilesMeta[currentFileIdx]?.name}`
              );
              const encryptedData = new Uint8Array(fileTotal);
              let offset = 0;
              for (const c of receivedChunks) {
                if (offset + c.length > fileTotal) {
                  setError('Received data exceeds expected file size.');
                  toast.error('Received data exceeds expected file size.');
                  console.error(
                    `[${new Date().toISOString()}] Chunk size exceeds expected total: offset=${offset}, chunk.length=${c.length}, fileTotal=${fileTotal}`
                  );
                  return;
                }
                encryptedData.set(c, offset);
                offset += c.length;
              }
              if (offset !== fileTotal) {
                setError('Incomplete file data received.');
                toast.error('Incomplete file data received.');
                console.error(
                  `[${new Date().toISOString()}] Assembled data size mismatch: offset=${offset}, fileTotal=${fileTotal}`
                );
                return;
              }
              console.log(
                `[${new Date().toISOString()}] Decrypting file, size: ${encryptedData.length}`
              );
              if (!key) {
                setError('Decryption key not available.');
                toast.error('Decryption key not available.');
                console.error(
                  `[${new Date().toISOString()}] Decryption key not available`
                );
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
                setError
              );
              receivedCount++;
              receivedIv = null;
              receivedChunks = [];
              currentFileIdx++;
              if (receivedCount === receivedFilesMeta.length) {
                setStatus('All files received!');
                toast.success('All files received successfully!');
                console.log(`[${new Date().toISOString()}] All files received`);
                if (dc.readyState === 'open') {
                  console.log(
                    `[${new Date().toISOString()}] Closing data channel`
                  );
                  dc.close();
                }
                if (pc.connectionState === 'connected') {
                  console.log(
                    `[${new Date().toISOString()}] Closing peer connection`
                  );
                  pc.close();
                }
              }
            }
          }
        } catch (err) {
          console.error(
            `[${new Date().toISOString()}] Receiver error processing data channel message:`,
            err
          );
          setError(
            'Failed to process received data: ' + (err as Error).message
          );
          toast.error(
            'Failed to process received data: ' + (err as Error).message
          );
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
        toast.error('Data channel error. Please try again.');
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
          toast.error('Data channel closed before all files were received.');
          console.error(
            `[${new Date().toISOString()}] Set error: Data channel closed before all files received`
          );
        }
      };
    };
  }
  socket.on(
    'signal',
    async ({ from, signal }: { from: string; signal: any }) => {
      if (!pcRef.current || from === peerId) {
        console.warn(
          `[${new Date().toISOString()}] Ignoring signal: no peer connection or from self, from: ${from}, peerId: ${peerId || 'null'}`
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
            console.log(
              `[${new Date().toISOString()}] Ignoring offer in non-stable state: ${signalingState}`
            );
            return;
          }
          if (
            signal.type === 'answer' &&
            signalingState !== 'have-local-offer'
          ) {
            console.log(
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
            socketRef.current?.emit('signal', { target: from, signal: answer });
            console.log(`[${new Date().toISOString()}] Sent answer to ${from}`);
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
          toast.error(
            'Failed to establish connection. Please refresh and try again.'
          );
          console.error(
            `[${new Date().toISOString()}] Set error: Failed to establish connection`
          );
        }
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
  setFileProgress: (progress: number[]) => void,
  setError: (error: string | null) => void
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
    if (
      receivedFilesMeta.length === 1 &&
      receivedFilesMeta[0].originalSize <= ZIP_SIZE_THRESHOLD
    ) {
      console.log(
        `[${new Date().toISOString()}] Single file <= ${ZIP_SIZE_THRESHOLD} bytes, providing direct download`
      );
      setReceivedFiles([
        {
          url: URL.createObjectURL(fileBlobs[0]),
          name: receivedFilesMeta[0].name,
        },
      ]);
    } else {
      console.log(
        `[${new Date().toISOString()}] Creating ZIP for ${receivedFilesMeta.length} files or large file`
      );
      const zip = new JSZip();
      fileBlobs.forEach((blob, i) => {
        zip.file(receivedFilesMeta[i].name, blob);
      });
      const zipBlob = await zip.generateAsync({ type: 'blob' });
      setReceivedFiles([
        {
          url: URL.createObjectURL(zipBlob),
          name: `received_files_${new Date().toISOString().replace(/[:.]/g, '-')}.zip`,
        },
      ]);
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
  setFileProgress: (progress: number[]) => void,
  setError: (error: string | null) => void
) {
  console.log(
    `[${new Date().toISOString()}] Preparing to send file: ${file.name}, size: ${file.size}`
  );
  if (dc.readyState !== 'open') {
    setError('Data channel not ready. Please try again.');
    toast.error('Data channel not ready. Please try again.');
    console.error(
      `[${new Date().toISOString()}] DataChannel not open, state: ${dc.readyState}`
    );
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
      console.error(
        `[${new Date().toISOString()}] DataChannel closed during chunk send, state: ${dc.readyState}`
      );
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
    console.log(
      `[${new Date().toISOString()}] Updated progress for file ${idx}: ${Math.min(100, Math.round((offset / total) * 100))}%`
    );
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
