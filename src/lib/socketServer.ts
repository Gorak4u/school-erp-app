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
      console.log('👤 User joining room:', userId, 'Socket:', socket.id);
      console.log('🏠 Available rooms before join:', Array.from(socket.rooms));
      socket.join(`user:${userId}`);
      socket.data = { ...socket.data, userId };
      console.log(`✅ User ${userId} joined their room: user:${userId}`);
      console.log('🏠 Socket rooms after join:', Array.from(socket.rooms));
      
      // Register messenger handlers immediately after user joins
      const { registerMessengerHandlers } = require('./socket/messengerHandlers');
      registerMessengerHandlers(io, socket);
      
      // Register call handlers for voice/video calling
      const { registerCallHandlers } = require('./socket/callHandlers');
      registerCallHandlers(io, socket);
      
      console.log('🔧 All handlers registered for user:', userId);
    });

    // Join school-specific room
    socket.on('joinSchool', (schoolId: string) => {
      socket.join(`school:${schoolId}`);
      socket.data = { ...socket.data, schoolId };
      console.log(`School ${schoolId} joined`);
    });

    socket.on('disconnect', () => {
      console.log('Client disconnected:', socket.id);
    });
  });

  return io;
}

export function getIO(): SocketIOServer {
  // Try to get io from global (custom server) or local instance
  const globalIo = (global as any).io;
  if (globalIo) {
    return globalIo;
  }
  if (!io) {
    throw new Error('Socket.IO not initialized');
  }
  return io;
}

export function emitToUser(userId: string, event: string, data: any) {
  try {
    const ioInstance = getIO();
    ioInstance.to(`user:${userId}`).emit(event, data);
  } catch (error) {
    console.warn('Socket.IO not available for emitToUser:', error);
  }
}

export function emitToSchool(schoolId: string, event: string, data: any) {
  try {
    const ioInstance = getIO();
    ioInstance.to(`school:${schoolId}`).emit(event, data);
  } catch (error) {
    console.warn('Socket.IO not available for emitToSchool:', error);
  }
}
