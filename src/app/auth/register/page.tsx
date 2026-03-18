'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/components/AuthProvider';
import { useEffect } from 'react';

export default function RegisterPage() {
  const router = useRouter();
  const { signUp, user, isGuest, loading: authLoading } = useAuth();
  
  const [formData, setFormData] = useState({
    fullName: '',
    username: '',
    major: '',
    email: '',
    password: '',
    repeatPassword: '',
    gender: 'male',
    bio: ''
  });
  
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  // Redirect if already logged in
  useEffect(() => {
    if (!authLoading && user) {
      router.replace('/dashboard');
    }
  }, [user, authLoading, router]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    // Basic Validation
    if (formData.password !== formData.repeatPassword) {
      setError('Passwords do not match');
      return;
    }
    
    if (formData.password.length < 6) {
      setError('Password must be at least 6 characters');
      return;
    }

    setLoading(true);

    try {
      const result = await signUp(formData.email, formData.password, {
        fullName: formData.fullName,
        username: formData.username,
        major: formData.major,
        gender: formData.gender,
        bio: formData.bio,
        avatarFile: avatarFile
      });

      if (result.error) {
        setError(result.error);
      } else {
        setSuccess(true);
        // Optionally redirect after a few seconds
        setTimeout(() => router.push('/auth/login'), 3000);
      }
    } catch (err: any) {
      setError(err.message || 'An unexpected error occurred');
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <div className="min-h-screen flex items-center justify-center py-12 px-4 bg-[#0B0F1A] bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-[#131A2B] via-[#0B0F1A] to-[#050812]">
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-violet-600/10 rounded-full blur-[120px] mix-blend-screen"></div>
          <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-purple-600/10 rounded-full blur-[120px] mix-blend-screen"></div>
        </div>
        <div className="max-w-md w-full bg-white/[0.03] backdrop-blur-2xl border border-white/10 rounded-[2rem] shadow-[0_8px_32px_0_rgba(0,0,0,0.3)] p-8 sm:p-10 text-center relative z-10 animate-in fade-in duration-500 slide-in-from-bottom-4">
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-green-400 to-emerald-500 flex items-center justify-center mx-auto mb-6 shadow-[0_0_30px_rgba(16,185,129,0.4)] transform transition-transform hover:scale-105 duration-300">
            <svg className="w-8 h-8 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <h2 className="text-3xl font-bold text-white mb-2 tracking-tight">Registration Successful!</h2>
          <p className="text-purple-200/60 font-medium mb-8">
            Check your email to confirm your account. You will be redirected to the login page shortly.
          </p>
          <Link href="/auth/login" className="w-full py-4 text-lg font-semibold bg-gradient-to-r from-violet-600 to-purple-500 hover:from-violet-500 hover:to-purple-400 text-white rounded-2xl shadow-[0_0_20px_rgba(124,58,237,0.3)] hover:shadow-[0_0_30px_rgba(124,58,237,0.5)] transition-all duration-300 hover:-translate-y-0.5 inline-block">
            Go to Login
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center py-12 px-4 bg-[#0B0F1A] bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-[#131A2B] via-[#0B0F1A] to-[#050812]">
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-[10%] right-[10%] w-96 h-96 bg-violet-600/10 rounded-full blur-[120px] mix-blend-screen"></div>
        <div className="absolute bottom-[10%] left-[10%] w-96 h-96 bg-purple-600/10 rounded-full blur-[120px] mix-blend-screen"></div>
      </div>

      <div className="w-full max-w-2xl bg-white/[0.03] backdrop-blur-2xl border border-white/10 rounded-[2rem] shadow-[0_8px_32px_0_rgba(0,0,0,0.3)] p-8 sm:p-10 relative z-10 animate-in fade-in duration-500 slide-in-from-bottom-4">
        <div className="text-center mb-10">
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-violet-600 to-purple-500 flex items-center justify-center shadow-[0_0_30px_rgba(124,58,237,0.4)] mx-auto mb-6 transform transition-transform hover:scale-105 duration-300">
            <svg className="w-8 h-8 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" />
            </svg>
          </div>
          <h2 className="text-3xl font-bold text-white tracking-tight mb-2">Create Account</h2>
          <p className="text-purple-200/60 font-medium">Join Exit Exam Platform and master your exams.</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {error && (
            <div className="p-4 rounded-2xl bg-red-500/10 border border-red-500/20 text-red-400 text-sm flex items-start gap-3 backdrop-blur-sm animate-in fade-in slide-in-from-top-2">
              <svg className="w-5 h-5 flex-shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <span>{error}</span>
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Full Name */}
            <div className="group">
              <label className="block text-sm font-medium text-purple-200/80 mb-2 transition-colors group-focus-within:text-purple-400">Full Name <span className="text-violet-400">*</span></label>
              <input
                type="text"
                name="fullName"
                required
                value={formData.fullName}
                onChange={handleChange}
                placeholder="John Doe"
                className="w-full bg-white/[0.04] border border-white/10 rounded-2xl px-5 py-4 text-white placeholder-white/30 focus:border-purple-500 focus:outline-none focus:ring-2 focus:ring-purple-500/20 transition-all duration-300 hover:bg-white/[0.06]"
              />
            </div>

            {/* Username */}
            <div className="group">
              <label className="block text-sm font-medium text-purple-200/80 mb-2 transition-colors group-focus-within:text-purple-400">Username <span className="text-violet-400">*</span></label>
              <input
                type="text"
                name="username"
                required
                value={formData.username}
                onChange={handleChange}
                placeholder="johndoe123"
                className="w-full bg-white/[0.04] border border-white/10 rounded-2xl px-5 py-4 text-white placeholder-white/30 focus:border-purple-500 focus:outline-none focus:ring-2 focus:ring-purple-500/20 transition-all duration-300 hover:bg-white/[0.06]"
              />
            </div>

            {/* Email */}
            <div className="group md:col-span-2">
              <label className="block text-sm font-medium text-purple-200/80 mb-2 transition-colors group-focus-within:text-purple-400">Email Address <span className="text-violet-400">*</span></label>
              <input
                type="email"
                name="email"
                required
                value={formData.email}
                onChange={handleChange}
                placeholder="john@example.com"
                className="w-full bg-white/[0.04] border border-white/10 rounded-2xl px-5 py-4 text-white placeholder-white/30 focus:border-purple-500 focus:outline-none focus:ring-2 focus:ring-purple-500/20 transition-all duration-300 hover:bg-white/[0.06]"
              />
            </div>

            {/* Password */}
            <div className="group">
              <label className="block text-sm font-medium text-purple-200/80 mb-2 transition-colors group-focus-within:text-purple-400">Password <span className="text-violet-400">*</span></label>
              <input
                type="password"
                name="password"
                required
                minLength={6}
                value={formData.password}
                onChange={handleChange}
                placeholder="••••••••"
                className="w-full bg-white/[0.04] border border-white/10 rounded-2xl px-5 py-4 text-white placeholder-white/30 focus:border-purple-500 focus:outline-none focus:ring-2 focus:ring-purple-500/20 transition-all duration-300 hover:bg-white/[0.06]"
              />
            </div>

            {/* Repeat Password */}
            <div className="group">
              <label className="block text-sm font-medium text-purple-200/80 mb-2 transition-colors group-focus-within:text-purple-400">Repeat Password <span className="text-violet-400">*</span></label>
              <input
                type="password"
                name="repeatPassword"
                required
                minLength={6}
                value={formData.repeatPassword}
                onChange={handleChange}
                placeholder="••••••••"
                className="w-full bg-white/[0.04] border border-white/10 rounded-2xl px-5 py-4 text-white placeholder-white/30 focus:border-purple-500 focus:outline-none focus:ring-2 focus:ring-purple-500/20 transition-all duration-300 hover:bg-white/[0.06]"
              />
            </div>

            {/* Major */}
            <div className="group">
              <label className="block text-sm font-medium text-purple-200/80 mb-2 transition-colors group-focus-within:text-purple-400">Major <span className="text-violet-400">*</span></label>
              <input
                type="text"
                name="major"
                required
                value={formData.major}
                onChange={handleChange}
                placeholder="Computer Science"
                className="w-full bg-white/[0.04] border border-white/10 rounded-2xl px-5 py-4 text-white placeholder-white/30 focus:border-purple-500 focus:outline-none focus:ring-2 focus:ring-purple-500/20 transition-all duration-300 hover:bg-white/[0.06]"
              />
            </div>

            {/* Gender */}
            <div className="group">
              <label className="block text-sm font-medium text-purple-200/80 mb-2 transition-colors group-focus-within:text-purple-400">Gender <span className="text-violet-400">*</span></label>
              <div className="relative">
                <select
                  name="gender"
                  required
                  value={formData.gender}
                  onChange={handleChange}
                  className="w-full bg-white/[0.04] border border-white/10 rounded-2xl px-5 py-4 text-white hover:bg-white/[0.06] focus:border-purple-500 focus:outline-none focus:ring-2 focus:ring-purple-500/20 transition-all duration-300 appearance-none [&>option]:bg-[#0B0F1A] [&>option]:text-white"
                >
                  <option value="male">Male</option>
                  <option value="female">Female</option>
                </select>
                <div className="absolute right-5 top-1/2 -translate-y-1/2 pointer-events-none text-purple-200/50">
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </div>
              </div>
            </div>

            {/* Profile Picture */}
            <div className="group md:col-span-2">
              <label className="block text-sm font-medium text-purple-200/80 mb-2 transition-colors group-focus-within:text-purple-400 flex items-center gap-2">
                Profile Picture <span className="text-purple-200/40 text-xs font-normal bg-white/5 py-1 px-2 rounded-md">Optional</span>
              </label>
              <div className="flex items-center gap-4 p-4 rounded-2xl bg-white/[0.02] border border-white/5 hover:bg-white/[0.04] transition-all duration-300">
                <div className="h-16 w-16 rounded-full bg-gradient-to-br from-violet-600/30 to-purple-500/30 flex items-center justify-center border border-white/10 shrink-0 overflow-hidden shadow-inner">
                  {avatarFile ? (
                    <img src={URL.createObjectURL(avatarFile)} alt="Avatar" className="w-full h-full object-cover" />
                  ) : (
                    <svg className="w-8 h-8 text-purple-200/50" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                    </svg>
                  )}
                </div>
                <input
                  type="file"
                  accept="image/*"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) {
                      setAvatarFile(file);
                    } else {
                      setAvatarFile(null);
                    }
                  }}
                  className="w-full text-sm text-purple-200/60
                    file:mr-4 file:py-2.5 file:px-6
                    file:rounded-xl file:border-0
                    file:text-sm file:font-semibold
                    file:bg-white/10 file:text-white
                    hover:file:bg-white/20 hover:file:shadow-md
                    file:transition-all file:cursor-pointer
                    focus:outline-none cursor-pointer"
                />
              </div>
            </div>
          </div>

          {/* Bio */}
          <div className="group">
            <label className="block text-sm font-medium text-purple-200/80 mb-2 transition-colors group-focus-within:text-purple-400 flex items-center gap-2">
              Bio <span className="text-purple-200/40 text-xs font-normal bg-white/5 py-1 px-2 rounded-md">Optional</span>
            </label>
            <textarea
              name="bio"
              rows={3}
              value={formData.bio}
              onChange={handleChange}
              placeholder="Tell us a bit about your journey..."
              className="w-full bg-white/[0.04] border border-white/10 rounded-2xl px-5 py-4 text-white placeholder-white/30 focus:border-purple-500 focus:outline-none focus:ring-2 focus:ring-purple-500/20 transition-all duration-300 hover:bg-white/[0.06] resize-none"
            />
          </div>

          <div className="pt-6">
            <button
              type="submit"
              disabled={loading}
              className="w-full py-4 text-lg font-semibold bg-gradient-to-r from-violet-600 to-purple-500 hover:from-violet-500 hover:to-purple-400 text-white rounded-2xl shadow-[0_0_20px_rgba(124,58,237,0.3)] hover:shadow-[0_0_30px_rgba(124,58,237,0.5)] transition-all duration-300 hover:-translate-y-0.5 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none flex items-center justify-center gap-2 group"
            >
              {loading ? (
                <>
                  <svg className="w-5 h-5 animate-spin text-white" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                  </svg>
                  Creating Account...
                </>
              ) : (
                <>
                  Create Account
                  <svg className="w-5 h-5 opacity-70 group-hover:translate-x-1 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M13 7l5 5m0 0l-5 5m5-5H6" />
                  </svg>
                </>
              )}
            </button>
          </div>

          <div className="text-center pt-2">
            <p className="text-purple-200/60 font-medium">
              Already have an account?{' '}
              <Link href="/auth/login" className="text-transparent bg-clip-text bg-gradient-to-r from-violet-400 to-purple-400 hover:from-violet-300 hover:to-purple-300 transition-all font-bold drop-shadow-[0_0_8px_rgba(168,85,247,0.5)] ml-1">
                Log in here
              </Link>
            </p>
          </div>
        </form>
      </div>
    </div>
  );
}
