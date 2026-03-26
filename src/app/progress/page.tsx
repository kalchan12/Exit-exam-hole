'use client';

import { useState, useEffect } from 'react';
import { getProgress, type ProgressState } from '@/lib/progressManager';
import { getQuestions, getNotes, getBytes } from '@/lib/dataLoader';
import { getLevel, calculateTopicMastery, calculateOverallAccuracy } from '@/lib/gamification';
import {
  Trophy,
  Flame,
  Target,
  BookOpen,
  Cpu,
  Zap,
  TrendingUp,
  Award,
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

  const totalAnswered = stats.answeredCount;
  const accuracy = calculateOverallAccuracy(progress);
  const levelInfo = getLevel(progress.xp);

  // Calculate Topic Mastery on the fly for accuracy
  const questionTopicMap: Record<string, string> = {};
  stats.questions.forEach(q => { questionTopicMap[q.id] = q.topic; });

  const uniqueTopics = Array.from(new Set(stats.questions.map(q => q.topic)));
  const topicMastery = uniqueTopics.map(topic => ({
    name: topic,
    mastery: calculateTopicMastery(topic, progress.answeredQuestions, progress.correctAnswers, questionTopicMap)
  })).sort((a, b) => b.mastery - a.mastery);

  return (
    <div className="max-w-6xl mx-auto px-6 py-8 md:py-12 space-y-10 animate-in fade-in duration-700 pb-32">
      {/* Header Section */}
      <div className="flex items-start justify-between">
        <div className="space-y-1">
          <p className="text-[10px] font-black text-purple-500 uppercase tracking-[0.3em] mb-1">Your Growth</p>
          <h1 className="text-4xl md:text-5xl font-black text-white tracking-tighter leading-tight">
            User Progress
          </h1>
        </div>

        <div className="flex items-center gap-3 px-4 py-2 bg-white/[0.03] border border-white/10 rounded-2xl backdrop-blur-md">
          <div className="w-8 h-8 rounded-lg bg-purple-500/20 flex items-center justify-center">
            <Zap size={16} className="text-purple-400 fill-purple-400" />
          </div>
          <div>
            <div className="text-lg font-black text-white leading-none tracking-tight">{progress.xp} XP</div>
            <p className="text-[8px] text-gray-500 uppercase font-bold tracking-widest mt-0.5">Total Points</p>
          </div>
        </div>
      </div>

      {/* Main Progress Card */}
      <div className="bg-[#111226]/50 border border-white/5 rounded-[2.5rem] p-8 md:p-10 relative overflow-hidden group shadow-2xl">
        {/* Glow effect */}
        <div className="absolute top-0 right-0 w-80 h-80 bg-purple-600/10 blur-[100px] -mr-40 -mt-40 pointer-events-none group-hover:bg-purple-600/20 transition-all duration-700"></div>

        <div className="relative z-10 space-y-8">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="space-y-1">
              <h2 className="text-xl md:text-2xl font-black text-white uppercase tracking-tight">Current Rank: {levelInfo.title} (Lvl {levelInfo.level})</h2>
              <p className="text-gray-500 text-sm font-bold">Next Rank: Tier {Math.ceil((levelInfo.level + 1) / 5)} (Requires {levelInfo.nextLevelXP} XP)</p>
            </div>
            <div className="text-6xl md:text-7xl font-black text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-fuchsia-400 tracking-tighter opacity-90">
              {levelInfo.progress}%
            </div>
          </div>

          <div className="relative h-6 bg-white/[0.03] rounded-full overflow-hidden border border-white/5 backdrop-blur-sm p-1">
            <div
              className="h-full bg-gradient-to-r from-purple-600 via-fuchsia-500 to-purple-400 rounded-full transition-all duration-1000 shadow-[0_0_20px_rgba(168,85,247,0.4)]"
              style={{ width: `${levelInfo.progress}%` }}
            />
          </div>
        </div>
      </div>

      {/* Stats Cards Row */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {[
          { icon: <Flame size={18} />, label: "Day Streak", val: progress.streak, color: "orange", accent: "text-orange-500" },
          { icon: <Target size={18} />, label: "Global Accuracy", val: `${accuracy}%`, color: "blue", accent: "text-blue-500" },
          { icon: <Shield size={18} />, label: "Status Level", val: levelInfo.title, color: "rose", accent: "text-rose-500" }
        ].map((stat, i) => (
          <div key={i} className="bg-[#111226]/50 border border-white/5 rounded-3xl p-8 flex flex-col justify-between min-h-[160px] group hover:border-white/10 transition-all">
            <div className={`w-10 h-10 rounded-xl bg-white/5 flex items-center justify-center ${stat.accent} opacity-80 group-hover:scale-110 transition-transform`}>
              {stat.icon}
            </div>
            <div>
              <div className="text-3xl font-black text-white tracking-tighter mb-1 leading-none truncate">{stat.val}</div>
              <p className="text-[10px] text-gray-500 uppercase font-black tracking-widest leading-none">{stat.label}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Breakdown and Mastery Sections */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 pt-4">
        {/* Preparation Breakdown */}
        <div className="space-y-8">
          <div className="space-y-1">
            <p className="text-[10px] font-black text-gray-500 uppercase tracking-widest">Preparation Breakdown</p>
            <div className="h-px w-20 bg-purple-500/30"></div>
          </div>

          <div className="space-y-10">
            {/* Questions Solved */}
            <div className="space-y-3">
              <div className="flex justify-between items-end">
                <span className="text-sm font-black text-gray-300 uppercase tracking-wider">Questions Solved</span>
                <span className="text-lg font-black text-purple-400 tracking-tighter uppercase">{Math.round((stats.answeredCount / (stats.totalQuestions || 1)) * 100)}%</span>
              </div>
              <div className="h-2 bg-white/5 rounded-full overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-purple-600 to-fuchsia-500 rounded-full"
                  style={{ width: `${(stats.answeredCount / (stats.totalQuestions || 1)) * 100}%` }}
                />
              </div>
            </div>

            {/* Concept Notes */}
            <div className="space-y-3">
              <div className="flex justify-between items-end">
                <span className="text-sm font-black text-gray-300 uppercase tracking-wider">Concept Notes</span>
                <span className="text-lg font-black text-fuchsia-400 tracking-tighter uppercase">{Math.round((stats.completedNotesCount / (stats.totalNotes || 1)) * 100)}%</span>
              </div>
              <div className="h-2 bg-white/5 rounded-full overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-fuchsia-600 to-rose-500 rounded-full"
                  style={{ width: `${(stats.completedNotesCount / (stats.totalNotes || 1)) * 100}%` }}
                />
              </div>
            </div>
          </div>
        </div>

        {/* Domain Mastery */}
        <div className="space-y-8">
          <div className="space-y-1">
            <p className="text-[10px] font-black text-gray-500 uppercase tracking-widest">Domain Mastery</p>
            <div className="h-px w-20 bg-fuchsia-500/30"></div>
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
                  <div key={topic} className="flex items-center gap-4 bg-[#111226]/50 border border-white/5 p-4 rounded-2xl group hover:bg-white/[0.03] transition-all">
                    <div className="w-10 h-10 rounded-xl bg-white/5 flex items-center justify-center text-purple-400/60 group-hover:text-purple-400 transition-colors">
                      <TopicIcon size={18} />
                    </div>
                    <div className="flex-1 space-y-2 text-left">
                      <div className="flex justify-between items-center">
                        <span className="text-[10px] font-black text-gray-400 uppercase tracking-wider truncate mr-2">{topic}</span>
                        <span className="text-sm font-black text-white tracking-tighter shrink-0">{acc}%</span>
                      </div>
                      <div className="h-1.5 bg-white/5 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-gradient-to-r from-purple-600 to-fuchsia-500 rounded-full transition-all duration-700"
                          style={{ width: `${acc}%` }}
                        />
                      </div>
                    </div>
                  </div>
                );
              })
            ) : (
              <div className="flex items-center gap-4 bg-[#111226]/50 border border-white/5 p-4 rounded-2xl opacity-50 grayscale italic">
                <div className="w-10 h-10 rounded-xl bg-white/5 flex items-center justify-center text-gray-500">
                  <Hexagon size={18} />
                </div>
                <p className="text-[10px] text-gray-500 font-bold uppercase tracking-widest text-left">No topic data yet</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Simplified Footer */}
      <div className="pt-12 flex justify-center">
        <Link
          href="/questions"
          className="group relative px-8 py-4 bg-white text-black font-black uppercase text-xs tracking-[0.2em] rounded-2xl hover:scale-105 active:scale-95 transition-all flex items-center gap-3 overflow-hidden"
        >
          <div className="absolute inset-0 bg-gradient-to-r from-purple-400 to-fuchsia-400 opacity-0 group-hover:opacity-10 transition-opacity"></div>
          Start Practicing
          <ChevronRight size={16} />
        </Link>
      </div>
    </div>
  );
}
