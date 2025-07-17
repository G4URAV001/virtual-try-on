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
    console.log('🔌 [SocketContext] connectToSession called with:', newSessionId);
    console.log('🔌 [SocketContext] Current route:', location.pathname);
    console.log('🔌 [SocketContext] Current session:', currentSessionId);
    console.log('🔌 [SocketContext] Already connected to this session?', currentSessionId === newSessionId && socket?.connected);
    
    // Check if already connected to this session
    if (currentSessionId === newSessionId && socket?.connected) {
      console.log('✅ [SocketContext] Already connected to session:', newSessionId);
      return;
    }
    
    // Only connect if we're on mobile or display routes
    if (location.pathname !== '/mobile' && location.pathname !== '/display') {
      console.log('📍 [SocketContext] Not on valid route, cannot connect to socket');
      return;
    }

    // Disconnect existing socket if any
    if (socket) {
      console.log('🔌 [SocketContext] Disconnecting existing socket');
      socket.close();
    }

    // Get socket URL from environment or default to localhost
    const socketUrl = (import.meta.env.VITE_SOCKET_URL as string) || 'http://localhost:3001';
    
    console.log('🔌 [SocketContext] Connecting to Socket.IO server:', socketUrl, 'Session:', newSessionId);
    setCurrentSessionId(newSessionId);

    // Create socket connection
    const newSocket = io(socketUrl, {
      autoConnect: true,
      reconnection: true,
      reconnectionAttempts: 5,
      reconnectionDelay: 1000,
      timeout: 10000,
      transports: ['websocket', 'polling']
    });

    // Connection event handlers
    newSocket.on('connect', () => {
      console.log('✅ [SocketContext] Connected to Socket.IO server:', newSocket.id);
      console.log('📱 [SocketContext] Joining session:', newSessionId);
      console.log('📱 [SocketContext] Current route:', location.pathname);
      console.log('📱 [SocketContext] Emitting join-session event...');
      setIsConnected(true);
      setConnectionError(null);
      
      // Determine device type based on current route
      const deviceType = location.pathname === '/mobile' ? 'mobile' : 'display';
      
      // Join the specific session with device type information
      newSocket.emit('join-session', { sessionId: newSessionId, deviceType });
      console.log('✅ [SocketContext] join-session event emitted for:', newSessionId, 'as', deviceType);
    });

    newSocket.on('disconnect', (reason) => {
      console.log('❌ Disconnected from Socket.IO server:', reason);
      setIsConnected(false);
      setConnectionError(`Disconnected: ${reason}`);
    });

    newSocket.on('connect_error', (error) => {
      console.error('🚫 Socket.IO connection error:', error);
      setIsConnected(false);
      setConnectionError(`Connection failed: ${error.message}`);
    });

    newSocket.on('reconnect', (attemptNumber) => {
      console.log('🔄 Reconnected to Socket.IO server, attempt:', attemptNumber);
      setIsConnected(true);
      setConnectionError(null);
      // Rejoin session after reconnection
      newSocket.emit('join-session', newSessionId);
    });

    newSocket.on('reconnect_failed', () => {
      console.error('💥 Failed to reconnect to Socket.IO server');
      setIsConnected(false);
      setConnectionError('Failed to reconnect after multiple attempts');
    });

    // Session-specific event handlers
    newSocket.on('session-joined', (data) => {
      console.log('📱 Joined session:', data);
    });

    newSocket.on('client-disconnected', (data) => {
      console.log('👤 Client disconnected from session:', data);
    });

    newSocket.on('pong', () => {
      console.log('🏓 Pong received from server');
    });

    setSocket(newSocket);
  };

  const disconnect = () => {
    console.log('🧹 Manually disconnecting socket');
    if (socket) {
      socket.close();
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
        console.log('📍 Left active route, disconnecting socket');
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
        console.log('🧹 Component unmounting, cleaning up socket');
        socket.close();
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