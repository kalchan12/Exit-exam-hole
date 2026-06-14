'use client';

import { useState, useEffect, useMemo, useCallback } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useTheme } from './ThemeProvider';
import { useAuth } from './AuthProvider';
import { getNotes, getBytes } from '@/lib/dataLoader';
import { getUnreadCount } from '@/lib/notifications';
import { getProgress } from '@/lib/progressManager';
import { Menu, X } from 'lucide-react';

const navGroups = [
  {
    group: 'Main',
    items: [
      {
        label: 'Dashboard',
        href: '/dashboard',
        icon: (
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zm10 0a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zm10 0a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
          </svg>
        ),
      },
    ]
  },
  {
    group: 'Study',
    items: [
      {
        label: 'Notes',
        href: '/notes',
        icon: (
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
        ),
      },
      {
        label: 'Documents',
        href: '/documents',
        icon: (
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m2.25 0H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" />
          </svg>
        ),
      },
      {
        label: 'Bytes',
        href: '/bytes',
        icon: (
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M13 10V3L4 14h7v7l9-11h-7z" />
          </svg>
        ),
      },
    ]
  },
  {
    group: 'Practice',
    items: [
      {
        label: 'Questions',
        href: '/questions',
        icon: (
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        ),
      },
      {
        label: 'Exit Exam',
        href: '/exam',
        icon: (
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01m-.01 4h.01" />
          </svg>
        ),
      },
    ]
  },
  {
    group: 'Analytics',
    items: [
      {
        label: 'Progress',
        href: '/progress',
        icon: (
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
          </svg>
        ),
      },
    ]
  },
  {
    group: 'Admin',
    items: [
      {
        label: 'User Management',
        href: '/admin/users',
        icon: (
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
          </svg>
        ),
      },
      {
        label: 'Question Manager',
        href: '/admin/questions',
        icon: (
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" />
          </svg>
        ),
      },
      {
        label: 'Note Manager',
        href: '/admin/notes',
        icon: (
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" />
          </svg>
        ),
      },
      {
        label: 'Byte Manager',
        href: '/admin/bytes',
        icon: (
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M13 10V3L4 14h7v7l9-11h-7z" />
          </svg>
        ),
      },
      {
        label: 'Document Manager',
        href: '/admin/documents',
        icon: (
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5m-13.5-9L12 3m0 0l4.5 4.5M12 3v13.5" />
          </svg>
        ),
      },
      {
        label: 'Bulk Import',
        href: '/admin/bulk-import',
        icon: (
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
          </svg>
        ),
      },
    ]
  },
  {
    group: 'User',
    items: [
      {
        label: 'Profile',
        href: '/profile',
        icon: (
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
          </svg>
        ),
      },
    ]
  }
];

const bottomNavItems = ['Dashboard', 'Questions', 'Exit Exam', 'Profile'];

interface SidebarProps {
  isCollapsed: boolean;
  setIsCollapsed: (val: boolean) => void;
}

export default function Sidebar({ isCollapsed, setIsCollapsed }: SidebarProps) {
  const pathname = usePathname();
  const { theme, toggleTheme } = useTheme();
  const { user, profile, loading, signOut, isGuest } = useAuth();
  const [isMobileOpen, setIsMobileOpen] = useState(false);
  const [expandedGroups, setExpandedGroups] = useState<Set<string>>(new Set(['Main']));

  const userEmail = user?.email || '';
  const truncatedEmail = userEmail.length > 20 ? userEmail.slice(0, 17) + '...' : userEmail;

  const [unreadNotes, setUnreadNotes] = useState(0);
  const [unreadBytes, setUnreadBytes] = useState(0);
  const [onlineCount, setOnlineCount] = useState(0);
  const [xp, setXp] = useState(0);
  const [streak, setStreak] = useState(0);

  useEffect(() => {
    getNotes().then(notes => setUnreadNotes(getUnreadCount('notes', notes)));
    getBytes().then(bytes => setUnreadBytes(getUnreadCount('bytes', bytes)));
    const p = getProgress();
    setXp(p.xp);
    setStreak(p.streak);
  }, []);

  useEffect(() => {
    let cancelled = false;
    const poll = async () => {
      try {
        const { supabase } = await import('@/lib/supabaseClient');
        const { data } = await supabase
          .from('user_progress')
          .select('user_id', { count: 'exact', head: true })
          .gte('updated_at', new Date(Date.now() - 300000).toISOString());
        if (!cancelled && data) setOnlineCount(Math.min(data.length || 1, 42));
      } catch { if (!cancelled) setOnlineCount(0); }
    };
    poll();
    const interval = setInterval(poll, 60000);
    return () => { cancelled = true; clearInterval(interval); };
  }, []);

  const toggleGroup = (group: string) => {
    if (group === 'Main') return;
    const next = new Set(expandedGroups);
    if (next.has(group)) {
      next.delete(group);
    } else {
      next.add(group);
    }
    setExpandedGroups(next);
  };

  useEffect(() => {
    setIsMobileOpen(false);
  }, [pathname]);

  const sidebarContent = (
    <div className="flex flex-col h-full">
      <div className={`relative ${isCollapsed ? 'py-6' : 'px-6 py-5'}`}>
        <div className="absolute inset-x-0 top-0 h-24 bg-gradient-to-b from-primary/5 to-transparent pointer-events-none" />
        {!isCollapsed && (
          <div className="flex items-center gap-3 relative">
            <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-primary to-primary-fixed-dim flex items-center justify-center text-on-primary font-bold text-sm shadow-sm flex-shrink-0">
              E
            </div>
            <div>
              <h1 className="text-primary font-bold text-lg leading-tight">ExitPrep</h1>
              <p className="text-[10px] text-on-surface-variant font-medium tracking-wide">University Portal</p>
            </div>
          </div>
        )}
        <button
          onClick={() => setIsCollapsed(!isCollapsed)}
          className="text-on-surface-variant hover:text-on-surface transition-colors p-2 rounded-lg hover:bg-surface-container-high hidden lg:flex"
        >
          <svg className={`w-5 h-5 transition-transform duration-300 ${isCollapsed ? '' : 'rotate-180'}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M11 19l-7-7 7-7m8 14l-7-7 7-7" />
          </svg>
        </button>
      </div>

      <nav className="flex-1 px-3 py-2 space-y-1 overflow-y-auto scrollbar-hide">
        {navGroups.map((group, index) => {
          const visibleItems = group.items.filter(item => {
            if (!user && (item.label === 'Progress' || item.label === 'Upload' || item.label === 'Profile')) return false;
            const isAdmin = profile?.username === 'psycho';
            if (group.group === 'Admin' && !isAdmin) return false;
            return true;
          });

          if (visibleItems.length === 0) return null;

          const isExpanded = expandedGroups.has(group.group) || isCollapsed;
          const isMain = group.group === 'Main';

          return (
            <div key={group.group}>
              {index > 0 && !isCollapsed && (
                <div className="px-4 py-1.5">
                  <button
                    onClick={() => toggleGroup(group.group)}
                    className="flex items-center justify-between w-full group"
                  >
                    <span className={`text-[10px] font-bold uppercase tracking-widest text-on-surface-variant ${isExpanded ? 'text-primary' : ''}`}>
                      {group.group}
                    </span>
                    <svg
                      className={`w-3 h-3 text-on-surface-variant transition-transform duration-200 ${isExpanded ? 'rotate-180' : ''}`}
                      fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}
                    >
                      <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                    </svg>
                  </button>
                </div>
              )}

              <div className={`space-y-0.5 overflow-hidden transition-all duration-300 ${isExpanded ? 'max-h-[500px] opacity-100' : 'max-h-0 opacity-0'}`}>
                {visibleItems.map((item) => {
                  const isActive = pathname === item.href;
                  const badge = item.label === 'Notes' ? unreadNotes : item.label === 'Bytes' ? unreadBytes : 0;
                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      className={`
                        group relative flex items-center gap-3 transition-all duration-200 rounded-xl
                        ${isActive
                          ? 'bg-primary-container text-on-primary-container font-bold'
                          : 'text-on-surface-variant hover:text-on-surface hover:bg-surface-container-high'
                        }
                        ${isCollapsed ? 'justify-center p-3' : 'px-4 py-2.5'}
                      `}
                      title={isCollapsed ? item.label : undefined}
                    >
                      <span className={`flex-shrink-0 ${isActive ? '' : ''}`}>
                        {item.icon}
                      </span>
                      {!isCollapsed && (
                        <span className="text-sm font-medium">{item.label}</span>
                      )}
                      {badge > 0 && (
                        <span className={`${isCollapsed
                          ? 'absolute -top-0.5 -right-0.5 w-4 h-4 rounded-full bg-error text-on-error flex items-center justify-center text-[8px] font-bold'
                          : 'ml-auto bg-error-container text-on-error-container text-[10px] font-bold px-2 py-0.5 rounded-full'
                        }`}>
                          {badge > 9 ? '9+' : badge}
                        </span>
                      )}
                    </Link>
                  );
                })}
              </div>
            </div>
          );
        })}
      </nav>

      {!isCollapsed && xp > 0 && (
        <div className="px-4 py-3">
          <div className="relative bg-surface-container-low rounded-xl px-4 py-2.5 overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-r from-primary/5 via-transparent to-secondary/5 pointer-events-none" />
            <div className="flex items-center gap-3 relative">
              <div className="flex items-center gap-1.5 text-sm">
                <span className="text-amber-500">⚡</span>
                <span className="font-bold text-on-surface tabular-nums">{xp.toLocaleString()}</span>
              </div>
              <div className="w-px h-4 bg-outline-variant" />
              <div className="flex items-center gap-1.5 text-sm">
                <span className="text-secondary">🔥</span>
                <span className="font-bold text-on-surface tabular-nums">{streak}</span>
              </div>
              <div className="w-px h-4 bg-outline-variant" />
              <div className="flex items-center gap-1.5 ml-auto">
                <div className="w-1.5 h-1.5 rounded-full bg-secondary animate-pulse" />
                <span className="text-[10px] font-medium text-on-surface-variant tabular-nums">{onlineCount}</span>
              </div>
            </div>
          </div>
        </div>
      )}

      <div className="relative px-4 py-4 space-y-3">
        <div className="absolute top-0 left-4 right-4 h-px bg-gradient-to-r from-transparent via-primary/10 to-transparent pointer-events-none" />
        {user && (
          <div className={`flex items-center ${isCollapsed ? 'justify-center' : 'gap-3 px-1'}`}>
            <div className="w-9 h-9 rounded-lg bg-primary-container flex items-center justify-center flex-shrink-0 text-on-primary-container text-sm font-bold">
              {userEmail[0]?.toUpperCase()}
            </div>
            {!isCollapsed && (
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-on-surface truncate">{user.user_metadata?.username || userEmail.split('@')[0]}</p>
                <button onClick={signOut} className="text-[10px] font-medium text-on-surface-variant hover:text-error transition-colors">Sign Out</button>
              </div>
            )}
          </div>
        )}

        {isGuest && (
          <Link
            href="/auth/login"
            className={`flex items-center transition-all rounded-xl text-primary hover:bg-primary-container ${isCollapsed ? 'justify-center p-3' : 'gap-3 px-4 py-2.5'}`}
          >
            <svg className="w-5 h-5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M11 16l-4-4m0 0l4-4m-4 4h14m-5 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h7a3 3 0 013 3v1" />
            </svg>
            {!isCollapsed && <span className="text-sm font-medium">Sign In</span>}
          </Link>
        )}

        <button
          onClick={toggleTheme}
          className={`flex items-center transition-all rounded-xl text-on-surface-variant hover:text-on-surface hover:bg-surface-container-high ${isCollapsed ? 'justify-center p-3' : 'gap-3 px-4 py-2.5 w-full'}`}
        >
          {theme === 'dark' ? (
            <svg className="w-5 h-5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" />
            </svg>
          ) : (
            <svg className="w-5 h-5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />
            </svg>
          )}
          {!isCollapsed && <span className="text-sm font-medium">{theme === 'dark' ? 'Light Mode' : 'Dark Mode'}</span>}
        </button>
      </div>
    </div>
  );

  return (
    <>
      <header className="lg:hidden fixed top-0 left-0 right-0 h-14 bg-surface-container-lowest z-[75] flex items-center">
        <button
          onClick={() => setIsMobileOpen(!isMobileOpen)}
          className="w-14 h-full flex items-center justify-center text-on-surface-variant hover:text-on-surface active:bg-surface-container-high transition-colors"
          aria-label="Toggle menu"
        >
          {isMobileOpen ? (
            <X className="w-5 h-5" />
          ) : (
            <Menu className="w-5 h-5" />
          )}
        </button>
        <div className="flex items-center gap-2.5 flex-1 min-w-0 pr-4">
          <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-primary to-primary-fixed-dim flex items-center justify-center text-on-primary text-[10px] font-bold shadow-sm shrink-0">
            E
          </div>
          <h1 className="text-on-surface font-bold text-sm truncate">ExitPrep</h1>
        </div>
      </header>

      <aside className={`hidden lg:flex flex-col h-screen fixed left-0 top-0 bg-surface-container-lowest z-50 transition-all duration-300 ${isCollapsed ? 'w-20' : 'w-64'}`}>
        <div className="absolute right-0 top-0 bottom-0 w-px bg-gradient-to-b from-transparent via-primary/10 to-transparent pointer-events-none" />
        {sidebarContent}
      </aside>

      <div
        className={`lg:hidden fixed inset-0 bg-black/40 backdrop-blur-sm z-[70] transition-opacity duration-300 ${isMobileOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}
        onClick={() => setIsMobileOpen(false)}
      />
      <aside
        className={`lg:hidden fixed left-0 top-0 bottom-0 w-[280px] bg-surface-container-lowest z-[80] transition-transform duration-300 transform ${isMobileOpen ? 'translate-x-0' : '-translate-x-full'}`}
      >
        <div className="absolute right-0 top-0 bottom-0 w-px bg-gradient-to-b from-transparent via-primary/10 to-transparent pointer-events-none" />
        {sidebarContent}
      </aside>
    </>
  );
}
