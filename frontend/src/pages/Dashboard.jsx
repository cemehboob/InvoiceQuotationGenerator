import React, { useEffect, useState } from 'react';
import {
  Box,
  Grid,
  Card,
  CardContent,
  Typography,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  CircularProgress,
  Alert,
  Button,
} from '@mui/material';
import {
  TrendingUp,
  Receipt,
  HourglassEmpty,
  Warning,
  Add,
  People,
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import { dashboardApi } from '../api/api';
import { CurrencyText } from '../components/CurrencyText';
import { StatusChip } from '../components/StatusChip';

export const Dashboard = () => {
  const [metrics, setMetrics] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const loadMetrics = async () => {
    try {
      setLoading(true);
      const res = await dashboardApi.getMetrics();
      setMetrics(res.data.data);
    } catch (err) {
      setError('Failed to fetch dashboard metrics. Is the backend running?');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadMetrics();
  }, []);

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', p: 8 }}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box>
      {/* Top Banner & Quick Actions */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Box>
          <Typography variant="h5" sx={{ fontWeight: 800 }}>
            Executive Dashboard
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Real-time financial pulse, outstanding balances, and quote-to-cash pipeline.
          </Typography>
        </Box>
        <Box sx={{ display: 'flex', gap: 1.5 }}>
          <Button
            variant="outlined"
            startIcon={<Add />}
            onClick={() => navigate('/quotations?action=new')}
          >
            New Quotation
          </Button>
          <Button
            variant="contained"
            startIcon={<Add />}
            onClick={() => navigate('/invoices?action=new')}
          >
            Create Invoice
          </Button>
        </Box>
      </Box>

      {error && (
        <Alert severity="warning" sx={{ mb: 3 }}>
          {error} (Displaying offline demo preview if backend is initializing)
        </Alert>
      )}

      {/* KPI Metric Cards */}
      <Grid container spacing={2.5} sx={{ mb: 3 }}>
        <Grid item xs={12} sm={6} md={3}>
          <Card sx={{ borderLeft: '4px solid #0284c7' }}>
            <CardContent>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <Typography variant="body2" color="text.secondary" fontWeight={600}>
                  This Month's Sales
                </Typography>
                <TrendingUp sx={{ color: 'primary.main' }} />
              </Box>
              <Typography variant="h5" sx={{ mt: 1, fontWeight: 700 }}>
                <CurrencyText amount={metrics?.monthlySales ?? 0} />
              </Typography>
              <Typography variant="caption" color="text.secondary">
                Today: <CurrencyText amount={metrics?.todaySales ?? 0} />
              </Typography>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <Card sx={{ borderLeft: '4px solid #ef4444' }}>
            <CardContent>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <Typography variant="body2" color="text.secondary" fontWeight={600}>
                  Outstanding Balance
                </Typography>
                <Warning sx={{ color: 'error.main' }} />
              </Box>
              <Typography variant="h5" sx={{ mt: 1, fontWeight: 700, color: 'error.main' }}>
                <CurrencyText amount={metrics?.outstandingBalance ?? 0} />
              </Typography>
              <Typography variant="caption" color="text.secondary">
                {metrics?.pendingInvoicesCount ?? 0} pending invoices
              </Typography>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <Card sx={{ borderLeft: '4px solid #10b981' }}>
            <CardContent>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <Typography variant="body2" color="text.secondary" fontWeight={600}>
                  Paid Invoices
                </Typography>
                <Receipt sx={{ color: 'success.main' }} />
              </Box>
              <Typography variant="h5" sx={{ mt: 1, fontWeight: 700, color: 'success.main' }}>
                {metrics?.paidInvoicesCount ?? 0}
              </Typography>
              <Typography variant="caption" color="text.secondary">
                Settled in full
              </Typography>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <Card sx={{ borderLeft: '4px solid #6366f1' }}>
            <CardContent>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <Typography variant="body2" color="text.secondary" fontWeight={600}>
                  Active Clients
                </Typography>
                <People sx={{ color: 'secondary.main' }} />
              </Box>
              <Typography variant="h5" sx={{ mt: 1, fontWeight: 700 }}>
                {metrics?.totalCustomersCount ?? 0}
              </Typography>
              <Typography variant="caption" color="text.secondary">
                Total customer accounts
              </Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Main Tables Row */}
      <Grid container spacing={3}>
        {/* Recent Invoices */}
        <Grid item xs={12} md={8}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                <Typography variant="h6" fontWeight={700}>
                  Recent Invoices
                </Typography>
                <Button size="small" onClick={() => navigate('/invoices')}>
                  View All
                </Button>
              </Box>
              <TableContainer component={Paper} elevation={0} sx={{ border: '1px solid #f1f5f9' }}>
                <Table size="small">
                  <TableHead sx={{ bgcolor: '#f8fafc' }}>
                    <TableRow>
                      <TableCell sx={{ fontWeight: 600 }}>Invoice #</TableCell>
                      <TableCell sx={{ fontWeight: 600 }}>Customer</TableCell>
                      <TableCell sx={{ fontWeight: 600 }}>Date</TableCell>
                      <TableCell align="right" sx={{ fontWeight: 600 }}>Amount</TableCell>
                      <TableCell align="center" sx={{ fontWeight: 600 }}>Status</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {metrics?.recentInvoices?.length ? (
                      metrics.recentInvoices.map((inv) => (
                        <TableRow key={inv.invoiceId} hover sx={{ cursor: 'pointer' }} onClick={() => navigate('/invoices')}>
                          <TableCell sx={{ fontWeight: 600, color: 'primary.main' }}>{inv.invoiceNo}</TableCell>
                          <TableCell>{inv.customerName}</TableCell>
                          <TableCell>{new Date(inv.invoiceDate).toLocaleDateString()}</TableCell>
                          <TableCell align="right" sx={{ fontWeight: 600 }}>
                            <CurrencyText amount={inv.totalAmount} />
                          </TableCell>
                          <TableCell align="center">
                            <StatusChip status={inv.status} />
                          </TableCell>
                        </TableRow>
                      ))
                    ) : (
                      <TableRow>
                        <TableCell colSpan={5} align="center" sx={{ py: 3, color: 'text.secondary' }}>
                          No invoices generated yet.
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </TableContainer>
            </CardContent>
          </Card>
        </Grid>

        {/* Top Spending Customers */}
        <Grid item xs={12} md={4}>
          <Card>
            <CardContent>
              <Typography variant="h6" fontWeight={700} sx={{ mb: 2 }}>
                Top Clients
              </Typography>
              <TableContainer component={Paper} elevation={0} sx={{ border: '1px solid #f1f5f9' }}>
                <Table size="small">
                  <TableHead sx={{ bgcolor: '#f8fafc' }}>
                    <TableRow>
                      <TableCell sx={{ fontWeight: 600 }}>Client</TableCell>
                      <TableCell align="right" sx={{ fontWeight: 600 }}>Total Billed</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {metrics?.topCustomers?.length ? (
                      metrics.topCustomers.map((cust) => (
                        <TableRow key={cust.customerId}>
                          <TableCell>
                            <Typography variant="body2" fontWeight={600}>
                              {cust.customerName}
                            </Typography>
                            <Typography variant="caption" color="text.secondary">
                              {cust.totalInvoices} invoices
                            </Typography>
                          </TableCell>
                          <TableCell align="right" sx={{ fontWeight: 600 }}>
                            <CurrencyText amount={cust.totalSpent} />
                          </TableCell>
                        </TableRow>
                      ))
                    ) : (
                      <TableRow>
                        <TableCell colSpan={2} align="center" sx={{ py: 3, color: 'text.secondary' }}>
                          No customer transactions yet.
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </TableContainer>
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Box>
  );
};
