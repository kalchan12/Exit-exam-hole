'use client';

import { useState, useEffect, useMemo } from 'react';
import { getQuestions, type Question } from '@/lib/dataLoader';
import { getProgress, resetProgress, type ProgressState } from '@/lib/progressManager';
import {
  getLevel,
  calculateOverallAccuracy,
  calculateTopicMastery,
  getWeakTopics,
} from '@/lib/gamification';

export default function StatsPage() {
  const [questions, setQuestions] = useState<Question[]>([]);
  const [progress, setProgress] = useState<ProgressState | null>(null);
  const [mounted, setMounted] = useState(false);
  const [showResetConfirm, setShowResetConfirm] = useState(false);

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
    setProgress(getProgress());
    setShowResetConfirm(false);
  };

  if (!mounted) {
    return (
      <div className="animate-pulse space-y-6">
        <div className="h-12 bg-dark-700 rounded-xl w-48" />
        <div className="grid grid-cols-4 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-24 bg-dark-700 rounded-xl" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white">Progress & Stats</h1>
          <p className="text-gray-400 text-sm mt-1">Track your learning journey</p>
        </div>
        <button
          onClick={() => setShowResetConfirm(true)}
          className="btn-secondary text-sm text-red-400 border-red-500/30 hover:border-red-500/60 hover:bg-red-500/10"
        >
          Reset Progress
        </button>
      </div>

      {/* Reset Confirmation */}
      {showResetConfirm && (
        <div className="card p-5 border-red-500/30 bg-red-500/5">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <span className="text-xl">⚠️</span>
              <p className="text-white font-medium">Are you sure? This will erase all progress data.</p>
            </div>
            <div className="flex gap-2">
              <button onClick={() => setShowResetConfirm(false)} className="btn-secondary text-sm">
                Cancel
              </button>
              <button onClick={handleReset} className="bg-red-500 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-red-600 transition-colors">
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
            <div className="w-10 h-10 rounded-xl bg-accent-purple/20 flex items-center justify-center">
              <svg className="w-5 h-5 text-accent-purple-light" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
            </div>
            <span className="text-xs text-gray-400 uppercase tracking-wider">Total XP</span>
          </div>
          <p className="text-3xl font-bold text-white">{progress?.xp || 0}</p>
          <p className="text-xs text-accent-purple-light mt-1">Level {levelInfo.level} — {levelInfo.title}</p>
        </div>

        <div className="card p-5">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-10 h-10 rounded-xl bg-orange-500/20 flex items-center justify-center">
              <span className="text-lg">🔥</span>
            </div>
            <span className="text-xs text-gray-400 uppercase tracking-wider">Streak</span>
          </div>
          <p className="text-3xl font-bold text-white">{progress?.streak || 0}</p>
          <p className="text-xs text-orange-400 mt-1">Consecutive correct</p>
        </div>

        <div className="card p-5">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-10 h-10 rounded-xl bg-green-500/20 flex items-center justify-center">
              <svg className="w-5 h-5 text-green-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <span className="text-xs text-gray-400 uppercase tracking-wider">Accuracy</span>
          </div>
          <p className="text-3xl font-bold text-white">{overallAccuracy}%</p>
          <p className="text-xs text-green-400 mt-1">{totalCorrect}/{totalAnswered} correct</p>
        </div>

        <div className="card p-5">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-10 h-10 rounded-xl bg-blue-500/20 flex items-center justify-center">
              <svg className="w-5 h-5 text-blue-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
              </svg>
            </div>
            <span className="text-xs text-gray-400 uppercase tracking-wider">Answered</span>
          </div>
          <p className="text-3xl font-bold text-white">{totalAnswered}</p>
          <p className="text-xs text-blue-400 mt-1">of {questions.length} questions</p>
        </div>
      </div>

      {/* Level Progress */}
      <div className="card p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-bold text-white">Level Progress</h3>
          <span className="badge bg-accent-purple/20 text-accent-purple-glow">
            {levelInfo.title}
          </span>
        </div>
        <div className="flex items-center gap-4 mb-2">
          <span className="text-sm text-gray-400">Level {levelInfo.level}</span>
          <div className="flex-1 progress-bar h-3">
            <div className="progress-bar-fill h-3" style={{ width: `${levelInfo.progress}%` }} />
          </div>
          <span className="text-sm text-gray-400">Level {levelInfo.level + 1}</span>
        </div>
        <p className="text-center text-xs text-gray-500">
          {progress?.xp || 0} / {levelInfo.nextLevelXP} XP ({levelInfo.progress}%)
        </p>
      </div>

      {/* Topic Breakdown */}
      <div className="card p-6">
        <h3 className="text-lg font-bold text-white mb-4">Topic Mastery</h3>
        <div className="space-y-5">
          {topicStats.map(({ topic, mastery, total, answered }) => (
            <div key={topic}>
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium text-white">{topic}</span>
                  <span className="text-xs text-gray-500">({answered}/{total} done)</span>
                </div>
                <span className={`text-sm font-bold ${
                  mastery >= 70 ? 'text-green-400' :
                  mastery >= 40 ? 'text-yellow-400' :
                  'text-red-400'
                }`}>
                  {mastery}%
                </span>
              </div>
              <div className="progress-bar">
                <div
                  className={`h-full rounded-full transition-all duration-700 ease-out ${
                    mastery >= 70 ? 'bg-gradient-to-r from-green-500 to-emerald-400' :
                    mastery >= 40 ? 'bg-gradient-to-r from-yellow-500 to-amber-400' :
                    'bg-gradient-to-r from-red-500 to-orange-400'
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
        <div className="card p-6 border-yellow-500/20">
          <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
            <span>⚠️</span> Areas for Improvement
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {weakTopics.map((topic) => (
              <div key={topic} className="flex items-center gap-3 p-3 rounded-lg bg-yellow-500/5 border border-yellow-500/20">
                <div className="w-8 h-8 rounded-lg bg-yellow-500/20 flex items-center justify-center">
                  <span className="text-sm">📌</span>
                </div>
                <div>
                  <p className="text-sm font-medium text-white">{topic}</p>
                  <p className="text-xs text-yellow-400">Needs more practice</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Recent Activity */}
      <div className="card p-6">
        <h3 className="text-lg font-bold text-white mb-4">Quick Statistics</h3>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="p-4 rounded-xl bg-dark-600/40 text-center">
            <p className="text-2xl font-bold text-accent-purple-light">
              {questions.length > 0 ? Math.round((totalAnswered / questions.length) * 100) : 0}%
            </p>
            <p className="text-xs text-gray-400 mt-1">Questions Completed</p>
          </div>
          <div className="p-4 rounded-xl bg-dark-600/40 text-center">
            <p className="text-2xl font-bold text-neon-green">
              {progress?.lastActiveDate || 'Never'}
            </p>
            <p className="text-xs text-gray-400 mt-1">Last Active</p>
          </div>
          <div className="p-4 rounded-xl bg-dark-600/40 text-center">
            <p className="text-2xl font-bold text-neon-blue">
              {topics.length}
            </p>
            <p className="text-xs text-gray-400 mt-1">Topics Available</p>
          </div>
        </div>
      </div>
    </div>
  );
}
