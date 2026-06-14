'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/components/AuthProvider';

function PasswordStrength({ password }: { password: string }) {
  if (!password) return null;

  let score = 0;
  if (password.length >= 8) score += 1;
  if (/(?=.*[a-z])(?=.*[A-Z])/.test(password)) score += 1;
  else if (/[a-zA-Z]/.test(password)) score += 0.5;
  if (/[0-9]/.test(password)) score += 1;
  if (/[^A-Za-z0-9]/.test(password)) score += 1;

  const finalScore = Math.min(Math.floor(score), 4);
  const bars = [
    { fill: finalScore >= 1, color: 'bg-red-500' },
    { fill: finalScore >= 2, color: 'bg-yellow-500' },
    { fill: finalScore >= 3, color: 'bg-green-400' },
    { fill: finalScore >= 4, color: 'bg-emerald-400' },
  ];
  const labels = ['', 'Weak', 'Medium', 'Strong', 'Excellent'];
  const cls = ['', 'text-red-400', 'text-yellow-400', 'text-green-400', 'text-emerald-400'];

  return (
    <div className="flex items-center justify-between gap-3 mt-2">
      <div className="flex gap-1 flex-1 max-w-[100px]">
        {bars.map((b, i) => (
          <div
            key={i}
            className={`h-1.5 flex-1 rounded-full transition-all duration-300 ${b.fill ? b.color : 'bg-white/10'}`}
          />
        ))}
      </div>
      <span className={`${cls[finalScore]} text-[10px] font-bold uppercase tracking-wider`}>
        {labels[finalScore]}
      </span>
    </div>
  );
}

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
  });
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => { setMounted(true); }, []);

  useEffect(() => {
    if (!authLoading && user) router.replace('/dashboard');
  }, [user, authLoading, router]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) =>
    setFormData(prev => ({ ...prev, [e.target.name]: e.target.value }));

  const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setAvatarFile(file);
      setAvatarPreview(URL.createObjectURL(file));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
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
        avatarFile: avatarFile,
      });
      if (result.error) setError(result.error);
      else {
        setSuccess(true);
        setTimeout(() => router.push('/auth/login'), 3000);
      }
    } catch (err: any) {
      setError(err.message || 'An unexpected error occurred');
    } finally {
      setLoading(false);
    }
  };

  // Success state
  if (success) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4 bg-[#06060F] overflow-hidden">
        <div className="fixed inset-0 pointer-events-none z-0">
          <div className="absolute inset-0 grid-bg opacity-30" />
          <div className="orb orb-1" style={{ width: 400, height: 400, top: '-10%', left: '-5%', background: 'rgba(124,58,237,0.1)' }} />
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_rgba(124,58,237,0.05)_0%,_transparent_60%)]" />
        </div>
        <div className={`w-full max-w-md relative z-10 ${mounted ? 'fade-up visible' : 'fade-up'}`}>
          <div className="bg-[#06060F]/70 backdrop-blur-2xl border border-white/[0.06] rounded-[2.5rem] shadow-[0_8px_40px_rgba(0,0,0,0.5)] p-10 sm:p-12 text-center">
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-green-400 to-emerald-500 flex items-center justify-center mx-auto mb-6 shadow-[0_0_30px_rgba(16,185,129,0.3)]">
              <svg className="w-8 h-8 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <h2 className="text-2xl font-black text-white mb-2 tracking-tight">Account Created!</h2>
            <p className="text-gray-500 text-sm mb-8 leading-relaxed">
              Check your email to confirm your account.
              <br />
              Redirecting to login...
            </p>
            <Link
              href="/auth/login"
              className="inline-flex w-full py-3.5 text-base font-bold bg-gradient-to-r from-[#7C3AED] to-indigo-500 text-white rounded-xl shadow-[0_0_20px_rgba(124,58,237,0.25)] hover:shadow-[0_0_35px_rgba(124,58,237,0.45)] transition-all duration-300 hover:-translate-y-0.5 justify-center"
            >
              Go to Login
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-[#06060F] overflow-hidden">
      {/* Background */}
      <div className="fixed inset-0 pointer-events-none z-0">
        <div className="absolute inset-0 grid-bg opacity-30" />
        <div className="orb orb-1" style={{ width: 500, height: 500, top: '-12%', left: '-5%', background: 'rgba(124,58,237,0.1)' }} />
        <div className="orb orb-2" style={{ width: 380, height: 380, bottom: '-8%', right: '-5%', background: 'rgba(99,102,241,0.08)' }} />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_rgba(124,58,237,0.05)_0%,_transparent_60%)]" />
      </div>

      {/* Card */}
      <div className={`w-full max-w-3xl relative z-10 ${mounted ? 'fade-up visible' : 'fade-up'}`}>
        <div className="bg-[#06060F]/70 backdrop-blur-2xl border border-white/[0.06] rounded-[2.5rem] shadow-[0_8px_40px_rgba(0,0,0,0.5)] p-8 sm:p-10 lg:p-12">
          {/* Header */}
          <div className="flex items-center gap-4 mb-10">
            <Link href="/" className="shrink-0">
              <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-[#7C3AED] to-indigo-500 flex items-center justify-center text-white font-black shadow-[0_0_20px_rgba(124,58,237,0.3)]">
                EE
              </div>
            </Link>
            <div>
              <h1 className="text-2xl font-black text-white tracking-tight">Create Account</h1>
              <p className="text-gray-500 text-sm mt-0.5">Join ExitExam and prepare for success.</p>
            </div>
          </div>

          <form onSubmit={handleSubmit}>
            {error && (
              <div className="p-3.5 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-sm flex items-start gap-2.5 mb-6">
                <svg className="w-5 h-5 flex-shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <span>{error}</span>
              </div>
            )}

            {/* Avatar + Name row */}
            <div className="flex flex-col sm:flex-row items-start gap-6 mb-8 pb-8 border-b border-white/[0.04]">
              {/* Avatar */}
              <div className="relative group shrink-0">
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleAvatarChange}
                  className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10 rounded-full"
                />
                <div className={`w-20 h-20 rounded-full flex items-center justify-center overflow-hidden transition-all duration-300 border-2 ${avatarPreview ? 'border-[#7C3AED] border-solid' : 'border-dashed border-white/10 group-hover:border-[#7C3AED]/40'}`}>
                  {avatarPreview ? (
                    <img src={avatarPreview} alt="Avatar" className="w-full h-full object-cover" />
                  ) : (
                    <svg className="w-8 h-8 text-gray-600 group-hover:text-[#A78BFA] transition-colors" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                    </svg>
                  )}
                </div>
              </div>

              <div className="flex-1 w-full">
                <label className="block text-sm font-medium text-gray-400 mb-1.5">Full Name <span className="text-[#7C3AED]">*</span></label>
                <input
                  type="text"
                  name="fullName"
                  required
                  value={formData.fullName}
                  onChange={handleChange}
                  placeholder="John Doe"
                  className="w-full bg-white/[0.03] border border-white/10 rounded-xl px-4 py-3.5 text-white placeholder-gray-700 focus:border-[#7C3AED] focus:outline-none focus:ring-2 focus:ring-[#7C3AED]/20 transition-all duration-300 hover:bg-white/[0.05]"
                />
              </div>
            </div>

            {/* Field grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-5">
              {/* Username */}
              <div>
                <label className="block text-sm font-medium text-gray-400 mb-1.5">Username <span className="text-[#7C3AED]">*</span></label>
                <input
                  type="text"
                  name="username"
                  required
                  value={formData.username}
                  onChange={handleChange}
                  placeholder="johndoe123"
                  className="w-full bg-white/[0.03] border border-white/10 rounded-xl px-4 py-3.5 text-white placeholder-gray-700 focus:border-[#7C3AED] focus:outline-none focus:ring-2 focus:ring-[#7C3AED]/20 transition-all duration-300 hover:bg-white/[0.05]"
                />
              </div>

              {/* Email */}
              <div>
                <label className="block text-sm font-medium text-gray-400 mb-1.5">Email <span className="text-[#7C3AED]">*</span></label>
                <input
                  type="email"
                  name="email"
                  required
                  value={formData.email}
                  onChange={handleChange}
                  placeholder="john@example.com"
                  className="w-full bg-white/[0.03] border border-white/10 rounded-xl px-4 py-3.5 text-white placeholder-gray-700 focus:border-[#7C3AED] focus:outline-none focus:ring-2 focus:ring-[#7C3AED]/20 transition-all duration-300 hover:bg-white/[0.05]"
                />
              </div>

              {/* Major */}
              <div>
                <label className="block text-sm font-medium text-gray-400 mb-1.5">Major <span className="text-[#7C3AED]">*</span></label>
                <input
                  type="text"
                  name="major"
                  required
                  value={formData.major}
                  onChange={handleChange}
                  placeholder="Computer Science"
                  className="w-full bg-white/[0.03] border border-white/10 rounded-xl px-4 py-3.5 text-white placeholder-gray-700 focus:border-[#7C3AED] focus:outline-none focus:ring-2 focus:ring-[#7C3AED]/20 transition-all duration-300 hover:bg-white/[0.05]"
                />
              </div>

              {/* Gender */}
              <div>
                <label className="block text-sm font-medium text-gray-400 mb-1.5">Gender <span className="text-[#7C3AED]">*</span></label>
                <div className="relative">
                  <select
                    name="gender"
                    required
                    value={formData.gender}
                    onChange={handleChange}
                    className="w-full bg-white/[0.03] border border-white/10 rounded-xl px-4 py-3.5 text-white appearance-none focus:border-[#7C3AED] focus:outline-none focus:ring-2 focus:ring-[#7C3AED]/20 transition-all duration-300 hover:bg-white/[0.05] [&>option]:bg-[#06060F]"
                  >
                    <option value="male">Male</option>
                    <option value="female">Female</option>
                  </select>
                  <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-gray-600">
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                    </svg>
                  </div>
                </div>
              </div>

              {/* Password */}
              <div>
                <label className="block text-sm font-medium text-gray-400 mb-1.5">Password <span className="text-[#7C3AED]">*</span></label>
                <input
                  type="password"
                  name="password"
                  required
                  minLength={6}
                  value={formData.password}
                  onChange={handleChange}
                  placeholder="••••••••"
                  className="w-full bg-white/[0.03] border border-white/10 rounded-xl px-4 py-3.5 text-white placeholder-gray-700 focus:border-[#7C3AED] focus:outline-none focus:ring-2 focus:ring-[#7C3AED]/20 transition-all duration-300 hover:bg-white/[0.05]"
                />
                <PasswordStrength password={formData.password} />
              </div>

              {/* Repeat Password */}
              <div>
                <label className="block text-sm font-medium text-gray-400 mb-1.5">Confirm Password <span className="text-[#7C3AED]">*</span></label>
                <input
                  type="password"
                  name="repeatPassword"
                  required
                  minLength={6}
                  value={formData.repeatPassword}
                  onChange={handleChange}
                  placeholder="••••••••"
                  className="w-full bg-white/[0.03] border border-white/10 rounded-xl px-4 py-3.5 text-white placeholder-gray-700 focus:border-[#7C3AED] focus:outline-none focus:ring-2 focus:ring-[#7C3AED]/20 transition-all duration-300 hover:bg-white/[0.05]"
                />
              </div>
            </div>

            {/* Submit */}
            <div className="mt-8 pt-6 border-t border-white/[0.04]">
              <button
                type="submit"
                disabled={loading}
                className="w-full py-3.5 text-base font-bold bg-gradient-to-r from-[#7C3AED] to-indigo-500 text-white rounded-xl shadow-[0_0_20px_rgba(124,58,237,0.25)] hover:shadow-[0_0_35px_rgba(124,58,237,0.45)] transition-all duration-300 hover:-translate-y-0.5 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none flex items-center justify-center gap-2 group"
              >
                {loading ? (
                  <>
                    <svg className="w-5 h-5 animate-spin" fill="none" viewBox="0 0 24 24">
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
          </form>

          <p className="text-center text-sm text-gray-600 mt-6">
            Already have an account?{' '}
            <Link href="/auth/login" className="text-[#A78BFA] hover:text-[#7C3AED] font-bold transition-colors">
              Log in here
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
