import React, { createContext, useContext, useState, useEffect } from 'react';
import { api } from '../services/api';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    checkLoggedInUser();
  }, []);

  const checkLoggedInUser = async () => {
    const token = localStorage.getItem('velora_token');
    if (!token) {
      setLoading(false);
      return;
    }

    try {
      const res = await api.getMe();
      if (res.success) {
        setUser(res.user);
      } else {
        logout();
      }
    } catch (err) {
      console.error('Failed to verify token:', err);
      logout();
    } finally {
      setLoading(false);
    }
  };

  const login = async (email, password) => {
    const res = await api.login({ email, password });
    if (res.success) {
      localStorage.setItem('velora_token', res.token);
      setUser(res.user);
      return res;
    }
  };

  const register = async (userData) => {
    const res = await api.register(userData);
    if (res.success) {
      localStorage.setItem('velora_token', res.token);
      setUser(res.user);
      return res;
    }
  };

  const switchDemoAccount = async (role) => {
    setLoading(true);
    let email = 'trainee@velora.demo';
    if (role === 'trainer') email = 'trainer@velora.demo';
    if (role === 'admin') email = 'admin@velora.demo';

    try {
      await login(email, 'Demo@123');
    } catch (err) {
      console.error('Failed to switch demo account:', err);
    } finally {
      setLoading(false);
    }
  };

  const logout = () => {
    localStorage.removeItem('velora_token');
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{
      user,
      loading,
      login,
      register,
      logout,
      switchDemoAccount,
      isAuthenticated: Boolean(user),
      isTrainee: user?.role === 'trainee',
      isTrainer: user?.role === 'trainer',
      isAdmin: user?.role === 'admin'
    }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
