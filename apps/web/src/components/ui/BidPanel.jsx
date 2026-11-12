import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext.jsx';
import { Card } from './Card.jsx';
import { Button } from './Button.jsx';
import { PriceDisplay } from './PriceDisplay.jsx';
import { AuctionTimer } from './AuctionTimer.jsx';
import { ShieldCheck, Zap, AlertCircle, CheckCircle, Clock, Volume2, VolumeX } from 'lucide-react';
import { getMinimumIncrement } from '@autobid/config';

export function BidPanel({ auction, onPlaceBid, onSetProxyBid, isSubmitting = false }) {
  const { user, isAuthenticated, setPersona } = useAuth();
  const currentBid = Number(auction.currentHighestBid) || Number(auction.startingPrice) || 0;
  const minIncrement = Number(auction.minimumIncrement) || getMinimumIncrement(currentBid);
  const minRequiredBid = currentBid > 0 ? currentBid + minIncrement : Number(auction.startingPrice);

  const [bidAmount, setBidAmount] = useState(minRequiredBid);
  const [selectedIncrement, setSelectedIncrement] = useState(null);
  const [isProxyMode, setIsProxyMode] = useState(false);
  const [feedback, setFeedback] = useState(null); // { type: 'success'|'error', message }

  const quickIncrements = [minIncrement, minIncrement * 2, minIncrement * 5, minIncrement * 10];

  const handleQuickAdd = (inc) => {
    setSelectedIncrement(inc);
    setBidAmount(currentBid + inc);
  };

  const handleSubmitBid = async (e) => {
    e.preventDefault();
    setFeedback(null);

    if (!isAuthenticated) {
      setPersona('BUYER');
    }

    if (bidAmount < minRequiredBid) {
      setFeedback({
        type: 'error',
        message: `Bid must be at least $${minRequiredBid.toLocaleString()}`
      });
      return;
    }

    try {
      if (isProxyMode) {
        if (onSetProxyBid) await onSetProxyBid(auction.id, bidAmount);
        setFeedback({
          type: 'success',
          message: `Proxy Auto-Bid configured up to $${bidAmount.toLocaleString()}`
        });
      } else {
        if (onPlaceBid) await onPlaceBid(auction.id, bidAmount);
        setFeedback({
          type: 'success',
          message: `Bid of $${bidAmount.toLocaleString()} submitted successfully!`
        });
      }
    } catch (err) {
      setFeedback({
        type: 'error',
        message: err.message || 'Failed to submit bid'
      });
    }
  };

  return (
    <Card className="bg-brand-surface border-brand-border p-6 shadow-2xl relative overflow-hidden">
      {/* Ambient Top Glow */}
      <div className="absolute top-0 right-0 w-48 h-48 bg-brand-amber/10 blur-[80px] pointer-events-none" />

      {/* Header Bar: Status & Soft-Close Badge */}
      <div className="flex items-center justify-between border-b border-brand-border/80 pb-4 mb-5">
        <div className="flex items-center gap-2">
          <span className="relative flex h-2.5 w-2.5">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-brand-emerald opacity-75" />
            <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-brand-emerald" />
          </span>
          <span className="text-xs font-mono font-bold uppercase tracking-wider text-brand-emerald">
            {auction.status === 'LIVE' ? 'Live Bidding Active' : 'Upcoming Event'}
          </span>
        </div>

        <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-brand-card border border-brand-border text-[11px] font-mono text-brand-muted">
          <ShieldCheck className="w-3.5 h-3.5 text-brand-amber" />
          <span>Anti-Sniping</span>
        </div>
      </div>

      {/* Price & Countdown Container - Two distinct, unclipped rows */}
      <div className="space-y-4 mb-6">
        <div>
          <span className="text-[11px] font-mono font-semibold text-brand-muted uppercase tracking-wider block mb-1">
            {auction.status === 'LIVE' ? 'Current Leading Bid' : 'Starting Reserve'}
          </span>
          <div className="flex items-baseline gap-2">
            <PriceDisplay
              amount={currentBid}
              size="xl"
              className="text-brand-amber text-4xl sm:text-5xl font-black font-mono tracking-tight"
            />
          </div>
        </div>

        {auction.endTime && (
          <div className="p-3 rounded-xl bg-brand-bg/80 border border-brand-border/70 flex items-center justify-between">
            <div className="flex items-center gap-2 text-xs font-mono text-brand-muted uppercase">
              <Clock className="w-4 h-4 text-brand-amber" />
              <span>Time Left:</span>
            </div>
            <AuctionTimer endTime={auction.endTime} className="text-xs font-mono font-bold" />
          </div>
        )}
      </div>

      {/* Mode Selector: Direct Bid vs Proxy Auto-Bid */}
      <div className="grid grid-cols-2 p-1 bg-brand-bg rounded-xl border border-brand-border mb-5">
        <button
          type="button"
          onClick={() => setIsProxyMode(false)}
          className={`py-2 text-xs font-bold uppercase rounded-lg transition-all ${
            !isProxyMode
              ? 'bg-brand-card text-brand-amber shadow border border-brand-border/60'
              : 'text-brand-muted hover:text-brand-text'
          }`}
        >
          Direct Bid
        </button>
        <button
          type="button"
          onClick={() => setIsProxyMode(true)}
          className={`py-2 text-xs font-bold uppercase rounded-lg transition-all flex items-center justify-center gap-1.5 ${
            isProxyMode
              ? 'bg-brand-card text-brand-amber shadow border border-brand-border/60'
              : 'text-brand-muted hover:text-brand-text'
          }`}
        >
          <Zap className="w-3.5 h-3.5" />
          Proxy Auto-Bid
        </button>
      </div>

      {/* Quick Increment Buttons */}
      <div className="mb-5">
        <div className="flex items-center justify-between mb-2">
          <span className="text-xs text-brand-muted font-medium">
            Quick Bid Bumps
          </span>
          <span className="text-[11px] font-mono text-brand-muted">
            Min: +${minIncrement.toLocaleString()}
          </span>
        </div>
        <div className="grid grid-cols-4 gap-2">
          {quickIncrements.map((inc, i) => (
            <button
              key={i}
              type="button"
              onClick={() => handleQuickAdd(inc)}
              className={`px-2 py-2 rounded-lg border text-xs font-mono font-bold transition-all ${
                selectedIncrement === inc
                  ? 'bg-brand-amber text-black border-brand-amber shadow-glow-amber'
                  : 'bg-brand-card hover:bg-brand-surface border-brand-border text-brand-text hover:border-brand-amber'
              }`}
            >
              +${inc >= 1000 ? `${inc / 1000}k` : inc}
            </button>
          ))}
        </div>
      </div>

      {/* Bidder Identification Status */}
      <div className="mb-5 p-3 rounded-xl bg-brand-bg/80 border border-brand-border flex items-center justify-between text-xs">
        {isAuthenticated ? (
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded-md bg-brand-emerald/20 border border-brand-emerald/40 flex items-center justify-center text-brand-emerald font-bold text-[11px]">
              {user?.firstName?.[0] || 'B'}
            </div>
            <div>
              <span className="font-bold text-white block leading-tight">
                {user?.firstName} {user?.lastName || ''}
              </span>
              <span className="text-[10px] text-brand-emerald font-mono flex items-center gap-1">
                <CheckCircle className="w-2.5 h-2.5" /> Deposit Pre-Authorized
              </span>
            </div>
          </div>
        ) : (
          <div className="flex items-center justify-between w-full">
            <span className="text-brand-muted text-[11px]">
              Guest Bidder (Simulated)
            </span>
            <button
              type="button"
              onClick={() => setPersona('BUYER')}
              className="text-[11px] font-bold text-brand-amber hover:underline"
            >
              Sign In as Alex
            </button>
          </div>
        )}
        {isAuthenticated && (
          <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-brand-surface border border-brand-border text-brand-muted">
            Tier 1
          </span>
        )}
      </div>

      {/* Bid Input Form */}
      <form onSubmit={handleSubmitBid} className="space-y-4">
        <div>
          <label className="text-xs font-medium text-brand-muted block mb-1.5">
            {isProxyMode ? 'Maximum Automated Limit ($)' : 'Your Exact Bid Amount ($)'}
          </label>
          <div className="relative">
            <span className="absolute left-4 top-1/2 -translate-y-1/2 text-brand-muted font-mono text-xl font-bold">
              $
            </span>
            <input
              type="number"
              step={minIncrement}
              min={minRequiredBid}
              value={bidAmount}
              onChange={(e) => {
                setSelectedIncrement(null);
                setBidAmount(Number(e.target.value));
              }}
              className="w-full pl-9 pr-4 py-3 bg-brand-bg border border-brand-border rounded-xl text-xl font-mono font-bold text-white focus:outline-none focus:border-brand-amber focus:ring-1 focus:ring-brand-amber transition-all"
            />
          </div>
          <span className="text-[11px] text-brand-muted block mt-1">
            Minimum required next bid: <span className="font-mono text-brand-text">${minRequiredBid.toLocaleString()}</span>
          </span>
        </div>

        {/* Feedback Alert */}
        {feedback && (
          <div
            className={`p-3 rounded-xl text-xs font-medium flex items-center gap-2 ${
              feedback.type === 'success'
                ? 'bg-brand-emerald/15 text-brand-emerald border border-brand-emerald/30'
                : 'bg-brand-crimson/15 text-brand-crimson border border-brand-crimson/30'
            }`}
          >
            {feedback.type === 'success' ? (
              <CheckCircle className="w-4 h-4 shrink-0" />
            ) : (
              <AlertCircle className="w-4 h-4 shrink-0" />
            )}
            <span>{feedback.message}</span>
          </div>
        )}

        {/* Submit CTA */}
        <Button
          type="submit"
          size="lg"
          className="w-full py-4 text-base font-bold tracking-wide shadow-lg"
          variant={isProxyMode ? 'emerald' : 'primary'}
          isLoading={isSubmitting}
        >
          {isProxyMode
            ? `Set Proxy Auto-Bid ($${bidAmount.toLocaleString()})`
            : `Confirm & Place Bid ($${bidAmount.toLocaleString()})`}
        </Button>
      </form>

      {/* Deposit & Buyer Security Badge */}
      <div className="mt-5 pt-4 border-t border-brand-border/60 flex items-center justify-between text-xs text-brand-muted">
        <div className="flex items-center gap-1.5">
          <ShieldCheck className="w-4 h-4 text-brand-emerald" />
          <span>$500 Refundable Pre-Auth</span>
        </div>
        <span className="text-[11px]">5% Buyer Premium (Capped at $5k)</span>
      </div>
    </Card>
  );
}
