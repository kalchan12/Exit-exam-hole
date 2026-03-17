import type { Metadata } from 'next';
import './globals.css';
import ThemeProvider from '@/components/ThemeProvider';
import Sidebar from '@/components/Sidebar';

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
          <div className="flex">
            <Sidebar />
            <main className="flex-1 lg:ml-64 min-h-screen pb-20 lg:pb-0">
              <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
                {children}
              </div>
            </main>
          </div>
        </ThemeProvider>
      </body>
    </html>
  );
}
