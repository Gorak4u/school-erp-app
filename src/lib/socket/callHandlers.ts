import { Server as SocketIOServer, Socket } from 'socket.io';

interface CallSignal {
  type: 'call-offer' | 'call-answer' | 'call-ice-candidate' | 'call-hangup' | 'call-screen-share';
  from: string;
  to: string;
  conversationId: string;
  callType: 'voice' | 'video' | 'screen';
  payload?: any;
}

interface CallInitiated {
  from: string;
  to: string;
  conversationId: string;
  callType: 'voice' | 'video';
}

export function registerCallHandlers(io: SocketIOServer, socket: Socket) {
  // Handle call signaling
  socket.on('call-signal', (signal: CallSignal) => {
    console.log('Call signal:', signal);
    
    // Forward the signal to the target user
    io.to(`user:${signal.to}`).emit('call-signal', signal);
  });

  // Handle call initiation
  socket.on('call-initiated', (data: CallInitiated) => {
    console.log('Call initiated:', data);
    
    // Notify the target user about the incoming call
    io.to(`user:${data.to}`).emit('call-incoming', {
      from: data.from,
      conversationId: data.conversationId,
      callType: data.callType,
      callerName: (data as any).callerName || 'Unknown User',
    });
  });

  // Handle joining a call room
  socket.on('join-call', (data: { conversationId: string }) => {
    socket.join(`call:${data.conversationId}`);
    console.log(`User ${socket.data?.userId} joined call room: ${data.conversationId}`);
    
    // Notify others in the call
    socket.to(`call:${data.conversationId}`).emit('call-participant-joined', {
      userId: socket.data?.userId,
      conversationId: data.conversationId,
    });
  });

  // Handle leaving a call room
  socket.on('leave-call', (data: { conversationId: string }) => {
    socket.leave(`call:${data.conversationId}`);
    console.log(`User ${socket.data?.userId} left call room: ${data.conversationId}`);
    
    // Notify others in the call
    socket.to(`call:${data.conversationId}`).emit('call-participant-left', {
      userId: socket.data?.userId,
      conversationId: data.conversationId,
    });
  });

  // Handle call state updates (mute, camera, screen share)
  socket.on('call-state-update', (data: {
    conversationId: string;
    state: {
      isMuted?: boolean;
      isCameraOff?: boolean;
      isScreenSharing?: boolean;
    };
  }) => {
    // Broadcast state update to other participants
    socket.to(`call:${data.conversationId}`).emit('call-state-updated', {
      userId: socket.data?.userId,
      conversationId: data.conversationId,
      state: data.state,
    });
  });

  // Handle call quality feedback
  socket.on('call-quality-feedback', (data: {
    conversationId: string;
    quality: {
      videoQuality: number;
      audioQuality: number;
      connectionStability: number;
    };
  }) => {
    console.log('Call quality feedback:', data);
    // You could store this for analytics or troubleshooting
  });

  // Handle call recording requests (if implemented)
  socket.on('call-recording-request', (data: {
    conversationId: string;
    action: 'start' | 'stop';
  }) => {
    // Broadcast recording status to participants
    io.to(`call:${data.conversationId}`).emit('call-recording-status', {
      action: data.action,
      initiatedBy: socket.data?.userId,
      timestamp: new Date().toISOString(),
    });
  });

  // Handle call errors
  socket.on('call-error', (data: {
    conversationId: string;
    error: string;
    details?: any;
  }) => {
    console.error('Call error:', data);
    
    // Notify other participants about the error
    socket.to(`call:${data.conversationId}`).emit('call-error-occurred', {
      userId: socket.data?.userId,
      conversationId: data.conversationId,
      error: data.error,
      details: data.details,
    });
  });

  // Clean up when user disconnects
  socket.on('disconnect', () => {
    console.log(`User ${socket.data?.userId} disconnected during call`);
    
    // Notify all active calls that this user was in
    // This would require tracking active calls per user
    // For now, we'll emit a general disconnect event
    socket.broadcast.emit('call-user-disconnected', {
      userId: socket.data?.userId,
      timestamp: new Date().toISOString(),
    });
  });
}
