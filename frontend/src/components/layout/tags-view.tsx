'use client';
import { useRouter, usePathname } from 'next/navigation';
import { X } from 'lucide-react';
import { useState, useEffect } from 'react';

interface Tag { path: string; label: string; }

const LABELS: Record<string, string> = {
  '/': '工作台', '/material': '物料档案', '/material-category': '物料分类',
  '/material-param': '物料参数', '/material-approval': '物料审批',
  '/project': '项目维护', '/project/query': '项目查询',
  '/contract': '合同维护', '/contract/params': '合同参数', '/contract/query': '合同查询',
};

export default function TagsView() {
  const router = useRouter();
  const pathname = usePathname();
  const [tags, setTags] = useState<Tag[]>([]);

  const getLabel = (p: string) => LABELS[p] || p.split('/').pop() || p;

  useEffect(() => {
    if (pathname === '/login') return;
    setTags(prev => prev.some(t => t.path === pathname) ? prev : [...prev, { path: pathname, label: getLabel(pathname) }].slice(-10));
  }, [pathname]);

  if (tags.length === 0) return null;

  const close = (path: string) => {
    setTags(prev => {
      const next = prev.filter(t => t.path !== path);
      if (path === pathname && next.length > 0) router.push(next[next.length - 1].path);
      return next;
    });
  };

  return (
    <div className="h-[35px] bg-[#f0f2f5] border-b border-gray-200 flex items-center px-1 gap-0 overflow-x-auto shrink-0">
      {tags.map(tag => {
        const active = tag.path === pathname;
        return (
          <span key={tag.path}
            onClick={() => router.push(tag.path)}
            className={`inline-flex items-center gap-1 px-3 py-1 text-[12px] cursor-pointer whitespace-nowrap rounded-t-md border border-b-0 transition-colors select-none
              ${active ? 'bg-white text-blue-600 border-gray-200 -mb-[1px]' : 'text-gray-600 border-transparent hover:text-gray-800 hover:bg-gray-200/50'}`}
          >
            {tag.label}
            <X size={11} className="hover:text-red-500 rounded-sm" onClick={e => { e.stopPropagation(); close(tag.path); }} />
          </span>
        );
      })}
    </div>
  );
}
