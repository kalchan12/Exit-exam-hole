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
      <div className="min-h-[80vh] flex items-center justify-center">
        <div className="max-w-md w-full bg-dark-800 border border-dark-400/30 rounded-2xl shadow-2xl p-8 text-center animate-in">
          <div className="w-16 h-16 rounded-full bg-green-500/20 flex items-center justify-center mx-auto mb-6">
            <svg className="w-8 h-8 text-green-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <h2 className="text-2xl font-bold text-white mb-2">Registration Successful!</h2>
          <p className="text-gray-400 mb-6">
            Check your email to confirm your account. You will be redirected to the login page shortly.
          </p>
          <Link href="/auth/login" className="btn-primary w-full py-3 inline-block">
            Go to Login
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-[80vh] flex items-center justify-center py-12">
      <div className="w-full max-w-2xl bg-slate-900 border border-slate-700/50 rounded-2xl shadow-2xl p-8 animate-in">
        <div className="text-center mb-8">
          <div className="w-12 h-12 rounded-xl bg-blue-600 flex items-center justify-center shadow-[0_0_15px_rgba(37,99,235,0.5)] mx-auto mb-4">
            <svg className="w-6 h-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" />
            </svg>
          </div>
          <h2 className="text-3xl font-bold text-white mb-2">Create Account</h2>
          <p className="text-slate-400">Join CS Prep and master your exams.</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {error && (
            <div className="p-4 rounded-xl bg-red-500/10 border border-red-500/30 text-red-400 text-sm flex items-start gap-3">
              <svg className="w-5 h-5 flex-shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <span>{error}</span>
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Full Name */}
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">Full Name <span className="text-red-400">*</span></label>
              <input
                type="text"
                name="fullName"
                required
                value={formData.fullName}
                onChange={handleChange}
                placeholder="John Doe"
                className="w-full bg-slate-800 border border-slate-600 rounded-xl px-4 py-3 text-white placeholder-slate-500 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500/50 transition-colors"
              />
            </div>

            {/* Username */}
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">Username <span className="text-red-400">*</span></label>
              <input
                type="text"
                name="username"
                required
                value={formData.username}
                onChange={handleChange}
                placeholder="johndoe123"
                className="w-full bg-slate-800 border border-slate-600 rounded-xl px-4 py-3 text-white placeholder-slate-500 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500/50 transition-colors"
              />
            </div>

            {/* Email */}
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">Email Address <span className="text-red-400">*</span></label>
              <input
                type="email"
                name="email"
                required
                value={formData.email}
                onChange={handleChange}
                placeholder="john@example.com"
                className="w-full bg-slate-800 border border-slate-600 rounded-xl px-4 py-3 text-white placeholder-slate-500 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500/50 transition-colors"
              />
            </div>

            {/* Major */}
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">Major <span className="text-red-400">*</span></label>
              <input
                type="text"
                name="major"
                required
                value={formData.major}
                onChange={handleChange}
                placeholder="Computer Science"
                className="w-full bg-slate-800 border border-slate-600 rounded-xl px-4 py-3 text-white placeholder-slate-500 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500/50 transition-colors"
              />
            </div>

            {/* Password */}
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">Password <span className="text-red-400">*</span></label>
              <input
                type="password"
                name="password"
                required
                minLength={6}
                value={formData.password}
                onChange={handleChange}
                placeholder="••••••••"
                className="w-full bg-slate-800 border border-slate-600 rounded-xl px-4 py-3 text-white placeholder-slate-500 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500/50 transition-colors"
              />
            </div>

            {/* Repeat Password */}
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">Repeat Password <span className="text-red-400">*</span></label>
              <input
                type="password"
                name="repeatPassword"
                required
                minLength={6}
                value={formData.repeatPassword}
                onChange={handleChange}
                placeholder="••••••••"
                className="w-full bg-slate-800 border border-slate-600 rounded-xl px-4 py-3 text-white placeholder-slate-500 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500/50 transition-colors"
              />
            </div>

            {/* Gender */}
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">Gender <span className="text-red-400">*</span></label>
              <select
                name="gender"
                required
                value={formData.gender}
                onChange={handleChange}
                className="w-full bg-slate-800 border border-slate-600 rounded-xl px-4 py-3 text-white focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500/50 transition-colors appearance-none"
              >
                <option value="male">Male</option>
                <option value="female">Female</option>
              </select>
            </div>

            {/* Profile Picture */}
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">Profile Picture <span className="text-slate-500 font-normal">(Optional)</span></label>
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
                className="w-full bg-slate-800 border border-slate-600 rounded-xl px-4 py-2.5 text-white placeholder-slate-500 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500/50 transition-colors file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-600 file:text-white hover:file:bg-blue-700"
              />
            </div>
          </div>

          {/* Bio */}
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">Bio <span className="text-gray-500 font-normal">(Optional)</span></label>
            <textarea
              name="bio"
              rows={3}
              value={formData.bio}
              onChange={handleChange}
              placeholder="Tell us a bit about yourself..."
              className="w-full bg-dark-600 border border-dark-400/50 rounded-xl px-4 py-3 text-white placeholder-gray-500 focus:border-accent-purple focus:outline-none focus:ring-1 focus:ring-accent-purple/50 transition-colors resize-none"
            />
          </div>

          <div className="pt-4">
            <button
              type="submit"
              disabled={loading}
              className="w-full py-4 text-lg font-semibold bg-blue-600 hover:bg-blue-700 text-white rounded-xl shadow-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
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

          <div className="text-center pt-2">
            <p className="text-slate-400">
              Already have an account?{' '}
              <Link href="/auth/login" className="text-blue-400 hover:text-blue-300 transition-colors font-medium">
                Log in here
              </Link>
            </p>
          </div>
        </form>
      </div>
    </div>
  );
}
