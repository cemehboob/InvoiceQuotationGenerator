import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Tabs,
  Tab,
  Card,
  CardContent,
  Grid,
  TextField,
  Button,
  Alert,
  CircularProgress,
  Divider,
  Stack,
  Paper,
  Avatar,
} from '@mui/material';
import {
  Business as BusinessIcon,
  Image as ImageIcon,
  History as HistoryIcon,
  Save as SaveIcon,
  PictureAsPdf as PdfIcon,
} from '@mui/icons-material';
import { DynamicLogoControl } from '../components/DynamicLogoControl';
import { DynamicCompanyLogControl } from '../components/DynamicCompanyLogControl';
import { companyApi } from '../api/api';
import { useAuth } from '../context/AuthContext';

export const CompanySettings = () => {
  const { user, updateCompanyInfo } = useAuth();
  const [activeTab, setActiveTab] = useState(0);
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [alert, setAlert] = useState(null);

  const [formData, setFormData] = useState({
    companyName: '',
    tradeLicenseOrCr: '',
    vatNumber: '',
    phone: '',
    email: '',
    address: '',
    currencyCode: 'BHD',
    currencyDecimals: 3,
    defaultVatRate: 10.0,
  });

  const loadProfile = async () => {
    setLoading(true);
    try {
      const response = await companyApi.getProfile();
      if (response.data.succeeded) {
        const data = response.data.data;
        setProfile(data);
        setFormData({
          companyName: data.companyName || '',
          tradeLicenseOrCr: data.tradeLicenseOrCr || '',
          vatNumber: data.vatNumber || '',
          phone: data.phone || '',
          email: data.email || '',
          address: data.address || '',
          currencyCode: data.currencyCode || 'BHD',
          currencyDecimals: data.currencyDecimals || 3,
          defaultVatRate: data.defaultVatRate || 10.0,
        });
      }
    } catch (err) {
      setAlert({ type: 'error', message: 'Failed to load company profile.' });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadProfile();
  }, []);

  const handleProfileSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    setAlert(null);
    try {
      const response = await companyApi.updateProfile(formData);
      if (response.data.succeeded) {
        setProfile(response.data.data);
        updateCompanyInfo({
          companyName: formData.companyName,
          currencyCode: formData.currencyCode,
          currencyDecimals: formData.currencyDecimals,
        });
        setAlert({ type: 'success', message: 'Company details updated successfully!' });
      }
    } catch (err) {
      setAlert({ type: 'error', message: err.response?.data?.message || 'Failed to save changes.' });
    } finally {
      setSaving(false);
    }
  };

  const handleLogoChanged = (newLogoUrl) => {
    setProfile((prev) => (prev ? { ...prev, logoUrl: newLogoUrl } : prev));
  };

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box sx={{ pb: 4 }}>
      {/* Page Title & Branding Header */}
      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 3 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
          {profile?.logoUrl || user?.logoUrl ? (
            <Box
              component="img"
              src={profile?.logoUrl || user?.logoUrl}
              alt="Company Logo"
              sx={{
                width: 54,
                height: 54,
                borderRadius: 2,
                border: '1px solid #e2e8f0',
                objectFit: 'contain',
                bgcolor: 'white',
                p: 0.5,
              }}
            />
          ) : (
            <Avatar
              sx={{
                bgcolor: 'primary.main',
                width: 54,
                height: 54,
                fontWeight: 800,
                fontSize: '1.5rem',
                borderRadius: 2,
              }}
            >
              {(profile?.companyName || user?.companyName || 'C').charAt(0)}
            </Avatar>
          )}
          <Box>
            <Typography variant="h4" fontWeight={800} color="text.primary">
              Company & Organization
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Manage dynamic company logo, corporate identity, tax profile, and operational activity logs.
            </Typography>
          </Box>
        </Box>
      </Box>

      {/* Tabs */}
      <Tabs
        value={activeTab}
        onChange={(_, val) => setActiveTab(val)}
        sx={{ borderBottom: 1, borderColor: 'divider', mb: 3 }}
      >
        <Tab icon={<ImageIcon sx={{ fontSize: 18 }} />} iconPosition="start" label="Company Logo & Branding" />
        <Tab icon={<HistoryIcon sx={{ fontSize: 18 }} />} iconPosition="start" label="Company Activity Logs" />
        <Tab icon={<BusinessIcon sx={{ fontSize: 18 }} />} iconPosition="start" label="Company Profile Details" />
      </Tabs>

      {alert && (
        <Alert severity={alert.type} sx={{ mb: 3 }} onClose={() => setAlert(null)}>
          {alert.message}
        </Alert>
      )}

      {/* Tab 0: Dynamic Logo Control */}
      {activeTab === 0 && (
        <Stack spacing={3}>
          <DynamicLogoControl currentLogo={profile?.logoUrl} onLogoChange={handleLogoChanged} />

          {/* Live Preview Cards in Real Business Contexts */}
          <Card sx={{ borderRadius: 3, border: '1px solid #e2e8f0', boxShadow: '0 4px 12px rgba(0,0,0,0.03)' }}>
            <CardContent sx={{ p: 3 }}>
              <Typography variant="h6" fontWeight={700} sx={{ mb: 1 }}>
                Live Visual Mockup Preview
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
                Here is how your dynamic logo is automatically formatted inside your generated PDFs and documents:
              </Typography>

              <Grid container spacing={3}>
                {/* PDF Header Mockup */}
                <Grid item xs={12} md={6}>
                  <Paper
                    variant="outlined"
                    sx={{
                      p: 2.5,
                      borderRadius: 2,
                      bgcolor: '#fafafa',
                      border: '1px solid #e2e8f0',
                    }}
                  >
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
                      <PdfIcon color="error" fontSize="small" />
                      <Typography variant="caption" fontWeight={700} color="text.secondary">
                        OFFICIAL TAX INVOICE & QUOTATION HEADER
                      </Typography>
                    </Box>

                    <Box
                      sx={{
                        bgcolor: 'white',
                        p: 2,
                        borderRadius: 1.5,
                        border: '1px solid #e2e8f0',
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'flex-start',
                      }}
                    >
                      <Box>
                        {profile?.logoUrl || user?.logoUrl ? (
                          <Box
                            component="img"
                            src={profile?.logoUrl || user?.logoUrl}
                            alt="Logo"
                            sx={{ maxHeight: 40, maxWidth: 120, objectFit: 'contain', mb: 1 }}
                          />
                        ) : null}
                        <Typography variant="subtitle2" fontWeight={800} color="primary.dark">
                          {formData.companyName || 'Your Business Name'}
                        </Typography>
                        <Typography variant="caption" color="text.secondary" display="block">
                          CR: {formData.tradeLicenseOrCr || 'CR-123456'} | VAT: {formData.vatNumber || '200000000000002'}
                        </Typography>
                        <Typography variant="caption" color="text.secondary" display="block">
                          {formData.email || 'billing@company.com'}
                        </Typography>
                      </Box>
                      <Box sx={{ textAlign: 'right' }}>
                        <Typography variant="h6" fontWeight={900} color="text.primary">
                          TAX INVOICE
                        </Typography>
                        <Typography variant="caption" fontWeight={700} color="primary.main">
                          INV-2026-000001
                        </Typography>
                      </Box>
                    </Box>
                  </Paper>
                </Grid>

                {/* Sidebar Mockup */}
                <Grid item xs={12} md={6}>
                  <Paper
                    variant="outlined"
                    sx={{
                      p: 2.5,
                      borderRadius: 2,
                      bgcolor: '#fafafa',
                      border: '1px solid #e2e8f0',
                    }}
                  >
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
                      <BusinessIcon color="primary" fontSize="small" />
                      <Typography variant="caption" fontWeight={700} color="text.secondary">
                        APP SIDEBAR & NAVIGATION BRANDING
                      </Typography>
                    </Box>

                    <Box
                      sx={{
                        bgcolor: 'white',
                        p: 2,
                        borderRadius: 1.5,
                        border: '1px solid #e2e8f0',
                        display: 'flex',
                        alignItems: 'center',
                        gap: 1.5,
                      }}
                    >
                      {profile?.logoUrl || user?.logoUrl ? (
                        <Box
                          component="img"
                          src={profile?.logoUrl || user?.logoUrl}
                          alt="Sidebar Logo"
                          sx={{ width: 40, height: 40, objectFit: 'contain', borderRadius: 1.5, border: '1px solid #e2e8f0', p: 0.5 }}
                        />
                      ) : (
                        <Box
                          sx={{
                            width: 38,
                            height: 38,
                            borderRadius: 1.5,
                            bgcolor: 'primary.main',
                            color: 'white',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            fontWeight: 800,
                          }}
                        >
                          {(formData.companyName || 'I').charAt(0)}
                        </Box>
                      )}
                      <Box>
                        <Typography variant="body2" fontWeight={700}>
                          {formData.companyName || 'My Organization'}
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          Invoxa Multi-Tenant SaaS
                        </Typography>
                      </Box>
                    </Box>
                  </Paper>
                </Grid>
              </Grid>
            </CardContent>
          </Card>
        </Stack>
      )}

      {/* Tab 1: Dynamic Activity Log Control */}
      {activeTab === 1 && <DynamicCompanyLogControl />}

      {/* Tab 2: Company Profile Form */}
      {activeTab === 2 && (
        <Card sx={{ borderRadius: 3, border: '1px solid #e2e8f0', boxShadow: '0 4px 12px rgba(0,0,0,0.03)' }}>
          <CardContent sx={{ p: 3 }}>
            <Typography variant="h6" fontWeight={700} sx={{ mb: 1 }}>
              Business Profile & Tax Settings
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
              Update your corporate credentials, Commercial Registration (CR), VAT number, and default currency.
            </Typography>

            <form onSubmit={handleProfileSubmit}>
              <Grid container spacing={2.5}>
                <Grid item xs={12} sm={6}>
                  <TextField
                    label="Company Name"
                    fullWidth
                    required
                    value={formData.companyName}
                    onChange={(e) => setFormData({ ...formData, companyName: e.target.value })}
                  />
                </Grid>

                <Grid item xs={12} sm={6}>
                  <TextField
                    label="Commercial Registration (CR / Trade License)"
                    fullWidth
                    value={formData.tradeLicenseOrCr}
                    onChange={(e) => setFormData({ ...formData, tradeLicenseOrCr: e.target.value })}
                    placeholder="e.g. CR-984321-01"
                  />
                </Grid>

                <Grid item xs={12} sm={6}>
                  <TextField
                    label="VAT Account Number (Tax ID)"
                    fullWidth
                    value={formData.vatNumber}
                    onChange={(e) => setFormData({ ...formData, vatNumber: e.target.value })}
                    placeholder="e.g. 200019283700002"
                  />
                </Grid>

                <Grid item xs={12} sm={6}>
                  <TextField
                    label="Business Email"
                    type="email"
                    fullWidth
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  />
                </Grid>

                <Grid item xs={12} sm={6}>
                  <TextField
                    label="Business Phone"
                    fullWidth
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  />
                </Grid>

                <Grid item xs={12} sm={6}>
                  <TextField
                    label="Primary Currency"
                    fullWidth
                    value={formData.currencyCode}
                    onChange={(e) => setFormData({ ...formData, currencyCode: e.target.value.toUpperCase() })}
                    helperText="e.g. BHD, SAR, AED, USD, EUR"
                  />
                </Grid>

                <Grid item xs={12} sm={6}>
                  <TextField
                    label="Currency Decimal Places"
                    type="number"
                    fullWidth
                    value={formData.currencyDecimals}
                    onChange={(e) => setFormData({ ...formData, currencyDecimals: parseInt(e.target.value) || 2 })}
                    helperText="3 for Bahrain (BHD), 2 for international"
                  />
                </Grid>

                <Grid item xs={12} sm={6}>
                  <TextField
                    label="Default VAT Rate (%)"
                    type="number"
                    fullWidth
                    value={formData.defaultVatRate}
                    onChange={(e) => setFormData({ ...formData, defaultVatRate: parseFloat(e.target.value) || 0 })}
                    helperText="10.00% default for Bahrain / GCC"
                  />
                </Grid>

                <Grid item xs={12}>
                  <TextField
                    label="Physical Office / Registered Address"
                    multiline
                    rows={2}
                    fullWidth
                    value={formData.address}
                    onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                    placeholder="Building, Road, Block, City, Country"
                  />
                </Grid>

                <Grid item xs={12}>
                  <Divider sx={{ my: 1 }} />
                  <Button
                    type="submit"
                    variant="contained"
                    size="large"
                    disabled={saving}
                    startIcon={saving ? <CircularProgress size={18} color="inherit" /> : <SaveIcon />}
                    sx={{ px: 4 }}
                  >
                    Save Company Profile
                  </Button>
                </Grid>
              </Grid>
            </form>
          </CardContent>
        </Card>
      )}
    </Box>
  );
};

