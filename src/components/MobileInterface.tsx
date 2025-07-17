import React, { useState, useEffect } from 'react';
import { Shirt, Loader2, CheckCircle, AlertCircle } from 'lucide-react';
import CameraInput from './CameraInput';
import ClothSelector from './ClothSelector';
import TryOnResult from './TryOnResult';
import QRScanner from './QRScanner';
import { useSocket } from '../contexts/SocketContext';
import { useSession } from '../contexts/SessionContext';
import { performTryOn } from '../services/fashionApi';

export interface ClothingItem {
  id: string;
  name: string;
  image: string;
  category: string;
}

type Step = 'qr-scan' | 'camera' | 'clothing' | 'processing' | 'result';

const MobileInterface: React.FC = () => {
  const [currentStep, setCurrentStep] = useState<Step>('qr-scan');
  const [userImage, setUserImage] = useState<string | null>(null);
  const [selectedClothing, setSelectedClothing] = useState<ClothingItem | null>(null);
  const [clothingImage, setClothingImage] = useState<string | null>(null);
  const [resultImage, setResultImage] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const { socket, isConnected, connectToSession } = useSocket();
  const { sessionId, joinSession } = useSession();

  // Check for URL session parameter on page load
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const urlSessionId = urlParams.get('session');
    
    if (urlSessionId && urlSessionId !== sessionId) {
      console.log('📱 [MobileInterface] Using URL session:', urlSessionId);
      console.log('📱 [MobileInterface] Current sessionId before join:', sessionId);
      joinSession(urlSessionId);
      connectToSession(urlSessionId);
      setCurrentStep('camera'); // Skip QR scanning if session is in URL
      setError(null);
      console.log('📱 [MobileInterface] Connected to session, skipping QR step');
    } else if (!urlSessionId && !sessionId) {
      console.log('📱 [MobileInterface] No URL session, starting with QR scan');
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // Run only once on mount

  const handleQRScanned = (scannedSessionId: string) => {
    console.log('📱 QR Scanned! Session ID:', scannedSessionId);
    // Update the session context with the scanned session ID
    joinSession(scannedSessionId);
    // Connect to WebSocket with the scanned session ID
    connectToSession(scannedSessionId);
    setCurrentStep('camera');
    setError(null);
  };

  const handleImageCapture = (imageDataUrl: string) => {
    setUserImage(imageDataUrl);
    setCurrentStep('clothing');
    setError(null);
  };

  const handleClothingSelect = (item: ClothingItem) => {
    setSelectedClothing(item);
    setError(null);
  };

  const handleClothingUpload = (imageDataUrl: string) => {
    setClothingImage(imageDataUrl);
    setSelectedClothing({
      id: 'custom',
      name: 'Custom Upload',
      image: imageDataUrl,
      category: 'uploaded'
    });
    setError(null);
  };

  const handleTryOn = async () => {
    if (!userImage || (!selectedClothing && !clothingImage)) {
      setError('Please capture a photo and select clothing first');
      return;
    }

    setIsProcessing(true);
    setCurrentStep('processing');
    setError(null);

    try {
      const clothingImageToUse = clothingImage || selectedClothing!.image;
      const result = await performTryOn(userImage, clothingImageToUse);
      
      setResultImage(result.image);
      setCurrentStep('result');

      // Send result to display via Socket.IO
      if (socket && sessionId) {
        const resultData = {
          sessionId: sessionId,
          result: result.image,
          timestamp: new Date().toISOString()
        };
        
        console.log('📤 Sending try-on result to session:', sessionId);
        console.log('📤 Full result data:', resultData);
        console.log('📤 Image data length:', result.image?.length || 0);
        console.log('📤 Image data preview:', result.image?.substring(0, 100) + '...');
        
        socket.emit('try-on-result', resultData);
        
        // Also log to verify the emit worked
        console.log('✅ Try-on result emitted to server');
      } else {
        console.warn('⚠️ Cannot send result: no socket or session ID');
        console.warn('⚠️ Socket exists:', !!socket);
        console.warn('⚠️ Session ID exists:', !!sessionId);
        console.warn('⚠️ Session ID value:', sessionId);
      }
    } catch (error) {
      console.error('Try-on failed:', error);
      setError('Virtual try-on failed. Please try again.');
      setCurrentStep('clothing');
    } finally {
      setIsProcessing(false);
    }
  };

  const resetProcess = () => {
    setCurrentStep('qr-scan');
    setUserImage(null);
    setSelectedClothing(null);
    setClothingImage(null);
    setResultImage(null);
    setError(null);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-purple-50 p-4">
      <div className="max-w-md mx-auto">
        <div className="bg-white rounded-2xl shadow-xl p-6 mb-6">
          <div className="flex items-center justify-center mb-6">
            <div className="bg-gradient-to-r from-blue-500 to-purple-500 rounded-full p-3">
              <Shirt className="h-8 w-8 text-white" />
            </div>
            <h1 className="text-2xl font-bold text-gray-800 ml-3">Virtual Try-On</h1>
          </div>

          {/* Progress Steps */}
          <div className="flex justify-between mb-8">
            {['qr-scan', 'camera', 'clothing', 'processing', 'result'].map((step, index) => (
              <div key={step} className="flex flex-col items-center">
                <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
                  currentStep === step ? 'bg-blue-500 text-white' : 
                  ['qr-scan', 'camera', 'clothing', 'processing', 'result'].indexOf(currentStep) > index 
                    ? 'bg-green-500 text-white' : 'bg-gray-200 text-gray-500'
                }`}>
                  {['qr-scan', 'camera', 'clothing', 'processing', 'result'].indexOf(currentStep) > index ? 
                    <CheckCircle className="h-4 w-4" /> : index + 1
                  }
                </div>
                <span className="text-xs mt-1 text-gray-600 capitalize">{
                  step === 'qr-scan' ? 'Connect' : step
                }</span>
              </div>
            ))}
          </div>

          {error && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6 flex items-center">
              <AlertCircle className="h-5 w-5 text-red-500 mr-3" />
              <span className="text-red-700">{error}</span>
            </div>
          )}

          {/* Step Content */}
          {currentStep === 'qr-scan' && (
            <QRScanner 
              onQRScanned={handleQRScanned} 
              isConnected={isConnected} 
              connectedSessionId={sessionId || undefined}
            />
          )}

          {currentStep === 'camera' && (
            <CameraInput onImageCapture={handleImageCapture} />
          )}

          {currentStep === 'clothing' && (
            <ClothSelector 
              onClothingSelect={handleClothingSelect}
              onClothingUpload={handleClothingUpload}
              selectedClothing={selectedClothing}
            />
          )}

          {currentStep === 'processing' && (
            <div className="text-center py-12">
              <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-blue-500 mx-auto mb-4"></div>
              <h3 className="text-lg font-semibold text-gray-800 mb-2">Processing Your Try-On</h3>
              <p className="text-gray-600">This may take a few moments...</p>
            </div>
          )}

          {currentStep === 'result' && resultImage && (
            <TryOnResult 
              resultImage={resultImage}
              onReset={resetProcess}
              sessionId={sessionId || 'no-session'}
            />
          )}

          {/* Action Buttons */}
          {currentStep === 'clothing' && selectedClothing && (
            <button
              onClick={handleTryOn}
              disabled={isProcessing}
              className="w-full bg-gradient-to-r from-blue-500 to-purple-500 text-white py-3 rounded-lg font-semibold hover:from-blue-600 hover:to-purple-600 transition-all duration-200 disabled:opacity-50"
            >
              {isProcessing ? (
                <>
                  <Loader2 className="h-5 w-5 animate-spin inline mr-2" />
                  Processing...
                </>
              ) : (
                'Try On Virtual Outfit'
              )}
            </button>
          )}
        </div>

        {/* Session Info */}
        {sessionId && (
          <div className="bg-white rounded-lg shadow-md p-4 text-center">
            <p className="text-sm text-gray-600 mb-2">Connected to Session</p>
            <p className="text-2xl font-mono font-bold text-blue-600 bg-blue-50 py-2 px-4 rounded-lg">
              {sessionId}
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default MobileInterface;