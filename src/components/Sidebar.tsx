'use client';

import { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useTheme } from './ThemeProvider';
import { useAuth } from './AuthProvider';

const navItems = [
  {
    label: 'Dashboard',
    href: '/dashboard',
    icon: (
      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zm10 0a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zm10 0a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
      </svg>
    ),
  },
  {
    label: 'Questions',
    href: '/questions',
    icon: (
      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
    ),
  },
  {
    label: 'Notes',
    href: '/notes',
    icon: (
      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
      </svg>
    ),
  },
  {
    label: 'Stats',
    href: '/stats',
    icon: (
      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
      </svg>
    ),
  },
  {
    label: 'Upload',
    href: '/upload',
    icon: (
      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
      </svg>
    ),
  },
];

interface SidebarProps {
  isCollapsed: boolean;
  setIsCollapsed: (val: boolean) => void;
}

export default function Sidebar({ isCollapsed, setIsCollapsed }: SidebarProps) {
  const pathname = usePathname();
  const { theme, toggleTheme } = useTheme();
  const { user, loading, signOut } = useAuth();

  const userEmail = user?.email || '';
  const truncatedEmail = userEmail.length > 20 ? userEmail.slice(0, 17) + '...' : userEmail;

  return (
    <>
      {/* Desktop Sidebar */}
      <aside className={`hidden lg:flex flex-col h-screen fixed left-0 top-0 bg-dark-800/90 dark:bg-dark-800/90 light:bg-white border-r border-dark-400/20 dark:border-dark-400/20 light:border-gray-200 z-50 transition-all duration-300 ${isCollapsed ? 'w-20' : 'w-64'}`}>
        {/* Logo & Toggle */}
        <div className={`flex items-center ${isCollapsed ? 'justify-center p-4' : 'justify-between px-6 py-6'}`}>
          {!isCollapsed && (
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-lg bg-purple-gradient flex items-center justify-center shadow-glow-purple flex-shrink-0">
                <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                </svg>
              </div>
              <div>
                <h1 className="text-white font-bold text-lg leading-tight">CS Prep</h1>
                <p className="text-[10px] text-accent-purple-light font-medium uppercase tracking-wider mt-0.5">Exam Mode</p>
              </div>
            </div>
          )}
          <button 
            onClick={() => setIsCollapsed(!isCollapsed)} 
            className="text-gray-400 hover:text-white transition-colors p-2 rounded-lg hover:bg-dark-700 mx-auto lg:mx-0 flex-shrink-0"
            title={isCollapsed ? 'Expand Sidebar' : 'Collapse Sidebar'}
          >
            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          </button>
        </div>

        {/* Navigation */}
        <nav className="flex-1 px-4 py-4 space-y-2 overflow-y-auto">
          {navItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className={`${pathname === item.href ? 'nav-link-active' : 'nav-link'} ${isCollapsed ? 'justify-center px-0 py-3' : ''}`}
              title={isCollapsed ? item.label : undefined}
            >
              <div className="flex-shrink-0">{item.icon}</div>
              {!isCollapsed && <span>{item.label}</span>}
            </Link>
          ))}
        </nav>

        {/* User Auth Section */}
        <div className="px-4 py-3 border-t border-dark-400/20">
          {loading ? (
            <div className={`flex items-center ${isCollapsed ? 'justify-center' : 'gap-3 px-2'}`}>
              <div className="w-8 h-8 rounded-full bg-dark-600 animate-pulse flex-shrink-0" />
            </div>
          ) : user ? (
            <div className={`flex items-center ${isCollapsed ? 'justify-center' : 'gap-3'}`}>
              {/* User avatar */}
              <div className="w-8 h-8 rounded-full bg-accent-purple/30 flex items-center justify-center flex-shrink-0 text-sm font-bold text-accent-purple-light">
                {userEmail[0]?.toUpperCase() || '?'}
              </div>
              {!isCollapsed && (
                <div className="flex-1 min-w-0">
                  <p className="text-xs text-white font-medium truncate">{truncatedEmail}</p>
                  <button
                    onClick={signOut}
                    className="text-[10px] text-red-400 hover:text-red-300 transition-colors"
                  >
                    Sign Out
                  </button>
                </div>
              )}
              {isCollapsed && (
                <button
                  onClick={signOut}
                  className="absolute opacity-0 pointer-events-none"
                  title="Sign Out"
                />
              )}
            </div>
          ) : (
            <Link
              href="/auth/login"
              className={`w-full flex items-center transition-colors rounded-xl text-accent-purple-light hover:text-white hover:bg-accent-purple/20 ${isCollapsed ? 'justify-center p-3' : 'gap-3 px-4 py-3'}`}
              title={isCollapsed ? 'Login' : undefined}
            >
              <svg className="w-5 h-5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M11 16l-4-4m0 0l4-4m-4 4h14m-5 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h7a3 3 0 013 3v1" />
              </svg>
              {!isCollapsed && <span className="text-sm font-medium">Login</span>}
            </Link>
          )}
        </div>

        {/* Theme Toggle */}
        <div className="px-4 py-4 mb-4">
          <button
            onClick={toggleTheme}
            className={`w-full flex items-center transition-colors rounded-xl text-gray-400 hover:text-white hover:bg-dark-700/50 ${isCollapsed ? 'justify-center p-3' : 'gap-3 px-4 py-3'}`}
            title={isCollapsed ? (theme === 'dark' ? 'Light Mode' : 'Dark Mode') : undefined}
          >
            {theme === 'dark' ? (
              <svg className="w-5 h-5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" />
              </svg>
            ) : (
              <svg className="w-5 h-5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />
              </svg>
            )}
            {!isCollapsed && <span className="text-sm">{theme === 'dark' ? 'Light Mode' : 'Dark Mode'}</span>}
          </button>
        </div>
      </aside>

      {/* Mobile Bottom Nav */}
      <nav className="lg:hidden fixed bottom-0 left-0 right-0 bg-dark-800/95 backdrop-blur-lg border-t border-dark-400/20 z-50 px-2 py-2">
        <div className="flex justify-around">
          {navItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className={`flex flex-col items-center gap-1 px-3 py-2 rounded-lg transition-colors ${
                pathname === item.href
                  ? 'text-accent-purple-light'
                  : 'text-gray-500 hover:text-gray-300'
              }`}
            >
              {item.icon}
              <span className="text-[10px] font-medium">{item.label}</span>
            </Link>
          ))}
          {/* Mobile auth button */}
          {!loading && !user && (
            <Link
              href="/auth/login"
              className="flex flex-col items-center gap-1 px-3 py-2 rounded-lg text-accent-purple-light transition-colors"
            >
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
              </svg>
              <span className="text-[10px] font-medium">Login</span>
            </Link>
          )}
        </div>
      </nav>

      {/* Remove Auth Modal */}
    </>
  );
}
