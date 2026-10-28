import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  CircularProgress,
  Chip,
} from '@mui/material';
import { paymentsApi } from '../api/api';
import { CurrencyText } from '../components/CurrencyText';

const METHOD_LABELS = {
  1: { label: 'Cash', color: 'default' },
  2: { label: 'Bank Transfer', color: 'info' },
  3: { label: 'BenefitPay', color: 'primary' },
  4: { label: 'Credit Card', color: 'secondary' },
  5: { label: 'Online Gateway', color: 'success' },
};

export const Payments = () => {
  const [payments, setPayments] = useState([]);
  const [loading, setLoading] = useState(true);

  const loadPayments = async () => {
    try {
      setLoading(true);
      const res = await paymentsApi.getAll();
      setPayments(res.data.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadPayments();
  }, []);

  return (
    <Box>
      <Box sx={{ mb: 3 }}>
        <Typography variant="h5" fontWeight={800}>
          Payment Transactions
        </Typography>
        <Typography variant="body2" color="text.secondary">
          Audit trail of incoming customer settlements, BenefitPay transfers, and bank deposits.
        </Typography>
      </Box>

      <TableContainer component={Paper} elevation={0} sx={{ border: '1px solid #e2e8f0', borderRadius: 2 }}>
        <Table>
          <TableHead sx={{ bgcolor: '#f8fafc' }}>
            <TableRow>
              <TableCell sx={{ fontWeight: 600 }}>Payment Date</TableCell>
              <TableCell sx={{ fontWeight: 600 }}>Invoice #</TableCell>
              <TableCell sx={{ fontWeight: 600 }}>Method</TableCell>
              <TableCell sx={{ fontWeight: 600 }}>Reference / Trx ID</TableCell>
              <TableCell align="right" sx={{ fontWeight: 600 }}>Settled Amount</TableCell>
              <TableCell sx={{ fontWeight: 600 }}>Notes</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={6} align="center" sx={{ py: 4 }}>
                  <CircularProgress size={28} />
                </TableCell>
              </TableRow>
            ) : payments.length ? (
              payments.map((p) => {
                const methodConfig = METHOD_LABELS[p.paymentMethod] || { label: 'Other', color: 'default' };
                return (
                  <TableRow key={p.id} hover>
                    <TableCell>{new Date(p.paymentDate).toLocaleDateString()}</TableCell>
                    <TableCell sx={{ fontWeight: 700, color: 'primary.main' }}>
                      {p.invoiceNo}
                    </TableCell>
                    <TableCell>
                      <Chip
                        label={methodConfig.label}
                        color={methodConfig.color}
                        size="small"
                        sx={{ fontWeight: 600, fontSize: '0.75rem' }}
                      />
                    </TableCell>
                    <TableCell sx={{ fontFamily: 'monospace', fontWeight: 600 }}>
                      {p.referenceNo || '—'}
                    </TableCell>
                    <TableCell align="right" sx={{ fontWeight: 700, color: 'success.main' }}>
                      <CurrencyText amount={p.amount} />
                    </TableCell>
                    <TableCell sx={{ color: 'text.secondary', fontSize: '0.85rem' }}>
                      {p.notes || '—'}
                    </TableCell>
                  </TableRow>
                );
              })
            ) : (
              <TableRow>
                <TableCell colSpan={6} align="center" sx={{ py: 4, color: 'text.secondary' }}>
                  No payment settlements recorded yet.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </TableContainer>
    </Box>
  );
};
