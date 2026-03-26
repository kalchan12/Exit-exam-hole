'use client';

import { useState, useEffect, useMemo, useCallback, Suspense } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { getQuestions, getTopics, type Question } from '@/lib/dataLoader';
import { getProgress, recordAnswer, syncProgressToRemote } from '@/lib/progressManager';
import { updateTopicAccuracy } from '@/lib/gamification';
import { useAuth } from '@/components/AuthProvider';
import { fetchGitHubQuestions } from '@/lib/githubFetcher';

const topicMeta: Record<string, { icon: string; gradient: string; border: string }> = {
  'Algorithms': { icon: '⚡', gradient: 'from-purple-500/20 to-indigo-500/20', border: 'border-purple-500/30' },
  'Operating Systems': { icon: '🖥️', gradient: 'from-cyan-500/20 to-blue-500/20', border: 'border-cyan-500/30' },
  'Database Systems': { icon: '🗄️', gradient: 'from-emerald-500/20 to-teal-500/20', border: 'border-emerald-500/30' },
  'Networking': { icon: '🌐', gradient: 'from-orange-500/20 to-amber-500/20', border: 'border-orange-500/30' },
  'Software Engineering': { icon: '🛠️', gradient: 'from-rose-500/20 to-pink-500/20', border: 'border-rose-500/30' },
  'Data Structures': { icon: '🧱', gradient: 'from-violet-500/20 to-purple-500/20', border: 'border-violet-500/30' },
  'Computer Architecture': { icon: '🔧', gradient: 'from-sky-500/20 to-blue-500/20', border: 'border-sky-500/30' },
};
const defaultMeta = { icon: '📝', gradient: 'from-indigo-500/20 to-slate-500/20', border: 'border-indigo-500/30' };

function ExamContent() {
  const searchParams = useSearchParams();
  const initialTopic = searchParams.get('topic') || null;
  const { user } = useAuth();

  const [questions, setQuestions] = useState<Question[]>([]);
  const [topics, setTopics] = useState<string[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(initialTopic);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [mounted, setMounted] = useState(false);
  const [progressState, setProgressState] = useState(() => getProgress());
  const [isFinished, setIsFinished] = useState(false);
  const [isReviewMode, setIsReviewMode] = useState(false);
  const [userAnswers, setUserAnswers] = useState<Record<string, string>>({});
  const [majorFilter, setMajorFilter] = useState('all');
  const [quizScore, setQuizScore] = useState({ correct: 0, total: 0 });

  useEffect(() => {
    setMounted(true);
    getQuestions().then(allQs => {
      // ONLY include past exams and model exams
      const examQs = allQs.filter(q => 
        q.source === 'past_exam' || 
        q.source === 'Archived Exams' || 
        q.source === 'model_exam' || 
        q.source === 'Model Exit Exam'
      );
      setQuestions(examQs);
      
      // Group by source (Exam Title) instead of topic
      const sourceSet = new Set(examQs.map(q => q.source));
      setTopics(Array.from(sourceSet).sort());
    });
  }, []);

  const filteredQuestions = useMemo(() => {
    let filtered = questions;
    if (selectedCategory && selectedCategory !== 'all') {
      // Filter by source (Exam Title)
      filtered = filtered.filter((q) => q.source === selectedCategory);
    }
    if (majorFilter !== 'all') {
      filtered = filtered.filter((q) => q.major === majorFilter || q.major === 'Both');
    }
    return filtered;
  }, [questions, selectedCategory, majorFilter]);

  const currentQuestion = filteredQuestions[currentIndex];

  // Auto-expand GitHub stubs
  useEffect(() => {
    if (currentQuestion && !currentQuestion.options?.length && currentQuestion.githubUrl) {
      fetchGitHubQuestions(currentQuestion.githubUrl, currentQuestion.topic)
        .then(allQs => {
           // Find the specific question by text match
           const matching = allQs.find(q => q.question === currentQuestion.question);
           if (matching) {
              setQuestions(prev => prev.map(q => q.id === currentQuestion.id ? { ...q, ...matching } : q));
           }
        })
        .catch(err => console.error('Failed to auto-expand GH question:', err));
    }
  }, [currentQuestion]);

  const handleSelectAnswer = useCallback(
    (answer: string) => {
      if (isReviewMode || !currentQuestion) return;
      
      const isCorrect = answer === currentQuestion.answer;
      setUserAnswers(prev => ({ ...prev, [currentQuestion.id]: answer }));
      
      // We don't show explanation yet, but we record progress for the system
      const newState = recordAnswer(currentQuestion.id, isCorrect, currentQuestion.topic);
      updateTopicAccuracy(currentQuestion.topic, isCorrect);
      setProgressState(newState);
      if (user) syncProgressToRemote(user.id);
    },
    [currentQuestion, user, isReviewMode]
  );

  const handleFinish = () => {
    let correct = 0;
    filteredQuestions.forEach(q => {
      if (userAnswers[q.id] === q.answer) correct++;
    });
    setQuizScore({ correct, total: filteredQuestions.length });
    setIsFinished(true);
  };

  const handleNext = useCallback(() => {
    if (currentIndex < filteredQuestions.length - 1) {
      setCurrentIndex((prev) => prev + 1);
    }
  }, [currentIndex, filteredQuestions.length]);

  const handlePrevious = useCallback(() => {
    if (currentIndex > 0) {
      setCurrentIndex((prev) => prev - 1);
    }
  }, [currentIndex]);

  const resetExam = () => {
    setCurrentIndex(0);
    setUserAnswers({});
    setIsFinished(false);
    setIsReviewMode(false);
    setQuizScore({ correct: 0, total: 0 });
  };

  const getHumorMessage = (percentage: number) => {
    if (percentage === 100) return "Final Boss of nerds.";
    if (percentage > 90) return "you are a nerd.";
    if (percentage > 80) return "You are smart.";
    if (percentage > 70) return "not bad.";
    if (percentage === 67) return "6 7 genz memes.";
    if (percentage >= 60) return "mid.";
    if (percentage > 50) return "almost human?";
    if (percentage === 50) return "You almost died but god had mercy for you at last minute.";
    if (percentage >= 30) return "you are cooked.";
    if (percentage >= 20) return "you are dumb as fuck.";
    return "go see a doctor.";
  };

  const progress = progressState;

  if (!mounted) return null;

  if (!selectedCategory) {
    return (
      <div className="space-y-12 animate-in py-4">
        <Link 
          href="/dashboard"
          className="text-[10px] font-black uppercase tracking-[0.2em] text-gray-500 hover:text-white transition-colors flex items-center gap-2"
        >
          <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
          </svg>
          Return to Dashboard
        </Link>

        {/* Header with Stats */}
        <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-8">
          <div className="max-w-2xl">
            <h1 className="text-4xl sm:text-5xl font-black text-white tracking-tighter mb-4 italic uppercase">
              Exit <span className="text-accent-purple">Exam</span>
            </h1>
            <p className="text-gray-400 text-sm leading-relaxed font-medium">
              Simulate high-stakes exit exams with authentic past-year questions, precisely timed to build your competitive edge.
            </p>
          </div>

          <div className="flex flex-wrap gap-3">
             <div className="flex items-center gap-2 bg-white/5 border border-white/10 rounded-full px-4 py-2 backdrop-blur-md">
              <span className="text-accent-purple-light text-xs">⚡</span>
              <span className="text-white font-black text-xs italic">{progress.xp.toLocaleString()} XP</span>
            </div>
            <div className="flex items-center gap-2 bg-white/5 border border-white/10 rounded-full px-4 py-2 backdrop-blur-md">
              <span className="text-neon-green text-xs">🔥</span>
              <span className="text-white font-black text-xs italic">{progress.streak} Day Streak</span>
            </div>
            <div className="flex items-center gap-2 bg-white/5 border border-white/10 rounded-full px-4 py-2 backdrop-blur-md">
              <span className="text-accent-purple text-xs">📜</span>
              <span className="text-white font-black text-xs italic">{questions.length} Exam Qs</span>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">

          {topics
            .filter(topic => topic !== 'past_exam') // Explicitly exclude past_exam placeholder
            .map((topic) => {
            const is2017 = topic === 'Exit Exam 2017' || topic === 'Archived Exams';
            const displayTitle = is2017 ? 'Exit Exam 2017' : topic;
            const displayDesc = is2017 
              ? 'This is the real exit exam simulation and it was taken by those 2017 batches as well.'
              : 'Official certification and exit exam questions provided for academic preparation.';
            
            const meta = topicMeta[displayTitle] || defaultMeta;
            const count = questions.filter(q => q.source === topic).length;
            return (
              <button
                key={topic}
                onClick={() => setSelectedCategory(topic)}
                className="group relative flex flex-col items-start rounded-3xl bg-[#11152a]/50 border border-white/5 p-8 text-left transition-all duration-500 hover:bg-[#11152a] hover:border-accent-purple/30 hover:-translate-y-1 hover:shadow-2xl hover:shadow-accent-purple/10"
              >
                <div className="w-12 h-12 rounded-2xl bg-white/5 flex items-center justify-center text-2xl mb-8 group-hover:bg-accent-purple/10 group-hover:scale-110 transition-all duration-500">
                  {is2017 ? '🎓' : meta.icon}
                </div>
                <h3 className="text-xl font-black text-white italic uppercase tracking-tighter mb-2 group-hover:text-white/90 transition-colors h-14 flex items-center">
                  {displayTitle.split(' ').map((word, i) => <span key={i} className="block">{word}{i === 0 && displayTitle.includes(' ') ? <br /> : ''}</span>)}
                </h3>
                <p className="text-xs text-gray-500 leading-relaxed mb-8 h-12 line-clamp-3">
                   {displayDesc}
                </p>
                <div className="mt-auto px-4 py-2 bg-white/5 border border-white/10 rounded-xl text-[10px] font-black uppercase tracking-widest text-gray-400 group-hover:text-white transition-colors">
                  {count} Questions
                </div>
              </button>
            );
          })}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-in">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <button onClick={() => setSelectedCategory(null)} className="btn-secondary py-2 text-xs">
            ← Exit Exam
          </button>
          <div>
            <h1 className="text-xl font-bold text-white uppercase italic">{selectedCategory === 'all' ? 'Full Mock' : selectedCategory}</h1>
            <p className="text-gray-500 text-[10px] uppercase font-bold tracking-widest mt-0.5">Exit Exam</p>
          </div>
        </div>
        <div className="flex items-center gap-4">
          {isReviewMode && (
            <span className="badge bg-accent-purple/20 text-accent-purple border border-accent-purple/30 text-[10px] uppercase font-bold">Reviewing</span>
          )}
          <div className="flex items-center gap-4">
          <select 
            value={majorFilter} 
            onChange={(e) => setMajorFilter(e.target.value)}
            className="bg-dark-600 border border-dark-400/50 rounded-lg px-3 py-1.5 text-xs text-white focus:border-accent-purple focus:outline-none"
          >
            <option value="all">Any Major</option>
            <option value="CSE">CSE Only</option>
            <option value="Software">Software Only</option>
          </select>
          <div className="flex items-center gap-2 bg-indigo-500/10 border border-indigo-500/20 rounded-full px-4 py-1.5">
            <span className="text-indigo-400 font-black text-sm">{currentIndex + 1} / {filteredQuestions.length}</span>
          </div>
        </div>
        </div>
      </div>

      {currentQuestion && !isFinished ? (
        <div className="glass-card p-6 sm:p-10 border-indigo-500/20">
          <div className="flex items-center gap-2 mb-8">
             <span className="badge bg-indigo-500/20 text-indigo-400 border border-indigo-500/30 text-[10px] uppercase tracking-tighter">
              {currentQuestion.source}
            </span>
            {currentQuestion.year && (
              <span className="badge bg-indigo-500/20 text-indigo-400 border border-indigo-500/30 text-[10px] sm:text-xs">
                🗓️ {currentQuestion.year}
              </span>
            )}
            <span className="badge bg-dark-500 text-gray-400 text-[10px] uppercase">
              {currentQuestion.difficulty}
            </span>
            {isReviewMode && userAnswers[currentQuestion.id] === currentQuestion.answer && (
              <span className="badge bg-green-500/20 text-green-400 border border-green-500/30 text-[10px] uppercase">Correct</span>
            )}
            {isReviewMode && userAnswers[currentQuestion.id] && userAnswers[currentQuestion.id] !== currentQuestion.answer && (
              <span className="badge bg-red-500/20 text-red-400 border border-red-500/30 text-[10px] uppercase">Incorrect</span>
            )}
          </div>


          <div className="text-2xl font-bold text-white leading-snug mb-10 prose prose-invert max-w-none prose-headings:text-white prose-p:text-white prose-strong:text-accent-purple-light prose-code:text-accent-cyan prose-pre:bg-dark-900/50 prose-pre:border prose-pre:border-white/10">
            <ReactMarkdown remarkPlugins={[remarkGfm]}>
              {currentQuestion.question}
            </ReactMarkdown>
          </div>

          <div className="grid gap-4 mb-10">
            {currentQuestion.options.map((option, idx) => {
              const isSelected = userAnswers[currentQuestion.id] === option;
              const isCorrect = option === currentQuestion.answer;
              const isAnswered = !!userAnswers[currentQuestion.id];

              let style = "p-5 rounded-2xl border-2 transition-all text-left relative overflow-hidden ";
              
              if (isReviewMode) {
                if (isCorrect) {
                  style += "border-green-500/50 bg-green-500/10 text-green-400";
                } else if (isSelected) {
                  style += "border-red-500/50 bg-red-500/10 text-red-400";
                } else {
                  style += "border-white/5 bg-white/5 opacity-50";
                }
              } else {
                if (isSelected) {
                  style += "border-indigo-500 bg-indigo-500/20 text-white shadow-[0_0_15px_rgba(99,102,241,0.3)]";
                } else {
                  style += "border-white/5 bg-white/5 hover:bg-white/10 hover:border-white/20";
                }
              }

              return (
                <button key={idx} onClick={() => handleSelectAnswer(option)} disabled={isReviewMode} className={style}>
                  <div className="flex items-center gap-4">
                    <span className={`w-8 h-8 rounded-lg flex items-center justify-center font-black ${isSelected && !isReviewMode ? 'bg-indigo-500 text-white' : 'bg-white/10'}`}>
                      {String.fromCharCode(65 + idx)}
                    </span>
                    <span className="font-medium text-lg">
                      {option.replace(/^[A-Z]\)\s?/, '')}
                    </span>
                    {isReviewMode && isCorrect && (
                      <svg className="w-5 h-5 text-green-400 ml-auto" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41L9 16.17z" />
                      </svg>
                    )}
                    {isReviewMode && isSelected && !isCorrect && (
                      <svg className="w-5 h-5 text-red-400 ml-auto" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12 19 6.41z" />
                      </svg>
                    )}
                  </div>
                </button>
              );
            })}
          </div>

          {isReviewMode && (
            <div className="p-6 rounded-2xl bg-indigo-500/5 border border-indigo-500/20 mb-8 animate-in slide-in-from-bottom-2">
              <span className="text-xs font-bold text-indigo-400 uppercase tracking-widest block mb-2">Detailed Analysis</span>
              <div className="prose prose-invert prose-sm max-w-none text-gray-300 leading-relaxed prose-pre:bg-dark-900/50 prose-pre:border prose-pre:border-white/10">
                <ReactMarkdown remarkPlugins={[remarkGfm]}>
                  {currentQuestion.explanation}
                </ReactMarkdown>
              </div>
            </div>
          )}

          <div className="flex items-center justify-between pt-6 border-t border-white/5">
            <button onClick={handlePrevious} disabled={currentIndex === 0} className="text-gray-500 hover:text-white disabled:opacity-0 transition-all font-bold text-sm uppercase">Previous</button>
            {currentIndex === filteredQuestions.length - 1 && !isReviewMode ? (
              <button 
                onClick={handleFinish}
                disabled={!userAnswers[currentQuestion.id]}
                className="btn-primary px-10 py-3 bg-green-600 hover:bg-green-500 text-sm italic font-black uppercase tracking-widest shadow-[0_0_20px_rgba(22,163,74,0.3)]"
              >
                Finish Exam
              </button>
            ) : (
              <button onClick={handleNext} disabled={currentIndex >= filteredQuestions.length - 1} className="btn-primary px-10 py-3 bg-indigo-600 hover:bg-indigo-500 text-sm italic font-black uppercase tracking-widest">Next Question</button>
            )}
          </div>
        </div>
      ) : isFinished ? (
        <div className="glass-card p-12 text-center space-y-8 animate-in zoom-in-95 border-indigo-500/30">
          <div className="space-y-2">
            <div className="text-6xl mb-4">
              {Math.round((quizScore.correct / quizScore.total) * 100) >= 80 ? '🎖️' : Math.round((quizScore.correct / quizScore.total) * 100) >= 50 ? '📄' : '💀'}
            </div>
            <h2 className="text-3xl font-black text-white italic tracking-tighter uppercase">
              Exam <span className="text-accent-purple">Results</span>
            </h2>
            <p className="text-gray-400 font-medium">
              You&apos;ve completed the {selectedCategory === 'all' ? 'Full Mock' : selectedCategory} simulation.
            </p>
          </div>

          <div className="grid grid-cols-2 gap-4 max-w-sm mx-auto">
            <div className="p-6 rounded-2xl bg-white/5 border border-white/10">
              <div className="text-3xl font-black text-white italic">{Math.round((quizScore.correct / quizScore.total) * 100)}%</div>
              <div className="text-[10px] text-gray-500 font-black uppercase tracking-widest mt-1">Score</div>
            </div>
            <div className="p-6 rounded-2xl bg-white/5 border border-white/10">
              <div className="text-3xl font-black text-accent-purple italic">{quizScore.correct}/{quizScore.total}</div>
              <div className="text-[10px] text-gray-500 font-black uppercase tracking-widest mt-1">Answered</div>
            </div>
          </div>

          <div className="p-6 rounded-3xl bg-indigo-500/10 border border-indigo-500/20 max-w-xl mx-auto">
            <p className="text-xl font-bold text-white italic">
              &quot;{getHumorMessage(Math.round((quizScore.correct / quizScore.total) * 100))}&quot;
            </p>
          </div>

          <div className="max-w-xl mx-auto text-left space-y-6">
            <h3 className="text-sm font-black text-gray-500 uppercase tracking-[0.2em] flex items-center gap-2">
              <span>📊</span> Exam Breakdown
            </h3>
            <div className="space-y-4">
              {Array.from(new Set(filteredQuestions.map(q => q.topic))).map(topic => {
                const topicQs = filteredQuestions.filter(q => q.topic === topic);
                const correctCount = topicQs.filter(q => userAnswers[q.id] === q.answer).length;
                const percent = Math.round((correctCount / topicQs.length) * 100);
                
                return (
                  <div key={topic} className="p-4 rounded-2xl bg-white/5 border border-white/10 group hover:border-indigo-500/30 transition-all">
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-lg bg-dark-500 flex items-center justify-center text-sm">
                          {topicMeta[topic]?.icon || '📝'}
                        </div>
                        <span className="text-sm font-bold text-white italic uppercase tracking-tighter">{topic}</span>
                      </div>
                      <span className={`text-xs font-black ${percent >= 70 ? 'text-green-400' : percent >= 50 ? 'text-yellow-400' : 'text-red-400'}`}>
                        {percent}%
                      </span>
                    </div>
                    <div className="flex items-center gap-2 mb-2">
                      <div className="flex-1 h-1.5 bg-dark-600 rounded-full overflow-hidden">
                        <div 
                          className={`h-full transition-all duration-1000 ${percent >= 70 ? 'bg-green-500' : percent >= 50 ? 'bg-yellow-500' : 'bg-red-500'}`}
                          style={{ width: `${percent}%` }}
                        />
                      </div>
                      <span className="text-[10px] font-black text-gray-500 uppercase">{correctCount}/{topicQs.length}</span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <button 
              onClick={() => { setIsFinished(false); setIsReviewMode(true); setCurrentIndex(0); }}
              className="btn-primary px-10 py-3 rounded-xl font-black uppercase italic tracking-widest text-sm bg-indigo-600 hover:bg-indigo-500"
            >
              Review Answers
            </button>
            <button 
              onClick={resetExam}
              className="px-10 py-3 rounded-xl border border-white/10 bg-white/5 hover:bg-white/10 text-white font-black uppercase italic tracking-widest text-sm transition-all"
            >
              Restart Exam
            </button>
            <button 
              onClick={() => setSelectedCategory(null)}
              className="px-10 py-3 rounded-xl border border-white/10 bg-white/5 hover:bg-white/10 text-gray-400 font-black uppercase italic tracking-widest text-sm transition-all"
            >
              Exit
            </button>
          </div>
        </div>
      ) : (
        <div className="glass-card p-20 text-center">
          <p className="text-gray-400">No exam questions found for this topic.</p>
        </div>
      )}
    </div>
  );
}

export default function ExamPage() {
  return (
    <Suspense fallback={<div className="p-10 text-center text-gray-500">Loading Exam...</div>}>
      <ExamContent />
    </Suspense>
  );
}
