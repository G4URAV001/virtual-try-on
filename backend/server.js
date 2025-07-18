import express from 'express';
import { createServer } from 'http';
import { Server as SocketIOServer } from 'socket.io';
import cors from 'cors';

const app = express();
const server = createServer(app);

// Configure CORS for Socket.IO and Express - Allow all origins for deployment
const corsOptions = {
  origin: true, // Allow all origins
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With']
};

app.use(cors(corsOptions));
app.use(express.json());

const io = new SocketIOServer(server, {
  cors: corsOptions,
  pingTimeout: 60000,
  pingInterval: 25000,
  // Optimize for faster connections
  transports: ['websocket', 'polling'],
  allowEIO3: true,
  serveClient: false,
  // Reduce connection establishment time
  connectTimeout: 5000,
  httpCompression: true,
  perMessageDeflate: false
});

// Store active sessions and their connected clients
const sessions = new Map();
const socketToSession = new Map();

io.on('connection', (socket) => {
  console.log(`✅ Client connected: ${socket.id}`);

  // Handle joining a session
  socket.on('join-session', (data) => {
    // Support both old format (string) and new format (object)
    const sessionId = typeof data === 'string' ? data : data?.sessionId;
    const deviceType = typeof data === 'string' ? 'unknown' : (data?.deviceType || 'unknown');
    
    if (!sessionId) {
      console.error('❌ No session ID provided for join-session');
      socket.emit('error', { message: 'Session ID is required' });
      return;
    }
    
    console.log(`📱 Socket ${socket.id} joining session: ${sessionId} as ${deviceType}`);
    
    // Leave previous session if any
    const previousSession = socketToSession.get(socket.id);
    if (previousSession) {
      socket.leave(previousSession);
      const sessionData = sessions.get(previousSession);
      if (sessionData) {
        sessionData.clients.delete(socket.id);
        if (sessionData.clients.size === 0) {
          sessions.delete(previousSession);
        }
      }
    }

    // Join new session
    socket.join(sessionId);
    socketToSession.set(socket.id, sessionId);

    // Initialize or update session data
    if (!sessions.has(sessionId)) {
      sessions.set(sessionId, {
        id: sessionId,
        clients: new Set(),
        deviceTypes: new Map(), // Track device types
        lastResult: null,
        createdAt: new Date()
      });
    }

    const sessionData = sessions.get(sessionId);
    sessionData.clients.add(socket.id);
    sessionData.deviceTypes.set(socket.id, deviceType); // Store device type

    // Count mobile devices specifically
    const mobileCount = Array.from(sessionData.deviceTypes.values()).filter(type => type === 'mobile').length;
    const displayCount = Array.from(sessionData.deviceTypes.values()).filter(type => type === 'display').length;
    
    console.log(`📊 Session ${sessionId} now has: ${displayCount} displays, ${mobileCount} mobiles, ${sessionData.clients.size} total`);

    // Broadcast updated client count to ALL clients in the session IMMEDIATELY
    const broadcastData = {
      sessionId,
      clientCount: sessionData.clients.size,
      mobileCount: mobileCount,
      displayCount: displayCount,
      hasResult: !!sessionData.lastResult,
      joinedSocketId: socket.id,
      joinedDeviceType: deviceType
    };

    // Use immediate emission with no delay
    setImmediate(() => {
      io.to(sessionId).emit('session-joined', broadcastData);
      console.log(`📤 Broadcasted session-joined immediately to session ${sessionId}`);
      console.log(`📤 Broadcast data:`, JSON.stringify(broadcastData, null, 2));
    });

    // Send existing result to the newly joined client if available
    if (sessionData.lastResult) {
      setImmediate(() => {
        socket.emit('try-on-result', sessionData.lastResult);
        console.log(`📤 Sent existing result to new client ${socket.id}`);
      });
    }

    console.log(`📊 Session ${sessionId} now has ${sessionData.clients.size} clients`);
  });

  // Handle session status request
  socket.on('get-session-status', (data) => {
    const sessionId = data.sessionId;
    console.log(`📊 Session status requested for: ${sessionId} by socket: ${socket.id}`);
    
    if (!sessionId) {
      console.error('❌ No session ID provided for session status request');
      return;
    }

    const sessionData = sessions.get(sessionId);
    if (sessionData) {
      const mobileCount = Array.from(sessionData.deviceTypes.values()).filter(type => type === 'mobile').length;
      const displayCount = Array.from(sessionData.deviceTypes.values()).filter(type => type === 'display').length;
      
      console.log(`📊 Sending session status: ${displayCount} displays, ${mobileCount} mobiles, ${sessionData.clients.size} total`);
      
      const statusData = {
        sessionId,
        clientCount: sessionData.clients.size,
        mobileCount: mobileCount,
        displayCount: displayCount,
        hasResult: !!sessionData.lastResult
      };
      
      socket.emit('session-status', statusData);
      console.log(`📤 Sent session-status to socket ${socket.id}:`, JSON.stringify(statusData, null, 2));
    } else {
      console.log(`📊 Session ${sessionId} not found, sending empty status`);
      socket.emit('session-status', {
        sessionId,
        clientCount: 0,
        mobileCount: 0,
        displayCount: 0,
        hasResult: false
      });
    }
  });

  // Handle try-on results
  socket.on('try-on-result', (data) => {
    const sessionId = data.sessionId;
    console.log(`🎨 Try-on result received for session: ${sessionId}`);

    if (!sessionId) {
      console.error('❌ No session ID provided with try-on result');
      return;
    }

    // Store the result in session data
    const sessionData = sessions.get(sessionId);
    if (sessionData) {
      sessionData.lastResult = {
        ...data,
        receivedAt: new Date().toISOString()
      };
    }

    // Broadcast to all clients in the session
    socket.to(sessionId).emit('try-on-result', data);
    console.log(`📤 Broadcasting result to session ${sessionId}`);
  });

  // Handle session updates
  socket.on('session-update', (data) => {
    const sessionId = socketToSession.get(socket.id);
    if (sessionId) {
      socket.to(sessionId).emit('session-update', data);
      console.log(`📢 Session update broadcast to ${sessionId}`);
    }
  });

  // Handle client status updates
  socket.on('client-status', (data) => {
    const sessionId = socketToSession.get(socket.id);
    if (sessionId) {
      socket.to(sessionId).emit('client-status', {
        ...data,
        socketId: socket.id
      });
    }
  });

  // Handle disconnection
  socket.on('disconnect', (reason) => {
    console.log(`❌ Client disconnected: ${socket.id} (${reason})`);
    
    const sessionId = socketToSession.get(socket.id);
    if (sessionId) {
      const sessionData = sessions.get(sessionId);
      if (sessionData) {
        const disconnectedDeviceType = sessionData.deviceTypes.get(socket.id) || 'unknown';
        
        sessionData.clients.delete(socket.id);
        sessionData.deviceTypes.delete(socket.id); // Remove device type info
        
        // Count remaining mobile devices
        const mobileCount = Array.from(sessionData.deviceTypes.values()).filter(type => type === 'mobile').length;
        const displayCount = Array.from(sessionData.deviceTypes.values()).filter(type => type === 'display').length;
        
        console.log(`📊 ${disconnectedDeviceType} disconnected from session ${sessionId}`);
        console.log(`📊 Session ${sessionId} now has: ${displayCount} displays, ${mobileCount} mobiles, ${sessionData.clients.size} total`);
        
        // Broadcast updated client count to remaining clients in session
        io.to(sessionId).emit('client-disconnected', {
          socketId: socket.id,
          deviceType: disconnectedDeviceType,
          clientCount: sessionData.clients.size,
          mobileCount: mobileCount,
          displayCount: displayCount,
          sessionId: sessionId
        });

        // Clean up empty sessions
        if (sessionData.clients.size === 0) {
          sessions.delete(sessionId);
          console.log(`🗑️ Cleaned up empty session: ${sessionId}`);
        } else {
          console.log(`📊 Session ${sessionId} now has ${sessionData.clients.size} clients`);
        }
      }
      socketToSession.delete(socket.id);
    }
  });

  // Handle ping/pong for connection health
  socket.on('ping', () => {
    socket.emit('pong');
  });
});

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({
    status: 'healthy',
    activeSessions: sessions.size,
    totalConnections: io.engine.clientsCount,
    uptime: process.uptime(),
    timestamp: new Date().toISOString()
  });
});

// Session info endpoint
app.get('/api/sessions', (req, res) => {
  const sessionList = Array.from(sessions.entries()).map(([id, data]) => ({
    id,
    clientCount: data.clients.size,
    hasResult: !!data.lastResult,
    createdAt: data.createdAt
  }));

  res.json({
    sessions: sessionList,
    totalSessions: sessions.size,
    totalConnections: io.engine.clientsCount
  });
});

// Get specific session info
app.get('/api/sessions/:sessionId', (req, res) => {
  const sessionId = req.params.sessionId;
  const sessionData = sessions.get(sessionId);

  if (!sessionData) {
    return res.status(404).json({ error: 'Session not found' });
  }

  res.json({
    id: sessionId,
    clientCount: sessionData.clients.size,
    hasResult: !!sessionData.lastResult,
    createdAt: sessionData.createdAt,
    lastResult: sessionData.lastResult ? {
      timestamp: sessionData.lastResult.timestamp,
      hasImage: !!sessionData.lastResult.result
    } : null
  });
});

const PORT = process.env.PORT || 3001;

server.listen(PORT, () => {
  console.log(`🚀 Socket.IO server running on port ${PORT}`);
  console.log(`📡 WebSocket endpoint: ws://localhost:${PORT}`);
  console.log(`🏥 Health check: http://localhost:${PORT}/health`);
  console.log(`📊 Sessions API: http://localhost:${PORT}/api/sessions`);
});

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('🛑 SIGTERM received, shutting down gracefully');
  server.close(() => {
    console.log('💀 Server closed');
    process.exit(0);
  });
});

process.on('SIGINT', () => {
  console.log('🛑 SIGINT received, shutting down gracefully');
  server.close(() => {
    console.log('💀 Server closed');
    process.exit(0);
  });
});
