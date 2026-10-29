import React, { useState, useEffect } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  TextField,
  InputAdornment,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Chip,
  IconButton,
  Button,
  ButtonGroup,
  CircularProgress,
  Tooltip,
  Paper,
  Stack,
} from '@mui/material';
import {
  Search as SearchIcon,
  Refresh as RefreshIcon,
  History as HistoryIcon,
  Receipt as InvoiceIcon,
  RequestQuote as QuoteIcon,
  Payment as PaymentIcon,
  Person as CustomerIcon,
  FilterList as FilterIcon,
} from '@mui/icons-material';
import { companyApi } from '../api/api';
import { useAuth } from '../context/AuthContext';

const CATEGORIES = ['All', 'Quotation', 'Invoice', 'Payment', 'Customer'];

export const DynamicCompanyLogControl = () => {
  const { user } = useAuth();
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [searchTerm, setSearchTerm] = useState('');

  const fetchLogs = async () => {
    setLoading(true);
    try {
      const response = await companyApi.getLogs({
        category: selectedCategory,
        search: searchTerm,
      });
      if (response.data.succeeded) {
        setLogs(response.data.data);
      }
    } catch (err) {
      console.error('Failed to fetch activity logs', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLogs();
  }, [selectedCategory]);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    fetchLogs();
  };

  const getCategoryIcon = (type) => {
    switch (type) {
      case 'Quotation':
        return <QuoteIcon fontSize="small" color="primary" />;
      case 'Invoice':
        return <InvoiceIcon fontSize="small" color="secondary" />;
      case 'Payment':
        return <PaymentIcon fontSize="small" color="success" />;
      case 'Customer':
        return <CustomerIcon fontSize="small" color="info" />;
      default:
        return <HistoryIcon fontSize="small" />;
    }
  };

  const getCategoryColor = (type) => {
    switch (type) {
      case 'Quotation':
        return 'primary';
      case 'Invoice':
        return 'secondary';
      case 'Payment':
        return 'success';
      case 'Customer':
        return 'info';
      default:
        return 'default';
    }
  };

  // Metric counts
  const quotationCount = logs.filter((l) => l.entityType === 'Quotation').length;
  const invoiceCount = logs.filter((l) => l.entityType === 'Invoice').length;
  const paymentCount = logs.filter((l) => l.entityType === 'Payment').length;

  return (
    <Card sx={{ borderRadius: 3, border: '1px solid #e2e8f0', boxShadow: '0 4px 12px rgba(0,0,0,0.03)' }}>
      <CardContent sx={{ p: 3 }}>
        {/* Header Title */}
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2.5 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
            <Box
              sx={{
                width: 42,
                height: 42,
                borderRadius: 2,
                bgcolor: '#f3e8ff',
                color: 'secondary.main',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <HistoryIcon />
            </Box>
            <Box>
              <Typography variant="h6" fontWeight={700}>
                Dynamic Company Activity Logs
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Real-time operational audit trail for estimates, invoices, client records, and payment settlements.
              </Typography>
            </Box>
          </Box>

          <Tooltip title="Refresh Logs">
            <IconButton onClick={fetchLogs} disabled={loading} color="primary">
              <RefreshIcon sx={{ animation: loading ? 'spin 1s linear infinite' : 'none' }} />
            </IconButton>
          </Tooltip>
        </Box>

        {/* Dynamic Metric Pills */}
        <Stack direction="row" spacing={1.5} sx={{ mb: 2.5 }} flexWrap="wrap">
          <Chip label={`Total Events: ${logs.length}`} variant="outlined" />
          <Chip label={`Quotations: ${quotationCount}`} color="primary" variant="outlined" size="small" />
          <Chip label={`Invoices: ${invoiceCount}`} color="secondary" variant="outlined" size="small" />
          <Chip label={`Settlements: ${paymentCount}`} color="success" variant="outlined" size="small" />
        </Stack>

        {/* Filter and Search Bar */}
        <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} sx={{ mb: 2.5 }} alignItems="center">
          {/* Category Filter Chips */}
          <ButtonGroup variant="outlined" size="small">
            {CATEGORIES.map((cat) => (
              <Button
                key={cat}
                variant={selectedCategory === cat ? 'contained' : 'outlined'}
                onClick={() => setSelectedCategory(cat)}
              >
                {cat}
              </Button>
            ))}
          </ButtonGroup>

          {/* Search Field */}
          <Box component="form" onSubmit={handleSearchSubmit} sx={{ flexGrow: 1, width: { xs: '100%', sm: 'auto' } }}>
            <TextField
              size="small"
              fullWidth
              placeholder="Search reference, client name, description..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <SearchIcon fontSize="small" color="action" />
                  </InputAdornment>
                ),
              }}
            />
          </Box>
        </Stack>

        {/* Dynamic Activity Table */}
        <TableContainer component={Paper} variant="outlined" sx={{ borderRadius: 2 }}>
          <Table size="small">
            <TableHead sx={{ bgcolor: '#f8fafc' }}>
              <TableRow>
                <TableCell sx={{ fontWeight: 700 }}>Type</TableCell>
                <TableCell sx={{ fontWeight: 700 }}>Reference</TableCell>
                <TableCell sx={{ fontWeight: 700 }}>Action & Details</TableCell>
                <TableCell sx={{ fontWeight: 700 }}>Client</TableCell>
                <TableCell sx={{ fontWeight: 700 }} align="right">Amount</TableCell>
                <TableCell sx={{ fontWeight: 700 }} align="right">Date & Time</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={6} align="center" sx={{ py: 4 }}>
                    <CircularProgress size={24} />
                    <Typography variant="body2" sx={{ mt: 1 }} color="text.secondary">
                      Loading activity trail...
                    </Typography>
                  </TableCell>
                </TableRow>
              ) : logs.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} align="center" sx={{ py: 4 }}>
                    <Typography variant="body2" color="text.secondary">
                      No activity logs match the selected filter.
                    </Typography>
                  </TableCell>
                </TableRow>
              ) : (
                logs.map((log) => (
                  <TableRow key={log.id + log.action} hover>
                    <TableCell>
                      <Chip
                        icon={getCategoryIcon(log.entityType)}
                        label={log.entityType}
                        size="small"
                        color={getCategoryColor(log.entityType)}
                        variant="outlined"
                        sx={{ fontSize: '0.75rem' }}
                      />
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2" fontWeight={700}>
                        {log.referenceNo}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2" fontWeight={600}>
                        {log.action}
                      </Typography>
                      <Typography variant="caption" color="text.secondary" display="block">
                        {log.description}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2">
                        {log.customerName || '—'}
                      </Typography>
                    </TableCell>
                    <TableCell align="right">
                      {log.amount !== null && log.amount !== undefined ? (
                        <Typography variant="body2" fontWeight={700} color="primary.main">
                          {Number(log.amount).toFixed(user?.currencyDecimals || 3)} {user?.currencyCode || 'BHD'}
                        </Typography>
                      ) : (
                        '—'
                      )}
                    </TableCell>
                    <TableCell align="right">
                      <Typography variant="caption" color="text.secondary">
                        {new Date(log.timestampUtc).toLocaleString('en-GB', {
                          day: '2-digit',
                          month: 'short',
                          year: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </Typography>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </TableContainer>
      </CardContent>
    </Card>
  );
};

