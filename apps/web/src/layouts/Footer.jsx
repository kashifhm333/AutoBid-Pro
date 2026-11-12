import React from 'react';
import { Gauge, Shield, Lock, Award } from 'lucide-react';

export function Footer() {
  return (
    <footer className="bg-brand-surface border-t border-brand-border mt-20 text-brand-muted text-xs">
      {/* Top Value Propositions */}
      <div className="border-b border-brand-border/60 py-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 grid grid-cols-1 md:grid-cols-3 gap-8">
          <div className="flex items-center gap-4">
            <div className="p-3 rounded-xl bg-brand-card border border-brand-border text-brand-amber">
              <Shield className="w-6 h-6" />
            </div>
            <div>
              <h4 className="text-sm font-bold text-brand-text mb-0.5">Verified Condition Reports</h4>
              <p className="text-brand-muted">Multi-point OBD2 scans, paint meter readings, and verified titles.</p>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <div className="p-3 rounded-xl bg-brand-card border border-brand-border text-brand-emerald">
              <Lock className="w-6 h-6" />
            </div>
            <div>
              <h4 className="text-sm font-bold text-brand-text mb-0.5">Escrow & Secure Bidding</h4>
              <p className="text-brand-muted">Pessimistic concurrency locking and refundable deposit protection.</p>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <div className="p-3 rounded-xl bg-brand-card border border-brand-border text-brand-blue">
              <Award className="w-6 h-6" />
            </div>
            <div>
              <h4 className="text-sm font-bold text-brand-text mb-0.5">Transparent 5% Buyer Fee</h4>
              <p className="text-brand-muted">No hidden charges. Capped at $5,000 maximum buyer's premium.</p>
            </div>
          </div>
        </div>
      </div>

      {/* Main Footer Links */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 flex flex-col md:flex-row items-center justify-between gap-6">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-brand-amber flex items-center justify-center font-extrabold text-black">
            <Gauge className="w-5 h-5" />
          </div>
          <div>
            <span className="text-sm font-bold text-brand-text">AutoBid Pro</span>
            <p className="text-[11px] text-brand-muted">The Premier Vehicle Auction Marketplace</p>
          </div>
        </div>

        <p className="text-[11px] text-brand-muted text-center md:text-right">
          &copy; {new Date().getFullYear()} AutoBid Pro Inc. All rights reserved. Authoritative server clocks govern all auctions.
        </p>
      </div>
    </footer>
  );
}
