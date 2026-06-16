'use client';

import { useState, useEffect, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/components/AuthProvider';
import { DEPARTMENT_SOURCES } from '@/lib/dataLoader';

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
    { fill: finalScore >= 1, color: 'bg-error' },
    { fill: finalScore >= 2, color: 'bg-tertiary' },
    { fill: finalScore >= 3, color: 'bg-secondary' },
    { fill: finalScore >= 4, color: 'bg-secondary' },
  ];
  const labels = ['', 'Weak', 'Medium', 'Strong', 'Excellent'];
  const cls = ['', 'text-error', 'text-tertiary', 'text-secondary', 'text-secondary'];

  return (
    <div className="flex items-center justify-between gap-3 mt-2">
      <div className="flex gap-1 flex-1 max-w-[100px]">
        {bars.map((b, i) => (
          <div
            key={i}
            className={`h-1.5 flex-1 rounded-full transition-all duration-300 ${b.fill ? b.color : 'bg-surface-container-high'}`}
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
  const [majorSearch, setMajorSearch] = useState('');
  const [majorOpen, setMajorOpen] = useState(false);
  const majorList = useMemo(() => Object.keys(DEPARTMENT_SOURCES).sort(), []);
  const filteredMajors = useMemo(
    () => majorList.filter(m => m.toLowerCase().includes(majorSearch.toLowerCase())),
    [majorList, majorSearch]
  );

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

  if (success) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4 bg-background">
        <div className={`w-full max-w-md ${mounted ? 'animate-fade-in' : 'opacity-0'}`}>
          <div className="bg-surface-container-lowest border-l-[3px] border-l-secondary shadow-ambient-md rounded-r-xl p-10 text-center">
            <div className="w-14 h-14 rounded-xl bg-secondary flex items-center justify-center mx-auto mb-6 shadow-sm">
              <svg className="w-7 h-7 text-on-secondary" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <h2 className="text-headline-2xl text-on-surface font-bold mb-2">Account Created!</h2>
            <p className="text-body-base text-on-surface-variant mb-8">
              Check your email to confirm your account. Redirecting to login...
            </p>
            <Link
              href="/auth/login"
              className="inline-flex w-full h-[44px] bg-primary text-on-primary font-medium rounded-lg hover:brightness-110 transition-all items-center justify-center"
            >
              Go to Login
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-background">
      <div className={`w-full max-w-2xl ${mounted ? 'animate-fade-in' : 'opacity-0'}`}>
        <div className="bg-surface-container-lowest border-l-[3px] border-l-primary shadow-ambient-md rounded-r-xl p-8 sm:p-10">
          <div className="flex items-center gap-3 mb-8">
            <Link href="/" className="shrink-0">
              <div className="w-9 h-9 rounded-lg bg-primary flex items-center justify-center text-on-primary font-bold text-sm shadow-sm">
                E
              </div>
            </Link>
            <div>
              <h1 className="text-headline-xl text-on-surface font-bold">Create your account</h1>
              <p className="text-body-base text-on-surface-variant">Join ExitPrep to start your university exit exam preparation.</p>
            </div>
          </div>

          <form onSubmit={handleSubmit}>
            {error && (
              <div className="p-3.5 rounded-lg bg-error-container border border-error/30 text-on-error-container text-sm flex items-start gap-2.5 mb-6">
                <svg className="w-5 h-5 flex-shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <span>{error}</span>
              </div>
            )}

            <div className="flex flex-col sm:flex-row items-start gap-6 mb-6 pb-6 border-b border-primary/10">
              <div className="relative group shrink-0">
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleAvatarChange}
                  className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10 rounded-full"
                />
                <div className={`w-20 h-20 rounded-full flex items-center justify-center overflow-hidden transition-all duration-300 border-2 ${avatarPreview ? 'border-primary' : 'border-primary/50'}`}>
                  {avatarPreview ? (
                    <img src={avatarPreview} alt="Avatar" className="w-full h-full object-cover" />
                  ) : (
                    <svg className="w-8 h-8 text-primary/60 group-hover:text-primary transition-colors" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                    </svg>
                  )}
                </div>
                <div className="absolute -bottom-0.5 -right-0.5 w-6 h-6 rounded-full bg-primary-container border-2 border-primary/40 flex items-center justify-center z-20">
                  <svg className="w-3 h-3 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
                    <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z" />
                    <circle cx="12" cy="13" r="4" />
                  </svg>
                </div>
              </div>

              <div className="flex-1 w-full">
                <label className="label-text" htmlFor="fullName">Full Name</label>
                <input
                  id="fullName"
                  type="text"
                  name="fullName"
                  required
                  value={formData.fullName}
                  onChange={handleChange}
                  placeholder="Enter Your Fullname"
                  className="input-field"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
              <div>
                <label className="label-text" htmlFor="reg-username">Username</label>
                <input
                  id="reg-username"
                  type="text"
                  name="username"
                  required
                  value={formData.username}
                  onChange={handleChange}
                  placeholder="Enter Your Username"
                  className="input-field"
                />
              </div>

              <div>
                <label className="label-text" htmlFor="email">Email</label>
                <input
                  id="email"
                  type="email"
                  name="email"
                  required
                  value={formData.email}
                  onChange={handleChange}
                  placeholder="Enter your email"
                  className="input-field"
                />
              </div>

              <div>
                <label className="label-text" htmlFor="majorSearch">Academic Major</label>
                <div className="relative">
                  <input
                    id="majorSearch"
                    type="text"
                    required
                    value={majorSearch}
                    onChange={e => { setMajorSearch(e.target.value); setMajorOpen(true); setFormData(prev => ({ ...prev, major: '' })); }}
                    onFocus={() => setMajorOpen(true)}
                    placeholder={formData.major || "Search your major..."}
                    className="input-field"
                  />
                  <svg className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-on-surface-variant pointer-events-none" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                  </svg>
                  {majorOpen && (
                    <>
                      <div className="fixed inset-0 z-10" onClick={() => setMajorOpen(false)} />
                      <div className="absolute z-20 mt-1 w-full max-h-48 overflow-y-auto bg-surface-container-lowest border border-outline-variant rounded-lg shadow-ambient-md">
                        {filteredMajors.length === 0 ? (
                          <div className="p-3 text-label-sm text-on-surface-variant text-center">No majors found</div>
                        ) : (
                          filteredMajors.map(m => (
                            <button
                              key={m}
                              type="button"
                              className={`w-full text-left px-4 py-2.5 text-label-sm hover:bg-surface-container-high transition-colors ${formData.major === m ? 'bg-primary-container/30 text-primary font-bold' : 'text-on-surface'}`}
                              onClick={() => {
                                setFormData(prev => ({ ...prev, major: m }));
                                setMajorSearch(m);
                                setMajorOpen(false);
                              }}
                            >
                              {m}
                            </button>
                          ))
                        )}
                      </div>
                    </>
                  )}
                </div>
              </div>

              <div>
                <label className="label-text">Gender</label>
                <div className="flex bg-surface-container-low rounded-lg p-1 gap-1 border border-outline-variant">
                  {['Male', 'Female'].map(g => (
                    <label key={g} className="flex-1 text-center cursor-pointer">
                      <input
                        type="radio"
                        name="gender"
                        value={g.toLowerCase()}
                        checked={formData.gender === g.toLowerCase()}
                        onChange={handleChange}
                        className="peer sr-only"
                      />
                      <div className="py-2 rounded-md text-label-sm font-medium peer-checked:bg-primary peer-checked:text-on-primary peer-checked:shadow-sm text-on-surface-variant transition-all">
                        {g}
                      </div>
                    </label>
                  ))}
                </div>
              </div>

              <div>
                <label className="label-text" htmlFor="password">Password</label>
                <input
                  id="password"
                  type="password"
                  name="password"
                  required
                  minLength={6}
                  value={formData.password}
                  onChange={handleChange}
                  placeholder="••••••••"
                  className="input-field"
                />
                <PasswordStrength password={formData.password} />
              </div>

              <div>
                <label className="label-text" htmlFor="repeatPassword">Confirm Password</label>
                <input
                  id="repeatPassword"
                  type="password"
                  name="repeatPassword"
                  required
                  minLength={6}
                  value={formData.repeatPassword}
                  onChange={handleChange}
                  placeholder="••••••••"
                  className="input-field"
                />
              </div>
            </div>

            <div className="mt-6 pt-6 border-t border-primary/10">
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
                    Creating Account...
                  </>
                ) : (
                  'Create Account'
                )}
              </button>
            </div>
          </form>

          <p className="text-center text-body-base text-on-surface-variant mt-6">
            Already have an account?{' '}
            <Link href="/auth/login" className="text-primary font-bold hover:underline">
              Log in here
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
