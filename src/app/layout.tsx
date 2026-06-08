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
    <html lang="en" suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{
          __html: `
            (function() {
              try {
                var theme = JSON.parse(localStorage.getItem('progress') || '{}').theme;
                if (!theme) {
                  theme = window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
                }
                document.documentElement.classList.add(theme);
              } catch(e) {}
            })();
          `
        }} />
      </head>
      <body className="app-background min-h-screen">
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
