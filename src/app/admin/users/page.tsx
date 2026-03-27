'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { useAuth } from '@/components/AuthProvider';
import { deleteUserAccount } from '@/lib/supabaseLoader';
import Link from 'next/link';

interface Profile {
  id: string;
  username: string;
  full_name: string;
  major: string;
  email?: string;
  created_at?: string;
}

export default function UserManagementPage() {
  const { profile, loading: authLoading } = useAuth();
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  useEffect(() => {
    if (!authLoading && profile?.username !== 'psycho') {
        window.location.href = '/dashboard';
        return;
    }
    fetchProfiles();
  }, [profile, authLoading]);

  async function fetchProfiles() {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setProfiles(data || []);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  const handleDeleteUser = async (id: string, username: string) => {
    if (!confirm(`Are you sure you want to delete user "${username}"? This will remove their profile.`)) return;
    
    setDeletingId(id);
    try {
        const success = await deleteUserAccount(id);
        if (success) {
            setProfiles(prev => prev.filter(p => p.id !== id));
        } else {
            alert('Failed to delete user profile.');
        }
    } catch (err) {
        console.error(err);
        alert('An error occurred while deleting.');
    } finally {
        setDeletingId(null);
    }
  };

  if (authLoading || loading) {
    return (
      <div className="min-h-screen bg-[#0a0b1e] flex items-center justify-center">
        <div className="w-12 h-12 border-4 border-accent-purple/20 border-t-accent-purple rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0a0b1e] p-4 lg:p-8 pt-24 lg:pt-8 ml-0 lg:ml-20">
      <div className="max-w-6xl mx-auto space-y-8">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
          <div>
            <h1 className="text-4xl md:text-5xl font-black text-white italic uppercase tracking-tighter leading-none mb-2">
              User <span className="text-accent-purple">Management</span>
            </h1>
            <p className="text-xs text-gray-400 font-bold uppercase tracking-[0.3em]">Administrative Control Center</p>
          </div>
          <div className="flex items-center gap-3">
             <div className="px-4 py-2 rounded-2xl bg-white/5 border border-white/10 flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
                <span className="text-[10px] font-black text-white uppercase tracking-widest">{profiles.length} Active Users</span>
             </div>
          </div>
        </div>

        {/* Profiles Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {profiles.map((p) => (
            <div 
              key={p.id} 
              className="group relative bg-[#11152a] rounded-[2rem] border-2 border-white/5 p-6 transition-all duration-300 hover:border-accent-purple/40 hover:shadow-2xl hover:shadow-purple-500/10 overflow-hidden"
            >
              {/* Background Glow */}
              <div className="absolute -top-12 -right-12 w-32 h-32 bg-accent-purple/10 blur-3xl rounded-full opacity-0 group-hover:opacity-100 transition-opacity" />
              
              <div className="relative flex items-start gap-4">
                <div className="w-14 h-14 rounded-2xl bg-accent-purple/20 border border-accent-purple/30 flex items-center justify-center text-accent-purple text-xl font-black shadow-lg shadow-purple-500/10 flex-shrink-0">
                  {p.username[0]?.toUpperCase()}
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="text-lg font-black text-white uppercase italic truncate tracking-tight">{p.full_name || 'No Name'}</h3>
                  <p className="text-xs text-accent-purple-light font-bold uppercase tracking-widest mt-0.5">@{p.username}</p>
                  <p className="text-[10px] text-gray-500 font-bold uppercase tracking-widest mt-2">{p.major || 'Computer Science'}</p>
                </div>
              </div>

              <div className="mt-6 flex items-center justify-between border-t border-white/5 pt-4">
                <div className="text-[9px] text-gray-600 font-black uppercase tracking-widest">
                  ID: {p.id.slice(0, 8)}...
                </div>
                <button 
                  onClick={() => handleDeleteUser(p.id, p.username)}
                  disabled={deletingId === p.id || p.username === 'psycho'}
                  className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${
                    p.username === 'psycho' 
                    ? 'bg-white/5 text-gray-600 cursor-not-allowed'
                    : 'bg-red-500/10 text-red-400 hover:bg-red-500 hover:text-white disabled:opacity-50'
                  }`}
                >
                  {deletingId === p.id ? 'Deleting...' : 'Delete User'}
                </button>
              </div>
            </div>
          ))}

          {profiles.length === 0 && (
            <div className="col-span-full py-20 text-center">
              <p className="text-gray-500 font-black uppercase tracking-widest italic">No users found in the system</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
