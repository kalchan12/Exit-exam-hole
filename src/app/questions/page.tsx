'use client';

import { useState, useEffect, useMemo, useCallback, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { getQuestions, getTopics, deleteCustomQuestion, type Question } from '@/lib/dataLoader';
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
const defaultMeta = { icon: '📚', gradient: 'from-gray-500/20 to-slate-500/20', border: 'border-gray-500/30 hover:border-gray-400/60' };

function QuestionsContent() {
  const searchParams = useSearchParams();
  const initialTopic = searchParams.get('topic') || null;
  const { user } = useAuth();

  const [questions, setQuestions] = useState<Question[]>([]);
  const [topics, setTopics] = useState<string[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(initialTopic);
  const [difficultyFilter, setDifficultyFilter] = useState('all');
  const [sourceFilter, setSourceFilter] = useState('all');
  const [currentIndex, setCurrentIndex] = useState(0);
  const [selectedAnswer, setSelectedAnswer] = useState<string | null>(null);
  const [showExplanation, setShowExplanation] = useState(false);
  const [showHint, setShowHint] = useState(false);
  const [isRandomMode, setIsRandomMode] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [progressState, setProgressState] = useState(() => getProgress());
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);

  const loadQuestions = () => getQuestions().then(setQuestions);

  useEffect(() => {
    setMounted(true);
    getQuestions().then(setQuestions);
    getTopics().then(setTopics);
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

  const handleDeleteQuestion = useCallback((questionId: string) => {
    if (deleteConfirm === questionId) {
      deleteCustomQuestion(questionId);
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

  const isCustomQuestion = (q: Question) => q.id.startsWith('custom_') || q.id.startsWith('bulk_');

  const resetQuiz = useCallback(() => {
    setCurrentIndex(0);
    setSelectedAnswer(null);
    setShowExplanation(false);
    setShowHint(false);
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
      <div className="space-y-8 animate-in">
        {/* Header */}
        <div className="text-center max-w-lg mx-auto">
          <h1 className="text-3xl font-extrabold text-white tracking-tight">Practice Questions</h1>
          <p className="text-gray-400 text-sm mt-2">
            Choose a category to start practicing, or select All to mix everything together.
          </p>
        </div>

        {/* Stats bar */}
        <div className="flex items-center justify-center gap-4">
          <div className="flex items-center gap-2 bg-dark-800 border border-dark-400/20 rounded-xl px-4 py-2">
            <span className="text-accent-purple-light font-bold">{progress.xp}</span>
            <span className="text-[11px] text-gray-500">XP</span>
          </div>
          <div className="flex items-center gap-2 bg-dark-800 border border-dark-400/20 rounded-xl px-4 py-2">
            <span className="text-neon-green font-bold">{progress.streak}</span>
            <span className="text-[11px] text-gray-500">🔥 Streak</span>
          </div>
          <div className="flex items-center gap-2 bg-dark-800 border border-dark-400/20 rounded-xl px-4 py-2">
            <span className="text-white font-bold">{questions.length}</span>
            <span className="text-[11px] text-gray-500">Total Qs</span>
          </div>
        </div>

        {/* Category Cards Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {/* ALL card */}
          <button
            onClick={() => selectCategory('all')}
            className="group relative overflow-hidden rounded-2xl border border-accent-purple/30 hover:border-accent-purple/60 bg-[#0d111c] bg-gradient-to-br from-accent-purple/15 to-fuchsia-500/10 p-6 text-left transition-all duration-300 hover:shadow-lg hover:shadow-purple-500/10 active:scale-[0.98]"
          >
            <div className="text-3xl mb-3">🎯</div>
            <h3 className="text-lg font-bold text-white group-hover:text-accent-purple-light transition-colors">All Questions</h3>
            <p className="text-xs text-gray-400 mt-1 mb-4">
              Practice everything from all categories mixed together
            </p>
            <div className="flex items-center justify-between">
              <div className="flex flex-col gap-1">
                <span className="text-xs font-semibold text-accent-purple-light bg-accent-purple/10 px-2.5 py-1 rounded-lg w-fit">
                  {questions.filter(q => progress.correctAnswers[q.id]).length} / {questions.length} ({questions.length > 0 ? Math.round((questions.filter(q => progress.correctAnswers[q.id]).length / questions.length) * 100) : 0}%)
                </span>
              </div>
              <svg className="w-5 h-5 text-gray-600 group-hover:text-accent-purple-light group-hover:translate-x-1 transition-all" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
              </svg>
            </div>
          </button>

          {/* Topic cards */}
          {topics.map((topic) => {
            const meta = topicMeta[topic] || defaultMeta;
            const count = topicCounts[topic] || 0;
            return (
              <button
                key={topic}
                onClick={() => selectCategory(topic)}
                className={`group relative overflow-hidden rounded-2xl border ${meta.border} bg-[#0d111c] bg-gradient-to-br ${meta.gradient} p-6 text-left transition-all duration-300 hover:shadow-lg active:scale-[0.98]`}
              >
                <div className="text-3xl mb-3">{meta.icon}</div>
                <h3 className="text-lg font-bold text-white group-hover:text-gray-100 transition-colors">{topic}</h3>
                <p className="text-xs text-gray-500 mt-1 mb-4">
                  Test your knowledge on {topic.toLowerCase()}
                </p>
                <div className="flex items-center justify-between">
                  <div className="flex flex-col gap-1">
                    <span className="text-xs font-semibold text-gray-400 bg-dark-700/60 px-2.5 py-1 rounded-lg w-fit">
                      {questions.filter(q => q.topic === topic && progress.correctAnswers[q.id]).length} / {count} ({count > 0 ? Math.round((questions.filter(q => q.topic === topic && progress.correctAnswers[q.id]).length / count) * 100) : 0}%)
                    </span>
                  </div>
                  <svg className="w-5 h-5 text-gray-600 group-hover:text-white group-hover:translate-x-1 transition-all" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                  </svg>
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
            className="bg-dark-600 border border-dark-400/50 rounded-lg px-3 py-1.5 text-xs text-white focus:border-accent-purple focus:outline-none"
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
      {currentQuestion ? (
        <div className="card p-6 sm:p-8">
          {/* Question Header */}
          <div className="flex flex-wrap items-center gap-1.5 sm:gap-2 mb-4 sm:mb-6">
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
            <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3 sm:gap-4 mb-4">
              <h2 className="text-lg sm:text-xl font-semibold text-white leading-relaxed flex-1">
                {currentQuestion.question}
              </h2>
              {currentQuestion.hint && !selectedAnswer && (
                <button
                  onClick={() => setShowHint(!showHint)}
                  className="btn-secondary text-xs flex-shrink-0 flex items-center gap-1.5"
                >
                  <svg className="w-4 h-4 text-accent-purple-light" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  {showHint ? 'Hide Hint' : 'Show Hint'}
                </button>
              )}
            </div>

            {showHint && currentQuestion.hint && !selectedAnswer && (
              <div className="animate-slide-up mb-6 p-4 rounded-lg bg-accent-purple/10 border border-accent-purple/20 text-accent-purple-light text-sm">
                <strong className="block mb-1">Hint:</strong>
                {currentQuestion.hint}
              </div>
            )}
          </div>

          {/* Options */}
          <div className="space-y-3 mb-6">
            {currentQuestion.options.map((option, idx) => {
              const isSelected = selectedAnswer === option;
              const isCorrect = option === currentQuestion.answer;
              const isAnswered = selectedAnswer !== null;

              let optionClass = 'card p-4 cursor-pointer transition-all duration-200 border-2 ';
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
                  className={`${optionClass} w-full text-left flex items-start sm:items-center gap-3`}
                >
                  <span className={`w-6 h-6 sm:w-8 sm:h-8 rounded-lg flex items-center justify-center text-xs sm:text-sm font-semibold flex-shrink-0 mt-0.5 sm:mt-0 ${
                    isAnswered && isCorrect
                      ? 'bg-green-500/20 text-green-400'
                      : isAnswered && isSelected
                      ? 'bg-red-500/20 text-red-400'
                      : 'bg-dark-500 text-gray-400'
                  }`}>
                    {String.fromCharCode(65 + idx)}
                  </span>
                  <span className={`text-sm sm:text-base leading-relaxed ${isAnswered && isCorrect ? 'text-green-400' : isAnswered && isSelected ? 'text-red-400' : 'text-gray-200'}`}>
                    {option}
                  </span>
                  {isAnswered && isCorrect && (
                    <svg className="w-4 h-4 sm:w-5 sm:h-5 text-green-400 ml-auto flex-shrink-0 mt-1 sm:mt-0" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41L9 16.17z" />
                    </svg>
                  )}
                  {isAnswered && isSelected && !isCorrect && (
                    <svg className="w-4 h-4 sm:w-5 sm:h-5 text-red-400 ml-auto flex-shrink-0 mt-1 sm:mt-0" fill="currentColor" viewBox="0 0 24 24">
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
          </div>
        </div>
      ) : (
        <div className="card p-12 text-center">
          <div className="text-4xl mb-4">🔍</div>
          <h3 className="text-xl font-semibold text-white mb-2">No Questions Found</h3>
          <p className="text-gray-400 mb-4">Try adjusting your filters to find more questions.</p>
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
