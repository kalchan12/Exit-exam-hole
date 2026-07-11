'use client';

import { useState, useEffect, useMemo, useCallback, useRef, Suspense } from 'react';
import Link from 'next/link';
import { useSearchParams, useRouter } from 'next/navigation';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { getQuestions, getTopics, type Question, invalidateQuestionsCache, DEPARTMENT_SOURCES } from '@/lib/dataLoader';
import { getProgress, recordAnswer, recordExamCompleted, syncProgressToRemote } from '@/lib/progressManager';
import { updateTopicAccuracy } from '@/lib/gamification';
import { useAuth } from '@/components/AuthProvider';
import { isAdmin } from '@/lib/rbac';
import { deleteTopicQuestions } from '@/lib/supabaseLoader';
import { ArrowLeft, Search, Timer, X, Flag, Check, X as XIcon, ChevronLeft, ChevronRight, BookOpen, Zap, Flame, FileText, Trophy, Clock, AlertTriangle, BarChart3 } from 'lucide-react';

const topicMeta: Record<string, { icon: string; gradient: string; border: string }> = {
  'Algorithms': { icon: '⚡', gradient: 'from-purple-500/20 to-indigo-500/20', border: 'border-purple-500/30' },
  'Operating Systems': { icon: '🖥️', gradient: 'from-cyan-500/20 to-blue-500/20', border: 'border-cyan-500/30' },
  'Database Systems': { icon: '🗄️', gradient: 'from-emerald-500/20 to-teal-500/20', border: 'border-emerald-500/30' },
  'Networking': { icon: '🌐', gradient: 'from-orange-500/20 to-amber-500/20', border: 'border-orange-500/30' },
  'Software Engineering': { icon: '🛠️', gradient: 'from-rose-500/20 to-pink-500/20', border: 'border-rose-500/30' },
  'Data Structures': { icon: '🧱', gradient: 'from-violet-500/20 to-purple-500/20', border: 'border-violet-500/30' },
  'Computer Architecture': { icon: '🔧', gradient: 'from-sky-500/20 to-blue-500/20', border: 'border-sky-500/30' },
};
const defaultMeta = { icon: '📝', gradient: 'from-primary/20 to-surface-container-highest', border: 'border-primary/30' };

const DIFFICULTY_COLORS: Record<string, string> = {
  easy: 'badge-easy',
  medium: 'badge-medium',
  hard: 'badge-hard',
};

function ExamContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const department = searchParams.get('department') || null;
  const examFromUrl = searchParams.get('exam') || searchParams.get('topic') || null;
  const { user, profile, loading: authLoading } = useAuth();

  const [questions, setQuestions] = useState<Question[]>([]);
  const [topics, setTopics] = useState<string[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(examFromUrl);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [mounted, setMounted] = useState(false);
  const [progressState, setProgressState] = useState(() => getProgress());
  const [isFinished, setIsFinished] = useState(false);
  const [isReviewMode, setIsReviewMode] = useState(false);
  const [userAnswers, setUserAnswers] = useState<Record<string, string>>({});
  const [quizScore, setQuizScore] = useState({ correct: 0, total: 0 });
  const [isDisclaimerAccepted, setIsDisclaimerAccepted] = useState(false);
  const [timeLeft, setTimeLeft] = useState<number | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const PINNED_DEPTS = useMemo(() => ['Computer Science', 'Software Engineering'], []);

  const sortedDeptEntries = useMemo(() => {
    return Object.entries(DEPARTMENT_SOURCES).sort(([a], [b]) => {
      const aPinned = PINNED_DEPTS.includes(a);
      const bPinned = PINNED_DEPTS.includes(b);
      if (aPinned && !bPinned) return -1;
      if (!aPinned && bPinned) return 1;
      return a.localeCompare(b);
    });
  }, [PINNED_DEPTS]);

  const filteredDeptEntries = useMemo(() => {
    if (!searchQuery) return sortedDeptEntries;
    return sortedDeptEntries.filter(([dept]) =>
      dept.toLowerCase().includes(searchQuery.toLowerCase()),
    );
  }, [sortedDeptEntries, searchQuery]);

  const loadData = useCallback(async () => {
    const allQs = await getQuestions();
    const excludeSources = ['Resource', 'Study Material', 'GitHub', 'Local'];
    const examQs = allQs.filter(q => 
      q.source && !excludeSources.includes(q.source)
    );
    setQuestions(examQs);
    
    const sourceSet = new Set(examQs.map(q => q.source));
    setTopics(Array.from(sourceSet).sort());
  }, []);

  useEffect(() => {
    setMounted(true);
    loadData();
  }, [loadData]);

  const handleDeleteTopic = async (e: React.MouseEvent, topic: string) => {
    e.stopPropagation();
    if (!confirm(`Are you sure you want to delete the entire "${topic}" exam? This will remove all its questions from the database.`)) return;

    try {
      const success = await deleteTopicQuestions(topic);
      if (success) {
        invalidateQuestionsCache();
        await loadData();
      } else {
        alert('Failed to delete questions from Supabase.');
      }
    } catch (err) {
      console.error(err);
      alert('Error deleting topic.');
    }
  };

  const filteredQuestions = useMemo(() => {
    let filtered = questions;
    if (selectedCategory && selectedCategory !== 'all') {
      filtered = filtered.filter((q) => q.source === selectedCategory);
    }
    return filtered;
  }, [questions, selectedCategory]);

  const currentQuestion = filteredQuestions[currentIndex];

  const handleSelectAnswer = useCallback(
    (answer: string) => {
      if (isReviewMode || !currentQuestion) return;
      
      const isCorrect = answer === currentQuestion.answer;
      setUserAnswers(prev => ({ ...prev, [currentQuestion.id]: answer }));
      
      const newState = recordAnswer(currentQuestion.id, isCorrect, currentQuestion.topic);
      updateTopicAccuracy(currentQuestion.topic, isCorrect);
      setProgressState(newState);
      if (user) syncProgressToRemote(user.id);
    },
    [currentQuestion, user, isReviewMode]
  );

  const handleFinish = () => {
    if (filteredQuestions.length === 0) return;
    let correct = 0;
    filteredQuestions.forEach(q => {
      if (userAnswers[q.id] === q.answer) correct++;
    });
    recordExamCompleted(correct, filteredQuestions.length);
    setProgressState(getProgress());
    setQuizScore({ correct, total: filteredQuestions.length });
    setIsFinished(true);
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
  };

  const formatTime = (seconds: number): string => {
    const hrs = Math.floor(seconds / 3600);
    const mins = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    if (hrs > 0) {
      return `${hrs}:${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    }
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  useEffect(() => {
    if (!isDisclaimerAccepted || filteredQuestions.length === 0) return;

    const totalSeconds = filteredQuestions.length * 60;
    setTimeLeft(totalSeconds);

    timerRef.current = setInterval(() => {
      setTimeLeft(prev => {
        if (prev === null || prev <= 1) return 0;
        return prev - 1;
      });
    }, 1000);

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [isDisclaimerAccepted, filteredQuestions.length]);

  useEffect(() => {
    if (isFinished && timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
  }, [isFinished]);

  useEffect(() => {
    if (timeLeft === 0 && !isFinished) {
      handleFinish();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [timeLeft, isFinished]);

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
    setTimeLeft(null);
    setIsDisclaimerAccepted(false);
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
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

  if (!mounted) return null;

  // ─── DEPARTMENT LISTING ───
  if (!department && !selectedCategory) {
    return (
      <div className="space-y-6 py-4">
        <Link 
          href="/dashboard"
          className="inline-flex items-center gap-2 text-label-xs text-on-surface-variant hover:text-primary transition-colors font-medium"
        >
          <ChevronLeft className="w-4 h-4" />
          Return to Dashboard
        </Link>

        <div className="flex flex-col sm:flex-row sm:items-start gap-6">
          <div className="flex-1">
            <h1 className="text-headline-2xl font-bold text-on-surface">Exit Exam</h1>
            <p className="text-body-base text-on-surface-variant mt-1">
              Select your department to access authentic past-year exit exam questions, precisely timed to build your competitive edge.
            </p>
          </div>
          <div className="card bg-surface-container/60 backdrop-blur-sm p-4 shrink-0 flex items-center gap-5 min-w-[240px] self-start">
            <div className="text-center flex-1">
              <div className="flex items-center justify-center gap-1.5">
                <Zap className="w-4 h-4 text-primary" />
                <span className="text-headline-xl-mobile font-bold text-on-surface tabular-nums">{progress.xp.toLocaleString()}</span>
              </div>
              <div className="text-label-xs text-on-surface-variant font-medium mt-0.5">XP</div>
            </div>
            <div className="w-px h-10 bg-outline-variant/50" />
            <div className="text-center flex-1">
              <div className="flex items-center justify-center gap-1.5">
                <Flame className="w-4 h-4 text-secondary" />
                <span className="text-headline-xl-mobile font-bold text-on-surface tabular-nums">{progress.streak}</span>
              </div>
              <div className="text-label-xs text-on-surface-variant font-medium mt-0.5">Day Streak</div>
            </div>
            <div className="w-px h-10 bg-outline-variant/50" />
            <div className="text-center flex-1">
              <div className="flex items-center justify-center gap-1.5">
                <FileText className="w-4 h-4 text-tertiary" />
                <span className="text-headline-xl-mobile font-bold text-on-surface tabular-nums">{questions.length.toLocaleString()}</span>
              </div>
              <div className="text-label-xs text-on-surface-variant font-medium mt-0.5">Exam Qs</div>
            </div>
          </div>
        </div>

        {/* Search */}
        <div className="relative max-w-2xl mx-auto">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-on-surface-variant" />
          <input
            type="text"
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            placeholder="Search departments..."
            className="input-field pl-11 border-outline"
          />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
          {filteredDeptEntries.map(([dept, sources], index) => {
            const isPinned = PINNED_DEPTS.includes(dept);
            const count = questions.filter(q => sources.includes(q.source)).length;
            const meta = dept === 'Computer Science'
              ? { icon: '💻', gradient: 'from-emerald-500/20 to-teal-500/20' }
              : dept === 'Software Engineering'
                ? { icon: '🛠️', gradient: 'from-rose-500/20 to-pink-500/20' }
                : defaultMeta;
            return (
              <button
                key={dept}
                onClick={() => router.push(`/exam?department=${encodeURIComponent(dept)}`)}
                style={{ animationDelay: `${index * 40}ms` }}
                className="card-hover flex flex-col items-start p-6 text-left group animate-in fade-in slide-in-from-bottom-4"
              >
                

                <div className="w-11 h-11 rounded-xl bg-surface-container flex items-center justify-center text-xl mb-4 group-hover:scale-110 group-hover:bg-primary-container transition-all duration-300">
                  {meta.icon}
                </div>

                <h3 className="text-headline-xl-mobile font-bold text-on-surface mb-2 group-hover:text-primary transition-colors">
                  {dept}
                </h3>

                <p className="text-label-sm text-on-surface-variant flex-1 mb-4">
                  {sources.length} exam set{sources.length !== 1 ? 's' : ''} available
                </p>

                <div className="flex items-center gap-2 mt-auto">
                  <span className="text-sm font-bold text-primary tabular-nums">{count}</span>
                  <span className="text-label-xs text-on-surface-variant">Questions</span>
                </div>
              </button>
            );
          })}
        </div>

        {searchQuery && filteredDeptEntries.length === 0 && (
          <div className="text-center py-12">
            <div className="text-4xl mb-4 opacity-40">🔍</div>
            <p className="text-on-surface-variant text-sm">No departments matching &quot;{searchQuery}&quot;</p>
          </div>
        )}
      </div>
    );
  }

  // ─── EXAM SOURCES WITHIN A DEPARTMENT ───
  if (department && !selectedCategory) {
    const sourcesInDept = DEPARTMENT_SOURCES[department] || [];
    const examTopics = topics.filter(t => sourcesInDept.includes(t));
    if (examTopics.length === 0) {
      return (
        <div className="space-y-10 py-4">
          <button onClick={() => router.push('/exam')} className="inline-flex items-center gap-2 text-label-xs text-on-surface-variant hover:text-primary transition-colors font-medium">
            <ChevronLeft className="w-4 h-4" />
            All Departments
          </button>
          <div className="text-center py-20">
            <p className="text-on-surface-variant">No exam sets found for this department.</p>
          </div>
        </div>
      );
    }

    return (
      <div className="space-y-6 py-4">
        <button onClick={() => router.push('/exam')} className="inline-flex items-center gap-2 text-label-xs text-on-surface-variant hover:text-primary transition-colors font-medium">
          <ChevronLeft className="w-4 h-4" />
          All Departments
        </button>

        <div>
          <div className="flex items-center gap-4">
            <h1 className="text-headline-2xl font-bold text-on-surface">{department}</h1>
            <span className="flex items-center gap-1.5 text-label-sm text-on-surface-variant">
              <FileText className="w-3.5 h-3.5 text-primary" />
              <span className="font-semibold text-on-surface tabular-nums">{questions.filter(q => sourcesInDept.includes(q.source)).length.toLocaleString()}</span> Exam Qs
            </span>
          </div>
          <p className="text-body-base text-on-surface-variant mt-1">
            Select an exam set below to begin practicing.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
          {examTopics
            .filter(topic => topic !== 'past_exam')
            .map((topic, index) => {
            const is2017 = topic === 'Exit Exam 2017' || topic === 'Archived Exams';
            const displayTitle = topic;
            const displayDesc = is2017 
              ? "Enter the 2017 Vault! This is based on actual materials, but we're still in active review mode."
              : `Official ${topic} certification and exit exam questions provided for academic preparation.`;
            
            const meta = topicMeta[topic] || defaultMeta;
            const count = questions.filter(q => q.source === topic).length;
            const userIsAdmin = isAdmin(profile?.username);
            return (
              <button
                key={topic}
                onClick={() => {
                  setSelectedCategory(topic);
                  setIsDisclaimerAccepted(false);
                  router.push(`/exam?department=${encodeURIComponent(department)}&exam=${encodeURIComponent(topic)}`);
                }}
                style={{ animationDelay: `${index * 40}ms` }}
                className="card-hover flex flex-col items-start p-6 text-left group animate-in fade-in slide-in-from-bottom-4"
              >
                <div className="absolute top-3 right-3 z-10 flex gap-2">
                  {userIsAdmin && (
                    <div 
                      onClick={(e) => handleDeleteTopic(e, topic)}
                      className="p-1.5 rounded-lg bg-error-container/30 hover:bg-error-container group/del transition-all cursor-pointer"
                      title="Delete this topic from Supabase"
                    >
                      <XIcon className="w-3.5 h-3.5 text-error" />
                    </div>
                  )}
                </div>

                <div className="w-11 h-11 rounded-xl bg-surface-container flex items-center justify-center text-xl mb-4 group-hover:scale-110 group-hover:bg-primary-container transition-all duration-300">
                  {is2017 ? '🎓' : meta.icon}
                </div>
                <h3 className="text-headline-xl-mobile font-bold text-on-surface mb-2 group-hover:text-primary transition-colors text-left">
                  {displayTitle}
                </h3>
                <p className="text-label-sm text-on-surface-variant flex-1 mb-4 text-left">
                   {displayDesc}
                </p>
                <div className="flex items-center gap-2 mt-auto">
                  <span className="text-sm font-bold text-primary tabular-nums">{count}</span>
                  <span className="text-label-xs text-on-surface-variant">Questions</span>
                </div>
              </button>
            );
          })}
        </div>
      </div>
    );
  }

  // ─── DISCLAIMER MODAL ───
  if (!isDisclaimerAccepted) {
    const is2017 = selectedCategory === 'Exit Exam 2017' || selectedCategory === 'Archived Exams';
    const displayTitle = is2017 ? 'Exit Exam 2017' : selectedCategory;
    const displayDesc = is2017 
      ? "Enter the **2017 Vault**! 🌩️ This is based on actual materials, but we're still in 'active review' mode. If you see a typo that looks like ancient Script, don't worry—it's either a deployment error or you're just not smart enough to understand it yet. 💀 We're also working on adding those missing diagrams soon. Don't say we didn't warn you! 📉 😊"
      : 'Official certification and exit exam questions provided for academic preparation.';

    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center p-6 bg-black/40 backdrop-blur-sm animate-in fade-in duration-300">
        <div className="card max-w-xl w-full p-8 sm:p-12 animate-in zoom-in-95 duration-300 flex flex-col items-center text-center">
          <div className="w-16 h-16 rounded-2xl bg-primary-container flex items-center justify-center text-3xl mb-6">
            {is2017 ? '🎓' : '📝'}
          </div>
          
          <h2 className="text-headline-2xl font-bold text-on-surface tracking-tight mb-4">
            {displayTitle}
          </h2>
          
          <div className="space-y-4 mb-8 w-full text-left">
            <div className="text-body-base text-on-surface-variant leading-relaxed prose prose-sm max-w-none prose-p:text-on-surface-variant prose-strong:text-primary">
              <ReactMarkdown remarkPlugins={[remarkGfm]}>{displayDesc}</ReactMarkdown>
            </div>
            {is2017 && (
              <p className="text-label-xs text-primary font-bold tracking-wider text-center">
                Under Active Review
              </p>
            )}
          </div>

          <div className="flex flex-col sm:flex-row gap-4 w-full">
            <button 
              onClick={() => {
                setSelectedCategory(null);
                if (department) {
                  router.push(`/exam?department=${encodeURIComponent(department)}`);
                } else {
                  router.push('/exam');
                }
              }}
              className="btn-secondary flex-1"
            >
              Go Back
            </button>
            <button 
              onClick={() => setIsDisclaimerAccepted(true)}
              className="btn-primary flex-1"
            >
              Start Exam
            </button>
          </div>
        </div>
      </div>
    );
  }

  // ─── RESULTS VIEW ───
  if (isFinished) {
    return (
      <div className="card p-8 sm:p-12 text-center space-y-8 animate-in zoom-in-95 max-w-3xl mx-auto">
        <div className="space-y-2">
          <div className="text-5xl mb-4">
            {Math.round((quizScore.correct / quizScore.total) * 100) >= 80 ? '🎖️' : Math.round((quizScore.correct / quizScore.total) * 100) >= 50 ? '📄' : '💀'}
          </div>
          <h2 className="text-headline-2xl font-bold text-on-surface tracking-tight">
            Exam <span className="text-gradient">Results</span>
          </h2>
          <p className="text-body-base text-on-surface-variant">
            You&apos;ve completed the {selectedCategory === 'all' ? 'Full Mock' : selectedCategory} simulation.
          </p>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 max-w-2xl mx-auto">
          <div className="p-5 rounded-xl bg-surface-container border border-outline-variant">
            <div className="text-headline-2xl font-bold text-on-surface">{Math.round((quizScore.correct / quizScore.total) * 100)}%</div>
            <div className="text-label-xs text-on-surface-variant font-medium mt-1">Score</div>
          </div>
          <div className="p-5 rounded-xl bg-surface-container border border-outline-variant">
            <div className="text-headline-2xl font-bold text-primary">{quizScore.correct}/{quizScore.total}</div>
            <div className="text-label-xs text-on-surface-variant font-medium mt-1">Correct</div>
          </div>
          <div className="p-5 rounded-xl bg-surface-container border border-outline-variant">
            <div className={`text-headline-2xl font-bold ${quizScore.correct === quizScore.total ? 'text-secondary' : 'text-accent-orange'}`}>
              +{quizScore.correct * 10 + 50 + (quizScore.correct === quizScore.total ? 100 : 0)}
            </div>
            <div className="text-label-xs text-on-surface-variant font-medium mt-1">XP Earned</div>
          </div>
          <div className="p-5 rounded-xl bg-surface-container border border-outline-variant">
            <div className={`text-sm font-bold ${timeLeft === 0 ? 'text-error' : 'text-secondary'}`}>
              {timeLeft === 0 ? "Time's up!" : formatTime((filteredQuestions.length * 60) - (timeLeft || 0))}
            </div>
            <div className="text-label-xs text-on-surface-variant font-medium mt-1">Time</div>
          </div>
        </div>

        <div className="p-5 rounded-xl bg-primary-container/30 border border-primary/20 max-w-xl mx-auto">
          <p className="text-headline-xl-mobile font-bold text-on-surface">
            &quot;{getHumorMessage(Math.round((quizScore.correct / quizScore.total) * 100))}&quot;
          </p>
        </div>

        <div className="max-w-xl mx-auto text-left space-y-5">
          <h3 className="text-label-sm text-on-surface-variant font-bold tracking-wider flex items-center gap-2">
            <BarChart3 className="w-4 h-4" /> Exam Breakdown
          </h3>
          <div className="space-y-4">
            {Array.from(new Set(filteredQuestions.map(q => q.topic))).map(topic => {
              const topicQs = filteredQuestions.filter(q => q.topic === topic);
              const correctCount = topicQs.filter(q => userAnswers[q.id] === q.answer).length;
              const percent = Math.round((correctCount / topicQs.length) * 100);
              
              return (
                <div key={topic} className="p-4 rounded-xl bg-surface-container border border-outline-variant group hover:border-primary/30 transition-all">
                  <div className="flex items-center justify-between mb-2.5">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-lg bg-surface-container-highest flex items-center justify-center text-sm">
                        {topicMeta[topic]?.icon || '📝'}
                      </div>
                      <span className="text-label-sm font-bold text-on-surface">{topic}</span>
                    </div>
                    <span className={`text-label-xs font-bold ${percent >= 70 ? 'text-secondary' : percent >= 50 ? 'text-tertiary' : 'text-error'}`}>
                      {percent}%
                    </span>
                  </div>
                  <div className="progress-bar">
                    <div 
                      className={`progress-bar-fill ${percent >= 70 ? '!bg-secondary' : percent >= 50 ? '!bg-tertiary' : '!bg-error'}`}
                      style={{ width: `${percent}%` }}
                    />
                  </div>
                  <span className="text-label-xs text-on-surface-variant mt-1.5 block">{correctCount}/{topicQs.length} correct</span>
                </div>
              );
            })}
          </div>
        </div>

        <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
          <button 
            onClick={() => { setIsFinished(false); setIsReviewMode(true); setCurrentIndex(0); }}
            className="btn-primary"
          >
            Review Answers
          </button>
          <button 
            onClick={resetExam}
            className="btn-secondary"
          >
            Restart Exam
          </button>
          <button 
            onClick={() => {
              setSelectedCategory(null);
              if (department) {
                router.push(`/exam?department=${encodeURIComponent(department)}`);
              } else {
                router.push('/exam');
              }
            }}
            className="btn-ghost"
          >
            Exit
          </button>
        </div>
      </div>
    );
  }

  // ─── LIVE EXAM ───
  return (
    <div className="flex flex-col h-full">
      {/* Sticky Header Bar */}
      <header className="h-14 bg-surface border-b border-outline-variant flex items-center justify-between px-margin-desktop shrink-0 z-10 shadow-sm">
        <div className="flex items-center gap-4">
          <button
            onClick={() => {
              if (timerRef.current) { clearInterval(timerRef.current); timerRef.current = null; }
              setTimeLeft(null);
              setSelectedCategory(null);
              if (department) {
                router.push(`/exam?department=${encodeURIComponent(department)}`);
              } else {
                router.push('/exam');
              }
            }}
            className="w-9 h-9 rounded-full flex items-center justify-center text-on-surface-variant hover:bg-surface-container-low hover:text-on-surface transition-colors"
            aria-label="Exit Exam"
          >
            <X className="w-5 h-5" />
          </button>
          <div className="h-5 w-px bg-outline-variant hidden md:block" />
          <div className="bg-surface-container-high px-3 py-1 rounded-full flex items-center gap-2">
            <BookOpen className="w-3.5 h-3.5 text-primary" />
            <span className="text-label-xs text-on-surface font-medium">{selectedCategory === 'all' ? 'Full Mock' : selectedCategory}</span>
          </div>
        </div>

        <div className="hidden sm:flex items-center gap-6 absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2">
          <span className="text-body-base text-on-surface-variant font-medium">Question {currentIndex + 1} of {filteredQuestions.length}</span>
          {timeLeft !== null && (
            <div className={`flex items-center gap-2 px-3 py-1.5 rounded-lg border transition-all ${
              timeLeft <= 60
                ? 'bg-error-container/30 border-error/40'
                : timeLeft <= 300
                  ? 'bg-tertiary-fixed-dim/30 border-tertiary/40'
                  : 'bg-secondary-fixed-dim/30 border-secondary/40'
            }`}>
              <Timer className={`w-4 h-4 ${timeLeft <= 60 ? 'text-error' : timeLeft <= 300 ? 'text-tertiary' : 'text-secondary'}`} />
              <span className={`font-mono text-sm font-bold tabular-nums tracking-tight ${
                timeLeft <= 60 ? 'text-error' : timeLeft <= 300 ? 'text-tertiary' : 'text-secondary'
              }`}>
                {formatTime(timeLeft)}
              </span>
            </div>
          )}
        </div>

        <div className="flex items-center gap-3">
          {timeLeft !== null && (
            <div className="sm:hidden flex items-center gap-2 px-3 py-1.5 rounded-lg bg-surface-container border border-outline-variant">
              <Timer className={`w-3.5 h-3.5 ${timeLeft <= 60 ? 'text-error' : timeLeft <= 300 ? 'text-tertiary' : 'text-secondary'}`} />
              <span className={`font-mono text-xs font-bold tabular-nums ${timeLeft <= 60 ? 'text-error' : timeLeft <= 300 ? 'text-tertiary' : 'text-secondary'}`}>
                {formatTime(timeLeft)}
              </span>
            </div>
          )}
          <button
            onClick={handleFinish}
            disabled={Object.keys(userAnswers).length === 0}
            className="btn-primary text-label-xs py-2 disabled:opacity-50"
          >
            Submit Exam
          </button>
        </div>
      </header>

      {/* Main Content */}
      {currentQuestion ? (
        <div className="flex-1 flex overflow-hidden max-w-[1280px] w-full mx-auto px-margin-desktop gap-gutter py-6">
          {/* Left: Question Panel */}
          <main className="flex-1 overflow-y-auto pr-2 pb-12 custom-scrollbar">
            <div className="max-w-[800px] mx-auto flex flex-col gap-8">
              {/* Question Header */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="bg-primary-container text-on-primary-container px-3 py-1 rounded-full text-label-xs font-bold shadow-sm">
                    Q.{String(currentIndex + 1).padStart(2, '0')}
                  </div>
                  <span className={DIFFICULTY_COLORS[currentQuestion.difficulty] || 'badge-medium'}>
                    {currentQuestion.difficulty}
                  </span>
                  {isReviewMode && userAnswers[currentQuestion.id] === currentQuestion.answer && (
                    <span className="badge-easy">Correct</span>
                  )}
                  {isReviewMode && userAnswers[currentQuestion.id] && userAnswers[currentQuestion.id] !== currentQuestion.answer && (
                    <span className="badge-hard">Incorrect</span>
                  )}
                </div>
                <div className="text-label-sm text-on-surface-variant">+2 Points</div>
              </div>

              {/* Question Content */}
              <div className="text-body-lg text-on-surface leading-relaxed prose prose-lg max-w-none prose-headings:text-on-surface prose-p:text-on-surface prose-strong:text-primary prose-code:text-secondary prose-pre:bg-surface-container prose-pre:border prose-pre:border-outline-variant">
                <ReactMarkdown 
                  remarkPlugins={[remarkGfm]}
                  components={{
                    img: ({node, ...props}) => (
                      <img 
                        {...props} 
                        className="max-w-full sm:max-w-md h-auto rounded-xl mx-auto my-6 border border-outline-variant shadow-sm" 
                      />
                    ),
                    p: ({children}) => <p className="font-medium leading-relaxed">{children}</p>
                  }}
                >
                  {currentQuestion.question}
                </ReactMarkdown>
              </div>

              {currentQuestion.options[0] && (
                <div className="flex flex-col gap-4">
                  {currentQuestion.options.map((option, idx) => {
                    const isSelected = userAnswers[currentQuestion.id] === option;
                    const isCorrect = option === currentQuestion.answer;
                    const isAnswered = !!userAnswers[currentQuestion.id];

                    let containerClass = "group relative flex items-center p-4 rounded-xl border cursor-pointer transition-all overflow-hidden ";
                    let circleClass = "w-7 h-7 rounded-full border-2 flex items-center justify-center text-label-sm font-bold shrink-0 transition-colors ";

                    if (isReviewMode) {
                      containerClass += isCorrect
                        ? "border-secondary bg-secondary-fixed-dim/10"
                        : isSelected
                          ? "border-error bg-error-container/20"
                          : "border-outline-variant bg-surface-container-lowest opacity-60";
                      circleClass += isCorrect
                        ? "border-secondary bg-secondary text-on-secondary"
                        : isSelected
                          ? "border-error bg-error text-on-error"
                          : "border-outline text-on-surface-variant";
                    } else {
                      containerClass += isSelected
                        ? "border-primary bg-primary-container/10 shadow-sm"
                        : "border-outline-variant bg-surface-container-lowest hover:border-primary-fixed-dim hover:shadow-sm";
                      circleClass += isSelected
                        ? "border-primary bg-primary text-on-primary"
                        : "border-outline text-on-surface-variant group-hover:border-primary-fixed-dim";
                    }

                    return (
                      <button
                        key={idx}
                        onClick={() => handleSelectAnswer(option)}
                        disabled={isReviewMode}
                        className={containerClass}
                      >
                        <div className="absolute inset-0 bg-primary-container opacity-0 peer-checked:opacity-10 transition-opacity" />
                        <div className="flex items-center gap-4 relative z-10 w-full">
                          <div className={circleClass}>
                            {isReviewMode && isCorrect ? (
                              <Check className="w-3.5 h-3.5" />
                            ) : isReviewMode && isSelected && !isCorrect ? (
                              <XIcon className="w-3.5 h-3.5" />
                            ) : (
                              String.fromCharCode(65 + idx)
                            )}
                          </div>
                          <span className={`text-body-base ${isSelected ? 'font-medium' : ''} text-on-surface text-left`}>
                            {option.replace(/^[A-Z]\)\s?/, '')}
                          </span>
                        </div>
                      </button>
                    );
                  })}
                </div>
              )}

              {/* Explanation (review mode) */}
              {isReviewMode && currentQuestion.explanation && (
                <div className="p-5 rounded-xl bg-primary-container/20 border border-primary/20 animate-in slide-in-from-bottom-2">
                  <span className="text-label-xs font-bold text-primary tracking-wider block mb-2">Detailed Analysis</span>
                  <div className="text-body-base text-on-surface-variant leading-relaxed prose prose-sm max-w-none prose-p:text-on-surface-variant prose-strong:text-primary prose-code:text-secondary prose-pre:bg-surface-container prose-pre:border prose-pre:border-outline-variant">
                    <ReactMarkdown remarkPlugins={[remarkGfm]}>
                      {currentQuestion.explanation}
                    </ReactMarkdown>
                  </div>
                </div>
              )}

              {/* Navigation Buttons */}
              <div className="flex justify-between items-center pt-6 border-t border-outline-variant">
                <button
                  onClick={handlePrevious}
                  disabled={currentIndex === 0}
                  className="inline-flex items-center gap-2 px-4 py-2.5 rounded-lg border border-outline-variant text-on-surface hover:bg-surface-container-low transition-colors text-label-sm font-medium disabled:opacity-30"
                >
                  <ChevronLeft className="w-4 h-4" />
                  Previous
                </button>
                <button
                  onClick={handleNext}
                  disabled={currentIndex >= filteredQuestions.length - 1}
                  className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg bg-primary text-on-primary hover:brightness-110 transition-all text-label-sm font-bold shadow-sm disabled:opacity-50"
                >
                  Next Question
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          </main>

          {/* Right: Navigator Sidebar */}
          <aside className="w-[280px] shrink-0 h-full flex flex-col bg-surface-container-lowest rounded-xl border border-outline-variant shadow-sm overflow-hidden max-lg:hidden">
            <div className="p-4 border-b border-outline-variant bg-surface">
              <h3 className="text-headline-xl-mobile font-bold text-on-surface mb-2">Overview</h3>
              <div className="flex items-center gap-2">
                <div className="progress-bar flex-1">
                  <div
                    className="progress-bar-fill"
                    style={{ width: `${(Object.keys(userAnswers).length / filteredQuestions.length) * 100}%` }}
                  />
                </div>
                <span className="text-label-xs font-bold text-on-surface-variant w-10 text-right tabular-nums">
                  {Object.keys(userAnswers).length}/{filteredQuestions.length}
                </span>
              </div>
            </div>

            <div className="flex-1 overflow-y-auto p-4 custom-scrollbar">
              {/* Legend */}
              <div className="flex flex-wrap gap-x-4 gap-y-2 mb-5">
                <div className="flex items-center gap-1.5 text-label-xs text-on-surface-variant">
                  <div className="w-2.5 h-2.5 rounded-full bg-secondary-fixed-dim" /> Answered
                </div>
                <div className="flex items-center gap-1.5 text-label-xs text-on-surface-variant">
                  <div className="w-2.5 h-2.5 rounded-full bg-tertiary-fixed-dim" /> Skipped
                </div>
                <div className="flex items-center gap-1.5 text-label-xs text-on-surface-variant">
                  <div className="w-2.5 h-2.5 rounded-full bg-surface-container border border-outline-variant" /> Unseen
                </div>
              </div>

              {/* Question Grid */}
              <div className="grid grid-cols-5 gap-2">
                {filteredQuestions.map((q, idx) => {
                  const isCurrent = currentIndex === idx;
                  const isAnswered = !!userAnswers[q.id];
                  const isCorrectFlag = isReviewMode ? userAnswers[q.id] === q.answer : false;
                  const isWrong = isReviewMode ? userAnswers[q.id] !== q.answer && !!userAnswers[q.id] : false;

                  let btnClass = "aspect-square rounded-lg flex items-center justify-center text-label-xs font-medium transition-all border ";

                  if (isCurrent) {
                    btnClass += "bg-primary text-on-primary shadow-md ring-2 ring-primary ring-offset-2 ring-offset-surface-container-lowest scale-105 z-10 border-primary";
                  } else if (isReviewMode) {
                    if (isCorrectFlag) btnClass += "bg-secondary-fixed-dim text-on-secondary-fixed border-secondary/30";
                    else if (isWrong) btnClass += "bg-error-container text-on-error-container border-error/30";
                    else btnClass += "bg-surface-container border-outline-variant text-on-surface-variant";
                  } else {
                    if (isAnswered) btnClass += "bg-secondary-fixed-dim text-on-secondary-fixed border-secondary/30 hover:brightness-95";
                    else btnClass += "bg-surface-container border-outline-variant text-on-surface-variant hover:bg-surface-container-high";
                  }

                  return (
                    <button
                      key={q.id}
                      onClick={() => setCurrentIndex(idx)}
                      className={btnClass}
                    >
                      {idx + 1}
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="p-4 border-t border-outline-variant bg-surface-container-low text-center">
              <span className="text-label-xs text-on-surface-variant block mb-2">Need a break?</span>
              <button
                onClick={handleFinish}
                disabled={Object.keys(userAnswers).length === 0}
                className="w-full py-2 rounded-lg border border-outline text-label-sm font-medium text-on-surface hover:bg-surface-container-high transition-colors disabled:opacity-40"
              >
                Submit & Finish
              </button>
            </div>
          </aside>
        </div>
      ) : (
        <div className="flex-1 flex items-center justify-center p-10">
          <div className="text-center">
            <div className="card p-10">
              <p className="text-on-surface-variant">No exam questions found for this topic.</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default function ExamPage() {
  return (
    <Suspense fallback={
      <div className="flex items-center justify-center h-40">
        <div className="flex items-center gap-3 text-on-surface-variant">
          <div className="w-5 h-5 rounded-full border-2 border-primary border-t-transparent animate-spin" />
          <span className="text-label-sm">Loading Exam...</span>
        </div>
      </div>
    }>
      <ExamContent />
    </Suspense>
  );
}
