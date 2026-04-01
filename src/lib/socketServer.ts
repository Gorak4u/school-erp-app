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
    // Simple ping/pong for connection testing
    socket.on('ping', (data: any, callback?: Function) => {
      if (callback && typeof callback === 'function') {
        callback({ pong: true, timestamp: Date.now(), socketId: socket.id, received: data });
      }
    });

    // Join user-specific room
    socket.on('join', (userId: string, callback?: Function) => {
      socket.join(`user:${userId}`);
      socket.data = { ...socket.data, userId };
      
      // Send acknowledgment if callback provided
      if (callback && typeof callback === 'function') {
        callback({ joined: true, room: `user:${userId}`, socketId: socket.id });
      }
      
      // Register messenger handlers immediately after user joins
      try {
        const { registerMessengerHandlers } = require('./socket/messengerHandlers');
        registerMessengerHandlers(io, socket);
      } catch (error) {
        console.error('Error registering messenger handlers:', error);
      }
      
      // Register call handlers for voice/video calling
      try {
        const { registerCallHandlers } = require('./socket/callHandlers');
        registerCallHandlers(io, socket);
      } catch (error) {
        console.error('Error registering call handlers:', error);
      }
    });

    // Join school-specific room
    socket.on('joinSchool', (schoolId: string) => {
      socket.join(`school:${schoolId}`);
      socket.data = { ...socket.data, schoolId };
    });

    socket.on('disconnect', () => {
      // Client disconnected
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
