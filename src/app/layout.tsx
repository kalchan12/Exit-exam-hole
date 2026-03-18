import type { Metadata } from 'next';
import './globals.css';
import ThemeProvider from '@/components/ThemeProvider';
import Sidebar from '@/components/Sidebar';
import ClientLayout from '@/components/ClientLayout';

import AuthProvider from '@/components/AuthProvider';

export const metadata: Metadata = {
  title: 'CS Prep - Gamified Exam Preparation',
  description: 'Master Computer Science concepts with gamified practice questions, study notes, and progress tracking.',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="dark">
      <body className="bg-dark-900 text-white min-h-screen">
        <ThemeProvider>
          <AuthProvider>
            <ClientLayout>
              {children}
            </ClientLayout>
          </AuthProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
