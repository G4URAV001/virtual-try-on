import React, { useState } from 'react';
import { Download, Share, RotateCcw, Monitor, Copy, Check } from 'lucide-react';

interface TryOnResultProps {
  resultImage: string;
  onReset: () => void;
  sessionId: string;
  onTryAnotherOutfit?: () => void;
}

const TryOnResult: React.FC<TryOnResultProps> = ({ resultImage, onReset, sessionId, onTryAnotherOutfit }) => {
  const [copied, setCopied] = useState(false);

  const handleDownload = () => {
    const link = document.createElement('a');
    link.href = resultImage;
    link.download = `virtual-tryon-${Date.now()}.jpg`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: 'Virtual Try-On Result',
          text: 'Check out my virtual try-on result!',
          url: window.location.href
        });
      } catch (error) {
        console.log('Share failed:', error);
      }
    } else {
      // Fallback for browsers without Web Share API
      navigator.clipboard.writeText(window.location.href);
      alert('Link copied to clipboard!');
    }
  };

  const copyDisplayUrl = () => {
    const displayUrl = `${window.location.origin}/display?session=${sessionId}`;
    navigator.clipboard.writeText(displayUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="space-y-6">
      <div className="text-center">
        <h2 className="text-xl font-semibold text-gray-800 mb-2">Your Virtual Try-On</h2>
        <p className="text-gray-600">Here's how you look in the selected outfit</p>
      </div>

      <div className="relative">
        <img
          src={resultImage}
          alt="Virtual try-on result"
          className="w-full h-64 object-cover rounded-lg border border-gray-200 shadow-md"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/10 to-transparent rounded-lg" />
      </div>

      {/* Display URL sharing */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <div className="flex items-center mb-2">
          <Monitor className="h-5 w-5 text-blue-500 mr-2" />
          <span className="text-blue-800 font-medium">View on Large Screen</span>
        </div>
        <p className="text-blue-600 text-sm mb-3">
          Copy this URL to view the result on a TV or laptop
        </p>
        <div className="flex items-center space-x-2">
          <code className="flex-1 bg-white border border-blue-200 rounded px-3 py-2 text-sm text-gray-700 overflow-hidden">
            {`${window.location.origin}/display?session=${sessionId}`}
          </code>
          <button
            onClick={copyDisplayUrl}
            className="bg-blue-500 text-white px-3 py-2 rounded hover:bg-blue-600 transition-colors flex items-center"
          >
            {copied ? (
              <Check className="h-4 w-4" />
            ) : (
              <Copy className="h-4 w-4" />
            )}
          </button>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="grid grid-cols-2 gap-3">
        <button
          onClick={handleDownload}
          className="bg-green-500 text-white py-3 rounded-lg font-medium hover:bg-green-600 transition-colors flex items-center justify-center"
        >
          <Download className="h-5 w-5 mr-2" />
          Download
        </button>
        <button
          onClick={handleShare}
          className="bg-blue-500 text-white py-3 rounded-lg font-medium hover:bg-blue-600 transition-colors flex items-center justify-center"
        >
          <Share className="h-5 w-5 mr-2" />
          Share
        </button>
      </div>

      {/* Try Another Outfit Button */}
      <button
        onClick={onTryAnotherOutfit || onReset}
        className="w-full bg-purple-500 text-white py-3 rounded-lg font-medium hover:bg-purple-600 transition-colors flex items-center justify-center"
      >
        <RotateCcw className="h-5 w-5 mr-2" />
        Try Another Outfit
      </button>

      {/* Start Over Button */}
      <button
        onClick={onReset}
        className="w-full bg-gray-100 text-gray-700 py-3 rounded-lg font-medium hover:bg-gray-200 transition-colors flex items-center justify-center"
      >
        <RotateCcw className="h-5 w-5 mr-2" />
        Start Over (New Photo)
      </button>
    </div>
  );
};

export default TryOnResult;