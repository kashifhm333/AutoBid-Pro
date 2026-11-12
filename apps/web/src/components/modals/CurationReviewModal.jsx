import React from 'react';
import { Button } from '../ui/Button.jsx';
import { Badge } from '../ui/Badge.jsx';
import { ShieldCheck, X, Check, AlertTriangle, FileText, Cpu, UserCheck, DollarSign } from 'lucide-react';

export function CurationReviewModal({ isOpen, onClose, submission, onDecision }) {
  if (!isOpen || !submission) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-200">
      <div className="relative w-full max-w-3xl bg-brand-surface border border-brand-border rounded-2xl shadow-2xl flex flex-col overflow-hidden">
        {/* Header */}
        <div className="p-6 border-b border-brand-border flex items-center justify-between bg-brand-card/50">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <h2 className="text-xl font-extrabold text-white">{submission.vehicle}</h2>
              <Badge variant="amber">Curation Review</Badge>
            </div>
            <p className="text-xs text-brand-muted">
              Submitted by <span className="text-white font-semibold">{submission.seller}</span> • VIN: <span className="font-mono text-brand-amber">{submission.vin}</span>
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-lg bg-brand-surface border border-brand-border text-brand-muted hover:text-white transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Dossier Body */}
        <div className="p-6 space-y-6 overflow-y-auto max-h-[70vh]">
          {/* Key Checklist Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="p-4 rounded-xl bg-brand-card border border-brand-border space-y-1">
              <div className="flex items-center gap-1.5 text-xs text-brand-muted">
                <FileText className="w-4 h-4 text-brand-emerald" />
                <span>Title & NMVTIS</span>
              </div>
              <p className="text-sm font-bold text-white">Clean & Lien-Free</p>
              <span className="text-[10px] text-brand-emerald">Zero insurance total losses</span>
            </div>

            <div className="p-4 rounded-xl bg-brand-card border border-brand-border space-y-1">
              <div className="flex items-center gap-1.5 text-xs text-brand-muted">
                <Cpu className="w-4 h-4 text-brand-blue" />
                <span>Diagnostic Telemetry</span>
              </div>
              <p className="text-sm font-bold text-white">0 Active DTCs</p>
              <span className="text-[10px] text-brand-blue">All readiness monitors set</span>
            </div>

            <div className="p-4 rounded-xl bg-brand-card border border-brand-border space-y-1">
              <div className="flex items-center gap-1.5 text-xs text-brand-muted">
                <UserCheck className="w-4 h-4 text-brand-amber" />
                <span>Seller KYC</span>
              </div>
              <p className="text-sm font-bold text-white">Identity Verified</p>
              <span className="text-[10px] text-brand-amber">Stripe ID & Bank Wire match</span>
            </div>
          </div>

          {/* Inspection Summary */}
          <div className="p-4 rounded-xl bg-brand-bg border border-brand-border space-y-2">
            <div className="flex items-center justify-between text-xs">
              <span className="font-bold text-white">Diagnostic Score</span>
              <span className="font-mono font-bold text-brand-emerald">{submission.inspectionScore} / 10.0</span>
            </div>
            <p className="text-xs text-brand-muted leading-relaxed">
              Odometer verified at {Number(submission.mileage).toLocaleString()} miles. Paint thickness verified factory spec. Mechanical readiness confirmed via mobile diagnostic inspector.
            </p>
          </div>

          {/* Reserve Sanity Review */}
          <div className="p-4 rounded-xl bg-brand-card border border-brand-border flex items-center justify-between">
            <div>
              <span className="text-xs text-brand-muted block">Market Valuations & Reserve Ratio</span>
              <span className="text-sm font-bold text-white">Reserve: $125,000 • Estimated Market: $120,000 - $138,000</span>
            </div>
            <Badge variant="emerald">Reserve Rational</Badge>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="p-4 border-t border-brand-border bg-brand-card flex items-center justify-between">
          <Button variant="ghost" size="sm" onClick={onClose}>
            Cancel
          </Button>
          <div className="flex items-center gap-2">
            <Button
              variant="secondary"
              size="sm"
              icon={AlertTriangle}
              onClick={() => {
                onDecision(submission.id, 'reject');
                onClose();
              }}
            >
              Request Changes
            </Button>
            <Button
              variant="emerald"
              size="sm"
              icon={Check}
              onClick={() => {
                onDecision(submission.id, 'approve');
                onClose();
              }}
            >
              Approve & Schedule Live
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}

