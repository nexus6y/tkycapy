'use client';
import { useState, useCallback, useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { ChevronDown, ChevronRight } from 'lucide-react';
import { menuConfig, MenuItem } from '@/lib/menu';

export default function Sidebar({ collapsed }: { collapsed: boolean }) {
  const router = useRouter();
  const pathname = usePathname();
  const [expanded, setExpanded] = useState<Record<string, boolean>>({});

  // Auto-expand ancestors of current path
  useEffect(() => {
    const toExpand: string[] = [];
    function find(items: MenuItem[], ancestors: string[]) {
      for (const item of items) {
        if (item.path === pathname) { ancestors.forEach(c => toExpand.push(c)); return true; }
        if (item.children && find(item.children, [...ancestors, item.code])) { toExpand.push(item.code); return true; }
      }
      return false;
    }
    for (const mod of menuConfig) {
      if (mod.children && find(mod.children, [mod.code])) toExpand.push(mod.code);
    }
    if (toExpand.length > 0) {
      setExpanded(prev => { const next = { ...prev }; toExpand.forEach(c => next[c] = true); return next; });
    }
  }, [pathname]);

  const toggle = (code: string) => {
    setExpanded(prev => ({ ...prev, [code]: !prev[code] }));
  };

  const renderItem = (item: MenuItem, depth: number) => {
    const hasKids = !!item.children?.length;
    const isActive = item.path === pathname;
    const isOpen = expanded[item.code] === true;
    const hasActiveChild = hasKids && item.children!.some(c =>
      c.path === pathname || c.children?.some(gc => gc.path === pathname));

    return (
      <li key={item.code} className="list-none">
        <div
          onClick={() => {
            if (hasKids) toggle(item.code);
            else if (item.path) router.push(item.path);
          }}
          className={`flex items-center h-9 text-[13px] cursor-pointer select-none transition-colors border-r-[3px]
            ${isActive
              ? 'bg-blue-50 text-blue-700 font-medium border-blue-600'
              : 'text-gray-700 hover:bg-gray-50 border-transparent'}`}
          style={{ paddingLeft: 16 + depth * 14 }}
        >
          {hasKids ? (
            <span className="w-4 flex items-center justify-center shrink-0 mr-0.5 text-gray-400">
              {(isOpen || hasActiveChild) ? <ChevronDown size={12} /> : <ChevronRight size={12} />}
            </span>
          ) : (
            <span className="w-4 shrink-0 mr-0.5" />
          )}
          <span className="truncate">{item.name}</span>
          {!hasKids && item.path && (
            <span className="w-1 h-1 rounded-full bg-blue-600 ml-auto mr-3 opacity-0 group-hover:opacity-100" />
          )}
        </div>
        {hasKids && (isOpen || hasActiveChild) && (
          <ul className="m-0 p-0">
            {item.children!.map(child => renderItem(child, depth + 1))}
          </ul>
        )}
      </li>
    );
  };

  if (collapsed) {
    return (
      <div className="w-[60px] h-full bg-white border-r border-gray-200 shrink-0 flex flex-col items-center pt-3 gap-1 overflow-y-auto">
        {menuConfig.map(m => (
          <button key={m.code}
            onClick={() => { toggle(m.code); if (m.path) router.push(m.path); }}
            className={`p-2 rounded-lg text-xs ${m.path === pathname ? 'bg-blue-50 text-blue-600' : 'text-gray-500 hover:bg-gray-50'}`}
            title={m.name}>
            {m.icon}
          </button>
        ))}
      </div>
    );
  }

  return (
    <aside className="w-[220px] h-full bg-white border-r border-gray-200 flex flex-col shrink-0">
      {/* Logo area */}
      <div className="h-12 flex items-center px-4 border-b border-gray-100 shrink-0">
        <span className="text-sm font-bold text-gray-800">生产制造管家</span>
      </div>

      {/* Single accordion tree - all modules visible */}
      <div className="flex-1 overflow-y-auto py-1">
        <ul className="m-0 p-0">
          {menuConfig.map(mod => {
            const hasKids = !!mod.children?.length;
            const isOpen = expanded[mod.code] === true;
            return (
              <li key={mod.code} className="list-none">
                {/* Module header */}
                <div
                  onClick={() => { if (hasKids) toggle(mod.code); else if (mod.path) router.push(mod.path); }}
                  className={`flex items-center h-10 text-[13px] cursor-pointer select-none transition-colors border-r-[3px] font-medium
                    ${mod.path === pathname
                      ? 'bg-blue-50 text-blue-700 border-blue-600'
                      : 'text-gray-800 hover:bg-gray-50 border-transparent'}`}
                  style={{ paddingLeft: 16 }}
                >
                  <span className="w-4 flex items-center justify-center shrink-0 mr-1.5 text-gray-400">
                    {(isOpen) ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
                  </span>
                  <span className="w-4 flex items-center justify-center shrink-0 mr-2 text-gray-500">
                    {mod.icon}
                  </span>
                  <span className="truncate">{mod.name}</span>
                </div>
                {/* Children */}
                {hasKids && isOpen && (
                  <ul className="m-0 p-0 border-t border-gray-50">
                    {mod.children!.map(child => renderItem(child, 1))}
                  </ul>
                )}
              </li>
            );
          })}
        </ul>
      </div>
    </aside>
  );
}
