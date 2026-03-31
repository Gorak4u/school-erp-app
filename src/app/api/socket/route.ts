import { NextRequest } from 'next/server';
import { Server as SocketIOServer } from 'socket.io';

// Get the global io instance from server.js
export function GET(req: NextRequest) {
  try {
    // @ts-ignore - Access global io instance from server.js
    const io = global.io as SocketIOServer;
    
    if (!io) {
      return new Response('Socket.IO server not initialized', { status: 500 });
    }

    return new Response('Socket.IO server running', { status: 200 });
  } catch (error) {
    console.error('Socket.IO API route error:', error);
    return new Response('Socket.IO server error', { status: 500 });
  }
}

export function getIO(): SocketIOServer {
  // @ts-ignore - Access global io instance from server.js
  const io = global.io as SocketIOServer;
  if (!io) {
    throw new Error('Socket.IO not initialized');
  }
  return io;
}
