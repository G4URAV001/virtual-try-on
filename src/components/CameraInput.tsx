import React, { useRef, useState } from 'react';
import { Camera, Upload, RotateCw } from 'lucide-react';

interface CameraInputProps {
  onImageCapture: (imageDataUrl: string) => void;
}

const CameraInput: React.FC<CameraInputProps> = ({ onImageCapture }) => {
  const [previewImage, setPreviewImage] = useState<string | null>(null);
  const [isCapturing, setIsCapturing] = useState(false);
  const cameraInputRef = useRef<HTMLInputElement>(null);
  const galleryInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      setIsCapturing(true);
      const reader = new FileReader();
      reader.onload = (e) => {
        const imageDataUrl = e.target?.result as string;
        setPreviewImage(imageDataUrl);
        setIsCapturing(false);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleConfirm = () => {
    if (previewImage) {
      onImageCapture(previewImage);
    }
  };

  const handleRetake = () => {
    setPreviewImage(null);
    if (cameraInputRef.current) {
      cameraInputRef.current.value = '';
    }
  };

  return (
    <div className="space-y-4">
      <div className="text-center mb-6">
        <h2 className="text-xl font-semibold text-gray-800 mb-2">Take Your Photo</h2>
        <p className="text-gray-600">Stand in good lighting and face the camera</p>
      </div>

      {!previewImage ? (
        <div className="space-y-4">
          <div className="relative">
            {/* Camera input (for taking a photo) */}
            <input
              ref={cameraInputRef}
              type="file"
              accept="image/*"
              capture="environment"
              onChange={handleFileSelect}
              className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
              disabled={isCapturing}
            />
            <div className="bg-gray-100 border-2 border-dashed border-gray-300 rounded-lg p-12 text-center hover:border-blue-400 transition-colors">
              {isCapturing ? (
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
              ) : (
                <Camera className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              )}
              <p className="text-gray-600 font-medium">
                {isCapturing ? 'Processing image...' : 'Tap to take photo'}
              </p>
              <p className="text-sm text-gray-500 mt-2">
                Camera will open automatically
              </p>
            </div>
          </div>

          {/* Gallery input (for uploading from gallery) */}
          <input
            ref={galleryInputRef}
            type="file"
            accept="image/*"
            onChange={handleFileSelect}
            className="hidden"
            disabled={isCapturing}
          />

          <div className="flex items-center justify-center">
            <div className="flex-1 border-t border-gray-300"></div>
            <span className="px-4 text-gray-500 text-sm">or</span>
            <div className="flex-1 border-t border-gray-300"></div>
          </div>

          <button
            onClick={() => galleryInputRef.current?.click()}
            className="w-full bg-white border border-gray-300 text-gray-700 py-3 rounded-lg font-medium hover:bg-gray-50 transition-colors flex items-center justify-center"
          >
            <Upload className="h-5 w-5 mr-2" />
            Upload from Gallery
          </button>
        </div>
      ) : (
        <div className="space-y-4">
          <div className="relative">
            <img
              src={previewImage}
              alt="Preview"
              className="w-full h-64 object-cover rounded-lg border border-gray-200"
            />
          </div>

          <div className="flex space-x-3">
            <button
              onClick={handleRetake}
              className="flex-1 bg-gray-100 text-gray-700 py-3 rounded-lg font-medium hover:bg-gray-200 transition-colors flex items-center justify-center"
            >
              <RotateCw className="h-5 w-5 mr-2" />
              Retake
            </button>
            <button
              onClick={handleConfirm}
              className="flex-1 bg-gradient-to-r from-blue-500 to-purple-500 text-white py-3 rounded-lg font-medium hover:from-blue-600 hover:to-purple-600 transition-all duration-200"
            >
              Use This Photo
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default CameraInput;