'use client';
import { useState, useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { ChevronDown } from 'lucide-react';
import { menuConfig, MenuItem } from '@/lib/menu';

export default function Sidebar({ collapsed }: { collapsed: boolean }) {
  const router = useRouter(); const pathname = usePathname();
  const [expanded, setExpanded] = useState<Record<string, boolean>>({});

  // Auto-expand ancestors
  useEffect(() => {
    const toExpand: string[] = [];
    function find(items: MenuItem[], ancestors: string[]) {
      for (const item of items) {
        if (item.path === pathname) { ancestors.forEach(c => toExpand.push(c)); return true; }
        if (item.children && find(item.children, [...ancestors, item.code])) { toExpand.push(item.code); return true; }
      }
      return false;
    }
    for (const mod of menuConfig) { if (mod.children && find(mod.children, [mod.code])) toExpand.push(mod.code); }
    if (toExpand.length) setExpanded(p => { const n = { ...p }; toExpand.forEach(c => n[c] = true); return n; });
  }, [pathname]);

  const toggle = (code: string) => setExpanded(p => ({ ...p, [code]: !p[code] }));

  const renderItem = (item: MenuItem, depth: number, isLastChild = false) => {
    const hasKids = !!item.children?.length;
    const isActive = item.path === pathname;
    const isOpen = expanded[item.code];
    const hasActiveChild = hasKids && item.children!.some(c => c.path === pathname || c.children?.some(gc => gc.path === pathname));
    const showKids = isOpen || hasActiveChild;

    return (
      <li key={item.code}>
        <div
          onClick={() => { if (hasKids) toggle(item.code); else if (item.path) router.push(item.path); }}
          className={`sidebar-item ${isActive ? 'sidebar-item-active' : 'sidebar-item-inactive'}`}
          style={{ paddingLeft: 16 + depth * 18 }}
        >
          {hasKids ? (
            <ChevronDown className={`h-3.5 w-3.5 mr-1 text-muted-foreground shrink-0 transition-transform ${isOpen || hasActiveChild ? '' : '-rotate-90'}`} />
          ) : (
            <span className="w-[18px] mr-1 shrink-0" />
          )}
          <span className="truncate">{item.name}</span>
        </div>
        {hasKids && showKids && (
          <ul className={`${depth > 0 ? 'border-l border-dashed border-border ml-[25px]' : ''}`}>
            {item.children!.map((c, i) => renderItem(c, depth + 1, i === item.children!.length - 1))}
          </ul>
        )}
      </li>
    );
  };

  if (collapsed) {
    return (
      <div className="w-[60px] h-full bg-background border-r border-border shrink-0 flex flex-col items-center pt-3 gap-1">
        {menuConfig.map(m => (
          <button key={m.code} onClick={() => { if (m.path) router.push(m.path); }}
            className={`p-2 rounded-lg text-xs ${m.path === pathname ? 'bg-primary-soft text-primary' : 'text-muted-foreground hover:bg-muted'}`} title={m.name}>
            {m.icon}
          </button>
        ))}
      </div>
    );
  }

  return (
    <aside className="w-[240px] h-full bg-background border-r border-border flex flex-col shrink-0">
      <div className="h-14 flex items-center px-4 border-b border-border shrink-0">
        <span className="text-[15px] font-bold text-foreground">生产制造管家</span>
      </div>
      <div className="flex-1 overflow-y-auto py-1">
        <ul>
          {menuConfig.map(mod => {
            const hasKids = !!mod.children?.length;
            const isOpen = expanded[mod.code];
            const isActive = mod.path === pathname;
            return (
              <li key={mod.code}>
                <div
                  onClick={() => { if (hasKids) toggle(mod.code); else if (mod.path) router.push(mod.path); }}
                  className={`sidebar-item text-[14px] font-medium ${isActive ? 'sidebar-item-active' : 'sidebar-item-inactive'}`}
                  style={{ paddingLeft: 16 }}
                >
                  <span className="w-4 flex items-center justify-center shrink-0 mr-2 text-muted-foreground">{mod.icon}</span>
                  <span className="truncate flex-1">{mod.name}</span>
                  {hasKids && (
                    <ChevronDown className={`h-3.5 w-3.5 mr-2 text-muted-foreground shrink-0 transition-transform ${isOpen ? '' : '-rotate-90'}`} />
                  )}
                </div>
                {hasKids && isOpen && (
                  <ul className="border-t border-border/50">
                    {mod.children!.map((c, i) => renderItem(c, 1, i === mod.children!.length - 1))}
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
