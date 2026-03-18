'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useAuth } from './AuthProvider';
import { usePathname } from 'next/navigation';

export default function GuestUpsellModal() {
  const { isGuest } = useAuth();
  const [show, setShow] = useState(false);
  const pathname = usePathname();

  useEffect(() => {
    // Only show to guests, and not on auth pages
    if (isGuest && !pathname?.startsWith('/auth')) {
      // Delay showing it so it's not too aggressive
      const timer = setTimeout(() => {
        // Also check if they've dismissed it in this session
        if (!sessionStorage.getItem('guestUpsellDismissed')) {
          setShow(true);
        }
      }, 5000); // show after 5 seconds on dashboard
      return () => clearTimeout(timer);
    } else {
      setShow(false);
    }
  }, [isGuest, pathname]);

  if (!show) return null;

  const dismiss = () => {
    setShow(false);
    sessionStorage.setItem('guestUpsellDismissed', 'true');
  };

  return (
    <div className="fixed bottom-24 lg:bottom-6 right-6 z-[100] animate-in slide-in-from-bottom-5">
      <div className="bg-slate-900 border-2 border-blue-500/30 rounded-2xl shadow-[0_0_30px_rgba(37,99,235,0.2)] p-6 max-w-sm relative overflow-hidden">
        {/* Decorative background glow */}
        <div className="absolute top-0 right-0 w-32 h-32 bg-blue-600/10 rounded-full blur-2xl -translate-y-1/2 translate-x-1/2 pointer-events-none" />
        
        <button
          onClick={dismiss}
          className="absolute top-4 right-4 text-slate-400 hover:text-white transition-colors"
        >
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>

        <div className="flex items-start gap-4 mb-6">
          <div className="w-12 h-12 rounded-xl bg-blue-600/20 flex items-center justify-center flex-shrink-0 text-2xl shadow-inner">
            💾
          </div>
          <div>
            <h4 className="text-white font-bold text-lg leading-tight">Save your progress?</h4>
            <p className="text-slate-400 text-sm mt-1.5 leading-relaxed">
              You're currently in <strong>Guest Mode</strong>. Create an account to track your level, XP, and streak across all devices.
            </p>
          </div>
        </div>

        <div className="flex flex-col gap-3">
          <Link
            href="/auth/register"
            className="w-full text-center bg-blue-600 hover:bg-blue-700 text-white text-sm font-bold py-3.5 rounded-xl transition-all shadow-lg hover:shadow-blue-600/20 active:scale-[0.98]"
          >
            Create Free Account
          </Link>
          <Link
            href="/auth/login"
            className="w-full text-center text-blue-400 hover:text-blue-300 text-xs font-semibold py-2 transition-colors"
          >
            I already have an account
          </Link>
        </div>
      </div>
    </div>
  );
}
