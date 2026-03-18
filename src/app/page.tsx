'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/components/AuthProvider';

export default function Home() {
  const { user, isGuest, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading) {
      if (user || isGuest) {
        router.replace('/dashboard');
      } else {
        router.replace('/auth/login');
      }
    }
  }, [user, isGuest, loading, router]);

  return (
    <div className="min-h-screen bg-slate-950 flex items-center justify-center">
      <div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
    </div>
  );
}
