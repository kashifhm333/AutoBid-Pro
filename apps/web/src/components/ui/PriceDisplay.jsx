import React from 'react';
import { cn } from '../../utils/cn.js';

export function PriceDisplay({ amount, currency = 'USD', className = '', size = 'md', label = null }) {
  const numericAmount = Number(amount) || 0;
  const formatted = numericAmount.toLocaleString('en-US', {
    style: 'currency',
    currency,
    maximumFractionDigits: 0
  });

  const sizes = {
    sm: 'text-base font-semibold',
    md: 'text-xl font-bold',
    lg: 'text-2xl sm:text-3xl font-extrabold',
    xl: 'text-3xl sm:text-4xl lg:text-5xl font-extrabold'
  };

  return (
    <div className="flex flex-col">
      {label && <span className="text-xs text-brand-muted uppercase font-medium tracking-wider mb-0.5">{label}</span>}
      <span className={cn('font-mono tracking-tight text-brand-text', sizes[size], className)}>
        {formatted}
      </span>
    </div>
  );
}
