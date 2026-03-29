'use client';

import { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useTheme } from './ThemeProvider';
import { useAuth } from './AuthProvider';

const navGroups = [
  {
    group: 'Main',
    items: [
      {
        label: 'Dashboard',
        href: '/dashboard',
        icon: (
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
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
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
        ),
      },
      {
        label: 'Bytes',
        href: '/bytes',
        icon: (
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
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
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        ),
      },
      {
        label: 'Exit Exam',
        href: '/exam',
        icon: (
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
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
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
          </svg>
        ),
      },
    ]
  },
  {
    group: 'Tools',
    items: [
      {
        label: 'Upload',
        href: '/upload',
        icon: (
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
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
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
          </svg>
        ),
      },
      {
        label: 'Question Manager',
        href: '/admin/questions',
        icon: (
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" />
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
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
          </svg>
        ),
      },
    ]
  }
];

// Items to hide from mobile sidebar because they are in Bottom Nav
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

  const toggleGroup = (group: string) => {
    if (group === 'Main') return; // Always keep Main open
    const next = new Set(expandedGroups);
    if (next.has(group)) {
      next.delete(group);
    } else {
      next.add(group);
    }
    setExpandedGroups(next);
  };

  // Close mobile menu on route change
  useEffect(() => {
    setIsMobileOpen(false);
  }, [pathname]);

  const sidebarContent = (
    <div className="flex flex-col h-full">
      {/* Sidebar Header (Logo) */}
      <div className={`flex items-center ${isCollapsed ? 'justify-center p-4' : 'justify-between px-6 py-6'}`}>
        {!isCollapsed && (
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-purple-gradient flex items-center justify-center shadow-glow-purple flex-shrink-0">
              <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
              </svg>
            </div>
            <div>
              <h1 className="text-white font-bold text-lg leading-tight italic uppercase tracking-tighter">Exit Exam</h1>
              <p className="text-[10px] text-accent-purple-light font-black uppercase tracking-widest mt-0.5">User Edition</p>
            </div>
          </div>
        )}
        <button 
          onClick={() => setIsCollapsed(!isCollapsed)} 
          className="text-gray-400 hover:text-white transition-colors p-2 rounded-lg hover:bg-white/5 hidden lg:flex"
        >
          <svg className={`w-6 h-6 transition-all duration-300 ${isCollapsed ? 'opacity-100 scale-100' : 'opacity-80 scale-90'}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h16" />
          </svg>
        </button>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-3 py-4 space-y-2 overflow-y-auto scrollbar-hide">
        {navGroups.map((group, index) => {
          const visibleItems = group.items.filter(item => {
            if (!user && (item.label === 'Progress' || item.label === 'Upload' || item.label === 'Profile')) return false;
            
            // Restrict Admin and Upload to 'psycho'
            const isAdmin = profile?.username === 'psycho';
            if ((group.group === 'Tools' || group.group === 'Admin') && !isAdmin) return false;
            
            return true;
          });

          if (visibleItems.length === 0) return null;

          const isExpanded = expandedGroups.has(group.group) || isCollapsed;
          const isMain = group.group === 'Main';

          return (
            <div key={group.group} className="relative">
              {/* Group Separator */}
              {index > 0 && !isCollapsed && (
                <div className="mx-4 my-2 h-px bg-white/5" />
              )}

              <div className={`space-y-1 rounded-2xl transition-all duration-500 ${isExpanded && !isCollapsed && !isMain ? 'bg-white/[0.02] ring-1 ring-white/10 p-1 mb-2 shadow-2xl' : ''}`}>
                {!isMain && !isCollapsed && (
                  <button 
                    onClick={() => toggleGroup(group.group)}
                    className="w-full flex items-center justify-between px-4 py-2 text-[10px] font-black uppercase tracking-[0.2em] text-gray-500 hover:text-white group transition-all"
                  >
                    <span className={`transition-colors duration-300 ${isExpanded ? 'text-accent-purple tracking-[0.3em]' : ''}`}>{group.group}</span>
                    <div className={`p-1 rounded-md bg-white/5 transition-transform duration-300 ${isExpanded ? 'rotate-180 bg-accent-purple/20 text-accent-purple' : ''}`}>
                      <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                      </svg>
                    </div>
                  </button>
                )}
                
                <div className={`space-y-1 overflow-hidden transition-all duration-500 ease-in-out ${isExpanded ? 'max-h-[500px] opacity-100' : 'max-h-0 opacity-0'}`}>
                  {visibleItems.map((item) => {
                    const isActive = pathname === item.href;
                    return (
                      <Link
                        key={item.href}
                        href={item.href}
                        className={`
                          group relative flex items-center gap-3 transition-all duration-300 rounded-xl
                          ${isActive 
                            ? 'bg-purple-gradient text-white shadow-lg shadow-purple-500/25' 
                            : 'text-gray-400 hover:text-white hover:bg-white/5'
                          }
                          ${isCollapsed ? 'justify-center px-0 py-3' : 'px-4 py-2.5'}
                        `}
                        title={isCollapsed ? item.label : undefined}
                      >
                        <div className={`flex-shrink-0 transition-transform duration-300 ${isActive ? 'scale-110' : 'group-hover:scale-110'}`}>
                          {item.icon}
                        </div>
                        {!isCollapsed && (
                          <span className={`font-bold text-sm uppercase italic tracking-tighter ${isActive ? 'translate-x-1 transition-transform' : ''}`}>
                            {item.label}
                          </span>
                        )}
                        {isActive && !isCollapsed && (
                           <div className="absolute right-2 w-1.5 h-1.5 rounded-full bg-white animate-pulse" />
                        )}
                      </Link>
                    );
                  })}
                </div>
              </div>
            </div>
          );
        })}
      </nav>

      {/* User Section */}
      <div className="px-4 py-6 border-t border-white/5 space-y-4">
        {user && (
          <div className={`flex items-center ${isCollapsed ? 'justify-center' : 'gap-3 px-2'} group`}>
             <div className="w-10 h-10 rounded-xl bg-accent-purple/20 border border-accent-purple/30 flex items-center justify-center flex-shrink-0 text-accent-purple font-black shadow-lg shadow-purple-500/10">
                {userEmail[0]?.toUpperCase()}
             </div>
             {!isCollapsed && (
               <div className="flex-1 min-w-0">
                  <p className="text-xs text-white font-black uppercase italic truncate">{user.user_metadata?.username || userEmail.split('@')[0]}</p>
                  <button onClick={signOut} className="text-[10px] font-black uppercase tracking-widest text-red-400/70 hover:text-red-400 transition-colors">Sign Out</button>
               </div>
             )}
          </div>
        )}

        {isGuest && (
          <Link 
            href="/auth/login"
            className={`w-full flex items-center transition-all rounded-xl text-accent-purple hover:text-white hover:bg-accent-purple/20 border border-accent-purple/30 bg-accent-purple/5 group ${isCollapsed ? 'justify-center p-3' : 'gap-3 px-4 py-3'}`}
          >
            <div className="relative">
              <svg className="w-5 h-5 flex-shrink-0 transform group-hover:translate-x-1 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M11 16l-4-4m0 0l4-4m-4 4h14m-5 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h7a3 3 0 013 3v1" />
              </svg>
            </div>
            {!isCollapsed && <span className="text-xs font-black uppercase tracking-widest">Login</span>}
          </Link>
        )}

        <button
          onClick={toggleTheme}
          className={`w-full flex items-center transition-all rounded-xl text-gray-400 hover:text-white hover:bg-white/5 ${isCollapsed ? 'justify-center p-3' : 'gap-3 px-4 py-3'}`}
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
          {!isCollapsed && <span className="text-xs font-black uppercase tracking-widest">{theme === 'dark' ? 'Light Mode' : 'Dark Mode'}</span>}
        </button>
      </div>
    </div>
  );

  return (
    <>
      {/* Mobile Top Header */}
      <header className="lg:hidden fixed top-0 left-0 right-0 h-16 bg-[#0a0b1e]/80 backdrop-blur-xl border-b border-white/5 z-[60] px-4 flex items-center justify-between">
         <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-purple-gradient-diagonal flex items-center justify-center flex-shrink-0 shadow-lg shadow-purple-500/20">
              <svg className="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
              </svg>
            </div>
            <h1 className="text-white font-black text-sm uppercase italic tracking-tighter">Exit Exam</h1>
         </div>
         <button 
           onClick={() => setIsMobileOpen(!isMobileOpen)}
           className="relative w-12 h-12 flex flex-col items-center justify-center rounded-2xl bg-white/5 text-white active:scale-90 transition-all group overflow-hidden"
         >
            <div className={`absolute inset-0 bg-purple-gradient opacity-0 group-active:opacity-20 transition-opacity`} />
            <div className="space-y-1.5 flex flex-col items-end">
              <div className={`h-0.5 bg-white rounded-full transition-all duration-300 ${isMobileOpen ? 'w-6 -rotate-45 translate-y-2' : 'w-6'}`} />
              <div className={`h-0.5 bg-white rounded-full transition-all duration-300 ${isMobileOpen ? 'opacity-0 w-0' : 'w-4'}`} />
              <div className={`h-0.5 bg-white rounded-full transition-all duration-300 ${isMobileOpen ? 'w-6 rotate-45 -translate-y-2' : 'w-5'}`} />
            </div>
         </button>
      </header>

      {/* Desktop Sidebar Sidebar */}
      <aside className={`hidden lg:flex flex-col h-screen fixed left-0 top-0 bg-[#0a0b1e]/80 backdrop-blur-md border-r border-[#7c3aed]/10 z-50 transition-all duration-300 ${isCollapsed ? 'w-20' : 'w-64'}`}>
        {sidebarContent}
      </aside>

      {/* Mobile Sidebar Overlay */}
      <div 
        className={`lg:hidden fixed inset-0 bg-black/60 backdrop-blur-sm z-[70] transition-opacity duration-300 ${isMobileOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}
        onClick={() => setIsMobileOpen(false)}
      />
      <aside 
        className={`lg:hidden fixed left-0 top-0 bottom-0 w-[280px] bg-[#0a0b1e] border-r border-white/10 z-[80] transition-transform duration-300 transform ${isMobileOpen ? 'translate-x-0' : '-translate-x-full'}`}
      >
        {sidebarContent}
      </aside>
    </>
  );
}
