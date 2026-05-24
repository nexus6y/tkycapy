'use client';
import { useState, useMemo } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { ChevronDown, ChevronRight } from 'lucide-react';
import { menuConfig, MenuItem } from '@/lib/menu';

function getModuleFromPath(path: string) {
  if (path.startsWith('/material-category') || path.startsWith('/material-param') || path === '/material' || path.startsWith('/material-approval')) return 'foundation';
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

export default function Sidebar({ collapsed, activeModule, onModuleChange }: { collapsed: boolean; activeModule: string; onModuleChange: (code: string) => void }) {
  const router = useRouter();
  const pathname = usePathname();
  const [expanded, setExpanded] = useState<Record<string, boolean>>({});

  // Derive module from pathname immediately (not waiting for parent state)
  const currentModule = useMemo(() => {
    const fromPath = getModuleFromPath(pathname);
    return fromPath !== 'dashboard' ? fromPath : activeModule;
  }, [pathname, activeModule]);

  const toggle = (code: string) => setExpanded(prev => ({ ...prev, [code]: !prev[code] }));

  const mod = menuConfig.find(m => m.code === currentModule);
  const items = mod?.children || [];

  const renderItem = (item: MenuItem, depth = 0) => {
    const hasChildren = !!item.children?.length;
    const isActive = item.path === pathname;
    const hasActiveChild = hasChildren && item.children!.some(c => c.path === pathname || c.children?.some(gc => gc.path === pathname));
    const isExpanded = expanded[item.code] ?? hasActiveChild;

    return (
      <div key={item.code}>
        <div
          className={`flex items-center gap-1.5 px-3 py-1.5 text-[13px] cursor-pointer transition-colors
            ${isActive ? 'bg-blue-50 text-blue-700 font-medium' : 'text-gray-700 hover:bg-gray-100'}
            ${depth === 0 ? 'mt-0.5' : ''}`}
          style={{ paddingLeft: 12 + depth * 14 }}
          onClick={() => {
            if (hasChildren) { toggle(item.code); }
            else if (item.path) { router.push(item.path); }
          }}
        >
          {hasChildren ? (
            isExpanded ? <ChevronDown size={12} className="shrink-0 text-gray-400" /> : <ChevronRight size={12} className="shrink-0 text-gray-400" />
          ) : <span className="w-3 shrink-0" />}
          <span className="truncate">{item.name}</span>
        </div>
        {hasChildren && isExpanded && item.children!.map(child => renderItem(child, depth + 1))}
      </div>
    );
  };

  if (collapsed) return null;

  return (
    <aside className="w-[200px] h-full bg-[#f8f8f8] border-r border-gray-200 flex flex-col shrink-0">
      {/* Module tabs - compact icon row */}
      <div className="flex flex-wrap border-b border-gray-200 bg-white">
        {menuConfig.map(m => (
          <button
            key={m.code}
            onClick={() => {
              onModuleChange(m.code);
              if (m.path) router.push(m.path);
            }}
            className={`flex items-center gap-1 px-2 py-2 text-xs transition-colors border-b-2 whitespace-nowrap
              ${currentModule === m.code ? 'border-blue-600 text-blue-600 bg-blue-50/50' : 'border-transparent text-gray-500 hover:text-gray-700 hover:bg-gray-50'}`}
            title={m.name}
          >
            <span className="w-3.5 h-3.5 flex items-center justify-center">{m.icon}</span>
            <span className="hidden xl:inline text-[11px]">{m.name}</span>
          </button>
        ))}
      </div>
      {/* Submenu tree */}
      <div className="flex-1 overflow-y-auto py-2">
        {items.length > 0 ? items.map(item => renderItem(item)) : (
          <div className="px-4 py-8 text-center text-gray-400 text-sm">选择模块查看菜单</div>
        )}
      </div>
    </aside>
  );
}
