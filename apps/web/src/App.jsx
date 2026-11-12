import React, { useState, useEffect } from 'react';
import { AuthProvider } from './context/AuthContext.jsx';
import { SocketProvider } from './context/SocketContext.jsx';
import { Navbar } from './layouts/Navbar.jsx';
import { Footer } from './layouts/Footer.jsx';
import { MOCK_VEHICLES } from './data/mockVehicles.js';

import { HomePage } from './pages/HomePage.jsx';
import { CatalogPage } from './pages/CatalogPage.jsx';
import { AuctionDetailsPage } from './pages/AuctionDetailsPage.jsx';
import { LoginPage } from './pages/LoginPage.jsx';
import { RegisterPage } from './pages/RegisterPage.jsx';
import { BuyerDashboardPage } from './pages/BuyerDashboardPage.jsx';
import { SellerDashboardPage } from './pages/SellerDashboardPage.jsx';
import { AdminDashboardPage } from './pages/AdminDashboardPage.jsx';
import { HowItWorksPage } from './pages/HowItWorksPage.jsx';

export function AppContent() {
  const getInitialPage = () => {
    const hash = window.location.hash.replace(/^#\/?/, '').trim();
    if (hash) return hash;
    const params = new URLSearchParams(window.location.search);
    return params.get('page') || 'home';
  };

  const [currentPage, setCurrentPage] = useState(getInitialPage);
  const [selectedVehicle, setSelectedVehicle] = useState(MOCK_VEHICLES[0]);

  useEffect(() => {
    const handleHashChange = () => {
      const hash = window.location.hash.replace(/^#\/?/, '').trim();
      if (hash) {
        setCurrentPage(hash);
      }
    };
    window.addEventListener('hashchange', handleHashChange);
    return () => window.removeEventListener('hashchange', handleHashChange);
  }, []);

  const handleSelectVehicle = (vehicle) => {
    setSelectedVehicle(vehicle);
    setCurrentPage('details');
    window.location.hash = 'details';
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleNavigate = (page) => {
    setCurrentPage(page);
    window.location.hash = page;
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <div className="min-h-screen flex flex-col bg-brand-bg text-brand-text">
      {/* Global Navigation Header */}
      <Navbar onNavigate={handleNavigate} currentPage={currentPage} />

      {/* Main Container */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {currentPage === 'home' && (
          <HomePage
            onSelectVehicle={handleSelectVehicle}
            onNavigate={handleNavigate}
          />
        )}

        {currentPage === 'catalog' && (
          <CatalogPage
            onSelectVehicle={handleSelectVehicle}
          />
        )}

        {currentPage === 'details' && selectedVehicle && (
          <AuctionDetailsPage
            vehicle={selectedVehicle}
            onBack={() => setCurrentPage('home')}
          />
        )}

        {currentPage === 'login' && (
          <LoginPage onNavigate={handleNavigate} />
        )}

        {currentPage === 'register' && (
          <RegisterPage onNavigate={handleNavigate} />
        )}

        {currentPage === 'dashboard' && (
          <BuyerDashboardPage onSelectVehicle={handleSelectVehicle} />
        )}

        {currentPage === 'seller' && (
          <SellerDashboardPage />
        )}

        {currentPage === 'admin' && (
          <AdminDashboardPage />
        )}

        {currentPage === 'howItWorks' && (
          <HowItWorksPage onNavigate={handleNavigate} />
        )}
      </main>

      {/* Global Footer */}
      <Footer />
    </div>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <SocketProvider>
        <AppContent />
      </SocketProvider>
    </AuthProvider>
  );
}
