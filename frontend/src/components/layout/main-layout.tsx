'use client';
import { useState } from 'react';
import { usePathname } from 'next/navigation';
import Sidebar from './sidebar';
import Navbar from './navbar';
import TagsView from './tags-view';

export default function MainLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const [collapsed, setCollapsed] = useState(false);

  if (pathname === '/login') return children;

  return (
    <div className="h-screen w-screen overflow-hidden flex bg-canvas">
      <Sidebar collapsed={collapsed} />
      <div className="flex-1 flex flex-col min-w-0">
        <Navbar collapsed={collapsed} onToggle={() => setCollapsed(!collapsed)} />
        <TagsView />
        <div className="flex-1 overflow-auto p-4">
          {children}
        </div>
      </div>
    </div>
  );
}
