import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Study Notes',
  description: 'Browse and read study notes organized by course.',
};

export default function NotesLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
