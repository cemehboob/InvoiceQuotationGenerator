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

  const extractErrorMessage = (err, defaultMsg) => {
    if (err.response?.data?.message) {
      return err.response.data.message;
    }
    if (err.response?.data?.errors) {
      const messages = Object.values(err.response.data.errors).flat().filter(Boolean);
      if (messages.length > 0) return messages.join(' ');
    }
    if (err.response?.data?.title) {
      return err.response.data.title;
    }
    if (err.message === 'Network Error' || !err.response) {
      return 'Unable to connect to the backend server. Please make sure the API is running on port 5050.';
    }
    return defaultMsg;
  };

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
        error: extractErrorMessage(err, 'Login failed. Please verify your credentials.'),
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
        error: extractErrorMessage(err, 'Registration failed. Please check form inputs.'),
      };
    } finally {
      setLoading(false);
    }
  };

  const updateCompanyLogo = (logoUrl) => {
    if (user) {
      const updatedUser = { ...user, logoUrl };
      setUser(updatedUser);
      localStorage.setItem('invoxa_user', JSON.stringify(updatedUser));
    }
  };

  const updateCompanyInfo = (info) => {
    if (user) {
      const updatedUser = { ...user, ...info };
      setUser(updatedUser);
      localStorage.setItem('invoxa_user', JSON.stringify(updatedUser));
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
    <AuthContext.Provider
      value={{
        user,
        token,
        isAuthenticated: !!token,
        login,
        register,
        logout,
        updateCompanyLogo,
        updateCompanyInfo,
        loading,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
