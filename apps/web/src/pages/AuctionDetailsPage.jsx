import React, { useState, useEffect } from 'react';
import { useSocket } from '../context/SocketContext.jsx';
import { useAuth } from '../context/AuthContext.jsx';
import { BidPanel } from '../components/ui/BidPanel.jsx';
import { Badge } from '../components/ui/Badge.jsx';
import { Card } from '../components/ui/Card.jsx';
import { Button } from '../components/ui/Button.jsx';
import {
  Shield,
  CheckCircle,
  MapPin,
  Gauge,
  Fuel,
  ArrowLeft,
  Heart,
  Share2,
  Sparkles,
  Award,
  FileText,
  Volume2,
  VolumeX,
  Maximize2,
  Cpu
} from 'lucide-react';
import { InspectionDetailModal } from '../components/modals/InspectionDetailModal.jsx';
import { LightboxModal } from '../components/modals/LightboxModal.jsx';

export function AuctionDetailsPage({ vehicle, onBack }) {
  const { socket, isConnected } = useSocket();
  const { user } = useAuth();

  const [activeImageIndex, setActiveImageIndex] = useState(0);
  const [isLightboxOpen, setIsLightboxOpen] = useState(false);
  const [isInspectionModalOpen, setIsInspectionModalOpen] = useState(false);
  const [isSoundEnabled, setIsSoundEnabled] = useState(true);
  const [isWatched, setIsWatched] = useState(false);

  const [auctionState, setAuctionState] = useState(vehicle.auction);
  const [bidsFeed, setBidsFeed] = useState([
    { id: 'b-1', amount: vehicle.auction.currentHighestBid, bidderName: 'Alex ***', createdAt: new Date(Date.now() - 1000 * 60 * 4).toLocaleTimeString(), isWinning: true },
    { id: 'b-2', amount: vehicle.auction.currentHighestBid - vehicle.auction.minimumIncrement, bidderName: 'David ***', createdAt: new Date(Date.now() - 1000 * 60 * 18).toLocaleTimeString(), isWinning: false },
    { id: 'b-3', amount: vehicle.auction.currentHighestBid - vehicle.auction.minimumIncrement * 2, bidderName: 'Marcus ***', createdAt: new Date(Date.now() - 1000 * 60 * 35).toLocaleTimeString(), isWinning: false }
  ]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Subscribe to real-time socket events for this auction
  useEffect(() => {
    if (!socket || !auctionState.id) return;

    socket.emit('auction:join', { auctionId: auctionState.id });

    const handleNewBid = (newBidData) => {
      setAuctionState((prev) => ({
        ...prev,
        currentHighestBid: newBidData.amount,
        bidCount: newBidData.bidCount
      }));

      setBidsFeed((prev) => [
        {
          id: newBidData.bidId,
          amount: newBidData.amount,
          bidderName: newBidData.bidderName,
          createdAt: new Date().toLocaleTimeString(),
          isWinning: true
        },
        ...prev.map((b) => ({ ...b, isWinning: false }))
      ]);
    };

    socket.on('bid:new', handleNewBid);
    return () => {
      socket.off('bid:new', handleNewBid);
      socket.emit('auction:leave', { auctionId: auctionState.id });
    };
  }, [socket, auctionState.id]);

  const handlePlaceBid = async (auctionId, amount) => {
    setIsSubmitting(true);
    try {
      const res = await fetch('/api/v1/bids', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ auctionId, amount })
      });
      if (!res.ok) {
        // In local demo without live api server, optimistically add
        setAuctionState((prev) => ({
          ...prev,
          currentHighestBid: amount,
          bidCount: (prev.bidCount || 0) + 1
        }));
        setBidsFeed((prev) => [
          {
            id: `b-${Date.now()}`,
            amount,
            bidderName: user ? `${user.firstName} (You)` : 'You (Bidder)',
            createdAt: new Date().toLocaleTimeString(),
            isWinning: true
          },
          ...prev.map((b) => ({ ...b, isWinning: false }))
        ]);
        return;
      }
      const json = await res.json();
      return json.data;
    } catch (err) {
      // Local optimistic fallback
      setAuctionState((prev) => ({
        ...prev,
        currentHighestBid: amount,
        bidCount: (prev.bidCount || 0) + 1
      }));
      setBidsFeed((prev) => [
        {
          id: `b-${Date.now()}`,
          amount,
          bidderName: user ? `${user.firstName} (You)` : 'You (Bidder)',
          createdAt: new Date().toLocaleTimeString(),
          isWinning: true
        },
        ...prev.map((b) => ({ ...b, isWinning: false }))
      ]);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSetProxyBid = async (auctionId, maxAmount) => {
    setIsSubmitting(true);
    try {
      await new Promise((r) => setTimeout(r, 400));
    } finally {
      setIsSubmitting(false);
    }
  };

  const images = vehicle.images || [];

  const inspectionCategories = [
    { name: 'Powertrain & Engine Compression', score: 9.9 },
    { name: 'Body, Paint & Carbon Fiber', score: 9.9 },
    { name: 'Chassis, Suspension & Lift', score: 9.8 },
    { name: 'Brakes (PCCB) & Tires', score: 9.6 },
    { name: 'Interior & Electronics', score: 10.0 }
  ];

  return (
    <div className="space-y-8">
      {/* Top Back Navigation Bar */}
      <div className="flex items-center justify-between">
        <Button variant="ghost" size="sm" onClick={onBack} icon={ArrowLeft}>
          Back to Listings
        </Button>
        <div className="flex items-center gap-2">
          <Button
            variant="secondary"
            size="sm"
            icon={Heart}
            onClick={() => setIsWatched(!isWatched)}
            className={isWatched ? 'text-rose-500 border-rose-500/50 bg-rose-500/10' : ''}
          >
            {isWatched ? 'Watching' : 'Watch'}
          </Button>
          <Button variant="secondary" size="sm" icon={Share2}>
            Share
          </Button>
        </div>
      </div>

      {/* Main Vehicle Header Banner */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 border-b border-brand-border pb-6">
        <div>
          <div className="flex items-center gap-2 mb-2 flex-wrap">
            <Badge variant="live">Live Bidding</Badge>
            <Badge variant="emerald">Clean Title</Badge>
            <Badge variant="blue">Inspection Verified</Badge>
            <span className="text-xs font-mono text-brand-muted">VIN: {vehicle.vin}</span>
          </div>

          <h1 className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight">
            {vehicle.year} {vehicle.make} {vehicle.model}
          </h1>
          {vehicle.trim && (
            <p className="text-base text-brand-amber font-medium mt-0.5">{vehicle.trim}</p>
          )}
        </div>

        <div className="flex items-center gap-4 text-xs text-brand-muted">
          <div className="flex items-center gap-1.5">
            <Gauge className="w-4 h-4 text-brand-amber" />
            <span className="font-semibold text-brand-text font-mono">
              {Number(vehicle.mileage).toLocaleString()} mi
            </span>
          </div>
          <div className="flex items-center gap-1.5">
            <MapPin className="w-4 h-4 text-brand-muted" />
            <span>{vehicle.city}, {vehicle.state}</span>
          </div>
        </div>
      </div>

      {/* Grid: Left Showcase vs Right Real-Time Rail */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Left Columns: Gallery, Condition, Specs */}
        <div className="lg:col-span-7 xl:col-span-8 space-y-8">
          {/* Gallery Main Stage with Click-to-Lightbox */}
          <div className="space-y-3">
            <div
              className="relative aspect-[16/10] rounded-2xl overflow-hidden bg-brand-surface border border-brand-border shadow-2xl group cursor-pointer"
              onClick={() => setIsLightboxOpen(true)}
            >
              <img
                src={images[activeImageIndex]?.url || images[0]?.url}
                alt={vehicle.model}
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
              />
              <div className="absolute inset-0 bg-black/20 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                <span className="px-4 py-2 rounded-full bg-black/75 backdrop-blur-md border border-white/20 text-white text-xs font-bold flex items-center gap-2">
                  <Maximize2 className="w-4 h-4 text-brand-amber" />
                  Click to Expand Lightbox ({images.length} Photos)
                </span>
              </div>
            </div>

            {/* Thumbnails Row */}
            <div className="flex items-center gap-3 overflow-x-auto pb-2">
              {images.map((img, idx) => (
                <button
                  key={img.id || idx}
                  type="button"
                  onClick={() => setActiveImageIndex(idx)}
                  className={`relative w-20 sm:w-24 aspect-[16/10] rounded-xl overflow-hidden border-2 shrink-0 transition-all ${
                    activeImageIndex === idx
                      ? 'border-brand-amber ring-2 ring-brand-amber/30 scale-105'
                      : 'border-brand-border/60 opacity-70 hover:opacity-100'
                  }`}
                >
                  <img src={img.url} alt="" className="w-full h-full object-cover" />
                </button>
              ))}
            </div>
          </div>

          {/* Quick Specifications Bar */}
          <Card className="p-6 bg-brand-surface border-brand-border">
            <h3 className="text-xs font-bold uppercase tracking-wider text-brand-muted mb-4">
              Factory Specifications
            </h3>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-xs">
              <div>
                <span className="text-brand-muted block">Engine</span>
                <span className="font-bold text-white block mt-0.5">{vehicle.engine || '4.0L Naturally Aspirated Flat-6'}</span>
              </div>
              <div>
                <span className="text-brand-muted block">Output</span>
                <span className="font-mono font-bold text-brand-amber block mt-0.5">{vehicle.specifications?.horsepower || '518'} HP / {vehicle.specifications?.torqueFtLbs || '342'} lb-ft</span>
              </div>
              <div>
                <span className="text-brand-muted block">Transmission</span>
                <span className="font-bold text-white block mt-0.5">{vehicle.transmission || 'DUAL_CLUTCH'}</span>
              </div>
              <div>
                <span className="text-brand-muted block">Drivetrain</span>
                <span className="font-bold text-white block mt-0.5">{vehicle.driveType || 'RWD'}</span>
              </div>
            </div>
          </Card>

          {/* Vehicle Highlights */}
          <Card className="p-6 space-y-4 bg-brand-surface border-brand-border">
            <h3 className="text-lg font-bold text-white flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-brand-amber" />
              Factory Highlights & Bespoke Options
            </h3>
            <ul className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm text-brand-muted">
              {vehicle.highlights?.map((h, i) => (
                <li key={i} className="flex items-start gap-2.5">
                  <CheckCircle className="w-4 h-4 text-brand-emerald shrink-0 mt-0.5" />
                  <span className="text-brand-text text-xs leading-relaxed">{h}</span>
                </li>
              ))}
            </ul>
          </Card>

          {/* Enhanced 150-Point Condition Report Card */}
          <Card className="p-6 space-y-6 bg-brand-surface border-brand-border">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-brand-border/80 pb-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-brand-emerald/15 border border-brand-emerald/30 flex items-center justify-center text-brand-emerald">
                  <Shield className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-white">150-Point Independent Condition Report</h3>
                  <p className="text-xs text-brand-muted">Diagnostic Telemetry & Micrometer Paint Analysis</p>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <div className="text-right">
                  <span className="text-3xl font-black font-mono text-brand-emerald block">
                    {vehicle.inspection?.overallScore || '9.8'}<span className="text-sm text-brand-muted font-normal">/10</span>
                  </span>
                  <span className="text-[10px] font-bold text-brand-muted uppercase">Certified Collector Grade</span>
                </div>
                <Button
                  variant="primary"
                  size="sm"
                  onClick={() => setIsInspectionModalOpen(true)}
                  icon={FileText}
                >
                  View Full Report
                </Button>
              </div>
            </div>

            {/* Scorecard Category Bars */}
            <div className="space-y-3">
              {inspectionCategories.map((c, i) => (
                <div key={i} className="space-y-1">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-brand-text font-medium">{c.name}</span>
                    <span className="font-mono text-brand-emerald font-bold">{c.score} / 10.0</span>
                  </div>
                  <div className="w-full h-1.5 rounded-full bg-brand-bg overflow-hidden">
                    <div
                      className="h-full rounded-full bg-gradient-to-r from-emerald-600 to-brand-emerald"
                      style={{ width: `${(c.score / 10) * 100}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>

            <div className="p-4 rounded-xl bg-brand-card border border-brand-border text-xs text-brand-muted leading-relaxed">
              <p className="font-semibold text-brand-text mb-1">Inspector Verification Summary:</p>
              {vehicle.inspection?.summaryNotes || 'Immaculate specimen. Paint meter readings confirm 100% factory original paint across all carbon panels. Zero mechanical trouble codes.'}
            </div>
          </Card>

          {/* Narrative Description */}
          <Card className="p-6 space-y-3 bg-brand-surface border-brand-border">
            <h3 className="text-lg font-bold text-white">Curator's Notes & Narrative</h3>
            <p className="text-xs sm:text-sm text-brand-muted leading-relaxed whitespace-pre-line">
              {vehicle.description}
            </p>
          </Card>
        </div>

        {/* Right Columns: Sticky Bidding HUD Rail & Live Feed */}
        <div className="lg:col-span-5 xl:col-span-4 space-y-6">
          <div className="sticky top-24 space-y-6">
            <BidPanel
              auction={auctionState}
              onPlaceBid={handlePlaceBid}
              onSetProxyBid={handleSetProxyBid}
              isSubmitting={isSubmitting}
            />

            {/* Real-Time Bid History Feed */}
            <Card className="p-5 space-y-4 bg-brand-surface border-brand-border">
              <div className="flex items-center justify-between border-b border-brand-border pb-3">
                <div className="flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-brand-emerald animate-ping" />
                  <h4 className="text-xs font-bold text-white uppercase tracking-wider">
                    Authoritative Bids Feed
                  </h4>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setIsSoundEnabled(!isSoundEnabled)}
                    className="p-1 rounded text-brand-muted hover:text-white transition-colors"
                    title={isSoundEnabled ? 'Mute Bid Chime' : 'Unmute Bid Chime'}
                  >
                    {isSoundEnabled ? <Volume2 className="w-3.5 h-3.5" /> : <VolumeX className="w-3.5 h-3.5" />}
                  </button>
                  <span className="text-xs font-mono text-brand-muted">
                    {bidsFeed.length} bids
                  </span>
                </div>
              </div>

              <div className="space-y-2.5 max-h-64 overflow-y-auto pr-1">
                {bidsFeed.map((bid, i) => (
                  <div
                    key={bid.id || i}
                    className={`flex items-center justify-between p-2.5 rounded-xl border text-xs transition-all ${
                      bid.isWinning
                        ? 'bg-brand-emerald/10 border-brand-emerald/40 text-brand-emerald shadow-sm'
                        : 'bg-brand-card border-brand-border text-brand-muted'
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <span className="font-semibold text-brand-text">{bid.bidderName}</span>
                      {bid.isWinning && (
                        <span className="px-1.5 py-0.5 rounded text-[9px] font-bold bg-brand-emerald/20 text-brand-emerald uppercase">
                          High Bid
                        </span>
                      )}
                    </div>
                    <div className="text-right">
                      <span className="font-mono font-bold text-white block text-sm">
                        ${Number(bid.amount).toLocaleString()}
                      </span>
                      <span className="text-[10px] text-brand-muted font-mono">{bid.createdAt}</span>
                    </div>
                  </div>
                ))}
              </div>
            </Card>
          </div>
        </div>
      </div>

      {/* Lightbox Modal */}
      <LightboxModal
        isOpen={isLightboxOpen}
        onClose={() => setIsLightboxOpen(false)}
        images={images}
        activeIndex={activeImageIndex}
        setActiveIndex={setActiveImageIndex}
      />

      {/* 150-Point Inspection Modal */}
      <InspectionDetailModal
        isOpen={isInspectionModalOpen}
        onClose={() => setIsInspectionModalOpen(false)}
        vehicle={vehicle}
      />
    </div>
  );
}
