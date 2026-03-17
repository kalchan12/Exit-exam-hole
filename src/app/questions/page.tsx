'use client';

import { useState, useEffect, useMemo, useCallback, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { getQuestions, getTopics, type Question } from '@/lib/dataLoader';
import { getProgress, recordAnswer, saveProgress } from '@/lib/progressManager';
import { updateTopicAccuracy } from '@/lib/gamification';

function QuestionsContent() {
  const searchParams = useSearchParams();
  const initialTopic = searchParams.get('topic') || 'all';

  const [questions, setQuestions] = useState<Question[]>([]);
  const [topics, setTopics] = useState<string[]>([]);
  const [topicFilter, setTopicFilter] = useState(initialTopic);
  const [difficultyFilter, setDifficultyFilter] = useState('all');
  const [sourceFilter, setSourceFilter] = useState('all');
  const [currentIndex, setCurrentIndex] = useState(0);
  const [selectedAnswer, setSelectedAnswer] = useState<string | null>(null);
  const [showExplanation, setShowExplanation] = useState(false);
  const [showHint, setShowHint] = useState(false);
  const [isRandomMode, setIsRandomMode] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [progressState, setProgressState] = useState(() => getProgress());

  useEffect(() => {
    setMounted(true);
    getQuestions().then(setQuestions);
    getTopics().then(setTopics);
  }, []);

  const filteredQuestions = useMemo(() => {
    let filtered = questions;
    if (topicFilter !== 'all') {
      filtered = filtered.filter((q) => q.topic === topicFilter);
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
  }, [questions, topicFilter, difficultyFilter, sourceFilter, isRandomMode]);

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
    },
    [selectedAnswer, currentQuestion]
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

  const handleFilterChange = useCallback(() => {
    setCurrentIndex(0);
    setSelectedAnswer(null);
    setShowExplanation(false);
    setShowHint(false);
  }, []);

  const progress = progressState;

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

  if (!mounted) {
    return (
      <div className="animate-pulse space-y-6">
        <div className="h-12 bg-dark-700 rounded-xl w-48" />
        <div className="h-96 bg-dark-700 rounded-2xl" />
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white">Practice Questions</h1>
          <p className="text-gray-400 text-sm mt-1">
            {filteredQuestions.length} questions available
          </p>
        </div>
        <div className="flex items-center gap-3">
          <div className="card px-4 py-2 flex items-center gap-2">
            <span className="text-accent-purple-light font-bold">{progress.xp}</span>
            <span className="text-xs text-gray-400">XP</span>
          </div>
          <div className="card px-4 py-2 flex items-center gap-2">
            <span className="text-neon-green font-bold">{progress.streak}</span>
            <span className="text-xs text-gray-400">🔥 Streak</span>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="card p-4">
        <div className="flex flex-wrap gap-3">
          <select
            value={topicFilter}
            onChange={(e) => { setTopicFilter(e.target.value); handleFilterChange(); }}
            className="bg-dark-600 border border-dark-400/50 rounded-lg px-3 py-2 text-sm text-white focus:border-accent-purple focus:outline-none"
          >
            <option value="all">All Topics</option>
            {topics.map((t) => (
              <option key={t} value={t}>{t}</option>
            ))}
          </select>

          <select
            value={difficultyFilter}
            onChange={(e) => { setDifficultyFilter(e.target.value); handleFilterChange(); }}
            className="bg-dark-600 border border-dark-400/50 rounded-lg px-3 py-2 text-sm text-white focus:border-accent-purple focus:outline-none"
          >
            <option value="all">All Difficulties</option>
            <option value="easy">Easy</option>
            <option value="medium">Medium</option>
            <option value="hard">Hard</option>
          </select>

          <select
            value={sourceFilter}
            onChange={(e) => { setSourceFilter(e.target.value); handleFilterChange(); }}
            className="bg-dark-600 border border-dark-400/50 rounded-lg px-3 py-2 text-sm text-white focus:border-accent-purple focus:outline-none"
          >
            <option value="all">All Sources</option>
            <option value="past_exam">Past Exam (v1)</option>
            <option value="Archived Exams">Archived Exams</option>
            <option value="Course Notes">Course Notes</option>
            <option value="Global">Global</option>
            <option value="online">Online (v1)</option>
          </select>

          <button
            onClick={() => { setIsRandomMode(!isRandomMode); handleFilterChange(); }}
            className={`btn-secondary text-sm flex items-center gap-2 ${isRandomMode ? 'border-accent-purple text-accent-purple-light' : ''}`}
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
            {isRandomMode ? 'Random: ON' : 'Random'}
          </button>
        </div>
      </div>

      {/* Question Card */}
      {currentQuestion ? (
        <div className="card p-6 sm:p-8">
          {/* Question Header */}
          <div className="flex flex-wrap items-center gap-2 mb-6">
            <span className="badge-source text-xs">{sourceLabel(currentQuestion.source)}</span>
            <span className={`${difficultyColor(currentQuestion.difficulty)} text-xs capitalize`}>
              {currentQuestion.difficulty}
            </span>
            <span className="badge bg-dark-500 text-gray-400 text-xs">
              {currentQuestion.topic}
            </span>
            <span className="ml-auto text-sm text-gray-500">
              {currentIndex + 1} / {filteredQuestions.length}
            </span>
          </div>

          {/* Question Text & Hint */}
          <div>
            <div className="flex items-start justify-between gap-4 mb-4">
              <h2 className="text-xl font-semibold text-white leading-relaxed flex-1">
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
                  className={`${optionClass} w-full text-left flex items-center gap-3`}
                >
                  <span className={`w-8 h-8 rounded-lg flex items-center justify-center text-sm font-semibold flex-shrink-0 ${
                    isAnswered && isCorrect
                      ? 'bg-green-500/20 text-green-400'
                      : isAnswered && isSelected
                      ? 'bg-red-500/20 text-red-400'
                      : 'bg-dark-500 text-gray-400'
                  }`}>
                    {String.fromCharCode(65 + idx)}
                  </span>
                  <span className={`${isAnswered && isCorrect ? 'text-green-400' : isAnswered && isSelected ? 'text-red-400' : 'text-gray-200'}`}>
                    {option}
                  </span>
                  {isAnswered && isCorrect && (
                    <svg className="w-5 h-5 text-green-400 ml-auto flex-shrink-0" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41L9 16.17z" />
                    </svg>
                  )}
                  {isAnswered && isSelected && !isCorrect && (
                    <svg className="w-5 h-5 text-red-400 ml-auto flex-shrink-0" fill="currentColor" viewBox="0 0 24 24">
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
          <p className="text-gray-400">Try adjusting your filters to find more questions.</p>
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

