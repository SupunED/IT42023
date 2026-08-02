import React, { createContext, useContext, useState, useEffect } from 'react';
import api from '../services/api';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(() => {
    const saved = localStorage.getItem('booknest_user');
    return saved ? JSON.parse(saved) : null;
  });
  const [token, setToken] = useState(() => localStorage.getItem('booknest_token'));
  const [loading, setLoading] = useState(false);

  const isAuthenticated = !!token && !!user;
  const isAdmin = user?.role === 'admin';

  // Quick Demo Login helper for easy testing / evaluation
  const quickDemoLogin = async (role = 'customer') => {
    setLoading(true);
    try {
      const { data } = await api.post('/auth/google', {
        demoRole: role,
        demoEmail: role === 'admin' ? 'admin@booknest.com' : 'eleanor@example.com',
        demoName: role === 'admin' ? 'System Administrator' : 'Eleanor Vance'
      });

      localStorage.setItem('booknest_token', data.token);
      localStorage.setItem('booknest_user', JSON.stringify(data.user));
      setToken(data.token);
      setUser(data.user);
      return { success: true, user: data.user };
    } catch (err) {
      console.error('Demo login error:', err);
      return { success: false, error: err.response?.data?.message || err.message };
    } finally {
      setLoading(false);
    }
  };

  // Google OAuth Login
  const loginWithGoogle = async (idToken) => {
    setLoading(true);
    try {
      const { data } = await api.post('/auth/google', { idToken });
      localStorage.setItem('booknest_token', data.token);
      localStorage.setItem('booknest_user', JSON.stringify(data.user));
      setToken(data.token);
      setUser(data.user);
      return { success: true, user: data.user };
    } catch (err) {
      console.error('Google login error:', err);
      return { success: false, error: err.response?.data?.message || err.message };
    } finally {
      setLoading(false);
    }
  };

  const logout = () => {
    localStorage.removeItem('booknest_token');
    localStorage.removeItem('booknest_user');
    setToken(null);
    setUser(null);
  };

  const updateUserProfile = (updatedUser) => {
    setUser(updatedUser);
    localStorage.setItem('booknest_user', JSON.stringify(updatedUser));
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        isAuthenticated,
        isAdmin,
        loading,
        loginWithGoogle,
        quickDemoLogin,
        logout,
        updateUserProfile
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
