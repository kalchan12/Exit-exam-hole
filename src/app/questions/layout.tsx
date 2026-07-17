import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Practice Questions',
  description: 'Practice with randomly selected questions from all topics.',
};

export default function QuestionsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
