'use client';

import { useState, useEffect, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { getQuestions, type Question } from '@/lib/dataLoader';
import { getProgress, syncOnLogin, onSyncStatus, type ProgressState } from '@/lib/progressManager';
import {
  getLevel,
  calculateOverallAccuracy,
  getDailyChallenge,
  getWeakTopics,
} from '@/lib/gamification';
import { useAuth } from '@/components/AuthProvider';

export default function Dashboard() {
  const [questions, setQuestions] = useState<Question[]>([]);
  const [progress, setProgress] = useState<ProgressState | null>(null);
  const [mounted, setMounted] = useState(false);
  const { user, isGuest, loading: authLoading } = useAuth();
  const [syncStatus, setSyncStatus] = useState<'syncing' | 'synced' | 'error' | 'idle'>('idle');
  const router = useRouter();

  useEffect(() => {
    if (!authLoading && !user && !isGuest) {
      router.replace('/auth/login');
    }
  }, [user, isGuest, authLoading, router]);

  useEffect(() => {
    setMounted(true);
    getQuestions().then(setQuestions);
    setProgress(getProgress());
  }, []);

  useEffect(() => {
    if (user) {
      onSyncStatus(setSyncStatus);
      syncOnLogin(user.id).then((merged) => {
        setProgress(merged);
      });
    } else {
      setSyncStatus('idle');
      onSyncStatus(null);
    }
  }, [user]);

  const levelInfo = useMemo(() => {
    if (!progress) return { level: 1, title: 'Beginner', nextLevelXP: 100, progress: 0 };
    return getLevel(progress.xp);
  }, [progress]);

  const dailyChallengeIndices = useMemo(() => {
    return getDailyChallenge(questions.length);
  }, [questions]);

  const dailyQuestion = useMemo(() => {
    if (questions.length === 0 || dailyChallengeIndices.length === 0) return null;
    return questions[dailyChallengeIndices[0]];
  }, [questions, dailyChallengeIndices]);

  const weakTopics = useMemo(() => {
    if (!progress) return [];
    return getWeakTopics(progress.accuracyByTopic);
  }, [progress]);

  const overallAccuracy = useMemo(() => {
    if (!progress) return 0;
    return calculateOverallAccuracy(progress);
  }, [progress]);

  if (!mounted) {
    return (
      <div className="animate-pulse space-y-6">
        <div className="h-48 bg-surface-container-high rounded-2xl" />
        <div className="grid grid-cols-2 gap-4">
          <div className="h-32 bg-surface-container-high rounded-xl" />
          <div className="h-32 bg-surface-container-high rounded-xl" />
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Greeting & Streak */}
      <div className="flex justify-between items-end">
        <div>
          <h1 className="text-headline-xl-mobile md:text-headline-xl text-primary mb-1">
            Good morning, {user?.user_metadata?.username || user?.email?.split('@')[0] || 'User'} 👋
          </h1>
          <p className="text-body-base text-on-surface-variant">Ready to crush today&apos;s goals?</p>
        </div>
        <div className="flex items-center gap-1 bg-tertiary-fixed text-on-tertiary-fixed-variant px-3 py-1.5 rounded-full text-label-sm shadow-sm border border-tertiary-fixed-dim/30">
          <svg className="w-4 h-4 text-tertiary" fill="currentColor" viewBox="0 0 24 24">
            <path d="M13.5.67s.74 2.65.74 4.8c0 2.06-1.35 3.73-3.41 3.73-2.07 0-3.63-1.67-3.63-3.73l.03-.36C5.21 7.51 4 10.62 4 14c0 4.42 3.58 8 8 8s8-3.58 8-8C20 8.61 17.41 3.8 13.5.67zM11.71 19c-1.78 0-3.22-1.4-3.22-3.14 0-1.62 1.05-2.76 2.81-3.12 1.77-.36 3.6-1.21 4.62-2.58.39 1.08.59 2.22.59 3.33 0 3.05-2.18 5.51-4.8 5.51z" />
          </svg>
          <span>{progress?.streak || 0} Day Streak</span>
        </div>
      </div>

      {/* XP Level Card */}
      <div className="relative bg-gradient-to-br from-primary to-surface-tint rounded-xl p-6 md:p-8 overflow-hidden shadow-ambient">
        <div className="absolute -right-12 -top-12 w-64 h-64 bg-white/10 rounded-full blur-2xl pointer-events-none" />
        <div className="absolute -left-8 -bottom-8 w-48 h-48 bg-secondary-container/10 rounded-full blur-xl pointer-events-none" />
        <div className="relative z-10 flex flex-col md:flex-row md:items-end justify-between gap-6">
          <div className="text-on-primary">
            <div className="text-label-sm uppercase tracking-wider text-on-primary/80 mb-2">Current Level</div>
            <div className="text-headline-3xl font-bold mb-1">{levelInfo.title}</div>
            <div className="text-body-base text-on-primary/90 flex items-center gap-2">
              <span>{progress?.xp || 0} XP Total</span>
            </div>
          </div>
          <div className="w-full md:w-1/2 flex flex-col gap-2">
            <div className="flex justify-between text-label-sm text-on-primary">
              <span>Level Progress</span>
              <span>{levelInfo.progress}%</span>
            </div>
            <div className="w-full h-2 bg-on-primary/20 rounded-full overflow-hidden">
              <div className="h-full bg-white rounded-full transition-all duration-700" style={{ width: `${levelInfo.progress}%` }} />
            </div>
            <div className="text-right text-label-sm text-on-primary/80 mt-1">
              → {levelInfo.title === 'Grandmaster' ? 'Max Level' : `${levelInfo.nextLevelXP - (progress?.xp || 0)} XP to next level`}
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column (8/12) */}
        <div className="lg:col-span-8 flex flex-col gap-6">
          {/* Daily Challenge & Stats Row */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Daily Challenge */}
            <div className="bg-surface-container-lowest rounded-xl p-6 shadow-ambient border border-surface-variant flex flex-col justify-between">
              <div>
                <div className="flex items-center gap-2 mb-4 text-primary">
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 18.75a60.07 60.07 0 0115.797 2.101c.727.198 1.453-.342 1.453-1.096V18.75M3.75 4.5v.75A.75.75 0 013 6h-.75m0 0v-.375c0-.621.504-1.125 1.125-1.125H20.25M2.25 6v9m18-10.5v.75c0 .414.336.75.75.75h.75m-1.5-1.5h.375c.621 0 1.125.504 1.125 1.125v9.75c0 .621-.504 1.125-1.125 1.125h-.375m0 0H5.25M20.25 21H5.25" />
                  </svg>
                  <h2 className="text-headline-xl-mobile md:text-headline-2xl">Daily Challenge</h2>
                </div>
                <div className="flex gap-2 mb-3">
                  {[...Array(5)].map((_, i) => (
                    <div
                      key={i}
                      className={`w-4 h-4 rounded-full ${i < (progress?.streak || 0) % 5 ? 'bg-primary shadow-sm' : 'bg-surface-variant border border-outline-variant'}`}
                    />
                  ))}
                </div>
                <p className="text-body-base text-on-surface-variant">5 questions · Resets midnight</p>
              </div>
              <Link
                href="/exam"
                className="mt-6 w-full bg-primary text-on-primary text-label-sm font-medium rounded-lg py-2.5 hover:brightness-110 active:scale-[0.98] transition-all shadow-sm text-center block"
              >
                Continue Challenge
              </Link>
            </div>

            {/* Stats Card */}
            <div className="bg-surface-container-lowest rounded-xl p-6 shadow-ambient border border-surface-variant">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-headline-xl-mobile text-on-surface">Quick Stats</h3>
              </div>
              <div className="flex justify-around items-center py-4">
                <div className="text-center">
                  <div className="text-headline-2xl font-bold text-primary">{progress?.xp || 0}</div>
                  <div className="text-label-xs text-on-surface-variant uppercase tracking-wider">Total XP</div>
                </div>
                <div className="w-px h-12 bg-outline-variant" />
                <div className="text-center">
                  <div className="text-headline-2xl font-bold text-secondary">{progress?.streak || 0}</div>
                  <div className="text-label-xs text-on-surface-variant uppercase tracking-wider">Streak</div>
                </div>
                <div className="w-px h-12 bg-outline-variant" />
                <div className="text-center">
                  <div className="text-headline-2xl font-bold text-primary">{overallAccuracy}%</div>
                  <div className="text-label-xs text-on-surface-variant uppercase tracking-wider">Accuracy</div>
                </div>
              </div>
            </div>
          </div>

          {/* Quick Actions Grid */}
          <div>
            <h3 className="text-headline-xl-mobile text-on-surface mb-4">Quick Actions</h3>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
              <Link href="/exam" className="bg-surface-container-lowest rounded-xl p-5 shadow-sm border border-surface-variant hover:shadow-ambient hover:border-primary-fixed-dim transition-all group">
                <div className="w-10 h-10 rounded-lg bg-primary-container text-primary flex items-center justify-center mb-3 group-hover:bg-primary group-hover:text-on-primary transition-colors">
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01m-.01 4h.01" />
                  </svg>
                </div>
                <div className="text-label-sm text-on-surface font-bold">Mock Exam</div>
                <div className="text-label-xs text-on-surface-variant mt-1">{questions.length} questions available</div>
              </Link>

              <Link href="/notes" className="bg-surface-container-lowest rounded-xl p-5 shadow-sm border border-surface-variant hover:shadow-ambient hover:border-primary-fixed-dim transition-all group">
                <div className="w-10 h-10 rounded-lg bg-secondary-fixed text-on-secondary-fixed flex items-center justify-center mb-3">
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                </div>
                <div className="text-label-sm text-on-surface font-bold">Study Notes</div>
                <div className="text-label-xs text-on-surface-variant mt-1">Review modules</div>
              </Link>

              <Link href="/bytes" className="bg-surface-container-lowest rounded-xl p-5 shadow-sm border border-surface-variant hover:shadow-ambient hover:border-primary-fixed-dim transition-all group">
                <div className="w-10 h-10 rounded-lg bg-tertiary-fixed text-on-tertiary-fixed flex items-center justify-center mb-3">
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M13 10V3L4 14h7v7l9-11h-7z" />
                  </svg>
                </div>
                <div className="text-label-sm text-on-surface font-bold">Quick Bytes</div>
                <div className="text-label-xs text-on-surface-variant mt-1">5 min concepts</div>
              </Link>

              <Link href="/documents" className="bg-surface-container-lowest rounded-xl p-5 shadow-sm border border-surface-variant hover:shadow-ambient hover:border-primary-fixed-dim transition-all group">
                <div className="w-10 h-10 rounded-lg bg-surface-variant text-on-surface-variant flex items-center justify-center mb-3">
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m2.25 0H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" />
                  </svg>
                </div>
                <div className="text-label-sm text-on-surface font-bold">Documents</div>
                <div className="text-label-xs text-on-surface-variant mt-1">Past papers &amp; rubrics</div>
              </Link>

              <Link href="/progress" className="bg-surface-container-lowest rounded-xl p-5 shadow-sm border border-surface-variant hover:shadow-ambient hover:border-primary-fixed-dim transition-all group">
                <div className="w-10 h-10 rounded-lg bg-primary-fixed text-on-primary-fixed flex items-center justify-center mb-3">
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                  </svg>
                </div>
                <div className="text-label-sm text-on-surface font-bold">Progress</div>
                <div className="text-label-xs text-on-surface-variant mt-1">View detailed analytics</div>
              </Link>

              <Link href="/stats" className="bg-surface-container-lowest rounded-xl p-5 shadow-sm border border-surface-variant hover:shadow-ambient hover:border-primary-fixed-dim transition-all group">
                <div className="w-10 h-10 rounded-lg bg-surface-container-high text-on-surface flex items-center justify-center mb-3">
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M3 13.125C3 12.504 3.504 12 4.125 12h2.25c.621 0 1.125.504 1.125 1.125v6.75C7.5 20.496 6.996 21 6.375 21h-2.25A1.125 1.125 0 013 19.875v-6.75zM9.75 8.625c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125v11.25c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V8.625zM16.5 4.125c0-.621.504-1.125 1.125-1.125h2.25C20.496 3 21 3.504 21 4.125v15.75c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V4.125z" />
                  </svg>
                </div>
                <div className="text-label-sm text-on-surface font-bold">Global Stats</div>
                <div className="text-label-xs text-on-surface-variant mt-1">Compare with peers</div>
              </Link>
            </div>
          </div>
        </div>

        {/* Right Column (4/12) */}
        <div className="lg:col-span-4 flex flex-col gap-6">
          {/* Weak Topics */}
          <div className="bg-surface-container-lowest rounded-xl p-6 shadow-ambient border border-surface-variant">
            <div className="flex items-center justify-between mb-5">
              <h3 className="text-headline-xl-mobile text-on-surface">Weak Topics</h3>
              <svg className="w-5 h-5 text-outline" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m9-.75a9 9 0 11-18 0 9 9 0 0118 0zm-9 3.75h.008v.008H12v-.008z" />
              </svg>
            </div>
            {weakTopics.length > 0 ? (
              <div className="flex flex-col gap-5">
                {weakTopics.slice(0, 3).map(topic => (
                  <div key={topic}>
                    <div className="flex justify-between text-label-sm mb-1 text-on-surface">
                      <span>{topic}</span>
                      <span className="text-error font-bold">&lt;50%</span>
                    </div>
                    <div className="w-full h-2 bg-error-container rounded-full overflow-hidden">
                      <div className="h-full bg-error rounded-full" style={{ width: '35%' }} />
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-on-surface-variant">No weak topics — keep up the great work!</p>
            )}
            <Link
              href="/questions"
              className="mt-6 w-full py-2 border border-outline-variant text-on-surface-variant rounded-lg text-label-sm hover:bg-surface-container-low transition-colors text-center block"
            >
              Review Materials
            </Link>
          </div>

          {/* Recent Activity */}
          <div className="bg-surface-container-lowest rounded-xl p-6 shadow-ambient border border-surface-variant flex-1">
            <h3 className="text-headline-xl-mobile text-on-surface mb-5">Recent Activity</h3>
            <div className="relative border-l-2 border-surface-variant ml-3 space-y-6">
              <div className="relative pl-6">
                <div className="absolute w-3 h-3 bg-primary rounded-full -left-[7px] top-1.5 border-2 border-surface-container-lowest" />
                <div className="text-label-sm text-on-surface">Practicing {progress?.lastTopic || 'topics'}</div>
                <div className="text-label-xs text-on-surface-variant mt-0.5">Recent activity</div>
              </div>
              <div className="relative pl-6">
                <div className="absolute w-3 h-3 bg-surface-variant rounded-full -left-[7px] top-1.5 border-2 border-surface-container-lowest" />
                <div className="text-label-sm text-on-surface">Earned &apos;Consistent&apos; Badge</div>
                <div className="text-label-xs text-on-surface-variant mt-0.5">Keep your streak alive</div>
              </div>
              <div className="relative pl-6">
                <div className="absolute w-3 h-3 bg-surface-variant rounded-full -left-[7px] top-1.5 border-2 border-surface-container-lowest" />
                <div className="text-label-sm text-on-surface">Joined ExitPrep</div>
                <div className="text-label-xs text-on-surface-variant mt-0.5">Account setup complete</div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Sync Status Footer */}
      <footer className="flex flex-col md:flex-row items-center justify-between text-label-xs text-on-surface-variant pt-4 border-t border-outline-variant/50 text-center md:text-left gap-2">
        <p>
          {user ? (
            syncStatus === 'syncing' ? 'Syncing progress...' :
            syncStatus === 'error' ? 'Sync error — will retry' :
            'Progress synced to cloud'
          ) : (
            'Login to sync progress across devices'
          )}
        </p>
        <div className="flex flex-wrap justify-center gap-4">
          <span className="hover:text-on-surface cursor-pointer transition-colors">Privacy Policy</span>
          <span className="hover:text-on-surface cursor-pointer transition-colors">Settings</span>
          <span className="hover:text-on-surface cursor-pointer transition-colors">Support</span>
        </div>
      </footer>
    </div>
  );
}
