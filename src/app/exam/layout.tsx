import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Exit Exam',
  description: 'Take timed exit exams with questions from past years.',
};

export default function ExamLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
