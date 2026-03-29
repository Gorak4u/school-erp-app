import { Server as SocketIOServer } from 'socket.io';
import { Server as HTTPServer } from 'http';

let io: SocketIOServer | null = null;

export function initSocketServer(server: HTTPServer): SocketIOServer {
  io = new SocketIOServer(server, {
    path: '/api/socket',
    cors: {
      origin: '*',
      methods: ['GET', 'POST'],
    },
  });

  io.on('connection', (socket) => {
    console.log('Client connected:', socket.id);

    // Join user-specific room
    socket.on('join', (userId: string) => {
      socket.join(`user:${userId}`);
      socket.data = { ...socket.data, userId };
      console.log(`User ${userId} joined their room`);
    });

    // Join school-specific room
    socket.on('joinSchool', (schoolId: string) => {
      socket.join(`school:${schoolId}`);
      socket.data = { ...socket.data, schoolId };
      console.log(`School ${schoolId} joined`);
    });

    // Register messenger handlers
    if (socket.data?.userId && socket.data?.schoolId) {
      const { registerMessengerHandlers } = require('./socket/messengerHandlers');
      registerMessengerHandlers(io, socket);
    }

    socket.on('disconnect', () => {
      console.log('Client disconnected:', socket.id);
    });
  });

  return io;
}

export function getIO(): SocketIOServer {
  if (!io) {
    throw new Error('Socket.IO not initialized');
  }
  return io;
}

export function emitToUser(userId: string, event: string, data: any) {
  if (io) {
    io.to(`user:${userId}`).emit(event, data);
  }
}

export function emitToSchool(schoolId: string, event: string, data: any) {
  if (io) {
    io.to(`school:${schoolId}`).emit(event, data);
  }
}
