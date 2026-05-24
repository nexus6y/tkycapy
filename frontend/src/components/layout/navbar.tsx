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

  const breadcrumbs = useMemo(() => {
    const crumbs: { label: string; path?: string }[] = [{ label: '工作台', path: '/' }];
    function search(items: MenuItem[], ancestors: string[]): boolean {
      for (const item of items) {
        if (item.path === pathname) { ancestors.forEach(a => crumbs.push({ label: a })); crumbs.push({ label: item.name }); return true; }
        if (item.children && search(item.children, [...ancestors, item.name])) return true;
      }
      return false;
    }
    for (const mod of menuConfig) { if (mod.children && search(mod.children, [mod.name])) break; }
    return crumbs;
  }, [pathname]);

  return (
    <header className="h-14 bg-background border-b border-border flex items-center shrink-0 px-0">
      <button onClick={onToggle} className="p-3 hover:bg-muted text-muted-foreground transition-colors">
        <Menu className="h-4 w-4" />
      </button>
      <nav className="flex items-center gap-1 text-[14px] text-muted-foreground ml-1">
        {breadcrumbs.map((c, i) => (
          <span key={i} className="flex items-center gap-1">
            {i > 0 && <span className="mx-0.5 text-border">/</span>}
            {c.path ? (
              <button onClick={() => router.push(c.path!)} className="hover:text-primary transition-colors">
                {i === 0 ? <Home className="h-3.5 w-3.5" /> : c.label}
              </button>
            ) : (
              <span className={i === breadcrumbs.length - 1 ? 'text-foreground font-medium' : ''}>{c.label}</span>
            )}
          </span>
        ))}
      </nav>
      <div className="ml-auto flex items-center pr-3 gap-1">
        <button className="p-2 text-muted-foreground hover:text-primary rounded transition-colors"><Search className="h-4 w-4" /></button>
        <button className="p-2 text-muted-foreground hover:text-primary rounded transition-colors"><HelpCircle className="h-4 w-4" /></button>
        <div className="relative">
          <button onClick={() => setOpen(!open)} className="flex items-center gap-1.5 px-2.5 py-1.5 text-[13px] text-foreground hover:bg-muted rounded transition-colors">
            <span className="w-5 h-5 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-[12px]">{user?.name?.charAt(0)}</span>
            <span>{user?.name}</span>
          </button>
          {open && (<>
            <div className="fixed inset-0 z-10" onClick={() => setOpen(false)} />
            <div className="absolute right-0 top-full mt-1 w-36 bg-background rounded-lg shadow-sm border border-border py-1 z-20">
              <button onClick={() => { setOpen(false); router.push('/profile'); }} className="w-full text-left px-3 py-2 text-[13px] hover:bg-muted flex items-center gap-2"><Settings className="h-3.5 w-3.5" />布局设置</button>
              <button onClick={() => { setOpen(false); router.push('/change-password'); }} className="w-full text-left px-3 py-2 text-[13px] hover:bg-muted flex items-center gap-2"><Settings className="h-3.5 w-3.5" />修改密码</button>
              <hr className="my-1 border-border" />
              <button onClick={logout} className="w-full text-left px-3 py-2 text-[13px] hover:bg-muted flex items-center gap-2 text-destructive"><LogOut className="h-3.5 w-3.5" />退出登录</button>
            </div>
          </>)}
        </div>
      </div>
    </header>
  );
}
