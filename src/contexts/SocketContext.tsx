import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { io, Socket } from 'socket.io-client';
import { useLocation } from 'react-router-dom';

interface SocketContextType {
  socket: Socket | null;
  isConnected: boolean;
  connectionError: string | null;
  connectToSession: (sessionId: string) => void;
  disconnect: () => void;
}

const SocketContext = createContext<SocketContextType>({
  socket: null,
  isConnected: false,
  connectionError: null,
  connectToSession: () => {},
  disconnect: () => {}
});

export const useSocket = () => useContext(SocketContext);

interface SocketProviderProps {
  children: ReactNode;
}

export const SocketProvider: React.FC<SocketProviderProps> = ({ children }) => {
  const [socket, setSocket] = useState<Socket | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [connectionError, setConnectionError] = useState<string | null>(null);
  const [currentSessionId, setCurrentSessionId] = useState<string | null>(null);
  const location = useLocation();

  const connectToSession = (newSessionId: string) => {
    // Check if already connected to this session with valid socket
    if (currentSessionId === newSessionId && socket?.connected) {
      return;
    }
    
    // Only connect if we're on mobile or display routes
    if (location.pathname !== '/mobile' && location.pathname !== '/display') {
      return;
    }

    // Disconnect existing socket if any
    if (socket) {
      socket.disconnect();
      socket.removeAllListeners();
    }

    // Get socket URL from environment or default to localhost
    const socketUrl = (import.meta.env.VITE_SOCKET_URL as string) || 'http://localhost:3001';
    
    setCurrentSessionId(newSessionId);

    // Create socket connection with optimized settings
    const newSocket = io(socketUrl, {
      autoConnect: true,
      reconnection: true,
      reconnectionAttempts: 5,
      reconnectionDelay: 1000,
      timeout: 5000, // Reduced from 10000 to 5000ms
      transports: ['websocket', 'polling'],
      forceNew: true, // Force new connection to avoid stale connections
      upgrade: true, // Allow transport upgrades
      rememberUpgrade: true // Remember successful upgrades
    });

    // Connection event handlers
    newSocket.on('connect', () => {
      setIsConnected(true);
      setConnectionError(null);
      
      // Determine device type based on current route
      const deviceType = location.pathname === '/mobile' ? 'mobile' : 'display';
      
      // Join the specific session with device type information
      newSocket.emit('join-session', { sessionId: newSessionId, deviceType });
    });

    newSocket.on('disconnect', (reason) => {
      setIsConnected(false);
      setConnectionError(`Disconnected: ${reason}`);
    });

    newSocket.on('connect_error', (error) => {
      console.error('🚫 Socket.IO connection error:', error);
      setIsConnected(false);
      setConnectionError(`Connection failed: ${error.message}`);
    });

    newSocket.on('reconnect', () => {
      setIsConnected(true);
      setConnectionError(null);
      // Rejoin session after reconnection with device type
      const deviceType = location.pathname === '/mobile' ? 'mobile' : 'display';
      newSocket.emit('join-session', { sessionId: newSessionId, deviceType });
    });

    newSocket.on('reconnect_failed', () => {
      console.error('💥 Failed to reconnect to Socket.IO server');
      setIsConnected(false);
      setConnectionError('Failed to reconnect after multiple attempts');
    });

    // Session-specific event handlers
    newSocket.on('session-joined', () => {
      // Event handled
    });

    newSocket.on('client-disconnected', () => {
      // Event handled
    });

    newSocket.on('pong', () => {
      // Health check response
    });

    setSocket(newSocket);
  };

  const disconnect = () => {
    if (socket) {
      socket.disconnect();
      socket.removeAllListeners();
    }
    setSocket(null);
    setIsConnected(false);
    setConnectionError(null);
    setCurrentSessionId(null);
  };

  useEffect(() => {
    // Clean up connection when leaving mobile/display routes
    if (location.pathname !== '/mobile' && location.pathname !== '/display') {
      if (socket) {
        disconnect();
      }
    }
  });

  // Health check ping every 30 seconds when connected
  useEffect(() => {
    if (socket && isConnected) {
      const pingInterval = setInterval(() => {
        socket.emit('ping');
      }, 30000);

      return () => clearInterval(pingInterval);
    }
  }, [socket, isConnected]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (socket) {
        socket.disconnect();
        socket.removeAllListeners();
      }
    };
  }, [socket]);

  return (
    <SocketContext.Provider value={{ 
      socket, 
      isConnected, 
      connectionError, 
      connectToSession, 
      disconnect
    }}>
      {children}
    </SocketContext.Provider>
  );
};