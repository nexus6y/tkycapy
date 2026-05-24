'use client';
import { useRouter, usePathname } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';
import { Menu, ChevronRight, Home, Search, HelpCircle, Settings, LogOut } from 'lucide-react';
import { useState, useMemo } from 'react';
import { menuConfig, MenuItem } from '@/lib/menu';

export default function Navbar({ collapsed, onToggle }: { collapsed: boolean; onToggle: () => void }) {
  const { user, logout } = useAuth();
  const router = useRouter();
  const pathname = usePathname();
  const [open, setOpen] = useState(false);

  // Build breadcrumb from menu tree
  const breadcrumbs = useMemo(() => {
    const crumbs: { label: string; path?: string }[] = [{ label: '工作台', path: '/' }];
    function search(items: MenuItem[], ancestors: string[]): boolean {
      for (const item of items) {
        if (item.path === pathname) {
          ancestors.forEach(a => crumbs.push({ label: a }));
          crumbs.push({ label: item.name });
          return true;
        }
        if (item.children && search(item.children, [...ancestors, item.name])) return true;
      }
      return false;
    }
    for (const mod of menuConfig) {
      if (mod.children && search(mod.children, [mod.name])) break;
    }
    return crumbs;
  }, [pathname]);

  // Determine current module for display
  const moduleLabel = useMemo(() => {
    for (const mod of menuConfig) {
      function find(items: MenuItem[]): boolean {
        for (const item of items) {
          if (item.path === pathname) return true;
          if (item.children && find(item.children)) return true;
        }
        return false;
      }
      if (mod.children && find(mod.children)) return mod.name;
    }
    return '';
  }, [pathname]);

  return (
    <header className="h-12 bg-white border-b border-gray-200 flex items-center shrink-0 relative z-20">
      <button onClick={onToggle} className="px-3 py-2 hover:bg-gray-100 text-gray-500 transition-colors">
        <Menu size={18} />
      </button>
      <nav className="flex items-center gap-0.5 text-[13px] text-gray-500 ml-1">
        {breadcrumbs.map((c, i) => (
          <span key={i} className="flex items-center gap-0.5">
            {i > 0 && <span className="mx-0.5 text-gray-300">/</span>}
            {c.path ? (
              <button onClick={() => router.push(c.path!)} className="hover:text-blue-600 transition-colors">
                {i === 0 ? <Home size={14} /> : c.label}
              </button>
            ) : (
              <span className={i === breadcrumbs.length - 1 ? 'text-gray-800 font-medium' : ''}>{c.label}</span>
            )}
          </span>
        ))}
      </nav>
      <div className="ml-auto flex items-center pr-2 gap-1">
        <button className="p-2 text-gray-400 hover:text-gray-600 rounded transition-colors" title="搜索"><Search size={16} /></button>
        <button className="p-2 text-gray-400 hover:text-gray-600 rounded transition-colors" title="帮助"><HelpCircle size={16} /></button>
        <div className="relative">
          <button onClick={() => setOpen(!open)} className="flex items-center gap-1 px-2 py-1.5 text-[13px] text-gray-600 hover:bg-gray-100 rounded transition-colors">
            <span>{user?.name}</span>
          </button>
          {open && (<>
            <div className="fixed inset-0 z-10" onClick={() => setOpen(false)} />
            <div className="absolute right-0 top-full mt-1 w-36 bg-white rounded-lg shadow-lg border border-gray-200 py-1 z-20">
              <button onClick={() => { setOpen(false); router.push('/profile'); }} className="w-full text-left px-3 py-2 text-[13px] hover:bg-gray-50 flex items-center gap-2"><Settings size={14}/>布局设置</button>
              <button onClick={() => { setOpen(false); router.push('/change-password'); }} className="w-full text-left px-3 py-2 text-[13px] hover:bg-gray-50 flex items-center gap-2"><Settings size={14}/>修改密码</button>
              <hr className="my-1"/>
              <button onClick={logout} className="w-full text-left px-3 py-2 text-[13px] hover:bg-gray-50 flex items-center gap-2 text-red-600"><LogOut size={14}/>退出登录</button>
            </div>
          </>)}
        </div>
      </div>
    </header>
  );
}
