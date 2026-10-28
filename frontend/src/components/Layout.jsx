import React, { useState } from 'react';
import { Outlet, useNavigate, useLocation } from 'react-router-dom';
import {
  Box,
  Drawer,
  AppBar,
  Toolbar,
  List,
  Typography,
  Divider,
  IconButton,
  ListItem,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Avatar,
  Menu,
  MenuItem,
  Chip,
  useTheme,
  useMediaQuery,
} from '@mui/material';
import {
  Dashboard as DashboardIcon,
  People as PeopleIcon,
  RequestQuote as QuoteIcon,
  Receipt as InvoiceIcon,
  Payment as PaymentIcon,
  Menu as MenuIcon,
  Logout as LogoutIcon,
  Business as BusinessIcon,
} from '@mui/icons-material';
import { useAuth } from '../context/AuthContext';

const DRAWER_WIDTH = 250;

const NAV_ITEMS = [
  { text: 'Dashboard', icon: <DashboardIcon />, path: '/' },
  { text: 'Customers', icon: <PeopleIcon />, path: '/customers' },
  { text: 'Quotations', icon: <QuoteIcon />, path: '/quotations' },
  { text: 'Invoices', icon: <InvoiceIcon />, path: '/invoices' },
  { text: 'Payments', icon: <PaymentIcon />, path: '/payments' },
];

export const Layout = () => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const [mobileOpen, setMobileOpen] = useState(false);
  const [anchorEl, setAnchorEl] = useState(null);

  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const handleDrawerToggle = () => {
    setMobileOpen(!mobileOpen);
  };

  const handleProfileMenuOpen = (event) => {
    setAnchorEl(event.currentTarget);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
  };

  const drawerContent = (
    <Box sx={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      {/* Brand Header */}
      <Box sx={{ p: 2.5, display: 'flex', alignItems: 'center', gap: 1.5 }}>
        <Box
          sx={{
            width: 38,
            height: 38,
            borderRadius: 1.5,
            bgcolor: 'primary.main',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: 'white',
            fontWeight: 800,
            fontSize: '1.2rem',
          }}
        >
          I
        </Box>
        <Box>
          <Typography variant="h6" sx={{ fontWeight: 800, color: 'primary.dark', lineHeight: 1.2 }}>
            Invoxa
          </Typography>
          <Typography variant="caption" sx={{ color: 'text.secondary', fontWeight: 500 }}>
            Quote. Invoice. Get Paid.
          </Typography>
        </Box>
      </Box>

      {/* Tenant Indicator */}
      <Box sx={{ mx: 2, mb: 2, p: 1.5, bgcolor: '#f1f5f9', borderRadius: 2 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <BusinessIcon sx={{ fontSize: 18, color: 'text.secondary' }} />
          <Typography variant="body2" sx={{ fontWeight: 600, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
            {user?.companyName || 'My Organization'}
          </Typography>
        </Box>
        <Chip
          label="Professional Plan"
          size="small"
          color="primary"
          variant="outlined"
          sx={{ mt: 1, fontSize: '0.65rem', height: 20 }}
        />
      </Box>

      <Divider />

      {/* Navigation Links */}
      <List sx={{ px: 1.5, py: 1.5, flexGrow: 1 }}>
        {NAV_ITEMS.map((item) => {
          const isSelected = location.pathname === item.path;
          return (
            <ListItem key={item.text} disablePadding sx={{ mb: 0.5 }}>
              <ListItemButton
                selected={isSelected}
                onClick={() => {
                  navigate(item.path);
                  if (isMobile) setMobileOpen(false);
                }}
                sx={{
                  borderRadius: 2,
                  color: isSelected ? 'primary.main' : 'text.primary',
                  bgcolor: isSelected ? '#e0f2fe !important' : 'transparent',
                  fontWeight: isSelected ? 700 : 500,
                  '&:hover': {
                    bgcolor: '#f1f5f9',
                  },
                }}
              >
                <ListItemIcon sx={{ color: isSelected ? 'primary.main' : 'text.secondary', minWidth: 40 }}>
                  {item.icon}
                </ListItemIcon>
                <ListItemText
                  primary={item.text}
                  primaryTypographyProps={{ fontSize: '0.9rem', fontWeight: isSelected ? 700 : 500 }}
                />
              </ListItemButton>
            </ListItem>
          );
        })}
      </List>

      <Divider />

      {/* User Info & Logout */}
      <Box sx={{ p: 2, display: 'flex', alignItems: 'center', gap: 1.5 }}>
        <Avatar sx={{ bgcolor: 'secondary.main', width: 36, height: 36, fontSize: '0.9rem' }}>
          {user?.fullName?.charAt(0) || 'U'}
        </Avatar>
        <Box sx={{ flexGrow: 1, overflow: 'hidden' }}>
          <Typography variant="body2" sx={{ fontWeight: 600, textOverflow: 'ellipsis', overflow: 'hidden', whiteSpace: 'nowrap' }}>
            {user?.fullName || 'User'}
          </Typography>
          <Typography variant="caption" sx={{ color: 'text.secondary' }}>
            {user?.role === 1 ? 'Admin' : user?.role === 2 ? 'Manager' : 'Staff'}
          </Typography>
        </Box>
        <IconButton size="small" onClick={logout} title="Sign Out">
          <LogoutIcon fontSize="small" />
        </IconButton>
      </Box>
    </Box>
  );

  return (
    <Box sx={{ display: 'flex', minHeight: '100vh' }}>
      {/* App Bar (Header) */}
      <AppBar
        position="fixed"
        elevation={0}
        sx={{
          width: { md: `calc(100% - ${DRAWER_WIDTH}px)` },
          ml: { md: `${DRAWER_WIDTH}px` },
          bgcolor: 'background.paper',
          borderBottom: '1px solid #e2e8f0',
          color: 'text.primary',
        }}
      >
        <Toolbar sx={{ justifyContent: 'space-between' }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <IconButton
              color="inherit"
              edge="start"
              onClick={handleDrawerToggle}
              sx={{ mr: 1, display: { md: 'none' } }}
            >
              <MenuIcon />
            </IconButton>
            <Typography variant="h6" sx={{ fontWeight: 700, color: '#1e293b' }}>
              {NAV_ITEMS.find((n) => n.path === location.pathname)?.text || 'Invoxa'}
            </Typography>
          </Box>

          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            <Chip
              label={`Currency: ${user?.currencyCode || 'BHD'}`}
              size="small"
              sx={{ bgcolor: '#f1f5f9', fontWeight: 600 }}
            />
            <Avatar
              onClick={handleProfileMenuOpen}
              sx={{ width: 32, height: 32, bgcolor: 'primary.main', cursor: 'pointer', fontSize: '0.85rem' }}
            >
              {user?.fullName?.charAt(0) || 'A'}
            </Avatar>
            <Menu anchorEl={anchorEl} open={Boolean(anchorEl)} onClose={handleMenuClose}>
              <MenuItem disabled>{user?.email}</MenuItem>
              <Divider />
              <MenuItem onClick={logout}>Sign Out</MenuItem>
            </Menu>
          </Box>
        </Toolbar>
      </AppBar>

      {/* Navigation Drawer */}
      <Box component="nav" sx={{ width: { md: DRAWER_WIDTH }, flexShrink: { md: 0 } }}>
        {/* Mobile drawer */}
        <Drawer
          variant="temporary"
          open={mobileOpen}
          onClose={handleDrawerToggle}
          ModalProps={{ keepMounted: true }}
          sx={{
            display: { xs: 'block', md: 'none' },
            '& .MuiDrawer-paper': { boxSizing: 'border-box', width: DRAWER_WIDTH },
          }}
        >
          {drawerContent}
        </Drawer>
        {/* Desktop permanent drawer */}
        <Drawer
          variant="permanent"
          sx={{
            display: { xs: 'none', md: 'block' },
            '& .MuiDrawer-paper': { boxSizing: 'border-box', width: DRAWER_WIDTH, borderRight: '1px solid #e2e8f0' },
          }}
          open
        >
          {drawerContent}
        </Drawer>
      </Box>

      {/* Main Page Area */}
      <Box
        component="main"
        sx={{
          flexGrow: 1,
          p: { xs: 2, sm: 3 },
          width: { md: `calc(100% - ${DRAWER_WIDTH}px)` },
          mt: 8,
          bgcolor: '#f8fafc',
          minHeight: '100vh',
        }}
      >
        <Outlet />
      </Box>
    </Box>
  );
};
