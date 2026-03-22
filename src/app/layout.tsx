import type { Metadata } from 'next';
import './globals.css';
import ThemeProvider from '@/components/ThemeProvider';
import Sidebar from '@/components/Sidebar';
import ClientLayout from '@/components/ClientLayout';

import AuthProvider from '@/components/AuthProvider';

export const metadata: Metadata = {
  title: 'Exit exam - Gamified exam prep',
  description: 'Master Computer Science concepts with gamified practice questions, study notes, and progress tracking.',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="dark">
      <body className="app-background text-white min-h-screen">
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
