import { io } from 'socket.io-client';

console.log('🧪 Simple session status test...');

const testSessionId = 'test-status-' + Date.now();
console.log('📱 Test session ID:', testSessionId);

const socket = io('http://localhost:3001', {
  autoConnect: true,
  reconnection: false
});

socket.on('connect', () => {
  console.log('🔌 Socket connected:', socket.id);
  
  // First join the session
  socket.emit('join-session', { sessionId: testSessionId, deviceType: 'display' });
  
  // Then request session status
  setTimeout(() => {
    console.log('📊 Requesting session status...');
    socket.emit('get-session-status', { sessionId: testSessionId });
  }, 1000);
});

socket.on('session-joined', (data) => {
  console.log('📺 Session joined:', data);
});

socket.on('session-status', (data) => {
  console.log('📊 Session status received:', data);
  
  // Clean up
  setTimeout(() => {
    socket.disconnect();
    console.log('🧹 Test completed');
  }, 1000);
});

socket.on('connect_error', (error) => {
  console.error('🚫 Connection error:', error);
});

// Timeout to ensure test doesn't hang
setTimeout(() => {
  console.log('⏰ Test timeout - disconnecting');
  socket.disconnect();
}, 10000);
