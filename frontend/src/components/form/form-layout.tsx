'use client';
import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { ChevronLeft } from 'lucide-react';
import { toast } from '@/components/ui/toast';

interface Section { id: string; title: string; }

export function FormLayout({ title, onSave, sections, activeSection, children }: {
  title: string; onSave: () => Promise<void> | void; sections: Section[]; activeSection: string; children: React.ReactNode;
}) {
  const router = useRouter();
  const contentRef = useRef<HTMLDivElement>(null);
  const [current, setCurrent] = useState(activeSection);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const container = contentRef.current;
    if (!container) return;
    const handleScroll = () => {
      const offsets = sections.map(s => {
        const el = document.getElementById(s.id);
        return el ? Math.abs(el.getBoundingClientRect().top - container.getBoundingClientRect().top - 100) : Infinity;
      });
      const idx = offsets.indexOf(Math.min(...offsets));
      if (idx >= 0) setCurrent(sections[idx].id);
    };
    container.addEventListener('scroll', handleScroll, { passive: true });
    return () => container.removeEventListener('scroll', handleScroll);
  }, [sections]);

  const scrollTo = (id: string) => {
    document.getElementById(id)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  const handleSave = async () => {
    if (saving) return;
    setSaving(true);
    try { await onSave(); }
    catch (e: any) {
      if (!e?.response) toast(e?.message || '保存失败', 'error');
    }
    finally { setSaving(false); }
  };

  return (
    <div className="h-full flex flex-col bg-canvas">
      {/* Action Bar */}
      <div className="h-14 bg-background border-b border-border flex items-center justify-between px-4 shrink-0">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="sm" onClick={() => router.back()}>
            <ChevronLeft className="h-4 w-4 mr-1"/>返回
          </Button>
          <h1 className="text-[15px] font-bold text-foreground">{title}</h1>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={() => router.back()}>取消</Button>
          <Button variant="default" size="sm" onClick={handleSave} disabled={saving}>{saving ? '保存中...' : '保存'}</Button>
        </div>
      </div>

      {/* Body: Anchor Nav + Content */}
      <div className="flex-1 flex overflow-hidden">
        {/* Anchor Nav */}
        <nav className="w-[160px] bg-background border-r border-border p-3 space-y-1 shrink-0 overflow-y-auto">
          {sections.map(s => (
            <button key={s.id} onClick={() => scrollTo(s.id)}
              className={`block w-full text-left text-[13px] px-3 py-2 rounded transition-colors
                ${current === s.id ? 'bg-primary-soft text-primary font-medium' : 'text-muted-foreground hover:bg-muted hover:text-foreground'}`}>
              {s.title}
            </button>
          ))}
        </nav>

        {/* Scrollable Form */}
        <div ref={contentRef} className="flex-1 overflow-y-auto p-6">
          <div className="max-w-3xl mx-auto space-y-5">
            {children}
          </div>
        </div>
      </div>
    </div>
  );
}

export function FormSection({ id, title, children }: { id: string; title: string; children: React.ReactNode }) {
  return (
    <section id={id} className="bg-background rounded-lg border shadow-sm">
      <div className="px-5 py-3 bg-[#f5f7fa] border-b border-border rounded-t-lg">
        <h2 className="text-[14px] font-bold text-foreground">{title}</h2>
      </div>
      <div className="p-5">{children}</div>
    </section>
  );
}

export function FormGrid({ children }: { children: React.ReactNode }) {
  return <div className="grid grid-cols-2 gap-x-6 gap-y-4">{children}</div>;
}

export function FormField({ label, required, children }: { label: string; required?: boolean; children: React.ReactNode }) {
  return (
    <div className="flex items-start gap-3">
      <label className={`text-[13px] w-[100px] text-right shrink-0 pt-1.5 ${required ? 'text-foreground font-medium' : 'text-muted-foreground'}`}>
        {required && <span className="text-[#f56c6c] mr-0.5">*</span>}{label}
      </label>
      <div className="flex-1">{children}</div>
    </div>
  );
}
