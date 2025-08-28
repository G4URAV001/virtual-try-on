import React from 'react';
import { Smartphone, Monitor, Shirt, LogOut, User } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

const LandingPage: React.FC = () => {
  const navigate = useNavigate();
  const { user, logout } = useAuth();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50 flex items-center justify-center p-4">
      <div className="max-w-4xl w-full">
        {/* Header with User Info */}
        <div className="flex justify-between items-center mb-8">
          <div className="flex items-center">
            <User className="h-8 w-8 text-gray-600 mr-3" />
            <div>
              <p className="text-sm text-gray-500">Welcome back,</p>
              <p className="font-semibold text-gray-800">{user?.username}</p>
            </div>
          </div>
          <button
            onClick={handleLogout}
            className="flex items-center bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded-lg transition-colors"
          >
            <LogOut className="h-4 w-4 mr-2" />
            Logout
          </button>
        </div>

        {/* Main Header */}
        <div className="text-center mb-12">
          <div className="bg-gradient-to-r from-blue-500 to-purple-500 rounded-full p-4 w-fit mx-auto mb-6">
            <Shirt className="h-12 w-12 text-white" />
          </div>
          <h1 className="text-4xl md:text-6xl font-bold text-gray-800 mb-4">
            Virtual Try-On
          </h1>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto">
            Experience the future of fashion with AI-powered virtual try-on technology. 
            Choose your device type to get started.
          </p>
        </div>

        {/* Device Selection */}
        <div className="grid md:grid-cols-2 gap-8 max-w-3xl mx-auto">
          {/* Mobile Interface */}
          <div 
            onClick={() => navigate('/mobile')}
            className="bg-white rounded-2xl shadow-xl p-8 text-center cursor-pointer transform transition-all duration-300 hover:scale-105 hover:shadow-2xl border-2 border-transparent hover:border-blue-200"
          >
            <div className="bg-gradient-to-r from-green-500 to-blue-500 rounded-full p-4 w-fit mx-auto mb-6">
              <Smartphone className="h-12 w-12 text-white" />
            </div>
            <h2 className="text-2xl font-bold text-gray-800 mb-4">Mobile Interface</h2>
            <p className="text-gray-600 mb-6">
              Take photos, select clothing, and process virtual try-ons on your smartphone or tablet.
            </p>
            <div className="space-y-2 text-sm text-gray-500">
              <div className="flex items-center justify-center">
                <div className="w-2 h-2 bg-green-500 rounded-full mr-2"></div>
                <span>Camera access</span>
              </div>
              <div className="flex items-center justify-center">
                <div className="w-2 h-2 bg-green-500 rounded-full mr-2"></div>
                <span>Touch-friendly interface</span>
              </div>
              <div className="flex items-center justify-center">
                <div className="w-2 h-2 bg-green-500 rounded-full mr-2"></div>
                <span>Clothing selection</span>
              </div>
            </div>
            <button className="mt-6 bg-gradient-to-r from-green-500 to-blue-500 text-white px-6 py-3 rounded-lg font-semibold hover:from-green-600 hover:to-blue-600 transition-all duration-200">
              Open Mobile Interface
            </button>
          </div>

          {/* Display Screen */}
          <div 
            onClick={() => navigate('/display')}
            className="bg-white rounded-2xl shadow-xl p-8 text-center cursor-pointer transform transition-all duration-300 hover:scale-105 hover:shadow-2xl border-2 border-transparent hover:border-purple-200"
          >
            <div className="bg-gradient-to-r from-purple-500 to-pink-500 rounded-full p-4 w-fit mx-auto mb-6">
              <Monitor className="h-12 w-12 text-white" />
            </div>
            <h2 className="text-2xl font-bold text-gray-800 mb-4">Display Screen</h2>
            <p className="text-gray-600 mb-6">
              View virtual try-on results on a large screen like TV, laptop, or desktop monitor.
            </p>
            <div className="space-y-2 text-sm text-gray-500">
              <div className="flex items-center justify-center">
                <div className="w-2 h-2 bg-purple-500 rounded-full mr-2"></div>
                <span>QR code pairing</span>
              </div>
              <div className="flex items-center justify-center">
                <div className="w-2 h-2 bg-purple-500 rounded-full mr-2"></div>
                <span>Real-time results</span>
              </div>
              <div className="flex items-center justify-center">
                <div className="w-2 h-2 bg-purple-500 rounded-full mr-2"></div>
                <span>Large screen optimized</span>
              </div>
            </div>
            <button className="mt-6 bg-gradient-to-r from-purple-500 to-pink-500 text-white px-6 py-3 rounded-lg font-semibold hover:from-purple-600 hover:to-pink-600 transition-all duration-200">
              Open Display Screen
            </button>
          </div>
        </div>

        {/* How it Works */}
        <div className="mt-16 bg-white rounded-2xl shadow-lg p-8">
          <h3 className="text-2xl font-bold text-gray-800 text-center mb-8">How It Works</h3>
          <div className="grid md:grid-cols-4 gap-6">
            <div className="text-center">
              <div className="bg-blue-100 rounded-full w-12 h-12 flex items-center justify-center mx-auto mb-4">
                <span className="text-blue-600 font-bold">1</span>
              </div>
              <h4 className="font-semibold text-gray-800 mb-2">Choose Device</h4>
              <p className="text-sm text-gray-600">Select mobile interface to take photos or display screen to view results</p>
            </div>
            <div className="text-center">
              <div className="bg-green-100 rounded-full w-12 h-12 flex items-center justify-center mx-auto mb-4">
                <span className="text-green-600 font-bold">2</span>
              </div>
              <h4 className="font-semibold text-gray-800 mb-2">Take Photo</h4>
              <p className="text-sm text-gray-600">Use your phone camera to capture a photo of yourself</p>
            </div>
            <div className="text-center">
              <div className="bg-purple-100 rounded-full w-12 h-12 flex items-center justify-center mx-auto mb-4">
                <span className="text-purple-600 font-bold">3</span>
              </div>
              <h4 className="font-semibold text-gray-800 mb-2">Select Clothing</h4>
              <p className="text-sm text-gray-600">Choose from our catalog or upload your own clothing images</p>
            </div>
            <div className="text-center">
              <div className="bg-pink-100 rounded-full w-12 h-12 flex items-center justify-center mx-auto mb-4">
                <span className="text-pink-600 font-bold">4</span>
              </div>
              <h4 className="font-semibold text-gray-800 mb-2">View Results</h4>
              <p className="text-sm text-gray-600">See your virtual try-on results instantly on any connected screen</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LandingPage;
