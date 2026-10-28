import React from 'react';
import { useAuth } from '../context/AuthContext';

export const CurrencyText = ({ amount = 0, currency, decimals }) => {
  const { user } = useAuth();

  const curr = currency || user?.currencyCode || 'BHD';
  const dec = decimals ?? user?.currencyDecimals ?? (curr === 'BHD' ? 3 : 2);

  const formatted = Number(amount || 0).toLocaleString(undefined, {
    minimumFractionDigits: dec,
    maximumFractionDigits: dec,
  });

  return (
    <span>
      {formatted} {curr}
    </span>
  );
};
