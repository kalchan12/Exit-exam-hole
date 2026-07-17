import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Statistics',
  description: 'View detailed statistics on your exam performance.',
};

export default function StatsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
