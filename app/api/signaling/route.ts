import type { NextApiRequest, NextApiResponse } from 'next';
import type { Server as HTTPServer } from 'http';
import type { Socket as NetSocket } from 'net';
import type { Server as IOServer, Socket as IOSocket } from 'socket.io';

interface SocketServer extends HTTPServer {
  io?: IOServer;
}

interface SocketWithServer extends NetSocket {
  server: SocketServer;
}

let io: IOServer | undefined;

interface SignalEventData {
  target: string;
  signal: any;
}

interface JoinedEventData {
  id: string;
}

interface JoinRoomData {
  room: string;
}

// DEPRECATED: This API route is not used. Please use the standalone server.js for signaling.
// The signaling server now runs on http://localhost:3001 (or your configured port) via server.js

// Remove the default export and use a named GET export for Next.js app router
export async function GET(req: Request) {
  // @ts-ignore
  if (!(global as any).io) {
    // @ts-ignore
    const { Server } = await import('socket.io');
    // @ts-ignore
    const io = new Server(globalThis.__server__, {
      path: '/api/signaling',
      addTrailingSlash: false,
      cors: {
        origin: '*',
        methods: ['GET', 'POST'],
      },
    });
    io.on('connection', (socket: any) => {
      socket.on('signal', (data: any) => {
        io.to(data.target).emit('signal', {
          from: socket.id,
          signal: data.signal,
        });
      });
      socket.on('join', (room: string) => {
        socket.join(room);
        socket.emit('joined', { id: socket.id });
        socket.to(room).emit('peer-online');
        const clients = io.sockets.adapter.rooms.get(room);
        if (clients && clients.size > 1) {
          socket.emit('peer-online');
        }
      });
      socket.on('disconnecting', () => {
        for (const room of socket.rooms) {
          if (room !== socket.id) {
            socket.to(room).emit('peer-offline');
          }
        }
      });
    });
    // @ts-ignore
    (global as any).io = io;
  }
  return new Response(undefined, { status: 200 });
}
