import React, { createContext, useContext, useState, useEffect } from 'react';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(() => localStorage.getItem('salma_token') || localStorage.getItem('teranga_token') || null);
  const [loading, setLoading] = useState(true);

  // Vérifier la session au montage si un jeton existe
  useEffect(() => {
    async function checkAuth() {
      if (!token) {
        setLoading(false);
        return;
      }

      try {
        const res = await fetch('/api/auth/me', {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });
        const data = await res.json();
        if (data.success && data.user) {
          setUser(data.user);
        } else {
          // Jeton invalide ou expiré
          localStorage.removeItem('salma_token');
          localStorage.removeItem('teranga_token');
          setToken(null);
          setUser(null);
        }
      } catch (err) {
        console.error('Erreur vérification auth:', err);
      } finally {
        setLoading(false);
      }
    }

    checkAuth();
  }, [token]);

  // Connexion
  const login = async (email, password) => {
    const res = await fetch('/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password })
    });
    const data = await res.json();

    if (!res.ok || !data.success) {
      throw new Error(data.message || 'Échec de connexion.');
    }

    localStorage.setItem('salma_token', data.token);
    setToken(data.token);
    setUser(data.user);
    return data.user;
  };

  // Inscription
  const register = async (userData) => {
    const res = await fetch('/api/auth/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(userData)
    });
    const data = await res.json();

    if (!res.ok || !data.success) {
      throw new Error(data.message || 'Échec de l’inscription.');
    }

    localStorage.setItem('salma_token', data.token);
    setToken(data.token);
    setUser(data.user);
    return data.user;
  };

  // Déconnexion
  const logout = () => {
    localStorage.removeItem('salma_token');
    localStorage.removeItem('teranga_token');
    setToken(null);
    setUser(null);
  };

  // Mise à jour du profil
  const updateProfile = async (profileData) => {
    const res = await fetch('/api/auth/profile', {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify(profileData)
    });
    const data = await res.json();

    if (!res.ok || !data.success) {
      throw new Error(data.message || 'Échec de mise à jour.');
    }

    setUser(data.user);
    return data.user;
  };

  const isAdmin = user && user.role === 'admin';

  return (
    <AuthContext.Provider value={{
      user,
      token,
      loading,
      isAdmin,
      login,
      register,
      logout,
      updateProfile
    }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth doit être utilisé au sein d’un AuthProvider');
  }
  return context;
}
