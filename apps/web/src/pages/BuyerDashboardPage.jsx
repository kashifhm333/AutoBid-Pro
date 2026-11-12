import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext.jsx';
import { Card } from '../components/ui/Card.jsx';
import { Badge } from '../components/ui/Badge.jsx';
import { Button } from '../components/ui/Button.jsx';
import { PriceDisplay } from '../components/ui/PriceDisplay.jsx';
import {
  Gavel,
  Trophy,
  Clock,
  ShieldCheck,
  Heart,
  FileText,
  CreditCard,
  Truck,
  ExternalLink,
  CheckCircle2,
  AlertTriangle
} from 'lucide-react';
import { QuickBidModal } from '../components/modals/QuickBidModal.jsx';
import { MOCK_VEHICLES } from '../data/mockVehicles.js';

export function BuyerDashboardPage({ onSelectVehicle }) {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState('bids');
  const [selectedBidForBump, setSelectedBidForBump] = useState(null);

  const [activeBids, setActiveBids] = useState([
    {
      id: 'auc-001',
      vehicleTitle: '2023 Porsche 911 GT3 RS',
      trim: 'Weissach Package',
      myBid: 295000,
      currentBid: 295000,
      status: 'WINNING',
      endTime: '3h 42m',
      vehicleId: 'v-001',
      vehicle: MOCK_VEHICLES[0]
    },
    {
      id: 'auc-002',
      vehicleTitle: '2020 Ferrari 488 Pista',
      trim: 'Carbon Speciale',
      myBid: 435000,
      currentBid: 445000,
      status: 'OUTBID',
      endTime: '18m',
      vehicleId: 'v-002',
      vehicle: MOCK_VEHICLES[1]
    }
  ]);

  const watchlist = [
    {
      id: 'w-1',
      vehicle: MOCK_VEHICLES[2] || MOCK_VEHICLES[0],
      currentBid: 142000,
      endTime: '21h 59m',
      bidCount: 19
    },
    {
      id: 'w-2',
      vehicle: MOCK_VEHICLES[3] || MOCK_VEHICLES[1],
      currentBid: 89500,
      endTime: '1d 23h',
      bidCount: 22
    }
  ];

  const wonAuctions = [
    {
      id: 'won-1',
      title: '2021 BMW M3 Competition',
      vin: 'WBS33AY05MCF81920',
      winningBid: 78500,
      buyerPremium: 3925,
      totalAmount: 82425,
      escrowStatus: 'WIRE_PENDING',
      closingDeadline: '38h remaining',
      imageUrl: 'https://images.unsplash.com/photo-1555215695-3004980ad54e?auto=format&fit=crop&w=800&q=80'
    }
  ];

  const handleQuickBidPlaced = (bidId, newAmount) => {
    setActiveBids((prev) =>
      prev.map((b) =>
        b.id === bidId
          ? {
              ...b,
              myBid: newAmount,
              currentBid: newAmount,
              status: 'WINNING'
            }
          : b
      )
    );
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-extrabold text-white tracking-tight">Buyer Dashboard</h1>
          <p className="text-sm text-brand-muted mt-1">
            Welcome back, <span className="text-white font-semibold">{user?.firstName || 'Alex (Collector)'}</span>. Monitor live bids, watchlist, and escrow settlements.
          </p>
        </div>
        <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-xl bg-brand-surface border border-brand-border text-xs font-mono">
          <span className="w-2 h-2 rounded-full bg-brand-emerald animate-ping" />
          <span className="text-brand-muted">Active Escrow Desk: Online</span>
        </div>
      </div>

      {/* KPI Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="p-5 space-y-2 bg-brand-surface border-brand-border">
          <div className="flex items-center justify-between text-brand-muted text-xs font-semibold uppercase">
            <span>Active Bids</span>
            <Gavel className="w-4 h-4 text-brand-amber" />
          </div>
          <p className="text-3xl font-black font-mono text-white">{activeBids.length}</p>
          <span className="text-xs text-brand-emerald font-medium">1 Currently Winning</span>
        </Card>

        <Card className="p-5 space-y-2 bg-brand-surface border-brand-border">
          <div className="flex items-center justify-between text-brand-muted text-xs font-semibold uppercase">
            <span>Won Vehicles</span>
            <Trophy className="w-4 h-4 text-brand-emerald" />
          </div>
          <p className="text-3xl font-black font-mono text-white">1</p>
          <span className="text-xs text-brand-muted">2021 BMW M3 Competition</span>
        </Card>

        <Card className="p-5 space-y-2 bg-brand-surface border-brand-border">
          <div className="flex items-center justify-between text-brand-muted text-xs font-semibold uppercase">
            <span>Ending Soon</span>
            <Clock className="w-4 h-4 text-brand-crimson" />
          </div>
          <p className="text-3xl font-black font-mono text-brand-crimson">1</p>
          <span className="text-xs text-brand-muted">Ferrari 488 Pista (18m left)</span>
        </Card>

        <Card className="p-5 space-y-2 bg-brand-surface border-brand-border">
          <div className="flex items-center justify-between text-brand-muted text-xs font-semibold uppercase">
            <span>Security Deposit</span>
            <ShieldCheck className="w-4 h-4 text-brand-blue" />
          </div>
          <p className="text-2xl font-black font-mono text-brand-emerald">VERIFIED</p>
          <span className="text-xs text-brand-muted font-mono">Visa •••• 4242 ($500 Hold)</span>
        </Card>
      </div>

      {/* Tab Navigation */}
      <div className="flex border-b border-brand-border gap-2 text-sm font-semibold">
        <button
          onClick={() => setActiveTab('bids')}
          className={`pb-3 px-3 transition-colors flex items-center gap-2 border-b-2 -mb-px ${
            activeTab === 'bids'
              ? 'border-brand-amber text-brand-amber'
              : 'border-transparent text-brand-muted hover:text-white'
          }`}
        >
          <Gavel className="w-4 h-4" />
          <span>Active Bids ({activeBids.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('watchlist')}
          className={`pb-3 px-3 transition-colors flex items-center gap-2 border-b-2 -mb-px ${
            activeTab === 'watchlist'
              ? 'border-brand-amber text-brand-amber'
              : 'border-transparent text-brand-muted hover:text-white'
          }`}
        >
          <Heart className="w-4 h-4" />
          <span>Watchlist ({watchlist.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('won')}
          className={`pb-3 px-3 transition-colors flex items-center gap-2 border-b-2 -mb-px ${
            activeTab === 'won'
              ? 'border-brand-amber text-brand-amber'
              : 'border-transparent text-brand-muted hover:text-white'
          }`}
        >
          <Trophy className="w-4 h-4" />
          <span>Won Auctions & Escrow ({wonAuctions.length})</span>
        </button>
      </div>

      {/* Tab Content: Active Bids */}
      {activeTab === 'bids' && (
        <Card className="p-6 bg-brand-surface border-brand-border space-y-4">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="border-b border-brand-border text-brand-muted uppercase font-mono">
                <tr>
                  <th className="py-3 px-4">Vehicle</th>
                  <th className="py-3 px-4">Your Bid</th>
                  <th className="py-3 px-4">Leading Bid</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4">Time Left</th>
                  <th className="py-3 px-4 text-right">Quick Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-brand-border/60">
                {activeBids.map((bid) => (
                  <tr key={bid.id} className="hover:bg-brand-card/50 transition-colors">
                    <td className="py-4 px-4 font-bold text-white">
                      {bid.vehicleTitle}
                      <span className="block text-[11px] font-normal text-brand-muted">{bid.trim}</span>
                    </td>
                    <td className="py-4 px-4 font-mono font-semibold">${bid.myBid.toLocaleString()}</td>
                    <td className="py-4 px-4 font-mono font-bold text-brand-amber">${bid.currentBid.toLocaleString()}</td>
                    <td className="py-4 px-4">
                      {bid.status === 'WINNING' ? (
                        <Badge variant="emerald">Winning</Badge>
                      ) : (
                        <Badge variant="live">Outbid</Badge>
                      )}
                    </td>
                    <td className="py-4 px-4 font-mono">{bid.endTime}</td>
                    <td className="py-4 px-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        {bid.status === 'OUTBID' && (
                          <Button
                            variant="primary"
                            size="sm"
                            onClick={() => setSelectedBidForBump(bid)}
                          >
                            Bump +$2,500
                          </Button>
                        )}
                        <Button
                          variant="secondary"
                          size="sm"
                          onClick={() => onSelectVehicle && onSelectVehicle(bid.vehicle)}
                        >
                          View Details
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      )}

      {/* Tab Content: Watchlist */}
      {activeTab === 'watchlist' && (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {watchlist.map((item) => (
            <Card key={item.id} className="p-5 bg-brand-surface border-brand-border flex gap-4 items-center">
              <img
                src={item.vehicle.images?.[0]?.url}
                alt=""
                className="w-32 h-24 object-cover rounded-xl border border-brand-border shrink-0"
              />
              <div className="flex-1 min-w-0 space-y-1">
                <h4 className="text-sm font-bold text-white truncate">
                  {item.vehicle.year} {item.vehicle.make} {item.vehicle.model}
                </h4>
                <div className="flex items-center gap-2 text-xs">
                  <span className="text-brand-muted">Current Bid:</span>
                  <span className="font-mono font-bold text-brand-amber">${item.currentBid.toLocaleString()}</span>
                </div>
                <div className="flex items-center gap-2 text-xs font-mono text-brand-muted">
                  <Clock className="w-3.5 h-3.5 text-brand-amber" />
                  <span>{item.endTime} left</span>
                </div>
                <div className="pt-2">
                  <Button
                    variant="primary"
                    size="sm"
                    onClick={() => onSelectVehicle && onSelectVehicle(item.vehicle)}
                  >
                    Bid Now
                  </Button>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}

      {/* Tab Content: Won Auctions & Escrow */}
      {activeTab === 'won' && (
        <div className="space-y-4">
          {wonAuctions.map((item) => (
            <Card key={item.id} className="p-6 bg-brand-surface border-brand-border space-y-6">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-brand-border pb-4">
                <div className="flex items-center gap-4">
                  <img src={item.imageUrl} alt="" className="w-24 h-16 object-cover rounded-xl border border-brand-border" />
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <h3 className="text-lg font-bold text-white">{item.title}</h3>
                      <Badge variant="emerald">Auction Won</Badge>
                    </div>
                    <span className="text-xs font-mono text-brand-muted">VIN: {item.vin}</span>
                  </div>
                </div>

                <div className="text-right">
                  <span className="text-xs font-mono text-brand-muted uppercase block">Total Due with 5% Premium</span>
                  <span className="text-2xl font-mono font-black text-brand-amber">
                    ${item.totalAmount.toLocaleString()}
                  </span>
                </div>
              </div>

              {/* Settlement Progress Bar */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
                <div className="p-4 rounded-xl bg-brand-bg border border-brand-border space-y-1">
                  <span className="text-brand-muted block">1. Escrow Wire Transfer</span>
                  <span className="font-bold text-brand-amber flex items-center gap-1.5">
                    <Clock className="w-4 h-4 text-brand-amber" />
                    Pending ({item.closingDeadline})
                  </span>
                </div>

                <div className="p-4 rounded-xl bg-brand-bg border border-brand-border space-y-1">
                  <span className="text-brand-muted block">2. Title & Bill of Sale</span>
                  <span className="font-bold text-white flex items-center gap-1.5">
                    <FileText className="w-4 h-4 text-brand-blue" />
                    Draft Ready for Digital Sign
                  </span>
                </div>

                <div className="p-4 rounded-xl bg-brand-bg border border-brand-border space-y-1">
                  <span className="text-brand-muted block">3. Transport Logistics</span>
                  <span className="font-bold text-brand-muted flex items-center gap-1.5">
                    <Truck className="w-4 h-4 text-brand-muted" />
                    Carrier Coordination Upon Wire
                  </span>
                </div>
              </div>

              <div className="flex flex-wrap items-center justify-between gap-4 pt-2">
                <span className="text-xs text-brand-muted">
                  Escrow Wire Instructions sent to your registered email. Insured transport guarantee by AutoBid Logistics.
                </span>
                <div className="flex items-center gap-2">
                  <Button variant="secondary" size="sm" icon={FileText}>
                    Download Bill of Sale (PDF)
                  </Button>
                  <Button variant="primary" size="sm">
                    Complete Escrow Wire
                  </Button>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}

      {/* Quick Bid Modal */}
      <QuickBidModal
        isOpen={!!selectedBidForBump}
        onClose={() => setSelectedBidForBump(null)}
        bid={selectedBidForBump}
        onBidPlaced={handleQuickBidPlaced}
      />
    </div>
  );
}
