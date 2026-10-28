import React, { useState, useEffect } from 'react';
import {
  Box,
  Card,
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
  Payment as PaymentIcon,
  DeleteOutline,
} from '@mui/icons-material';
import { invoicesApi, customersApi, paymentsApi } from '../api/api';
import { StatusChip } from '../components/StatusChip';
import { CurrencyText } from '../components/CurrencyText';
import { useAuth } from '../context/AuthContext';

export const Invoices = () => {
  const { user } = useAuth();
  const [invoices, setInvoices] = useState([]);
  const [customers, setCustomers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [openCreate, setOpenCreate] = useState(false);
  const [openPayment, setOpenPayment] = useState(false);
  const [selectedInvoice, setSelectedInvoice] = useState(null);
  const [error, setError] = useState('');

  // Direct Invoice form state
  const [customerId, setCustomerId] = useState('');
  const [invoiceDate, setInvoiceDate] = useState(new Date().toISOString().split('T')[0]);
  const [dueDate, setDueDate] = useState(
    new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
  );
  const [terms, setTerms] = useState('Payment due within 14 days. BenefitPay: BH98BBKU00001234567890');
  const [notes, setNotes] = useState('');
  const [items, setItems] = useState([
    { description: 'Standard Services / Deliverables', quantity: 1, unitPrice: 150, discountPercent: 0, taxRate: 10 },
  ]);

  // Payment form state
  const [paymentAmount, setPaymentAmount] = useState('');
  const [paymentMethod, setPaymentMethod] = useState(3); // BenefitPay by default
  const [paymentRef, setPaymentRef] = useState('');
  const [paymentNotes, setPaymentNotes] = useState('');

  const loadInvoices = async () => {
    try {
      setLoading(true);
      const [iRes, cRes] = await Promise.all([
        invoicesApi.getAll(),
        customersApi.getAll(),
      ]);
      setInvoices(iRes.data.data);
      setCustomers(cRes.data.data);
    } catch (err) {
      setError('Failed to fetch invoices.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadInvoices();
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

  const subtotal = items.reduce((acc, it) => acc + (Number(it.quantity) || 0) * (Number(it.unitPrice) || 0), 0);
  const taxAmount = subtotal * 0.1; // 10% VAT
  const totalAmount = subtotal + taxAmount;

  const handleCreateInvoice = async (e) => {
    e.preventDefault();
    if (!customerId) {
      setError('Please select a customer.');
      return;
    }

    try {
      await invoicesApi.create({
        customerId,
        invoiceDate,
        dueDate,
        items,
        termsAndConditions: terms,
        notes,
      });
      setOpenCreate(false);
      loadInvoices();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to create invoice.');
    }
  };

  const handleOpenPayment = (inv) => {
    setSelectedInvoice(inv);
    setPaymentAmount(inv.balanceAmount);
    setPaymentMethod(3); // BenefitPay
    setPaymentRef('');
    setPaymentNotes('');
    setOpenPayment(true);
  };

  const handleRecordPayment = async (e) => {
    e.preventDefault();
    if (!selectedInvoice) return;

    try {
      await paymentsApi.recordPayment({
        invoiceId: selectedInvoice.id,
        amount: Number(paymentAmount),
        paymentDate: new Date().toISOString(),
        paymentMethod: Number(paymentMethod),
        referenceNo: paymentRef,
        notes: paymentNotes,
      });
      setOpenPayment(false);
      loadInvoices();
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to record payment.');
    }
  };

  const handleDownloadPdf = async (invoiceId, invoiceNo) => {
    try {
      const res = await invoicesApi.downloadPdf(invoiceId);
      const url = window.URL.createObjectURL(new Blob([res.data], { type: 'application/pdf' }));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `Invoice-${invoiceNo}.pdf`);
      document.body.appendChild(link);
      link.click();
      link.remove();
    } catch (err) {
      alert('Failed to generate PDF invoice.');
    }
  };

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Box>
          <Typography variant="h5" fontWeight={800}>
            Invoices
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Manage tax invoices, monitor due dates, and track partial/full customer settlements.
          </Typography>
        </Box>
        <Button variant="contained" startIcon={<Add />} onClick={() => setOpenCreate(true)}>
          Direct Invoice
        </Button>
      </Box>

      {error && <Alert severity="error" sx={{ mb: 3 }}>{error}</Alert>}

      <TableContainer component={Paper} elevation={0} sx={{ border: '1px solid #e2e8f0', borderRadius: 2 }}>
        <Table>
          <TableHead sx={{ bgcolor: '#f8fafc' }}>
            <TableRow>
              <TableCell sx={{ fontWeight: 600 }}>Invoice #</TableCell>
              <TableCell sx={{ fontWeight: 600 }}>Customer</TableCell>
              <TableCell sx={{ fontWeight: 600 }}>Date</TableCell>
              <TableCell sx={{ fontWeight: 600 }}>Due Date</TableCell>
              <TableCell align="right" sx={{ fontWeight: 600 }}>Total</TableCell>
              <TableCell align="right" sx={{ fontWeight: 600 }}>Paid</TableCell>
              <TableCell align="right" sx={{ fontWeight: 600 }}>Balance</TableCell>
              <TableCell align="center" sx={{ fontWeight: 600 }}>Status</TableCell>
              <TableCell align="right" sx={{ fontWeight: 600 }}>Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={9} align="center" sx={{ py: 4 }}>
                  <CircularProgress size={28} />
                </TableCell>
              </TableRow>
            ) : invoices.length ? (
              invoices.map((inv) => (
                <TableRow key={inv.id} hover>
                  <TableCell sx={{ fontWeight: 700, color: 'primary.main' }}>
                    {inv.invoiceNo}
                  </TableCell>
                  <TableCell fontWeight={600}>{inv.customerName}</TableCell>
                  <TableCell>{new Date(inv.invoiceDate).toLocaleDateString()}</TableCell>
                  <TableCell>{new Date(inv.dueDate).toLocaleDateString()}</TableCell>
                  <TableCell align="right" sx={{ fontWeight: 700 }}>
                    <CurrencyText amount={inv.totalAmount} />
                  </TableCell>
                  <TableCell align="right" sx={{ color: 'success.main', fontWeight: 600 }}>
                    <CurrencyText amount={inv.paidAmount} />
                  </TableCell>
                  <TableCell align="right" sx={{ color: inv.balanceAmount > 0 ? 'error.main' : 'text.primary', fontWeight: 700 }}>
                    <CurrencyText amount={inv.balanceAmount} />
                  </TableCell>
                  <TableCell align="center">
                    <StatusChip status={inv.status} />
                  </TableCell>
                  <TableCell align="right">
                    <Tooltip title="Download PDF">
                      <IconButton size="small" onClick={() => handleDownloadPdf(inv.id, inv.invoiceNo)} color="primary">
                        <PictureAsPdf fontSize="small" />
                      </IconButton>
                    </Tooltip>
                    {inv.balanceAmount > 0 && (
                      <Tooltip title="Record Payment">
                        <IconButton size="small" onClick={() => handleOpenPayment(inv)} color="success">
                          <PaymentIcon fontSize="small" />
                        </IconButton>
                      </Tooltip>
                    )}
                  </TableCell>
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={9} align="center" sx={{ py: 4, color: 'text.secondary' }}>
                  No invoices created yet. Click "Direct Invoice" or convert from Quotations.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </TableContainer>

      {/* Create Direct Invoice Dialog */}
      <Dialog open={openCreate} onClose={() => setOpenCreate(false)} maxWidth="md" fullWidth>
        <form onSubmit={handleCreateInvoice}>
          <DialogTitle fontWeight={700}>Create Direct Tax Invoice</DialogTitle>
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
                  label="Invoice Date"
                  type="date"
                  fullWidth
                  value={invoiceDate}
                  onChange={(e) => setInvoiceDate(e.target.value)}
                  InputLabelProps={{ shrink: true }}
                />
              </Grid>
              <Grid item xs={12} sm={3}>
                <TextField
                  label="Due Date"
                  type="date"
                  fullWidth
                  value={dueDate}
                  onChange={(e) => setDueDate(e.target.value)}
                  InputLabelProps={{ shrink: true }}
                />
              </Grid>
            </Grid>

            {/* Line Items */}
            <Typography variant="subtitle2" fontWeight={700} sx={{ mb: 1 }}>
              Invoice Line Items
            </Typography>
            {items.map((item, index) => (
              <Box key={index} sx={{ display: 'flex', gap: 1.5, mb: 1.5, alignItems: 'center' }}>
                <TextField
                  label="Description"
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
                  label={`Unit Price (${user?.currencyCode || 'BHD'})`}
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

            {/* Summary */}
            <Box sx={{ p: 2, bgcolor: '#f8fafc', borderRadius: 2, textAlign: 'right' }}>
              <Typography variant="body2">
                Subtotal: <strong><CurrencyText amount={subtotal} /></strong>
              </Typography>
              <Typography variant="body2">
                VAT (10%): <strong><CurrencyText amount={taxAmount} /></strong>
              </Typography>
              <Typography variant="h6" fontWeight={700} sx={{ mt: 0.5, color: 'primary.dark' }}>
                Invoice Total: <CurrencyText amount={totalAmount} />
              </Typography>
            </Box>

            <Grid container spacing={2} sx={{ mt: 1 }}>
              <Grid item xs={12} sm={6}>
                <TextField
                  label="Terms & Payment Instructions"
                  multiline
                  rows={2}
                  fullWidth
                  value={terms}
                  onChange={(e) => setTerms(e.target.value)}
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  label="Internal Notes"
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
              Save & Issue Invoice
            </Button>
          </DialogActions>
        </form>
      </Dialog>

      {/* Record Payment Dialog */}
      <Dialog open={openPayment} onClose={() => setOpenPayment(false)} maxWidth="xs" fullWidth>
        <form onSubmit={handleRecordPayment}>
          <DialogTitle fontWeight={700}>Record Payment</DialogTitle>
          <DialogContent dividers>
            <Box sx={{ mb: 2, p: 1.5, bgcolor: '#f8fafc', borderRadius: 1.5 }}>
              <Typography variant="body2">
                Invoice: <strong>{selectedInvoice?.invoiceNo}</strong>
              </Typography>
              <Typography variant="body2">
                Customer: <strong>{selectedInvoice?.customerName}</strong>
              </Typography>
              <Typography variant="body2" color="error.main" fontWeight={600}>
                Outstanding Balance: <CurrencyText amount={selectedInvoice?.balanceAmount} />
              </Typography>
            </Box>

            <Grid container spacing={2}>
              <Grid item xs={12}>
                <TextField
                  label={`Payment Amount (${user?.currencyCode || 'BHD'})`}
                  type="number"
                  fullWidth
                  required
                  value={paymentAmount}
                  onChange={(e) => setPaymentAmount(e.target.value)}
                  inputProps={{ step: '0.001', max: selectedInvoice?.balanceAmount }}
                />
              </Grid>
              <Grid item xs={12}>
                <TextField
                  select
                  label="Payment Method"
                  fullWidth
                  value={paymentMethod}
                  onChange={(e) => setPaymentMethod(e.target.value)}
                >
                  <MenuItem value={3}>BenefitPay (Bahrain)</MenuItem>
                  <MenuItem value={2}>Bank Transfer / Wire</MenuItem>
                  <MenuItem value={1}>Cash</MenuItem>
                  <MenuItem value={4}>Credit / Debit Card</MenuItem>
                  <MenuItem value={5}>Online Payment Gateway</MenuItem>
                </TextField>
              </Grid>
              <Grid item xs={12}>
                <TextField
                  label="Reference / Transaction ID"
                  placeholder="e.g. BP-9831720 or Cheque #102"
                  fullWidth
                  value={paymentRef}
                  onChange={(e) => setPaymentRef(e.target.value)}
                />
              </Grid>
              <Grid item xs={12}>
                <TextField
                  label="Notes"
                  multiline
                  rows={2}
                  fullWidth
                  value={paymentNotes}
                  onChange={(e) => setPaymentNotes(e.target.value)}
                />
              </Grid>
            </Grid>
          </DialogContent>
          <DialogActions sx={{ p: 2 }}>
            <Button onClick={() => setOpenPayment(false)}>Cancel</Button>
            <Button type="submit" variant="contained" color="success">
              Confirm Payment
            </Button>
          </DialogActions>
        </form>
      </Dialog>
    </Box>
  );
};
