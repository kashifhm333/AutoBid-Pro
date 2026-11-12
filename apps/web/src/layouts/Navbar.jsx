import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext.jsx';
import { useSocket } from '../context/SocketContext.jsx';
import { Button } from '../components/ui/Button.jsx';
import { Badge } from '../components/ui/Badge.jsx';
import {
  Gauge,
  Search,
  Bell,
  User as UserIcon,
  LogOut,
  PlusCircle,
  LayoutDashboard,
  Shield,
  Menu,
  X,
  Users,
  ChevronDown,
  CheckCircle2
} from 'lucide-react';

export function Navbar({ onNavigate, currentPage = 'home' }) {
  const { user, logout, isAuthenticated, setPersona } = useAuth();
  const { isConnected } = useSocket();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [userDropdownOpen, setUserDropdownOpen] = useState(false);
  const [personaOpen, setPersonaOpen] = useState(false);

  const togglePersona = () => {
    setUserDropdownOpen(false);
    setPersonaOpen((prev) => !prev);
  };

  const toggleUserDropdown = () => {
    setPersonaOpen(false);
    setUserDropdownOpen((prev) => !prev);
  };

  const closeAllDropdowns = () => {
    setPersonaOpen(false);
    setUserDropdownOpen(false);
  };

  const personas = [
    {
      label: 'Guest Visitor',
      role: 'GUEST',
      sub: 'Public View (Signed Out)',
      action: () => {
        logout();
        onNavigate('home');
      }
    },
    {
      label: 'Alex (Buyer/Collector)',
      role: 'BUYER',
      sub: 'Active Bids & Escrow',
      action: () => {
        setPersona('BUYER');
        onNavigate('dashboard');
      }
    },
    {
      label: 'Apex Motors (Seller)',
      role: 'SELLER',
      sub: 'Manage & List Cars',
      action: () => {
        setPersona('SELLER');
        onNavigate('seller');
      }
    },
    {
      label: 'Mark (Admin Curator)',
      role: 'ADMIN',
      sub: 'Curation & Governance',
      action: () => {
        setPersona('ADMIN');
        onNavigate('admin');
      }
    }
  ];

  const userRole = user?.roles?.[0] || 'BUYER';
  const roleBadgeVariant =
    userRole === 'ADMINISTRATOR' || userRole === 'SUPER_ADMINISTRATOR' || userRole === 'ADMIN'
      ? 'blue'
      : userRole === 'SELLER'
      ? 'emerald'
      : 'amber';

  return (
    <header className="sticky top-0 z-50 bg-brand-bg/90 backdrop-blur-xl border-b border-brand-border">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-20 flex items-center justify-between gap-4">
        {/* Brand Logo */}
        <div
          className="flex items-center gap-3 cursor-pointer group shrink-0"
          onClick={() => onNavigate('home')}
        >
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-brand-amber to-amber-600 flex items-center justify-center shadow-glow-amber group-hover:scale-105 transition-transform">
            <Gauge className="w-6 h-6 text-black" />
          </div>
          <div>
            <span className="text-xl font-extrabold tracking-tight text-white block">
              AutoBid<span className="text-brand-amber">Pro</span>
            </span>
            <span className="text-[10px] font-mono tracking-widest text-brand-muted uppercase block -mt-1">
              Curated Auctions
            </span>
          </div>
        </div>

        {/* Desktop Navigation Links */}
        <nav className="hidden md:flex items-center gap-6 text-sm font-medium">
          <button
            type="button"
            onClick={() => onNavigate('catalog')}
            className={`transition-colors hover:text-brand-amber flex items-center gap-1.5 ${
              currentPage === 'catalog' ? 'text-brand-amber font-semibold' : 'text-brand-muted'
            }`}
          >
            <span className="w-2 h-2 rounded-full bg-rose-500 animate-ping" />
            Live Auctions
          </button>
          <button
            type="button"
            onClick={() => onNavigate('catalog')}
            className={`transition-colors hover:text-brand-amber ${
              currentPage === 'browse' ? 'text-brand-amber font-semibold' : 'text-brand-muted'
            }`}
          >
            Browse Inventory
          </button>
          <button
            type="button"
            onClick={() => onNavigate('howItWorks')}
            className={`transition-colors hover:text-brand-amber ${
              currentPage === 'howItWorks' ? 'text-brand-amber font-semibold' : 'text-brand-muted'
            }`}
          >
            How It Works
          </button>
        </nav>

        {/* Right Action Bar */}
        <div className="flex items-center gap-3">
          {/* Socket Engine Status Indicator */}
          <div className="hidden lg:flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-brand-surface border border-brand-border text-[11px] font-mono">
            <span className={`w-2 h-2 rounded-full ${isConnected ? 'bg-brand-emerald' : 'bg-brand-emerald animate-pulse'}`} />
            <span className="text-brand-muted">{isConnected ? 'Live WebSocket' : 'Authoritative Sync'}</span>
          </div>

          {/* Invisible Backdrop to close dropdowns on outside click */}
          {(personaOpen || userDropdownOpen) && (
            <div
              className="fixed inset-0 z-40 bg-transparent"
              onClick={closeAllDropdowns}
            />
          )}

          {/* Quick Role Switcher Pill */}
          <div className="relative z-50">
            <button
              type="button"
              onClick={togglePersona}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-brand-card hover:bg-brand-surface border border-brand-border text-xs font-semibold text-brand-amber transition-colors shadow-sm"
              title="Switch demo persona to test any view instantly"
            >
              <Users className="w-3.5 h-3.5 text-brand-amber" />
              <span className="hidden sm:inline">
                {isAuthenticated ? `Role: ${userRole}` : 'Persona'}
              </span>
              <ChevronDown className="w-3 h-3 text-brand-muted" />
            </button>

            {personaOpen && (
              <div className="absolute right-0 mt-2 w-64 bg-brand-card border border-brand-border rounded-2xl shadow-2xl py-2 z-50 animate-in fade-in">
                <div className="px-4 py-2 border-b border-brand-border/60">
                  <p className="text-[10px] font-mono uppercase tracking-wider text-brand-muted">Instant Persona Switcher</p>
                  <p className="text-xs text-white font-medium">Switch roles to test all dashboards:</p>
                </div>
                {personas.map((p, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => {
                      closeAllDropdowns();
                      p.action();
                    }}
                    className="w-full px-4 py-2.5 text-left hover:bg-brand-surface flex items-start justify-between transition-colors"
                  >
                    <div>
                      <p className="text-xs font-bold text-white">{p.label}</p>
                      <p className="text-[10px] text-brand-muted">{p.sub}</p>
                    </div>
                    <Badge variant={p.role === 'ADMIN' ? 'blue' : p.role === 'SELLER' ? 'emerald' : p.role === 'BUYER' ? 'amber' : 'default'} className="text-[9px]">
                      {p.role}
                    </Badge>
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* User Sign In / Profile Bar */}
          {isAuthenticated ? (
            <div className="relative z-50">
              <button
                type="button"
                onClick={toggleUserDropdown}
                className="flex items-center gap-2 p-1.5 rounded-xl bg-brand-surface border border-brand-border hover:border-brand-borderLight transition-all group"
              >
                <div className="relative">
                  <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-brand-amber/20 to-brand-amber/40 border border-brand-amber/50 flex items-center justify-center font-bold text-brand-amber text-xs shadow-sm">
                    {user?.firstName?.[0] || 'A'}
                  </div>
                  <span className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 rounded-full bg-brand-emerald border-2 border-brand-surface" />
                </div>

                <div className="text-left hidden sm:block pr-1">
                  <span className="text-xs font-bold text-white block leading-tight">
                    {user?.firstName}
                  </span>
                  <span className="text-[10px] font-mono text-brand-amber uppercase block leading-none">
                    {userRole}
                  </span>
                </div>
                <ChevronDown className="w-3.5 h-3.5 text-brand-muted group-hover:text-white transition-colors" />
              </button>

              {userDropdownOpen && (
                <div className="absolute right-0 mt-2 w-64 bg-brand-card border border-brand-border rounded-2xl shadow-2xl py-2 z-50 animate-in fade-in">
                  <div className="px-4 py-3 border-b border-brand-border/60">
                    <div className="flex items-center justify-between mb-1">
                      <p className="text-xs font-bold text-white truncate">{user?.firstName} {user?.lastName}</p>
                      <Badge variant={roleBadgeVariant} className="text-[9px]">
                        {userRole}
                      </Badge>
                    </div>
                    <p className="text-[11px] text-brand-muted truncate font-mono">{user?.email}</p>
                    <div className="mt-2 flex items-center gap-1.5 text-[10px] text-brand-emerald">
                      <CheckCircle2 className="w-3 h-3" />
                      <span>Verified Active Collector</span>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() => {
                      closeAllDropdowns();
                      onNavigate('dashboard');
                    }}
                    className="w-full px-4 py-2.5 text-left text-xs text-brand-muted hover:text-white hover:bg-brand-surface flex items-center gap-2"
                  >
                    <LayoutDashboard className="w-4 h-4 text-brand-amber" />
                    Buyer Dashboard
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      closeAllDropdowns();
                      onNavigate('seller');
                    }}
                    className="w-full px-4 py-2.5 text-left text-xs text-brand-muted hover:text-white hover:bg-brand-surface flex items-center gap-2"
                  >
                    <PlusCircle className="w-4 h-4 text-brand-emerald" />
                    Seller Dashboard
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      closeAllDropdowns();
                      onNavigate('admin');
                    }}
                    className="w-full px-4 py-2.5 text-left text-xs text-brand-muted hover:text-white hover:bg-brand-surface flex items-center gap-2"
                  >
                    <Shield className="w-4 h-4 text-brand-blue" />
                    Admin Command Center
                  </button>

                  <div className="border-t border-brand-border/60 my-1" />

                  <button
                    type="button"
                    onClick={() => {
                      closeAllDropdowns();
                      logout();
                      onNavigate('home');
                    }}
                    className="w-full px-4 py-2 text-left text-xs text-brand-crimson hover:bg-brand-crimson/10 flex items-center gap-2"
                  >
                    <LogOut className="w-4 h-4" />
                    Sign Out
                  </button>
                </div>
              )}
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => onNavigate('login')}
              >
                Sign In
              </Button>
              <Button
                variant="primary"
                size="sm"
                onClick={() => onNavigate('register')}
              >
                Get Started
              </Button>
            </div>
          )}

          {/* Mobile Menu Toggle */}
          <button
            type="button"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="md:hidden p-2 rounded-lg bg-brand-surface border border-brand-border text-brand-muted"
          >
            {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>
      </div>

      {/* Mobile Drawer */}
      {mobileMenuOpen && (
        <div className="md:hidden bg-brand-card border-b border-brand-border px-4 pt-2 pb-6 space-y-3">
          <button
            type="button"
            onClick={() => {
              setMobileMenuOpen(false);
              onNavigate('catalog');
            }}
            className="block w-full text-left py-2 text-sm font-semibold text-brand-text"
          >
            Live Auctions
          </button>
          <button
            type="button"
            onClick={() => {
              setMobileMenuOpen(false);
              onNavigate('catalog');
            }}
            className="block w-full text-left py-2 text-sm font-semibold text-brand-text"
          >
            Browse Inventory
          </button>
          <button
            type="button"
            onClick={() => {
              setMobileMenuOpen(false);
              onNavigate('howItWorks');
            }}
            className="block w-full text-left py-2 text-sm font-semibold text-brand-text"
          >
            How It Works
          </button>
          <div className="border-t border-brand-border pt-3 grid grid-cols-3 gap-2">
            <button
              onClick={() => {
                setMobileMenuOpen(false);
                setPersona('BUYER');
                onNavigate('dashboard');
              }}
              className="py-2 text-center rounded-lg bg-brand-surface text-xs font-bold text-brand-amber border border-brand-border"
            >
              Buyer
            </button>
            <button
              onClick={() => {
                setMobileMenuOpen(false);
                setPersona('SELLER');
                onNavigate('seller');
              }}
              className="py-2 text-center rounded-lg bg-brand-surface text-xs font-bold text-brand-emerald border border-brand-border"
            >
              Seller
            </button>
            <button
              onClick={() => {
                setMobileMenuOpen(false);
                setPersona('ADMIN');
                onNavigate('admin');
              }}
              className="py-2 text-center rounded-lg bg-brand-surface text-xs font-bold text-brand-blue border border-brand-border"
            >
              Admin
            </button>
          </div>
        </div>
      )}
    </header>
  );
}
