'use client';

import { useAuth } from '@/components/AuthProvider';
import { getProgress } from '@/lib/progressManager';
import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { 
  User as UserIcon, 
  CheckCircle, 
  Camera, 
  ArrowLeft,
  Save,
  Pencil,
  Zap,
  Share2,
  Mail,
  BookOpen
} from 'lucide-react';

export default function ProfilePage() {
  const { user, profile, profileLoading, updateProfile } = useAuth();
  const [xp, setXp] = useState(0);
  const [mounted, setMounted] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  
  const [formData, setFormData] = useState({
    fullName: '',
    username: '',
    major: '',
    bio: '',
    gender: 'male'
  });
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);
  const [updateError, setUpdateError] = useState<string | null>(null);
  const [updateSuccess, setUpdateSuccess] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    setMounted(true);
    setXp(getProgress().xp);
  }, []);

  useEffect(() => {
    if (profile) {
      setFormData({
        fullName: profile.full_name || '',
        username: profile.username || '',
        major: profile.major || '',
        bio: profile.bio || '',
        gender: profile.gender || 'male'
      });
      setAvatarPreview(profile.avatar_url);
    }
  }, [profile]);

  if (!mounted) return null;

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setAvatarFile(file);
      setAvatarPreview(URL.createObjectURL(file));
    }
  };

  const handleSave = async () => {
    setUpdateError(null);
    setUpdateSuccess(false);

    const result = await updateProfile({
      full_name: formData.fullName,
      username: formData.username,
      major: formData.major,
      bio: formData.bio,
      gender: formData.gender,
      avatarFile: avatarFile || undefined
    });

    if (result.error) {
      setUpdateError(result.error);
    } else {
      setUpdateSuccess(true);
      setIsEditing(false);
      setAvatarFile(null);
      setTimeout(() => setUpdateSuccess(false), 3000);
    }
  };

  const cancelEdit = () => {
    if (profile) {
      setFormData({
        fullName: profile.full_name || '',
        username: profile.username || '',
        major: profile.major || '',
        bio: profile.bio || '',
        gender: profile.gender || 'male'
      });
      setAvatarPreview(profile.avatar_url);
    }
    setAvatarFile(null);
    setIsEditing(false);
    setUpdateError(null);
  };

  const rankDisplay = xp > 0 ? `#${Math.max(1, 100 - Math.floor(xp / 50))}` : 'Unranked';
  const classLetter = profile?.major?.substring(0, 1)?.toUpperCase() || 'C';

  return (
    <div className="min-h-[calc(100vh-6rem)] flex flex-col items-center justify-center px-4 py-8">
      {/* Navigation - pinned top-left */}
      <div className="w-full max-w-4xl mb-6">
        <Link href="/dashboard" className="inline-flex items-center text-gray-500 hover:text-white transition-colors group">
          <ArrowLeft size={16} className="mr-2 group-hover:-translate-x-1 transition-transform" />
          <span className="text-sm font-medium tracking-tight">Return to Dashboard</span>
        </Link>
      </div>

      {/* ─── Single Card Container ─── */}
      <div className="w-full max-w-4xl relative bg-[#0d1025]/80 backdrop-blur-xl border border-purple-500/15 rounded-2xl overflow-hidden shadow-[0_8px_60px_rgba(124,58,237,0.1)] transition-all duration-500 ease-out">
        {/* Top glow accent */}
        <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-transparent via-purple-500/50 to-transparent"></div>
        {/* Corner glow accents */}
        <div className="absolute -top-20 -left-20 w-48 h-48 bg-purple-600/8 rounded-full blur-3xl pointer-events-none"></div>
        <div className="absolute -bottom-20 -right-20 w-48 h-48 bg-fuchsia-600/5 rounded-full blur-3xl pointer-events-none"></div>

        {/* Inner content with crossfade */}
        <div className="relative z-10">
          {!isEditing ? (
            /* ─── VIEW MODE ─── */
            <div key="view" className="animate-in fade-in duration-300">
              <div className="flex flex-col md:flex-row min-h-[420px]">
                {/* ── Left Column: Avatar + Name + Actions ── */}
                <div className="flex flex-col items-center justify-center p-10 md:p-12 md:border-r border-purple-500/10 md:w-[270px] shrink-0">
                  {/* Avatar with glow ring */}
                  <div className="relative group/avatar mb-5">
                    <div className="absolute -inset-1 bg-gradient-to-br from-purple-500/20 to-fuchsia-500/20 rounded-2xl blur-sm"></div>
                    <div className="relative w-28 h-28 rounded-2xl overflow-hidden bg-white/5 ring-2 ring-purple-500/30 flex items-center justify-center shadow-2xl shadow-purple-500/10">
                      {avatarPreview ? (
                        <img src={avatarPreview} alt="Profile" className="w-full h-full object-cover" />
                      ) : (
                        <UserIcon size={44} className="text-gray-600 opacity-40" />
                      )}
                    </div>
                    <input 
                      type="file" 
                      ref={fileInputRef} 
                      onChange={handleFileChange} 
                      className="hidden" 
                      accept="image/*" 
                    />
                  </div>

                  {/* Name & Username */}
                  <h1 className="text-2xl font-bold text-white tracking-tight text-center leading-tight">
                    {profile?.full_name || "New Explorer"}
                  </h1>
                  <p className="text-gray-500 text-sm font-medium mt-1">@{profile?.username || "username"}</p>

                  {/* Action Buttons */}
                  <div className="flex items-center gap-3 mt-6 w-full">
                    <button 
                      onClick={() => setIsEditing(true)}
                      className="flex-1 py-3 px-5 text-xs font-bold uppercase tracking-widest bg-gradient-to-r from-purple-600 to-fuchsia-600 hover:from-purple-500 hover:to-fuchsia-500 text-white rounded-full transition-all duration-300 shadow-lg shadow-purple-500/25 hover:shadow-purple-500/40 hover:-translate-y-0.5"
                    >
                      Update
                    </button>
                    <button className="w-11 h-11 rounded-full bg-white/5 border border-white/10 hover:bg-white/10 hover:border-purple-500/30 transition-all duration-300 flex items-center justify-center text-gray-400 hover:text-purple-400">
                      <Share2 size={15} />
                    </button>
                  </div>
                </div>

                {/* ── Right Column: Stats & Info ── */}
                <div className="flex-1 p-10 md:p-12 flex flex-col justify-center space-y-8">
                  {/* Stats Row */}
                  <div className="flex items-center gap-8">
                    <div className="flex flex-col items-center md:items-start">
                      <span className="text-[10px] uppercase font-bold tracking-[0.15em] text-gray-500/60 mb-1.5">Rank</span>
                      <span className="text-3xl font-extrabold text-white tracking-tighter">{rankDisplay}</span>
                    </div>
                    <div className="w-[1px] h-12 bg-gradient-to-b from-transparent via-purple-500/20 to-transparent"></div>
                    <div className="flex flex-col items-center md:items-start">
                      <span className="text-[10px] uppercase font-bold tracking-[0.15em] text-gray-500/60 mb-1.5">XP</span>
                      <span className="text-3xl font-extrabold text-white tracking-tighter">{xp}</span>
                    </div>
                    <div className="w-[1px] h-12 bg-gradient-to-b from-transparent via-purple-500/20 to-transparent"></div>
                    <div className="flex flex-col items-center md:items-start">
                      <span className="text-[10px] uppercase font-bold tracking-[0.15em] text-gray-500/60 mb-1.5">Class</span>
                      <span className="text-3xl font-extrabold text-purple-400 tracking-tighter">{classLetter}</span>
                    </div>
                  </div>

                  {/* Info Grid */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                    <div>
                      <span className="text-[10px] uppercase font-bold tracking-[0.15em] text-gray-500/60 block mb-2">Study Track</span>
                      <div className="flex items-center gap-3 bg-white/[0.03] border border-white/[0.06] rounded-xl px-4 py-3 hover:border-purple-500/20 transition-colors duration-300 group">
                        <div className="w-8 h-8 rounded-lg bg-purple-500/10 flex items-center justify-center group-hover:bg-purple-500/15 transition-colors">
                          <BookOpen size={15} className="text-purple-400" />
                        </div>
                        <span className="text-white text-sm font-semibold truncate">{profile?.major || "Computer Science"}</span>
                      </div>
                    </div>
                    <div>
                      <span className="text-[10px] uppercase font-bold tracking-[0.15em] text-gray-500/60 block mb-2">Connection</span>
                      <div className="flex items-center gap-3 bg-white/[0.03] border border-white/[0.06] rounded-xl px-4 py-3 hover:border-purple-500/20 transition-colors duration-300 group">
                        <div className="w-8 h-8 rounded-lg bg-purple-500/10 flex items-center justify-center group-hover:bg-purple-500/15 transition-colors">
                          <Mail size={15} className="text-purple-400" />
                        </div>
                        <span className="text-white text-sm font-semibold truncate">{user?.email}</span>
                      </div>
                    </div>
                  </div>

                  {/* About */}
                  <div>
                    <span className="text-[10px] uppercase font-bold tracking-[0.15em] text-gray-500/60 block mb-2">About You</span>
                    <div className="bg-white/[0.03] border border-white/[0.06] rounded-xl px-4 py-3.5 hover:border-purple-500/20 transition-colors duration-300">
                      <p className="text-gray-400 text-sm font-medium leading-relaxed">
                        &quot;{profile?.bio || "Every student has a story. Tell us more about yourself."}&quot;
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            /* ─── EDIT MODE ─── */
            <div key="edit" className="animate-in fade-in duration-300">
              <div className="p-10 md:p-12 space-y-7 min-h-[420px] flex flex-col justify-center">
                {/* Avatar + Name Row */}
                <div className="flex flex-col md:flex-row items-center gap-6">
                  <div className="relative group/avatar">
                    <div className="absolute -inset-1 bg-gradient-to-br from-purple-500/20 to-fuchsia-500/20 rounded-2xl blur-sm"></div>
                    <div className="relative w-28 h-28 rounded-2xl overflow-hidden bg-white/5 ring-2 ring-purple-500/30 flex items-center justify-center">
                      {avatarPreview ? (
                        <img src={avatarPreview} alt="Profile" className="w-full h-full object-cover" />
                      ) : (
                        <UserIcon size={44} className="text-gray-600 opacity-40" />
                      )}
                      <button 
                        onClick={() => fileInputRef.current?.click()}
                        className="absolute inset-0 bg-black/50 backdrop-blur-[2px] flex flex-col items-center justify-center opacity-0 group-hover/avatar:opacity-100 transition-opacity rounded-2xl"
                      >
                        <Camera size={22} className="text-white mb-1" />
                        <span className="text-[9px] text-white font-black uppercase tracking-widest">Change</span>
                      </button>
                    </div>
                    <input 
                      type="file" 
                      ref={fileInputRef} 
                      onChange={handleFileChange} 
                      className="hidden" 
                      accept="image/*" 
                    />
                  </div>

                  <div className="flex-1 w-full">
                    <label className="text-[10px] uppercase font-bold tracking-[0.15em] text-gray-500/60 mb-2 block">Full Name</label>
                    <input
                      type="text"
                      value={formData.fullName}
                      onChange={(e) => setFormData({...formData, fullName: e.target.value})}
                      placeholder="Full Name"
                      className="w-full bg-white/[0.04] border border-white/10 rounded-xl px-5 py-3.5 text-white text-lg font-bold focus:outline-none focus:border-purple-500/50 focus:ring-1 focus:ring-purple-500/20 transition-all"
                    />
                  </div>
                </div>

                {/* Fields Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                  <div>
                    <label className="text-[10px] uppercase font-bold tracking-[0.15em] text-gray-500/60 mb-2 block">Username</label>
                    <input
                      type="text"
                      value={formData.username}
                      onChange={(e) => setFormData({...formData, username: e.target.value})}
                      className="w-full bg-white/[0.04] border border-white/10 rounded-xl px-5 py-3.5 text-white font-medium focus:outline-none focus:border-purple-500/50 focus:ring-1 focus:ring-purple-500/20 transition-all"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] uppercase font-bold tracking-[0.15em] text-gray-500/60 mb-2 block">Academic Major</label>
                    <input
                      type="text"
                      value={formData.major}
                      onChange={(e) => setFormData({...formData, major: e.target.value})}
                      className="w-full bg-white/[0.04] border border-white/10 rounded-xl px-5 py-3.5 text-white font-medium focus:outline-none focus:border-purple-500/50 focus:ring-1 focus:ring-purple-500/20 transition-all"
                    />
                  </div>
                </div>

                {/* Bio */}
                <div>
                  <label className="text-[10px] uppercase font-bold tracking-[0.15em] text-gray-500/60 mb-2 block">About You</label>
                  <textarea
                    value={formData.bio}
                    onChange={(e) => setFormData({...formData, bio: e.target.value})}
                    rows={3}
                    className="w-full bg-white/[0.04] border border-white/10 rounded-xl px-5 py-3.5 text-white font-medium focus:outline-none focus:border-purple-500/50 focus:ring-1 focus:ring-purple-500/20 transition-all resize-none"
                    placeholder="Share your goals and background..."
                  />
                </div>
                
                {updateError && (
                  <div className="text-red-400 text-xs font-bold flex items-center gap-2 bg-red-400/5 p-3.5 rounded-xl border border-red-400/10">
                     <div className="w-2 h-2 rounded-full bg-red-400 animate-pulse"></div>
                     {updateError}
                  </div>
                )}

                {/* Save / Cancel */}
                <div className="flex gap-3 pt-2">
                  <button 
                    onClick={handleSave}
                    disabled={profileLoading}
                    className="flex-1 py-3.5 bg-gradient-to-r from-purple-600 to-fuchsia-600 hover:from-purple-500 hover:to-fuchsia-500 text-white text-sm font-bold uppercase tracking-widest rounded-full flex items-center justify-center gap-2 disabled:opacity-50 transition-all duration-300 shadow-lg shadow-purple-500/25 hover:shadow-purple-500/40 hover:-translate-y-0.5"
                  >
                    {profileLoading ? (
                      <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    ) : (
                      <Save size={16} />
                    )}
                    Save Changes
                  </button>
                  <button 
                    onClick={cancelEdit}
                    className="flex-1 py-3.5 text-sm font-bold uppercase tracking-widest text-gray-500 hover:text-white transition-all duration-300 bg-white/[0.03] rounded-full border border-white/10 hover:bg-white/[0.06] hover:border-purple-500/20"
                  >
                    Discard
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Success Toast */}
      {updateSuccess && (
        <div className="flex items-center justify-center gap-3 text-green-400 animate-in fade-in slide-in-from-bottom-2 mt-5">
          <CheckCircle size={18} />
          <span className="text-sm font-bold uppercase tracking-[0.15em]">Profile Updated</span>
        </div>
      )}

      {/* Footer Link */}
      <div className="mt-6">
         <Link href="/progress" className="text-xs font-bold uppercase tracking-widest text-gray-500 hover:text-purple-400 transition-all duration-300 inline-flex items-center gap-2.5 group">
            <div className="w-7 h-7 rounded-full bg-white/5 flex items-center justify-center group-hover:bg-purple-500/10 transition-colors duration-300">
              <Zap size={13} className="text-gray-500 group-hover:text-purple-400 transition-colors" />
            </div>
            Progress & Analytics
         </Link>
      </div>
    </div>
  );
}
