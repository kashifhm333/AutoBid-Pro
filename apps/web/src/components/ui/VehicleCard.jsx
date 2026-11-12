import React, { useState } from 'react';
import { Card } from './Card.jsx';
import { Badge } from './Badge.jsx';
import { AuctionTimer } from './AuctionTimer.jsx';
import { PriceDisplay } from './PriceDisplay.jsx';
import { Heart, MapPin, Gauge, Fuel, ShieldCheck } from 'lucide-react';

export function VehicleCard({ vehicle, onSelect = null }) {
  const [isFavorited, setIsFavorited] = useState(false);

  const auction = vehicle.auction || {};
  const currentBid = Number(auction.currentHighestBid) || Number(auction.startingPrice) || 0;
  const imageUrl = vehicle.images?.[0]?.url || 'https://images.unsplash.com/photo-1617788138017-80ad40651399?auto=format&fit=crop&w=1000&q=80';

  return (
    <Card
      hoverEffect
      className="group cursor-pointer flex flex-col bg-brand-card border-brand-border rounded-2xl overflow-hidden hover:border-brand-borderLight transition-all duration-300"
      onClick={() => onSelect && onSelect(vehicle)}
    >
      {/* Image Container with High-Contrast Dual Scrims */}
      <div className="relative aspect-[16/10] overflow-hidden bg-brand-surface">
        <img
          src={imageUrl}
          alt={`${vehicle.year} ${vehicle.make} ${vehicle.model}`}
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500 ease-out"
          loading="lazy"
        />

        {/* Top-Down Scrim for Badges & Buttons */}
        <div className="absolute top-0 left-0 right-0 h-24 bg-gradient-to-b from-black/90 via-black/40 to-transparent pointer-events-none" />

        {/* Bottom-Up Scrim for Timer */}
        <div className="absolute bottom-0 left-0 right-0 h-20 bg-gradient-to-t from-brand-bg/95 via-black/40 to-transparent pointer-events-none" />

        {/* Top Badges */}
        <div className="absolute top-3 left-3 flex items-center gap-1.5 z-10">
          {auction.status === 'LIVE' ? (
            <Badge variant="live">Live Auction</Badge>
          ) : (
            <Badge variant="amber">Upcoming</Badge>
          )}

          {auction.reserveMet ? (
            <Badge variant="emerald">Reserve Met</Badge>
          ) : !auction.reservePrice ? (
            <Badge variant="blue">No Reserve</Badge>
          ) : null}
        </div>

        {/* Favorite Watchlist Button */}
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            setIsFavorited(!isFavorited);
          }}
          className={`absolute top-3 right-3 p-2 rounded-full backdrop-blur-md border transition-all z-10 ${
            isFavorited
              ? 'bg-rose-500/20 border-rose-500 text-rose-500 shadow-glow-crimson'
              : 'bg-black/60 border-white/20 text-white/80 hover:text-white hover:bg-black/80'
          }`}
          title={isFavorited ? 'Remove from Watchlist' : 'Save to Watchlist'}
        >
          <Heart className={`w-4 h-4 ${isFavorited ? 'fill-rose-500 text-rose-500' : ''}`} />
        </button>

        {/* Bottom Timer Overlay */}
        {auction.endTime && (
          <div className="absolute bottom-3 left-3 z-10">
            <AuctionTimer endTime={auction.endTime} className="text-xs py-1" />
          </div>
        )}
      </div>

      {/* Content Area */}
      <div className="p-4 flex-1 flex flex-col justify-between">
        <div>
          {/* Title & Trim */}
          <div className="flex items-start justify-between gap-2">
            <div>
              <h3 className="text-base font-bold text-white group-hover:text-brand-amber transition-colors line-clamp-1">
                {vehicle.year} {vehicle.make} {vehicle.model}
              </h3>
              {vehicle.trim && (
                <p className="text-xs text-brand-muted font-medium mb-1 line-clamp-1">{vehicle.trim}</p>
              )}
            </div>
          </div>

          <div className="flex items-center gap-2 mb-3">
            <span className="text-[10px] font-mono text-brand-muted">VIN: {vehicle.vin?.slice(0, 11)}•••</span>
            <span className="text-[10px] text-brand-emerald flex items-center gap-0.5">
              <ShieldCheck className="w-3 h-3" />
              Verified
            </span>
          </div>

          {/* Quick Specs Chips */}
          <div className="grid grid-cols-2 gap-2 text-xs text-brand-muted border-t border-brand-border/60 pt-3 mb-4">
            <div className="flex items-center gap-1.5">
              <Gauge className="w-3.5 h-3.5 text-brand-amber" />
              <span className="font-mono">{Number(vehicle.mileage || 0).toLocaleString()} mi</span>
            </div>
            <div className="flex items-center gap-1.5">
              <Fuel className="w-3.5 h-3.5 text-brand-amber" />
              <span className="capitalize">{vehicle.fuelType?.toLowerCase() || 'Gasoline'}</span>
            </div>
            <div className="flex items-center gap-1.5 col-span-2">
              <MapPin className="w-3.5 h-3.5 text-brand-muted" />
              <span className="line-clamp-1">{vehicle.city}, {vehicle.state}</span>
            </div>
          </div>
        </div>

        {/* Price & Action Row */}
        <div className="flex items-end justify-between border-t border-brand-border pt-3">
          <PriceDisplay
            amount={currentBid}
            label={auction.status === 'LIVE' ? 'Current Bid' : 'Starting Price'}
            size="md"
            className="text-brand-amber font-mono font-bold"
          />

          <div className="text-right">
            <span className="text-xs text-brand-muted font-mono block">
              {auction.bidCount || 0} bids
            </span>
            <span className="text-xs font-bold text-brand-amber group-hover:translate-x-0.5 transition-transform inline-block">
              Place Bid &rarr;
            </span>
          </div>
        </div>
      </div>
    </Card>
  );
}
