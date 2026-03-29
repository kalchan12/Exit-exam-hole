'use client';

import { useState, useEffect, useMemo, useCallback, Suspense } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { getQuestions, getTopics, type Question } from '@/lib/dataLoader';
import { getProgress, recordAnswer, saveProgress, syncProgressToRemote } from '@/lib/progressManager';
import { updateTopicAccuracy } from '@/lib/gamification';
import { useAuth } from '@/components/AuthProvider';

const topicMeta: Record<string, { icon: string; gradient: string; border: string }> = {
  'Algorithms': { icon: '⚡', gradient: 'from-purple-500/20 to-indigo-500/20', border: 'border-purple-500/30 hover:border-purple-400/60' },
  'Operating Systems': { icon: '🖥️', gradient: 'from-cyan-500/20 to-blue-500/20', border: 'border-cyan-500/30 hover:border-cyan-400/60' },
  'Database Systems': { icon: '🗄️', gradient: 'from-emerald-500/20 to-teal-500/20', border: 'border-emerald-500/30 hover:border-emerald-400/60' },
  'Networking': { icon: '🌐', gradient: 'from-orange-500/20 to-amber-500/20', border: 'border-orange-500/30 hover:border-orange-400/60' },
  'Software Engineering': { icon: '🛠️', gradient: 'from-rose-500/20 to-pink-500/20', border: 'border-rose-500/30 hover:border-rose-400/60' },
  'Data Structures': { icon: '🧱', gradient: 'from-violet-500/20 to-purple-500/20', border: 'border-violet-500/30 hover:border-violet-400/60' },
  'Computer Architecture': { icon: '🔧', gradient: 'from-sky-500/20 to-blue-500/20', border: 'border-sky-500/30 hover:border-sky-400/60' },
};

const topicSubtopics: Record<string, string> = {
  'Algorithms': 'Sorting, Searching, Dynamic Programming',
  'Operating Systems': 'Memory Management, Scheduling, IO',
  'Database Systems': 'Normalization, SQL, Transactions',
  'Networking': 'TCP/IP, HTTP, DNS, Security',
  'Software Engineering': 'SDLC, Agile, Testing, Design Patterns',
  'Data Structures': 'Arrays, Trees, Graphs, Hash Tables',
  'Computer Architecture': 'Instruction Sets, CPU, Memory Hierarchy',
};

const defaultMeta = { icon: '📚', gradient: 'from-gray-500/20 to-slate-500/20', border: 'border-gray-500/30 hover:border-gray-400/60' };

function QuestionsContent() {
  const searchParams = useSearchParams();
  const initialTopic = searchParams.get('topic') || null;
  const { user, profile } = useAuth();

  const [questions, setQuestions] = useState<Question[]>([]);
  const [topics, setTopics] = useState<string[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(initialTopic);
  const [difficultyFilter, setDifficultyFilter] = useState('all');
  const [sourceFilter, setSourceFilter] = useState('all');
  const [majorFilter, setMajorFilter] = useState('all');
  const [currentIndex, setCurrentIndex] = useState(0);
  const [selectedAnswer, setSelectedAnswer] = useState<string | null>(null);
  const [showExplanation, setShowExplanation] = useState(false);
  const [showHint, setShowHint] = useState(false);
  const [isRandomMode, setIsRandomMode] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [progressState, setProgressState] = useState(() => getProgress());
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);
  const [isFinished, setIsFinished] = useState(false);
  const [sessionAnswers, setSessionAnswers] = useState<Record<string, string>>({});
  const [quizScore, setQuizScore] = useState({ correct: 0, total: 0 });

  const loadQuestions = () => getQuestions().then(setQuestions);



  useEffect(() => {
    setMounted(true);
      getQuestions().then(allQs => {
        // EXCLUDE past exams/archived exams and model exams for general Practice
        const practiceQs = allQs.filter(q => 
          !q.source?.toLowerCase().includes('exam') && 
          q.source !== 'past_exam' && 
          q.source !== 'Archived Exams'
        );
        setQuestions(practiceQs);
      });
      getTopics().then(allTopics => {
        // Only show topics that have practice questions
        getQuestions().then(allQs => {
          const practiceQs = allQs.filter(q => 
            !q.source?.toLowerCase().includes('exam') && 
            q.source !== 'past_exam' && 
            q.source !== 'Archived Exams'
          );
        const practiceTopics = Array.from(new Set(practiceQs.map(q => q.topic))).sort();
        setTopics(practiceTopics);
      });
    });
  }, []);

  // Count questions per topic
  const topicCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    questions.forEach(q => {
      counts[q.topic] = (counts[q.topic] || 0) + 1;
    });
    return counts;
  }, [questions]);

  const filteredQuestions = useMemo(() => {
    let filtered = questions;
    if (selectedCategory && selectedCategory !== 'all') {
      filtered = filtered.filter((q) => q.topic === selectedCategory);
    }
    if (difficultyFilter !== 'all') {
      filtered = filtered.filter((q) => q.difficulty === difficultyFilter);
    }
    if (sourceFilter !== 'all') {
      filtered = filtered.filter((q) => q.source === sourceFilter);
    }
    if (isRandomMode) {
      filtered = [...filtered].sort(() => Math.random() - 0.5);
    }
    return filtered;
  }, [questions, selectedCategory, difficultyFilter, sourceFilter, isRandomMode]);

  const currentQuestion = filteredQuestions[currentIndex];



  const handleSelectAnswer = useCallback(
    (answer: string) => {
      if (selectedAnswer || !currentQuestion) return;
      setSelectedAnswer(answer);
      setShowExplanation(true);
      const isCorrect = answer === currentQuestion.answer;
      
      setSessionAnswers(prev => ({ ...prev, [currentQuestion.id]: answer }));
      if (isCorrect) setQuizScore(prev => ({ ...prev, correct: prev.correct + 1 }));
      setQuizScore(prev => ({ ...prev, total: prev.total + 1 }));
      
      const newState = recordAnswer(currentQuestion.id, isCorrect, currentQuestion.topic);
      updateTopicAccuracy(currentQuestion.topic, isCorrect);
      setProgressState(newState);
      if (user) syncProgressToRemote(user.id);
    },
    [selectedAnswer, currentQuestion, user]
  );

  const handleNext = useCallback(() => {
    if (currentIndex < filteredQuestions.length - 1) {
      setCurrentIndex((prev) => prev + 1);
      setSelectedAnswer(null);
      setShowExplanation(false);
      setShowHint(false);
    }
  }, [currentIndex, filteredQuestions.length]);

  const handlePrevious = useCallback(() => {
    if (currentIndex > 0) {
      setCurrentIndex((prev) => prev - 1);
      setSelectedAnswer(null);
      setShowExplanation(false);
      setShowHint(false);
    }
  }, [currentIndex]);

  const handleDeleteQuestion = useCallback(async (questionId: string) => {
    if (deleteConfirm === questionId) {
      const { deleteQuestionFromSupabase } = await import('@/lib/supabaseLoader');
      await deleteQuestionFromSupabase(questionId);
      setDeleteConfirm(null);
      loadQuestions().then(() => {
        if (currentIndex > 0) setCurrentIndex(prev => prev - 1);
        setSelectedAnswer(null);
        setShowExplanation(false);
        setShowHint(false);
      });
    } else {
      setDeleteConfirm(questionId);
      setTimeout(() => setDeleteConfirm(null), 3000);
    }
  }, [deleteConfirm, currentIndex]);

  const isCustomQuestion = (q: Question) => {
    const isAdmin = profile?.username === 'psycho';
    return isAdmin && (q.id.startsWith('custom_') || q.id.startsWith('bulk_') || q.source !== 'system');
  };

  const resetQuiz = useCallback(() => {
    setCurrentIndex(0);
    setSelectedAnswer(null);
    setShowExplanation(false);
    setShowHint(false);
    setIsFinished(false);
    setSessionAnswers({});
    setQuizScore({ correct: 0, total: 0 });
  }, []);

  const selectCategory = useCallback((cat: string) => {
    setSelectedCategory(cat);
    resetQuiz();
  }, [resetQuiz]);

  const difficultyColor = (d: string) => {
    switch (d) {
      case 'easy': return 'badge-easy';
      case 'medium': return 'badge-medium';
      case 'hard': return 'badge-hard';
      default: return 'badge';
    }
  };

  const sourceLabel = (s: string) => {
    switch (s) {
      case 'past_exam':
      case 'Archived Exams': return '📝 Archived Exams';
      case 'resource':
      case 'Course Notes': return '📖 Course Notes';
      case 'online':
      case 'Global': return '🌐 Global';
      default: return `🔖 ${s}`;
    }
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

  if (!mounted) {
    return (
      <div className="animate-pulse space-y-6">
        <div className="h-12 bg-dark-700 rounded-xl w-48" />
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
          {[1,2,3,4,5,6].map(i => <div key={i} className="h-36 bg-dark-700 rounded-2xl" />)}
        </div>
      </div>
    );
  }

  // ─── CATEGORY SELECTION SCREEN ───
  if (!selectedCategory) {
    return (
      <div className="space-y-12 animate-in py-4">
        {/* Back Link */}
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
              Practice <span className="text-accent-purple">Questions</span>
            </h1>
            <p className="text-gray-400 text-sm leading-relaxed font-medium">
              Master core computer science fundamentals through our curated problem sets and interactive challenges.
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
              <span className="text-accent-purple text-xs">📊</span>
              <span className="text-white font-black text-xs italic">{questions.length} Total Qs</span>
            </div>
          </div>
        </div>

        {/* Category Cards Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {/* ALL card always first */}
          <button
            onClick={() => selectCategory('all')}
            className="group relative flex flex-col items-start rounded-3xl bg-[#11152a]/50 border border-white/5 p-8 text-left transition-all duration-500 hover:bg-[#11152a] hover:border-accent-purple/30 hover:-translate-y-1 hover:shadow-2xl hover:shadow-accent-purple/10"
          >
            <div className="w-12 h-12 rounded-2xl bg-accent-purple/20 flex items-center justify-center text-2xl mb-8 group-hover:scale-110 transition-transform duration-500">
              🎯
            </div>
            <h3 className="text-xl font-black text-white italic uppercase tracking-tighter mb-2 group-hover:text-accent-purple-light transition-colors">
              All <br /> Questions
            </h3>
            <p className="text-xs text-gray-500 leading-relaxed mb-8 h-12 line-clamp-3">
              Comprehensive practice across all CS fundamentals and domains.
            </p>
            
            <div className="w-full mt-auto">
              <div className="flex items-center justify-between text-[10px] font-black uppercase tracking-[0.1em] text-accent-purple-light mb-3">
                <span>Progress</span>
                <span>{questions.filter(q => progress.correctAnswers[q.id]).length} / {questions.length} ({questions.length > 0 ? Math.round((questions.filter(q => progress.correctAnswers[q.id]).length / questions.length) * 100) : 0}%)</span>
              </div>
              <div className="w-full h-1.5 bg-white/5 rounded-full overflow-hidden">
                <div 
                  className="h-full bg-accent-purple rounded-full transition-all duration-1000 ease-out shadow-[0_0_10px_rgba(124,58,237,0.5)]"
                  style={{ width: `${questions.length > 0 ? (questions.filter(q => progress.correctAnswers[q.id]).length / questions.length) * 100 : 0}%` }}
                />
              </div>
            </div>
          </button>

          {/* Topic cards */}
          {topics.map((topic) => {
            const meta = topicMeta[topic] || defaultMeta;
            const count = topicCounts[topic] || 0;
            const solved = questions.filter(q => q.topic === topic && progress.correctAnswers[q.id]).length;
            const percent = count > 0 ? Math.round((solved / count) * 100) : 0;
            
            return (
              <button
                key={topic}
                onClick={() => selectCategory(topic)}
                className="group relative flex flex-col items-start rounded-3xl bg-[#11152a]/50 border border-white/5 p-5 sm:p-8 text-left transition-all duration-500 hover:bg-[#11152a] hover:border-accent-purple/30 hover:-translate-y-1 hover:shadow-2xl hover:shadow-accent-purple/10"
              >
                <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-2xl bg-white/5 flex items-center justify-center text-xl sm:text-2xl mb-4 sm:mb-8 group-hover:bg-accent-purple/10 group-hover:scale-110 transition-all duration-500">
                  {meta.icon}
                </div>
                <h3 className="text-lg sm:text-xl font-black text-white italic uppercase tracking-tighter mb-1 sm:mb-2 group-hover:text-white/90 transition-colors h-12 flex items-center">
                  {topic.split(' ').map((word, i) => <span key={i} className="block">{word}{i === 0 && topic.includes(' ') && word.length < 10 ? <br /> : ' '}</span>)}
                </h3>
                <p className="text-[11px] sm:text-xs text-gray-500 leading-tight sm:leading-relaxed mb-4 sm:mb-8 h-10 line-clamp-3">
                   {topicSubtopics[topic] || 'Focus on fundamental concepts and advanced applications.'}
                </p>
                
                <div className="w-full mt-auto">
                  <div className="flex items-center justify-between text-[9px] sm:text-[10px] font-black uppercase tracking-[0.1em] text-accent-purple-light mb-2 sm:mb-3">
                    <span>Progress</span>
                    <span>{solved} / {count} ({percent}%)</span>
                  </div>
                  <div className="w-full h-1 sm:h-1.5 bg-white/5 rounded-full overflow-hidden">
                    <div 
                      className="h-full bg-accent-purple rounded-full transition-all duration-1000 ease-out shadow-[0_0_10px_rgba(124,58,237,0.5)]"
                      style={{ width: `${percent}%` }}
                    />
                  </div>
                </div>
              </button>
            );
          })}
        </div>
      </div>
    );
  }

  // ─── QUIZ INTERFACE ───
  return (
    <div className="space-y-6 animate-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <button
            onClick={() => setSelectedCategory(null)}
            className="inline-flex items-center gap-1.5 text-xs text-gray-500 hover:text-white transition-colors bg-dark-800 border border-dark-400/20 rounded-lg px-3 py-2"
          >
            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
            Categories
          </button>
          <div>
            <h1 className="text-xl font-bold text-white">
              {selectedCategory === 'all' ? 'All Questions' : selectedCategory}
            </h1>
            <p className="text-gray-500 text-xs mt-0.5">
              {filteredQuestions.length} questions
            </p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1.5 bg-dark-800 border border-dark-400/20 rounded-lg px-3 py-1.5">
            <span className="text-accent-purple-light font-bold text-sm">{progress.xp}</span>
            <span className="text-[10px] text-gray-500">XP</span>
          </div>
          <div className="flex items-center gap-1.5 bg-dark-800 border border-dark-400/20 rounded-lg px-3 py-1.5">
            <span className="text-neon-green font-bold text-sm">{progress.streak}</span>
            <span className="text-[10px] text-gray-500">🔥</span>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="card p-3">
        <div className="flex flex-wrap gap-2">
          <select
            value={difficultyFilter}
            onChange={(e) => { setDifficultyFilter(e.target.value); resetQuiz(); }}
            className="input-field py-1.5 h-10 w-fit text-xs"
          >
            <option value="all">All Difficulties</option>
            <option value="easy">Easy</option>
            <option value="medium">Medium</option>
            <option value="hard">Hard</option>
          </select>

          <select
            value={sourceFilter}
            onChange={(e) => { setSourceFilter(e.target.value); resetQuiz(); }}
            className="bg-dark-600 border border-dark-400/50 rounded-lg px-3 py-1.5 text-xs text-white focus:border-accent-purple focus:outline-none"
          >
            <option value="all">All Sources</option>
            <option value="past_exam">Past Exam (v1)</option>
            <option value="Archived Exams">Archived Exams</option>
            <option value="Course Notes">Course Notes</option>
            <option value="Global">Global</option>
            <option value="online">Online (v1)</option>
          </select>

          {/* Major Filter */}
          <select 
            value={majorFilter} 
            onChange={(e) => { setMajorFilter(e.target.value); setCurrentIndex(0); setSelectedAnswer(null); setShowExplanation(false); }}
            className="bg-dark-600 border border-dark-400/50 rounded-lg px-3 py-1.5 text-xs text-white focus:border-accent-purple focus:outline-none"
          >
            <option value="all">Any Major</option>
            <option value="CSE">CSE Only</option>
            <option value="Software">Software Only</option>
          </select>

          <button
            onClick={() => { setIsRandomMode(!isRandomMode); resetQuiz(); }}
            className={`text-xs flex items-center gap-1.5 px-3 py-1.5 rounded-lg border transition-all ${
              isRandomMode
                ? 'border-accent-purple/50 bg-accent-purple/10 text-accent-purple-light'
                : 'border-dark-400/50 bg-dark-600 text-gray-400 hover:text-white'
            }`}
          >
            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
            {isRandomMode ? 'Random ON' : 'Shuffle'}
          </button>
        </div>
      </div>

      {/* Question Card */}
      {/* Main content display based on state */}
      {isFinished ? (
        <div className="card p-12 text-center space-y-8 animate-in zoom-in-95">
          <div className="space-y-2">
            <div className="text-6xl mb-4">
              {Math.round((quizScore.correct / quizScore.total) * 100) >= 80 ? '🎉' : Math.round((quizScore.correct / quizScore.total) * 100) >= 50 ? '😐' : '💀'}
            </div>
            <h2 className="text-3xl font-black text-white italic tracking-tighter uppercase">
              Quiz <span className="text-accent-purple">Complete</span>
            </h2>
            <p className="text-gray-400 font-medium">
              You&apos;ve tackled {quizScore.total} problems in {selectedCategory}.
            </p>
          </div>

          <div className="grid grid-cols-2 gap-4 max-w-sm mx-auto">
            <div className="p-6 rounded-2xl bg-white/5 border border-white/10">
              <div className="text-3xl font-black text-white italic">{Math.round((quizScore.correct / quizScore.total) * 100)}%</div>
              <div className="text-[10px] text-gray-500 font-black uppercase tracking-widest mt-1">Score</div>
            </div>
            <div className="p-6 rounded-2xl bg-white/5 border border-white/10">
              <div className="text-3xl font-black text-accent-purple italic">{quizScore.correct}/{quizScore.total}</div>
              <div className="text-[10px] text-gray-500 font-black uppercase tracking-widest mt-1">Problems</div>
            </div>
          </div>

          <div className="p-6 rounded-3xl bg-accent-purple/10 border border-accent-purple/20 max-w-xl mx-auto">
            <p className="text-xl font-bold text-white italic">
              &quot;{getHumorMessage(Math.round((quizScore.correct / quizScore.total) * 100))}&quot;
            </p>
          </div>

          <div className="max-w-xl mx-auto text-left space-y-6">
            <h3 className="text-sm font-black text-gray-400 uppercase tracking-[0.2em] flex items-center gap-2">
              <span>📊</span> Topic Mastery
            </h3>
            <div className="space-y-4">
              {Array.from(new Set(filteredQuestions.filter(q => sessionAnswers[q.id]).map(q => q.topic))).map(topic => {
                const topicQs = filteredQuestions.filter(q => q.topic === topic);
                const sessionQsCount = topicQs.filter(q => sessionAnswers[q.id]).length;
                const correctCount = topicQs.filter(q => sessionAnswers[q.id] === q.answer).length;
                const percent = Math.round((correctCount / sessionQsCount) * 100);
                
                return (
                  <div key={topic} className="p-4 rounded-2xl bg-white/5 border border-white/10 group hover:border-accent-purple/30 transition-all">
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-lg bg-dark-500 flex items-center justify-center text-sm">
                          {topicMeta[topic]?.icon || '📚'}
                        </div>
                        <span className="text-sm font-bold text-white italic uppercase tracking-tighter">{topic}</span>
                      </div>
                      <span className={`text-xs font-black ${percent >= 70 ? 'text-neon-green' : percent >= 50 ? 'text-yellow-400' : 'text-red-400'}`}>
                        {percent}%
                      </span>
                    </div>
                    <div className="flex items-center gap-2 mb-2">
                      <div className="flex-1 h-1.5 bg-dark-600 rounded-full overflow-hidden">
                        <div 
                          className={`h-full transition-all duration-1000 ${percent >= 70 ? 'bg-neon-green' : percent >= 50 ? 'bg-yellow-400' : 'bg-red-400'}`}
                          style={{ width: `${percent}%` }}
                        />
                      </div>
                      <span className="text-[10px] font-black text-gray-500 uppercase">{correctCount}/{sessionQsCount}</span>
                    </div>
                    {percent < 50 && (
                      <p className="text-[10px] text-red-400/80 font-medium italic mt-1">
                        ⚠️ Critical: Re-study {topic.toLowerCase()} concepts.
                      </p>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <button 
              onClick={resetQuiz}
              className="btn-primary px-10 py-3 rounded-xl font-black uppercase italic tracking-widest text-sm"
            >
              Restart Quiz
            </button>
            <button 
              onClick={() => setSelectedCategory(null)}
              className="px-10 py-3 rounded-xl border border-white/10 bg-white/5 hover:bg-white/10 text-gray-400 font-black uppercase italic tracking-widest text-sm transition-all shadow-lg hover:shadow-white/5"
            >
              Exit Practice
            </button>
          </div>
        </div>
      ) : currentQuestion ? (
        <div className="card p-4 sm:p-8 animate-in slide-in-from-bottom-5 duration-500">
          <div className="flex flex-wrap items-center gap-1 sm:gap-2 mb-3 sm:mb-6">
            <span className="badge-source text-[10px] sm:text-xs truncate max-w-[120px] sm:max-w-none">{sourceLabel(currentQuestion.source)}</span>
            <span className={`${difficultyColor(currentQuestion.difficulty)} text-[10px] sm:text-xs capitalize`}>
              {currentQuestion.difficulty}
            </span>
            <span className="badge bg-dark-500 text-gray-400 text-[10px] sm:text-xs truncate max-w-[100px] sm:max-w-none">
              {currentQuestion.topic}
            </span>

            {progress.correctAnswers[currentQuestion.id] ? (
              <span className="badge bg-green-500/20 text-green-400 border border-green-500/30 text-[10px] sm:text-xs">
                ✅ Completed
              </span>
            ) : progress.answeredQuestions[currentQuestion.id] ? (
              <span className="badge bg-red-500/20 text-red-400 border border-red-500/30 text-[10px] sm:text-xs">
                ❌ Needs Review
              </span>
            ) : null}
            
            <div className="ml-auto flex items-center gap-3">
              {isCustomQuestion(currentQuestion) && (
                <button
                  onClick={() => handleDeleteQuestion(currentQuestion.id)}
                  title={deleteConfirm === currentQuestion.id ? 'Click again to confirm' : 'Delete question'}
                  className={`flex items-center gap-1.5 px-2 py-1 rounded-md text-[10px] sm:text-xs font-medium transition-colors ${
                    deleteConfirm === currentQuestion.id 
                      ? 'bg-red-500/20 text-red-400 border border-red-500/30' 
                      : 'bg-dark-600 text-gray-400 hover:text-red-400 hover:bg-red-500/10 border border-dark-400/50 hover:border-red-500/30'
                  }`}
                >
                  <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                  </svg>
                  {deleteConfirm === currentQuestion.id ? 'Confirm?' : 'Delete'}
                </button>
              )}
              <span className="text-xs sm:text-sm text-gray-500">
                {currentIndex + 1} / {filteredQuestions.length}
              </span>
            </div>
          </div>

          {/* Question Text & Hint */}
          <div>
            <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-2 sm:gap-4 mb-3 sm:mb-4">
              <h2 className="text-sm sm:text-xl font-semibold text-white leading-snug sm:leading-relaxed flex-1">
                {currentQuestion.question}
              </h2>
            </div>
          </div>

          {/* Options */}
          <div className="space-y-2 sm:space-y-3 mb-4 sm:mb-6">
            {currentQuestion.options.map((option, idx) => {
              const isSelected = selectedAnswer === option;
              const isCorrect = option === currentQuestion.answer;
              const isAnswered = selectedAnswer !== null;

              let optionClass = 'card p-2.5 px-3 sm:p-4 cursor-pointer transition-all duration-200 border-2 ';
              if (!isAnswered) {
                optionClass += 'border-transparent hover:border-accent-purple/40 hover:bg-dark-600/60';
              } else if (isCorrect) {
                optionClass += 'border-green-500/60 bg-green-500/10';
              } else if (isSelected && !isCorrect) {
                optionClass += 'border-red-500/60 bg-red-500/10';
              } else {
                optionClass += 'border-transparent opacity-50';
              }

              return (
                <button
                  key={idx}
                  onClick={() => handleSelectAnswer(option)}
                  disabled={isAnswered}
                  className={`${optionClass} w-full text-left flex items-start sm:items-center gap-2 sm:gap-3`}
                >
                  <span className={`w-6 h-6 sm:w-8 sm:h-8 rounded-md sm:rounded-lg flex items-center justify-center text-[10px] sm:text-sm font-semibold flex-shrink-0 mt-0.5 sm:mt-0 ${
                    isAnswered && isCorrect
                      ? 'bg-green-500/20 text-green-400'
                      : isAnswered && isSelected
                      ? 'bg-red-500/20 text-red-400'
                      : 'bg-dark-500 text-gray-400'
                  }`}>
                    {String.fromCharCode(65 + idx)}
                  </span>
                  <span className={`text-xs sm:text-base font-medium leading-snug sm:leading-relaxed ${isAnswered && isCorrect ? 'text-green-400' : isAnswered && isSelected ? 'text-red-400' : 'text-gray-200'}`}>
                    {option}
                  </span>
                  {isAnswered && isCorrect && (
                    <svg className="w-3.5 h-3.5 sm:w-5 sm:h-5 text-green-400 ml-auto flex-shrink-0" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41L9 16.17z" />
                    </svg>
                  )}
                  {isAnswered && isSelected && !isCorrect && (
                    <svg className="w-3.5 h-3.5 sm:w-5 sm:h-5 text-red-400 ml-auto flex-shrink-0" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12 19 6.41z" />
                    </svg>
                  )}
                </button>
              );
            })}
          </div>

          {/* Explanation */}
          {showExplanation && (
            <div className="animate-slide-up rounded-xl p-5 bg-dark-600/60 border border-dark-400/30 mb-6">
              <div className="flex items-center gap-2 mb-2">
                <span className="text-sm font-semibold text-accent-purple-light">💡 Explanation</span>
              </div>
              <p className="text-gray-300 text-sm leading-relaxed">
                {currentQuestion.explanation}
              </p>
            </div>
          )}

          {/* Navigation */}
          <div className="flex items-center justify-between pt-4 border-t border-dark-400/20">
            <button
              onClick={handlePrevious}
              disabled={currentIndex === 0}
              className="btn-secondary text-sm disabled:opacity-30 disabled:cursor-not-allowed flex items-center gap-2"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
              </svg>
              Previous
            </button>
            {currentIndex >= filteredQuestions.length - 1 ? (
              <button
                onClick={() => setIsFinished(true)}
                disabled={!selectedAnswer}
                className="btn-primary text-sm px-8 bg-green-600 hover:bg-green-500 flex items-center gap-2"
              >
                Finish Quiz
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                </svg>
              </button>
            ) : (
              <button
                onClick={handleNext}
                disabled={currentIndex >= filteredQuestions.length - 1}
                className="btn-primary text-sm disabled:opacity-30 disabled:cursor-not-allowed flex items-center gap-2"
              >
                Next
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                </svg>
              </button>
            )}
          </div>
        </div>
      ) : (
        <div className="card p-20 text-center">
          <p className="text-gray-400 mb-4">No questions found for this topic.</p>
          <button onClick={() => setSelectedCategory(null)} className="btn-primary text-sm">
            Back to Categories
          </button>
        </div>
      )}
    </div>
  );
}

export default function QuestionsPage() {
  return (
    <Suspense fallback={
      <div className="animate-pulse space-y-6">
        <div className="h-12 bg-dark-700 rounded-xl w-48" />
        <div className="h-96 bg-dark-700 rounded-2xl" />
      </div>
    }>
      <QuestionsContent />
    </Suspense>
  );
}
