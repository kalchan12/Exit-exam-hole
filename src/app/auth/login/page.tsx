'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/components/AuthProvider';
import { useTheme } from '@/components/ThemeProvider';
import { Sun, Moon } from 'lucide-react';

export default function LoginPage() {
  const router = useRouter();
  const { signIn, loginAsGuest, user, loading: authLoading } = useAuth();
  const { theme, toggleTheme } = useTheme();

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
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'An unexpected error occurred');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-background">
      <div className={`w-full max-w-[420px] ${mounted ? 'animate-fade-in' : 'opacity-0'}`}>
        <div className="bg-surface-container-lowest border-l-[3px] border-l-primary shadow-ambient-md rounded-r-xl p-8 sm:p-10">
          <div className="flex items-start justify-between mb-8">
            <div className="flex flex-col gap-2">
              <div className="flex items-center gap-2 mb-4">
                <div className="w-9 h-9 rounded-lg bg-primary flex items-center justify-center text-on-primary font-bold text-sm shadow-sm">
                  E
                </div>
                <span className="font-bold text-xl text-primary">ExitPrep</span>
              </div>
              <h1 className="text-headline-xl text-on-surface font-bold">Welcome back</h1>
              <p className="text-body-base text-on-surface-variant">Sign in to continue your preparation</p>
            </div>
            <button
              type="button"
              onClick={toggleTheme}
              className="w-11 h-11 rounded-xl flex items-center justify-center text-primary hover:bg-primary-container/30 transition-colors shrink-0"
              aria-label="Toggle theme"
            >
              {theme === 'dark' ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
            </button>
          </div>

          <form onSubmit={handleSubmit} className="flex flex-col gap-5">
            {error && (
              <div className="p-3.5 rounded-lg bg-error-container border border-error/30 text-on-error-container text-sm flex items-start gap-2.5">
                <svg className="w-5 h-5 flex-shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <span>{error}</span>
              </div>
            )}

            <div>
              <label className="label-text text-left" htmlFor="username">Email Address</label>
              <div className="relative">
                <input
                  id="username"
                  type="text"
                  name="username"
                  required
                  value={formData.username}
                  onChange={handleChange}
                  placeholder="Enter your email"
                  className="input-field text-left"
                />
              </div>
            </div>

            <div>
              <label className="label-text text-left" htmlFor="password">Password</label>
              <div className="relative">
                <input
                  id="password"
                  type="password"
                  name="password"
                  required
                  value={formData.password}
                  onChange={handleChange}
                  placeholder="Enter your password"
                  className="input-field text-left"
                />
              </div>
            </div>

            <div className="flex flex-col gap-3 mt-2">
              <button
                type="submit"
                disabled={loading}
                className="w-full h-[44px] bg-primary text-on-primary font-medium rounded-lg hover:brightness-110 active:scale-[0.98] transition-all shadow-sm disabled:opacity-50 flex items-center justify-center gap-2"
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
                  'Sign In'
                )}
              </button>

              <div className="flex items-center gap-3">
                <div className="h-px bg-outline-variant flex-1" />
                <span className="text-label-xs text-label-xs text-outline">or</span>
                <div className="h-px bg-outline-variant flex-1" />
              </div>

              <button
                type="button"
                onClick={() => { loginAsGuest(); router.push('/dashboard'); }}
                className="w-full h-[44px] bg-transparent border border-primary text-primary font-medium rounded-lg hover:bg-primary-fixed active:scale-[0.98] transition-all flex items-center justify-center gap-2"
              >
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z" />
                </svg>
                Continue as Guest
              </button>
            </div>
          </form>

          <p className="text-center text-body-base text-on-surface-variant mt-8">
            Don&apos;t have an account?{' '}
            <Link href="/auth/register" className="text-primary font-bold hover:underline inline-flex items-center gap-1">
              Register
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M13 7l5 5m0 0l-5 5m5-5H6" />
              </svg>
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
