'use client';

import { useState } from 'react';
import Sidebar from './Sidebar';
import AuthProvider from './AuthProvider';

export default function ClientLayout({ children }: { children: React.ReactNode }) {
  const [isCollapsed, setIsCollapsed] = useState(false);

  return (
    <AuthProvider>
      <div className="flex">
        <Sidebar isCollapsed={isCollapsed} setIsCollapsed={setIsCollapsed} />
        <main 
          className={`flex-1 transition-all duration-300 min-h-screen pb-20 lg:pb-0 ${
            isCollapsed ? 'lg:ml-20' : 'lg:ml-64'
          }`}
        >
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
            {children}
          </div>
        </main>
      </div>
    </AuthProvider>
  );
}
