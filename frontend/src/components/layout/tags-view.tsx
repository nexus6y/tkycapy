'use client';
import { useRouter, usePathname } from 'next/navigation';
import { X } from 'lucide-react';
import { useState, useEffect } from 'react';

interface Tag { path: string; label: string; }
const LABELS: Record<string, string> = { '/':'工作台','/material':'物料档案','/material/create':'新增物料档案','/material-category':'物料分类','/material-param':'物料参数','/material-approval':'物料审批','/project':'项目维护','/project/query':'项目查询','/contract':'合同维护','/contract/params':'合同参数','/contract/query':'合同查询','/sales/customer':'客户档案','/sales/params':'销售参数','/sales/quotation':'报价单维护','/sales/pre-order':'分劈单维护','/sales/order':'销售订单维护','/sales/shipment':'销售出货维护','/sales/return':'销售退货维护','/sales/trace':'销售执行追溯' };
function getLabel(p:string){ return LABELS[p] || (p.includes('/create')?'新增'+LABELS[p.replace('/create','')]:p.includes('/edit')?'编辑':p.split('/').pop()||p); }

export default function TagsView() {
  const router = useRouter(); const pathname = usePathname();
  const [tags, setTags] = useState<Tag[]>([]);
  const getL = (p: string) => getLabel(p);

  useEffect(() => {
    if (pathname === '/login') return;
    setTags(prev => prev.some(t => t.path === pathname) ? prev : [...prev, { path: pathname, label: getL(pathname) }].slice(-10));
  }, [pathname]);

  if (tags.length === 0) return null;

  const close = (path: string) => {
    setTags(prev => { const n = prev.filter(t => t.path !== path); if (path === pathname && n.length > 0) router.push(n[n.length - 1].path); return n; });
  };

  return (
    <div className="h-[44px] bg-canvas border-b border-border flex items-center px-2 gap-0.5 overflow-x-auto shrink-0">
      {tags.map(tag => {
        const active = tag.path === pathname;
        return (
          <span key={tag.path} onClick={() => router.push(tag.path)}
            className={`inline-flex items-center gap-1.5 px-3 py-1 text-[13px] cursor-pointer whitespace-nowrap rounded-t-md border border-b-0 transition-colors select-none
              ${active ? 'bg-background text-primary border-border -mb-[1px]' : 'text-muted-foreground border-transparent hover:text-foreground hover:bg-muted/50'}`}
          >{tag.label}<X className="h-3 w-3 hover:text-destructive rounded-sm" onClick={e => { e.stopPropagation(); close(tag.path); }} /></span>
        );
      })}
    </div>
  );
}
