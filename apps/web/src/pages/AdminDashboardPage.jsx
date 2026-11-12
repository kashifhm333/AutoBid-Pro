import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext.jsx';
import { Card } from '../components/ui/Card.jsx';
import { Badge } from '../components/ui/Badge.jsx';
import { Button } from '../components/ui/Button.jsx';
import {
  Shield,
  Check,
  X,
  AlertTriangle,
  Users,
  DollarSign,
  Gavel,
  Eye,
  Clock,
  Pause,
  Play,
  RotateCcw,
  FileCheck
} from 'lucide-react';
import { CurationReviewModal } from '../components/modals/CurationReviewModal.jsx';

export function AdminDashboardPage() {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState('curation');
  const [selectedSubmission, setSelectedSubmission] = useState(null);

  const adminName = user?.roles?.some(r => r.includes('ADMIN'))
    ? `${user.firstName} ${user.lastName || ''}`.trim()
    : 'Mark Hendrickson';
  const adminEmail = user?.roles?.some(r => r.includes('ADMIN'))
    ? user.email
    : 'admin@autobidpro.com';

  const [queue, setQueue] = useState([
    {
      id: 'sub-1',
      vehicle: '2024 Chevrolet Corvette Z06 3LZ',
      seller: 'Mark Hendrickson',
      vin: '1G1YB2D47P5102938',
      mileage: 950,
      submittedDate: '2 hours ago',
      inspectionScore: '9.9'
    },
    {
      id: 'sub-2',
      vehicle: '1997 Toyota Supra Turbo 15th Anniversary',
      seller: 'Apex Motors LLC (Dealer)',
      vin: 'JT2JA82J8V0029102',
      mileage: 42100,
      submittedDate: '5 hours ago',
      inspectionScore: '9.4'
    }
  ]);

  const [liveAuctions, setLiveAuctions] = useState([
    {
      id: 'auc-001',
      vehicle: '2023 Porsche 911 GT3 RS',
      highBid: 295000,
      bidCount: 28,
      timeLeft: '03h : 41m',
      status: 'HEALTHY',
      softClosesTriggered: 0
    },
    {
      id: 'auc-002',
      vehicle: '2020 Ferrari 488 Pista',
      highBid: 445000,
      bidCount: 34,
      timeLeft: '00h : 17m',
      status: 'HEALTHY',
      softClosesTriggered: 1
    }
  ]);

  const [actionMessage, setActionMessage] = useState(null);

  const handleDecision = (id, action) => {
    setQueue((prev) => prev.filter((item) => item.id !== id));
    setActionMessage(
      action === 'approve'
        ? `Submission #${id} approved & published to Live Auctions!`
        : `Submission #${id} rejected and returned to seller for revision.`
    );
    setTimeout(() => setActionMessage(null), 3500);
  };

  const handleEmergencyExtend = (auctionId) => {
    setLiveAuctions((prev) =>
      prev.map((a) =>
        a.id === auctionId
          ? {
              ...a,
              timeLeft: '00h : 22m',
              softClosesTriggered: a.softClosesTriggered + 1
            }
          : a
      )
    );
    setActionMessage(`Manual soft close extension (+5 minutes) applied to ${auctionId}!`);
    setTimeout(() => setActionMessage(null), 3000);
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-brand-blue/15 text-brand-blue text-xs font-semibold uppercase mb-2 border border-brand-blue/30">
            <Shield className="w-3.5 h-3.5" />
            Administrative Governance
          </div>
          <h1 className="text-3xl font-extrabold text-white tracking-tight">Platform Command Center</h1>
          <p className="text-sm text-brand-muted mt-1">
            Curator: <span className="text-white font-semibold">{adminName}</span> ({adminEmail}) • Clearance: <span className="text-brand-blue font-mono font-bold">LEVEL 4 HIGH-TOUCH</span>
          </p>
        </div>
        <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-xl bg-brand-surface border border-brand-border text-xs font-mono">
          <span className="w-2 h-2 rounded-full bg-brand-emerald animate-ping" />
          <span className="text-brand-muted">Governance Audit Log: Synchronized</span>
        </div>
      </div>

      {actionMessage && (
        <div className="p-3 rounded-xl bg-brand-emerald/15 border border-brand-emerald/30 text-brand-emerald text-xs font-bold flex items-center gap-2 animate-in fade-in">
          <Check className="w-4 h-4 shrink-0" />
          <span>{actionMessage}</span>
        </div>
      )}

      {/* KPI Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="p-5 space-y-2 bg-brand-surface border-brand-border">
          <div className="flex items-center justify-between text-brand-muted text-xs font-semibold uppercase">
            <span>Gross Platform Volume</span>
            <DollarSign className="w-4 h-4 text-brand-emerald" />
          </div>
          <p className="text-3xl font-black font-mono text-white">$2.84M</p>
          <span className="text-xs text-brand-emerald font-medium">+18.4% vs last month</span>
        </Card>

        <Card className="p-5 space-y-2 bg-brand-surface border-brand-border">
          <div className="flex items-center justify-between text-brand-muted text-xs font-semibold uppercase">
            <span>Active Auctions</span>
            <Gavel className="w-4 h-4 text-brand-amber" />
          </div>
          <p className="text-3xl font-black font-mono text-white">4</p>
          <span className="text-xs text-brand-muted">100% Anti-Sniping Compliance</span>
        </Card>

        <Card className="p-5 space-y-2 bg-brand-surface border-brand-border">
          <div className="flex items-center justify-between text-brand-muted text-xs font-semibold uppercase">
            <span>Pending Approvals</span>
            <AlertTriangle className="w-4 h-4 text-brand-crimson" />
          </div>
          <p className="text-3xl font-black font-mono text-brand-crimson">{queue.length}</p>
          <span className="text-xs text-brand-muted">Awaiting curation review</span>
        </Card>

        <Card className="p-5 space-y-2 bg-brand-surface border-brand-border">
          <div className="flex items-center justify-between text-brand-muted text-xs font-semibold uppercase">
            <span>Registered Bidders</span>
            <Users className="w-4 h-4 text-brand-blue" />
          </div>
          <p className="text-3xl font-black font-mono text-white">1,480</p>
          <span className="text-xs text-brand-muted">98% Identity Verified</span>
        </Card>
      </div>

      {/* Navigation Tabs */}
      <div className="flex border-b border-brand-border gap-2 text-sm font-semibold">
        <button
          onClick={() => setActiveTab('curation')}
          className={`pb-3 px-3 transition-colors flex items-center gap-2 border-b-2 -mb-px ${
            activeTab === 'curation'
              ? 'border-brand-amber text-brand-amber'
              : 'border-transparent text-brand-muted hover:text-white'
          }`}
        >
          <FileCheck className="w-4 h-4" />
          <span>Vehicle Curation Queue ({queue.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('operations')}
          className={`pb-3 px-3 transition-colors flex items-center gap-2 border-b-2 -mb-px ${
            activeTab === 'operations'
              ? 'border-brand-amber text-brand-amber'
              : 'border-transparent text-brand-muted hover:text-white'
          }`}
        >
          <Clock className="w-4 h-4" />
          <span>Live Auction Telemetry & Soft-Close Controls</span>
        </button>
      </div>

      {/* Tab: Curation Queue */}
      {activeTab === 'curation' && (
        <Card className="p-6 bg-brand-surface border-brand-border space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-bold text-white">Vehicle Curation Queue</h3>
              <p className="text-xs text-brand-muted">
                Review title verification, odometer logs, and diagnostic score before publishing to live marketplace
              </p>
            </div>
            <Badge variant="amber">{queue.length} Pending</Badge>
          </div>

          {queue.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="border-b border-brand-border text-brand-muted uppercase font-mono">
                  <tr>
                    <th className="py-3 px-4">Vehicle Details</th>
                    <th className="py-3 px-4">Seller</th>
                    <th className="py-3 px-4">Mileage</th>
                    <th className="py-3 px-4">Inspection</th>
                    <th className="py-3 px-4">Submitted</th>
                    <th className="py-3 px-4 text-right">Curation Decision</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-brand-border/60">
                  {queue.map((item) => (
                    <tr key={item.id} className="hover:bg-brand-card/50 transition-colors">
                      <td className="py-4 px-4 font-bold text-white">
                        {item.vehicle}
                        <span className="block text-[11px] font-mono text-brand-muted">{item.vin}</span>
                      </td>
                      <td className="py-4 px-4 text-brand-muted">{item.seller}</td>
                      <td className="py-4 px-4 font-mono font-semibold">{item.mileage.toLocaleString()} mi</td>
                      <td className="py-4 px-4">
                        <span className="font-mono font-bold text-brand-emerald">{item.inspectionScore} / 10</span>
                      </td>
                      <td className="py-4 px-4 text-brand-muted">{item.submittedDate}</td>
                      <td className="py-4 px-4 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <Button
                            variant="secondary"
                            size="sm"
                            icon={Eye}
                            onClick={() => setSelectedSubmission(item)}
                          >
                            Review Dossier
                          </Button>
                          <Button
                            variant="emerald"
                            size="sm"
                            icon={Check}
                            onClick={() => handleDecision(item.id, 'approve')}
                          >
                            Approve
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            icon={X}
                            onClick={() => handleDecision(item.id, 'reject')}
                          >
                            Reject
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="py-12 text-center text-brand-muted text-sm space-y-2">
              <Check className="w-8 h-8 text-brand-emerald mx-auto" />
              <p className="font-semibold text-white">All vehicle submissions have been reviewed!</p>
              <p className="text-xs">No pending items in the curation queue.</p>
            </div>
          )}
        </Card>
      )}

      {/* Tab: Live Auction Operations & Emergency Controls */}
      {activeTab === 'operations' && (
        <Card className="p-6 bg-brand-surface border-brand-border space-y-4">
          <div>
            <h3 className="text-lg font-bold text-white">Live Auction Engine Governance</h3>
            <p className="text-xs text-brand-muted">
              Live status, authoritative server clocks, and emergency anti-sniping soft close intervention
            </p>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="border-b border-brand-border text-brand-muted uppercase font-mono">
                <tr>
                  <th className="py-3 px-4">Auction ID / Vehicle</th>
                  <th className="py-3 px-4">Current High Bid</th>
                  <th className="py-3 px-4">Bids Placed</th>
                  <th className="py-3 px-4">Time Left</th>
                  <th className="py-3 px-4">Soft Closes</th>
                  <th className="py-3 px-4 text-right">Intervention Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-brand-border/60">
                {liveAuctions.map((auc) => (
                  <tr key={auc.id} className="hover:bg-brand-card/50 transition-colors">
                    <td className="py-4 px-4 font-bold text-white">
                      {auc.vehicle}
                      <span className="block text-[11px] font-mono text-brand-muted">{auc.id}</span>
                    </td>
                    <td className="py-4 px-4 font-mono font-bold text-brand-amber">
                      ${auc.highBid.toLocaleString()}
                    </td>
                    <td className="py-4 px-4 font-mono">{auc.bidCount}</td>
                    <td className="py-4 px-4 font-mono font-bold text-white">{auc.timeLeft}</td>
                    <td className="py-4 px-4 font-mono text-brand-emerald">{auc.softClosesTriggered} extended</td>
                    <td className="py-4 px-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <Button
                          variant="secondary"
                          size="sm"
                          icon={Clock}
                          onClick={() => handleEmergencyExtend(auc.id)}
                        >
                          +5m Soft Close
                        </Button>
                        <Button variant="ghost" size="sm" icon={Pause}>
                          Pause
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

      {/* Curation Review Dossier Modal */}
      <CurationReviewModal
        isOpen={!!selectedSubmission}
        onClose={() => setSelectedSubmission(null)}
        submission={selectedSubmission}
        onDecision={handleDecision}
      />
    </div>
  );
}
