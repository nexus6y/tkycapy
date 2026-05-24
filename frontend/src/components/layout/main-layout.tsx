'use client';
import { useState, useEffect } from 'react';
import { usePathname } from 'next/navigation';
import Sidebar from './sidebar';
import Navbar from './navbar';
import TagsView from './tags-view';

function moduleFromPath(path: string) {
  if (path.startsWith('/material-category') || path.startsWith('/material-param') || path === '/material' || path.startsWith('/material/') || path.startsWith('/material-approval')) return 'foundation';
  if (path.startsWith('/project')) return 'foundation';
  if (path.startsWith('/contract')) return 'foundation';
  if (path.startsWith('/sales')) return 'sales';
  if (path.startsWith('/ops')) return 'ops';
  if (path.startsWith('/purchase')) return 'purchase';
  if (path.startsWith('/quality')) return 'quality';
  if (path.startsWith('/production')) return 'production';
  if (path.startsWith('/warehouse')) return 'warehouse';
  if (path.startsWith('/cost')) return 'cost';
  if (path.startsWith('/system')) return 'system';
  return 'dashboard';
}

export default function MainLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const [collapsed, setCollapsed] = useState(false);
  const [activeModule, setActiveModule] = useState('dashboard');

  useEffect(() => {
    const mod = moduleFromPath(pathname);
    if (mod !== 'dashboard') setActiveModule(mod);
  }, [pathname]);

  if (pathname === '/login') return children;

  return (
    <div className="h-screen flex flex-col bg-gray-100">
      <Navbar collapsed={collapsed} onToggleCollapse={() => setCollapsed(!collapsed)} />
      <TagsView />
      <div className="flex flex-1 overflow-hidden">
        <Sidebar collapsed={collapsed} activeModule={activeModule} onModuleChange={setActiveModule} />
        <main className="flex-1 overflow-y-auto bg-gray-50">
          {children}
        </main>
      </div>
    </div>
  );
}
