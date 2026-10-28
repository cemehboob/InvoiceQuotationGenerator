import React from 'react';
import { Chip } from '@mui/material';

const STATUS_CONFIGS = {
  // Invoice Statuses
  1: { label: 'Pending', color: 'warning' },
  2: { label: 'Partially Paid', color: 'info' },
  3: { label: 'Paid', color: 'success' },
  4: { label: 'Overdue', color: 'error' },
  5: { label: 'Cancelled', color: 'default' },
  Pending: { label: 'Pending', color: 'warning' },
  PartiallyPaid: { label: 'Partially Paid', color: 'info' },
  Paid: { label: 'Paid', color: 'success' },
  Overdue: { label: 'Overdue', color: 'error' },
  Cancelled: { label: 'Cancelled', color: 'default' },

  // Quotation Statuses
  Draft: { label: 'Draft', color: 'default' },
  Sent: { label: 'Sent', color: 'info' },
  Accepted: { label: 'Accepted', color: 'success' },
  Rejected: { label: 'Rejected', color: 'error' },
  Expired: { label: 'Expired', color: 'warning' },
};

export const StatusChip = ({ status }) => {
  const config = STATUS_CONFIGS[status] || { label: String(status), color: 'default' };
  return (
    <Chip
      size="small"
      label={config.label}
      color={config.color}
      sx={{ fontWeight: 600, fontSize: '0.75rem' }}
    />
  );
};
