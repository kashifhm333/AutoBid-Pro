import React from 'react';
import { cn } from '../../utils/cn.js';
import { Loader2 } from 'lucide-react';

export function Button({
  children,
  className = '',
  variant = 'primary',
  size = 'md',
  isLoading = false,
  disabled = false,
  icon: Icon = null,
  type = 'button',
  ...props
}) {
  const baseStyles = 'inline-flex items-center justify-center font-semibold rounded-lg transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-brand-bg disabled:opacity-50 disabled:cursor-not-allowed';

  const variants = {
    primary: 'bg-brand-amber text-black hover:bg-brand-amberHover shadow-glow-amber focus:ring-brand-amber',
    emerald: 'bg-brand-emerald text-black hover:bg-brand-emeraldHover shadow-glow-emerald focus:ring-brand-emerald',
    secondary: 'bg-brand-card hover:bg-brand-cardHover text-brand-text border border-brand-border hover:border-brand-borderLight focus:ring-brand-borderLight',
    outline: 'bg-transparent text-brand-text border border-brand-border hover:bg-brand-surface hover:border-brand-borderLight focus:ring-brand-amber',
    ghost: 'bg-transparent text-brand-muted hover:text-brand-text hover:bg-brand-surface/60 focus:ring-brand-amber',
    crimson: 'bg-brand-crimson text-white hover:bg-brand-crimsonHover shadow-glow-crimson focus:ring-brand-crimson'
  };

  const sizes = {
    sm: 'text-xs px-3 py-1.5 gap-1.5',
    md: 'text-sm px-4 py-2 gap-2',
    lg: 'text-base px-6 py-3 gap-2.5',
    xl: 'text-lg px-8 py-3.5 gap-3'
  };

  return (
    <button
      type={type}
      disabled={disabled || isLoading}
      className={cn(baseStyles, variants[variant], sizes[size], className)}
      {...props}
    >
      {isLoading ? (
        <Loader2 className="w-4 h-4 animate-spin text-current" />
      ) : Icon ? (
        <Icon className="w-4 h-4 text-current shrink-0" />
      ) : null}
      {children}
    </button>
  );
}
