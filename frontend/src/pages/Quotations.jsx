import React, { useState, useEffect } from 'react';
import { downloadOrSharePdf } from '../utils/fileDownloader';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Button,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Grid,
  TextField,
  MenuItem,
  CircularProgress,
  Alert,
  Tooltip,
} from '@mui/material';
import {
  Add,
  PictureAsPdf,
  Transform,
  ContentCopy,
  DeleteOutline,
} from '@mui/icons-material';
import { quotationsApi, customersApi } from '../api/api';
import { StatusChip } from '../components/StatusChip';
import { CurrencyText } from '../components/CurrencyText';
import { useAuth } from '../context/AuthContext';

export const Quotations = () => {
  const { user } = useAuth();
  const [quotations, setQuotations] = useState([]);
  const [customers, setCustomers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [openCreate, setOpenCreate] = useState(false);
  const [error, setError] = useState('');

  // Form state for creating quotation
  const [customerId, setCustomerId] = useState('');
  const [quotationDate, setQuotationDate] = useState(new Date().toISOString().split('T')[0]);
  const [expiryDate, setExpiryDate] = useState(
    new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
  );
  const [terms, setTerms] = useState('Payment: 50% advance, 50% upon completion. Validity: 30 days.');
  const [notes, setNotes] = useState('');
  const [items, setItems] = useState([
    { description: 'Professional Consultation / Service', quantity: 1, unitPrice: 100, discountPercent: 0, taxRate: 10 },
  ]);

  const loadQuotations = async () => {
    try {
      setLoading(true);
      const [qRes, cRes] = await Promise.all([
        quotationsApi.getAll(),
        customersApi.getAll(),
      ]);
      setQuotations(qRes.data.data);
      setCustomers(cRes.data.data);
    } catch (err) {
      setError('Failed to fetch quotations.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadQuotations();
  }, []);

  const handleAddItem = () => {
    setItems([
      ...items,
      { description: '', quantity: 1, unitPrice: 0, discountPercent: 0, taxRate: 10 },
    ]);
  };

  const handleRemoveItem = (index) => {
    if (items.length > 1) {
      setItems(items.filter((_, i) => i !== index));
    }
  };

  const handleItemChange = (index, field, value) => {
    const newItems = [...items];
    newItems[index][field] = value;
    setItems(newItems);
  };

  // Calculate live summary
  const subtotal = items.reduce((acc, it) => acc + (Number(it.quantity) || 0) * (Number(it.unitPrice) || 0), 0);
  const taxAmount = subtotal * 0.1; // 10% VAT
  const totalAmount = subtotal + taxAmount;

  const handleCreateQuotation = async (e) => {
    e.preventDefault();
    if (!customerId) {
      setError('Please select a customer.');
      return;
    }

    try {
      await quotationsApi.create({
        customerId,
        quotationDate,
        expiryDate,
        items,
        termsAndConditions: terms,
        notes,
      });
      setOpenCreate(false);
      loadQuotations();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to create quotation.');
    }
  };

  const handleConvertToInvoice = async (quotationId) => {
    if (window.confirm('Convert this quotation into an official Tax Invoice?')) {
      try {
        await quotationsApi.convertToInvoice(quotationId, {});
        alert('Quotation successfully converted to Invoice!');
        loadQuotations();
      } catch (err) {
        alert(err.response?.data?.message || 'Conversion failed.');
      }
    }
  };

  const handleDuplicate = async (quotationId) => {
    try {
      await quotationsApi.duplicate(quotationId);
      loadQuotations();
    } catch (err) {
      alert(err.response?.data?.message || 'Duplicate failed.');
    }
  };

  const handleDownloadPdf = async (quotationId, quotationNo) => {
    try {
      const res = await quotationsApi.downloadPdf(quotationId);
      await downloadOrSharePdf(res.data, `Quotation-${quotationNo}.pdf`);
    } catch (err) {
      alert('Failed to generate PDF document.');
    }
  };

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Box>
          <Typography variant="h5" fontWeight={800}>
            Quotations & Estimates
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Issue professional price proposals and convert them to invoices with one click.
          </Typography>
        </Box>
        <Button variant="contained" startIcon={<Add />} onClick={() => setOpenCreate(true)}>
          Create Quotation
        </Button>
      </Box>

      {error && <Alert severity="error" sx={{ mb: 3 }}>{error}</Alert>}

      <TableContainer component={Paper} elevation={0} sx={{ border: '1px solid #e2e8f0', borderRadius: 2 }}>
        <Table>
          <TableHead sx={{ bgcolor: '#f8fafc' }}>
            <TableRow>
              <TableCell sx={{ fontWeight: 600 }}>Quote #</TableCell>
              <TableCell sx={{ fontWeight: 600 }}>Customer</TableCell>
              <TableCell sx={{ fontWeight: 600 }}>Date</TableCell>
              <TableCell sx={{ fontWeight: 600 }}>Valid Until</TableCell>
              <TableCell align="right" sx={{ fontWeight: 600 }}>Total Amount</TableCell>
              <TableCell align="center" sx={{ fontWeight: 600 }}>Status</TableCell>
              <TableCell align="right" sx={{ fontWeight: 600 }}>Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={7} align="center" sx={{ py: 4 }}>
                  <CircularProgress size={28} />
                </TableCell>
              </TableRow>
            ) : quotations.length ? (
              quotations.map((q) => (
                <TableRow key={q.id} hover>
                  <TableCell sx={{ fontWeight: 700, color: 'primary.main' }}>
                    {q.quotationNo}
                  </TableCell>
                  <TableCell fontWeight={600}>{q.customerName}</TableCell>
                  <TableCell>{new Date(q.quotationDate).toLocaleDateString()}</TableCell>
                  <TableCell>{new Date(q.expiryDate).toLocaleDateString()}</TableCell>
                  <TableCell align="right" sx={{ fontWeight: 700 }}>
                    <CurrencyText amount={q.totalAmount} />
                  </TableCell>
                  <TableCell align="center">
                    <StatusChip status={q.status} />
                  </TableCell>
                  <TableCell align="right">
                    <Tooltip title="Download PDF">
                      <IconButton size="small" onClick={() => handleDownloadPdf(q.id, q.quotationNo)} color="primary">
                        <PictureAsPdf fontSize="small" />
                      </IconButton>
                    </Tooltip>
                    {!q.convertedToInvoiceId && (
                      <Tooltip title="Convert to Invoice">
                        <IconButton size="small" onClick={() => handleConvertToInvoice(q.id)} color="success">
                          <Transform fontSize="small" />
                        </IconButton>
                      </Tooltip>
                    )}
                    <Tooltip title="Duplicate Quotation">
                      <IconButton size="small" onClick={() => handleDuplicate(q.id)}>
                        <ContentCopy fontSize="small" />
                      </IconButton>
                    </Tooltip>
                  </TableCell>
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={7} align="center" sx={{ py: 4, color: 'text.secondary' }}>
                  No quotations created yet. Click "Create Quotation" to get started.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </TableContainer>

      {/* Create Quotation Dialog */}
      <Dialog open={openCreate} onClose={() => setOpenCreate(false)} maxWidth="md" fullWidth>
        <form onSubmit={handleCreateQuotation}>
          <DialogTitle fontWeight={700}>Create New Price Quotation</DialogTitle>
          <DialogContent dividers>
            <Grid container spacing={2} sx={{ mb: 3 }}>
              <Grid item xs={12} sm={6}>
                <TextField
                  select
                  label="Select Customer"
                  fullWidth
                  required
                  value={customerId}
                  onChange={(e) => setCustomerId(e.target.value)}
                >
                  {customers.map((c) => (
                    <MenuItem key={c.id} value={c.id}>
                      {c.name} {c.crNumber ? `(${c.crNumber})` : ''}
                    </MenuItem>
                  ))}
                </TextField>
              </Grid>
              <Grid item xs={12} sm={3}>
                <TextField
                  label="Quotation Date"
                  type="date"
                  fullWidth
                  value={quotationDate}
                  onChange={(e) => setQuotationDate(e.target.value)}
                  InputLabelProps={{ shrink: true }}
                />
              </Grid>
              <Grid item xs={12} sm={3}>
                <TextField
                  label="Expiry Date"
                  type="date"
                  fullWidth
                  value={expiryDate}
                  onChange={(e) => setExpiryDate(e.target.value)}
                  InputLabelProps={{ shrink: true }}
                />
              </Grid>
            </Grid>

            {/* Line Items */}
            <Typography variant="subtitle2" fontWeight={700} sx={{ mb: 1 }}>
              Quotation Line Items
            </Typography>
            {items.map((item, index) => (
              <Box key={index} sx={{ display: 'flex', gap: 1.5, mb: 1.5, alignItems: 'center' }}>
                <TextField
                  label="Item Description / Service"
                  size="small"
                  fullWidth
                  required
                  value={item.description}
                  onChange={(e) => handleItemChange(index, 'description', e.target.value)}
                  sx={{ flex: 4 }}
                />
                <TextField
                  label="Qty"
                  size="small"
                  type="number"
                  value={item.quantity}
                  onChange={(e) => handleItemChange(index, 'quantity', Number(e.target.value))}
                  sx={{ flex: 1 }}
                />
                <TextField
                  label={`Unit (${user?.currencyCode || 'BHD'})`}
                  size="small"
                  type="number"
                  value={item.unitPrice}
                  onChange={(e) => handleItemChange(index, 'unitPrice', Number(e.target.value))}
                  sx={{ flex: 1.5 }}
                />
                <Box sx={{ minWidth: 90, textAlign: 'right', fontWeight: 600 }}>
                  <CurrencyText amount={(item.quantity || 0) * (item.unitPrice || 0)} />
                </Box>
                <IconButton size="small" onClick={() => handleRemoveItem(index)} disabled={items.length === 1} color="error">
                  <DeleteOutline fontSize="small" />
                </IconButton>
              </Box>
            ))}

            <Button size="small" startIcon={<Add />} onClick={handleAddItem} sx={{ mb: 2 }}>
              Add Another Line Item
            </Button>

            {/* Live Totals summary */}
            <Box sx={{ p: 2, bgcolor: '#f8fafc', borderRadius: 2, textAlign: 'right' }}>
              <Typography variant="body2">
                Subtotal: <strong><CurrencyText amount={subtotal} /></strong>
              </Typography>
              <Typography variant="body2">
                VAT (10%): <strong><CurrencyText amount={taxAmount} /></strong>
              </Typography>
              <Typography variant="h6" fontWeight={700} sx={{ mt: 0.5, color: 'primary.dark' }}>
                Total: <CurrencyText amount={totalAmount} />
              </Typography>
            </Box>

            <Grid container spacing={2} sx={{ mt: 1 }}>
              <Grid item xs={12} sm={6}>
                <TextField
                  label="Terms & Conditions"
                  multiline
                  rows={2}
                  fullWidth
                  value={terms}
                  onChange={(e) => setTerms(e.target.value)}
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  label="Client Notes"
                  multiline
                  rows={2}
                  fullWidth
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                />
              </Grid>
            </Grid>
          </DialogContent>
          <DialogActions sx={{ p: 2 }}>
            <Button onClick={() => setOpenCreate(false)}>Cancel</Button>
            <Button type="submit" variant="contained">
              Save & Issue Quotation
            </Button>
          </DialogActions>
        </form>
      </Dialog>
    </Box>
  );
};
