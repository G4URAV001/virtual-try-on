import React, { useState, useRef, useEffect } from 'react';
import { QrCode, Camera, Check, AlertCircle, Wifi } from 'lucide-react';
import QrScanner from 'qr-scanner';

interface QRScannerProps {
  onQRScanned: (sessionId: string) => void;
  isConnected: boolean;
  connectedSessionId?: string;
  onContinue?: () => void;
}

const QRScanner: React.FC<QRScannerProps> = ({ onQRScanned, isConnected, connectedSessionId, onContinue }) => {
  const [isScanning, setIsScanning] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [manualSessionId, setManualSessionId] = useState('');
  const [hasCamera, setHasCamera] = useState(false);
  const [cameraActive, setCameraActive] = useState(false);
  const [useFallbackCamera, setUseFallbackCamera] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const qrScannerRef = useRef<QrScanner | null>(null);

  // Check camera availability on component mount
  useEffect(() => {
    QrScanner.hasCamera().then(hasCamera => {
      setHasCamera(hasCamera);
      console.log('📱 Camera available:', hasCamera);
    }).catch(err => {
      console.error('❌ Camera check failed:', err);
      setHasCamera(false);
    });

    return () => {
      // Cleanup scanner on unmount
      const scanner = qrScannerRef.current;
      if (scanner) {
        scanner.stop();
        scanner.destroy();
      }
    };
  }, []);

  // Extract session ID from URL or direct session ID
  const extractSessionFromUrl = (data: string): string | null => {
    try {
      console.log('🔍 Analyzing QR code data:', data);
      
      // If it's already just a session ID (8 characters, alphanumeric)
      if (/^[A-Z0-9]{8}$/i.test(data.trim())) {
        console.log('✅ Direct session ID detected:', data.trim());
        return data.trim().toUpperCase();
      }
      
      // If it's a URL, extract session parameter
      if (data.includes('http') || data.includes('mobile?session=')) {
        const urlObj = new URL(data);
        const sessionParam = urlObj.searchParams.get('session');
        if (sessionParam) {
          console.log('✅ Session extracted from URL:', sessionParam);
          return sessionParam.toUpperCase();
        }
      }
      
      // Try to find session pattern in string (fallback)
      const sessionMatch = data.match(/session=([A-Z0-9]{8})/i);
      if (sessionMatch) {
        console.log('✅ Session found via pattern match:', sessionMatch[1]);
        return sessionMatch[1].toUpperCase();
      }
      
      console.log('❌ No session ID found in data');
      return null;
    } catch (err) {
      console.error('❌ Session extraction failed:', err);
      return null;
    }
  };

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setIsScanning(true);
    setError(null);

    try {
      console.log('📷 Processing QR code from uploaded file...');
      
      // Use QrScanner to scan the uploaded image
      const result = await QrScanner.scanImage(file, { returnDetailedScanResult: true });
      console.log('✅ QR scan successful:', result);
      
      // Extract session ID from the scanned URL
      const sessionId = extractSessionFromUrl(result.data);
      
      if (sessionId) {
        console.log('🎯 Session ID found:', sessionId);
        onQRScanned(sessionId);
      } else {
        console.log('❌ No session ID in QR code:', result.data);
        setError('QR code does not contain a valid session. Please scan a display screen QR code.');
      }
      
    } catch (err) {
      console.error('❌ QR scan failed:', err);
      setError('Could not read QR code from image. Please try a clearer image.');
    } finally {
      setIsScanning(false);
      // Reset file input
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const handleManualConnect = () => {
    if (manualSessionId.trim()) {
      console.log('📱 Manual connection with session ID:', manualSessionId.trim());
      onQRScanned(manualSessionId.trim());
    } else {
      setError('Please enter a session ID');
    }
  };

  const startCameraScanning = async () => {
    if (!hasCamera) {
      setError('No camera found. Please upload a QR code image or enter session ID manually.');
      return;
    }

    setIsScanning(true);
    setCameraActive(true);
    setError(null);

    try {
      console.log('📷 Starting camera QR scanner...');
      
      // Wait for video element to be ready with timeout
      await new Promise((resolve, reject) => {
        let attempts = 0;
        const maxAttempts = 20; // 2 seconds total
        
        const checkVideoReady = () => {
          attempts++;
          if (videoRef.current) {
            resolve(true);
          } else if (attempts >= maxAttempts) {
            reject(new Error('Video element not ready after timeout'));
          } else {
            setTimeout(checkVideoReady, 100);
          }
        };
        checkVideoReady();
      }).catch(() => {
        // If video element is not ready, we'll still try to proceed
        console.warn('⚠️ Video element readiness check timed out, proceeding anyway');
      });

      if (!videoRef.current) {
        throw new Error('Video element not available');
      }

      // Wait for video element to be in DOM and ready
      await new Promise((resolve) => {
        const video = videoRef.current!;
        let timeout: NodeJS.Timeout;
        
        const cleanup = () => {
          if (timeout) clearTimeout(timeout);
          video.removeEventListener('loadedmetadata', onReady);
          video.removeEventListener('canplay', onReady);
        };
        
        const onReady = () => {
          cleanup();
          resolve(true);
        };
        
        if (video.readyState >= 1) {
          resolve(true);
        } else {
          video.addEventListener('loadedmetadata', onReady);
          video.addEventListener('canplay', onReady);
          // Set a timeout to resolve anyway
          timeout = setTimeout(() => {
            cleanup();
            resolve(true);
          }, 1000);
        }
      });
      
      // Initialize QR scanner with better error handling
      const scanner = new QrScanner(
        videoRef.current,
        (result) => {
          console.log('✅ QR code scanned:', result);
          
          // Extract session ID from the scanned URL
          const sessionId = extractSessionFromUrl(result.data);
          
          if (sessionId) {
            console.log('🎯 Session ID found:', sessionId);
            onQRScanned(sessionId);
            stopCameraScanning();
          } else {
            console.log('❌ No session ID in QR code:', result.data);
            setError('QR code does not contain a valid session. Please scan a display screen QR code.');
          }
        },
        {
          returnDetailedScanResult: true,
          highlightScanRegion: true,
          highlightCodeOutline: true,
          preferredCamera: 'environment', // Use back camera on mobile
          maxScansPerSecond: 5, // Limit scan rate for performance
        }
      );

      qrScannerRef.current = scanner;
      
      // Start scanner with retry logic
      let retryCount = 0;
      const maxRetries = 3;
      
      const tryStart = async (): Promise<void> => {
        try {
          await scanner.start();
          console.log('📷 Camera started successfully');
        } catch (err) {
          retryCount++;
          if (retryCount < maxRetries) {
            console.log(`🔄 Retrying camera start (${retryCount}/${maxRetries})...`);
            await new Promise(resolve => setTimeout(resolve, 500));
            await tryStart();
          } else {
            throw err;
          }
        }
      };
      
      await tryStart();
      
    } catch (err) {
      console.error('❌ Camera start failed:', err);
      setError('Failed to start camera. Please use the "Take QR Photo" option below.');
      setCameraActive(false);
      setIsScanning(false);
      
      // Enable fallback camera option
      setUseFallbackCamera(true);
    }
  };

  const handleCameraFallback = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setIsScanning(true);
    setError(null);

    try {
      console.log('📷 Processing QR code from camera capture...');
      
      // Use QrScanner to scan the captured image
      QrScanner.scanImage(file, { returnDetailedScanResult: true })
        .then((result) => {
          console.log('✅ QR scan successful:', result);
          
          // Extract session ID from the scanned URL
          const sessionId = extractSessionFromUrl(result.data);
          
          if (sessionId) {
            console.log('🎯 Session ID found:', sessionId);
            onQRScanned(sessionId);
            setUseFallbackCamera(false);
          } else {
            console.log('❌ No session ID in QR code:', result.data);
            setError('QR code does not contain a valid session. Please scan a display screen QR code.');
          }
        })
        .catch((err) => {
          console.error('❌ QR scan failed:', err);
          setError('Could not read QR code from image. Please try a clearer image.');
        })
        .finally(() => {
          setIsScanning(false);
          // Reset file input
          if (cameraInputRef.current) {
            cameraInputRef.current.value = '';
          }
        });
      
    } catch (err) {
      console.error('❌ QR scan failed:', err);
      setError('Could not read QR code from image. Please try a clearer image.');
      setIsScanning(false);
    }
  };

  const stopCameraScanning = () => {
    console.log('🛑 Stopping camera scanner...');
    
    if (qrScannerRef.current) {
      qrScannerRef.current.stop();
      qrScannerRef.current = null;
    }
    
    setCameraActive(false);
    setIsScanning(false);
  };

  if (isConnected) {
    return (
      <div className="bg-green-50 border border-green-200 rounded-lg p-6 text-center">
        <div className="bg-green-100 rounded-full p-3 w-fit mx-auto mb-4">
          <Wifi className="h-8 w-8 text-green-600" />
        </div>
        <h3 className="text-lg font-semibold text-green-800 mb-2">Connected Successfully!</h3>
        <p className="text-green-600">You're connected to the display screen via WebSocket</p>
        {connectedSessionId && (
          <div className="mt-3 bg-green-100 rounded-lg p-3">
            <p className="text-green-800 text-sm font-medium">Session ID:</p>
            <p className="text-green-700 font-mono text-sm">{connectedSessionId.slice(0, 8)}...</p>
          </div>
        )}
        <div className="flex items-center justify-center mt-4">
          <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse mr-2"></div>
          <span className="text-green-700 text-sm">Live connection active</span>
        </div>
        
        {/* Continue Button */}
        <button
          onClick={onContinue}
          className="mt-6 w-full bg-blue-500 hover:bg-blue-600 text-white font-medium py-3 px-4 rounded-lg transition-colors flex items-center justify-center"
        >
          <Camera className="h-5 w-5 mr-2" />
          Continue to Camera
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="text-center">
        <div className="bg-blue-100 rounded-full p-4 w-fit mx-auto mb-4">
          <QrCode className="h-8 w-8 text-blue-600" />
        </div>
        <h2 className="text-xl font-semibold text-gray-800 mb-2">Scan QR Code</h2>
        <p className="text-gray-600">Scan the QR code from the display screen to connect</p>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 flex items-center">
          <AlertCircle className="h-5 w-5 text-red-500 mr-3 flex-shrink-0" />
          <span className="text-red-700">{error}</span>
        </div>
      )}

      {/* Camera Scanning */}
      <div className="space-y-4">
        {/* Camera Preview */}
        {cameraActive && (
          <div className="relative bg-black rounded-lg overflow-hidden">
            <video
              ref={videoRef}
              className="w-full h-64 object-cover"
              playsInline
              muted
              onLoadedMetadata={() => {
                console.log('📷 Video metadata loaded');
              }}
              onCanPlay={() => {
                console.log('📷 Video can play');
              }}
            />
            <div className="absolute top-2 right-2">
              <button
                onClick={stopCameraScanning}
                className="bg-red-500 text-white px-3 py-1 rounded-lg text-sm hover:bg-red-600"
              >
                Stop Camera
              </button>
            </div>
            <div className="absolute bottom-2 left-2 bg-black/50 text-white px-2 py-1 rounded text-xs">
              Point camera at QR code
            </div>
          </div>
        )}

        {/* Always render video element but hidden when not active */}
        {!cameraActive && (
          <video
            ref={videoRef}
            className="hidden"
            playsInline
            muted
          />
        )}

        <button
          onClick={cameraActive ? stopCameraScanning : startCameraScanning}
          disabled={isScanning && !cameraActive || !hasCamera}
          className="w-full bg-gradient-to-r from-blue-500 to-purple-500 text-white py-4 rounded-lg font-semibold hover:from-blue-600 hover:to-purple-600 transition-all duration-200 disabled:opacity-50 flex items-center justify-center"
        >
          {isScanning && !cameraActive ? (
            <>
              <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
              Starting Camera...
            </>
          ) : cameraActive ? (
            <>
              <Camera className="h-5 w-5 mr-2" />
              Stop Camera
            </>
          ) : (
            <>
              <Camera className="h-5 w-5 mr-2" />
              {hasCamera ? 'Scan with Camera' : 'No Camera Available'}
            </>
          )}
        </button>

        {/* Fallback Camera Button - appears after camera fails */}
        {useFallbackCamera && (
          <>
            <input
              ref={cameraInputRef}
              type="file"
              accept="image/*"
              capture="environment"
              onChange={handleCameraFallback}
              className="hidden"
              disabled={isScanning}
            />
            <button
              onClick={() => cameraInputRef.current?.click()}
              disabled={isScanning}
              className="w-full bg-green-500 text-white py-3 rounded-lg font-medium hover:bg-green-600 transition-colors disabled:opacity-50 flex items-center justify-center"
            >
              {isScanning ? (
                <>
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                  Processing QR...
                </>
              ) : (
                <>
                  <Camera className="h-5 w-5 mr-2" />
                  Take QR Photo
                </>
              )}
            </button>
          </>
        )}

        <div className="flex items-center justify-center">
          <div className="flex-1 border-t border-gray-300"></div>
          <span className="px-4 text-gray-500 text-sm">or</span>
          <div className="flex-1 border-t border-gray-300"></div>
        </div>

        {/* Upload QR Image */}
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          onChange={handleFileUpload}
          className="hidden"
          disabled={isScanning}
        />
        
        <button
          onClick={() => fileInputRef.current?.click()}
          disabled={isScanning}
          className="w-full bg-gray-100 text-gray-700 py-3 rounded-lg font-medium hover:bg-gray-200 transition-colors disabled:opacity-50 flex items-center justify-center"
        >
          {isScanning ? (
            <>
              <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-gray-500 mr-2"></div>
              Processing QR Image...
            </>
          ) : (
            <>
              <QrCode className="h-5 w-5 mr-2" />
              Upload QR Image
            </>
          )}
        </button>

        <div className="flex items-center justify-center">
          <div className="flex-1 border-t border-gray-300"></div>
          <span className="px-4 text-gray-500 text-sm">or</span>
          <div className="flex-1 border-t border-gray-300"></div>
        </div>

        {/* Manual Session ID Entry */}
        <div className="space-y-3">
          <label className="block text-sm font-medium text-gray-700">
            Session ID from Display Screen
          </label>
          <input
            type="text"
            placeholder="Enter the Session ID shown on display"
            value={manualSessionId}
            onChange={(e) => setManualSessionId(e.target.value.toUpperCase())}
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent font-mono text-center text-lg"
            maxLength={8}
          />
          <div className="text-sm text-gray-500 text-center">
            Look for the large code on the display screen
          </div>
          <button
            onClick={handleManualConnect}
            className="w-full bg-green-500 text-white py-3 rounded-lg font-medium hover:bg-green-600 transition-colors flex items-center justify-center"
          >
            <Check className="h-5 w-5 mr-2" />
            Connect to Session: {manualSessionId || 'Enter ID'}
          </button>
        </div>
      </div>

      {/* Instructions */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <h4 className="font-semibold text-blue-800 mb-2">How to Connect:</h4>
        <div className="space-y-2 text-blue-700 text-sm">
          <div className="flex items-start">
            <div className="bg-blue-500 rounded-full w-5 h-5 flex items-center justify-center text-xs font-bold text-white mr-2 mt-0.5">1</div>
            <p>Open display screen: <code>localhost:5173/display</code></p>
          </div>
          <div className="flex items-start">
            <div className="bg-blue-500 rounded-full w-5 h-5 flex items-center justify-center text-xs font-bold text-white mr-2 mt-0.5">2</div>
            <p><strong>Camera:</strong> Point at QR code on screen</p>
          </div>
          <div className="flex items-start">
            <div className="bg-blue-500 rounded-full w-5 h-5 flex items-center justify-center text-xs font-bold text-white mr-2 mt-0.5">3</div>
            <p><strong>Upload:</strong> Take screenshot of QR and upload</p>
          </div>
          <div className="flex items-start">
            <div className="bg-blue-500 rounded-full w-5 h-5 flex items-center justify-center text-xs font-bold text-white mr-2 mt-0.5">4</div>
            <p><strong>Manual:</strong> Type the 8-character session code</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default QRScanner;
