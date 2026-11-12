import React from 'react';
import { cn } from '../../utils/cn.js';

export function Badge({ children, variant = 'default', className = '' }) {
  const variants = {
    default: 'bg-black/80 backdrop-blur-md text-slate-200 border-white/20',
    live: 'bg-black/85 backdrop-blur-md text-rose-400 border-rose-500/50 shadow-glow-crimson/20',
    amber: 'bg-black/85 backdrop-blur-md text-amber-400 border-amber-500/50 shadow-glow-amber/20',
    emerald: 'bg-black/85 backdrop-blur-md text-emerald-400 border-emerald-500/50',
    blue: 'bg-black/85 backdrop-blur-md text-sky-400 border-sky-500/50',
    purple: 'bg-black/85 backdrop-blur-md text-purple-400 border-purple-500/50'
  };

  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-bold tracking-wide uppercase border select-none shadow-sm',
        variants[variant],
        className
      )}
    >
      {variant === 'live' && (
        <span className="w-1.5 h-1.5 rounded-full bg-rose-500 animate-ping" />
      )}
      {children}
    </span>
  );
}
