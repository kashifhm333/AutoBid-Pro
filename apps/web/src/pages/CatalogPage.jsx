import React, { useState, useMemo } from 'react';
import { MOCK_VEHICLES } from '../data/mockVehicles.js';
import { VehicleCard } from '../components/ui/VehicleCard.jsx';
import { Button } from '../components/ui/Button.jsx';
import { Badge } from '../components/ui/Badge.jsx';
import { Search, Filter, SlidersHorizontal, RotateCcw, LayoutGrid, List, Gauge, Fuel, MapPin } from 'lucide-react';

export function CatalogPage({ onSelectVehicle }) {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedMake, setSelectedMake] = useState('ALL');
  const [selectedBodyType, setSelectedBodyType] = useState('ALL');
  const [selectedReserve, setSelectedReserve] = useState('ALL');
  const [priceTier, setPriceTier] = useState('ALL');
  const [sortBy, setSortBy] = useState('ENDING_SOON');
  const [viewMode, setViewMode] = useState('grid'); // 'grid' | 'list'

  const makes = ['ALL', 'Porsche', 'Ferrari', 'BMW', 'Ford'];
  const bodyTypes = ['ALL', 'COUPE', 'SEDAN', 'SUV'];

  const filteredVehicles = useMemo(() => {
    return MOCK_VEHICLES.filter((vehicle) => {
      const matchesSearch =
        searchQuery === '' ||
        vehicle.make.toLowerCase().includes(searchQuery.toLowerCase()) ||
        vehicle.model.toLowerCase().includes(searchQuery.toLowerCase()) ||
        vehicle.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
        vehicle.vin.toLowerCase().includes(searchQuery.toLowerCase());

      const matchesMake = selectedMake === 'ALL' || vehicle.make.toLowerCase() === selectedMake.toLowerCase();
      const matchesBody = selectedBodyType === 'ALL' || vehicle.bodyType === selectedBodyType;

      const currentPrice = Number(vehicle.auction?.currentHighestBid || vehicle.auction?.startingPrice || 0);
      let matchesPrice = true;
      if (priceTier === 'UNDER_100K') matchesPrice = currentPrice < 100000;
      else if (priceTier === '100K_250K') matchesPrice = currentPrice >= 100000 && currentPrice <= 250000;
      else if (priceTier === 'OVER_250K') matchesPrice = currentPrice > 250000;

      let matchesReserve = true;
      if (selectedReserve === 'MET') matchesReserve = !!vehicle.auction?.reserveMet;
      else if (selectedReserve === 'NO_RESERVE') matchesReserve = !vehicle.auction?.reservePrice;

      return matchesSearch && matchesMake && matchesBody && matchesPrice && matchesReserve;
    }).sort((a, b) => {
      if (sortBy === 'PRICE_LOW') {
        const pA = a.auction?.currentHighestBid || a.auction?.startingPrice || 0;
        const pB = b.auction?.currentHighestBid || b.auction?.startingPrice || 0;
        return pA - pB;
      }
      if (sortBy === 'PRICE_HIGH') {
        const pA = a.auction?.currentHighestBid || a.auction?.startingPrice || 0;
        const pB = b.auction?.currentHighestBid || b.auction?.startingPrice || 0;
        return pB - pA;
      }
      if (sortBy === 'MOST_BIDS') {
        return (b.auction?.bidCount || 0) - (a.auction?.bidCount || 0);
      }
      // default: ENDING_SOON
      return 0;
    });
  }, [searchQuery, selectedMake, selectedBodyType, selectedReserve, priceTier, sortBy]);

  const handleReset = () => {
    setSearchQuery('');
    setSelectedMake('ALL');
    setSelectedBodyType('ALL');
    setSelectedReserve('ALL');
    setPriceTier('ALL');
    setSortBy('ENDING_SOON');
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-extrabold text-white tracking-tight">Browse Curated Auctions</h1>
          <p className="text-sm text-brand-muted mt-1">
            Explore {filteredVehicles.length} verified live and upcoming collector vehicles with 150-point diagnostic reports.
          </p>
        </div>

        {/* View Mode Toggle */}
        <div className="flex items-center gap-1.5 p-1 rounded-xl bg-brand-surface border border-brand-border self-start sm:self-auto">
          <button
            onClick={() => setViewMode('grid')}
            className={`p-2 rounded-lg transition-colors ${
              viewMode === 'grid' ? 'bg-brand-card text-brand-amber shadow' : 'text-brand-muted hover:text-white'
            }`}
            title="Grid View"
          >
            <LayoutGrid className="w-4 h-4" />
          </button>
          <button
            onClick={() => setViewMode('list')}
            className={`p-2 rounded-lg transition-colors ${
              viewMode === 'list' ? 'bg-brand-card text-brand-amber shadow' : 'text-brand-muted hover:text-white'
            }`}
            title="Compact List View"
          >
            <List className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Filter Toolbar */}
      <div className="p-5 rounded-2xl bg-brand-surface border border-brand-border space-y-4">
        {/* Search Bar + Sort Dropdown */}
        <div className="flex flex-col md:flex-row items-center gap-3">
          <div className="relative flex-1 w-full">
            <Search className="w-4 h-4 text-brand-muted absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by make, model, VIN, or keyword..."
              className="w-full pl-10 pr-4 py-2.5 bg-brand-bg border border-brand-border rounded-xl text-sm text-brand-text placeholder:text-brand-muted focus:outline-none focus:border-brand-amber transition-colors"
            />
          </div>

          <div className="flex items-center gap-2 w-full md:w-auto">
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="w-full md:w-48 px-3.5 py-2.5 bg-brand-bg border border-brand-border rounded-xl text-xs font-semibold text-brand-text focus:outline-none focus:border-brand-amber cursor-pointer"
            >
              <option value="ENDING_SOON">Ending Soonest</option>
              <option value="MOST_BIDS">Most Active (Bids)</option>
              <option value="PRICE_LOW">Price: Low to High</option>
              <option value="PRICE_HIGH">Price: High to Low</option>
            </select>

            {(searchQuery || selectedMake !== 'ALL' || selectedBodyType !== 'ALL' || priceTier !== 'ALL' || selectedReserve !== 'ALL') && (
              <Button
                variant="ghost"
                size="sm"
                onClick={handleReset}
                icon={RotateCcw}
                className="shrink-0 text-brand-muted hover:text-white"
              >
                Reset
              </Button>
            )}
          </div>
        </div>

        {/* Filter Pills Tiers */}
        <div className="flex flex-wrap items-center gap-6 pt-2 border-t border-brand-border/60 text-xs">
          {/* Make Filter */}
          <div className="flex items-center gap-2">
            <span className="text-brand-muted font-medium">Make:</span>
            <div className="flex flex-wrap gap-1">
              {makes.map((make) => (
                <button
                  key={make}
                  onClick={() => setSelectedMake(make)}
                  className={`px-3 py-1 rounded-lg font-medium transition-all ${
                    selectedMake === make
                      ? 'bg-brand-amber text-black font-bold shadow-glow-amber'
                      : 'bg-brand-bg text-brand-muted hover:text-brand-text border border-brand-border/60'
                  }`}
                >
                  {make}
                </button>
              ))}
            </div>
          </div>

          {/* Body Type Filter */}
          <div className="flex items-center gap-2">
            <span className="text-brand-muted font-medium">Body:</span>
            <div className="flex flex-wrap gap-1">
              {bodyTypes.map((body) => (
                <button
                  key={body}
                  onClick={() => setSelectedBodyType(body)}
                  className={`px-3 py-1 rounded-lg font-medium transition-all ${
                    selectedBodyType === body
                      ? 'bg-brand-amber text-black font-bold shadow-glow-amber'
                      : 'bg-brand-bg text-brand-muted hover:text-brand-text border border-brand-border/60'
                  }`}
                >
                  {body}
                </button>
              ))}
            </div>
          </div>

          {/* Reserve Status */}
          <div className="flex items-center gap-2">
            <span className="text-brand-muted font-medium">Reserve:</span>
            <div className="flex gap-1">
              {[
                { id: 'ALL', label: 'All' },
                { id: 'MET', label: 'Reserve Met' },
                { id: 'NO_RESERVE', label: 'No Reserve' }
              ].map((r) => (
                <button
                  key={r.id}
                  onClick={() => setSelectedReserve(r.id)}
                  className={`px-2.5 py-1 rounded-lg text-xs font-medium transition-all ${
                    selectedReserve === r.id
                      ? 'bg-brand-emerald text-black font-bold'
                      : 'bg-brand-bg text-brand-muted hover:text-brand-text border border-brand-border/60'
                  }`}
                >
                  {r.label}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Vehicles Presentation (Grid vs List) */}
      {filteredVehicles.length > 0 ? (
        viewMode === 'grid' ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {filteredVehicles.map((vehicle) => (
              <VehicleCard
                key={vehicle.id}
                vehicle={vehicle}
                onSelect={onSelectVehicle}
              />
            ))}
          </div>
        ) : (
          /* List Mode */
          <div className="space-y-4">
            {filteredVehicles.map((vehicle) => (
              <div
                key={vehicle.id}
                onClick={() => onSelectVehicle && onSelectVehicle(vehicle)}
                className="p-4 rounded-2xl bg-brand-card border border-brand-border hover:border-brand-amber/50 cursor-pointer transition-all flex flex-col sm:flex-row items-center gap-5 group"
              >
                <img
                  src={vehicle.images?.[0]?.url}
                  alt=""
                  className="w-full sm:w-48 h-32 object-cover rounded-xl border border-brand-border shrink-0 group-hover:scale-105 transition-transform"
                />
                <div className="flex-1 min-w-0 space-y-1.5 w-full">
                  <div className="flex items-center gap-2">
                    <Badge variant={vehicle.auction?.status === 'LIVE' ? 'live' : 'amber'}>
                      {vehicle.auction?.status === 'LIVE' ? 'Live Auction' : 'Upcoming'}
                    </Badge>
                    {vehicle.auction?.reserveMet && <Badge variant="emerald">Reserve Met</Badge>}
                    <span className="text-xs font-mono text-brand-muted">VIN: {vehicle.vin}</span>
                  </div>
                  <h3 className="text-lg font-bold text-white group-hover:text-brand-amber transition-colors">
                    {vehicle.year} {vehicle.make} {vehicle.model} {vehicle.trim && `• ${vehicle.trim}`}
                  </h3>
                  <div className="flex items-center gap-4 text-xs text-brand-muted">
                    <span className="flex items-center gap-1 font-mono">
                      <Gauge className="w-3.5 h-3.5 text-brand-amber" />
                      {Number(vehicle.mileage).toLocaleString()} mi
                    </span>
                    <span className="flex items-center gap-1">
                      <Fuel className="w-3.5 h-3.5 text-brand-amber" />
                      {vehicle.fuelType}
                    </span>
                    <span className="flex items-center gap-1">
                      <MapPin className="w-3.5 h-3.5 text-brand-muted" />
                      {vehicle.city}, {vehicle.state}
                    </span>
                  </div>
                </div>

                <div className="flex sm:flex-col items-center sm:items-end justify-between w-full sm:w-auto shrink-0 border-t sm:border-t-0 border-brand-border/60 pt-3 sm:pt-0 gap-2">
                  <div className="text-left sm:text-right">
                    <span className="text-[10px] text-brand-muted uppercase font-mono block">Current Bid</span>
                    <span className="text-xl font-black font-mono text-brand-amber">
                      ${(vehicle.auction?.currentHighestBid || vehicle.auction?.startingPrice || 0).toLocaleString()}
                    </span>
                  </div>
                  <Button variant="primary" size="sm">
                    Place Bid &rarr;
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )
      ) : (
        <div className="p-12 rounded-3xl bg-brand-surface border border-brand-border text-center space-y-4">
          <div className="w-12 h-12 rounded-full bg-brand-amber/15 border border-brand-amber/30 text-brand-amber flex items-center justify-center mx-auto">
            <Filter className="w-6 h-6" />
          </div>
          <h3 className="text-lg font-bold text-white">No Vehicles Matched Your Filter Criteria</h3>
          <p className="text-xs text-brand-muted max-w-sm mx-auto">
            Try adjusting make, body type, or search terms to see available live auctions.
          </p>
          <Button variant="secondary" size="sm" onClick={handleReset} icon={RotateCcw}>
            Reset All Filters
          </Button>
        </div>
      )}
    </div>
  );
}
