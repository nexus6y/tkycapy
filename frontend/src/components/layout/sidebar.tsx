'use client';
import { useState, useMemo } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { ChevronDown, ChevronRight } from 'lucide-react';
import { menuConfig, MenuItem } from '@/lib/menu';

function getModuleFromPath(path: string) {
  if (path.startsWith('/material-category')||path.startsWith('/material-param')||path==='/material'||path.startsWith('/material-approval')) return 'foundation';
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
    const m = getModuleFromPath(pathname);
    return m !== 'dashboard' ? m : activeModule;
  }, [pathname, activeModule]);

  const toggle = (code: string) => setExpanded(p => ({ ...p, [code]: !p[code] }));

  // Auto-expand ancestors of active item
  useMemo(() => {
    const mod = menuConfig.find(m => m.code === currentModule);
    function walk(items: MenuItem[], ancestors: string[]) {
      for (const item of items) {
        if (item.path === pathname) { ancestors.forEach(c => setExpanded(p => ({...p, [c]: true}))); return; }
        if (item.children) walk(item.children, [...ancestors, item.code]);
      }
    }
    if (mod?.children) walk(mod.children, []);
  }, [pathname, currentModule]);

  const renderItem = (item: MenuItem, depth: number) => {
    const hasKids = !!item.children?.length;
    const isActive = item.path === pathname;
    const isOpen = expanded[item.code];
    const hasActiveChild = hasKids && item.children!.some(c =>
      c.path === pathname || c.children?.some(gc => gc.path === pathname));

    return (
      <li key={item.code}>
        <div
          onClick={() => { if (hasKids) toggle(item.code); else if (item.path) router.push(item.path); }}
          className={`flex items-center h-9 text-[13px] cursor-pointer select-none transition-colors
            ${isActive ? 'bg-blue-50 text-blue-600 font-medium border-r-[3px] border-blue-600' : 'text-gray-700 hover:bg-gray-50'}`}
          style={{ paddingLeft: 20 + depth * 16 }}
        >
          <span className="w-4 flex items-center justify-center shrink-0 mr-1">
            {hasKids ? (isOpen||hasActiveChild ? <ChevronDown size={12} className="text-gray-400" /> : <ChevronRight size={12} className="text-gray-400" />) : null}
          </span>
          <span className="truncate">{item.name}</span>
        </div>
        {hasKids && (isOpen || hasActiveChild) && (
          <ul className="m-0 p-0">{item.children!.map(c => renderItem(c, depth + 1))}</ul>
        )}
      </li>
    );
  };

  if (collapsed) return <div className="w-[60px] h-full bg-white border-r border-gray-200 shrink-0 flex flex-col items-center pt-3 gap-1">
    {menuConfig.map(m => (
      <button key={m.code} onClick={() => { onModuleChange(m.code); if(m.path) router.push(m.path); }}
        className={`p-2 rounded-lg text-xs ${currentModule===m.code?'bg-blue-50 text-blue-600':'text-gray-500 hover:bg-gray-50'}`} title={m.name}>
        {m.icon}
      </button>
    ))}
  </div>;

  const mod = menuConfig.find(m => m.code === currentModule);

  return (
    <aside className="w-[200px] h-full bg-white border-r border-gray-200 flex flex-col shrink-0">
      {/* Module tabs */}
      <div className="flex flex-wrap border-b border-gray-100 bg-gray-50/50">
        {menuConfig.map(m => (
          <button key={m.code}
            onClick={() => { onModuleChange(m.code); if(m.path) router.push(m.path); }}
            className={`flex items-center gap-1 px-1.5 py-2 text-[11px] transition-colors whitespace-nowrap
              ${currentModule===m.code ? 'bg-white text-blue-600 border-b-2 border-blue-600 -mb-[1px]' : 'text-gray-500 hover:text-gray-700 hover:bg-gray-100'}`}
            title={m.name}>
            <span className="w-3.5 h-3.5 flex items-center justify-center">{m.icon}</span>
            <span className="hidden xl:inline">{m.name}</span>
          </button>
        ))}
      </div>
      {/* Menu tree */}
      <div className="flex-1 overflow-y-auto py-1">
        <ul className="m-0 p-0">{(mod?.children||[]).map(item => renderItem(item, 0))}</ul>
      </div>
    </aside>
  );
}
