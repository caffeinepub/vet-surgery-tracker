import { createContext, useContext, useState, useEffect, ReactNode } from 'react';

export interface AuthContextType {
  isAuthenticated: boolean;
  username: string | null;
  sessionToken: string | null;
  isLoading: boolean;
  login: (username: string, password: string, rememberMe: boolean) => Promise<void>;
  register: (username: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | null>(null);

interface AuthProviderProps {
  children: ReactNode;
}

export function AuthProvider({ children }: AuthProviderProps) {
  const [username, setUsername] = useState<string | null>(null);
  const [sessionToken, setSessionToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Load session from storage on mount
  useEffect(() => {
    const loadSession = () => {
      try {
        // Check localStorage first (remember me)
        const storedToken = localStorage.getItem('sessionToken');
        const storedUsername = localStorage.getItem('username');
        
        if (storedToken && storedUsername) {
          setSessionToken(storedToken);
          setUsername(storedUsername);
          setIsLoading(false);
          return;
        }

        // Check sessionStorage (browser session only)
        const sessionStorageToken = sessionStorage.getItem('sessionToken');
        const sessionStorageUsername = sessionStorage.getItem('username');
        
        if (sessionStorageToken && sessionStorageUsername) {
          setSessionToken(sessionStorageToken);
          setUsername(sessionStorageUsername);
        }
      } catch (error) {
        console.error('Error loading session:', error);
      } finally {
        setIsLoading(false);
      }
    };

    loadSession();
  }, []);

  const login = async (username: string, password: string, rememberMe: boolean) => {
    try {
      // TODO: Replace with actual backend call when implemented
      // const response = await actor.login(username, password);
      // const token = response;
      
      // Mock implementation for now
      const mockToken = `token_${username}_${Date.now()}`;
      
      setUsername(username);
      setSessionToken(mockToken);

      // Store based on remember me preference
      if (rememberMe) {
        localStorage.setItem('sessionToken', mockToken);
        localStorage.setItem('username', username);
      } else {
        sessionStorage.setItem('sessionToken', mockToken);
        sessionStorage.setItem('username', username);
      }
    } catch (error) {
      console.error('Login error:', error);
      throw error;
    }
  };

  const register = async (username: string, password: string) => {
    try {
      // TODO: Replace with actual backend call when implemented
      // await actor.register(username, password);
      
      // Mock implementation - auto-login after registration
      await login(username, password, false);
    } catch (error) {
      console.error('Registration error:', error);
      throw error;
    }
  };

  const logout = async () => {
    try {
      // TODO: Replace with actual backend call when implemented
      // if (sessionToken) {
      //   await actor.logout(sessionToken);
      // }
      
      setUsername(null);
      setSessionToken(null);
      
      // Clear from both storages
      localStorage.removeItem('sessionToken');
      localStorage.removeItem('username');
      sessionStorage.removeItem('sessionToken');
      sessionStorage.removeItem('username');
    } catch (error) {
      console.error('Logout error:', error);
      throw error;
    }
  };

  const value: AuthContextType = {
    isAuthenticated: !!sessionToken && !!username,
    username,
    sessionToken,
    isLoading,
    login,
    register,
    logout,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
