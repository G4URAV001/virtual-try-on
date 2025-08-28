import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import LoginPage from './components/LoginPage';
import LandingPage from './components/LandingPage';
import MobileInterface from './components/MobileInterface';
import DisplayScreen from './components/DisplayScreen';
import ErrorBoundary from './components/ErrorBoundary';
import ProtectedRoute from './components/ProtectedRoute';
import { SocketProvider } from './contexts/SocketContext';
import { SessionProvider } from './contexts/SessionContext';
import { AuthProvider } from './contexts/AuthContext';

function App() {
  return (
    <ErrorBoundary>
      <AuthProvider>
        <SessionProvider>
          <Router>
            <SocketProvider>
              <div className="min-h-screen bg-gradient-to-br from-blue-50 to-purple-50">
                <Routes>
                  {/* Public Routes */}
                  <Route path="/login" element={<LoginPage />} />
                  
                  {/* Protected Routes */}
                  <Route 
                    path="/landing" 
                    element={
                      <ProtectedRoute>
                        <LandingPage />
                      </ProtectedRoute>
                    } 
                  />
                  <Route 
                    path="/mobile" 
                    element={
                      <ProtectedRoute>
                        <MobileInterface />
                      </ProtectedRoute>
                    } 
                  />
                  <Route 
                    path="/display" 
                    element={
                      <ProtectedRoute>
                        <DisplayScreen />
                      </ProtectedRoute>
                    } 
                  />
                  
                  {/* Redirect root to login */}
                  <Route path="/" element={<Navigate to="/login" replace />} />
                </Routes>
              </div>
            </SocketProvider>
          </Router>
        </SessionProvider>
      </AuthProvider>
    </ErrorBoundary>
  );
}

export default App;