import React from 'react';
import { Card } from '../ui/Card.jsx';
import { Button } from '../ui/Button.jsx';
import { Badge } from '../ui/Badge.jsx';
import { ShieldCheck, X, CheckCircle2, AlertCircle, FileText, Cpu, Activity, Award } from 'lucide-react';

export function InspectionDetailModal({ isOpen, onClose, vehicle }) {
  if (!isOpen || !vehicle) return null;

  const inspection = vehicle.inspection || {
    overallScore: 9.8,
    verifiedMileage: vehicle.mileage || 1840,
    odometerVerified: true,
    summaryNotes: 'Immaculate specimen. Zero mechanical trouble codes.'
  };

  const categories = [
    { name: 'Powertrain & Engine Compression', score: 9.9, items: ['Compression test within 2% across all cylinders', 'No oil weeping from valve covers or rms', 'Fluid analysis: clean factory spec synthetic'] },
    { name: 'Body, Paint & Carbon Fiber Paneling', score: 9.9, items: ['Factory paint meter readings: 4.5 - 5.2 mils across all panels', 'Zero panel alignment gaps or overspray', 'Full front-clip PPF film with zero stone chips'] },
    { name: 'Chassis, Suspension & Undercarriage', score: 9.8, items: ['Hydraulic front-axle lift functional at factory speed', 'Subframe torque marks intact from factory', 'Bushing elasticity 100% compliant with GT tolerances'] },
    { name: 'Brakes, Rotors & Tire Tread Life', score: 9.6, items: ['PCCB Carbon-Ceramic rotors: 0.1% surface wear detected', 'Brake pad thickness: 10.5mm front / 10.2mm rear', 'Michelin Pilot Sport Cup 2: 7.2/32" tread depth all around'] },
    { name: 'Interior, Electronics & Cabin Trim', score: 10.0, items: ['Race-Tex steering wheel zero matting/sheen', 'Carbon bucket seats zero bolster wear', 'PCM infotainment & telemetry modules 100% functional'] }
  ];

  const paintReadings = [
    { panel: 'Hood (Carbon)', reading: '4.8 mils', status: 'Original' },
    { panel: 'Front Bumper', reading: '4.6 mils', status: 'Original' },
    { panel: 'Front Left Fender', reading: '4.9 mils', status: 'Original' },
    { panel: 'Driver Door', reading: '5.1 mils', status: 'Original' },
    { panel: 'Rear Left Quarter', reading: '5.0 mils', status: 'Original' },
    { panel: 'Roof (Carbon)', reading: '4.7 mils', status: 'Original' },
    { panel: 'Rear Engine Deck', reading: '4.9 mils', status: 'Original' },
    { panel: 'Passenger Door', reading: '5.2 mils', status: 'Original' }
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-200">
      <div className="relative w-full max-w-4xl max-h-[90vh] bg-brand-surface border border-brand-border rounded-2xl shadow-2xl flex flex-col overflow-hidden">
        {/* Modal Header */}
        <div className="p-6 border-b border-brand-border flex items-center justify-between bg-brand-card/50">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-brand-emerald/15 border border-brand-emerald/30 flex items-center justify-center text-brand-emerald">
              <ShieldCheck className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-xl font-extrabold text-white">150-Point Digital Condition Report</h2>
                <Badge variant="emerald">Certified</Badge>
              </div>
              <p className="text-xs text-brand-muted">
                {vehicle.year} {vehicle.make} {vehicle.model} • VIN: <span className="font-mono text-brand-text">{vehicle.vin}</span>
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-lg bg-brand-surface border border-brand-border text-brand-muted hover:text-white transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Scrollable Body */}
        <div className="p-6 space-y-6 overflow-y-auto flex-1">
          {/* Top Score Banner */}
          <div className="p-5 rounded-xl bg-brand-bg border border-brand-border flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <span className="text-xs font-mono uppercase text-brand-muted block mb-1">Composite Diagnostic Score</span>
              <div className="flex items-baseline gap-2">
                <span className="text-4xl font-black font-mono text-brand-emerald">{inspection.overallScore}</span>
                <span className="text-sm font-mono text-brand-muted">/ 10.0</span>
              </div>
              <p className="text-xs text-brand-muted mt-1">Tier-1 Collector Grade Specimen • Zero Structural or Mechanical Anomalies</p>
            </div>
            <div className="flex flex-wrap gap-2 sm:flex-col sm:items-end">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-brand-card border border-brand-border text-xs font-mono text-brand-text">
                <Cpu className="w-3.5 h-3.5 text-brand-blue" />
                <span>OBD-II: 0 Active Fault Codes</span>
              </div>
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-brand-card border border-brand-border text-xs font-mono text-brand-text">
                <Activity className="w-3.5 h-3.5 text-brand-emerald" />
                <span>Odometer: {Number(vehicle.mileage).toLocaleString()} mi (Verified)</span>
              </div>
            </div>
          </div>

          {/* Diagnostic Categories */}
          <div className="space-y-4">
            <h3 className="text-sm font-bold uppercase tracking-wider text-brand-muted flex items-center gap-2">
              <Award className="w-4 h-4 text-brand-amber" />
              Subsystem Evaluation Breakdown
            </h3>
            <div className="grid grid-cols-1 gap-3">
              {categories.map((cat, idx) => (
                <div key={idx} className="p-4 rounded-xl bg-brand-card border border-brand-border/80 space-y-2">
                  <div className="flex items-center justify-between text-xs font-bold text-white">
                    <span>{cat.name}</span>
                    <span className="font-mono text-brand-emerald">{cat.score} / 10.0</span>
                  </div>
                  <div className="w-full h-1.5 rounded-full bg-brand-bg overflow-hidden">
                    <div
                      className="h-full rounded-full bg-gradient-to-r from-emerald-600 to-brand-emerald"
                      style={{ width: `${(cat.score / 10) * 100}%` }}
                    />
                  </div>
                  <ul className="grid grid-cols-1 sm:grid-cols-2 gap-1.5 pt-1 text-[11px] text-brand-muted">
                    {cat.items.map((it, i) => (
                      <li key={i} className="flex items-center gap-1.5">
                        <CheckCircle2 className="w-3.5 h-3.5 text-brand-emerald shrink-0" />
                        <span>{it}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          </div>

          {/* Paint Depth Readings Table */}
          <div className="space-y-3">
            <h3 className="text-sm font-bold uppercase tracking-wider text-brand-muted flex items-center gap-2">
              <FileText className="w-4 h-4 text-brand-blue" />
              Paint Thickness Micrometer Meter Readings
            </h3>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
              {paintReadings.map((p, idx) => (
                <div key={idx} className="p-3 rounded-lg bg-brand-bg border border-brand-border text-xs">
                  <span className="text-[10px] text-brand-muted block truncate">{p.panel}</span>
                  <span className="text-sm font-mono font-bold text-brand-text block">{p.reading}</span>
                  <span className="text-[10px] font-semibold text-brand-emerald">{p.status} Paint</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Modal Footer */}
        <div className="p-4 border-t border-brand-border bg-brand-card flex items-center justify-between">
          <span className="text-xs text-brand-muted">Inspected by Master Diagnostic Technician #49281 • Certified ISO-9001</span>
          <Button variant="secondary" size="sm" onClick={onClose}>
            Close Report
          </Button>
        </div>
      </div>
    </div>
  );
}

