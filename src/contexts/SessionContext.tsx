import React, { createContext, useContext, useState, ReactNode } from 'react';
import { v4 as uuidv4 } from 'uuid';

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
    return urlParams.get('session') || '';
  });

  const generateNewSession = () => {
    const newId = uuidv4();
    setSessionId(newId);
    return newId;
  };

  const joinSession = (id: string) => {
    setSessionId(id);
  };

  return (
    <SessionContext.Provider value={{ sessionId, generateNewSession, joinSession }}>
      {children}
    </SessionContext.Provider>
  );
};