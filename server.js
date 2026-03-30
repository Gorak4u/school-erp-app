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

    // Simple ping/pong for connection testing
    socket.on('ping', (data, callback) => {
      console.log('🏓 Ping received from:', socket.id, 'data:', data);
      if (callback && typeof callback === 'function') {
        callback({ pong: true, timestamp: Date.now(), socketId: socket.id, received: data });
      }
    });

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
        console.error('❌ Error registering messenger handlers:', error.message);
      }
      
      // Register call handlers for voice/video
      try {
        const { registerCallHandlers } = require('./src/lib/socket/callHandlers.ts');
        registerCallHandlers(io, socket);
        console.log('✅ Call handlers registered for user:', userId);
      } catch (error) {
        console.error('❌ Error registering call handlers:', error.message);
      }
    });

    socket.on('joinSchool', (schoolId) => {
      socket.join(`school:${schoolId}`);
      socket.data = { ...socket.data, schoolId };
      console.log(`🏫 School ${schoolId} joined`);
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
