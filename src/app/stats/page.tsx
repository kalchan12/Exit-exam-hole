'use client';

import { useState, useEffect, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { getQuestions, type Question } from '@/lib/dataLoader';
import { getProgress, resetProgress, resetRemoteProgress, type ProgressState } from '@/lib/progressManager';
import {
  getLevel,
  calculateOverallAccuracy,
  calculateTopicMastery,
  getWeakTopics,
} from '@/lib/gamification';
import { useAuth } from '@/components/AuthProvider';
import {
  Zap,
  Flame,
  CheckCircle2,
  FileText,
  TrendingUp,
  AlertTriangle,
  Target,
} from 'lucide-react';

export default function StatsPage() {
  const [questions, setQuestions] = useState<Question[]>([]);
  const [progress, setProgress] = useState<ProgressState | null>(null);
  const [mounted, setMounted] = useState(false);
  const [showResetConfirm, setShowResetConfirm] = useState(false);
  const { user, isGuest } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (isGuest) {
      router.replace('/dashboard');
    }
  }, [isGuest, router]);

  useEffect(() => {
    setMounted(true);
    getQuestions().then(setQuestions);
    setProgress(getProgress());
  }, []);

  const topics = useMemo(() => {
    const topicSet = new Set(questions.map((q) => q.topic));
    return Array.from(topicSet);
  }, [questions]);

  const questionTopicMap = useMemo(() => {
    const map: Record<string, string> = {};
    questions.forEach((q) => { map[q.id] = q.topic; });
    return map;
  }, [questions]);

  const levelInfo = useMemo(() => {
    if (!progress) return { level: 1, title: 'Beginner', nextLevelXP: 100, progress: 0 };
    return getLevel(progress.xp);
  }, [progress]);

  const overallAccuracy = useMemo(() => {
    if (!progress) return 0;
    return calculateOverallAccuracy(progress);
  }, [progress]);

  const topicStats = useMemo(() => {
    if (!progress) return [];
    return topics.map((topic) => {
      const mastery = calculateTopicMastery(
        topic,
        progress.answeredQuestions,
        progress.correctAnswers,
        questionTopicMap
      );
      const topicQuestions = questions.filter((q) => q.topic === topic);
      const answered = topicQuestions.filter((q) => progress.answeredQuestions[q.id]).length;
      return { topic, mastery, total: topicQuestions.length, answered };
    });
  }, [progress, topics, questions, questionTopicMap]);

  const weakTopics = useMemo(() => {
    if (!progress) return [];
    const accuracyMap: Record<string, number> = {};
    topicStats.forEach(({ topic, mastery }) => {
      accuracyMap[topic] = mastery;
    });
    return getWeakTopics(accuracyMap);
  }, [progress, topicStats]);

  const totalAnswered = useMemo(() => {
    if (!progress) return 0;
    return Object.keys(progress.answeredQuestions).length;
  }, [progress]);

  const totalCorrect = useMemo(() => {
    if (!progress) return 0;
    return Object.values(progress.correctAnswers).filter(Boolean).length;
  }, [progress]);

  const handleReset = () => {
    resetProgress();
    if (user) {
      resetRemoteProgress(user.id);
    }
    setProgress(getProgress());
    setShowResetConfirm(false);
  };

  if (!mounted) {
    return (
      <div className="animate-pulse space-y-6 py-4">
        <div className="h-10 bg-surface-container-highest rounded-xl w-48" />
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-24 bg-surface-container-highest rounded-xl" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8 py-4">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-headline-2xl font-bold text-on-surface">Progress & Stats</h1>
          <p className="text-body-base text-on-surface-variant mt-1">Track your learning journey</p>
        </div>
        <button
          onClick={() => setShowResetConfirm(true)}
          className="btn-ghost text-label-sm text-error"
        >
          Reset Progress
        </button>
      </div>

      {/* Reset Confirmation */}
      {showResetConfirm && (
        <div className="card p-5 border-error/30 bg-error-container/10">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <AlertTriangle className="w-5 h-5 text-error" />
              <p className="text-label-sm text-on-surface font-medium">Are you sure? This will erase all progress data.</p>
            </div>
            <div className="flex gap-2">
              <button onClick={() => setShowResetConfirm(false)} className="btn-secondary text-label-sm">
                Cancel
              </button>
              <button onClick={handleReset} className="px-4 py-2 rounded-lg bg-error text-on-error text-label-sm font-medium hover:brightness-110 transition-all">
                Confirm Reset
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Overview Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="card p-5">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-9 h-9 rounded-xl bg-primary-container flex items-center justify-center">
              <Zap className="w-4 h-4 text-primary" />
            </div>
            <span className="text-label-xs text-on-surface-variant tracking-wider">Total XP</span>
          </div>
          <p className="text-headline-xl-mobile font-bold text-on-surface">{progress?.xp || 0}</p>
          <p className="text-label-xs text-primary mt-1">Level {levelInfo.level} &mdash; {levelInfo.title}</p>
        </div>

        <div className="card p-5">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-9 h-9 rounded-xl bg-secondary-fixed-dim/30 flex items-center justify-center">
              <Flame className="w-4 h-4 text-secondary" />
            </div>
            <span className="text-label-xs text-on-surface-variant tracking-wider">Streak</span>
          </div>
          <p className="text-headline-xl-mobile font-bold text-on-surface">{progress?.streak || 0}</p>
          <p className="text-label-xs text-secondary mt-1">Consecutive correct</p>
        </div>

        <div className="card p-5">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-9 h-9 rounded-xl bg-secondary-fixed-dim/30 flex items-center justify-center">
              <CheckCircle2 className="w-4 h-4 text-secondary" />
            </div>
            <span className="text-label-xs text-on-surface-variant tracking-wider">Accuracy</span>
          </div>
          <p className="text-headline-xl-mobile font-bold text-on-surface">{overallAccuracy}%</p>
          <p className="text-label-xs text-secondary mt-1">{totalCorrect}/{totalAnswered} correct</p>
        </div>

        <div className="card p-5">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-9 h-9 rounded-xl bg-surface-container flex items-center justify-center">
              <FileText className="w-4 h-4 text-primary" />
            </div>
            <span className="text-label-xs text-on-surface-variant tracking-wider">Answered</span>
          </div>
          <p className="text-headline-xl-mobile font-bold text-on-surface">{totalAnswered}</p>
          <p className="text-label-xs text-on-surface-variant mt-1">of {questions.length} questions</p>
        </div>
      </div>

      {/* Level Progress */}
      <div className="card p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-headline-xl-mobile font-bold text-on-surface">Level Progress</h3>
          <span className="badge-source">{levelInfo.title}</span>
        </div>
        <div className="flex items-center gap-4 mb-2">
          <span className="text-label-sm text-on-surface-variant">Level {levelInfo.level}</span>
          <div className="progress-bar flex-1">
            <div className="progress-bar-fill" style={{ width: `${levelInfo.progress}%` }} />
          </div>
          <span className="text-label-sm text-on-surface-variant">Level {levelInfo.level + 1}</span>
        </div>
        <p className="text-center text-label-xs text-on-surface-variant">
          {progress?.xp || 0} / {levelInfo.nextLevelXP} XP ({levelInfo.progress}%)
        </p>
      </div>

      {/* Topic Breakdown */}
      <div className="card p-6">
        <h3 className="text-headline-xl-mobile font-bold text-on-surface mb-5">Topic Mastery</h3>
        <div className="space-y-5">
          {topicStats.map(({ topic, mastery, total, answered }) => (
            <div key={topic}>
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <span className="text-label-sm font-medium text-on-surface">{topic}</span>
                  <span className="text-label-xs text-on-surface-variant">({answered}/{total} done)</span>
                </div>
                <span className={`text-label-sm font-bold ${
                  mastery >= 70 ? 'text-secondary' :
                  mastery >= 40 ? 'text-tertiary' :
                  'text-error'
                }`}>
                  {mastery}%
                </span>
              </div>
              <div className="progress-bar">
                <div
                  className={`h-full rounded-full transition-all duration-700 ease-out ${
                    mastery >= 70 ? 'bg-secondary' :
                    mastery >= 40 ? 'bg-tertiary' :
                    'bg-error'
                  }`}
                  style={{ width: `${mastery}%` }}
                />
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Weak Topics */}
      {weakTopics.length > 0 && (
        <div className="card p-6 border-tertiary/20">
          <h3 className="text-headline-xl-mobile font-bold text-on-surface mb-4 flex items-center gap-2">
            <TrendingUp className="w-5 h-5 text-tertiary" /> Areas for Improvement
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {weakTopics.map((topic) => (
              <div key={topic} className="flex items-center gap-3 p-3 rounded-xl bg-tertiary-fixed-dim/10 border border-tertiary/20">
                <div className="w-8 h-8 rounded-lg bg-tertiary-fixed-dim/20 flex items-center justify-center shrink-0">
                  <Target className="w-4 h-4 text-tertiary" />
                </div>
                <div>
                  <p className="text-label-sm font-medium text-on-surface">{topic}</p>
                  <p className="text-label-xs text-tertiary">Needs more practice</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Quick Statistics */}
      <div className="card p-6">
        <h3 className="text-headline-xl-mobile font-bold text-on-surface mb-5">Quick Statistics</h3>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="p-5 rounded-xl bg-surface-container border border-outline-variant text-center">
            <p className="text-headline-xl-mobile font-bold text-primary">
              {questions.length > 0 ? Math.round((totalAnswered / questions.length) * 100) : 0}%
            </p>
            <p className="text-label-xs text-on-surface-variant mt-1">Questions Completed</p>
          </div>
          <div className="p-5 rounded-xl bg-surface-container border border-outline-variant text-center">
            <p className="text-headline-xl-mobile font-bold text-secondary">
              {progress?.lastActiveDate || 'Never'}
            </p>
            <p className="text-label-xs text-on-surface-variant mt-1">Last Active</p>
          </div>
          <div className="p-5 rounded-xl bg-surface-container border border-outline-variant text-center">
            <p className="text-headline-xl-mobile font-bold text-primary">
              {topics.length}
            </p>
            <p className="text-label-xs text-on-surface-variant mt-1">Topics Available</p>
          </div>
        </div>
      </div>
    </div>
  );
}
