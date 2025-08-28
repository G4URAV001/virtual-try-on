import React, { useState, useEffect } from 'react';
import { Monitor, Smartphone, Wifi, WifiOff, QrCode, Maximize2, Minimize2, X } from 'lucide-react';
import QRCode from 'react-qr-code';
import { useSocket } from '../contexts/SocketContext';
import { useSession } from '../contexts/SessionContext';

const DisplayScreen: React.FC = () => {
  const [resultImage, setResultImage] = useState<string | null>(null);
  const [lastUpdate, setLastUpdate] = useState<string | null>(null);
  const [showQR, setShowQR] = useState(true);
  const [mobileConnected, setMobileConnected] = useState(false);
  const [mobileConnecting, setMobileConnecting] = useState(false);
  const [initialized, setInitialized] = useState(false);
  const [sessionUpdated, setSessionUpdated] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  
  const { socket, isConnected, connectionError, connectToSession } = useSocket();
  const { sessionId, generateNewSession, joinSession } = useSession();

  useEffect(() => {
    if (initialized) return; // Prevent re-initialization
    
    // Check URL params for session ID first
    const urlParams = new URLSearchParams(window.location.search);
    const urlSessionId = urlParams.get('session');
    
    if (urlSessionId) {
      joinSession(urlSessionId);
      connectToSession(urlSessionId);
    } else {
      // If no URL session, create a new one and update the URL
      const newSessionId = generateNewSession();
      
      // Update the URL with the session parameter
      const newUrl = `${window.location.pathname}?session=${newSessionId}`;
      window.history.replaceState({}, '', newUrl);
      
      connectToSession(newSessionId);
    }
    setInitialized(true);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // Intentionally empty - run only once on mount

  const mobileUrl = `${window.location.origin}/mobile?session=${sessionId}`;

  useEffect(() => {
    if (socket && sessionId) {
      // Clean up any existing listeners first to prevent duplicates
      socket.off('try-on-result');
      socket.off('session-status');
      socket.off('session-joined');
      socket.off('client-disconnected');

      // Only reset state when sessionId changes
      setMobileConnected(false);
      setMobileConnecting(true);

      // Clear connecting state after 30 seconds if no response
      const connectingTimeout = setTimeout(() => {
        setMobileConnecting(false);
      }, 30000);

      // Request session status when first connecting
      socket.emit('get-session-status', { sessionId });

      // Helper function to update mobile connection state
      const updateMobileConnectionState = (mobileCount: number) => {
        const newMobileConnected = mobileCount > 0;
        setMobileConnected(newMobileConnected);
        if (newMobileConnected) setMobileConnecting(false);
        setSessionUpdated(prev => !prev);
      };

      socket.on('try-on-result', (data) => {
        if (data.sessionId === sessionId) {
          if (data.result && typeof data.result === 'string') {
            setResultImage(data.result);
            setLastUpdate(data.timestamp);
            setShowQR(false);
            setIsFullscreen(true);
          } else {
            console.warn('⚠️ [DisplayScreen] Received try-on result with missing or invalid image data:', data);
          }
        }
      });

      socket.on('session-status', (data) => {
        updateMobileConnectionState(data.mobileCount);
      });

      socket.on('session-joined', (data) => {
        if (data.sessionId === sessionId) {
          updateMobileConnectionState(data.mobileCount);
        }
      });

      socket.on('client-disconnected', (data) => {
        if (data.sessionId === sessionId) {
          updateMobileConnectionState(data.mobileCount);
        }
      });

      return () => {
        socket.off('try-on-result');
        socket.off('session-status');
        socket.off('session-joined');
        socket.off('client-disconnected');
        if (connectingTimeout) clearTimeout(connectingTimeout);
      };
    }
    // ONLY depend on socket and sessionId!
  }, [socket, sessionId]);

  const handleNewSession = () => {
    const newSessionId = generateNewSession();
    
    // Update the browser URL with the new session ID
    const newUrl = `${window.location.pathname}?session=${newSessionId}`;
    window.history.pushState({}, '', newUrl);
    
    // Reset display state
    setResultImage(null);
    setLastUpdate(null);
    setShowQR(true);
    setMobileConnected(false);
    
    // Show brief notification that session was updated
    setSessionUpdated(true);
    setTimeout(() => setSessionUpdated(false), 3000);
    
    // Connect to the new session
    connectToSession(newSessionId);
  };

  const toggleQR = () => {
    setShowQR(!showQR);
  };

  const toggleFullscreen = () => {
    setIsFullscreen(!isFullscreen);
  };

  const closeFullscreen = () => {
    setIsFullscreen(false);
  };

  const maximizeResult = () => {
    setIsFullscreen(true);
  };

  // Keyboard shortcuts for fullscreen
  useEffect(() => {
    const handleKeyPress = (event: KeyboardEvent) => {
      if (event.key === 'Escape' && isFullscreen) {
        closeFullscreen();
      }
      if (event.key === 'f' && resultImage && !isFullscreen) {
        maximizeResult();
      }
    };

    window.addEventListener('keydown', handleKeyPress);
    return () => window.removeEventListener('keydown', handleKeyPress);
  }, [isFullscreen, resultImage]);

  return (
    <>
      {/* Fullscreen Try-On Result Modal */}
      {isFullscreen && resultImage && (
        <div className="fixed inset-0 bg-black/95 backdrop-blur-sm z-50 flex items-center justify-center">
          <div className="relative w-full h-full flex items-center justify-center p-4 md:p-6 lg:p-8">
            {/* Close Button */}
            <button
              onClick={closeFullscreen}
              className="absolute top-4 right-4 md:top-6 md:right-6 z-60 bg-white/20 hover:bg-white/30 rounded-full p-3 transition-colors"
            >
              <X className="h-6 w-6 text-white" />
            </button>
            
            {/* Minimize Button */}
            <button
              onClick={toggleFullscreen}
              className="absolute top-4 right-16 md:top-6 md:right-20 z-60 bg-white/20 hover:bg-white/30 rounded-full p-3 transition-colors"
            >
              <Minimize2 className="h-6 w-6 text-white" />
            </button>
            
            {/* Fullscreen Image */}
            <div className="relative w-full h-full max-w-5xl max-h-[90vh] flex items-center justify-center">
              <img
                src={resultImage}
                alt="Virtual try-on result - Fullscreen"
                className="max-w-full max-h-full object-contain rounded-lg"
              />
              
              {/* Image Info Overlay */}
              <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-4 md:p-6 rounded-b-lg">
                <div className="flex items-center justify-between text-white">
                  <div>
                    <h3 className="text-2xl font-bold mb-1">Virtual Try-On Result</h3>
                    <p className="text-white/80">Session: {sessionId}</p>
                  </div>
                  {lastUpdate && (
                    <div className="text-right">
                      <p className="text-white/80 text-sm">Generated at</p>
                      <p className="text-lg font-semibold">
                        {new Date(lastUpdate).toLocaleString()}
                      </p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Main Display Screen */}
      <div className="min-h-screen bg-gradient-to-br from-blue-900 via-purple-900 to-black text-white">
      <div className="container mx-auto px-8 py-12">
        {/* Header */}
        <div className="flex items-center justify-between mb-12">
          <div className="flex items-center">
            <div className="bg-gradient-to-r from-blue-500 to-purple-500 rounded-full p-4 mr-6">
              <Monitor className="h-10 w-10 text-white" />
            </div>
            <div>
              <h1 className="text-4xl font-bold mb-2">Virtual Try-On Display</h1>
              <div className="flex items-center text-blue-200">
                {!isConnected ? (
                  <>
                    <WifiOff className="h-5 w-5 mr-2" />
                    <span>Disconnected</span>
                    {connectionError && (
                      <span className="ml-2 text-red-300 text-sm">({connectionError})</span>
                    )}
                  </>
                ) : mobileConnecting ? (
                  <>
                    <Wifi className="h-5 w-5 mr-2 text-blue-400 animate-pulse" />
                    <span>Mobile Connecting... 🔄</span>
                    <div className="w-2 h-2 bg-blue-400 rounded-full animate-ping ml-2"></div>
                  </>
                ) : mobileConnected ? (
                  <>
                    <Wifi className="h-5 w-5 mr-2" />
                    <span>Mobile Connected ✅</span>
                    <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse ml-2"></div>
                  </>
                ) : (
                  <>
                    <Wifi className="h-5 w-5 mr-2 text-yellow-400" />
                    <span>Waiting for Mobile 🟡</span>
                    <div className="w-2 h-2 bg-yellow-400 rounded-full animate-pulse ml-2"></div>
                  </>
                )}
                <div className="ml-4 text-xs">
                  <div>Socket: {isConnected ? '🟢 Connected' : '🔴 Disconnected'}</div>
                  <div>Mobile: {mobileConnecting ? '🔄 Connecting' : mobileConnected ? '🟢 True' : '🔴 False'}</div>
                  <div>Session: {sessionId?.substring(0, 8) || 'None'}</div>
                </div>
              </div>
            </div>
          </div>
          
          <div className="flex items-center space-x-4">
            <button
              onClick={toggleQR}
              className="bg-white/20 hover:bg-white/30 px-4 py-2 rounded-lg transition-colors flex items-center"
            >
              <QrCode className="h-5 w-5 mr-2" />
              {showQR ? 'Hide QR' : 'Show QR'}
            </button>
            
            {/* Show Result Button - appears when result exists but not in fullscreen */}
            {resultImage && !isFullscreen && (
              <button
                onClick={maximizeResult}
                className="bg-green-500/20 hover:bg-green-500/30 px-4 py-2 rounded-lg transition-colors text-green-200 flex items-center"
              >
                <Maximize2 className="h-4 w-4 mr-2" />
                View Result
              </button>
            )}
            
            <button
              onClick={handleNewSession}
              className="bg-gradient-to-r from-blue-500 to-purple-500 hover:from-blue-600 hover:to-purple-600 px-6 py-2 rounded-lg font-medium transition-all duration-200"
              title="Generate a new session ID and update the URL"
            >
              New Session
            </button>
          </div>
        </div>

        {/* Session Update Notification */}
        {sessionUpdated && (
          <div className="bg-green-500/20 border border-green-400 rounded-lg p-4 mb-6 flex items-center">
            <div className="w-3 h-3 bg-green-400 rounded-full animate-pulse mr-3"></div>
            <span className="text-green-200">
              New session created! URL updated: {sessionId}
            </span>
          </div>
        )}

        {/* Main Content */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Result Display */}
          <div className="lg:col-span-2">
            {resultImage ? (
              <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-6">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-2xl font-semibold">Latest Try-On Result</h2>
                  {lastUpdate && (
                    <span className="text-blue-200 text-sm">
                      {new Date(lastUpdate).toLocaleTimeString()}
                    </span>
                  )}
                </div>
                <div className="relative">
                  <img
                    src={resultImage}
                    alt="Virtual try-on result"
                    className="w-full h-96 object-contain rounded-lg bg-black/20"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent rounded-lg pointer-events-none" />
                  
                  {/* Maximize Button */}
                  <button
                    onClick={maximizeResult}
                    className="absolute top-4 right-4 bg-black/50 hover:bg-black/70 rounded-full p-2 transition-colors"
                    title="View fullscreen"
                  >
                    <Maximize2 className="h-5 w-5 text-white" />
                  </button>
                </div>
              </div>
            ) : (
              <div className="bg-white/5 backdrop-blur-sm rounded-2xl p-12 text-center">
                <div className="animate-pulse">
                  <Smartphone className="h-24 w-24 mx-auto mb-6 text-blue-300" />
                  <h2 className="text-2xl font-semibold mb-4">Waiting for Try-On</h2>
                  <p className="text-blue-200 text-lg">
                    Scan the QR code with your phone to start the virtual try-on process
                  </p>
                </div>
              </div>
            )}
          </div>

          {/* Session Info & QR Code */}
          <div className="space-y-6">
            {/* Session Info */}
            <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-6">
              <h3 className="text-xl font-semibold mb-4">Session Info</h3>
              <div className="space-y-4">
                <div>
                  <label className="text-blue-200 text-sm">Session ID</label>
                  <p className="text-4xl font-mono font-bold text-center py-4 px-6 bg-black/20 rounded-lg border-2 border-blue-400">
                    {sessionId}
                  </p>
                  <p className="text-xs text-blue-300 text-center mt-2">
                    Enter this code on your mobile device
                  </p>
                </div>
                <div>
                  <label className="text-blue-200 text-sm">Status</label>
                  <p className={`font-medium ${
                    !isConnected ? 'text-red-300' : 
                    mobileConnected ? 'text-green-300' : 'text-yellow-300'
                  }`}>
                    {!isConnected ? 'Server Offline' : 
                     mobileConnected ? 'Mobile Connected' : 'Ready for Mobile'}
                  </p>
                </div>
              </div>
            </div>

            {/* QR Code */}
            {showQR && (
              <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-6">
                <h3 className="text-xl font-semibold mb-4">Mobile Access</h3>
                <div className="bg-white p-4 rounded-lg">
                  <QRCode
                    value={mobileUrl}
                    size={200}
                    style={{ height: "auto", maxWidth: "100%", width: "100%" }}
                  />
                </div>
                <p className="text-blue-200 text-sm mt-4 text-center">
                  Scan with your phone camera
                </p>
              </div>
            )}

            {/* Instructions */}
            <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-6">
              <h3 className="text-xl font-semibold mb-4">How to Use</h3>
              <div className="space-y-3 text-blue-200">
                <div className="flex items-start">
                  <div className="bg-blue-500 rounded-full w-6 h-6 flex items-center justify-center text-sm font-bold mr-3 mt-0.5">1</div>
                  <p>Go to /mobile on your phone or scan QR code</p>
                </div>
                <div className="flex items-start">
                  <div className="bg-blue-500 rounded-full w-6 h-6 flex items-center justify-center text-sm font-bold mr-3 mt-0.5">2</div>
                  <p>Enter the Session ID shown above</p>
                </div>
                <div className="flex items-start">
                  <div className="bg-blue-500 rounded-full w-6 h-6 flex items-center justify-center text-sm font-bold mr-3 mt-0.5">3</div>
                  <p>Take a photo and select clothing</p>
                </div>
                <div className="flex items-start">
                  <div className="bg-blue-500 rounded-full w-6 h-6 flex items-center justify-center text-sm font-bold mr-3 mt-0.5">4</div>
                  <p>View results on this screen</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
    </>
  );
};

export default DisplayScreen;