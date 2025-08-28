import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';

interface User {
  username: string;
  loginTime: string;
}

interface AuthContextType {
  isAuthenticated: boolean;
  user: User | null;
  login: (username: string, password: string) => Promise<boolean>;
  logout: () => void;
  checkAuth: () => boolean;
}

const AuthContext = createContext<AuthContextType>({
  isAuthenticated: false,
  user: null,
  login: async () => false,
  logout: () => {},
  checkAuth: () => false
});

export const useAuth = () => useContext(AuthContext);

interface AuthProviderProps {
  children: ReactNode;
}

// Hardcoded credentials for demo
const DEMO_CREDENTIALS = {
  username: 'admin',
  password: 'virtual123'
};

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
  const [user, setUser] = useState<User | null>(null);

  // Check authentication status on app load
  useEffect(() => {
    checkAuth();
  }, []);

  const checkAuth = (): boolean => {
    try {
      const authStatus = localStorage.getItem('virtualTryOn_authenticated');
      const userStr = localStorage.getItem('virtualTryOn_user');

      if (authStatus === 'true' && userStr) {
        const userData = JSON.parse(userStr);
        setIsAuthenticated(true);
        setUser(userData);
        return true;
      }
    } catch (error) {
      console.error('❌ [Auth] Error checking authentication:', error);
      // Clear invalid data
      localStorage.removeItem('virtualTryOn_authenticated');
      localStorage.removeItem('virtualTryOn_user');
    }
    
    setIsAuthenticated(false);
    setUser(null);
    return false;
  };

  const login = async (username: string, password: string): Promise<boolean> => {
    try {
      // Simulate API call delay
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Validate against hardcoded credentials
      if (username === DEMO_CREDENTIALS.username && password === DEMO_CREDENTIALS.password) {
        const userData: User = {
          username: username,
          loginTime: new Date().toISOString()
        };
        
        // Store in localStorage
        localStorage.setItem('virtualTryOn_authenticated', 'true');
        localStorage.setItem('virtualTryOn_user', JSON.stringify(userData));
        
        // Update state
        setIsAuthenticated(true);
        setUser(userData);
        
        return true;
      } else {
        return false;
      }
    } catch (error) {
      console.error('❌ [Auth] Login error:', error);
      return false;
    }
  };

  const logout = (): void => {
    // Clear localStorage
    localStorage.removeItem('virtualTryOn_authenticated');
    localStorage.removeItem('virtualTryOn_user');
    
    // Clear state
    setIsAuthenticated(false);
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{
      isAuthenticated,
      user,
      login,
      logout,
      checkAuth
    }}>
      {children}
    </AuthContext.Provider>
  );
};
