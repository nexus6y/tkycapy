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

export default function Sidebar({ collapsed, activeModule, onModuleChange }: {
  collapsed: boolean; activeModule: string; onModuleChange: (code: string) => void;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const [expanded, setExpanded] = useState<Record<string, boolean>>({});

  const currentModule = useMemo(() => {
    const fromPath = getModuleFromPath(pathname);
    return fromPath !== 'dashboard' ? fromPath : activeModule;
  }, [pathname, activeModule]);

  const toggle = (code: string) => setExpanded(prev => {
    const next = { ...prev, [code]: !prev[code] };
    return next;
  });

  const openMenu = (code: string) => setExpanded(prev => ({ ...prev, [code]: true }));

  const mod = menuConfig.find(m => m.code === currentModule);
  const items = mod?.children || [];

  // Auto-expand parent of active item
  useMemo(() => {
    function expandParents(list: MenuItem[], parentCodes: string[]) {
      for (const item of list) {
        if (item.path === pathname && parentCodes.length > 0) {
          parentCodes.forEach(code => openMenu(code));
        }
        if (item.children) expandParents(item.children, [...parentCodes, item.code]);
      }
    }
    expandParents(items, []);
  }, [pathname, items]);

  const renderMenuItem = (item: MenuItem, depth: number) => {
    const hasChildren = !!item.children?.length;
    const isActive = item.path === pathname;
    const isExpanded = expanded[item.code] || false;
    const hasActiveChild = hasChildren && item.children!.some(c =>
      c.path === pathname || c.children?.some(gc => gc.path === pathname)
    );

    return (
      <li key={item.code} className="list-none">
        <div
          onClick={() => {
            if (hasChildren) { toggle(item.code); }
            else if (item.path) { router.push(item.path); }
          }}
          className={`flex items-center h-9 px-4 text-[13px] cursor-pointer select-none transition-colors
            ${isActive
              ? 'bg-blue-50 text-blue-600 font-medium border-r-2 border-blue-600'
              : 'text-gray-700 hover:bg-gray-100'}
            ${depth === 0 ? 'font-medium' : ''}`}
          style={{ paddingLeft: 20 + depth * 16 }}
        >
          {hasChildren ? (
            <span className="mr-1.5 text-gray-400 shrink-0">
              {isExpanded || hasActiveChild ? <ChevronDown size={12} /> : <ChevronRight size={12} />}
            </span>
          ) : (
            <span className="w-[18px] mr-1.5 shrink-0" />
          )}
          <span className="truncate">{item.name}</span>
        </div>
        {hasChildren && (isExpanded || hasActiveChild) && (
          <ul className="p-0 m-0">
            {item.children!.map(child => renderMenuItem(child, depth + 1))}
          </ul>
        )}
      </li>
    );
  };

  if (collapsed) return null;

  return (
    <aside className="w-[200px] h-full bg-white border-r border-gray-200 flex flex-col shrink-0 overflow-hidden">
      {/* Module icon tabs */}
      <div className="flex flex-wrap border-b border-gray-100 bg-gray-50/50">
        {menuConfig.map(m => (
          <button
            key={m.code}
            onClick={() => {
              onModuleChange(m.code);
              if (m.path) router.push(m.path);
            }}
            className={`flex items-center gap-1 px-1.5 py-2 text-[11px] transition-colors whitespace-nowrap
              ${currentModule === m.code
                ? 'bg-white text-blue-600 border-b-2 border-blue-600 -mb-[1px]'
                : 'text-gray-500 hover:text-gray-700 hover:bg-gray-100'}`}
            title={m.name}
          >
            <span className="w-3.5 h-3.5 flex items-center justify-center">{m.icon}</span>
            <span className="hidden xl:inline">{m.name}</span>
          </button>
        ))}
      </div>

      {/* Menu tree */}
      <div className="flex-1 overflow-y-auto py-1.5">
        <ul className="p-0 m-0">
          {items.map(item => renderMenuItem(item, 0))}
        </ul>
      </div>
    </aside>
  );
}
