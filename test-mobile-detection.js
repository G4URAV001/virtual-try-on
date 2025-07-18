import { io } from 'socket.io-client';

console.log('🧪 Testing mobile detection fix...');

// Get session ID from display URL or create test session
const testSessionId = 'test-mobile-detection-' + Date.now();
console.log('📱 Test session ID:', testSessionId);

// Create display socket first
const displaySocket = io('http://localhost:3001', {
  autoConnect: true,
  reconnection: false
});

// Create mobile socket
const mobileSocket = io('http://localhost:3001', {
  autoConnect: true,
  reconnection: false
});

let displayConnected = false;
let mobileConnected = false;

displaySocket.on('connect', () => {
  console.log('📺 Display socket connected:', displaySocket.id);
  displayConnected = true;
  
  // Join session as display
  displaySocket.emit('join-session', { sessionId: testSessionId, deviceType: 'display' });
  // Request session status to get current mobile count
  displaySocket.emit('get-session-status', { sessionId: testSessionId });
});

displaySocket.on('session-joined', (data) => {
  console.log('📺 Display received session-joined:', data);
});

displaySocket.on('session-status', (data) => {
  console.log('📊 Display received session-status:', data);
  
  if (data.mobileCount > 0) {
    console.log('✅ SUCCESS: Display detected mobile devices!');
  } else {
    console.log('❌ Display shows no mobile devices');
  }
});

mobileSocket.on('connect', () => {
  console.log('📱 Mobile socket connected:', mobileSocket.id);
  mobileConnected = true;
  
  // Wait a moment, then join session as mobile
  setTimeout(() => {
    mobileSocket.emit('join-session', { sessionId: testSessionId, deviceType: 'mobile' });
  }, 1000);
});

mobileSocket.on('session-joined', (data) => {
  console.log('📱 Mobile received session-joined:', data);
  
  // Test: Now connect another display to see if it detects the mobile
  setTimeout(() => {
    console.log('🧪 Testing: Creating new display to check mobile detection...');
    
    const newDisplaySocket = io('http://localhost:3001', {
      autoConnect: true,
      reconnection: false
    });
    
    newDisplaySocket.on('connect', () => {
      console.log('📺 New display socket connected:', newDisplaySocket.id);
      newDisplaySocket.emit('join-session', { sessionId: testSessionId, deviceType: 'display' });
      // Request session status to get current mobile count
      newDisplaySocket.emit('get-session-status', { sessionId: testSessionId });
    });
    
    newDisplaySocket.on('session-status', (data) => {
      console.log('📊 New display received session-status:', data);
      
      if (data.mobileCount > 0) {
        console.log('✅ SUCCESS: New display correctly detected existing mobile!');
      } else {
        console.log('❌ FAIL: New display did not detect existing mobile');
      }
      
      // Clean up
      setTimeout(() => {
        newDisplaySocket.disconnect();
        displaySocket.disconnect();
        mobileSocket.disconnect();
        console.log('🧹 Test completed, sockets disconnected');
      }, 2000);
    });
  }, 2000);
});

// Error handling
displaySocket.on('connect_error', (error) => {
  console.error('📺 Display connection error:', error);
});

mobileSocket.on('connect_error', (error) => {
  console.error('📱 Mobile connection error:', error);
});
