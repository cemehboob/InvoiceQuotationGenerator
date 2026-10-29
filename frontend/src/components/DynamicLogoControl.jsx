import React, { useState, useRef, useEffect } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Button,
  TextField,
  Tabs,
  Tab,
  Stack,
  Alert,
  IconButton,
  CircularProgress,
  Chip,
  Paper,
  Tooltip,
} from '@mui/material';
import {
  CloudUpload as UploadIcon,
  Link as LinkIcon,
  DeleteOutline as DeleteIcon,
  CheckCircle as CheckIcon,
  RestartAlt as ResetIcon,
  Visibility as PreviewIcon,
  Image as ImageIcon,
} from '@mui/icons-material';
import { companyApi } from '../api/api';
import { useAuth } from '../context/AuthContext';

const PRESET_LOGOS = [
  {
    name: 'Tech Blue',
    url: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=200&auto=format&fit=crop&q=80',
  },
  {
    name: 'Modern Geometric',
    url: 'https://images.unsplash.com/photo-1599305445671-ac291c95aaa9?w=200&auto=format&fit=crop&q=80',
  },
  {
    name: 'Minimal Circle',
    url: 'https://images.unsplash.com/photo-1516876437184-593fda40c7ce?w=200&auto=format&fit=crop&q=80',
  },
];

export const DynamicLogoControl = ({ currentLogo, onLogoChange }) => {
  const { user, updateCompanyLogo } = useAuth();
  const [tab, setTab] = useState(0); // 0: Upload File, 1: Image URL, 2: Presets
  const [previewUrl, setPreviewUrl] = useState(currentLogo || user?.logoUrl || '');
  const [urlInput, setUrlInput] = useState('');
  const [fileDetails, setFileDetails] = useState(null);
  const [loading, setLoading] = useState(false);
  const [alert, setAlert] = useState(null);
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef(null);

  useEffect(() => {
    if (currentLogo !== undefined) {
      setPreviewUrl(currentLogo || '');
    } else if (user?.logoUrl) {
      setPreviewUrl(user.logoUrl);
    }
  }, [currentLogo, user?.logoUrl]);

  const handleFileProcess = (file) => {
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      setAlert({ type: 'error', message: 'Please select an image file (PNG, JPG, SVG, WebP).' });
      return;
    }

    if (file.size > 2 * 1024 * 1024) {
      setAlert({ type: 'error', message: 'Image size should be less than 2MB.' });
      return;
    }

    const reader = new FileReader();
    reader.onload = (e) => {
      const base64 = e.target.result;
      setPreviewUrl(base64);
      setFileDetails({
        name: file.name,
        size: (file.size / 1024).toFixed(1) + ' KB',
        type: file.type,
      });
      setAlert({ type: 'info', message: 'Image loaded in preview. Click "Save & Apply" to persist.' });
    };
    reader.readAsDataURL(file);
  };

  const handleFileDrop = (e) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFileProcess(e.dataTransfer.files[0]);
    }
  };

  const handleApplyUrl = () => {
    if (!urlInput.trim()) {
      setAlert({ type: 'error', message: 'Please enter a valid image URL.' });
      return;
    }
    setPreviewUrl(urlInput.trim());
    setFileDetails(null);
    setAlert({ type: 'info', message: 'Previewing URL. Click "Save & Apply" to persist.' });
  };

  const handleSelectPreset = (presetUrl) => {
    setPreviewUrl(presetUrl);
    setFileDetails(null);
    setAlert({ type: 'info', message: 'Preset loaded. Click "Save & Apply" to persist.' });
  };

  const handleSaveLogo = async () => {
    setLoading(true);
    setAlert(null);
    try {
      const response = await companyApi.updateLogo(previewUrl);
      if (response.data.succeeded) {
        updateCompanyLogo(previewUrl);
        if (onLogoChange) onLogoChange(previewUrl);
        setAlert({ type: 'success', message: 'Company logo updated and applied across the platform!' });
      } else {
        setAlert({ type: 'error', message: response.data.message || 'Failed to save logo.' });
      }
    } catch (err) {
      setAlert({ type: 'error', message: err.response?.data?.message || 'Error saving company logo.' });
    } finally {
      setLoading(false);
    }
  };

  const handleRemoveLogo = async () => {
    if (!window.confirm('Are you sure you want to remove the company logo?')) return;
    setLoading(true);
    setAlert(null);
    try {
      const response = await companyApi.removeLogo();
      if (response.data.succeeded) {
        setPreviewUrl('');
        setFileDetails(null);
        setUrlInput('');
        updateCompanyLogo(null);
        if (onLogoChange) onLogoChange(null);
        setAlert({ type: 'success', message: 'Company logo removed. System default branding active.' });
      }
    } catch (err) {
      setAlert({ type: 'error', message: err.response?.data?.message || 'Failed to remove logo.' });
    } finally {
      setLoading(false);
    }
  };

  const handleReset = () => {
    setPreviewUrl(currentLogo || user?.logoUrl || '');
    setFileDetails(null);
    setUrlInput('');
    setAlert(null);
  };

  const hasUnsavedChanges = previewUrl !== (user?.logoUrl || '');

  return (
    <Card sx={{ borderRadius: 3, border: '1px solid #e2e8f0', boxShadow: '0 4px 12px rgba(0,0,0,0.03)' }}>
      <CardContent sx={{ p: 3 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
            <Box
              sx={{
                width: 42,
                height: 42,
                borderRadius: 2,
                bgcolor: '#e0f2fe',
                color: 'primary.main',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <ImageIcon />
            </Box>
            <Box>
              <Typography variant="h6" fontWeight={700}>
                Dynamic Company Logo Control
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Upload or change your business logo. It updates live on your navbar, invoices, and quotations.
              </Typography>
            </Box>
          </Box>

          {user?.logoUrl && (
            <Chip
              icon={<CheckIcon color="success" />}
              label="Logo Active"
              color="success"
              variant="outlined"
              size="small"
            />
          )}
        </Box>

        {alert && (
          <Alert severity={alert.type} sx={{ mb: 2.5 }} onClose={() => setAlert(null)}>
            {alert.message}
          </Alert>
        )}

        <Stack direction={{ xs: 'column', md: 'row' }} spacing={3} alignItems="flex-start">
          {/* Left: Input Selection Tabs */}
          <Box sx={{ flex: 1, width: '100%' }}>
            <Tabs
              value={tab}
              onChange={(_, v) => setTab(v)}
              sx={{ borderBottom: 1, borderColor: 'divider', mb: 2 }}
            >
              <Tab icon={<UploadIcon sx={{ fontSize: 18 }} />} iconPosition="start" label="Upload File" />
              <Tab icon={<LinkIcon sx={{ fontSize: 18 }} />} iconPosition="start" label="Image URL" />
              <Tab icon={<PreviewIcon sx={{ fontSize: 18 }} />} iconPosition="start" label="Presets" />
            </Tabs>

            {/* Tab 0: File Dropzone */}
            {tab === 0 && (
              <Box>
                <input
                  type="file"
                  accept="image/png, image/jpeg, image/svg+xml, image/webp"
                  ref={fileInputRef}
                  style={{ display: 'none' }}
                  onChange={(e) => handleFileProcess(e.target.files[0])}
                />
                <Paper
                  variant="outlined"
                  onDragOver={(e) => {
                    e.preventDefault();
                    setIsDragging(true);
                  }}
                  onDragLeave={() => setIsDragging(false)}
                  onDrop={handleFileDrop}
                  onClick={() => fileInputRef.current?.click()}
                  sx={{
                    p: 3,
                    textAlign: 'center',
                    cursor: 'pointer',
                    borderRadius: 2,
                    borderStyle: 'dashed',
                    borderWidth: 2,
                    borderColor: isDragging ? 'primary.main' : '#cbd5e1',
                    bgcolor: isDragging ? '#f0f9ff' : '#f8fafc',
                    transition: 'all 0.2s ease',
                    '&:hover': {
                      borderColor: 'primary.main',
                      bgcolor: '#f0f9ff',
                    },
                  }}
                >
                  <UploadIcon sx={{ fontSize: 40, color: 'primary.main', mb: 1 }} />
                  <Typography variant="body1" fontWeight={600}>
                    Click to browse or drag & drop image here
                  </Typography>
                  <Typography variant="caption" color="text.secondary" display="block" sx={{ mt: 0.5 }}>
                    Supports PNG, JPG, WebP, or SVG (Max 2MB). Transparent background recommended.
                  </Typography>
                </Paper>

                {fileDetails && (
                  <Box sx={{ mt: 1.5, p: 1, bgcolor: '#f1f5f9', borderRadius: 1.5, display: 'flex', gap: 2 }}>
                    <Typography variant="caption"><strong>File:</strong> {fileDetails.name}</Typography>
                    <Typography variant="caption"><strong>Size:</strong> {fileDetails.size}</Typography>
                  </Box>
                )}
              </Box>
            )}

            {/* Tab 1: Image URL Input */}
            {tab === 1 && (
              <Box sx={{ pt: 1 }}>
                <TextField
                  fullWidth
                  size="small"
                  label="Direct Image URL (HTTPS)"
                  placeholder="https://example.com/logo.png"
                  value={urlInput}
                  onChange={(e) => setUrlInput(e.target.value)}
                  sx={{ mb: 1.5 }}
                />
                <Button variant="outlined" size="small" onClick={handleApplyUrl} startIcon={<LinkIcon />}>
                  Load from URL
                </Button>
              </Box>
            )}

            {/* Tab 2: Preset Logos */}
            {tab === 2 && (
              <Box sx={{ pt: 1 }}>
                <Typography variant="body2" color="text.secondary" sx={{ mb: 1.5 }}>
                  Choose a sample business brand to quickly test live PDF and UI rendering:
                </Typography>
                <Stack direction="row" spacing={1.5}>
                  {PRESET_LOGOS.map((preset) => (
                    <Box
                      key={preset.name}
                      onClick={() => handleSelectPreset(preset.url)}
                      sx={{
                        p: 1,
                        border: '1px solid #e2e8f0',
                        borderRadius: 2,
                        cursor: 'pointer',
                        textAlign: 'center',
                        bgcolor: '#f8fafc',
                        '&:hover': { borderColor: 'primary.main', bgcolor: '#f0f9ff' },
                      }}
                    >
                      <Box
                        component="img"
                        src={preset.url}
                        alt={preset.name}
                        sx={{ width: 60, height: 40, objectFit: 'contain', borderRadius: 1, mb: 0.5 }}
                      />
                      <Typography variant="caption" display="block">
                        {preset.name}
                      </Typography>
                    </Box>
                  ))}
                </Stack>
              </Box>
            )}
          </Box>

          {/* Right: Live Interactive Preview Container */}
          <Box
            sx={{
              width: { xs: '100%', md: 280 },
              p: 2,
              borderRadius: 2,
              bgcolor: '#f8fafc',
              border: '1px solid #e2e8f0',
              textAlign: 'center',
            }}
          >
            <Typography variant="caption" fontWeight={700} color="text.secondary" sx={{ textTransform: 'uppercase', letterSpacing: 0.5, mb: 1.5, display: 'block' }}>
              Dynamic Live Preview
            </Typography>

            <Box
              sx={{
                height: 120,
                width: '100%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                bgcolor: 'white',
                border: '1px dashed #cbd5e1',
                borderRadius: 2,
                p: 1.5,
                mb: 2,
                position: 'relative',
              }}
            >
              {previewUrl ? (
                <Box
                  component="img"
                  src={previewUrl}
                  alt="Company Logo Preview"
                  onError={() => setAlert({ type: 'error', message: 'Unable to render image from provided source.' })}
                  sx={{
                    maxHeight: '100%',
                    maxWidth: '100%',
                    objectFit: 'contain',
                  }}
                />
              ) : (
                <Box sx={{ color: 'text.disabled' }}>
                  <ImageIcon sx={{ fontSize: 36, mb: 0.5 }} />
                  <Typography variant="caption" display="block">
                    No logo selected
                  </Typography>
                </Box>
              )}
            </Box>

            {/* Context Badge */}
            <Typography variant="caption" color="text.secondary" display="block" sx={{ mb: 2 }}>
              Used in Header, Quotation PDFs & Tax Invoice Headers.
            </Typography>

            {/* Action Buttons */}
            <Stack spacing={1}>
              <Button
                variant="contained"
                fullWidth
                disabled={loading || !previewUrl || !hasUnsavedChanges}
                onClick={handleSaveLogo}
                startIcon={loading ? <CircularProgress size={16} color="inherit" /> : <CheckIcon />}
              >
                Save & Apply Logo
              </Button>

              <Stack direction="row" spacing={1}>
                {user?.logoUrl && (
                  <Button
                    variant="outlined"
                    color="error"
                    size="small"
                    fullWidth
                    disabled={loading}
                    onClick={handleRemoveLogo}
                    startIcon={<DeleteIcon />}
                  >
                    Remove
                  </Button>
                )}
                {hasUnsavedChanges && (
                  <Button
                    variant="text"
                    size="small"
                    fullWidth
                    onClick={handleReset}
                    startIcon={<ResetIcon />}
                  >
                    Reset
                  </Button>
                )}
              </Stack>
            </Stack>
          </Box>
        </Stack>
      </CardContent>
    </Card>
  );
};

