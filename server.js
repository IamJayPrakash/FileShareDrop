const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const cors = require('cors');
const winston = require('winston');
require('dotenv').config();

const app = express();
const server = http.createServer(app);

const logger = winston.createLogger({
  level: 'info',
  format: winston.format.combine(
    winston.format.timestamp({ format: 'YYYY-MM-DDTHH:mm:ss.SSSZ' }),
    winston.format.json()
  ),
  transports: [
    new winston.transports.Console(),
    new winston.transports.File({ filename: 'server.log' }),
  ],
});

const allowedOrigins = [
  '*',
  'https://file-share-drop.vercel.app',
  'http://localhost:3000',
];
app.use(
  cors({
    origin: (origin, callback) => {
      if (!origin || allowedOrigins.includes(origin)) {
        callback(null, true);
      } else {
        logger.warn(`Blocked CORS request from origin: ${origin}`);
        callback(new Error('Not allowed by CORS'));
      }
    },
    methods: ['GET', 'POST'],
  })
);

app.get('/health', (req, res) => {
  logger.info('Health check requested');
  res.status(200).json({ status: 'OK', uptime: process.uptime() });
});

const io = socketIo(server, {
  path: '/api/signaling',
  cors: {
    origin: allowedOrigins,
    methods: ['GET', 'POST'],
  },
});

const rooms = new Map();

io.on('connection', (socket) => {
  logger.info(`New connection: ${socket.id}`);

  socket.on('join', ({ room, sessionId }) => {
    if (
      !room ||
      !sessionId ||
      typeof room !== 'string' ||
      typeof sessionId !== 'string' ||
      room.length > 50 ||
      sessionId.length > 50
    ) {
      logger.warn(
        `Invalid join request from ${socket.id}: room=${room}, sessionId=${sessionId}`
      );
      socket.emit('error', 'Invalid room or session ID');
      return;
    }
    socket.join(`room-${room}`);
    if (!rooms.has(room)) {
      rooms.set(room, new Map());
    }
    rooms.get(room).set(socket.id, { sessionId });
    logger.info(`${socket.id} joined room: ${room}, sessionId: ${sessionId}`);
    logger.info(`Room ${room} clients:`, Array.from(rooms.get(room).keys()));
    socket.emit('joined', socket.id);
    socket.to(`room-${room}`).emit('peer-online');
    logger.info(`Emitted peer-online to room-${room}`);
  });

  socket.on('signal', ({ target, signal, sessionId }) => {
    if (!target || !signal || !sessionId) {
      logger.warn(
        `Invalid signal from ${socket.id}: target=${target}, sessionId=${sessionId}`
      );
      return;
    }
    logger.info(
      `Signal from ${socket.id} to ${target}, type: ${signal.type || 'candidate'}, sessionId: ${sessionId}`
    );
    if (target.startsWith('room-')) {
      socket.to(target).emit('signal', { from: socket.id, signal, sessionId });
    } else {
      io.to(target).emit('signal', { from: socket.id, signal, sessionId });
    }
  });

  socket.on('transfer-complete', ({ room }) => {
    logger.info(`Transfer complete in room: ${room}`);
    socket.to(`room-${room}`).emit('transfer-complete');
    rooms.delete(room);
    socket.leave(`room-${room}`);
  });

  socket.on('disconnect', () => {
    logger.info(`${socket.id} disconnected`);
    for (const [room, clients] of rooms.entries()) {
      if (clients.has(socket.id)) {
        clients.delete(socket.id);
        socket.to(`room-${room}`).emit('peer-offline');
        if (clients.size === 0) {
          rooms.delete(room);
          logger.info(`Deleted empty room: ${room}`);
        }
        logger.info(`Room ${room} clients:`, Array.from(clients.keys()));
      }
    }
  });
});

setInterval(
  () => {
    for (const [room, clients] of rooms.entries()) {
      if (clients.size === 0) {
        rooms.delete(room);
        logger.info(`Cleaned up orphaned room: ${room}`);
      }
    }
  },
  60 * 60 * 1000
);

const PORT = process.env.PORT || 3001;
server.listen(PORT, () => {
  logger.info(`Signaling server listening on port ${PORT}`);
});

process.on('uncaughtException', (err) => {
  logger.error('Uncaught Exception:', err);
  process.exit(1);
});

process.on('unhandledRejection', (reason, promise) => {
  logger.error('Unhandled Rejection at:', promise, 'reason:', reason);
});
