import React, { useState } from 'react';
import { Button } from '../ui/Button.jsx';
import { X, Gavel, Check, AlertCircle } from 'lucide-react';

export function QuickBidModal({ isOpen, onClose, bid, onBidPlaced }) {
  if (!isOpen || !bid) return null;

  const minIncrement = 2500;
  const nextMinBid = (bid.currentBid || 0) + minIncrement;
  const [amount, setAmount] = useState(nextMinBid);
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = (e) => {
    e.preventDefault();
    setSubmitted(true);
    setTimeout(() => {
      if (onBidPlaced) onBidPlaced(bid.id, amount);
      onClose();
    }, 900);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-200">
      <div className="relative w-full max-w-md bg-brand-surface border border-brand-border rounded-2xl shadow-2xl p-6 space-y-5">
        <div className="flex items-center justify-between border-b border-brand-border pb-3">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-brand-amber/15 border border-brand-amber/30 flex items-center justify-center text-brand-amber">
              <Gavel className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-white">Place Live Bid</h3>
              <p className="text-xs text-brand-muted truncate max-w-xs">{bid.vehicleTitle}</p>
            </div>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-lg text-brand-muted hover:text-white">
            <X className="w-5 h-5" />
          </button>
        </div>

        {submitted ? (
          <div className="py-6 text-center text-brand-emerald space-y-2">
            <Check className="w-10 h-10 mx-auto" />
            <p className="font-bold text-sm">Bid of ${amount.toLocaleString()} Confirmed!</p>
            <p className="text-xs text-brand-muted">You are now the leading bidder.</p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="flex items-center justify-between p-3 rounded-xl bg-brand-bg border border-brand-border text-xs">
              <div>
                <span className="text-brand-muted block">Current High Bid</span>
                <span className="font-mono font-bold text-white text-base">${bid.currentBid.toLocaleString()}</span>
              </div>
              <div className="text-right">
                <span className="text-brand-muted block">Minimum Increment</span>
                <span className="font-mono font-bold text-brand-amber text-base">+${minIncrement.toLocaleString()}</span>
              </div>
            </div>

            <div>
              <label className="text-xs font-medium text-brand-muted block mb-1">Your Bid Amount ($)</label>
              <div className="relative">
                <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-brand-muted font-mono font-bold">$</span>
                <input
                  type="number"
                  step={minIncrement}
                  min={nextMinBid}
                  value={amount}
                  onChange={(e) => setAmount(Number(e.target.value))}
                  className="w-full pl-8 pr-4 py-2.5 bg-brand-bg border border-brand-border rounded-xl text-lg font-mono font-bold text-white focus:outline-none focus:border-brand-amber"
                />
              </div>
              <span className="text-[10px] text-brand-muted block mt-1">
                Minimum required: ${nextMinBid.toLocaleString()}
              </span>
            </div>

            {/* Quick Increment Bump Buttons */}
            <div className="grid grid-cols-3 gap-2">
              {[2500, 5000, 10000].map((inc) => (
                <button
                  key={inc}
                  type="button"
                  onClick={() => setAmount(bid.currentBid + inc)}
                  className="py-1.5 rounded-lg bg-brand-card hover:bg-brand-surface border border-brand-border text-xs font-mono font-semibold text-brand-text hover:border-brand-amber transition-colors"
                >
                  +${inc >= 1000 ? `${inc / 1000}k` : inc}
                </button>
              ))}
            </div>

            <div className="flex items-center justify-end gap-2 pt-2">
              <Button type="button" variant="ghost" size="sm" onClick={onClose}>
                Cancel
              </Button>
              <Button type="submit" variant="primary" size="sm">
                Confirm & Submit Bid
              </Button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}

