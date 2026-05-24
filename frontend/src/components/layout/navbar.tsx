'use client';
import { useRouter, usePathname } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';
import { Menu, ChevronRight, Home, User, Search, HelpCircle, LogOut, Settings } from 'lucide-react';
import { useState } from 'react';
import { menuConfig } from '@/lib/menu';

export default function Navbar({ collapsed, onToggleCollapse }: { collapsed: boolean; onToggleCollapse: () => void }) {
  const { user, logout } = useAuth();
  const router = useRouter();
  const pathname = usePathname();
  const [userMenuOpen, setUserMenuOpen] = useState(false);

  // Build breadcrumb from pathname
  const breadcrumbs: { label: string; path?: string }[] = [{ label: '工作台', path: '/' }];
  for (const mod of menuConfig) {
    function findPath(item: typeof mod, depth: number): string | null {
      if (item.path === pathname) return item.name;
      if (item.children) {
        for (const child of item.children) {
          const found = findPath(child as typeof mod, depth + 1);
          if (found) {
            breadcrumbs.push({ label: item.name });
            breadcrumbs.push({ label: found });
            return found;
          }
        }
      }
      return null;
    }
    if (findPath(mod, 0)) break;
  }

  return (
    <header className="h-12 bg-white border-b border-gray-200 flex items-center px-0 shrink-0">
      {/* Hamburger */}
      <button onClick={onToggleCollapse} className="px-4 py-2 hover:bg-gray-100 transition-colors text-gray-500">
        <Menu size={18} />
      </button>

      {/* Breadcrumb */}
      <nav className="flex items-center gap-1 text-sm px-2">
        {breadcrumbs.map((crumb, i) => (
          <span key={i} className="flex items-center gap-1">
            {i > 0 && <ChevronRight size={12} className="text-gray-300" />}
            {crumb.path ? (
              <button onClick={() => router.push(crumb.path!)} className="text-gray-500 hover:text-blue-600 transition-colors">
                {i === 0 ? <Home size={14} /> : crumb.label}
              </button>
            ) : (
              <span className="text-gray-700">{crumb.label}</span>
            )}
          </span>
        ))}
      </nav>

      {/* Right section */}
      <div className="ml-auto flex items-center gap-1 pr-2">
        <button className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded transition-colors" title="全局搜索">
          <Search size={16} />
        </button>
        <button className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded transition-colors" title="系统帮助">
          <HelpCircle size={16} />
        </button>

        {/* User dropdown */}
        <div className="relative">
          <button
            onClick={() => setUserMenuOpen(!userMenuOpen)}
            className="flex items-center gap-1.5 px-2.5 py-1.5 text-sm text-gray-600 hover:bg-gray-100 rounded transition-colors"
          >
            <User size={14} />
            <span>{user?.name}</span>
          </button>
          {userMenuOpen && (
            <>
              <div className="fixed inset-0 z-10" onClick={() => setUserMenuOpen(false)} />
              <div className="absolute right-0 top-full mt-1 w-36 bg-white rounded-lg shadow-lg border border-gray-200 py-1 z-20">
                <button onClick={() => { router.push('/profile'); setUserMenuOpen(false); }} className="w-full text-left px-3 py-2 text-sm hover:bg-gray-50 flex items-center gap-2">
                  <Settings size={14} /> 布局设置
                </button>
                <button onClick={() => { router.push('/change-password'); setUserMenuOpen(false); }} className="w-full text-left px-3 py-2 text-sm hover:bg-gray-50 flex items-center gap-2">
                  <Settings size={14} /> 修改密码
                </button>
                <hr className="my-1" />
                <button onClick={logout} className="w-full text-left px-3 py-2 text-sm hover:bg-gray-50 flex items-center gap-2 text-red-600">
                  <LogOut size={14} /> 退出登录
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </header>
  );
}
