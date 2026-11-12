import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext.jsx';
import { Card } from '../components/ui/Card.jsx';
import { Badge } from '../components/ui/Badge.jsx';
import { Button } from '../components/ui/Button.jsx';
import {
  PlusCircle,
  DollarSign,
  Car,
  Eye,
  CheckCircle2,
  Sliders,
  MessageSquare,
  Clock,
  ShieldCheck,
  Send
} from 'lucide-react';
import { ListingCreationModal } from '../components/modals/ListingCreationModal.jsx';
import { AdjustReserveModal } from '../components/modals/AdjustReserveModal.jsx';

export function SellerDashboardPage() {
  const { user } = useAuth();
  const [isListingModalOpen, setIsListingModalOpen] = useState(false);
  const [selectedListingForReserve, setSelectedListingForReserve] = useState(null);
  const [activeTab, setActiveTab] = useState('listings');

  const sellerName = user?.roles?.includes('SELLER')
    ? `${user.firstName} ${user.lastName || ''}`.trim()
    : 'Apex Motors LLC';
  const sellerEmail = user?.roles?.includes('SELLER')
    ? user.email
    : 'seller@apexmotors.com';

  const [listings, setListings] = useState([
    {
      id: 'l-1',
      title: '2023 Porsche 911 GT3 RS',
      vin: 'WP0AF2A97MS293812',
      status: 'LIVE',
      currentBid: 295000,
      reservePrice: 280000,
      views: 1420,
      bidsCount: 28,
      inquiriesCount: 2
    },
    {
      id: 'l-2',
      title: '2022 BMW M5 CS',
      vin: 'WBS83AY04MCF92810',
      status: 'SCHEDULED',
      startingPrice: 110000,
      reservePrice: 135000,
      views: 310,
      bidsCount: 0,
      inquiriesCount: 1
    }
  ]);

  const [inquiries, setInquiries] = useState([
    {
      id: 'inq-1',
      vehicle: '2023 Porsche 911 GT3 RS',
      buyer: 'ApexCollector99',
      question: 'Do you have the DME diagnostic over-rev ignition report available for Range 1-6?',
      date: '1 hour ago',
      answered: false,
      reply: ''
    },
    {
      id: 'inq-2',
      vehicle: '2023 Porsche 911 GT3 RS',
      buyer: 'TrackDayHero',
      question: 'Are the Michelin Pilot Sport Cup 2 tires factory original or recently replaced with 2023 date codes?',
      date: '3 hours ago',
      answered: true,
      answer: 'Factory original tires with 2023 week 14 date codes, measuring 7.2/32" all around.'
    }
  ]);

  const [replyText, setReplyText] = useState('');

  const handleListingCreated = (newListing) => {
    setListings((prev) => [newListing, ...prev]);
  };

  const handleReserveUpdated = (listingId, newReserve) => {
    setListings((prev) =>
      prev.map((l) => (l.id === listingId ? { ...l, reservePrice: newReserve } : l))
    );
  };

  const handleSendReply = (inqId) => {
    if (!replyText.trim()) return;
    setInquiries((prev) =>
      prev.map((inq) =>
        inq.id === inqId
          ? { ...inq, answered: true, answer: replyText.trim() }
          : inq
      )
    );
    setReplyText('');
  };

  return (
    <div className="space-y-8">
      {/* Header with CTA */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <h1 className="text-3xl font-extrabold text-white tracking-tight">Seller Consignment Hub</h1>
            <Badge variant="emerald" className="text-xs">
              Authorized Consignor
            </Badge>
          </div>
          <p className="text-sm text-brand-muted">
            Managing as <span className="text-white font-semibold">{sellerName}</span> ({sellerEmail}) • Live Inventory & Reserve Governance
          </p>
        </div>
        <Button
          variant="primary"
          size="md"
          icon={PlusCircle}
          onClick={() => setIsListingModalOpen(true)}
        >
          List New Vehicle
        </Button>
      </div>

      {/* Seller Metrics */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="p-5 space-y-2 bg-brand-surface border-brand-border">
          <div className="flex items-center justify-between text-brand-muted text-xs font-semibold uppercase">
            <span>Vehicles Listed</span>
            <Car className="w-4 h-4 text-brand-amber" />
          </div>
          <p className="text-3xl font-black font-mono text-white">{listings.length}</p>
          <span className="text-xs text-brand-emerald font-medium">1 Live Auction • 1 In Curation</span>
        </Card>

        <Card className="p-5 space-y-2 bg-brand-surface border-brand-border">
          <div className="flex items-center justify-between text-brand-muted text-xs font-semibold uppercase">
            <span>Total Sales Volume</span>
            <DollarSign className="w-4 h-4 text-brand-emerald" />
          </div>
          <p className="text-3xl font-black font-mono text-white">$437,000</p>
          <span className="text-xs text-brand-muted">Past 12 months (0% Seller Fee)</span>
        </Card>

        <Card className="p-5 space-y-2 bg-brand-surface border-brand-border">
          <div className="flex items-center justify-between text-brand-muted text-xs font-semibold uppercase">
            <span>Listing Impressions</span>
            <Eye className="w-4 h-4 text-brand-blue" />
          </div>
          <p className="text-3xl font-black font-mono text-white">1,730</p>
          <span className="text-xs text-brand-muted">Verified enthusiast views</span>
        </Card>

        <Card className="p-5 space-y-2 bg-brand-surface border-brand-border">
          <div className="flex items-center justify-between text-brand-muted text-xs font-semibold uppercase">
            <span>Seller Rating</span>
            <CheckCircle2 className="w-4 h-4 text-brand-emerald" />
          </div>
          <p className="text-3xl font-black font-mono text-brand-amber">5.0 / 5.0</p>
          <span className="text-xs text-brand-muted">Verified Top-Tier Curation</span>
        </Card>
      </div>

      {/* Navigation Tabs */}
      <div className="flex border-b border-brand-border gap-2 text-sm font-semibold">
        <button
          onClick={() => setActiveTab('listings')}
          className={`pb-3 px-3 transition-colors flex items-center gap-2 border-b-2 -mb-px ${
            activeTab === 'listings'
              ? 'border-brand-amber text-brand-amber'
              : 'border-transparent text-brand-muted hover:text-white'
          }`}
        >
          <Car className="w-4 h-4" />
          <span>Active & Scheduled ({listings.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('inquiries')}
          className={`pb-3 px-3 transition-colors flex items-center gap-2 border-b-2 -mb-px ${
            activeTab === 'inquiries'
              ? 'border-brand-amber text-brand-amber'
              : 'border-transparent text-brand-muted hover:text-white'
          }`}
        >
          <MessageSquare className="w-4 h-4" />
          <span>Bidder Inquiries ({inquiries.filter((i) => !i.answered).length} Pending)</span>
        </button>
      </div>

      {/* Tab: Listings */}
      {activeTab === 'listings' && (
        <Card className="p-6 bg-brand-surface border-brand-border space-y-4">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="border-b border-brand-border text-brand-muted uppercase font-mono">
                <tr>
                  <th className="py-3 px-4">Vehicle</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4">Current / Starting</th>
                  <th className="py-3 px-4">Reserve</th>
                  <th className="py-3 px-4">Bids</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-brand-border/60">
                {listings.map((item) => (
                  <tr key={item.id} className="hover:bg-brand-card/50 transition-colors">
                    <td className="py-4 px-4 font-bold text-white">
                      {item.title}
                      <span className="block text-[11px] font-mono text-brand-muted">{item.vin}</span>
                    </td>
                    <td className="py-4 px-4">
                      {item.status === 'LIVE' ? (
                        <Badge variant="live">Live</Badge>
                      ) : item.status === 'PENDING_REVIEW' ? (
                        <Badge variant="blue">Under Curation</Badge>
                      ) : (
                        <Badge variant="amber">Scheduled</Badge>
                      )}
                    </td>
                    <td className="py-4 px-4 font-mono font-bold text-brand-amber">
                      ${(item.currentBid || item.startingPrice || 0).toLocaleString()}
                    </td>
                    <td className="py-4 px-4 font-mono">
                      {item.reservePrice ? `$${item.reservePrice.toLocaleString()}` : 'No Reserve'}
                    </td>
                    <td className="py-4 px-4 font-mono font-semibold">{item.bidsCount || 0}</td>
                    <td className="py-4 px-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        {item.reservePrice > 0 && (
                          <Button
                            variant="secondary"
                            size="sm"
                            icon={Sliders}
                            onClick={() => setSelectedListingForReserve(item)}
                          >
                            Adjust Reserve
                          </Button>
                        )}
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => setActiveTab('inquiries')}
                        >
                          Q&A ({item.inquiriesCount || 0})
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

      {/* Tab: Bidder Inquiries */}
      {activeTab === 'inquiries' && (
        <div className="space-y-4">
          {inquiries.map((inq) => (
            <Card key={inq.id} className="p-6 bg-brand-surface border-brand-border space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-brand-border/60 pb-3">
                <div>
                  <span className="text-xs font-bold text-brand-amber">{inq.vehicle}</span>
                  <p className="text-xs text-brand-muted">
                    Question from <span className="text-white font-semibold">{inq.buyer}</span> • {inq.date}
                  </p>
                </div>
                <Badge variant={inq.answered ? 'emerald' : 'amber'}>
                  {inq.answered ? 'Answered' : 'Awaiting Response'}
                </Badge>
              </div>

              <p className="text-sm text-white font-medium">"{inq.question}"</p>

              {inq.answered ? (
                <div className="p-3.5 rounded-xl bg-brand-bg border border-brand-border text-xs text-brand-muted space-y-1">
                  <span className="font-bold text-brand-emerald flex items-center gap-1.5">
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    Your Official Seller Answer:
                  </span>
                  <p className="text-brand-text">{inq.answer}</p>
                </div>
              ) : (
                <div className="space-y-2 pt-1">
                  <textarea
                    rows={2}
                    value={replyText}
                    onChange={(e) => setReplyText(e.target.value)}
                    placeholder="Type your public response (visible on live auction comment feed)..."
                    className="w-full p-3 bg-brand-bg border border-brand-border rounded-xl text-xs text-white placeholder:text-brand-muted focus:outline-none focus:border-brand-amber"
                  />
                  <div className="flex justify-end">
                    <Button
                      variant="primary"
                      size="sm"
                      icon={Send}
                      onClick={() => handleSendReply(inq.id)}
                    >
                      Post Public Response
                    </Button>
                  </div>
                </div>
              )}
            </Card>
          ))}
        </div>
      )}

      {/* Listing Creation Modal */}
      <ListingCreationModal
        isOpen={isListingModalOpen}
        onClose={() => setIsListingModalOpen(false)}
        onCreated={handleListingCreated}
      />

      {/* Adjust Reserve Modal */}
      <AdjustReserveModal
        isOpen={!!selectedListingForReserve}
        onClose={() => setSelectedListingForReserve(null)}
        listing={selectedListingForReserve}
        onUpdated={handleReserveUpdated}
      />
    </div>
  );
}
