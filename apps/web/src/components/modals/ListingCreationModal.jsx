import React, { useState } from 'react';
import { Card } from '../ui/Card.jsx';
import { Button } from '../ui/Button.jsx';
import { Badge } from '../ui/Badge.jsx';
import { PlusCircle, X, Check, Car, DollarSign, Camera, ShieldCheck, ArrowRight, ArrowLeft } from 'lucide-react';

export function ListingCreationModal({ isOpen, onClose, onCreated }) {
  if (!isOpen) return null;

  const [step, setStep] = useState(1);
  const [formData, setFormData] = useState({
    vin: 'WP0AB2A99NS281903',
    year: '2022',
    make: 'Porsche',
    model: '718 Cayman GT4 RS',
    trim: 'Weissach Package',
    mileage: '3200',
    transmission: 'DUAL_CLUTCH',
    exteriorColor: 'Arctic Grey',
    startingPrice: '140000',
    hasReserve: true,
    reservePrice: '175000',
    durationDays: '7'
  });

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);

  const handleNext = () => {
    if (step < 4) setStep(step + 1);
  };

  const handleBack = () => {
    if (step > 1) setStep(step - 1);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    setTimeout(() => {
      setIsSubmitting(false);
      setSuccess(true);
      if (onCreated) {
        onCreated({
          id: `l-${Date.now()}`,
          title: `${formData.year} ${formData.make} ${formData.model}`,
          vin: formData.vin,
          status: 'PENDING_REVIEW',
          startingPrice: Number(formData.startingPrice),
          reservePrice: formData.hasReserve ? Number(formData.reservePrice) : 0,
          views: 1,
          bidsCount: 0
        });
      }
    }, 1000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-200">
      <div className="relative w-full max-w-2xl bg-brand-surface border border-brand-border rounded-2xl shadow-2xl flex flex-col overflow-hidden">
        {/* Modal Header */}
        <div className="p-6 border-b border-brand-border flex items-center justify-between bg-brand-card/50">
          <div>
            <h2 className="text-xl font-extrabold text-white">List Your Collector Vehicle</h2>
            <p className="text-xs text-brand-muted">Submit your vehicle to the AutoBid Pro curation committee</p>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-lg bg-brand-surface border border-brand-border text-brand-muted hover:text-white transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Stepper Bar */}
        <div className="px-6 py-3 bg-brand-bg border-b border-brand-border/60 flex items-center justify-between text-xs">
          {[
            { num: 1, label: 'VIN & Specs' },
            { num: 2, label: 'Auction Terms' },
            { num: 3, label: 'Photos & History' },
            { num: 4, label: 'Review' }
          ].map((s) => (
            <div key={s.num} className="flex items-center gap-2">
              <span
                className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-mono font-bold ${
                  step === s.num
                    ? 'bg-brand-amber text-black'
                    : step > s.num
                    ? 'bg-brand-emerald text-black'
                    : 'bg-brand-surface border border-brand-border text-brand-muted'
                }`}
              >
                {step > s.num ? <Check className="w-3.5 h-3.5" /> : s.num}
              </span>
              <span className={`hidden sm:inline ${step === s.num ? 'text-white font-semibold' : 'text-brand-muted'}`}>
                {s.label}
              </span>
            </div>
          ))}
        </div>

        {/* Form Body */}
        <div className="p-6 overflow-y-auto max-h-[65vh]">
          {success ? (
            <div className="py-8 text-center space-y-4">
              <div className="w-14 h-14 rounded-full bg-brand-emerald/15 border border-brand-emerald/40 text-brand-emerald flex items-center justify-center mx-auto">
                <Check className="w-8 h-8" />
              </div>
              <h3 className="text-xl font-bold text-white">Listing Submitted to Curation Committee!</h3>
              <p className="text-xs text-brand-muted max-w-md mx-auto">
                Your <span className="text-brand-text font-bold">{formData.year} {formData.make} {formData.model}</span> has been entered into the validation queue. Our diagnostic specialist will review title history and OBD-II verification within 24 hours.
              </p>
              <Button variant="primary" onClick={onClose} className="mt-4">
                Done & View Dashboard
              </Button>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              {step === 1 && (
                <div className="space-y-4">
                  <div>
                    <label className="text-xs font-medium text-brand-muted block mb-1">
                      Vehicle Identification Number (VIN)
                    </label>
                    <div className="flex gap-2">
                      <input
                        type="text"
                        value={formData.vin}
                        onChange={(e) => setFormData({ ...formData, vin: e.target.value.toUpperCase() })}
                        className="flex-1 px-3.5 py-2.5 bg-brand-bg border border-brand-border rounded-lg text-sm font-mono text-white focus:outline-none focus:border-brand-amber"
                        placeholder="17-character VIN"
                      />
                      <Button type="button" variant="secondary" size="sm">
                        Auto-Decode
                      </Button>
                    </div>
                    <span className="text-[10px] text-brand-emerald block mt-1">✓ VIN Decoded: Verified Clean NMVTIS Title</span>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="text-xs font-medium text-brand-muted block mb-1">Year</label>
                      <input
                        type="text"
                        value={formData.year}
                        onChange={(e) => setFormData({ ...formData, year: e.target.value })}
                        className="w-full px-3 py-2 bg-brand-bg border border-brand-border rounded-lg text-sm text-white"
                      />
                    </div>
                    <div>
                      <label className="text-xs font-medium text-brand-muted block mb-1">Make</label>
                      <input
                        type="text"
                        value={formData.make}
                        onChange={(e) => setFormData({ ...formData, make: e.target.value })}
                        className="w-full px-3 py-2 bg-brand-bg border border-brand-border rounded-lg text-sm text-white"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="text-xs font-medium text-brand-muted block mb-1">Model</label>
                      <input
                        type="text"
                        value={formData.model}
                        onChange={(e) => setFormData({ ...formData, model: e.target.value })}
                        className="w-full px-3 py-2 bg-brand-bg border border-brand-border rounded-lg text-sm text-white"
                      />
                    </div>
                    <div>
                      <label className="text-xs font-medium text-brand-muted block mb-1">Mileage</label>
                      <input
                        type="number"
                        value={formData.mileage}
                        onChange={(e) => setFormData({ ...formData, mileage: e.target.value })}
                        className="w-full px-3 py-2 bg-brand-bg border border-brand-border rounded-lg text-sm text-white font-mono"
                      />
                    </div>
                  </div>
                </div>
              )}

              {step === 2 && (
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="text-xs font-medium text-brand-muted block mb-1">Starting Bid ($)</label>
                      <input
                        type="number"
                        value={formData.startingPrice}
                        onChange={(e) => setFormData({ ...formData, startingPrice: e.target.value })}
                        className="w-full px-3 py-2 bg-brand-bg border border-brand-border rounded-lg text-sm text-white font-mono"
                      />
                    </div>
                    <div>
                      <label className="text-xs font-medium text-brand-muted block mb-1">Auction Duration</label>
                      <select
                        value={formData.durationDays}
                        onChange={(e) => setFormData({ ...formData, durationDays: e.target.value })}
                        className="w-full px-3 py-2 bg-brand-bg border border-brand-border rounded-lg text-sm text-white"
                      >
                        <option value="3">3 Days (Express Flash)</option>
                        <option value="5">5 Days</option>
                        <option value="7">7 Days (Recommended Standard)</option>
                        <option value="10">10 Days</option>
                      </select>
                    </div>
                  </div>

                  <div className="p-4 rounded-xl bg-brand-bg border border-brand-border space-y-3">
                    <div className="flex items-center justify-between">
                      <div>
                        <span className="text-xs font-bold text-white block">Reserve Protection</span>
                        <span className="text-[11px] text-brand-muted">Require minimum threshold to sell</span>
                      </div>
                      <input
                        type="checkbox"
                        checked={formData.hasReserve}
                        onChange={(e) => setFormData({ ...formData, hasReserve: e.target.checked })}
                        className="w-4 h-4 accent-brand-amber cursor-pointer"
                      />
                    </div>

                    {formData.hasReserve && (
                      <div>
                        <label className="text-xs font-medium text-brand-muted block mb-1">Confidential Reserve Price ($)</label>
                        <input
                          type="number"
                          value={formData.reservePrice}
                          onChange={(e) => setFormData({ ...formData, reservePrice: e.target.value })}
                          className="w-full px-3 py-2 bg-brand-surface border border-brand-border rounded-lg text-sm text-white font-mono"
                        />
                        <span className="text-[10px] text-brand-muted block mt-1">
                          You may lower or remove this reserve during the live auction at any time.
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {step === 3 && (
                <div className="space-y-4">
                  <label className="text-xs font-medium text-brand-muted block">
                    Upload Photography (Minimum 12 High-Res Images)
                  </label>
                  <div className="p-8 border-2 border-dashed border-brand-border hover:border-brand-amber rounded-2xl bg-brand-bg/50 text-center space-y-2 cursor-pointer transition-colors">
                    <Camera className="w-8 h-8 text-brand-amber mx-auto" />
                    <p className="text-xs font-bold text-white">Drag & drop photo archives or click to browse</p>
                    <p className="text-[11px] text-brand-muted">Supported: RAW, JPG, PNG • Exterior, Interior, Engine Bay, Service Records</p>
                  </div>
                  <div className="flex items-center gap-2 text-xs text-brand-emerald">
                    <ShieldCheck className="w-4 h-4" />
                    <span>Free professional photography enhancement included with every listing.</span>
                  </div>
                </div>
              )}

              {step === 4 && (
                <div className="space-y-4 text-xs">
                  <div className="p-4 rounded-xl bg-brand-bg border border-brand-border space-y-2">
                    <h4 className="font-bold text-white text-sm">Listing Summary</h4>
                    <div className="grid grid-cols-2 gap-2 text-brand-muted">
                      <div>Vehicle: <span className="text-white font-semibold">{formData.year} {formData.make} {formData.model}</span></div>
                      <div>VIN: <span className="font-mono text-white">{formData.vin}</span></div>
                      <div>Starting Bid: <span className="font-mono text-brand-amber">${Number(formData.startingPrice).toLocaleString()}</span></div>
                      <div>Reserve: <span className="font-mono text-brand-emerald">{formData.hasReserve ? `$${Number(formData.reservePrice).toLocaleString()}` : 'No Reserve'}</span></div>
                      <div>Duration: <span className="text-white font-semibold">{formData.durationDays} Days</span></div>
                      <div>Listing Fee: <span className="text-brand-emerald font-semibold">100% Free for Sellers</span></div>
                    </div>
                  </div>
                  <p className="text-[11px] text-brand-muted leading-relaxed">
                    By submitting, you certify clear legal title and agree to AutoBid Pro's exclusive 7-day listing agreement.
                  </p>
                </div>
              )}
            </form>
          )}
        </div>

        {/* Modal Footer Navigation */}
        {!success && (
          <div className="p-4 border-t border-brand-border bg-brand-card flex items-center justify-between">
            {step > 1 ? (
              <Button variant="secondary" size="sm" onClick={handleBack} icon={ArrowLeft}>
                Back
              </Button>
            ) : <div />}

            {step < 4 ? (
              <Button variant="primary" size="sm" onClick={handleNext} icon={ArrowRight}>
                Continue
              </Button>
            ) : (
              <Button variant="emerald" size="sm" onClick={handleSubmit} isLoading={isSubmitting}>
                Submit for Curation
              </Button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

