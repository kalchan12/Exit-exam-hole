'use client';

import { useState, useEffect, useMemo, useCallback, useRef, Suspense } from 'react';
import { useMounted } from '@/hooks/useMounted';
import Link from 'next/link';
import { useSearchParams, useRouter } from 'next/navigation';
import { getQuestions, type Question, invalidateQuestionsCache, DEPARTMENT_SOURCES } from '@/lib/dataLoader';
import { getProgress, recordAnswer, recordExamCompleted, syncProgressToRemote } from '@/lib/progressManager';
import { updateTopicAccuracy } from '@/lib/gamification';
import { useAuth } from '@/components/AuthProvider';
import { isAdmin } from '@/lib/rbac';
import { deleteTopicQuestions } from '@/lib/supabaseLoader';
import ExamDisclaimerModal from '@/components/exam/ExamDisclaimerModal';
import ExamResultsView from '@/components/exam/ExamResultsView';
import ExamNavigator from '@/components/exam/ExamNavigator';
import ExamQuestionPanel from '@/components/exam/ExamQuestionPanel';
import { PageSkeleton } from '@/components/ui/LoadingSkeleton';
import { Search, Timer, X, X as XIcon, ChevronLeft, BookOpen, Zap, Flame, FileText } from 'lucide-react';
import { topicMeta, defaultMeta, TIMER_WARNING_SECONDS, TIMER_URGENT_SECONDS, BACK_LINK_CLASSES } from '@/lib/constants/exam';
import { PINNED_DEPARTMENTS } from '@/lib/constants/game';

function ExamContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const department = searchParams.get('department') || null;
  const examFromUrl = searchParams.get('exam') || searchParams.get('topic') || null;
  const { user, profile } = useAuth();

  const [questions, setQuestions] = useState<Question[]>([]);
  const [topics, setTopics] = useState<string[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(examFromUrl);
  const [currentIndex, setCurrentIndex] = useState(0);
  const mounted = useMounted();
  const [progressState, setProgressState] = useState(() => getProgress());
  const [isFinished, setIsFinished] = useState(false);
  const [isReviewMode, setIsReviewMode] = useState(false);
  const [userAnswers, setUserAnswers] = useState<Record<string, string>>({});
  const [quizScore, setQuizScore] = useState({ correct: 0, total: 0 });
  const [isDisclaimerAccepted, setIsDisclaimerAccepted] = useState(false);
  const [timeLeft, setTimeLeft] = useState<number | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const PINNED_DEPTS = PINNED_DEPARTMENTS;

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

  // --- DEPARTMENT LISTING ---
  if (!department && !selectedCategory) {
    return (
      <div className="space-y-6 py-4">
        <Link 
          href="/dashboard"
          className={BACK_LINK_CLASSES}
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
            aria-label="Search departments"
            className="input-field pl-11 border-outline"
          />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
          {filteredDeptEntries.map(([dept, sources], index) => {
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

  // --- EXAM SOURCES WITHIN A DEPARTMENT ---
  if (department && !selectedCategory) {
    const sourcesInDept = DEPARTMENT_SOURCES[department] || [];
    const examTopics = topics.filter(t => sourcesInDept.includes(t));
    if (examTopics.length === 0) {
      return (
        <div className="space-y-10 py-4">
          <button onClick={() => router.push('/exam')} className={BACK_LINK_CLASSES}>
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
        <button onClick={() => router.push('/exam')} className={BACK_LINK_CLASSES}>
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
                    <button
                      onClick={(e) => handleDeleteTopic(e, topic)}
                      className="p-1.5 rounded-lg bg-error-container/30 hover:bg-error-container group/del transition-all cursor-pointer"
                      title="Delete this topic from Supabase"
                      aria-label="Delete topic from Supabase"
                    >
                      <XIcon className="w-3.5 h-3.5 text-error" />
                    </button>
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

  // --- DISCLAIMER MODAL ---
  if (!isDisclaimerAccepted) {
    return (
      <ExamDisclaimerModal
        selectedCategory={selectedCategory}
        onAccept={() => setIsDisclaimerAccepted(true)}
        onGoBack={() => {
          setSelectedCategory(null);
          if (department) {
            router.push(`/exam?department=${encodeURIComponent(department)}`);
          } else {
            router.push('/exam');
          }
        }}
      />
    );
  }

  // --- RESULTS VIEW ---
  if (isFinished) {
    return (
      <ExamResultsView
        quizScore={quizScore}
        filteredQuestions={filteredQuestions}
        userAnswers={userAnswers}
        timeLeft={timeLeft}
        selectedCategory={selectedCategory}
        department={department}
        topicMeta={topicMeta}
        formatTime={formatTime}
        getHumorMessage={getHumorMessage}
        onReview={() => { setIsFinished(false); setIsReviewMode(true); setCurrentIndex(0); }}
        onRestart={resetExam}
      />
    );
  }

  // --- LIVE EXAM ---
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
              timeLeft <= TIMER_WARNING_SECONDS
                ? 'bg-error-container/30 border-error/40'
                : timeLeft <= TIMER_URGENT_SECONDS
                  ? 'bg-tertiary-fixed-dim/30 border-tertiary/40'
                  : 'bg-secondary-fixed-dim/30 border-secondary/40'
            }`}>
              <Timer className={`w-4 h-4 ${timeLeft <= TIMER_WARNING_SECONDS ? 'text-error' : timeLeft <= TIMER_URGENT_SECONDS ? 'text-tertiary' : 'text-secondary'}`} />
              <span className={`font-mono text-sm font-bold tabular-nums tracking-tight ${
                timeLeft <= TIMER_WARNING_SECONDS ? 'text-error' : timeLeft <= TIMER_URGENT_SECONDS ? 'text-tertiary' : 'text-secondary'
              }`}>
                {formatTime(timeLeft)}
              </span>
            </div>
          )}
        </div>

        <div className="flex items-center gap-3">
          {timeLeft !== null && (
            <div className="sm:hidden flex items-center gap-2 px-3 py-1.5 rounded-lg bg-surface-container border border-outline-variant">
              <Timer className={`w-3.5 h-3.5 ${timeLeft <= TIMER_WARNING_SECONDS ? 'text-error' : timeLeft <= TIMER_URGENT_SECONDS ? 'text-tertiary' : 'text-secondary'}`} />
              <span className={`font-mono text-xs font-bold tabular-nums ${timeLeft <= TIMER_WARNING_SECONDS ? 'text-error' : timeLeft <= TIMER_URGENT_SECONDS ? 'text-tertiary' : 'text-secondary'}`}>
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
          <ExamQuestionPanel
            question={currentQuestion}
            index={currentIndex}
            total={filteredQuestions.length}
            userAnswers={userAnswers}
            isReviewMode={isReviewMode}
            onSelectAnswer={handleSelectAnswer}
            onNext={handleNext}
            onPrevious={handlePrevious}
            hasNext={currentIndex < filteredQuestions.length - 1}
            hasPrevious={currentIndex > 0}
          />
          {/* Right: Navigator Sidebar */}

          {/* Right: Navigator Sidebar */}
          <ExamNavigator
            filteredQuestions={filteredQuestions}
            userAnswers={userAnswers}
            currentIndex={currentIndex}
            isReviewMode={isReviewMode}
            onNavigate={(idx) => setCurrentIndex(idx)}
            onFinish={handleFinish}
          />
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
    <Suspense fallback={<PageSkeleton />}>
      <ExamContent />
    </Suspense>
  );
}
