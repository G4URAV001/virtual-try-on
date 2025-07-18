import express from 'express';
import { createServer } from 'http';
import { Server as SocketIOServer } from 'socket.io';
import cors from 'cors';

const app = express();
const server = createServer(app);

const corsOptions = {
  origin: true,
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With']
};

app.use(cors(corsOptions));
app.use(express.json());

const io = new SocketIOServer(server, {
  cors: corsOptions,
  pingTimeout: 60000,
  pingInterval: 25000
});

// Sessions: { [sessionId]: { id, clients: Set, deviceTypes: { [socketId]: deviceType }, lastResult, createdAt } }
const sessions = {};
// socketToSession: { [socketId]: sessionId }
const socketToSession = {};

function countDevices(deviceTypes) {
  let mobile = 0, display = 0;
  for (const type of Object.values(deviceTypes)) {
    if (type === 'mobile') mobile++;
    else if (type === 'display') display++;
  }
  return { mobile, display };
}

function cleanupSession(sessionId) {
  if (sessions[sessionId] && sessions[sessionId].clients.size === 0) {
    delete sessions[sessionId];
    // console.log(`🗑️ Cleaned up empty session: ${sessionId}`);
  }
}

io.on('connection', (socket) => {
  // console.log(`✅ Client connected: ${socket.id}`);

  socket.on('join-session', (data) => {
    const { sessionId, deviceType = 'unknown' } = data || {};
    if (!sessionId) {
      socket.emit('error', { message: 'Session ID is required' });
      return;
    }

    // Leave previous session if any
    const prevSession = socketToSession[socket.id];
    if (prevSession && sessions[prevSession]) {
      socket.leave(prevSession);
      sessions[prevSession].clients.delete(socket.id);
      delete sessions[prevSession].deviceTypes[socket.id];
      cleanupSession(prevSession);
    }

    // Join new session
    socket.join(sessionId);
    socketToSession[socket.id] = sessionId;
    if (!sessions[sessionId]) {
      sessions[sessionId] = {
        id: sessionId,
        clients: new Set(),
        deviceTypes: {},
        lastResult: null,
        createdAt: new Date()
      };
    }
    const session = sessions[sessionId];
    session.clients.add(socket.id);
    session.deviceTypes[socket.id] = deviceType;
    const { mobile: mobileCount, display: displayCount } = countDevices(session.deviceTypes);
    io.to(sessionId).emit('session-joined', {
      sessionId,
      clientCount: session.clients.size,
      mobileCount,
      displayCount,
      hasResult: !!session.lastResult,
      joinedSocketId: socket.id,
      joinedDeviceType: deviceType
    });
    if (session.lastResult) {
      socket.emit('try-on-result', session.lastResult);
    }
  });

  socket.on('get-session-status', (data) => {
    const sessionId = data.sessionId;
    if (!sessionId) return;
    const session = sessions[sessionId];
    if (session) {
      const { mobile: mobileCount, display: displayCount } = countDevices(session.deviceTypes);
      socket.emit('session-status', {
        sessionId,
        clientCount: session.clients.size,
        mobileCount,
        displayCount,
        hasResult: !!session.lastResult
      });
    } else {
      socket.emit('session-status', {
        sessionId,
        clientCount: 0,
        mobileCount: 0,
        displayCount: 0,
        hasResult: false
      });
    }
  });

  socket.on('try-on-result', (data) => {
    const sessionId = data.sessionId;
    if (!sessionId) return;
    const session = sessions[sessionId];
    if (session) {
      session.lastResult = { ...data, receivedAt: new Date().toISOString() };
      socket.to(sessionId).emit('try-on-result', data);
    }
  });

  socket.on('session-update', (data) => {
    const sessionId = socketToSession[socket.id];
    if (sessionId) {
      socket.to(sessionId).emit('session-update', data);
    }
  });

  socket.on('client-status', (data) => {
    const sessionId = socketToSession[socket.id];
    if (sessionId) {
      socket.to(sessionId).emit('client-status', {
        ...data,
        socketId: socket.id
      });
    }
  });

  socket.on('disconnect', () => {
    const sessionId = socketToSession[socket.id];
    if (sessionId && sessions[sessionId]) {
      const session = sessions[sessionId];
      const deviceType = session.deviceTypes[socket.id] || 'unknown';
      session.clients.delete(socket.id);
      delete session.deviceTypes[socket.id];
      const { mobile: mobileCount, display: displayCount } = countDevices(session.deviceTypes);
      io.to(sessionId).emit('client-disconnected', {
        socketId: socket.id,
        deviceType,
        clientCount: session.clients.size,
        mobileCount,
        displayCount,
        sessionId
      });
      cleanupSession(sessionId);
    }
    delete socketToSession[socket.id];
  });

  socket.on('ping', () => {
    socket.emit('pong');
  });
});

app.get('/health', (req, res) => {
  res.json({
    status: 'healthy',
    activeSessions: Object.keys(sessions).length,
    totalConnections: io.engine.clientsCount,
    uptime: process.uptime(),
    timestamp: new Date().toISOString()
  });
});

app.get('/api/sessions', (req, res) => {
  const sessionList = Object.values(sessions).map((data) => ({
    id: data.id,
    clientCount: data.clients.size,
    hasResult: !!data.lastResult,
    createdAt: data.createdAt
  }));
  res.json({
    sessions: sessionList,
    totalSessions: sessionList.length,
    totalConnections: io.engine.clientsCount
  });
});

app.get('/api/sessions/:sessionId', (req, res) => {
  const sessionId = req.params.sessionId;
  const session = sessions[sessionId];
  if (!session) {
    return res.status(404).json({ error: 'Session not found' });
  }
  res.json({
    id: sessionId,
    clientCount: session.clients.size,
    hasResult: !!session.lastResult,
    createdAt: session.createdAt,
    lastResult: session.lastResult ? {
      timestamp: session.lastResult.timestamp,
      hasImage: !!session.lastResult.result
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

process.on('SIGTERM', () => {
  server.close(() => process.exit(0));
});
process.on('SIGINT', () => {
  server.close(() => process.exit(0));
});