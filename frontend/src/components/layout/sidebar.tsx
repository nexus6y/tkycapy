'use client';
import { useState, useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { ChevronDown } from 'lucide-react';
import { menuConfig, MenuItem } from '@/lib/menu';

export default function Sidebar({ collapsed }: { collapsed: boolean }) {
  const router = useRouter(); const pathname = usePathname();
  const [expanded, setExpanded] = useState<Record<string, boolean>>({});

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

  if (collapsed) {
    return (
      <div className="w-[60px] h-full bg-white border-r border-border shrink-0 flex flex-col items-center pt-4 gap-1">
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
    <aside className="w-[200px] h-full bg-white border-r border-border flex flex-col shrink-0">
      {/* Logo / title */}
      <div className="h-[50px] flex items-center px-5 border-b border-border shrink-0">
        <span className="text-[15px] font-bold text-foreground tracking-wide">生产制造管家</span>
      </div>

      {/* Menu tree */}
      <div className="flex-1 overflow-y-auto overflow-x-hidden py-1">
        {menuConfig.map(mod => {
          const hasKids = !!mod.children?.length;
          const isOpen = expanded[mod.code];
          const isActive = mod.path === pathname;
          const hasActiveChild = hasKids && mod.children!.some(c =>
            c.path === pathname || c.children?.some(gc => gc.path === pathname || gc.children?.some(ggc => ggc.path === pathname)));

          return (
            <div key={mod.code}>
              {/* Module header */}
              <div
                onClick={() => { if (hasKids) toggle(mod.code); else if (mod.path) router.push(mod.path); }}
                className={`flex items-center h-10 text-[14px] cursor-pointer select-none transition-colors
                  ${isActive ? 'text-primary bg-primary-soft border-r-[3px] border-primary font-medium' : 'text-foreground hover:bg-muted border-r-[3px] border-transparent'}
                  ${hasKids && !isActive ? 'font-medium' : ''}`}
                style={{ paddingLeft: 20 }}
              >
                <span className="w-4 flex items-center justify-center shrink-0 mr-2 text-muted-foreground">{mod.icon}</span>
                <span className="truncate flex-1">{mod.name}</span>
                {hasKids && (
                  <ChevronDown className={`h-3.5 w-3.5 mr-3 text-muted-foreground shrink-0 transition-transform duration-200 ${isOpen || hasActiveChild ? '' : '-rotate-90'}`} />
                )}
              </div>
              {/* Sub items */}
              {hasKids && (isOpen || hasActiveChild) && mod.children!.map(c => (
                <SubItem key={c.code} item={c} depth={1} pathname={pathname} router={router} expanded={expanded} toggle={toggle} />
              ))}
            </div>
          );
        })}
      </div>
    </aside>
  );
}

function SubItem({ item, depth, pathname, router, expanded, toggle }: {
  item: MenuItem; depth: number; pathname: string;
  router: ReturnType<typeof useRouter>; expanded: Record<string, boolean>; toggle: (code: string) => void;
}) {
  const hasKids = !!item.children?.length;
  const isActive = item.path === pathname;
  const isOpen = expanded[item.code];
  const hasActiveChild = hasKids && item.children!.some(c =>
    c.path === pathname || c.children?.some(gc => gc.path === pathname));

  return (
    <div>
      <div
        onClick={() => { if (hasKids) toggle(item.code); else if (item.path) router.push(item.path); }}
        className={`flex items-center h-9 text-[14px] cursor-pointer select-none transition-colors relative
          ${isActive ? 'text-primary bg-primary-soft border-r-[3px] border-primary font-medium' : 'text-foreground/85 hover:bg-muted border-r-[3px] border-transparent'}
          ${depth > 1 ? '' : ''}`}
        style={{ paddingLeft: 20 + depth * 18 }}
      >
        {/* Dashed line for nested items */}
        {depth > 1 && (
          <span className="absolute left-[20px] top-0 bottom-0 w-[1px] border-l border-dashed border-border/70" style={{ left: 20 + (depth - 1) * 18 - 10 }} />
        )}
        {hasKids ? (
          <ChevronDown className={`h-3 w-3 mr-1.5 text-muted-foreground shrink-0 transition-transform duration-200 ${isOpen || hasActiveChild ? '' : '-rotate-90'}`} />
        ) : (
          <span className="w-[16px] mr-1.5 shrink-0" />
        )}
        <span className="truncate">{item.name}</span>
      </div>
      {hasKids && (isOpen || hasActiveChild) && item.children!.map(c => (
        <SubItem key={c.code} item={c} depth={depth + 1} pathname={pathname} router={router} expanded={expanded} toggle={toggle} />
      ))}
    </div>
  );
}
