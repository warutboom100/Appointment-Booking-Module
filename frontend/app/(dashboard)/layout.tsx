'use client';

import { useState, type ReactNode } from 'react';
import { AuthGuard } from '@/features/auth/AuthGuard';
import { Sidebar } from '@/components/layout/Sidebar';
import { Navbar } from '@/components/layout/Navbar';

export default function DashboardLayout({ children }: { children: ReactNode }) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [bookingModalOpen, setBookingModalOpen] = useState(false);

  return (
    <AuthGuard>
      <div className="flex h-screen overflow-hidden bg-[var(--bg)] text-[var(--fg)]">
        {/* Desktop Sidebar */}
        <Sidebar
          className="hidden md:flex flex-shrink-0"
          onOpenBooking={() => setBookingModalOpen(true)}
        />

        {/* Mobile Sidebar Overlay */}
        {mobileMenuOpen && (
          <div className="fixed inset-0 z-50 md:hidden flex">
            <div
              className="fixed inset-0 bg-black/40 backdrop-blur-xs transition-opacity"
              onClick={() => setMobileMenuOpen(false)}
            />
            <div className="relative z-10 w-64 bg-[var(--surface)] h-full shadow-2xl animate-slide-in">
              <Sidebar
                className="w-full h-full border-r-0"
                onOpenBooking={() => {
                  setMobileMenuOpen(false);
                  setBookingModalOpen(true);
                }}
              />
            </div>
          </div>
        )}

        {/* Main Content Area */}
        <div className="flex flex-col flex-1 min-w-0 overflow-hidden">
          <Navbar onToggleMobileMenu={() => setMobileMenuOpen(true)} />
          <main className="flex-1 overflow-y-auto p-4 sm:p-6 md:p-8">
            <div className="max-w-7xl mx-auto">{children}</div>
          </main>
        </div>
      </div>
    </AuthGuard>
  );
}
