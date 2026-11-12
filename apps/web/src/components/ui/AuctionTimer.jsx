import React, { useState, useEffect } from 'react';
import { Clock, AlertTriangle } from 'lucide-react';
import { cn } from '../../utils/cn.js';

export function AuctionTimer({ endTime, className = '', onExpire = null }) {
  const [timeLeft, setTimeLeft] = useState({
    days: 0,
    hours: 0,
    minutes: 0,
    seconds: 0,
    isExpired: false,
    totalSeconds: 0
  });

  useEffect(() => {
    function calculateTime() {
      const now = Date.now();
      const end = new Date(endTime).getTime();
      const difference = end - now;

      if (difference <= 0) {
        setTimeLeft({ days: 0, hours: 0, minutes: 0, seconds: 0, isExpired: true, totalSeconds: 0 });
        if (onExpire) onExpire();
        return;
      }

      const days = Math.floor(difference / (1000 * 60 * 60 * 24));
      const hours = Math.floor((difference / (1000 * 60 * 60)) % 24);
      const minutes = Math.floor((difference / 1000 / 60) % 60);
      const seconds = Math.floor((difference / 1000) % 60);

      setTimeLeft({
        days,
        hours,
        minutes,
        seconds,
        isExpired: false,
        totalSeconds: Math.floor(difference / 1000)
      });
    }

    calculateTime();
    const interval = setInterval(calculateTime, 1000);
    return () => clearInterval(interval);
  }, [endTime]);

  if (timeLeft.isExpired) {
    return (
      <div className={cn('inline-flex items-center gap-1.5 px-3 py-1 rounded-md bg-brand-surface border border-brand-border text-brand-muted text-xs font-mono font-bold uppercase', className)}>
        <span>Bidding Closed</span>
      </div>
    );
  }

  const isUrgent = timeLeft.totalSeconds <= 120; // 2 minutes or less

  return (
    <div
      className={cn(
        'inline-flex items-center gap-2 px-3 py-1.5 rounded-lg border text-sm font-mono font-bold transition-all duration-300',
        isUrgent
          ? 'bg-brand-crimson/20 border-brand-crimson/50 text-brand-crimson shadow-glow-crimson animate-pulse'
          : 'bg-brand-surface/90 border-brand-border text-brand-amber',
        className
      )}
    >
      {isUrgent ? (
        <AlertTriangle className="w-4 h-4 text-brand-crimson animate-bounce" />
      ) : (
        <Clock className="w-4 h-4 text-brand-amber shrink-0" />
      )}
      <div className="flex items-center gap-1">
        {timeLeft.days > 0 && <span>{timeLeft.days}d</span>}
        <span>{String(timeLeft.hours).padStart(2, '0')}h</span>
        <span>:</span>
        <span>{String(timeLeft.minutes).padStart(2, '0')}m</span>
        <span>:</span>
        <span>{String(timeLeft.seconds).padStart(2, '0')}s</span>
      </div>
      {isUrgent && <span className="text-[10px] font-sans uppercase tracking-wider text-brand-crimson ml-1">Soft Close Active</span>}
    </div>
  );
}
