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

  const topics = useMemo(() => {
    const topicSet = new Set(questions.map((q) => q.topic));
    return Array.from(topicSet);
  }, [questions]);

  const topicIcons: Record<string, string> = {
    'Algorithms': '⚡',
    'Operating Systems': '🖥️',
    'Database Systems': '🗄️',
    'Networking': '🌐',
  };

  const topicSubtopics: Record<string, string> = {
    'Algorithms': 'Sorting, Searching, Dynamic Programming',
    'Operating Systems': 'Memory Management, Scheduling, IO',
    'Database Systems': 'Normalization, SQL, Transactions',
    'Networking': 'TCP/IP, HTTP, DNS, Security',
  };

  const questionTopicMap = useMemo(() => {
    const map: Record<string, string> = {};
    questions.forEach((q) => { map[q.id] = q.topic; });
    return map;
  }, [questions]);

  const topicMastery = useCallback(
    (topic: string) => {
      if (!progress) return 0;
      return calculateTopicMastery(
        topic,
        progress.answeredQuestions,
        progress.correctAnswers,
        questionTopicMap
      );
    },
    [progress, questionTopicMap]
  );

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
      <div className="relative overflow-hidden rounded-2xl bg-hero-gradient p-8 border border-accent-purple/20">
        <div className="absolute top-0 right-0 w-64 h-64 bg-accent-purple/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />
        <div className="relative z-10">
          <span className="badge-source text-xs uppercase tracking-wider mb-3 inline-block">
            Currently Studying
          </span>
          <h2 className="text-3xl sm:text-4xl font-bold text-white mb-2">
            Continue Learning
          </h2>
          <p className="text-gray-300 mb-6">
            Pick up where you left off:{' '}
            <span className="text-white font-semibold">
              {progress?.lastTopic
                ? `${progress.lastTopic} — ${topics.includes(progress.lastTopic) ? 'Review' : 'Practice'}`
                : 'Data Structures · Red-Black Trees'}
            </span>
          </p>
          <Link href="/questions" className="btn-primary inline-flex items-center gap-2">
            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
              <path d="M8 5v14l11-7z" />
            </svg>
            Resume Course
          </Link>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Study Categories */}
        <div className="lg:col-span-2 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-xl font-bold flex items-center gap-2">
              <span>📚</span> Study Categories
            </h3>
            <Link href="/questions" className="text-accent-purple-light text-sm font-medium hover:underline flex-shrink-0">
              View all
            </Link>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-2 gap-4">
            {topics.map((topic) => {
              const mastery = topicMastery(topic);
              return (
                <Link
                  key={topic}
                  href={`/questions?topic=${encodeURIComponent(topic)}`}
                  className="card-hover p-5 group"
                >
                  <div className="flex items-start justify-between mb-3">
                    <div className="w-10 h-10 rounded-lg bg-accent-purple/20 flex items-center justify-center text-lg">
                      {topicIcons[topic] || '📖'}
                    </div>
                    <span className="text-xs text-gray-400 font-medium">
                      {mastery}% Mastery
                    </span>
                  </div>
                  <h4 className="text-white font-semibold mb-1 group-hover:text-accent-purple-light transition-colors">
                    {topic}
                  </h4>
                  <p className="text-sm text-gray-400 mb-3">
                    {topicSubtopics[topic] || 'Various topics'}
                  </p>
                  <div className="progress-bar">
                    <div
                      className="progress-bar-fill"
                      style={{ width: `${mastery}%` }}
                    />
                  </div>
                </Link>
              );
            })}
          </div>
        </div>

        {/* Right Column */}
        <div className="space-y-6">
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
                <p className="text-2xl font-bold text-white truncate">#{Math.max(1, 1248 - (progress?.xp || 0))}</p>
                <p className="text-xs text-accent-purple-light truncate">
                  Top {Math.max(1, Math.round(100 - (progress?.xp || 0) / 10))}% of all students
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
        </div>
      </div>

      {/* Weak Topics Alert */}
      {weakTopics.length > 0 && (
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
