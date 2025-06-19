import React, { createContext, useContext, useState, useEffect } from 'react';
import jwt_decode from 'jwt-decode';

interface User {
  id: string;
  email: string;
  role: 'admin' | 'employee';
  name: string;
}

interface AuthContextType {
  user: User | null;
  login: (token: string) => void;
  logout: () => void;
  isAuthenticated: boolean;
  token: string | null;
}

const AuthContext = createContext<AuthContextType>({} as AuthContextType);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);

  useEffect(() => {
    // Vérifier le token stocké au chargement
    const storedToken = localStorage.getItem('token');
    if (storedToken) {
      try {
        const decoded = jwt_decode(storedToken) as any;
        const currentTime = Date.now() / 1000;

        if (decoded.exp && decoded.exp > currentTime) {
          setToken(storedToken);
          setUser({
            id: decoded.sub,
            email: decoded.email,
            role: decoded.role,
            name: decoded.name
          });
        } else {
          // Token expiré
          localStorage.removeItem('token');
        }
      } catch (error) {
        console.error('Erreur lors du décodage du token:', error);
        localStorage.removeItem('token');
      }
    }
  }, []);

  const login = (newToken: string) => {
    try {
      const decoded = jwt_decode(newToken) as any;
      setToken(newToken);
      setUser({
        id: decoded.sub,
        email: decoded.email,
        role: decoded.role,
        name: decoded.name
      });
      localStorage.setItem('token', newToken);
    } catch (error) {
      console.error('Erreur lors de la connexion:', error);
      throw new Error('Token invalide');
    }
  };

  const logout = () => {
    setUser(null);
    setToken(null);
    localStorage.removeItem('token');
  };

  // Intercepteur pour les requêtes API
  useEffect(() => {
    const interceptor = async (response: Response) => {
      if (response.status === 401) {
        logout();
        window.location.href = '/login';
      }
      return response;
    };

    const originalFetch = window.fetch;
    window.fetch = async (...args) => {
      const response = await originalFetch(...args);
      return interceptor(response);
    };

    return () => {
      window.fetch = originalFetch;
    };
  }, []);

  // Vérification périodique de l'expiration du token
  useEffect(() => {
    if (!token) return;

    const checkTokenExpiration = () => {
      try {
        const decoded = jwt_decode(token) as any;
        const currentTime = Date.now() / 1000;

        if (decoded.exp && decoded.exp <= currentTime) {
          logout();
        }
      } catch (error) {
        logout();
      }
    };

    const interval = setInterval(checkTokenExpiration, 60000); // Vérification toutes les minutes

    return () => clearInterval(interval);
  }, [token]);

  return (
    <AuthContext.Provider
      value={{
        user,
        login,
        logout,
        isAuthenticated: !!user,
        token
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth doit être utilisé à l\'intérieur d\'un AuthProvider');
  }
  return context;
};