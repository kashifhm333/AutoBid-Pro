import React from 'react';
import { MOCK_VEHICLES } from '../data/mockVehicles.js';
import { VehicleCard } from '../components/ui/VehicleCard.jsx';
import { AuctionTimer } from '../components/ui/AuctionTimer.jsx';
import { PriceDisplay } from '../components/ui/PriceDisplay.jsx';
import { Button } from '../components/ui/Button.jsx';
import { Badge } from '../components/ui/Badge.jsx';
import { Shield, Zap, Search, ArrowRight, CheckCircle2 } from 'lucide-react';

export function HomePage({ onSelectVehicle, onNavigate }) {
  const featured = MOCK_VEHICLES[0];
  const liveAuctions = MOCK_VEHICLES;

  return (
    <div className="space-y-16">
      {/* Hero Section with Featured Live Auction */}
      <section className="relative rounded-3xl overflow-hidden border border-brand-border bg-brand-surface shadow-2xl">
        {/* Background Ambient Glow */}
        <div className="absolute top-0 right-0 w-96 h-96 bg-brand-amber/10 blur-[120px] pointer-events-none" />

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 p-6 sm:p-10 lg:p-12 items-center">
          {/* Hero Left Content */}
          <div className="lg:col-span-6 space-y-6">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-brand-card border border-brand-border text-xs font-mono text-brand-amber">
              <span className="w-2 h-2 rounded-full bg-brand-crimson animate-ping" />
              <span>LIVE AUCTION EVENT</span>
            </div>

            <h1 className="text-3xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight text-white leading-tight">
              Bid on Curated <br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-brand-amber to-amber-500">
                Performance & Exotic
              </span> Cars
            </h1>

            <p className="text-brand-muted text-sm sm:text-base leading-relaxed max-w-xl">
              The premier enthusiast car auction marketplace. Backed by synchronized real-time bidding, transparent 150-point condition reports, and guaranteed anti-sniping soft closes.
            </p>

            <div className="flex flex-wrap items-center gap-4 pt-2">
              <Button
                variant="primary"
                size="lg"
                onClick={() => onSelectVehicle(featured)}
                icon={Zap}
              >
                Bid on Featured GT3 RS
              </Button>
              <Button
                variant="secondary"
                size="lg"
                onClick={() => onNavigate('catalog')}
                icon={Search}
              >
                Explore All Auctions
              </Button>
            </div>

            {/* Quick Guarantees */}
            <div className="pt-4 flex flex-wrap items-center gap-6 text-xs text-brand-muted border-t border-brand-border/60">
              <div className="flex items-center gap-1.5">
                <CheckCircle2 className="w-4 h-4 text-brand-emerald" />
                <span>Verified Odometer & Title</span>
              </div>
              <div className="flex items-center gap-1.5">
                <CheckCircle2 className="w-4 h-4 text-brand-emerald" />
                <span>Anti-Sniping Soft Close</span>
              </div>
              <div className="flex items-center gap-1.5">
                <CheckCircle2 className="w-4 h-4 text-brand-emerald" />
                <span>Transparent 5% Buyer Fee</span>
              </div>
            </div>
          </div>

          {/* Hero Right Featured Showcase Card */}
          <div className="lg:col-span-6">
            <div
              className="relative rounded-2xl overflow-hidden border border-brand-border bg-brand-card shadow-2xl group cursor-pointer"
              onClick={() => onSelectVehicle(featured)}
            >
              <div className="relative aspect-[16/10] overflow-hidden">
                <img
                  src={featured.images[0].url}
                  alt={featured.model}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/30 to-transparent" />

                {/* Floating Timer Badge */}
                <div className="absolute top-4 left-4">
                  <Badge variant="live">Featured Live</Badge>
                </div>

                <div className="absolute bottom-4 left-4 right-4 flex items-end justify-between">
                  <div>
                    <h3 className="text-xl sm:text-2xl font-bold text-white mb-1">
                      {featured.year} {featured.make} {featured.model}
                    </h3>
                    <p className="text-xs text-brand-muted">{featured.trim} &bull; {featured.mileage.toLocaleString()} mi</p>
                  </div>
                  <div className="text-right">
                    <AuctionTimer endTime={featured.auction.endTime} />
                  </div>
                </div>
              </div>

              {/* Card Footer */}
              <div className="p-4 bg-brand-surface/90 flex items-center justify-between border-t border-brand-border">
                <PriceDisplay
                  amount={featured.auction.currentHighestBid}
                  label="Current Leading Bid"
                  size="md"
                  className="text-brand-amber text-2xl"
                />
                <Button variant="primary" size="sm">
                  View Auction &rarr;
                </Button>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Live Auctions Grid Section */}
      <section className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="w-2.5 h-2.5 rounded-full bg-brand-crimson animate-ping" />
              <span className="text-xs font-mono font-bold text-brand-crimson uppercase tracking-wider">
                Happening Right Now
              </span>
            </div>
            <h2 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
              Live Auctions Ending Soon
            </h2>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={() => onNavigate('catalog')}
          >
            View All ({liveAuctions.length}) &rarr;
          </Button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {liveAuctions.map((vehicle) => (
            <VehicleCard
              key={vehicle.id}
              vehicle={vehicle}
              onSelect={onSelectVehicle}
            />
          ))}
        </div>
      </section>

      {/* How It Works 3-Step Walkthrough */}
      <section className="rounded-3xl border border-brand-border bg-brand-surface p-8 sm:p-12 text-center space-y-10">
        <div className="max-w-2xl mx-auto space-y-2">
          <Badge variant="amber">Simple & Transparent</Badge>
          <h2 className="text-3xl font-extrabold text-white">How AutoBid Pro Works</h2>
          <p className="text-brand-muted text-sm">
            Engineered for collector confidence. Every vehicle undergoes digital condition verification before entering live bidding.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 text-left">
          <div className="p-6 rounded-2xl bg-brand-card border border-brand-border space-y-3">
            <div className="w-10 h-10 rounded-xl bg-brand-amber/15 text-brand-amber font-mono font-extrabold text-lg flex items-center justify-center border border-brand-amber/30">
              01
            </div>
            <h3 className="text-base font-bold text-white">Register & Verify</h3>
            <p className="text-xs text-brand-muted leading-relaxed">
              Create your account in seconds. Place a refundable $500 pre-authorization deposit hold to unlock bidding privileges across all active auctions.
            </p>
          </div>

          <div className="p-6 rounded-2xl bg-brand-card border border-brand-border space-y-3">
            <div className="w-10 h-10 rounded-xl bg-brand-emerald/15 text-brand-emerald font-mono font-extrabold text-lg flex items-center justify-center border border-brand-emerald/30">
              02
            </div>
            <h3 className="text-base font-bold text-white">Real-Time Bidding</h3>
            <p className="text-xs text-brand-muted leading-relaxed">
              Submit live bids or configure private Proxy Auto-Bids. Anti-sniping soft close extends the countdown if late bids arrive in the final 2 minutes.
            </p>
          </div>

          <div className="p-6 rounded-2xl bg-brand-card border border-brand-border space-y-3">
            <div className="w-10 h-10 rounded-xl bg-brand-blue/15 text-brand-blue font-mono font-extrabold text-lg flex items-center justify-center border border-brand-blue/30">
              03
            </div>
            <h3 className="text-base font-bold text-white">Secure Settlement</h3>
            <p className="text-xs text-brand-muted leading-relaxed">
              Winning bids are settled within 48 hours via secure escrow or wire transfer. Title and transport logistics are coordinated directly through our verified portal.
            </p>
          </div>
        </div>
      </section>
    </div>
  );
}
