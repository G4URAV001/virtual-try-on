// Test script to verify session sharing
// Run this in browser console to debug session issues

console.log('🔍 SESSION DEBUG TEST');

// Test 1: Check current sessionId in SessionContext
const sessionContext = document.querySelector('[data-session-id]');
if (sessionContext) {
  console.log('📋 Session from DOM:', sessionContext.getAttribute('data-session-id'));
} else {
  console.log('❌ No session ID found in DOM');
}

// Test 2: Check URL session parameter
const urlParams = new URLSearchParams(window.location.search);
const urlSession = urlParams.get('session');
console.log('🔗 URL Session:', urlSession);

// Test 3: Check socket connection
const socket = window._socketDebug;
if (socket) {
  console.log('🔌 Socket connected:', socket.connected);
  console.log('🔌 Socket ID:', socket.id);
} else {
  console.log('❌ No socket connection found');
}

// Test 4: Manual trigger try-on result
function testTryOnResult() {
  const testData = {
    sessionId: urlSession || 'test-session',
    result: 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAwIiBoZWlnaHQ9IjIwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iMTAwJSIgaGVpZ2h0PSIxMDAlIiBmaWxsPSIjNDI5NGY0Ii8+PHRleHQgeD0iNTAlIiB5PSI1MCUiIGZvbnQtZmFtaWx5PSJBcmlhbCIgZm9udC1zaXplPSIxNCIgZmlsbD0id2hpdGUiIHRleHQtYW5jaG9yPSJtaWRkbGUiIGR5PSIuM2VtIj5URVNUPC90ZXh0Pjwvc3ZnPg==',
    timestamp: new Date().toISOString()
  };
  
  if (socket) {
    socket.emit('try-on-result', testData);
    console.log('📤 Sent test try-on result:', testData);
  } else {
    console.log('❌ Cannot send test - no socket');
  }
}

// Test 5: Listen for try-on results
if (socket) {
  socket.on('try-on-result', (data) => {
    console.log('📺 RECEIVED try-on result:', data);
  });
}

console.log('📋 Run testTryOnResult() to test image transmission');
