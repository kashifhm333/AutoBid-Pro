import React, { useState } from 'react';
import { useAuth, DEMO_USERS } from '../context/AuthContext.jsx';
import { Card } from '../components/ui/Card.jsx';
import { Button } from '../components/ui/Button.jsx';
import { Gauge, Lock, Mail, AlertCircle, ShieldCheck, CheckCircle2, ArrowRight } from 'lucide-react';

export function LoginPage({ onNavigate }) {
  const { login, setPersona } = useAuth();
  const [email, setEmail] = useState('buyer@autobidpro.com');
  const [password, setPassword] = useState('SecurePassword123!');
  const [rememberMe, setRememberMe] = useState(true);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);

    try {
      const loggedUser = await login(email, password);
      if (loggedUser?.roles?.includes('ADMIN') || loggedUser?.roles?.includes('ADMINISTRATOR')) {
        onNavigate('admin');
      } else if (loggedUser?.roles?.includes('SELLER')) {
        onNavigate('seller');
      } else {
        onNavigate('dashboard');
      }
    } catch (err) {
      onNavigate('home');
    } finally {
      setIsLoading(false);
    }
  };

  const handleInstantPreset = (personaKey, targetRoute) => {
    setPersona(personaKey);
    onNavigate(targetRoute);
  };

  return (
    <div className="min-h-[82vh] grid grid-cols-1 lg:grid-cols-12 rounded-3xl overflow-hidden border border-brand-border bg-brand-surface shadow-2xl">
      {/* Left Column: Automotive Showcase Hero */}
      <div className="relative hidden lg:flex lg:col-span-6 flex-col justify-between p-12 bg-black overflow-hidden">
        <img
          src="https://images.unsplash.com/photo-1614162692292-7ac56d7f7f1e?auto=format&fit=crop&w=1400&q=80"
          alt="Porsche 911 GT3 RS"
          className="absolute inset-0 w-full h-full object-cover opacity-45 scale-105"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-brand-bg via-black/50 to-brand-bg/80" />

        <div className="relative z-10">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-brand-card/90 backdrop-blur-md border border-brand-border text-xs font-mono text-brand-amber">
            <Gauge className="w-4 h-4 text-brand-amber" />
            <span>AUTHORITATIVE ENTHUSIAST MARKETPLACE</span>
          </div>
        </div>

        <div className="relative z-10 space-y-6 my-auto">
          <h2 className="text-3xl font-black text-white leading-tight">
            Curated Performance Auctions for Serious Collectors.
          </h2>

          <div className="grid grid-cols-3 gap-4 pt-2">
            <div className="p-3.5 rounded-xl bg-black/60 backdrop-blur-md border border-white/10">
              <span className="text-xl font-mono font-black text-brand-amber block">$280M+</span>
              <span className="text-[10px] text-brand-muted uppercase font-mono">Gross Volume</span>
            </div>
            <div className="p-3.5 rounded-xl bg-black/60 backdrop-blur-md border border-white/10">
              <span className="text-xl font-mono font-black text-brand-emerald block">99.8%</span>
              <span className="text-[10px] text-brand-muted uppercase font-mono">Clean Escrow</span>
            </div>
            <div className="p-3.5 rounded-xl bg-black/60 backdrop-blur-md border border-white/10">
              <span className="text-xl font-mono font-black text-brand-blue block">150-Point</span>
              <span className="text-[10px] text-brand-muted uppercase font-mono">Inspection</span>
            </div>
          </div>
        </div>

        <div className="relative z-10 p-4 rounded-2xl bg-black/70 backdrop-blur-md border border-white/10 text-xs text-brand-muted space-y-1">
          <p className="text-white italic">
            "The anti-sniping dynamic close gave me complete peace of mind when securing my 992 GT3 RS. Best auction experience hands down."
          </p>
          <span className="block font-mono text-[11px] text-brand-amber">— Jonathan M., Verified Collector (Los Angeles, CA)</span>
        </div>
      </div>

      {/* Right Column: Sign In Form */}
      <div className="lg:col-span-6 p-8 sm:p-12 flex flex-col justify-center bg-brand-surface">
        <div className="max-w-md w-full mx-auto space-y-6">
          <div className="space-y-1">
            <h2 className="text-2xl font-extrabold text-white">Welcome Back</h2>
            <p className="text-xs text-brand-muted">
              Sign in to place bids, track live auctions, and manage collector assets.
            </p>
          </div>

          {/* Social Auth Fast Track */}
          <div className="grid grid-cols-2 gap-3">
            <button
              type="button"
              onClick={() => handleInstantPreset('BUYER', 'dashboard')}
              className="py-2.5 px-3 rounded-xl bg-brand-card hover:bg-brand-cardHover border border-brand-border text-xs font-semibold text-white flex items-center justify-center gap-2 transition-colors"
            >
              <svg className="w-4 h-4" viewBox="0 0 24 24">
                <path fill="#EA4335" d="M12 5c1.5 0 2.8.5 3.8 1.4l2.8-2.8C16.8 1.8 14.6 1 12 1 7.5 1 3.7 3.6 1.9 7.3l3.5 2.7C6.3 7.1 8.9 5 12 5z" />
                <path fill="#4285F4" d="M23.5 12.3c0-.8-.1-1.7-.2-2.3H12v4.6h6.5c-.3 1.5-1.1 2.8-2.4 3.7l3.7 2.9c2.2-2 3.7-5 3.7-8.9z" />
                <path fill="#FBBC05" d="M5.4 14.7c-.2-.7-.4-1.5-.4-2.7s.1-2 .4-2.7L1.9 6.6C.7 9 0 10.4 0 12s.7 3 1.9 5.4l3.5-2.7z" />
                <path fill="#34A853" d="M12 23c3.2 0 6-1.1 8-3l-3.7-2.9c-1.1.7-2.5 1.2-4.3 1.2-3.1 0-5.7-2.1-6.6-5L1.9 16c1.8 3.7 5.6 7 10.1 7z" />
              </svg>
              <span>Google ID (Alex)</span>
            </button>

            <button
              type="button"
              onClick={() => handleInstantPreset('SELLER', 'seller')}
              className="py-2.5 px-3 rounded-xl bg-brand-card hover:bg-brand-cardHover border border-brand-border text-xs font-semibold text-white flex items-center justify-center gap-2 transition-colors"
            >
              <svg className="w-4 h-4 fill-white" viewBox="0 0 24 24">
                <path d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.81-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83M15.97 6.38c.62-.75 1.04-1.8 1.01-2.85-.9.04-2 .6-2.65 1.35-.58.66-1.09 1.73-1.02 2.76 1 .08 2.04-.51 2.66-1.26z" />
              </svg>
              <span>Apple Passkey</span>
            </button>
          </div>

          <div className="flex items-center gap-3">
            <div className="flex-1 h-px bg-brand-border" />
            <span className="text-[11px] font-mono text-brand-muted uppercase">or continue with email</span>
            <div className="flex-1 h-px bg-brand-border" />
          </div>

          {error && (
            <div className="p-3 rounded-xl bg-brand-crimson/15 border border-brand-crimson/30 text-brand-crimson text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="text-xs font-medium text-brand-muted block mb-1.5">Email Address</label>
              <div className="relative">
                <Mail className="w-4 h-4 text-brand-muted absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 bg-brand-bg border border-brand-border rounded-xl text-sm text-brand-text placeholder:text-brand-muted focus:outline-none focus:border-brand-amber transition-colors"
                  placeholder="you@collector.com"
                />
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="text-xs font-medium text-brand-muted">Password</label>
                <button
                  type="button"
                  onClick={() => alert('Password reset link sent to registered email.')}
                  className="text-xs text-brand-amber hover:underline"
                >
                  Forgot Password?
                </button>
              </div>
              <div className="relative">
                <Lock className="w-4 h-4 text-brand-muted absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 bg-brand-bg border border-brand-border rounded-xl text-sm text-brand-text placeholder:text-brand-muted focus:outline-none focus:border-brand-amber transition-colors"
                  placeholder="••••••••"
                />
              </div>
            </div>

            <div className="flex items-center justify-between text-xs text-brand-muted">
              <label className="flex items-center gap-2 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={rememberMe}
                  onChange={(e) => setRememberMe(e.target.checked)}
                  className="w-4 h-4 accent-brand-amber rounded cursor-pointer"
                />
                <span>Remember this terminal</span>
              </label>
              <span className="text-[11px] text-brand-emerald flex items-center gap-1">
                <ShieldCheck className="w-3.5 h-3.5" />
                256-bit Encrypted
              </span>
            </div>

            <Button
              type="submit"
              variant="primary"
              size="lg"
              className="w-full font-bold shadow-lg"
              isLoading={isLoading}
            >
              Sign In to Account
            </Button>
          </form>

          {/* Instant One-Click Login Presets */}
          <div className="p-3.5 rounded-2xl bg-brand-bg border border-brand-border space-y-2 text-xs">
            <span className="text-brand-muted text-[11px] block font-mono font-semibold">1-Click Instant Demo Login:</span>
            <div className="grid grid-cols-3 gap-2">
              <button
                type="button"
                onClick={() => handleInstantPreset('BUYER', 'dashboard')}
                className="py-2 px-2.5 rounded-xl bg-brand-surface border border-brand-border hover:border-brand-amber text-xs text-brand-amber font-bold font-mono transition-all text-center"
              >
                ⚡ Buyer Alex
              </button>
              <button
                type="button"
                onClick={() => handleInstantPreset('SELLER', 'seller')}
                className="py-2 px-2.5 rounded-xl bg-brand-surface border border-brand-border hover:border-brand-emerald text-xs text-brand-emerald font-bold font-mono transition-all text-center"
              >
                ⚡ Seller Apex
              </button>
              <button
                type="button"
                onClick={() => handleInstantPreset('ADMIN', 'admin')}
                className="py-2 px-2.5 rounded-xl bg-brand-surface border border-brand-border hover:border-brand-blue text-xs text-brand-blue font-bold font-mono transition-all text-center"
              >
                ⚡ Admin Mark
              </button>
            </div>
          </div>

          <div className="text-center pt-2 text-xs text-brand-muted border-t border-brand-border/60">
            Don't have a verified bidder profile?{' '}
            <button
              type="button"
              onClick={() => onNavigate('register')}
              className="text-brand-amber font-bold hover:underline"
            >
              Create Account
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
