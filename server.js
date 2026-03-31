const { createServer } = require('http');
const { parse } = require('url');
const next = require('next');
const { Server } = require('socket.io');

const dev = process.env.NODE_ENV !== 'production';
const hostname = 'localhost';
const port = parseInt(process.env.PORT || '3000', 10);

const app = next({ dev, hostname, port });
const handle = app.getRequestHandler();

app.prepare().then(() => {
  const httpServer = createServer(async (req, res) => {
    try {
      const parsedUrl = parse(req.url, true);
      await handle(req, res, parsedUrl);
    } catch (err) {
      console.error('Error occurred handling', req.url, err);
      res.statusCode = 500;
      res.end('internal server error');
    }
  });

  // Initialize Socket.IO
  const io = new Server(httpServer, {
    path: '/api/socket',
    cors: {
      origin: '*',
      methods: ['GET', 'POST'],
    },
  });

  // Store io instance globally for API routes to access
  global.io = io;

  io.on('connection', (socket) => {
    console.log('✅ Client connected:', socket.id);

    // User joins their personal room
    socket.on('join', (userId, callback) => {
      socket.join(`user:${userId}`);
      socket.data = { ...socket.data, userId };
      console.log(`👤 User ${userId} joined their room`);
      
      // Send acknowledgment if callback provided
      if (callback && typeof callback === 'function') {
        callback({ joined: true, room: `user:${userId}`, socketId: socket.id });
      }
      
      // Register messenger handlers
      try {
        const { registerMessengerHandlers } = require('./src/lib/socket/messengerHandlers.ts');
        registerMessengerHandlers(io, socket);
        console.log('✅ Messenger handlers registered for user:', userId);
      } catch (error) {
        console.log('📝 Messenger handlers not available:', error.message);
      }
      
      // Register call handlers for voice/video
      try {
        const { registerCallHandlers } = require('./src/lib/socket/callHandlers.ts');
        registerCallHandlers(io, socket);
        console.log('✅ Call handlers registered for user:', userId);
      } catch (error) {
        console.log('📝 Call handlers not available:', error.message);
      }
    });

    // School joins their room
    socket.on('joinSchool', (schoolId) => {
      socket.join(`school:${schoolId}`);
      socket.data = { ...socket.data, schoolId };
      console.log(`🏫 School ${schoolId} joined`);
    });

    // Simple ping/pong for connection testing
    socket.on('ping', (data, callback) => {
      console.log('🏓 Ping received from:', socket.id, 'data:', data);
      if (callback && typeof callback === 'function') {
        callback({ pong: true, timestamp: Date.now(), socketId: socket.id, received: data });
      }
    });

    // Handle call initiation
    socket.on('call-initiated', (data, callback) => {
      console.log('📞 Call initiated received:', data);
      
      if (callback && typeof callback === 'function') {
        callback({ received: true, timestamp: Date.now() });
      }
      
      const targetRoom = `user:${data.to}`;
      const socketsInRoom = io.sockets.adapter.rooms.get(targetRoom);
      console.log('📍 Target room:', targetRoom, 'Sockets:', socketsInRoom ? socketsInRoom.size : 0);
      
      if (!socketsInRoom || socketsInRoom.size === 0) {
        console.error('❌ Target user not connected:', data.to);
        return;
      }
      
      // Forward to target user with the offer included
      io.to(targetRoom).emit('call-incoming', {
        from: data.from,
        conversationId: data.conversationId,
        callType: data.callType,
        callerName: data.callerName || 'Unknown User',
        offer: data.offer  // Include the SDP offer
      });
      
      console.log('✅ Emitted call-incoming to user:', data.to, 'with offer:', !!data.offer);
    });

    socket.on('disconnect', () => {
      console.log('❌ Client disconnected:', socket.id);
    });
  });

  httpServer
    .once('error', (err) => {
      console.error(err);
      process.exit(1);
    })
    .listen(port, () => {
      console.log(`🚀 Server ready on http://${hostname}:${port}`);
      console.log('🔌 Socket.IO initialized');
    });
});
