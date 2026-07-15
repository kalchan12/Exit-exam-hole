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
    <div className="min-h-[calc(100vh-6rem)] flex flex-col items-center justify-center py-8">
      {/* Navigation */}
      <div className="w-full max-w-4xl mb-6">
        <Link href="/dashboard" className="inline-flex items-center text-on-surface-variant hover:text-on-surface transition-colors group">
          <ArrowLeft className="w-4 h-4 mr-2 group-hover:-translate-x-1 transition-transform" />
          <span className="text-label-sm font-medium">Return to Dashboard</span>
        </Link>
      </div>

      {/* Single Card Container */}
      <div className="w-full max-w-4xl card border-primary/20 overflow-hidden transition-all duration-500">
        {/* Top glow accent */}
        <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-transparent via-primary/50 to-transparent"></div>

        {/* Inner content */}
        <div className="relative z-10">
          {!isEditing ? (
            /* VIEW MODE */
            <div key="view" className="animate-in fade-in duration-300">
              <div className="flex flex-col md:flex-row min-h-[400px]">
                {/* Left Column: Avatar + Name + Actions */}
                <div className="flex flex-col items-center justify-center p-6 sm:p-10 md:p-12 md:border-r border-outline-variant md:w-[270px] shrink-0">
                  <div className="relative group/avatar mb-5">
                    <div className="absolute -inset-1 bg-gradient-to-br from-primary-container/30 to-secondary-fixed-dim/20 rounded-2xl blur-sm"></div>
                    <div className="relative w-20 h-20 sm:w-28 sm:h-28 rounded-2xl overflow-hidden bg-surface-container ring-2 ring-primary/30 flex items-center justify-center shadow-sm">
                      {avatarPreview ? (
                        <img src={avatarPreview} alt="Profile" className="w-full h-full object-cover" />
                      ) : (
                        <UserIcon className="w-10 h-10 text-on-surface-variant opacity-40" />
                      )}
                    </div>
                  </div>

                  <h1 className="text-headline-xl-mobile font-bold text-on-surface tracking-tight text-center leading-tight">
                    {profile?.full_name || "New Explorer"}
                  </h1>
                  <p className="text-label-sm text-on-surface-variant font-medium mt-1">@{profile?.username || "username"}</p>

                  <div className="flex items-center gap-3 mt-6 w-full">
                    <button 
                      onClick={() => setIsEditing(true)}
                      className="btn-primary flex-1 text-label-xs"
                    >
                      <Pencil className="w-3.5 h-3.5" />
                      Update
                    </button>
                    <button className="w-10 h-10 rounded-xl bg-surface-container border border-outline-variant hover:border-primary/30 transition-all flex items-center justify-center text-on-surface-variant hover:text-primary">
                      <Share2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                {/* Right Column: Stats & Info */}
                <div className="flex-1 p-6 sm:p-10 md:p-12 flex flex-col justify-center space-y-6 sm:space-y-8">
                  <div className="flex items-center gap-4 sm:gap-8">
                    <div className="flex flex-col items-center md:items-start">
                      <span className="text-label-xs text-on-surface-variant/60 font-bold tracking-wider mb-1.5">Rank</span>
                      <span className="text-headline-xl-mobile sm:text-headline-2xl font-bold text-on-surface tracking-tight">{rankDisplay}</span>
                    </div>
                    <div className="w-px h-12 bg-gradient-to-b from-transparent via-primary/20 to-transparent"></div>
                    <div className="flex flex-col items-center md:items-start">
                      <span className="text-label-xs text-on-surface-variant/60 font-bold tracking-wider mb-1.5">XP</span>
                      <span className="text-headline-xl-mobile sm:text-headline-2xl font-bold text-on-surface tracking-tight">{xp}</span>
                    </div>
                    <div className="w-px h-12 bg-gradient-to-b from-transparent via-primary/20 to-transparent"></div>
                    <div className="flex flex-col items-center md:items-start">
                      <span className="text-label-xs text-on-surface-variant/60 font-bold tracking-wider mb-1.5">Class</span>
                      <span className="text-headline-xl-mobile sm:text-headline-2xl font-bold text-primary tracking-tight">{classLetter}</span>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                    <div>
                      <span className="text-label-xs text-on-surface-variant/60 font-bold tracking-wider block mb-2">Study Track</span>
                      <div className="flex items-center gap-3 bg-surface-container border border-outline-variant rounded-xl px-4 py-3 transition-colors">
                        <div className="w-8 h-8 rounded-lg bg-primary-container flex items-center justify-center">
                          <BookOpen className="w-4 h-4 text-primary" />
                        </div>
                        <span className="text-label-sm text-on-surface font-semibold truncate">{profile?.major || "Computer Science"}</span>
                      </div>
                    </div>
                    <div>
                      <span className="text-label-xs text-on-surface-variant/60 font-bold tracking-wider block mb-2">Connection</span>
                      <div className="flex items-center gap-3 bg-surface-container border border-outline-variant rounded-xl px-4 py-3 transition-colors">
                        <div className="w-8 h-8 rounded-lg bg-primary-container flex items-center justify-center">
                          <Mail className="w-4 h-4 text-primary" />
                        </div>
                        <span className="text-label-sm text-on-surface font-semibold truncate">{user?.email}</span>
                      </div>
                    </div>
                  </div>

                  <div>
                    <span className="text-label-xs text-on-surface-variant/60 font-bold tracking-wider block mb-2">About You</span>
                    <div className="bg-surface-container border border-outline-variant rounded-xl px-4 py-3.5 transition-colors">
                      <p className="text-label-sm text-on-surface-variant font-medium leading-relaxed">
                        &ldquo;{profile?.bio || "Every student has a story. Tell us more about yourself."}&rdquo;
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            /* EDIT MODE */
            <div key="edit" className="animate-in fade-in duration-300">
              <div className="p-6 sm:p-10 md:p-12 space-y-5 sm:space-y-7 min-h-[400px] flex flex-col justify-center">
                {/* Avatar + Name Row */}
                <div className="flex flex-col md:flex-row items-center gap-6">
                  <div className="relative group/avatar">
                    <div className="absolute -inset-1 bg-gradient-to-br from-primary-container/30 to-secondary-fixed-dim/20 rounded-2xl blur-sm"></div>
                    <div className="relative w-20 h-20 sm:w-28 sm:h-28 rounded-2xl overflow-hidden bg-surface-container ring-2 ring-primary/30 flex items-center justify-center">
                      {avatarPreview ? (
                        <img src={avatarPreview} alt="Profile" className="w-full h-full object-cover" />
                      ) : (
                        <UserIcon className="w-10 h-10 text-on-surface-variant opacity-40" />
                      )}
                      <button 
                        onClick={() => fileInputRef.current?.click()}
                        className="absolute inset-0 bg-black/50 backdrop-blur-[2px] flex flex-col items-center justify-center opacity-0 group-hover/avatar:opacity-100 transition-opacity rounded-2xl"
                      >
                        <Camera className="w-5 h-5 text-white mb-1" />
                        <span className="text-label-xs text-white font-bold tracking-wider">Change</span>
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
                    <label className="text-label-xs text-on-surface-variant/60 font-bold tracking-wider mb-2 block">Full Name</label>
                    <input
                      type="text"
                      value={formData.fullName}
                      onChange={(e) => setFormData({...formData, fullName: e.target.value})}
                      placeholder="Full Name"
                      className="input-field text-body-base font-bold"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                  <div>
                    <label className="text-label-xs text-on-surface-variant/60 font-bold tracking-wider mb-2 block">Username</label>
                    <input
                      type="text"
                      value={formData.username}
                      onChange={(e) => setFormData({...formData, username: e.target.value})}
                      className="input-field"
                    />
                  </div>
                  <div>
                    <label className="text-label-xs text-on-surface-variant/60 font-bold tracking-wider mb-2 block">Academic Major</label>
                    <input
                      type="text"
                      value={formData.major}
                      onChange={(e) => setFormData({...formData, major: e.target.value})}
                      className="input-field"
                    />
                  </div>
                </div>

                <div>
                  <label className="text-label-xs text-on-surface-variant/60 font-bold tracking-wider mb-2 block">About You</label>
                  <textarea
                    value={formData.bio}
                    onChange={(e) => setFormData({...formData, bio: e.target.value})}
                    rows={3}
                    className="input-field resize-none"
                    placeholder="Share your goals and background..."
                  />
                </div>
                
                {updateError && (
                  <div className="text-label-xs text-error font-bold flex items-center gap-2 bg-error-container/10 p-3.5 rounded-xl border border-error/10">
                     <div className="w-2 h-2 rounded-full bg-error animate-pulse"></div>
                     {updateError}
                  </div>
                )}

                <div className="flex gap-3 pt-2">
                  <button 
                    onClick={handleSave}
                    disabled={profileLoading}
                    className="btn-primary flex-1 inline-flex items-center justify-center gap-2"
                  >
                    {profileLoading ? (
                      <div className="w-4 h-4 border-2 border-on-primary/30 border-t-on-primary rounded-full animate-spin" />
                    ) : (
                      <Save className="w-4 h-4" />
                    )}
                    Save Changes
                  </button>
                  <button 
                    onClick={cancelEdit}
                    className="btn-secondary flex-1"
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
        <div className="flex items-center justify-center gap-3 text-secondary animate-in fade-in slide-in-from-bottom-2 mt-5">
          <CheckCircle className="w-4 h-4" />
          <span className="text-label-sm font-bold tracking-wider">Profile Updated</span>
        </div>
      )}

      {/* Footer Link */}
      <div className="mt-6">
         <Link href="/progress" className="text-label-xs text-on-surface-variant hover:text-primary font-bold tracking-wider inline-flex items-center gap-2.5 group">
            <div className="w-7 h-7 rounded-full bg-surface-container flex items-center justify-center group-hover:bg-primary-container transition-colors">
              <Zap className="w-3.5 h-3.5 text-on-surface-variant group-hover:text-primary transition-colors" />
            </div>
            Progress & Analytics
         </Link>
      </div>
    </div>
  );
}
