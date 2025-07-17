import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import LandingPage from './components/LandingPage';
import MobileInterface from './components/MobileInterface';
import DisplayScreen from './components/DisplayScreen';
import ErrorBoundary from './components/ErrorBoundary';
import { SocketProvider } from './contexts/SocketContext';
import { SessionProvider } from './contexts/SessionContext';

function App() {
  return (
    <ErrorBoundary>
      <SessionProvider>
        <Router>
          <SocketProvider>
            <div className="min-h-screen bg-gradient-to-br from-blue-50 to-purple-50">
              <Routes>
                <Route path="/" element={<LandingPage />} />
                <Route path="/mobile" element={<MobileInterface />} />
                <Route path="/display" element={<DisplayScreen />} />
              </Routes>
            </div>
          </SocketProvider>
        </Router>
      </SessionProvider>
    </ErrorBoundary>
  );
}

export default App;