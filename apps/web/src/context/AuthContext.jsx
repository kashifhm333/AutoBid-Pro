import React, { createContext, useContext, useState, useEffect } from 'react';

const AuthContext = createContext(null);

export const DEMO_USERS = {
  BUYER: {
    id: 'u-buyer-001',
    email: 'buyer@autobidpro.com',
    firstName: 'Alex',
    lastName: 'Russo',
    roles: ['BUYER'],
    status: 'ACTIVE'
  },
  SELLER: {
    id: 'u-seller-001',
    email: 'seller@apexmotors.com',
    firstName: 'Apex',
    lastName: 'Motors LLC',
    roles: ['SELLER'],
    status: 'ACTIVE'
  },
  ADMIN: {
    id: 'u-admin-001',
    email: 'admin@autobidpro.com',
    firstName: 'Mark',
    lastName: 'Hendrickson',
    roles: ['ADMINISTRATOR', 'SUPER_ADMINISTRATOR'],
    status: 'ACTIVE'
  }
};

export function AuthProvider({ children }) {
  // Initialize user from localStorage if present
  const [user, setUser] = useState(() => {
    try {
      const saved = localStorage.getItem('autobid_user');
      return saved ? JSON.parse(saved) : null;
    } catch {
      return null;
    }
  });

  const [accessToken, setAccessToken] = useState(() => {
    try {
      return localStorage.getItem('autobid_token') || null;
    } catch {
      return null;
    }
  });

  const [isLoading, setIsLoading] = useState(true);

  // Sync user state to localStorage
  useEffect(() => {
    try {
      if (user) {
        localStorage.setItem('autobid_user', JSON.stringify(user));
      } else {
        localStorage.removeItem('autobid_user');
      }
    } catch {}
  }, [user]);

  // Sync token to localStorage
  useEffect(() => {
    try {
      if (accessToken) {
        localStorage.setItem('autobid_token', accessToken);
      } else {
        localStorage.removeItem('autobid_token');
      }
    } catch {}
  }, [accessToken]);

  // Verify session on mount with backend if available
  useEffect(() => {
    async function checkAuth() {
      try {
        const res = await fetch('/api/v1/auth/me', {
          headers: accessToken ? { Authorization: `Bearer ${accessToken}` } : {}
        });

        if (res.ok) {
          const json = await res.json();
          setUser(json.data.user);
        }
      } catch (err) {
        // Retain existing local session if backend is temporarily unreachable
      } finally {
        setIsLoading(false);
      }
    }

    checkAuth();
  }, [accessToken]);

  const login = async (email, password) => {
    try {
      const res = await fetch('/api/v1/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password })
      });

      if (res.ok) {
        const json = await res.json();
        setUser(json.data.user);
        setAccessToken(json.data.accessToken);
        return json.data.user;
      }
    } catch (err) {
      // Backend not running / offline - fallback to robust demo credentials
    }

    // Demo / offline fallback authentication
    let loggedInUser;
    const lower = email.toLowerCase();
    if (lower.includes('seller') || lower.includes('apex')) {
      loggedInUser = { ...DEMO_USERS.SELLER };
    } else if (lower.includes('admin')) {
      loggedInUser = { ...DEMO_USERS.ADMIN };
    } else {
      loggedInUser = {
        ...DEMO_USERS.BUYER,
        email,
        firstName: email.split('@')[0] ? email.split('@')[0].charAt(0).toUpperCase() + email.split('@')[0].slice(1) : 'Alex'
      };
    }

    setUser(loggedInUser);
    setAccessToken('demo-jwt-token-' + Date.now());
    return loggedInUser;
  };

  const register = async (formData) => {
    try {
      const res = await fetch('/api/v1/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      });

      if (res.ok) {
        const json = await res.json();
        setUser(json.data.user);
        setAccessToken(json.data.accessToken);
        return json.data.user;
      }
    } catch (err) {
      // Offline fallback
    }

    const newUser = {
      id: `u-${Date.now()}`,
      email: formData.email,
      firstName: formData.firstName || 'Collector',
      lastName: formData.lastName || 'Bidder',
      roles: [formData.role || 'BUYER'],
      status: 'ACTIVE'
    };

    setUser(newUser);
    setAccessToken('demo-jwt-token-' + Date.now());
    return newUser;
  };

  const setPersona = (personaKey) => {
    if (personaKey === 'GUEST') {
      logout();
      return null;
    }

    const target = DEMO_USERS[personaKey] || DEMO_USERS.BUYER;
    const personaUser = { ...target };
    setUser(personaUser);
    setAccessToken('demo-jwt-token-' + personaKey.toLowerCase());
    return personaUser;
  };

  const logout = async () => {
    try {
      await fetch('/api/v1/auth/logout', { method: 'POST' });
    } catch {}
    setUser(null);
    setAccessToken(null);
    try {
      localStorage.removeItem('autobid_user');
      localStorage.removeItem('autobid_token');
    } catch {}
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        accessToken,
        isLoading,
        isAuthenticated: !!user,
        login,
        register,
        setPersona,
        logout
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
