import React, { useState, useEffect } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Button,
  TextField,
  InputAdornment,
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
  Alert,
  CircularProgress,
} from '@mui/material';
import {
  Search,
  Add,
  Edit,
  Delete,
  Phone,
  Email,
  Business,
} from '@mui/icons-material';
import { customersApi } from '../api/api';

export const Customers = () => {
  const [customers, setCustomers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [openDialog, setOpenDialog] = useState(false);
  const [editingCustomer, setEditingCustomer] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    contactPerson: '',
    email: '',
    phone: '',
    address: '',
    vatNumber: '',
    crNumber: '',
    notes: '',
  });
  const [dialogError, setDialogError] = useState('');

  const loadCustomers = async () => {
    try {
      setLoading(true);
      const res = await customersApi.getAll(search);
      setCustomers(res.data.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadCustomers();
  }, [search]);

  const handleOpenAdd = () => {
    setEditingCustomer(null);
    setFormData({
      name: '',
      contactPerson: '',
      email: '',
      phone: '',
      address: '',
      vatNumber: '',
      crNumber: '',
      notes: '',
    });
    setDialogError('');
    setOpenDialog(true);
  };

  const handleOpenEdit = (c) => {
    setEditingCustomer(c);
    setFormData({
      name: c.name,
      contactPerson: c.contactPerson || '',
      email: c.email || '',
      phone: c.phone || '',
      address: c.address || '',
      vatNumber: c.vatNumber || '',
      crNumber: c.crNumber || '',
      notes: c.notes || '',
    });
    setDialogError('');
    setOpenDialog(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.name.trim()) {
      setDialogError('Company / Customer name is required.');
      return;
    }

    try {
      if (editingCustomer) {
        await customersApi.update(editingCustomer.id, formData);
      } else {
        await customersApi.create(formData);
      }
      setOpenDialog(false);
      loadCustomers();
    } catch (err) {
      setDialogError(err.response?.data?.message || 'Operation failed.');
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm('Are you sure you want to delete this customer?')) {
      try {
        await customersApi.delete(id);
        loadCustomers();
      } catch (err) {
        alert(err.response?.data?.message || 'Failed to delete customer.');
      }
    }
  };

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Box>
          <Typography variant="h5" fontWeight={800}>
            Customers & Clients
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Manage your client directory, Commercial Registration (CR), and VAT credentials.
          </Typography>
        </Box>
        <Button variant="contained" startIcon={<Add />} onClick={handleOpenAdd}>
          Add Customer
        </Button>
      </Box>

      <Card sx={{ mb: 3 }}>
        <CardContent sx={{ pb: 2 }}>
          <TextField
            size="small"
            fullWidth
            placeholder="Search by company name, email, or phone..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <Search color="action" />
                </InputAdornment>
              ),
            }}
          />
        </CardContent>
      </Card>

      <TableContainer component={Paper} elevation={0} sx={{ border: '1px solid #e2e8f0', borderRadius: 2 }}>
        <Table>
          <TableHead sx={{ bgcolor: '#f8fafc' }}>
            <TableRow>
              <TableCell sx={{ fontWeight: 600 }}>Company / Name</TableCell>
              <TableCell sx={{ fontWeight: 600 }}>Contact Person</TableCell>
              <TableCell sx={{ fontWeight: 600 }}>CR / VAT</TableCell>
              <TableCell sx={{ fontWeight: 600 }}>Phone & Email</TableCell>
              <TableCell align="right" sx={{ fontWeight: 600 }}>Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={5} align="center" sx={{ py: 4 }}>
                  <CircularProgress size={28} />
                </TableCell>
              </TableRow>
            ) : customers.length ? (
              customers.map((c) => (
                <TableRow key={c.id} hover>
                  <TableCell>
                    <Typography variant="subtitle2" fontWeight={700}>
                      {c.name}
                    </Typography>
                    {c.address && (
                      <Typography variant="caption" color="text.secondary" display="block">
                        {c.address}
                      </Typography>
                    )}
                  </TableCell>
                  <TableCell>{c.contactPerson || '—'}</TableCell>
                  <TableCell>
                    {c.crNumber && (
                      <Typography variant="caption" display="block" fontWeight={600}>
                        CR: {c.crNumber}
                      </Typography>
                    )}
                    {c.vatNumber && (
                      <Typography variant="caption" color="text.secondary" display="block">
                        VAT: {c.vatNumber}
                      </Typography>
                    )}
                    {!c.crNumber && !c.vatNumber && '—'}
                  </TableCell>
                  <TableCell>
                    {c.phone && (
                      <Typography variant="caption" display="block">
                        {c.phone}
                      </Typography>
                    )}
                    {c.email && (
                      <Typography variant="caption" color="text.secondary" display="block">
                        {c.email}
                      </Typography>
                    )}
                  </TableCell>
                  <TableCell align="right">
                    <IconButton size="small" onClick={() => handleOpenEdit(c)} color="primary">
                      <Edit fontSize="small" />
                    </IconButton>
                    <IconButton size="small" onClick={() => handleDelete(c.id)} color="error">
                      <Delete fontSize="small" />
                    </IconButton>
                  </TableCell>
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={5} align="center" sx={{ py: 4, color: 'text.secondary' }}>
                  No customers found. Click "Add Customer" to register your first client.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </TableContainer>

      {/* Add / Edit Dialog */}
      <Dialog open={openDialog} onClose={() => setOpenDialog(false)} maxWidth="sm" fullWidth>
        <form onSubmit={handleSubmit}>
          <DialogTitle fontWeight={700}>
            {editingCustomer ? 'Edit Customer' : 'Add New Customer'}
          </DialogTitle>
          <DialogContent dividers>
            {dialogError && <Alert severity="error" sx={{ mb: 2 }}>{dialogError}</Alert>}
            <Grid container spacing={2}>
              <Grid item xs={12}>
                <TextField
                  label="Customer / Business Name"
                  fullWidth
                  required
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  label="Contact Person"
                  fullWidth
                  value={formData.contactPerson}
                  onChange={(e) => setFormData({ ...formData, contactPerson: e.target.value })}
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  label="Phone Number"
                  fullWidth
                  placeholder="+973 3900 0000"
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                />
              </Grid>
              <Grid item xs={12}>
                <TextField
                  label="Email Address"
                  type="email"
                  fullWidth
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  label="CR Number (Optional)"
                  fullWidth
                  placeholder="e.g. CR-123456"
                  value={formData.crNumber}
                  onChange={(e) => setFormData({ ...formData, crNumber: e.target.value })}
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  label="VAT Number (Optional)"
                  fullWidth
                  placeholder="e.g. 200000123400002"
                  value={formData.vatNumber}
                  onChange={(e) => setFormData({ ...formData, vatNumber: e.target.value })}
                />
              </Grid>
              <Grid item xs={12}>
                <TextField
                  label="Billing Address"
                  multiline
                  rows={2}
                  fullWidth
                  value={formData.address}
                  onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                />
              </Grid>
            </Grid>
          </DialogContent>
          <DialogActions sx={{ p: 2 }}>
            <Button onClick={() => setOpenDialog(false)}>Cancel</Button>
            <Button type="submit" variant="contained">
              {editingCustomer ? 'Save Changes' : 'Create Customer'}
            </Button>
          </DialogActions>
        </form>
      </Dialog>
    </Box>
  );
};
