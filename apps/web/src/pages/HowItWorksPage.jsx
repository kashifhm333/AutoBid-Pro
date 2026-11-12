import React from 'react';
import { Card } from '../components/ui/Card.jsx';
import { Button } from '../components/ui/Button.jsx';
import { Badge } from '../components/ui/Badge.jsx';
import { ShieldCheck, Zap, Clock, Truck, CheckCircle2, ChevronRight, Award, Lock, FileCheck } from 'lucide-react';

export function HowItWorksPage({ onNavigate }) {
  const steps = [
    {
      step: '01',
      title: 'Curated Intake & 150-Point Digital Diagnostic',
      badge: 'Rigorous Curation',
      desc: 'Every vehicle submitted to AutoBid Pro undergoes a comprehensive mechanical and cosmetic audit. We review paint meter depth readings across 8 panels, complete OBD-II diagnostic scans, and verify NMVTIS title history with zero tolerance for hidden flood or frame damage.',
      icon: ShieldCheck,
      color: 'text-brand-amber',
      highlights: ['150-point digital inspection report', 'Paint thickness micrometer verification', 'OBD-II diagnostic telemetry scan']
    },
    {
      step: '02',
      title: 'Authoritative Real-Time Live Bidding',
      badge: 'Zero-Latency Engine',
      desc: 'Bid with complete confidence. Our bidding infrastructure is powered by synchronized WebSocket feeds with pessimistic concurrency controls. Set confidential Proxy Auto-Bids or submit manual bids with instant sub-millisecond confirmation.',
      icon: Zap,
      color: 'text-brand-emerald',
      highlights: ['Proxy auto-bid algorithm with maximum limits', 'Fully synchronized authoritative server clock', '$500 pre-authorization security hold']
    },
    {
      step: '03',
      title: 'Guaranteed Anti-Sniping Dynamic Soft Close',
      badge: 'Fair Bidding Guarantee',
      desc: 'No last-second automated bot sniping. If any bid is received within the final 2 minutes of an auction, the timer automatically resets by an additional 2 minutes, giving every human collector a fair opportunity to counter.',
      icon: Clock,
      color: 'text-brand-crimson',
      highlights: ['Automatic 2-minute timer extensions', 'Real-time countdown sync across all devices', 'Transparent bid increment tiers']
    },
    {
      step: '04',
      title: 'White-Glove Escrow Settlement & Transport',
      badge: 'Buyer & Seller Protection',
      desc: 'Once an auction concludes, our escrow desk coordinates payment, automated bill of sale generation, and title transfer. We partner with premier enclosed transport carriers to deliver the vehicle directly to your collection.',
      icon: Truck,
      color: 'text-brand-blue',
      highlights: ['Protected escrow disbursement', 'Digital bill of sale & title facilitation', 'Enclosed insured vehicle delivery']
    }
  ];

  return (
    <div className="space-y-16 py-4">
      {/* Hero Header */}
      <div className="text-center max-w-3xl mx-auto space-y-4">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-brand-surface border border-brand-border text-xs font-mono text-brand-amber">
          <Award className="w-4 h-4 text-brand-amber" />
          <span>THE AUTOBID PRO STANDARD</span>
        </div>
        <h1 className="text-4xl sm:text-5xl font-black text-white tracking-tight">
          How Curated Automotive Auctions Work
        </h1>
        <p className="text-brand-muted text-base leading-relaxed">
          Engineered for discerning collectors. Combining transparent 150-point condition reports, synchronized real-time bidding, and guaranteed anti-sniping protection.
        </p>
      </div>

      {/* 4 Step Timeline */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {steps.map((s, idx) => {
          const Icon = s.icon;
          return (
            <Card key={idx} className="p-8 bg-brand-surface border-brand-border space-y-6 relative overflow-hidden group hover:border-brand-borderLight transition-all">
              <div className="flex items-center justify-between">
                <span className="text-4xl font-black font-mono text-brand-muted/30 group-hover:text-brand-amber/30 transition-colors">
                  {s.step}
                </span>
                <Badge variant={idx === 0 ? 'amber' : idx === 1 ? 'emerald' : idx === 2 ? 'live' : 'blue'}>
                  {s.badge}
                </Badge>
              </div>

              <div className="space-y-3">
                <div className="flex items-center gap-3">
                  <div className={`p-2.5 rounded-xl bg-brand-card border border-brand-border ${s.color}`}>
                    <Icon className="w-6 h-6" />
                  </div>
                  <h3 className="text-xl font-bold text-white">{s.title}</h3>
                </div>
                <p className="text-sm text-brand-muted leading-relaxed">{s.desc}</p>
              </div>

              <div className="border-t border-brand-border/60 pt-4 space-y-2">
                {s.highlights.map((h, i) => (
                  <div key={i} className="flex items-center gap-2 text-xs text-brand-text">
                    <CheckCircle2 className="w-3.5 h-3.5 text-brand-emerald shrink-0" />
                    <span>{h}</span>
                  </div>
                ))}
              </div>
            </Card>
          );
        })}
      </div>

      {/* Trust & Guarantee Banner */}
      <div className="p-8 rounded-3xl bg-gradient-to-r from-brand-surface via-brand-card to-brand-surface border border-brand-border shadow-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-6">
        <div className="space-y-2">
          <div className="flex items-center gap-2 text-brand-amber text-xs font-mono font-bold uppercase">
            <Lock className="w-4 h-4" />
            <span>Guaranteed Capped Fees</span>
          </div>
          <h3 className="text-2xl font-black text-white">Transparent 5% Buyer's Premium</h3>
          <p className="text-xs text-brand-muted max-w-xl">
            Capped at $5,000 maximum fee. Sellers pay 0% listing or sales commission. No hidden administrative fees or unannounced charges.
          </p>
        </div>
        <div className="flex items-center gap-3 shrink-0">
          <Button variant="primary" size="lg" onClick={() => onNavigate('catalog')}>
            Explore Live Auctions
          </Button>
          <Button variant="secondary" size="lg" onClick={() => onNavigate('seller')}>
            Sell a Vehicle
          </Button>
        </div>
      </div>
    </div>
  );
}

