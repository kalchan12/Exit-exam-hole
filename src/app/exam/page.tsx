'use client';

import { useState, useEffect, useMemo, useCallback, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { getQuestions, getTopics, type Question } from '@/lib/dataLoader';
import { getProgress, recordAnswer, syncProgressToRemote } from '@/lib/progressManager';
import { updateTopicAccuracy } from '@/lib/gamification';
import { useAuth } from '@/components/AuthProvider';

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
  const [selectedAnswer, setSelectedAnswer] = useState<string | null>(null);
  const [showExplanation, setShowExplanation] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [progressState, setProgressState] = useState(() => getProgress());

  useEffect(() => {
    setMounted(true);
    getQuestions().then(allQs => {
      // ONLY include past exams/archived exams
      const examQs = allQs.filter(q => q.source === 'past_exam' || q.source === 'Archived Exams');
      setQuestions(examQs);
      
      const topicSet = new Set(examQs.map(q => q.topic));
      setTopics(Array.from(topicSet).sort());
    });
  }, []);

  const filteredQuestions = useMemo(() => {
    if (selectedCategory && selectedCategory !== 'all') {
      return questions.filter((q) => q.topic === selectedCategory);
    }
    return questions;
  }, [questions, selectedCategory]);

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
    }
  }, [currentIndex, filteredQuestions.length]);

  const handlePrevious = useCallback(() => {
    if (currentIndex > 0) {
      setCurrentIndex((prev) => prev - 1);
      setSelectedAnswer(null);
      setShowExplanation(false);
    }
  }, [currentIndex]);

  const progress = progressState;

  if (!mounted) return null;

  if (!selectedCategory) {
    return (
      <div className="space-y-8 animate-in">
        <div className="text-center max-w-lg mx-auto">
          <h1 className="text-4xl font-black text-white tracking-tight uppercase italic">Exam Mode</h1>
          <p className="text-gray-400 text-sm mt-2">
            Simulate real exit exams with past year questions. Focus on time and accuracy.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          <button
            onClick={() => setSelectedCategory('all')}
            className="group relative overflow-hidden rounded-2xl border border-indigo-500/30 bg-[#0d1225] bg-gradient-to-br from-indigo-500/10 to-blue-500/5 p-6 text-left transition-all hover:border-indigo-500/60"
          >
            <div className="text-3xl mb-3">🎓</div>
            <h3 className="text-lg font-bold text-white">Full Mock Exam</h3>
            <p className="text-xs text-gray-400 mt-1 mb-4">Randomized mix of all past exam questions</p>
            <span className="text-xs font-semibold text-indigo-400 bg-indigo-500/10 px-2.5 py-1 rounded-lg">
              {questions.length} Questions Available
            </span>
          </button>

          {topics.map((topic) => {
            const meta = topicMeta[topic] || defaultMeta;
            const count = questions.filter(q => q.topic === topic).length;
            return (
              <button
                key={topic}
                onClick={() => setSelectedCategory(topic)}
                className={`group relative overflow-hidden rounded-2xl border ${meta.border} bg-[#0d1225] bg-gradient-to-br ${meta.gradient} p-6 text-left transition-all hover:bg-opacity-80`}
              >
                <div className="text-3xl mb-3">{meta.icon}</div>
                <h3 className="text-lg font-bold text-white uppercase tracking-tight">{topic}</h3>
                <p className="text-xs text-gray-500 mt-1 mb-4">Focused past exam questions</p>
                <span className="text-xs font-medium text-gray-400 bg-dark-700/50 px-2.5 py-1 rounded-lg">
                  {count} Questions
                </span>
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
            <p className="text-gray-500 text-[10px] uppercase font-bold tracking-widest mt-0.5">Exam Simulation Mode</p>
          </div>
        </div>
        <div className="flex items-center gap-2 bg-indigo-500/10 border border-indigo-500/20 rounded-full px-4 py-1.5">
          <span className="text-indigo-400 font-black text-sm">{currentIndex + 1} / {filteredQuestions.length}</span>
        </div>
      </div>

      {currentQuestion ? (
        <div className="glass-card p-6 sm:p-10 border-indigo-500/20">
          <div className="flex items-center gap-2 mb-8">
             <span className="badge bg-indigo-500/20 text-indigo-400 border border-indigo-500/30 text-[10px] uppercase tracking-tighter">
              {currentQuestion.source}
            </span>
            <span className="badge bg-dark-500 text-gray-400 text-[10px] uppercase">
              {currentQuestion.difficulty}
            </span>
          </div>

          <h2 className="text-2xl font-bold text-white leading-snug mb-10">
            {currentQuestion.question}
          </h2>

          <div className="grid gap-4 mb-10">
            {currentQuestion.options.map((option, idx) => {
              const isSelected = selectedAnswer === option;
              const isCorrect = option === currentQuestion.answer;
              const isAnswered = selectedAnswer !== null;

              let style = "p-5 rounded-2xl border-2 transition-all text-left relative overflow-hidden ";
              if (!isAnswered) {
                style += "border-white/5 bg-white/5 hover:border-indigo-500/40 hover:bg-white/10";
              } else if (isCorrect) {
                style += "border-green-500/50 bg-green-500/10 text-green-400 shadow-lg shadow-green-500/5";
              } else if (isSelected) {
                style += "border-red-500/50 bg-red-500/10 text-red-400";
              } else {
                style += "border-transparent opacity-40";
              }

              return (
                <button key={idx} onClick={() => handleSelectAnswer(option)} disabled={isAnswered} className={style}>
                  <div className="flex items-center gap-4">
                    <span className={`w-8 h-8 rounded-lg flex items-center justify-center font-black ${isAnswered && isCorrect ? 'bg-green-500/20' : 'bg-white/10'}`}>
                      {String.fromCharCode(65 + idx)}
                    </span>
                    <span className="font-medium text-lg">{option}</span>
                  </div>
                </button>
              );
            })}
          </div>

          {showExplanation && (
            <div className="p-6 rounded-2xl bg-indigo-500/5 border border-indigo-500/20 mb-8 animate-in slide-in-from-bottom-2">
              <span className="text-xs font-bold text-indigo-400 uppercase tracking-widest block mb-2">Detailed Analysis</span>
              <p className="text-gray-300 leading-relaxed text-sm">{currentQuestion.explanation}</p>
            </div>
          )}

          <div className="flex items-center justify-between pt-6 border-t border-white/5">
            <button onClick={handlePrevious} disabled={currentIndex === 0} className="text-gray-500 hover:text-white disabled:opacity-0 transition-all font-bold text-sm uppercase">Previous</button>
            <button onClick={handleNext} disabled={currentIndex >= filteredQuestions.length - 1} className="btn-primary px-10 py-3 bg-indigo-600 hover:bg-indigo-500 text-sm italic font-black uppercase tracking-widest">Next Question</button>
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
