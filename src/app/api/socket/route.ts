import { NextRequest } from 'next/server';
import { Server as SocketIOServer } from 'socket.io';
import { Server as HTTPServer } from 'http';

let io: SocketIOServer | null = null;

export async function GET(req: NextRequest) {
  if (!io) {
    // @ts-ignore - Next.js internal server access
    const httpServer: HTTPServer = (req as any).socket?.server;
    
    if (!httpServer) {
      return new Response('HTTP Server not available', { status: 500 });
    }

    io = new SocketIOServer(httpServer, {
      path: '/api/socket',
      addTrailingSlash: false,
      cors: {
        origin: '*',
        methods: ['GET', 'POST'],
      },
    });

    io.on('connection', (socket) => {
      console.log('✅ Client connected:', socket.id);

      socket.on('join', (userId: string) => {
        socket.join(`user:${userId}`);
        socket.data = { ...socket.data, userId };
        console.log(`👤 User ${userId} joined their room`);
        
        // Register messenger handlers
        const { registerMessengerHandlers } = require('@/lib/socket/messengerHandlers');
        registerMessengerHandlers(io!, socket);
      });

      socket.on('joinSchool', (schoolId: string) => {
        socket.join(`school:${schoolId}`);
        socket.data = { ...socket.data, schoolId };
        console.log(`🏫 School ${schoolId} joined`);
      });

      socket.on('disconnect', () => {
        console.log('❌ Client disconnected:', socket.id);
      });
    });

    console.log('🚀 Socket.IO server initialized');
  }

  return new Response('Socket.IO server running', { status: 200 });
}

export function getIO(): SocketIOServer {
  if (!io) {
    throw new Error('Socket.IO not initialized');
  }
  return io;
}
