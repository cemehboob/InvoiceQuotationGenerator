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
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Link,
} from '@mui/material';
import { Settings as SettingsIcon } from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { getApiBaseUrl, setApiBaseUrl, resetApiBaseUrl, isNativePlatform } from '../utils/platform';

export const Login = () => {
  const [tab, setTab] = useState(0);
  const [error, setError] = useState('');
  const { login, register, loading } = useAuth();
  const navigate = useNavigate();

  // Server URL settings dialog for Mobile / Custom Deployments
  const [serverModalOpen, setServerModalOpen] = useState(false);
  const [customApiUrl, setCustomApiUrl] = useState(getApiBaseUrl());

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

          <Box sx={{ mt: 3, pt: 2, borderTop: '1px solid #f1f5f9', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <Typography variant="caption" color="text.secondary">
              Deployment: {isNativePlatform() ? 'Native Mobile App' : 'Cloud Web'}
            </Typography>
            <Link
              component="button"
              variant="caption"
              onClick={() => {
                setCustomApiUrl(getApiBaseUrl());
                setServerModalOpen(true);
              }}
              sx={{ display: 'inline-flex', alignItems: 'center', gap: 0.5, color: 'text.secondary' }}
            >
              <SettingsIcon sx={{ fontSize: 14 }} />
              API Server
            </Link>
          </Box>
        </CardContent>
      </Card>

      {/* Server Endpoint Settings Modal for Mobile / Self-Hosted */}
      <Dialog open={serverModalOpen} onClose={() => setServerModalOpen(false)} maxWidth="xs" fullWidth>
        <DialogTitle sx={{ fontWeight: 700 }}>API Server Settings</DialogTitle>
        <DialogContent>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
            Configure the backend API server URL. On Android Emulators, use <code>http://10.0.2.2:5000/api</code>. For production, specify your hosted domain (e.g. <code>https://api.yourdomain.com/api</code>).
          </Typography>
          <TextField
            label="API Base URL"
            fullWidth
            value={customApiUrl}
            onChange={(e) => setCustomApiUrl(e.target.value)}
            placeholder="https://api.invoxa.com/api"
            size="small"
          />
        </DialogContent>
        <DialogActions sx={{ p: 2, pt: 0 }}>
          <Button
            size="small"
            color="inherit"
            onClick={() => {
              resetApiBaseUrl();
              setCustomApiUrl(getApiBaseUrl());
              setServerModalOpen(false);
            }}
          >
            Reset Default
          </Button>
          <Button
            variant="contained"
            size="small"
            onClick={() => {
              setApiBaseUrl(customApiUrl);
              setServerModalOpen(false);
            }}
          >
            Save
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};
