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

// Deduplication: Track recent call-initiated events to prevent duplicates
// Use global to persist across module reloads in dev mode
const globalAny = global as any;
if (!globalAny.__recentCalls) {
  globalAny.__recentCalls = new Map<string, number>();
}
const recentCalls: Map<string, number> = globalAny.__recentCalls;
const CALL_DEDUP_WINDOW_MS = 5000; // 5 seconds

function getCallKey(from: string, to: string, conversationId: string): string {
  return `${from}:${to}:${conversationId}`;
}

function isDuplicateCall(from: string, to: string, conversationId: string): boolean {
  const key = getCallKey(from, to, conversationId);
  const now = Date.now();
  const lastCall = recentCalls.get(key);
  
  console.log('🔍 Deduplication check:', { key, lastCall, now, diff: lastCall ? now - lastCall : 'N/A', mapSize: recentCalls.size });
  
  // Clean up old entries
  for (const [k, timestamp] of recentCalls.entries()) {
    if (now - timestamp > CALL_DEDUP_WINDOW_MS) {
      console.log('🧹 Cleaning old entry:', k);
      recentCalls.delete(k);
    }
  }
  
  if (lastCall && (now - lastCall < CALL_DEDUP_WINDOW_MS)) {
    console.log('⏭️ Deduplication: Found duplicate within window');
    return true; // Duplicate within window
  }
  
  recentCalls.set(key, now);
  console.log('✅ Deduplication: New call tracked');
  return false;
}

export function registerCallHandlers(io: SocketIOServer, socket: Socket) {
  console.log('🔧 Registering call handlers for socket:', socket.id);
  
  // Handle call signaling - FIXED: Only forward to target user, not all in room
  socket.on('call-signal', (signal: CallSignal) => {
    console.log('📞 Call signal received:', {
      type: signal.type,
      from: signal.from,
      to: signal.to,
      conversationId: signal.conversationId,
      payloadType: signal.payload?.type,
      senderId: socket.id,
      senderUserId: socket.data?.userId,
    });
    
    const targetRoom = `user:${signal.to}`;
    console.log('📍 Forwarding to room:', targetRoom);
    
    // FIXED: Use socket.to() with the specific target socket only
    // This ensures only the intended recipient gets the signal
    const targetSockets = io.sockets.adapter.rooms.get(targetRoom);
    if (!targetSockets || targetSockets.size === 0) {
      console.error('❌ Target user not online:', signal.to);
      return;
    }
    
    // Forward to the specific user room (all their connected sockets)
    io.to(targetRoom).emit('call-signal', signal);
    console.log('✅ Call signal forwarded to user:', signal.to);
  });

  // Handle call initiation
  socket.on('call-initiated', (data: CallInitiated & { callerName?: string; offer?: any }, callback?: Function) => {
    // Check for duplicate calls from same caller to same receiver
    if (isDuplicateCall(data.from, data.to, data.conversationId)) {
      console.log('⏭️ Ignoring duplicate call-initiated from:', data.from, 'to:', data.to);
      if (callback && typeof callback === 'function') {
        callback({ received: true, duplicate: true, timestamp: Date.now() });
      }
      return;
    }
    
    console.log('📞 Call initiated received:', {
      from: data.from,
      to: data.to,
      conversationId: data.conversationId,
      callType: data.callType,
      hasOffer: !!data.offer,
      callerId: socket.id,
      callerUserId: socket.data?.userId,
    });
    
    // Send acknowledgment back to client if callback provided
    if (callback && typeof callback === 'function') {
      callback({ received: true, timestamp: Date.now() });
    }
    
    console.log('📍 Target user room:', `user:${data.to}`);
    console.log('🏠 Caller socket rooms:', Array.from(socket.rooms));
    
    // Check if target user room exists
    const targetRoom = `user:${data.to}`;
    const socketsInRoom = io.sockets.adapter.rooms.get(targetRoom);
    console.log('🔍 Sockets in target room:', {
      room: targetRoom,
      memberCount: socketsInRoom?.size || 0,
      socketIds: socketsInRoom ? Array.from(socketsInRoom) : [],
    });
    console.log('🔍 All active user rooms:', Array.from(io.sockets.adapter.rooms.keys()).filter(k => k.startsWith('user:')));
    
    if (!socketsInRoom || socketsInRoom.size === 0) {
      console.error('❌ Target user not in room:', data.to);
      return;
    }
    
    // Notify the target user about the incoming call WITH the offer
    io.to(targetRoom).emit('call-incoming', {
      from: data.from,
      conversationId: data.conversationId,
      callType: data.callType,
      callerName: data.callerName || 'Unknown User',
      offer: data.offer  // Forward the SDP offer
    });
    
    console.log('✅ Emitted call-incoming to user:', data.to, 'with offer:', !!data.offer);
  });

  // Handle call cancellation (when caller cancels outgoing call before connection)
  socket.on('call-cancelled', (data: { from: string; to: string; conversationId: string }) => {
    console.log('📞 Call cancelled received:', {
      from: data.from,
      to: data.to,
      conversationId: data.conversationId,
      callerId: socket.id,
      callerUserId: socket.data?.userId,
    });
    
    // Forward the cancellation to the target user
    const targetRoom = `user:${data.to}`;
    io.to(targetRoom).emit('call-cancelled', {
      from: data.from,
      conversationId: data.conversationId,
    });
    
    console.log('✅ Emitted call-cancelled to user:', data.to);
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
