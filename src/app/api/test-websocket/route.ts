import { NextRequest, NextResponse } from 'next/server';
import { Server as SocketIOServer } from 'socket.io';

export async function POST(request: NextRequest) {
  try {
    const { userId, message } = await request.json();
    
    // Get the io instance from global
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const io = (global as any).io as SocketIOServer | undefined;
    
    if (!io) {
      return NextResponse.json({ error: 'WebSocket server not running' }, { status: 500 });
    }

    // Send a test notification to the user
    const testNotification = {
      id: Date.now().toString(),
      type: 'general',
      title: '🧪 WebSocket Test',
      message: message || 'WebSocket connection is working!',
      isRead: false,
      createdAt: new Date().toISOString(),
      metadata: {
        module: 'test',
        timestamp: Date.now()
      }
    };

    // Emit to user's room
    io.to(`user:${userId}`).emit('notification', testNotification);
    
    console.log('🧪 Test notification sent to user:', userId);
    
    return NextResponse.json({ 
      success: true, 
      message: 'Test notification sent',
      notification: testNotification 
    });
  } catch (error) {
    console.error('❌ WebSocket test error:', error);
    return NextResponse.json({ error: 'Failed to send test notification' }, { status: 500 });
  }
}
