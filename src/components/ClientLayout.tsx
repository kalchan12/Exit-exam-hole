'use client';

import { useState } from 'react';
import { usePathname } from 'next/navigation';
import Sidebar from './Sidebar';
import { useAuth } from './AuthProvider';
import GuestUpsellModal from './GuestUpsellModal';

export default function ClientLayout({ children }: { children: React.ReactNode }) {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const pathname = usePathname();
  const { user, isGuest, loading } = useAuth();
  
  const isAuthRoute = pathname === '/' || pathname?.startsWith('/auth');

  // If it's a known non-dashboard route (root or /auth/*), 
  // just show the children without sidebar padding.
  if (isAuthRoute) {
    return (
      <main className="min-h-screen bg-slate-950">
        {children}
      </main>
    );
  }

  // For protected routes (Dashboard, etc.):
  // If still loading or not authed, show the same background/loader as Login page 
  // to prevent flashing the dashboard shell.
  if (loading || (!user && !isGuest)) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center">
        <div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  // Authenticated/Guest layout with Sidebar
  return (
    <div className="flex bg-slate-950">
      <Sidebar isCollapsed={isCollapsed} setIsCollapsed={setIsCollapsed} />
      <main 
        className={`flex-1 transition-all duration-300 min-h-screen pb-20 lg:pb-0 ${
          isCollapsed ? 'lg:ml-20' : 'lg:ml-64'
        }`}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          {children}
        </div>
      </main>
      <GuestUpsellModal />
    </div>
  );
}
