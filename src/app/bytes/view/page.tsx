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
import { ChevronLeft, ChevronRight, CheckCircle, HelpCircle, Check, X } from 'lucide-react';

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
      <div className="animate-pulse space-y-6 max-w-3xl mx-auto py-4">
        <div className="h-8 bg-surface-container-highest w-24 rounded-lg" />
        <div className="h-10 bg-surface-container-highest rounded-xl w-3/4" />
        <div className="h-48 bg-surface-container-highest rounded-xl w-full" />
      </div>
    );
  }

  if (!byte) {
    return (
      <div className="max-w-3xl mx-auto text-center py-20">
        <h2 className="text-headline-2xl font-bold text-on-surface mb-4">Byte not found</h2>
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
    <div className="max-w-7xl mx-auto pb-20 py-4">
      <Link href="/bytes" className="inline-flex items-center gap-2 text-label-sm text-on-surface-variant hover:text-primary transition-colors mb-6">
        <ChevronLeft className="w-4 h-4" />
        Back to Learning Bytes
      </Link>

      <div className="card overflow-hidden">
        {/* Header */}
        <div className="relative bg-surface-container p-8 sm:p-10 border-b border-outline-variant">
          <div className="absolute top-0 right-0 p-8 opacity-5 pointer-events-none">
            <svg className="w-48 h-48 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M13 10V3L4 14h7v7l9-11h-7z" />
            </svg>
          </div>
          <div className="relative z-10">
            <div className="flex flex-wrap items-center gap-3 mb-4">
               <span className="badge-source text-label-xs font-bold tracking-wider">
                 {byte.topic}
               </span>
               <span className="text-label-xs text-on-surface-variant">{byte.date ? new Date(byte.date).toLocaleDateString() : 'Unknown Date'}</span>
            </div>
            <h1 className="text-headline-2xl sm:text-headline-3xl font-bold text-on-surface leading-tight">
              {byte.title}
            </h1>
          </div>
        </div>

        {/* Text Content */}
        <div className="p-8 sm:p-10">
          <div className="prose max-w-none text-on-surface leading-relaxed prose-headings:text-on-surface prose-p:text-on-surface prose-strong:text-primary prose-code:text-secondary prose-pre:bg-surface-container prose-pre:border prose-pre:border-outline-variant prose-a:text-primary">
            <ReactMarkdown remarkPlugins={[remarkGfm]}>
              {byte.content}
            </ReactMarkdown>
          </div>

          {/* Media */}
          {(byte.images?.length || byte.videoUrl || (byte.videoUrls && byte.videoUrls.length > 0)) && (
            <div className="my-8 space-y-6">
              {byte.videoUrls && byte.videoUrls.length > 0 ? (
                byte.videoUrls.map((url, idx) => (
                  <div key={idx} className="aspect-video rounded-xl overflow-hidden shadow-sm border border-outline-variant bg-black">
                    <iframe
                      src={url.replace("watch?v=", "embed/")}
                      className="w-full h-full"
                      allowFullScreen
                      title={`Video Embed ${idx + 1}`}
                    />
                  </div>
                ))
              ) : (
                byte.videoUrl && (
                  <div className="aspect-video rounded-xl overflow-hidden shadow-sm border border-outline-variant bg-black">
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
                    <img key={i} src={img} alt={`Media ${i+1}`} className="rounded-xl border border-outline-variant w-full object-cover shadow-sm" />
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Reinforcement Questions */}
          {relatedQuestions.length > 0 && (
            <div className="mt-10 bg-surface-container border border-outline-variant rounded-xl p-6 sm:p-8">
              <h3 className="text-headline-xl-mobile font-bold text-on-surface mb-6 flex items-center gap-2">
                <HelpCircle className="w-5 h-5 text-primary" />
                Check Your Understanding
              </h3>

              <div className="space-y-8">
                {relatedQuestions.map((q, qIndex) => {
                  const isAnswered = selectedAnswers[q.id] !== undefined;
                  const isCorrect = selectedAnswers[q.id] === q.answer;
                  return (
                    <div key={q.id} className="card p-5">
                      <p className="text-body-base text-on-surface font-medium mb-4">
                        {qIndex + 1}. {q.question}
                      </p>
                      <div className="space-y-3">
                        {q.options.map((option, oIndex) => {
                          const isSelected = selectedAnswers[q.id] === option;
                          const isSuccess = isAnswered && option === q.answer;
                          const isFail = isAnswered && isSelected && !isCorrect;
                          let containerClass = "w-full text-left px-4 py-3 rounded-lg border transition-all duration-200 flex items-center justify-between ";
                          if (!isAnswered)
                            containerClass += "border-outline-variant hover:border-primary-fixed-dim hover:bg-surface-container-high bg-surface-container-lowest text-on-surface";
                          else if (isSuccess)
                            containerClass += "border-secondary bg-secondary-fixed-dim/10 text-secondary font-medium";
                          else if (isFail)
                            containerClass += "border-error bg-error-container/20 text-error";
                          else
                            containerClass += "border-outline-variant opacity-50 bg-surface-container text-on-surface-variant";
                          return (
                            <button key={oIndex} disabled={isAnswered}
                              onClick={() => setSelectedAnswers(prev => ({ ...prev, [q.id]: option }))}
                              className={containerClass}
                            >
                              <span>{String.fromCharCode(65 + oIndex)}. {option}</span>
                              {isSuccess && <Check className="w-5 h-5 text-secondary" />}
                              {isFail && <X className="w-5 h-5 text-error" />}
                            </button>
                          );
                        })}
                      </div>
                      {isAnswered && (
                        <div className={`mt-4 p-4 rounded-lg text-label-sm ${isCorrect ? 'bg-secondary-fixed-dim/10 text-secondary' : 'bg-error-container/20 text-error'}`}>
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
      <div className="mt-6 flex flex-col items-center justify-center p-8 rounded-xl bg-surface-container border border-outline-variant text-center relative overflow-hidden">
        {isCompleted ? (
          <div className="flex flex-col items-center animate-in fade-in zoom-in duration-500">
            <div className="w-14 h-14 rounded-xl bg-secondary-fixed-dim/30 flex items-center justify-center mb-4 border border-secondary/30">
              <CheckCircle className="w-7 h-7 text-secondary" />
            </div>
            <h3 className="text-headline-xl-mobile font-bold text-on-surface mb-2">Byte Mastered!</h3>
            <p className="text-body-base text-on-surface-variant max-w-xs">Great work! +5 XP earned for completing this byte.</p>
          </div>
        ) : (
          <div className="flex flex-col items-center">
            <h3 className="text-headline-xl-mobile font-bold text-on-surface mb-2">Finished Reading?</h3>
            <p className="text-body-base text-on-surface-variant mb-6 max-w-sm">Mark this byte as completed to earn XP and grow your streak.</p>
            <button
              onClick={() => {
                if (!id || isCompleted) return;
                recordByteCompleted(id);
                setIsCompleted(true);
                if (user) syncProgressToRemote(user.id);
              }}
              className="btn-primary inline-flex items-center gap-2"
            >
              <CheckCircle className="w-4 h-4" />
              Mark as Completed
            </button>
          </div>
        )}
      </div>

      {/* Navigation Footer */}
      <div className="flex items-center justify-between mt-6">
        {prevByte ? (
          <Link href={`/bytes/view?id=${prevByte.id}`} className="group flex-1 max-w-[48%] card p-4 hover:border-primary-fixed-dim transition-all">
            <div className="text-label-xs text-on-surface-variant mb-2 tracking-wider">Previous Byte</div>
            <div className="flex items-center gap-2">
              <ChevronLeft className="w-5 h-5 text-primary shrink-0" />
              <span className="text-label-sm text-on-surface font-medium truncate group-hover:text-primary transition-colors">{prevByte.title}</span>
            </div>
          </Link>
        ) : <div className="flex-1 max-w-[48%]" />}
        {nextByte ? (
          <Link href={`/bytes/view?id=${nextByte.id}`} className="group flex-1 max-w-[48%] card p-4 hover:border-primary-fixed-dim transition-all text-right">
            <div className="text-label-xs text-on-surface-variant mb-2 tracking-wider">Next Byte</div>
            <div className="flex items-center gap-2 justify-end">
              <span className="text-label-sm text-on-surface font-medium truncate group-hover:text-primary transition-colors">{nextByte.title}</span>
              <ChevronRight className="w-5 h-5 text-primary shrink-0" />
            </div>
          </Link>
        ) : <div className="flex-1 max-w-[48%]" />}
      </div>
    </div>
  );
}
