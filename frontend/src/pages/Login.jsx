import React, { useState } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  TextField,
  Button,
  Tabs,
  Tab,
  Alert,
  MenuItem,
  CircularProgress,
  Divider,
} from '@mui/material';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export const Login = () => {
  const [tab, setTab] = useState(0);
  const [error, setError] = useState('');
  const { login, register, loading } = useAuth();
  const navigate = useNavigate();

  // Login form
  const [loginEmail, setLoginEmail] = useState('');
  const [loginPassword, setLoginPassword] = useState('');

  // Register form
  const [regData, setRegData] = useState({
    companyName: '',
    adminFullName: '',
    email: '',
    password: '',
    phone: '',
    crNumber: '',
    vatNumber: '',
    currencyCode: 'BHD',
  });

  const handleLoginSubmit = async (e) => {
    e.preventDefault();
    setError('');
    const result = await login(loginEmail, loginPassword);
    if (result.success) {
      navigate('/');
    } else {
      setError(result.error);
    }
  };

  const handleRegisterSubmit = async (e) => {
    e.preventDefault();
    setError('');
    const result = await register(regData);
    if (result.success) {
      navigate('/');
    } else {
      setError(result.error);
    }
  };

  const fillDemoCredentials = () => {
    setLoginEmail('admin@invoxa.com');
    setLoginPassword('Admin@123456');
  };

  return (
    <Box
      sx={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        bgcolor: '#f1f5f9',
        p: 2,
      }}
    >
      <Card sx={{ maxWidth: 460, width: '100%', p: 2, borderRadius: 3 }}>
        <CardContent>
          <Box sx={{ textAlign: 'center', mb: 3 }}>
            <Box
              sx={{
                width: 48,
                height: 48,
                borderRadius: 2,
                bgcolor: 'primary.main',
                color: 'white',
                fontWeight: 900,
                fontSize: '1.6rem',
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                mb: 1.5,
              }}
            >
              I
            </Box>
            <Typography variant="h5" fontWeight={800} color="text.primary">
              Invoxa
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Quote. Invoice. Get Paid.
            </Typography>
          </Box>

          <Tabs
            value={tab}
            onChange={(_, val) => {
              setTab(val);
              setError('');
            }}
            variant="fullWidth"
            sx={{ mb: 3 }}
          >
            <Tab label="Sign In" sx={{ fontWeight: 600 }} />
            <Tab label="Register Business" sx={{ fontWeight: 600 }} />
          </Tabs>

          {error && (
            <Alert severity="error" sx={{ mb: 2 }}>
              {error}
            </Alert>
          )}

          {tab === 0 ? (
            <form onSubmit={handleLoginSubmit}>
              <TextField
                label="Email Address"
                type="email"
                fullWidth
                required
                value={loginEmail}
                onChange={(e) => setLoginEmail(e.target.value)}
                sx={{ mb: 2 }}
              />
              <TextField
                label="Password"
                type="password"
                fullWidth
                required
                value={loginPassword}
                onChange={(e) => setLoginPassword(e.target.value)}
                sx={{ mb: 2 }}
              />
              <Button
                type="submit"
                variant="contained"
                fullWidth
                size="large"
                disabled={loading}
                sx={{ py: 1.2, mb: 2 }}
              >
                {loading ? <CircularProgress size={24} color="inherit" /> : 'Sign In'}
              </Button>

              <Divider sx={{ my: 1.5 }}>
                <Typography variant="caption" color="text.secondary">
                  DEMO CREDENTIALS
                </Typography>
              </Divider>

              <Button
                variant="outlined"
                fullWidth
                size="small"
                onClick={fillDemoCredentials}
              >
                Auto-fill Seed Demo Account (admin@invoxa.com)
              </Button>
            </form>
          ) : (
            <form onSubmit={handleRegisterSubmit}>
              <TextField
                label="Company / Business Name"
                fullWidth
                required
                value={regData.companyName}
                onChange={(e) => setRegData({ ...regData, companyName: e.target.value })}
                sx={{ mb: 1.5 }}
              />
              <TextField
                label="Owner / Admin Full Name"
                fullWidth
                required
                value={regData.adminFullName}
                onChange={(e) => setRegData({ ...regData, adminFullName: e.target.value })}
                sx={{ mb: 1.5 }}
              />
              <TextField
                label="Business Email"
                type="email"
                fullWidth
                required
                value={regData.email}
                onChange={(e) => setRegData({ ...regData, email: e.target.value })}
                sx={{ mb: 1.5 }}
              />
              <TextField
                label="Password"
                type="password"
                fullWidth
                required
                value={regData.password}
                onChange={(e) => setRegData({ ...regData, password: e.target.value })}
                sx={{ mb: 1.5 }}
              />
              <TextField
                select
                label="Primary Currency"
                fullWidth
                value={regData.currencyCode}
                onChange={(e) => setRegData({ ...regData, currencyCode: e.target.value })}
                sx={{ mb: 2 }}
              >
                <MenuItem value="BHD">BHD - Bahraini Dinar (3 Decimals)</MenuItem>
                <MenuItem value="SAR">SAR - Saudi Riyal</MenuItem>
                <MenuItem value="AED">AED - UAE Dirham</MenuItem>
                <MenuItem value="USD">USD - US Dollar ($)</MenuItem>
              </TextField>

              <Button
                type="submit"
                variant="contained"
                fullWidth
                size="large"
                disabled={loading}
                sx={{ py: 1.2 }}
              >
                {loading ? <CircularProgress size={24} color="inherit" /> : 'Register & Start Free'}
              </Button>
            </form>
          )}
        </CardContent>
      </Card>
    </Box>
  );
};
