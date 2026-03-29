'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { getQuestions, type Question } from '@/lib/dataLoader';
import { getProgress, syncOnLogin, onSyncStatus, type ProgressState } from '@/lib/progressManager';
import {
  getLevel,
  calculateOverallAccuracy,
  calculateTopicMastery,
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

  // Protected route logic
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

  // Sync on login
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

  const questionTopicMap = useMemo(() => {
    const map: Record<string, string> = {};
    questions.forEach((q) => { map[q.id] = q.topic; });
    return map;
  }, [questions]);

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
        <div className="h-48 bg-dark-700 rounded-2xl" />
        <div className="grid grid-cols-2 gap-4">
          <div className="h-32 bg-dark-700 rounded-xl" />
          <div className="h-32 bg-dark-700 rounded-xl" />
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-in">
      {/* Hero Card */}
      <div className="relative overflow-hidden rounded-3xl bg-[#11152a] p-8 border border-accent-purple/20 shadow-2xl">
        <div className="absolute top-0 right-0 w-96 h-96 bg-accent-purple/10 rounded-full blur-[100px] -translate-y-1/2 translate-x-1/2" />
        <div className="relative z-10 flex flex-col md:flex-row justify-between gap-8">
          <div className="flex-1">
            <span className="text-[10px] uppercase font-black tracking-[0.3em] text-accent-purple-light mb-4 block">
              Welcome Back, {user?.user_metadata?.username || user?.email?.split('@')[0] || 'User'}
            </span>
            <h2 className="text-4xl sm:text-5xl font-black text-white mb-4 italic tracking-tighter">
              READY TO <span className="text-accent-purple">ASCEND?</span>
            </h2>
            <p className="text-gray-400 max-w-md leading-relaxed mb-8 text-sm">
                Your performance is trending upward. Continue where you left off in <span className="text-white font-bold uppercase">{progress?.lastTopic || 'General Study'}</span>.
            </p>
            <div className="flex flex-wrap gap-4">
                <Link href="/questions" className="btn-primary px-8 py-3 rounded-xl font-black uppercase italic tracking-widest text-sm">
                    Resume Study
                </Link>
                <Link href="/exam" className="px-8 py-3 rounded-xl border border-white/10 bg-white/5 hover:bg-white/10 text-white font-black uppercase italic tracking-widest text-sm transition-all">
                    Exit Exam
                </Link>
            </div>
          </div>
          
          {user && (
            <div className="flex gap-4 sm:gap-8 items-center bg-black/20 backdrop-blur-md p-6 rounded-3xl border border-white/5">
                <div className="text-center">
                    <div className="text-3xl font-black text-white italic">{progress?.xp || 0}</div>
                    <div className="text-[10px] text-gray-500 uppercase font-black tracking-widest">XP</div>
                </div>
                <div className="w-[1px] h-10 bg-white/10" />
                <div className="text-center">
                    <div className="text-3xl font-black text-neon-green italic">{progress?.streak || 0}</div>
                    <div className="text-[10px] text-gray-500 uppercase font-black tracking-widest">🔥 Streak</div>
                </div>
                <div className="w-[1px] h-10 bg-white/10" />
                <div className="text-center">
                    <div className="text-3xl font-black text-accent-purple italic">{overallAccuracy} %</div>
                    <div className="text-[10px] text-gray-500 uppercase font-black tracking-widest">Accuracy</div>
                </div>
            </div>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Column */}
        <div className="lg:col-span-2 space-y-4">
          <div className="card p-8 bg-gradient-to-br from-white/[0.05] to-transparent border-white/10">
            <h3 className="text-2xl font-bold text-white mb-4">Start Your Journey</h3>
            <p className="text-gray-400 mb-6 leading-relaxed">
              Begin practicing questions or taking the full mock exit exam to test your knowledge across all computer science domains.
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Link href="/questions" className="flex items-center gap-4 p-4 rounded-2xl bg-white/5 border border-white/10 hover:bg-white/10 transition-all group">
                <div className="w-12 h-12 rounded-xl bg-blue-500/20 flex items-center justify-center text-blue-400 group-hover:scale-110 transition-transform">
                  <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                </div>
                <div>
                  <div className="text-white font-bold tracking-tight italic">Practice Questions</div>
                  <div className="text-xs text-gray-500 uppercase font-black">Browse by topic</div>
                </div>
              </Link>
              <Link href="/exam" className="flex items-center gap-4 p-4 rounded-2xl bg-white/5 border border-white/10 hover:bg-white/10 transition-all group">
                <div className="w-12 h-12 rounded-xl bg-purple-500/20 flex items-center justify-center text-purple-400 group-hover:scale-110 transition-transform">
                  <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01m-.01 4h.01" /></svg>
                </div>
                <div>
                  <div className="text-white font-bold tracking-tight italic">Mock Exit Exam</div>
                  <div className="text-xs text-gray-500 uppercase font-black">Full test mode</div>
                </div>
              </Link>
            </div>
          </div>
        </div>

        {/* Right Column */}
        <div className="space-y-6">
          {user && (
            <>
              {/* Daily Challenge */}
              <div className="card p-5">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-bold flex items-center gap-2">
                    <span>🏆</span> Daily Challenge
                  </h3>
                </div>
                {dailyQuestion ? (
                  <>
                    <span className="badge bg-accent-purple/20 text-accent-purple-glow text-xs mb-3 inline-block">
                      +50 XP Available
                    </span>
                    <h4 className="text-white font-semibold mb-2 text-sm leading-relaxed">
                      {dailyQuestion.topic} Master
                    </h4>
                    <p className="text-gray-400 text-xs mb-4">
                      Keep your streak alive by solving today&apos;s puzzle.
                    </p>
                    <div className="flex items-center gap-4 mb-4">
                      <div className="text-center">
                        <p className="text-3xl font-bold text-white">{progress?.streak || 0}</p>
                        <p className="text-[10px] text-gray-500 uppercase tracking-wider">Day Streak</p>
                      </div>
                      <div className="flex gap-0.5">
                        {[...Array(7)].map((_, i) => (
                          <div
                            key={i}
                            className={`w-2 rounded-full transition-all ${
                              i < (progress?.streak || 0) % 7
                                ? 'h-6 bg-accent-purple'
                                : 'h-4 bg-dark-500'
                            }`}
                          />
                        ))}
                      </div>
                    </div>
                    <Link
                      href="/questions"
                      className="block w-full text-center btn-secondary text-sm py-2.5 font-semibold hover:bg-dark-500"
                    >
                      Start Now
                    </Link>
                  </>
                ) : (
                  <p className="text-gray-400 text-sm">Loading challenge...</p>
                )}
              </div>

              {/* Stats Summary */}
              <div className="card p-5">
                <h3 className="text-sm text-gray-400 uppercase tracking-wider mb-3">Global Ranking</h3>
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-yellow-500/20 flex items-center justify-center flex-shrink-0">
                    <svg className="w-5 h-5 text-yellow-400" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
                    </svg>
                  </div>
                  <div className="min-w-0">
                    <p className="text-xl font-bold text-white truncate">
                      {(progress?.xp || 0) > 0 ? `#${Math.max(1, 1000 - Math.floor((progress?.xp || 0) / 10))}` : 'Unranked'}
                    </p>
                    <p className="text-xs text-accent-purple-light truncate">
                      {(progress?.xp || 0) > 0 ? `Top ${Math.max(1, Math.max(1, 100 - Math.floor((progress?.xp || 0) / 50)))}% of all students` : 'Start practicing to rank up!'}
                    </p>
                  </div>
                </div>
              </div>

              {/* XP & Level */}
              <div className="card p-5">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm text-gray-400">Level {levelInfo.level}</span>
                  <span className="text-sm font-semibold text-accent-purple-light">{levelInfo.title}</span>
                </div>
                <div className="progress-bar mb-2">
                  <div
                    className="progress-bar-fill"
                    style={{ width: `${levelInfo.progress}%` }}
                  />
                </div>
                <p className="text-xs text-gray-500">
                  {progress?.xp || 0} / {levelInfo.nextLevelXP} XP
                </p>
              </div>
            </>
          )}

          {!user && (
            <div className="card p-6 border-accent-purple/30 bg-accent-purple/5">
              <h3 className="text-lg font-bold text-white mb-3">Join the Leaderboard</h3>
              <p className="text-sm text-gray-400 mb-6 leading-relaxed">
                Unlock streaks, levels, and compete with other students by creating an account.
              </p>
              <Link href="/auth/register" className="btn-primary w-full py-3 rounded-xl font-black uppercase text-xs tracking-widest text-center block transition-all">
                Create Account
              </Link>
            </div>
          )}
        </div>
      </div>

      {/* Weak Topics Alert */}
      {user && weakTopics.length > 0 && (
        <div className="card p-5 border-yellow-500/30 bg-yellow-500/5">
          <div className="flex items-center gap-3">
            <span className="text-xl">⚠️</span>
            <div>
              <h4 className="text-white font-semibold text-sm">Weak Topics Detected</h4>
              <p className="text-gray-400 text-xs mt-1">
                Focus on: {weakTopics.join(', ')} — accuracy below 50%
              </p>
            </div>
            <Link href="/questions" className="ml-auto btn-secondary text-xs">
              Practice Now
            </Link>
          </div>
        </div>
      )}

      {/* Footer */}
      <footer className="flex flex-col md:flex-row items-center justify-between text-xs text-gray-600 pt-4 border-t border-dark-400/10 text-center md:text-left gap-2 mb-4 lg:mb-0">
        <p>
          {user ? (
            syncStatus === 'syncing' ? '🔄 Syncing progress to cloud...' :
            syncStatus === 'error' ? '🔴 Sync error — will retry' :
            syncStatus === 'synced' ? '🟢 Progress synced to cloud' :
            '🟢 Progress synced to cloud'
          ) : (
            '🟡 Login to sync progress across devices'
          )}
        </p>
        <div className="flex flex-wrap justify-center gap-4 mt-2 md:mt-0">
          <span className="hover:text-gray-400 cursor-pointer">Privacy Policy</span>
          <span className="hover:text-gray-400 cursor-pointer">User Settings</span>
          <span className="hover:text-gray-400 cursor-pointer">Support Docs</span>
        </div>
      </footer>
    </div>
  );
}
