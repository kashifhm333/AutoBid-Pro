import React from 'react';
import { cn } from '../../utils/cn.js';

export function Card({ children, className = '', hoverEffect = false, ...props }) {
  return (
    <div
      className={cn(
        'bg-brand-card border border-brand-border rounded-xl shadow-surface overflow-hidden transition-all duration-300',
        hoverEffect && 'hover:border-brand-borderLight hover:shadow-glow-amber hover:-translate-y-1',
        className
      )}
      {...props}
    >
      {children}
    </div>
  );
}
