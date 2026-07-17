import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Documents',
  description: 'Access study documents and reference materials.',
};

export default function DocumentsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
