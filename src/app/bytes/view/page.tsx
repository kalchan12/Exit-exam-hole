'use client';

import { useState, useEffect } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import Link from 'next/link';
import { getBytes, getQuestions, type Byte, type Question } from '@/lib/dataLoader';
import { fetchGitHubNote } from '@/lib/githubFetcher';
import { getProgress, recordByteCompleted, syncProgressToRemote } from '@/lib/progressManager';
import { useAuth } from '@/components/AuthProvider';

export default function ByteViewPage() {
  const searchParams = useSearchParams();
  const id = searchParams.get('id');
  const router = useRouter();
  const { user } = useAuth();

  const [byte, setByte] = useState<Byte | null>(null);
  const [allBytes, setAllBytes] = useState<Byte[]>([]);
  const [relatedQuestions, setRelatedQuestions] = useState<Question[]>([]);
  const [loading, setLoading] = useState(true);
  const [isCompleted, setIsCompleted] = useState(false);

  const [selectedAnswers, setSelectedAnswers] = useState<Record<string, string>>({});
  const [revealedHints, setRevealedHints] = useState<Record<string, boolean>>({});

  useEffect(() => {
    if (!id) { setLoading(false); return; }
    async function loadData() {
      const bytes = await getBytes();
      const sorted = [...bytes].sort((a, b) => {
        const dateA = a.date ? new Date(a.date).getTime() : 0;
        const dateB = b.date ? new Date(b.date).getTime() : 0;
        return dateB - dateA;
      });
      setAllBytes(sorted);
      let current = sorted.find((b) => b.id === id);
      
      if (current && !current.content && current.githubUrl) {
         try {
            const fresh = await fetchGitHubNote(current.githubUrl, current.topic);
            current = { ...current, content: fresh.body || '' };
         } catch (e) {
            console.error('Failed to auto-fetch GitHub byte:', e);
         }
      }

      setByte(current || null);
      if (id) {
        const state = getProgress();
        setIsCompleted(!!state.completedBytes?.[id]);
      }
      if (current && current.relatedQuestionIds && current.relatedQuestionIds.length > 0) {
        const allQuestions = await getQuestions();
        setRelatedQuestions(allQuestions.filter(q => current.relatedQuestionIds!.includes(q.id)));
      }
      setLoading(false);
    }
    loadData();
  }, [id]);

  if (loading) {
    return (
      <div className="animate-pulse space-y-6 max-w-3xl mx-auto">
        <div className="h-8 bg-gray-200 dark:bg-dark-700 w-24 rounded-lg" />
        <div className="h-12 bg-gray-200 dark:bg-dark-700 rounded-xl w-3/4" />
        <div className="h-48 bg-gray-200 dark:bg-dark-700 rounded-xl w-full" />
      </div>
    );
  }

  if (!byte) {
    return (
      <div className="max-w-3xl mx-auto text-center py-20">
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">Byte not found</h2>
        <button onClick={() => router.push('/bytes')} className="btn-primary">
          Return to Bytes
        </button>
      </div>
    );
  }

  const currentIndex = allBytes.findIndex((b) => b.id === id);
  const prevByte = currentIndex > 0 ? allBytes[currentIndex - 1] : null;
  const nextByte = currentIndex < allBytes.length - 1 ? allBytes[currentIndex + 1] : null;

  return (
    <div className="max-w-7xl mx-auto pb-20 animate-in">
      <Link href="/bytes" className="inline-flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400 hover:text-accent-purple-glow transition-colors mb-6">
        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M10 19l-7-7m0 0l7-7m-7 7h18" />
        </svg>
        Back to Learning Bytes
      </Link>

      <div className="bg-white dark:bg-dark-800 border border-gray-200 dark:border-dark-400/30 rounded-2xl overflow-hidden shadow-2xl">
        {/* Header */}
        <div className="overflow-hidden relative bg-gradient-to-r from-dark-800 to-dark-700 p-8 sm:p-10 border-b border-gray-200 dark:border-dark-400/30">
          <div className="absolute top-0 right-0 p-8 opacity-10 pointer-events-none">
            <svg className="w-48 h-48 text-accent-purple" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M13 10V3L4 14h7v7l9-11h-7z" />
            </svg>
          </div>
          <div className="relative z-10">
            <div className="flex flex-wrap items-center gap-3 mb-4">
               <span className="text-[10px] font-bold uppercase tracking-wider px-2.5 py-1.5 rounded-md border text-accent-purple-glow border-accent-purple/30 bg-accent-purple/10">
                 {byte.topic}
               </span>
               <span className="text-gray-500 dark:text-gray-400 text-sm">{byte.date ? new Date(byte.date).toLocaleDateString() : 'Unknown Date'}</span>
            </div>
            <h1 className="text-3xl sm:text-4xl font-bold text-gray-900 dark:text-white leading-tight">
              {byte.title}
            </h1>
          </div>
        </div>

        {/* Text Content */}
        <div className="p-8 sm:p-10">
          <div className="prose prose-invert prose-purple max-w-none text-gray-700 dark:text-gray-300 md:text-lg leading-relaxed mb-10">
            <ReactMarkdown remarkPlugins={[remarkGfm]}>
              {byte.content}
            </ReactMarkdown>
          </div>

          {/* Media */}
          {(byte.images?.length || byte.videoUrl || (byte.videoUrls && byte.videoUrls.length > 0)) && (
            <div className="my-10 space-y-6">
              {/* List of videoUrls */}
              {byte.videoUrls && byte.videoUrls.length > 0 ? (
                byte.videoUrls.map((url, idx) => (
                  <div key={idx} className="aspect-video rounded-xl overflow-hidden shadow-lg border border-gray-200 dark:border-dark-400/20 bg-gray-100 dark:bg-dark-900">
                    <iframe
                      src={url.replace("watch?v=", "embed/")}
                      className="w-full h-full"
                      allowFullScreen
                      title={`Video Embed ${idx + 1}`}
                    />
                  </div>
                ))
              ) : (
                /* Fallback legacy videoUrl */
                byte.videoUrl && (
                  <div className="aspect-video rounded-xl overflow-hidden shadow-lg border border-gray-200 dark:border-dark-400/20 bg-gray-100 dark:bg-dark-900">
                    <iframe
                      src={byte.videoUrl.replace("watch?v=", "embed/")}
                      className="w-full h-full"
                      allowFullScreen
                      title="Video Embed"
                    />
                  </div>
                )
              )}
              {byte.images && byte.images.length > 0 && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {byte.images.map((img, i) => (
                    <img key={i} src={img} alt={`Media ${i+1}`} className="rounded-xl border border-gray-200 dark:border-dark-400/30 w-full object-cover shadow-lg" />
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Reinforcement Questions */}
          {relatedQuestions.length > 0 && (
            <div className="mt-12 bg-gray-100 dark:bg-dark-700/30 border border-gray-200 dark:border-dark-400/30 rounded-xl p-6 sm:p-8">
              <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-6 flex items-center gap-2">
                <svg className="w-6 h-6 text-accent-purple" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                Check Your Understanding
              </h3>

              <div className="space-y-8">
                {relatedQuestions.map((q, qIndex) => {
                  const isAnswered = selectedAnswers[q.id] !== undefined;
                  const isCorrect = selectedAnswers[q.id] === q.answer;
                  return (
                    <div key={q.id} className="bg-white dark:bg-dark-800 border border-gray-200 dark:border-dark-400/50 rounded-xl p-5 shadow-inner">
                      <p className="text-gray-700 dark:text-gray-200 font-medium mb-4 text-lg">
                        {qIndex + 1}. {q.question}
                      </p>
                      <div className="space-y-3">
                        {q.options.map((option, oIndex) => {
                          const isSelected = selectedAnswers[q.id] === option;
                          const isSuccess = isAnswered && option === q.answer;
                          const isFail = isAnswered && isSelected && !isCorrect;
                          let btnClass = "w-full text-left px-4 py-3 rounded-lg border transition-all duration-200 flex items-center justify-between ";
                          if (!isAnswered) btnClass += "border-gray-200 dark:border-dark-400/30 hover:border-accent-purple/50 hover:bg-dark-700/50 bg-gray-100 dark:bg-dark-700/20 text-gray-700 dark:text-gray-300";
                          else if (isSuccess) btnClass += "border-green-500 bg-green-500/10 text-green-400 font-medium";
                          else if (isFail) btnClass += "border-red-500 bg-red-500/10 text-red-400";
                          else btnClass += "border-gray-200 dark:border-dark-400/30 opacity-50 bg-dark-700/10 text-gray-500 dark:text-gray-400";
                          return (
                            <button key={oIndex} disabled={isAnswered} onClick={() => setSelectedAnswers(prev => ({ ...prev, [q.id]: option }))} className={btnClass}>
                              <span>{String.fromCharCode(65 + oIndex)}. {option}</span>
                              {isSuccess && <svg className="w-5 h-5 text-green-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" /></svg>}
                              {isFail && <svg className="w-5 h-5 text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" /></svg>}
                            </button>
                          );
                        })}
                      </div>
                      {isAnswered && (
                        <div className={`mt-4 p-4 rounded-lg text-sm ${isCorrect ? 'bg-green-500/10 text-green-200' : 'bg-red-500/10 text-red-200'}`}>
                          <strong className="block mb-1">{isCorrect ? 'Correct!' : 'Incorrect.'}</strong>
                          {q.explanation}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Byte Completion */}
      <div className="mt-8 flex flex-col items-center justify-center p-8 rounded-2xl bg-gray-100 dark:bg-white/[0.03] border border-gray-200 dark:border-white/5 text-center relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-accent-purple/5 to-transparent pointer-events-none" />
        {isCompleted ? (
          <div className="flex flex-col items-center relative z-10 animate-in fade-in zoom-in duration-500">
            <div className="w-16 h-16 rounded-2xl bg-emerald-500/10 text-emerald-400 flex items-center justify-center mb-4 border border-emerald-500/20">
              <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <h3 className="text-xl font-black text-gray-900 dark:text-white mb-2">Byte Mastered!</h3>
            <p className="text-gray-500 dark:text-gray-400 text-sm max-w-xs">Great work! +5 XP earned for completing this byte.</p>
          </div>
        ) : (
          <div className="flex flex-col items-center relative z-10">
            <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-2">Finished Reading?</h3>
            <p className="text-gray-500 dark:text-gray-400 text-sm mb-6 max-w-sm">Mark this byte as completed to earn XP and grow your streak.</p>
            <button
              onClick={() => {
                if (!id || isCompleted) return;
                recordByteCompleted(id);
                setIsCompleted(true);
                if (user) syncProgressToRemote(user.id);
              }}
              className="px-8 py-3 rounded-xl font-bold bg-gradient-to-r from-emerald-600 to-green-500 text-white hover:shadow-lg hover:shadow-emerald-500/30 transition-all duration-300 active:scale-95 flex items-center gap-2"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
              </svg>
              Mark as Completed
            </button>
          </div>
        )}
      </div>

      {/* Navigation Footer */}
      <div className="flex items-center justify-between mt-8">
        {prevByte ? (
          <Link href={`/bytes/view?id=${prevByte.id}`} className="group flex-1 max-w-[48%] bg-white dark:bg-dark-800/80 border border-gray-200 dark:border-dark-400/30 hover:border-accent-purple/50 rounded-xl p-4 transition-all">
            <div className="text-xs text-gray-500 dark:text-gray-400 mb-2 uppercase tracking-wide">Previous Byte</div>
            <div className="flex items-center gap-2">
              <svg className="w-5 h-5 text-accent-purple flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
              </svg>
              <span className="text-gray-700 dark:text-gray-300 font-medium truncate group-hover:text-gray-900 dark:text-white transition-colors">{prevByte.title}</span>
            </div>
          </Link>
        ) : <div className="flex-1 max-w-[48%]" />}
        {nextByte ? (
          <Link href={`/bytes/view?id=${nextByte.id}`} className="group flex-1 max-w-[48%] bg-white dark:bg-dark-800/80 border border-gray-200 dark:border-dark-400/30 hover:border-accent-purple/50 rounded-xl p-4 transition-all text-right">
            <div className="text-xs text-gray-500 dark:text-gray-400 mb-2 uppercase tracking-wide">Next Byte</div>
            <div className="flex items-center gap-2 justify-end">
              <span className="text-gray-700 dark:text-gray-300 font-medium truncate group-hover:text-gray-900 dark:text-white transition-colors">{nextByte.title}</span>
              <svg className="w-5 h-5 text-accent-purple flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
              </svg>
            </div>
          </Link>
        ) : <div className="flex-1 max-w-[48%]" />}
      </div>
    </div>
  );
}
