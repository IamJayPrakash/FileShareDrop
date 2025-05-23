const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const cors = require('cors');

const app = express();
const server = http.createServer(app);
const allowedOrigin = process.env.ORIGIN || 'http://localhost:3000';
const io = socketIo(server, {
  path: '/api/signaling',
  cors: {
    origin: allowedOrigin,
    methods: ['GET', 'POST'],
  },
});

app.use(cors());

const rooms = new Map();

io.on('connection', (socket) => {
  console.log(`[${new Date().toISOString()}] New connection: ${socket.id}`);

  socket.on('join', (room) => {
    socket.join(room);
    if (!rooms.has(room)) {
      rooms.set(room, new Set());
    }
    rooms.get(room).add(socket.id);
    console.log(
      `[${new Date().toISOString()}] ${socket.id} joined room: ${room}`
    );
    console.log(
      `[${new Date().toISOString()}] Room ${room} clients:`,
      Array.from(rooms.get(room))
    );
    socket.emit('joined', { id: socket.id });
    socket.to(room).emit('peer-online');
  });

  socket.on('signal', ({ target, signal }) => {
    console.log(
      `[${new Date().toISOString()}] Signal from ${socket.id} to ${target}`
    );
    if (target === socket.id) {
      console.warn(
        `[${new Date().toISOString()}] Ignoring self-signal from ${socket.id}`
      );
      return;
    }
    io.to(target).emit('signal', { from: socket.id, signal });
  });

  socket.on('disconnect', () => {
    console.log(`[${new Date().toISOString()}] ${socket.id} disconnected`);
    for (const [room, clients] of rooms.entries()) {
      if (clients.has(socket.id)) {
        clients.delete(socket.id);
        socket.to(room).emit('peer-offline');
        if (clients.size === 0) {
          rooms.delete(room);
        }
        console.log(
          `[${new Date().toISOString()}] Room ${room} clients:`,
          Array.from(clients)
        );
      }
    }
  });
});

const PORT = process.env.PORT || 3001;
server.listen(PORT, () => {
  console.log(`Signaling server listening on port ${PORT}`);
});
