'use client';

import { useState, useEffect } from 'react';
import { getProgress, type ProgressState } from '@/lib/progressManager';
import { getQuestions, getNotes, getBytes } from '@/lib/dataLoader';

export default function ProgressPage() {
  const [progress, setProgress] = useState<ProgressState | null>(null);
  const [stats, setStats] = useState({
    totalQuestions: 0,
    totalNotes: 0,
    totalBytes: 0,
    answeredCount: 0,
    completedNotesCount: 0,
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
      });
    });
  }, []);

  if (!mounted || !progress) return null;

  const accuracy = stats.answeredCount > 0 
    ? Math.round((Object.values(progress.correctAnswers).filter(Boolean).length / stats.answeredCount) * 100) 
    : 0;

  return (
    <div className="max-w-4xl mx-auto space-y-8 animate-in pb-20">
      <div className="flex items-end justify-between border-b border-white/5 pb-6">
        <div>
          <h1 className="text-4xl font-black text-white uppercase italic tracking-tighter">Your Progress</h1>
          <p className="text-gray-500 text-sm mt-1 uppercase font-bold tracking-widest">Performance & Analytics</p>
        </div>
        <div className="text-right">
          <div className="text-5xl font-black text-accent-purple tracking-tighter italic">{progress.xp}</div>
          <div className="text-[10px] text-gray-500 uppercase font-bold tracking-[0.3em]">Total Experience</div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="glass-card p-6 flex flex-col items-center justify-center text-center">
            <div className="text-4xl mb-2">🔥</div>
            <div className="text-2xl font-black text-white">{progress.streak}</div>
            <div className="text-[10px] text-gray-500 uppercase font-bold tracking-widest">Day Streak</div>
        </div>
        <div className="glass-card p-6 flex flex-col items-center justify-center text-center">
            <div className="text-4xl mb-2">🎯</div>
            <div className="text-2xl font-black text-white">{accuracy}%</div>
            <div className="text-[10px] text-gray-500 uppercase font-bold tracking-widest">Global Accuracy</div>
        </div>
        <div className="glass-card p-6 flex flex-col items-center justify-center text-center border-accent-purple/20">
            <div className="text-4xl mb-2">🏆</div>
            <div className="text-2xl font-black text-white">Lvl {Math.floor(progress.xp / 100) + 1}</div>
            <div className="text-[10px] text-gray-500 uppercase font-bold tracking-widest">Current Rank</div>
        </div>
      </div>

      <div className="space-y-4">
        <h2 className="text-lg font-black text-white uppercase tracking-widest flex items-center gap-2">
            <span className="w-8 h-[2px] bg-accent-purple"></span>
            Breakdown
        </h2>
        
        <div className="grid gap-4">
            <div className="glass-card p-6 flex items-center justify-between">
                <div>
                    <h3 className="font-bold text-white uppercase text-sm">Questions Solved</h3>
                    <p className="text-xs text-gray-500">{stats.answeredCount} of {stats.totalQuestions} items</p>
                </div>
                <div className="text-right">
                    <div className="text-xl font-black text-white italic">{Math.round((stats.answeredCount / stats.totalQuestions) * 100)}%</div>
                </div>
            </div>

            <div className="glass-card p-6 flex items-center justify-between">
                <div>
                    <h3 className="font-bold text-white uppercase text-sm">Study Content</h3>
                    <p className="text-xs text-gray-500">{stats.completedNotesCount} of {stats.totalNotes} notes read</p>
                </div>
                <div className="text-right">
                    <div className="text-xl font-black text-white italic">{Math.round((stats.completedNotesCount / stats.totalNotes) * 100)}%</div>
                </div>
            </div>
        </div>
      </div>

      <div className="space-y-4">
          <h2 className="text-lg font-black text-white uppercase tracking-widest flex items-center gap-2">
              <span className="w-8 h-[2px] bg-accent-purple"></span>
              Topic Mastery
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {Object.entries(progress.accuracyByTopic).map(([topic, acc]) => (
                <div key={topic} className="glass-card p-4">
                    <div className="flex justify-between items-center mb-2">
                        <span className="text-xs font-bold text-gray-300 uppercase">{topic}</span>
                        <span className="text-xs font-black text-accent-purple">{acc}%</span>
                    </div>
                    <div className="h-1.5 bg-white/5 rounded-full overflow-hidden">
                        <div 
                            className="h-full bg-gradient-to-r from-accent-purple to-fuchsia-500 transition-all duration-1000"
                            style={{ width: `${acc}%` }}
                        />
                    </div>
                </div>
            ))}
          </div>
      </div>
    </div>
  );
}
