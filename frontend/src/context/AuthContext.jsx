import React, { createContext, useContext, useState, useEffect } from 'react';
import { authApi } from '../api/api';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(() => {
    const saved = localStorage.getItem('invoxa_user');
    return saved ? JSON.parse(saved) : null;
  });
  const [token, setToken] = useState(() => localStorage.getItem('invoxa_token'));
  const [loading, setLoading] = useState(false);

  const login = async (email, password) => {
    setLoading(true);
    try {
      const response = await authApi.login({ email, password });
      const authData = response.data.data;
      setUser(authData);
      setToken(authData.token);
      localStorage.setItem('invoxa_token', authData.token);
      localStorage.setItem('invoxa_user', JSON.stringify(authData));
      return { success: true };
    } catch (err) {
      return {
        success: false,
        error: err.response?.data?.message || 'Login failed. Please verify your credentials.',
      };
    } finally {
      setLoading(false);
    }
  };

  const register = async (registrationData) => {
    setLoading(true);
    try {
      const response = await authApi.register(registrationData);
      const authData = response.data.data;
      setUser(authData);
      setToken(authData.token);
      localStorage.setItem('invoxa_token', authData.token);
      localStorage.setItem('invoxa_user', JSON.stringify(authData));
      return { success: true };
    } catch (err) {
      return {
        success: false,
        error: err.response?.data?.message || 'Registration failed. Please check form inputs.',
      };
    } finally {
      setLoading(false);
    }
  };

  const logout = () => {
    setUser(null);
    setToken(null);
    localStorage.removeItem('invoxa_token');
    localStorage.removeItem('invoxa_user');
    window.location.href = '/login';
  };

  return (
    <AuthContext.Provider value={{ user, token, isAuthenticated: !!token, login, register, logout, loading }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
