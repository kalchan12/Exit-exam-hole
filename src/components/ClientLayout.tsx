'use client';

import { useState, useEffect } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import Sidebar from './Sidebar';
import { useAuth } from './AuthProvider';
import GuestUpsellModal from './GuestUpsellModal';
import ErrorBoundary from './ui/ErrorBoundary';

export default function ClientLayout({ children }: { children: React.ReactNode }) {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const pathname = usePathname();
  const router = useRouter();
  const { user, isGuest, loading } = useAuth();
  
  const isAuthRoute = pathname === '/' || pathname === '/home' || pathname?.startsWith('/auth');

  // Trigger redirect for unauthenticated users trying to access protected routes
  useEffect(() => {
    if (!loading && !user && !isGuest && !isAuthRoute) {
      router.push('/auth/login');
    }
  }, [loading, user, isGuest, isAuthRoute, router]);

  // If it's a known non-dashboard route (root or /auth/*), 
  // just show the children without sidebar padding.
  if (isAuthRoute) {
    return (
      <main className="min-h-screen">
        {children}
      </main>
    );
  }

  // For protected routes (Dashboard, etc.):
  // If still loading or not authed, show the same background/loader as Login page 
  // to prevent flashing the dashboard shell.
  if (loading || (!user && !isGuest)) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="w-10 h-10 border-2 border-primary border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <div className="flex flex-col lg:flex-row min-h-screen">
      <Sidebar isCollapsed={isCollapsed} setIsCollapsed={setIsCollapsed} />
      <main 
        className={`flex-1 transition-all duration-300 min-h-screen pt-16 lg:pt-0 ${
          isCollapsed ? 'lg:ml-20' : 'lg:ml-64'
        }`}
      >
        <div className="max-w-full mx-auto px-margin-mobile lg:px-margin-desktop py-6 lg:py-8">
          <ErrorBoundary>
            {children}
          </ErrorBoundary>
        </div>
      </main>
      <GuestUpsellModal />
    </div>
  );
}
