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
  Zap
} from 'lucide-react';

export default function ProfilePage() {
  const { user, profile, profileLoading, updateProfile } = useAuth();
  const [xp, setXp] = useState(0);
  const [mounted, setMounted] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  
  // Form State
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

  return (
    <div className="max-w-4xl mx-auto py-16 px-6 animate-in fade-in duration-700">
      {/* Navigation */}
      <Link href="/dashboard" className="inline-flex items-center text-gray-500 hover:text-white transition-colors mb-12 group">
        <ArrowLeft size={18} className="mr-2 group-hover:-translate-x-1 transition-transform" />
        <span className="text-sm font-medium tracking-tight">Return to Dashboard</span>
      </Link>

      <div className="space-y-12">
        {/* Unified Profile Card */}
        <div className="bg-white/[0.02] border border-white/[0.05] rounded-[3rem] shadow-[0_32px_64px_-12px_rgba(0,0,0,0.5)] relative overflow-hidden group">
          {/* Accent Header Background */}
          <div className="absolute top-0 left-0 w-full h-48 bg-gradient-to-br from-purple-600/10 via-fuchsia-600/5 to-transparent pointer-events-none"></div>
          
          <div className="relative z-10">
            {/* Header with Avatar & Basic Info */}
            <div className="p-8 md:p-12 pb-2 md:pb-4 flex flex-col md:flex-row items-center md:items-end gap-8">
              {/* Avatar section - now part of the header area */}
              <div className="relative group/avatar">
                <div className="w-36 h-36 rounded-[2.5rem] overflow-hidden bg-white/5 ring-4 ring-[#0A0B1E] flex items-center justify-center relative transition-transform duration-500 group-hover/avatar:scale-[1.02] shadow-2xl">
                  {avatarPreview ? (
                    <img src={avatarPreview} alt="Profile" className="w-full h-full object-cover" />
                  ) : (
                    <UserIcon size={56} className="text-gray-600 opacity-40" />
                  )}
                  
                  {isEditing && (
                    <button 
                      onClick={() => fileInputRef.current?.click()}
                      className="absolute inset-0 bg-black/50 backdrop-blur-[2px] flex flex-col items-center justify-center opacity-0 group-hover/avatar:opacity-100 transition-opacity"
                    >
                      <Camera size={24} className="text-white mb-1" />
                      <span className="text-[10px] text-white font-black uppercase tracking-widest">Edit</span>
                    </button>
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

              <div className="flex-1 text-center md:text-left pb-2">
                <div className="space-y-2">
                  {!isEditing ? (
                    <h1 className="text-4xl md:text-5xl font-bold text-white tracking-tight leading-none group-hover:text-purple-300 transition-colors">
                      {profile?.full_name || "New Explorer"}
                    </h1>
                  ) : (
                    <input
                      type="text"
                      value={formData.fullName}
                      onChange={(e) => setFormData({...formData, fullName: e.target.value})}
                      placeholder="Full Name"
                      className="text-4xl md:text-5xl font-bold bg-transparent border-b border-white/10 text-white focus:outline-none focus:border-purple-500 w-full tracking-tight"
                    />
                  )}
                  <p className="text-gray-500 font-medium text-lg">@{profile?.username || "username"}</p>
                </div>
              </div>

              {!isEditing && (
                <button 
                  onClick={() => setIsEditing(true)}
                  className="hidden md:flex p-4 rounded-2xl bg-white/5 border border-white/10 hover:bg-white/10 transition-all text-purple-400 mb-2 group/edit"
                >
                  <Pencil size={20} className="group-hover:rotate-12 transition-transform" />
                </button>
              )}
            </div>

            {/* Profile Statistics bar */}
            <div className="px-8 md:px-12 flex items-center justify-center md:justify-start gap-10 border-b border-white/5 pb-10 mt-4 md:mt-2">
               <div className="flex flex-col items-center md:items-start group/stat">
                  <span className="text-2xl font-bold text-white tracking-tighter group-hover:text-purple-400 transition-colors">#{Math.max(1, 100 - Math.floor(xp / 50))}</span>
                  <span className="text-[10px] uppercase font-black tracking-widest text-gray-600">Global Rank</span>
               </div>
               <div className="flex flex-col items-center md:items-start group/stat">
                  <span className="text-2xl font-bold text-white tracking-tighter group-hover:text-purple-400 transition-colors">{xp.toLocaleString()}</span>
                  <span className="text-[10px] uppercase font-black tracking-widest text-gray-600">Experience</span>
               </div>
               <div className="flex flex-col items-center md:items-start group/stat">
                  <span className="text-2xl font-bold text-white tracking-tighter group-hover:text-purple-400 transition-colors">{profile?.major?.substring(0, 1) || "G"}</span>
                  <span className="text-[10px] uppercase font-black tracking-widest text-gray-600">Major Class</span>
               </div>
            </div>

            {/* Main content grid */}
            <div className="p-8 md:p-12">
               {!isEditing ? (
                  <div className="space-y-10 max-w-2xl text-left">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
                      <div className="space-y-1.5">
                        <p className="text-[11px] uppercase font-black tracking-widest text-gray-500/60">Study Track</p>
                        <p className="text-white font-medium text-xl">{profile?.major || "Computer Science"}</p>
                      </div>
                      <div className="space-y-1.5">
                        <p className="text-[11px] uppercase font-black tracking-widest text-gray-500/60">Connection</p>
                        <p className="text-white font-medium text-xl truncate">{user?.email}</p>
                      </div>
                    </div>
                    
                    <div className="space-y-2">
                      <p className="text-[11px] uppercase font-black tracking-widest text-gray-500/60">About You</p>
                      <p className="text-gray-400 leading-relaxed font-medium text-lg max-w-xl">
                        {profile?.bio || "Every student has a story. Tell us more about yourself and your academic goals."}
                      </p>
                    </div>

                    <div className="md:hidden pt-4">
                      <button 
                        onClick={() => setIsEditing(true)}
                        className="w-full py-5 text-sm font-bold uppercase tracking-widest border border-white/10 hover:bg-white/[0.03] transition-all rounded-[1.5rem] flex items-center justify-center gap-2"
                      >
                        <Pencil size={14} />
                        Update Profile
                      </button>
                    </div>
                  </div>
               ) : (
                  <div className="space-y-10 max-w-3xl">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
                      <div className="space-y-2">
                        <label className="text-[11px] uppercase font-black tracking-widest text-gray-600">Username Hash</label>
                        <input
                          type="text"
                          value={formData.username}
                          onChange={(e) => setFormData({...formData, username: e.target.value})}
                          className="w-full bg-white/5 border border-white/10 rounded-[1.5rem] px-6 py-5 text-white focus:outline-none focus:border-purple-500 transition-all font-semibold"
                        />
                      </div>
                      <div className="space-y-2">
                        <label className="text-[11px] uppercase font-black tracking-widest text-gray-600">Academic Major</label>
                        <input
                          type="text"
                          value={formData.major}
                          onChange={(e) => setFormData({...formData, major: e.target.value})}
                          className="w-full bg-white/5 border border-white/10 rounded-[1.5rem] px-6 py-5 text-white focus:outline-none focus:border-purple-500 transition-all font-semibold"
                        />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <label className="text-[11px] uppercase font-black tracking-widest text-gray-600">Academic Journey</label>
                      <textarea
                        value={formData.bio}
                        onChange={(e) => setFormData({...formData, bio: e.target.value})}
                        rows={6}
                        className="w-full bg-white/5 border border-white/10 rounded-[1.5rem] px-6 py-5 text-white focus:outline-none focus:border-purple-500 transition-all font-semibold resize-none text-lg"
                        placeholder="Share your goals and background..."
                      />
                    </div>
                    
                    {updateError && (
                      <div className="text-red-400 text-xs font-bold uppercase tracking-widest flex items-center gap-3 bg-red-400/5 p-4 rounded-xl border border-red-400/10">
                         <div className="w-2 h-2 rounded-full bg-red-400 animate-pulse"></div>
                         {updateError}
                      </div>
                    )}

                    <div className="flex flex-col md:flex-row gap-5 pt-4">
                      <button 
                        onClick={handleSave}
                        disabled={profileLoading}
                        className="flex-1 py-5 bg-white text-black text-sm font-black uppercase tracking-widest hover:bg-white/90 transition-all rounded-[1.5rem] flex items-center justify-center gap-2 disabled:opacity-50"
                      >
                        {profileLoading ? (
                          <div className="w-5 h-5 border-2 border-black/30 border-t-black rounded-full animate-spin" />
                        ) : (
                          <Save size={18} />
                        )}
                        Confirm Changes
                      </button>
                      <button 
                        onClick={cancelEdit}
                        className="flex-1 py-5 text-sm font-black uppercase tracking-widest text-gray-600 hover:text-white transition-all bg-white/[0.03] rounded-[1.5rem] border border-white/10"
                      >
                        Discard
                      </button>
                    </div>
                  </div>
               )}
            </div>
          </div>
        </div>

        {updateSuccess && (
          <div className="flex items-center justify-center gap-3 text-green-400 animate-in fade-in slide-in-from-bottom-2">
            <CheckCircle size={20} />
            <span className="text-sm font-bold uppercase tracking-[0.2em]">Profile Updated</span>
          </div>
        )}

        <div className="text-center pt-8">
           <Link href="/progress" className="text-xs font-bold uppercase tracking-widest text-gray-500 hover:text-purple-400 transition-all hover:scale-105 inline-flex items-center gap-3 group">
             <div className="w-8 h-8 rounded-full bg-white/5 flex items-center justify-center group-hover:bg-purple-500/10 transition-colors">
                <Zap size={16} className="text-gray-500 group-hover:text-purple-400 transition-colors" />
             </div>
             Progress & Analytics
           </Link>
        </div>
      </div>
    </div>
  );
}
