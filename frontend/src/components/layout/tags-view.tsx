'use client';
import { useRouter, usePathname } from 'next/navigation';
import { X } from 'lucide-react';
import { useState, useEffect } from 'react';

interface Tag { path: string; label: string; }

export default function TagsView() {
  const router = useRouter();
  const pathname = usePathname();
  const [tags, setTags] = useState<Tag[]>([]);

  // Derive label from pathname
  const getLabel = (path: string) => {
    const map: Record<string, string> = {
      '/': '工作台', '/material-category': '物料分类', '/material-param': '物料参数',
      '/material': '物料档案', '/material-approval': '物料审批',
      '/project': '项目维护', '/project/query': '项目查询',
      '/contract': '合同维护', '/contract/params': '合同参数', '/contract/query': '合同查询',
    };
    return map[path] || path.split('/').pop() || path;
  };

  useEffect(() => {
    if (pathname === '/login') return;
    setTags(prev => {
      if (prev.some(t => t.path === pathname)) return prev;
      return [...prev, { path: pathname, label: getLabel(pathname) }].slice(-10);
    });
  }, [pathname]);

  if (tags.length === 0) return null;

  const closeTag = (path: string) => {
    setTags(prev => {
      const next = prev.filter(t => t.path !== path);
      if (path === pathname && next.length > 0) {
        router.push(next[next.length - 1].path);
      }
      return next;
    });
  };

  return (
    <div className="h-[34px] bg-white border-b border-gray-200 flex items-center px-1 gap-0.5 overflow-x-auto shrink-0">
      {tags.map(tag => (
        <span key={tag.path}
          className={`flex items-center gap-1 px-2.5 py-1 text-xs rounded cursor-pointer whitespace-nowrap transition-colors
            ${tag.path === pathname ? 'bg-blue-50 text-blue-700' : 'text-gray-600 hover:bg-gray-100'}`}
          onClick={() => router.push(tag.path)}
        >
          {tag.label}
          <X size={10} className="hover:text-red-500" onClick={(e) => { e.stopPropagation(); closeTag(tag.path); }} />
        </span>
      ))}
    </div>
  );
}
