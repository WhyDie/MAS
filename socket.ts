import { Server as HttpServer } from 'http';
import { Server, Socket } from 'socket.io';

let io: Server;

export const initializeSockets = (server: HttpServer) => {
  io = new Server(server, {
    cors: {
      origin: process.env.FRONTEND_URL || 'http://localhost:5173',
      methods: ['GET', 'POST'],
      credentials: true
    }
  });

  io.on('connection', (socket: Socket) => {
    console.log(`[Socket] Новий боєць підключився: ${socket.id}`);

    socket.on('join_unit', (unitId: string) => {
      socket.join(`unit_${unitId}`);
      console.log(`[Socket] ${socket.id} приєднався до каналу підрозділу unit_${unitId}`);
    });

    socket.on('disconnect', () => {
      console.log(`[Socket] Боєць відключився: ${socket.id}`);
    });
  });

  return io;
};

export const getIO = () => {
  if (!io) {
    throw new Error('Socket.io не ініціалізовано!');
  }
  return io;
};

// Використання:
// import { getIO } from './infrastructure/socket';
// getIO().to(`unit_123`).emit('alert', { message: 'ТРИВОГА! Шикування через 5 хвилин!' });