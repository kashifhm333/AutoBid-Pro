import React, { useState } from 'react';
import { Button } from '../ui/Button.jsx';
import { X, DollarSign, Check, ShieldCheck } from 'lucide-react';

export function AdjustReserveModal({ isOpen, onClose, listing, onUpdated }) {
  if (!isOpen || !listing) return null;

  const [reservePrice, setReservePrice] = useState(listing.reservePrice || 280000);
  const [success, setSuccess] = useState(false);

  const handleSave = (e) => {
    e.preventDefault();
    setSuccess(true);
    setTimeout(() => {
      if (onUpdated) onUpdated(listing.id, Number(reservePrice));
      onClose();
    }, 900);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-200">
      <div className="relative w-full max-w-md bg-brand-surface border border-brand-border rounded-2xl shadow-2xl p-6 space-y-5">
        <div className="flex items-center justify-between border-b border-brand-border pb-3">
          <div>
            <h3 className="text-lg font-bold text-white">Adjust Reserve Price</h3>
            <p className="text-xs text-brand-muted truncate max-w-xs">{listing.title}</p>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-lg text-brand-muted hover:text-white">
            <X className="w-5 h-5" />
          </button>
        </div>

        {success ? (
          <div className="py-6 text-center text-brand-emerald space-y-2">
            <Check className="w-10 h-10 mx-auto" />
            <p className="font-bold text-sm">Reserve Updated Successfully!</p>
          </div>
        ) : (
          <form onSubmit={handleSave} className="space-y-4">
            <div>
              <label className="text-xs font-medium text-brand-muted block mb-1">
                New Confidential Reserve ($)
              </label>
              <div className="relative">
                <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-brand-muted font-mono font-bold">$</span>
                <input
                  type="number"
                  value={reservePrice}
                  onChange={(e) => setReservePrice(e.target.value)}
                  className="w-full pl-8 pr-4 py-2.5 bg-brand-bg border border-brand-border rounded-xl text-lg font-mono font-bold text-white focus:outline-none focus:border-brand-amber"
                />
              </div>
              <span className="text-[11px] text-brand-muted block mt-1.5 leading-relaxed">
                Tip: Lowering your reserve below the current highest bid will instantly mark the auction as <span className="text-brand-emerald font-semibold">"Reserve Met"</span> and stimulate final bidding velocity.
              </span>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2">
              <Button type="button" variant="ghost" size="sm" onClick={onClose}>
                Cancel
              </Button>
              <Button type="submit" variant="primary" size="sm">
                Save Reserve Price
              </Button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}

