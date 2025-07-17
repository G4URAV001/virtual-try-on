import React, { createContext, useContext, useState, ReactNode } from 'react';

interface SessionContextType {
  sessionId: string;
  generateNewSession: () => string;
  joinSession: (id: string) => void;
}

const SessionContext = createContext<SessionContextType>({
  sessionId: '',
  generateNewSession: () => '',
  joinSession: () => {}
});

export const useSession = () => useContext(SessionContext);

interface SessionProviderProps {
  children: ReactNode;
}

export const SessionProvider: React.FC<SessionProviderProps> = ({ children }) => {
  const [sessionId, setSessionId] = useState<string>(() => {
    // Check URL params for session ID - don't auto-generate
    const urlParams = new URLSearchParams(window.location.search);
    const urlSession = urlParams.get('session');
    console.log('🏗️ [SessionContext] Initializing with URL session:', urlSession);
    return urlSession || '';
  });

  const generateNewSession = () => {
    // Generate shorter, more readable session ID (8 characters)
    const newId = Math.random().toString(36).substring(2, 10).toUpperCase();
    console.log('🆔 [SessionContext] Generated new session ID:', newId);
    console.log('🆔 [SessionContext] Previous session ID:', sessionId);
    setSessionId(newId);
    return newId;
  };

  const joinSession = (id: string) => {
    console.log('🔗 [SessionContext] Joining session:', id);
    console.log('🔗 [SessionContext] Previous session:', sessionId);
    setSessionId(id);
  };

  return (
    <SessionContext.Provider value={{ sessionId, generateNewSession, joinSession }}>
      {children}
    </SessionContext.Provider>
  );
};