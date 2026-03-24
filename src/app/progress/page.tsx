'use client';

import { useState, useEffect } from 'react';
import { getProgress, type ProgressState } from '@/lib/progressManager';
import { getQuestions, getNotes, getBytes } from '@/lib/dataLoader';
import { 
  Trophy, 
  Flame, 
  Target, 
  BookOpen, 
  Cpu, 
  Zap,
  TrendingUp,
  Award,
  ChevronRight
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

  const level = Math.floor(progress.xp / 100) + 1;
  const xpInLevel = progress.xp % 100;

  return (
    <div className="max-w-5xl mx-auto px-6 py-12 space-y-12 animate-in fade-in duration-700 pb-32">
      {/* Header Section */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div className="space-y-2">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-purple-500/10 border border-purple-500/20 text-purple-400 text-[10px] font-black uppercase tracking-widest">
            <TrendingUp size={12} />
            Academic Analytics
          </div>
          <h1 className="text-5xl md:text-6xl font-black text-white tracking-tighter uppercase italic leading-none">
            Scholar <span className="text-purple-500">Progress</span>
          </h1>
          <p className="text-gray-500 font-medium text-lg max-w-md">
            Real-time breakdown of your preparation journey and topic mastery.
          </p>
        </div>
        
        <div className="bg-white/[0.03] border border-white/10 rounded-3xl p-6 flex items-center gap-6 backdrop-blur-xl shadow-2xl">
          <div className="text-right">
            <p className="text-[10px] text-gray-500 uppercase font-black tracking-widest mb-1">Lifetime Experience</p>
            <div className="text-4xl font-black text-white tracking-tighter leading-none">{progress.xp.toLocaleString()} <span className="text-purple-500 text-xl italic uppercase font-black">XP</span></div>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-purple-gradient-diagonal flex items-center justify-center shadow-lg shadow-purple-500/20">
             <Zap size={24} className="text-white fill-white" />
          </div>
        </div>
      </div>

      {/* Level Card */}
      <div className="relative overflow-hidden bg-white/[0.02] border border-white/5 rounded-[2.5rem] p-8 md:p-10 group">
        <div className="absolute top-0 right-0 w-96 h-96 bg-purple-600/10 blur-[120px] -mr-48 -mt-48 pointer-events-none group-hover:bg-purple-600/20 transition-all duration-700"></div>
        
        <div className="relative z-10 flex flex-col md:flex-row items-center gap-10">
          <div className="w-32 h-32 rounded-[2rem] bg-gradient-to-br from-purple-600 to-fuchsia-600 flex items-center justify-center text-4xl font-black text-white shadow-2xl ring-8 ring-[#0A0B1E]">
            {level}
          </div>
          
          <div className="flex-1 space-y-6 w-full">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-2xl font-black text-white uppercase italic tracking-tighter">Current Rank: Tier {Math.ceil(level / 5)}</h3>
                <p className="text-gray-500 font-bold uppercase text-[10px] tracking-widest">{100 - xpInLevel} XP until Level {level + 1}</p>
              </div>
              <div className="hidden md:block px-4 py-2 bg-white/5 border border-white/10 rounded-xl text-xs font-black text-purple-400 uppercase tracking-widest">
                Level UP Progress
              </div>
            </div>
            
            <div className="h-4 bg-white/5 rounded-full overflow-hidden p-1 ring-1 ring-white/10">
              <div 
                className="h-full bg-gradient-to-r from-purple-600 via-fuchsia-500 to-purple-400 rounded-full transition-all duration-1000 shadow-[0_0_20px_rgba(168,85,247,0.4)]"
                style={{ width: `${xpInLevel}%` }}
              />
            </div>
          </div>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        {[
          { icon: <Flame className="text-orange-500" />, label: "Day Streak", val: progress.streak, color: "orange" },
          { icon: <Target className="text-green-500" />, label: "Global Accuracy", val: `${accuracy}%`, color: "green" },
          { icon: <Award className="text-purple-500" />, label: "Exams Taken", val: Object.keys(progress.answeredQuestions).length > 20 ? "Master" : "Initiate", color: "purple" }
        ].map((stat, i) => (
          <div key={i} className="bg-white/[0.02] border border-white/5 hover:border-white/10 transition-all rounded-[2rem] p-8 flex flex-col items-center text-center group">
            <div className={`w-16 h-16 rounded-2xl bg-${stat.color}-500/10 flex items-center justify-center mb-6 ring-1 ring-${stat.color}-500/20 group-hover:scale-110 transition-transform`}>
              {stat.icon}
            </div>
            <div className="text-4xl font-black text-white tracking-tighter mb-1">{stat.val}</div>
            <div className="text-[10px] text-gray-500 uppercase font-black tracking-widest">{stat.label}</div>
          </div>
        ))}
      </div>

      {/* Main Breakdown Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
        {/* Progress Breakdown */}
        <div className="space-y-8">
          <div className="flex items-center gap-4">
             <div className="w-10 h-10 rounded-xl bg-purple-500/10 border border-purple-500/20 flex items-center justify-center">
                <Cpu size={18} className="text-purple-400" />
             </div>
             <h2 className="text-2xl font-black text-white uppercase italic tracking-tighter">Preparation Breakdown</h2>
          </div>

          <div className="grid gap-6">
            <div className="bg-white/[0.02] border border-white/5 rounded-3xl p-8 flex items-center justify-between group hover:bg-white/[0.04] transition-all">
               <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <BookOpen size={16} className="text-purple-400" />
                    <h4 className="text-sm font-black text-gray-300 uppercase tracking-wider">Questions Solved</h4>
                  </div>
                  <p className="text-2xl font-black text-white tracking-tighter italic">{stats.answeredCount} <span className="text-gray-500 text-xs not-italic">/ {stats.totalQuestions}</span></p>
               </div>
               <div className="text-right">
                  <div className="text-3xl font-black text-purple-400 tracking-tighter italic">{Math.round((stats.answeredCount / stats.totalQuestions) * 100)}%</div>
               </div>
            </div>

            <div className="bg-white/[0.02] border border-white/5 rounded-3xl p-8 flex items-center justify-between group hover:bg-white/[0.04] transition-all">
               <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <Trophy size={16} className="text-fuchsia-400" />
                    <h4 className="text-sm font-black text-gray-300 uppercase tracking-wider">Concept Notes</h4>
                  </div>
                  <p className="text-2xl font-black text-white tracking-tighter italic">{stats.completedNotesCount} <span className="text-gray-500 text-xs not-italic">/ {stats.totalNotes}</span></p>
               </div>
               <div className="text-right">
                  <div className="text-3xl font-black text-fuchsia-400 tracking-tighter italic">{Math.round((stats.completedNotesCount / stats.totalNotes) * 100)}%</div>
               </div>
            </div>
          </div>
        </div>

        {/* Topic Mastery */}
        <div className="space-y-8">
          <div className="flex items-center gap-4">
             <div className="w-10 h-10 rounded-xl bg-fuchsia-500/10 border border-fuchsia-500/20 flex items-center justify-center">
                <Target size={18} className="text-fuchsia-400" />
             </div>
             <h2 className="text-2xl font-black text-white uppercase italic tracking-tighter">Domain Mastery</h2>
          </div>

          <div className="bg-white/[0.02] border border-white/5 rounded-[2.5rem] p-8 space-y-8">
            {Object.entries(progress.accuracyByTopic).length > 0 ? (
              Object.entries(progress.accuracyByTopic).map(([topic, acc]) => (
                <div key={topic} className="space-y-3 group">
                    <div className="flex justify-between items-center">
                        <span className="text-xs font-black text-gray-400 uppercase tracking-widest group-hover:text-white transition-colors">{topic}</span>
                        <div className="flex items-center gap-2">
                           <span className="text-lg font-black text-white tracking-tighter">{acc}%</span>
                           <ChevronRight size={14} className="text-gray-700" />
                        </div>
                    </div>
                    <div className="h-2 bg-white/5 rounded-full overflow-hidden p-0.5">
                        <div 
                            className="h-full bg-gradient-to-r from-purple-600 to-fuchsia-500 rounded-full transition-all duration-1000"
                            style={{ width: `${acc}%` }}
                        />
                    </div>
                </div>
              ))
            ) : (
              <div className="py-12 text-center space-y-4">
                 <div className="w-16 h-16 rounded-full bg-white/5 border border-white/10 flex items-center justify-center mx-auto opacity-40">
                    <Target size={24} className="text-gray-500" />
                 </div>
                 <p className="text-gray-500 font-bold uppercase text-[10px] tracking-[0.2em]">Start solving questions to see topic breakdown</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Action Footer */}
      <div className="pt-12 border-t border-white/5">
        <div className="bg-gradient-to-r from-purple-900/20 to-transparent p-8 rounded-[3rem] border border-white/5 flex flex-col md:flex-row items-center justify-between gap-8">
          <div className="space-y-1 text-center md:text-left">
            <h3 className="text-2xl font-black text-white uppercase italic tracking-tighter leading-tight">Ready to boost your score?</h3>
            <p className="text-gray-500 text-sm font-medium">Daily practice is the key to mastering difficult concepts.</p>
          </div>
          <Link 
            href="/questions" 
            className="px-10 py-5 bg-white text-black font-black uppercase text-sm tracking-widest rounded-2xl hover:scale-105 active:scale-95 transition-all flex items-center gap-3 shadow-xl shadow-white/10"
          >
            Practice Now
            <Zap size={18} fill="black" />
          </Link>
        </div>
      </div>
    </div>
  );
}
