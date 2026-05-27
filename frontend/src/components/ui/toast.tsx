'use client';
import { useEffect, useState } from 'react';
import { X } from 'lucide-react';

let toastId = 0;
const listeners: Set<(t: ToastItem) => void> = new Set();

export interface ToastItem { id: number; message: string; type: 'success'|'error'|'info'; }
export function toast(msg: string, type: 'success'|'error'|'info' = 'info') {
  const item: ToastItem = { id: ++toastId, message: msg, type };
  listeners.forEach(fn => fn(item));
  setTimeout(() => listeners.forEach(fn => fn({ ...item, id: -item.id })), 3000);
}

export function ToastContainer() {
  const [toasts, setToasts] = useState<ToastItem[]>([]);
  useEffect(() => {
    const handler = (t: ToastItem) => setToasts(prev => t.id < 0 ? prev.filter(x => x.id !== -t.id) : [...prev, t]);
    listeners.add(handler);
    return () => { listeners.delete(handler); };
  }, []);
  if (!toasts.length) return null;
  return (
    <div className="fixed top-4 right-4 z-50 flex flex-col gap-2 max-w-sm">
      {toasts.map(t => (
        <div key={t.id} className={`px-4 py-2.5 rounded-lg shadow-lg text-[14px] flex items-center gap-2 animate-in slide-in-from-right ${
          t.type === 'error' ? 'bg-[#fef0f0] text-[#f56c6c] border border-[#fde2e2]' :
          t.type === 'success' ? 'bg-[#f0f9eb] text-[#67c23a] border border-[#e1f3d8]' :
          'bg-[#ecf5ff] text-[#409eff] border border-[#d9ecff]'
        }`}>
          <span className="flex-1">{t.message}</span>
          <button onClick={() => listeners.forEach(fn => fn({ ...t, id: -t.id }))} className="shrink-0"><X className="h-3.5 w-3.5"/></button>
        </div>
      ))}
    </div>
  );
}
