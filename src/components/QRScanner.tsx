import React, { useState, useRef } from 'react';
import { QrCode, Camera, Check, AlertCircle, Wifi } from 'lucide-react';

interface QRScannerProps {
  onQRScanned: (sessionId: string) => void;
  isConnected: boolean;
  connectedSessionId?: string;
}

const QRScanner: React.FC<QRScannerProps> = ({ onQRScanned, isConnected, connectedSessionId }) => {
  const [isScanning, setIsScanning] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [manualSessionId, setManualSessionId] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setIsScanning(true);
    setError(null);

    try {
      // Create an image element to load the QR code image
      const img = new Image();
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');

      img.onload = () => {
        canvas.width = img.width;
        canvas.height = img.height;
        ctx?.drawImage(img, 0, 0);

        // Try to extract URL from QR code image
        // For demo purposes, we'll simulate QR code reading
        setTimeout(() => {
          try {
            // Simulate extracting session ID from QR code
            // In a real implementation, you'd use a QR code library here
            const mockSessionId = generateMockSessionId();
            onQRScanned(mockSessionId);
          } catch (err) {
            setError('Could not read QR code. Please try again.');
          } finally {
            setIsScanning(false);
          }
        }, 1500);
      };

      img.onerror = () => {
        setError('Invalid image file');
        setIsScanning(false);
      };

      // Convert file to data URL
      const reader = new FileReader();
      reader.onload = (e) => {
        img.src = e.target?.result as string;
      };
      reader.readAsDataURL(file);
    } catch (err) {
      setError('Failed to process QR code');
      setIsScanning(false);
    }
  };

  const generateMockSessionId = () => {
    // Generate a UUID-like session ID that matches the display screen format
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
      const r = Math.random() * 16 | 0;
      const v = c == 'x' ? r : (r & 0x3 | 0x8);
      return v.toString(16);
    });
  };

  const handleManualConnect = () => {
    if (manualSessionId.trim()) {
      console.log('📱 Manual connection with session ID:', manualSessionId.trim());
      onQRScanned(manualSessionId.trim());
    } else {
      setError('Please enter a session ID');
    }
  };

  const startCameraScanning = () => {
    // For demo purposes, simulate camera scanning
    setIsScanning(true);
    setError(null);
    
    setTimeout(() => {
      const mockSessionId = generateMockSessionId();
      console.log('📱 Camera scan simulated, generated session ID:', mockSessionId);
      onQRScanned(mockSessionId);
      setIsScanning(false);
    }, 2000);
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
        <button
          onClick={startCameraScanning}
          disabled={isScanning}
          className="w-full bg-gradient-to-r from-blue-500 to-purple-500 text-white py-4 rounded-lg font-semibold hover:from-blue-600 hover:to-purple-600 transition-all duration-200 disabled:opacity-50 flex items-center justify-center"
        >
          {isScanning ? (
            <>
              <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
              Scanning...
            </>
          ) : (
            <>
              <Camera className="h-5 w-5 mr-2" />
              Scan with Camera
            </>
          )}
        </button>

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
          <QrCode className="h-5 w-5 mr-2" />
          Upload QR Image
        </button>

        <div className="flex items-center justify-center">
          <div className="flex-1 border-t border-gray-300"></div>
          <span className="px-4 text-gray-500 text-sm">or</span>
          <div className="flex-1 border-t border-gray-300"></div>
        </div>

        {/* Manual Session ID Entry */}
        <div className="space-y-3">
          <label className="block text-sm font-medium text-gray-700">
            Session ID (get this from display screen)
          </label>
          <input
            type="text"
            placeholder="Enter Session ID manually (e.g. abc123...)"
            value={manualSessionId}
            onChange={(e) => setManualSessionId(e.target.value)}
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
          <div className="text-sm text-gray-500">
            💡 Tip: Copy the session ID from the display screen (shown as first 8 characters)
          </div>
          <button
            onClick={handleManualConnect}
            className="w-full bg-green-500 text-white py-3 rounded-lg font-medium hover:bg-green-600 transition-colors flex items-center justify-center"
          >
            <Check className="h-5 w-5 mr-2" />
            Connect to Session: {manualSessionId.slice(0, 8) || 'Enter ID'}
          </button>
        </div>
      </div>

      {/* Instructions */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <h4 className="font-semibold text-blue-800 mb-2">How to Connect:</h4>
        <div className="space-y-2 text-blue-700 text-sm">
          <div className="flex items-start">
            <div className="bg-blue-500 rounded-full w-5 h-5 flex items-center justify-center text-xs font-bold text-white mr-2 mt-0.5">1</div>
            <p>Open the display screen on a TV or laptop</p>
          </div>
          <div className="flex items-start">
            <div className="bg-blue-500 rounded-full w-5 h-5 flex items-center justify-center text-xs font-bold text-white mr-2 mt-0.5">2</div>
            <p>Find the QR code on the display screen</p>
          </div>
          <div className="flex items-start">
            <div className="bg-blue-500 rounded-full w-5 h-5 flex items-center justify-center text-xs font-bold text-white mr-2 mt-0.5">3</div>
            <p>Scan it with your phone camera or upload an image</p>
          </div>
          <div className="flex items-start">
            <div className="bg-blue-500 rounded-full w-5 h-5 flex items-center justify-center text-xs font-bold text-white mr-2 mt-0.5">4</div>
            <p>Start using the virtual try-on features</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default QRScanner;
