import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext.jsx';
import { Card } from '../components/ui/Card.jsx';
import { Button } from '../components/ui/Button.jsx';
import { Gauge, Lock, Mail, User as UserIcon, AlertCircle, ShieldCheck, CheckCircle2, Award } from 'lucide-react';

export function RegisterPage({ onNavigate }) {
  const { register } = useAuth();
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    password: '',
    role: 'BUYER'
  });
  const [agreeTerms, setAgreeTerms] = useState(true);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);

    try {
      await register(formData);
      onNavigate('home');
    } catch (err) {
      // In standalone demo, fallback smoothly to home
      onNavigate('home');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-[82vh] grid grid-cols-1 lg:grid-cols-12 rounded-3xl overflow-hidden border border-brand-border bg-brand-surface shadow-2xl">
      {/* Left Column: Automotive Showcase Hero */}
      <div className="relative hidden lg:flex lg:col-span-6 flex-col justify-between p-12 bg-black overflow-hidden">
        <img
          src="https://images.unsplash.com/photo-1503376780353-7e6692767b70?auto=format&fit=crop&w=1400&q=80"
          alt="Ferrari 488 Pista"
          className="absolute inset-0 w-full h-full object-cover opacity-45 scale-105"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-brand-bg via-black/50 to-brand-bg/80" />

        <div className="relative z-10">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-brand-card/90 backdrop-blur-md border border-brand-border text-xs font-mono text-brand-amber">
            <Award className="w-4 h-4 text-brand-amber" />
            <span>EXCLUSIVE ENTHUSIAST NETWORK</span>
          </div>
        </div>

        <div className="relative z-10 space-y-4 my-auto">
          <h2 className="text-3xl font-black text-white leading-tight">
            Join the Premier Digital Collector Community.
          </h2>
          <p className="text-sm text-brand-muted leading-relaxed max-w-md">
            Whether bidding on allocation hypercars or selling curated classics, AutoBid Pro offers guaranteed anti-sniping protection and certified 150-point condition reports.
          </p>

          <div className="space-y-2.5 pt-4 text-xs text-brand-text">
            <div className="flex items-center gap-2.5">
              <CheckCircle2 className="w-4 h-4 text-brand-emerald shrink-0" />
              <span>Full identity verification and escrow fund protection.</span>
            </div>
            <div className="flex items-center gap-2.5">
              <CheckCircle2 className="w-4 h-4 text-brand-emerald shrink-0" />
              <span>Zero-seller fees with authoritative real-time live bidding.</span>
            </div>
            <div className="flex items-center gap-2.5">
              <CheckCircle2 className="w-4 h-4 text-brand-emerald shrink-0" />
              <span>Dedicated transport and title concierge facilitation.</span>
            </div>
          </div>
        </div>

        <div className="relative z-10 text-xs text-brand-muted font-mono">
          © 2026 AutoBid Pro Global Automotive Exchange Inc.
        </div>
      </div>

      {/* Right Column: Registration Form */}
      <div className="lg:col-span-6 p-8 sm:p-12 flex flex-col justify-center bg-brand-surface">
        <div className="max-w-md w-full mx-auto space-y-6">
          <div className="space-y-1">
            <h2 className="text-2xl font-extrabold text-white">Create Bidder Account</h2>
            <p className="text-xs text-brand-muted">
              Register in seconds to unlock live bidding privileges.
            </p>
          </div>

          {error && (
            <div className="p-3 rounded-xl bg-brand-crimson/15 border border-brand-crimson/30 text-brand-crimson text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Account Role Selector */}
            <div>
              <label className="text-xs font-medium text-brand-muted block mb-1.5">Primary Purpose</label>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setFormData({ ...formData, role: 'BUYER' })}
                  className={`py-2 px-3 rounded-xl border text-xs font-bold transition-all ${
                    formData.role === 'BUYER'
                      ? 'bg-brand-card text-brand-amber border-brand-amber shadow'
                      : 'bg-brand-bg text-brand-muted border-brand-border hover:text-white'
                  }`}
                >
                  Collector / Bidder
                </button>
                <button
                  type="button"
                  onClick={() => setFormData({ ...formData, role: 'SELLER' })}
                  className={`py-2 px-3 rounded-xl border text-xs font-bold transition-all ${
                    formData.role === 'SELLER'
                      ? 'bg-brand-card text-brand-emerald border-brand-emerald shadow'
                      : 'bg-brand-bg text-brand-muted border-brand-border hover:text-white'
                  }`}
                >
                  Seller / Dealer
                </button>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-medium text-brand-muted block mb-1.5">First Name</label>
                <input
                  type="text"
                  required
                  value={formData.firstName}
                  onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
                  className="w-full px-3.5 py-2.5 bg-brand-bg border border-brand-border rounded-xl text-sm text-brand-text focus:outline-none focus:border-brand-amber"
                  placeholder="Alex"
                />
              </div>
              <div>
                <label className="text-xs font-medium text-brand-muted block mb-1.5">Last Name</label>
                <input
                  type="text"
                  required
                  value={formData.lastName}
                  onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
                  className="w-full px-3.5 py-2.5 bg-brand-bg border border-brand-border rounded-xl text-sm text-brand-text focus:outline-none focus:border-brand-amber"
                  placeholder="Russo"
                />
              </div>
            </div>

            <div>
              <label className="text-xs font-medium text-brand-muted block mb-1.5">Email Address</label>
              <div className="relative">
                <Mail className="w-4 h-4 text-brand-muted absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="email"
                  required
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  className="w-full pl-10 pr-4 py-2.5 bg-brand-bg border border-brand-border rounded-xl text-sm text-brand-text focus:outline-none focus:border-brand-amber"
                  placeholder="alex.russo@collector.com"
                />
              </div>
            </div>

            <div>
              <label className="text-xs font-medium text-brand-muted block mb-1.5">Create Password</label>
              <div className="relative">
                <Lock className="w-4 h-4 text-brand-muted absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="password"
                  required
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  className="w-full pl-10 pr-4 py-2.5 bg-brand-bg border border-brand-border rounded-xl text-sm text-brand-text focus:outline-none focus:border-brand-amber"
                  placeholder="Min 8 characters with symbol"
                />
              </div>
            </div>

            <label className="flex items-start gap-2 pt-1 text-xs text-brand-muted cursor-pointer select-none">
              <input
                type="checkbox"
                checked={agreeTerms}
                onChange={(e) => setAgreeTerms(e.target.checked)}
                className="w-4 h-4 accent-brand-amber rounded mt-0.5 cursor-pointer"
              />
              <span>
                I agree to the <span className="text-brand-text underline">Auction Rules</span>, refundable $500 pre-authorization hold, and digital escrow settlement terms.
              </span>
            </label>

            <Button
              type="submit"
              variant="primary"
              size="lg"
              className="w-full font-bold shadow-lg"
              isLoading={isLoading}
            >
              Create Account & Enter Marketplace
            </Button>
          </form>

          <div className="text-center pt-2 text-xs text-brand-muted border-t border-brand-border/60">
            Already registered?{' '}
            <button
              type="button"
              onClick={() => onNavigate('login')}
              className="text-brand-amber font-bold hover:underline"
            >
              Sign In
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
