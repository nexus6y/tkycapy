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
    <div className="h-screen flex flex-col bg-gray-100">
      <Navbar collapsed={collapsed} onToggle={() => setCollapsed(!collapsed)} />
      <TagsView />
      <div className="flex flex-1 overflow-hidden">
        <Sidebar collapsed={collapsed} />
        <main className="flex-1 overflow-hidden">
          {children}
        </main>
      </div>
    </div>
  );
}
