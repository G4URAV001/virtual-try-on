import React, { useState, useEffect } from 'react';
import { Shirt, User, Lock, Eye, EyeOff, AlertCircle } from 'lucide-react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

const LoginPage: React.FC = () => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();
  const { login, isAuthenticated } = useAuth();

  // // Hardcoded credentials for demo purposes
  // const DEMO_CREDENTIALS = {
  //   username: 'admin',
  //   password: 'virtual123'
  // };

  // Redirect if already authenticated
  useEffect(() => {
    if (isAuthenticated) {
      const from = (location.state as { from?: { pathname: string } })?.from?.pathname || '/landing';
      navigate(from, { replace: true });
    }
  }, [isAuthenticated, navigate, location]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);

    try {
      const success = await login(username, password);
      
      if (success) {
        const from = (location.state as { from?: { pathname: string } })?.from?.pathname || '/landing';
        navigate(from, { replace: true });
      } else {
        setError('Invalid username or password. Please try again.');
      }
    } catch (err) {
      console.error('Login error:', err);
      setError('Login failed. Please try again.');
    }
    
    setIsLoading(false);
  };

  const togglePasswordVisibility = () => {
    setShowPassword(!showPassword);
  };

  // const fillDemoCredentials = () => {
  //   setUsername(DEMO_CREDENTIALS.username);
  //   setPassword(DEMO_CREDENTIALS.password);
  //   setError(null);
  // };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-900 via-purple-900 to-indigo-900 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-gray-900 opacity-30"></div>
      
      <div className="w-full max-w-md relative z-10">
        {/* Logo Section */}
        <div className="text-center mb-8">
          <div className="bg-gradient-to-r from-blue-500 to-purple-500 rounded-full p-4 w-fit mx-auto mb-6 shadow-2xl">
            <Shirt className="h-12 w-12 text-white" />
          </div>
          <h1 className="text-4xl font-bold text-white mb-2">Virtual Try-On</h1>
          <p className="text-blue-200">Experience the future of fashion</p>
        </div>

        {/* Login Form */}
        <div className="bg-white/10 backdrop-blur-md rounded-2xl p-8 shadow-2xl border border-white/20">
          <form onSubmit={handleLogin} className="space-y-6">
            <div>
              <h2 className="text-2xl font-bold text-white text-center mb-6">Sign In</h2>
            </div>

            {/* Demo Credentials Banner */}
            {/* <div className="bg-gradient-to-r from-green-500/20 to-blue-500/20 border border-green-400/30 rounded-lg p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-green-200 text-sm font-medium mb-1">Demo Credentials</p>
                  <p className="text-white text-xs">Username: {DEMO_CREDENTIALS.username}</p>
                  <p className="text-white text-xs">Password: {DEMO_CREDENTIALS.password}</p>
                </div>
                <button
                  type="button"
                  onClick={fillDemoCredentials}
                  className="bg-green-500/30 hover:bg-green-500/40 text-green-200 px-3 py-1 rounded-md text-xs transition-colors"
                >
                  Auto Fill
                </button>
              </div>
            </div> */}

            {error && (
              <div className="bg-red-500/20 border border-red-400/30 rounded-lg p-4 flex items-center">
                <AlertCircle className="h-5 w-5 text-red-400 mr-3" />
                <span className="text-red-200 text-sm">{error}</span>
              </div>
            )}

            {/* Username Field */}
            <div>
              <label htmlFor="username" className="block text-white text-sm font-medium mb-2">
                Username
              </label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-blue-300" />
                <input
                  id="username"
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 bg-white/10 border border-white/20 rounded-lg text-white placeholder-blue-200 focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-transparent transition-all"
                  placeholder="Enter your username"
                  required
                />
              </div>
            </div>

            {/* Password Field */}
            <div>
              <label htmlFor="password" className="block text-white text-sm font-medium mb-2">
                Password
              </label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-blue-300" />
                <input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full pl-10 pr-12 py-3 bg-white/10 border border-white/20 rounded-lg text-white placeholder-blue-200 focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-transparent transition-all"
                  placeholder="Enter your password"
                  required
                />
                <button
                  type="button"
                  onClick={togglePasswordVisibility}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-blue-300 hover:text-white transition-colors"
                >
                  {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                </button>
              </div>
            </div>

            {/* Login Button */}
            <button
              type="submit"
              disabled={isLoading}
              className="w-full bg-gradient-to-r from-blue-500 to-purple-500 hover:from-blue-600 hover:to-purple-600 disabled:from-gray-500 disabled:to-gray-600 text-white font-semibold py-3 px-4 rounded-lg transition-all duration-200 transform hover:scale-[1.02] disabled:scale-100 disabled:cursor-not-allowed shadow-lg"
            >
              {isLoading ? (
                <div className="flex items-center justify-center">
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                  Signing In...
                </div>
              ) : (
                'Sign In'
              )}
            </button>

            {/* Additional Options */}
            <div className="text-center space-y-2">
              <p className="text-blue-200 text-sm">
                New to Virtual Try-On?{' '}
                <span className="text-blue-300 cursor-pointer hover:underline">
                  Contact Administrator
                </span>
              </p>
              <p className="text-blue-300 text-xs cursor-pointer hover:underline">
                Forgot your password?
              </p>
            </div>
          </form>
        </div>

        {/* Footer */}
        <div className="text-center mt-8">
          <p className="text-blue-300 text-sm">
            Virtual Try-On System.
          </p>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;
