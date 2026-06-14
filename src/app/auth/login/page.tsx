'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/components/AuthProvider';

const stats = [
  { value: '40+', label: 'Departments' },
  { value: '500+', label: 'Questions' },
  { value: '87%', label: 'Pass Rate' },
];

export default function LoginPage() {
  const router = useRouter();
  const { signIn, loginAsGuest, user, isGuest, loading: authLoading } = useAuth();

  const [formData, setFormData] = useState({
    username: '',
    password: ''
  });
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => { setMounted(true); }, []);

  useEffect(() => {
    if (!authLoading && user) router.replace('/dashboard');
  }, [user, authLoading, router]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) =>
    setFormData(prev => ({ ...prev, [e.target.name]: e.target.value }));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const result = await signIn(formData.username, formData.password);
      if (result.error) setError(result.error);
      else router.push('/dashboard');
    } catch (err: any) {
      setError(err.message || 'An unexpected error occurred');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-[#06060F] overflow-hidden">
      {/* Background */}
      <div className="fixed inset-0 pointer-events-none z-0">
        <div className="absolute inset-0 grid-bg opacity-30" />
        <div className="orb orb-1" style={{ width: 520, height: 520, top: '-15%', left: '-5%', background: 'rgba(124,58,237,0.12)' }} />
        <div className="orb orb-2" style={{ width: 400, height: 400, bottom: '-10%', right: '-5%', background: 'rgba(99,102,241,0.09)' }} />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_rgba(124,58,237,0.05)_0%,_transparent_60%)]" />
      </div>

      {/* Main card */}
      <div className={`relative z-10 w-full max-w-5xl ${mounted ? 'fade-up visible' : 'fade-up'}`}>
        <div className="bg-[#06060F]/70 backdrop-blur-2xl border border-white/[0.06] rounded-[2.5rem] shadow-[0_8px_40px_rgba(0,0,0,0.5)] overflow-hidden">
          <div className="flex flex-col lg:flex-row min-h-[600px]">
            {/* Left: Brand section */}
            <div className="relative flex flex-col justify-between lg:w-[42%] p-10 lg:p-12 xl:p-14 bg-gradient-to-br from-[#7C3AED]/5 via-transparent to-transparent">
              {/* Brand */}
              <div>
                <Link href="/" className="inline-flex items-center gap-2.5 group mb-10">
                  <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#7C3AED] to-indigo-500 flex items-center justify-center text-white font-black shadow-[0_0_20px_rgba(124,58,237,0.3)] group-hover:shadow-[0_0_30px_rgba(124,58,237,0.5)] transition-shadow duration-300">
                    EE
                  </div>
                  <span className="font-black text-xl tracking-tight text-white">
                    Exit<span className="text-[#7C3AED]">Exam</span>
                  </span>
                </Link>

                <div className="space-y-4">
                  <h1 className="text-4xl sm:text-5xl font-black tracking-tighter leading-[1.05]">
                    Welcome
                    <br />
                    <span className="bg-gradient-to-r from-[#7C3AED] via-[#A78BFA] to-indigo-400 bg-clip-text text-transparent">Back</span>
                  </h1>
                  <p className="text-gray-500 text-sm leading-relaxed max-w-xs">
                    Continue your exit exam preparation journey. Track your progress, practice with real questions, and ace your exams.
                  </p>
                </div>
              </div>

              {/* Stats row */}
              <div className="flex gap-8 mt-12 lg:mt-0">
                {stats.map(s => (
                  <div key={s.label}>
                    <div className="text-xl font-black text-white">{s.value}</div>
                    <div className="text-[10px] text-gray-600 uppercase font-bold tracking-widest mt-0.5">{s.label}</div>
                  </div>
                ))}
              </div>

              {/* Decorative gradient line */}
              <div className="absolute right-0 top-[12%] bottom-[12%] w-px bg-gradient-to-b from-transparent via-[#7C3AED]/20 to-transparent hidden lg:block" />
            </div>

            {/* Right: Form section */}
            <div className="flex-1 flex items-center justify-center p-8 sm:p-10 lg:p-12 xl:p-14">
              <div className="w-full max-w-sm">
                <div className="mb-8">
                  <h2 className="text-xl font-bold text-white tracking-tight">Sign in</h2>
                  <p className="text-gray-500 text-sm mt-1">to access your account</p>
                </div>

                <form onSubmit={handleSubmit} className="space-y-5">
                  {error && (
                    <div className="p-3.5 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-sm flex items-start gap-2.5">
                      <svg className="w-5 h-5 flex-shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      <span>{error}</span>
                    </div>
                  )}

                  <div>
                    <label className="block text-sm font-medium text-gray-400 mb-1.5">Username or Email</label>
                    <div className="relative">
                      <div className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-600">
                        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M21.75 6.75v10.5a2.25 2.25 0 01-2.25 2.25h-15a2.25 2.25 0 01-2.25-2.25V6.75m19.5 0A2.25 2.25 0 0019.5 4.5h-15a2.25 2.25 0 00-2.25 2.25m19.5 0v.243a2.25 2.25 0 01-1.07 1.916l-7.5 4.615a2.25 2.25 0 01-2.36 0L3.32 8.91a2.25 2.25 0 01-1.07-1.916V6.75" />
                        </svg>
                      </div>
                      <input
                        type="text"
                        name="username"
                        required
                        value={formData.username}
                        onChange={handleChange}
                        placeholder="johndoe123"
                        className="w-full bg-white/[0.03] border border-white/10 rounded-xl pl-11 pr-4 py-3.5 text-white placeholder-gray-700 focus:border-[#7C3AED] focus:outline-none focus:ring-2 focus:ring-[#7C3AED]/20 transition-all duration-300 hover:bg-white/[0.05]"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-400 mb-1.5">Password</label>
                    <div className="relative">
                      <div className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-600">
                        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 10.5V6.75a4.5 4.5 0 10-9 0v3.75m-.75 11.25h10.5a2.25 2.25 0 002.25-2.25v-6.75a2.25 2.25 0 00-2.25-2.25H6.75a2.25 2.25 0 00-2.25 2.25v6.75a2.25 2.25 0 002.25 2.25z" />
                        </svg>
                      </div>
                      <input
                        type="password"
                        name="password"
                        required
                        value={formData.password}
                        onChange={handleChange}
                        placeholder="••••••••"
                        className="w-full bg-white/[0.03] border border-white/10 rounded-xl pl-11 pr-4 py-3.5 text-white placeholder-gray-700 focus:border-[#7C3AED] focus:outline-none focus:ring-2 focus:ring-[#7C3AED]/20 transition-all duration-300 hover:bg-white/[0.05]"
                      />
                    </div>
                  </div>

                  <div className="flex items-center justify-end">
                    <Link href="#" className="text-xs text-gray-600 hover:text-[#A78BFA] transition-colors font-medium">
                      Forgot password?
                    </Link>
                  </div>

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
                        Signing In...
                      </>
                    ) : (
                      <>
                        Sign In
                        <svg className="w-5 h-5 opacity-70 group-hover:translate-x-1 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M13 7l5 5m0 0l-5 5m5-5H6" />
                        </svg>
                      </>
                    )}
                  </button>

                  {/* Divider */}
                  <div className="relative flex items-center gap-4 py-1">
                    <div className="flex-1 h-px bg-white/[0.06]" />
                    <span className="text-xs text-gray-600 font-medium uppercase tracking-wider">or</span>
                    <div className="flex-1 h-px bg-white/[0.06]" />
                  </div>

                  {/* Guest */}
                  <button
                    type="button"
                    onClick={() => { loginAsGuest(); router.push('/dashboard'); }}
                    className="w-full py-3.5 text-sm font-semibold bg-white/[0.03] hover:bg-white/[0.06] border border-white/10 rounded-xl transition-all duration-300 flex items-center justify-center gap-2.5 text-gray-400 hover:text-white hover:-translate-y-0.5"
                  >
                    <svg className="w-5 h-5 text-gray-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z" />
                    </svg>
                    Continue as Guest
                  </button>
                </form>

                <p className="text-center text-sm text-gray-600 mt-8">
                  Don&apos;t have an account?{' '}
                  <Link href="/auth/register" className="text-[#A78BFA] hover:text-[#7C3AED] font-bold transition-colors">
                    Create one
                  </Link>
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
