import { io } from 'socket.io-client';

console.log('🧪 Testing device type detection...');

const sessionId = 'test-device-types-' + Date.now();

// Test 1: Connect as display
console.log('\n📺 Test 1: Connecting as DISPLAY device...');
const displaySocket = io('http://localhost:3001');

displaySocket.on('connect', () => {
  console.log('✅ Display socket connected:', displaySocket.id);
  
  // Join session as display device
  displaySocket.emit('join-session', { 
    sessionId: sessionId, 
    deviceType: 'display' 
  });
  console.log('📺 Display joined session:', sessionId);
});

displaySocket.on('session-joined', (data) => {
  console.log('📊 Display received session-joined:', {
    sessionId: data.sessionId,
    clientCount: data.clientCount,
    mobileCount: data.mobileCount,
    displayCount: data.displayCount,
    joinedDeviceType: data.joinedDeviceType
  });
  
  // Only start mobile test after display has joined
  if (data.displayCount === 1 && data.mobileCount === 0) {
    setTimeout(testMobileConnection, 1000);
  }
});

function testMobileConnection() {
  console.log('\n📱 Test 2: Connecting as MOBILE device...');
  const mobileSocket = io('http://localhost:3001');
  
  mobileSocket.on('connect', () => {
    console.log('✅ Mobile socket connected:', mobileSocket.id);
    
    // Join same session as mobile device
    mobileSocket.emit('join-session', { 
      sessionId: sessionId, 
      deviceType: 'mobile' 
    });
    console.log('📱 Mobile joined session:', sessionId);
  });
  
  mobileSocket.on('session-joined', (data) => {
    console.log('📊 Mobile received session-joined:', {
      sessionId: data.sessionId,
      clientCount: data.clientCount,
      mobileCount: data.mobileCount,
      displayCount: data.displayCount,
      joinedDeviceType: data.joinedDeviceType
    });
    
    // Test mobile disconnect
    setTimeout(() => {
      console.log('\n❌ Test 3: Disconnecting mobile device...');
      mobileSocket.disconnect();
      
      // Clean up after test
      setTimeout(() => {
        displaySocket.disconnect();
        console.log('\n🧹 Test completed, all sockets disconnected');
        process.exit(0);
      }, 1000);
    }, 1000);
  });
  
  displaySocket.on('session-joined', (data) => {
    if (data.joinedDeviceType === 'mobile') {
      console.log('📺 Display detected mobile connection:', {
        mobileCount: data.mobileCount,
        displayCount: data.displayCount
      });
    }
  });
  
  displaySocket.on('client-disconnected', (data) => {
    console.log('📺 Display detected disconnection:', {
      deviceType: data.deviceType,
      mobileCount: data.mobileCount,
      displayCount: data.displayCount
    });
  });
}

displaySocket.on('connect_error', (err) => {
  console.error('❌ Display connection failed:', err.message);
  process.exit(1);
});

// Timeout safety
setTimeout(() => {
  console.error('⏰ Test timeout');
  process.exit(1);
}, 15000);
