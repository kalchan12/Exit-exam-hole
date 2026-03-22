'use client';

import { useAuth } from '@/components/AuthProvider';
import { getProgress } from '@/lib/progressManager';
import { useState, useEffect } from 'react';
import Link from 'next/link';

export default function ProfilePage() {
  const { user, signOut } = useAuth();
  const [xp, setXp] = useState(0);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    setXp(getProgress().xp);
  }, []);

  if (!mounted) return null;

  return (
    <div className="max-w-2xl mx-auto space-y-8 animate-in pb-20">
      <div className="text-center py-10">
        <div className="w-32 h-32 mx-auto rounded-full bg-gradient-to-br from-accent-purple to-fuchsia-600 p-1 mb-6 shadow-2xl shadow-purple-500/20">
          <div className="w-full h-full rounded-full bg-[#0a0b1e] flex items-center justify-center text-5xl">
            {user?.email?.charAt(0).toUpperCase() || '👤'}
          </div>
        </div>
        <h1 className="text-3xl font-black text-white italic tracking-tighter uppercase">{user?.email?.split('@')[0] || 'App User'}</h1>
        <p className="text-gray-500 text-xs font-bold uppercase tracking-[0.3em] mt-2">{user?.email || 'Student Account'}</p>
      </div>

      <div className="glass-card p-8 space-y-6">
        <div className="flex items-center justify-between border-b border-white/5 pb-4">
          <span className="text-gray-400 font-bold uppercase text-xs tracking-widest">Academic Major</span>
          <span className="text-white font-black italic uppercase">Computer Science</span>
        </div>
        <div className="flex items-center justify-between border-b border-white/5 pb-4">
          <span className="text-gray-400 font-bold uppercase text-xs tracking-widest">Global Rank</span>
          <span className="text-accent-purple font-black italic uppercase">Rank #{Math.max(1, 100 - Math.floor(xp/50))}</span>
        </div>
        <div className="flex items-center justify-between border-b border-white/5 pb-4">
          <span className="text-gray-400 font-bold uppercase text-xs tracking-widest">Account Status</span>
          <span className="text-neon-green font-black italic uppercase">Active</span>
        </div>
      </div>

      <div className="flex flex-col gap-3">
        <Link href="/progress" className="btn-primary w-full py-4 text-center font-black uppercase italic tracking-widest">
            View My Full Analytics
        </Link>
        <button 
          onClick={() => signOut()}
          className="w-full py-4 rounded-xl border border-red-500/20 bg-red-500/5 text-red-400 font-black uppercase italic tracking-widest hover:bg-red-500/10 transition-all"
        >
          Sign Out of Account
        </button>
      </div>

      <p className="text-center text-[10px] text-gray-600 uppercase font-black tracking-widest mt-10">
          Exit Exam Prep System v2.0.4
      </p>
    </div>
  );
}
