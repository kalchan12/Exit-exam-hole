import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Learning Bytes',
  description: 'Quick, focused learning bytes on Computer Science topics.',
};

export default function BytesLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
