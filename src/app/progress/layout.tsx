import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Progress',
  description: 'Track your learning progress across all subjects.',
};

export default function ProgressLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
