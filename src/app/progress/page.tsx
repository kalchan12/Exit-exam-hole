'use client';

import { useState, useEffect } from 'react';
import { getProgress, type ProgressState } from '@/lib/progressManager';
import { getQuestions, getNotes, getBytes } from '@/lib/dataLoader';
import { getLevel, calculateTopicMastery, calculateOverallAccuracy } from '@/lib/gamification';
import {
  Flame,
  Target,
  Cpu,
  Zap,
  ChevronRight,
  Hexagon,
  Shield,
  Activity,
  Database,
  Terminal,
  Settings,
  Code2
} from 'lucide-react';
import Link from 'next/link';

export default function ProgressPage() {
  const [progress, setProgress] = useState<ProgressState | null>(null);
  const [stats, setStats] = useState({
    totalQuestions: 0,
    totalNotes: 0,
    totalBytes: 0,
    answeredCount: 0,
    completedNotesCount: 0,
    questions: [] as any[],
  });
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    const p = getProgress();
    setProgress(p);

    Promise.all([getQuestions(), getNotes(), getBytes()]).then(([qs, ns, bs]) => {
      setStats({
        totalQuestions: qs.length,
        totalNotes: ns.length,
        totalBytes: bs.length,
        answeredCount: Object.keys(p.answeredQuestions).length,
        completedNotesCount: Object.keys(p.completedNotes || {}).length,
        questions: qs,
      });
    });
  }, []);

  if (!mounted || !progress) return null;

  const accuracy = calculateOverallAccuracy(progress);
  const levelInfo = getLevel(progress.xp);

  const questionTopicMap: Record<string, string> = {};
  stats.questions.forEach(q => { questionTopicMap[q.id] = q.topic; });

  const uniqueTopics = Array.from(new Set(stats.questions.map(q => q.topic)));
  const topicMastery = uniqueTopics.map(topic => ({
    name: topic,
    mastery: calculateTopicMastery(topic, progress.answeredQuestions, progress.correctAnswers, questionTopicMap)
  })).sort((a, b) => b.mastery - a.mastery);

  return (
    <div className="max-w-6xl mx-auto space-y-8 py-4">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <p className="text-label-xs text-primary font-bold tracking-wider mb-1">Your Growth</p>
          <h1 className="text-headline-2xl md:text-headline-3xl font-bold text-on-surface tracking-tight">
            User Progress
          </h1>
        </div>
        <div className="flex items-center gap-3 px-4 py-2.5 rounded-xl bg-surface-container border border-outline-variant">
          <div className="w-8 h-8 rounded-lg bg-primary-container flex items-center justify-center">
            <Zap className="w-4 h-4 text-primary" />
          </div>
          <div>
            <div className="text-sm font-bold text-on-surface leading-none">{progress.xp} XP</div>
            <p className="text-label-xs text-on-surface-variant font-medium mt-0.5">Total Points</p>
          </div>
        </div>
      </div>

      {/* Level Progress Card */}
      <div className="card p-6 sm:p-8 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-72 h-72 bg-primary-container/30 blur-[100px] -mr-36 -mt-36 pointer-events-none" />
        <div className="relative z-10 space-y-6">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <h2 className="text-headline-xl-mobile font-bold text-on-surface">Current Rank: {levelInfo.title} (Lvl {levelInfo.level})</h2>
              <p className="text-label-sm text-on-surface-variant mt-1">Next Rank: Tier {Math.ceil((levelInfo.level + 1) / 5)} (Requires {levelInfo.nextLevelXP} XP)</p>
            </div>
            <div className="text-headline-2xl md:text-headline-3xl font-bold text-gradient tracking-tight">
              {levelInfo.progress}%
            </div>
          </div>
          <div className="progress-bar h-3 p-0.5">
            <div
              className="progress-bar-fill h-full"
              style={{ width: `${levelInfo.progress}%` }}
            />
          </div>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        {[
          { icon: <Flame className="w-4 h-4" />, label: "Day Streak", val: progress.streak, color: "text-secondary" },
          { icon: <Target className="w-4 h-4" />, label: "Global Accuracy", val: `${accuracy}%`, color: "text-primary" },
          { icon: <Shield className="w-4 h-4" />, label: "Status Level", val: levelInfo.title, color: "text-tertiary" }
        ].map((stat, i) => (
          <div key={i} className="card p-5 sm:p-6 flex flex-col justify-between min-h-[120px] sm:min-h-[140px] group hover:border-primary-fixed-dim transition-all">
            <div className={`w-9 h-9 rounded-xl bg-surface-container flex items-center justify-center ${stat.color} group-hover:scale-110 transition-transform`}>
              {stat.icon}
            </div>
            <div>
              <div className="text-headline-xl-mobile font-bold text-on-surface mb-0.5 leading-none truncate">{stat.val}</div>
              <p className="text-label-xs text-on-surface-variant font-medium leading-none">{stat.label}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Breakdown and Mastery */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 pt-2">
        {/* Preparation Breakdown */}
        <div className="space-y-6">
          <div>
            <p className="text-label-xs text-on-surface-variant font-bold tracking-wider">Preparation Breakdown</p>
            <div className="h-px w-16 bg-primary mt-2" />
          </div>
          <div className="space-y-8">
            <div className="space-y-3">
              <div className="flex justify-between items-end">
                <span className="text-label-sm font-bold text-on-surface tracking-wider">Questions Solved</span>
                <span className="text-sm font-bold text-primary">{Math.round((stats.answeredCount / (stats.totalQuestions || 1)) * 100)}%</span>
              </div>
              <div className="progress-bar">
                <div
                  className="progress-bar-fill"
                  style={{ width: `${(stats.answeredCount / (stats.totalQuestions || 1)) * 100}%` }}
                />
              </div>
            </div>
            <div className="space-y-3">
              <div className="flex justify-between items-end">
                <span className="text-label-sm font-bold text-on-surface tracking-wider">Concept Notes</span>
                <span className="text-sm font-bold text-secondary">{Math.round((stats.completedNotesCount / (stats.totalNotes || 1)) * 100)}%</span>
              </div>
              <div className="progress-bar">
                <div
                  className="h-full bg-secondary rounded-full transition-all duration-700"
                  style={{ width: `${(stats.completedNotesCount / (stats.totalNotes || 1)) * 100}%` }}
                />
              </div>
            </div>
          </div>
        </div>

        {/* Domain Mastery */}
        <div className="space-y-6">
          <div>
            <p className="text-label-xs text-on-surface-variant font-bold tracking-wider">Domain Mastery</p>
            <div className="h-px w-16 bg-primary mt-2" />
          </div>
          <div className="space-y-3 max-h-[400px] overflow-y-auto pr-2 custom-scrollbar">
            {topicMastery.length > 0 ? (
              topicMastery.map(({ name: topic, mastery: acc }) => {
                const TopicIcon =
                  topic.toLowerCase().includes('algorithm') ? Activity :
                    topic.toLowerCase().includes('database') || topic.toLowerCase().includes('data') ? Database :
                      topic.toLowerCase().includes('operating') || topic.toLowerCase().includes('system') ? Cpu :
                        topic.toLowerCase().includes('networking') ? Terminal :
                          topic.toLowerCase().includes('programming') ? Code2 : Settings;

                return (
                  <div key={topic} className="flex items-center gap-4 card p-4 hover:border-primary-fixed-dim transition-all">
                    <div className="w-10 h-10 rounded-xl bg-surface-container flex items-center justify-center text-primary">
                      <TopicIcon className="w-4 h-4" />
                    </div>
                    <div className="flex-1 space-y-2 text-left">
                      <div className="flex justify-between items-center">
                        <span className="text-label-xs text-on-surface-variant font-bold tracking-wider truncate mr-2">{topic}</span>
                        <span className="text-label-sm font-bold text-on-surface shrink-0">{acc}%</span>
                      </div>
                      <div className="progress-bar h-1.5">
                        <div
                          className="progress-bar-fill"
                          style={{ width: `${acc}%` }}
                        />
                      </div>
                    </div>
                  </div>
                );
              })
            ) : (
              <div className="flex items-center gap-4 card p-4 opacity-60">
                <div className="w-10 h-10 rounded-xl bg-surface-container flex items-center justify-center text-on-surface-variant">
                  <Hexagon className="w-4 h-4" />
                </div>
                <p className="text-label-xs text-on-surface-variant font-bold tracking-wider text-left">No topic data yet</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Footer */}
      <div className="pt-8 flex justify-center">
        <Link
          href="/questions"
          className="btn-primary inline-flex items-center gap-2"
        >
          Start Practicing
          <ChevronRight className="w-4 h-4" />
        </Link>
      </div>
    </div>
  );
}
