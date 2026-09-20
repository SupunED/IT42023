import React, { createContext, useContext, useState, useEffect } from 'react';
import api from '../services/api';
import toast from 'react-hot-toast';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [initializing, setInitializing] = useState(true);
  const [loading, setLoading] = useState(false);

  const isAuthenticated = !!user;
  const isAdmin = user?.role === 'admin';

  useEffect(() => {
    let active = true;
    localStorage.removeItem('booknest_token');
    localStorage.removeItem('booknest_user');
    const clearUser = () => setUser(null);
    window.addEventListener('booknest:unauthorized', clearUser);
    api.get('/auth/profile')
      .then(({ data }) => { if (active) setUser(data.user); })
      .catch(() => { if (active) setUser(null); })
      .finally(() => { if (active) setInitializing(false); });
    return () => {
      active = false;
      window.removeEventListener('booknest:unauthorized', clearUser);
    };
  }, []);

  // Google OAuth Login
  const loginWithGoogle = async (idToken) => {
    setLoading(true);
    try {
      const { data } = await api.post('/auth/google', { idToken });
      setUser(data.user);
      return { success: true, user: data.user };
    } catch (err) {
      console.error('Google login error:', err);
      return { success: false, error: err.response?.data?.message || err.message };
    } finally {
      setLoading(false);
    }
  };

  const logout = async () => {
    try {
      await api.post('/auth/logout');
      setUser(null);
      return { success: true };
    } catch (error) {
      toast.error('Sign out failed. Please try again.');
      return { success: false };
    }
  };

  const updateUserProfile = (updatedUser) => {
    setUser(updatedUser);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        isAuthenticated,
        isAdmin,
        loading,
        initializing,
        loginWithGoogle,
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
