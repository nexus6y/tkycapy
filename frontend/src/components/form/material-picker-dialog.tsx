'use client';
import { useState, useEffect, useCallback } from 'react';
import api from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { ErpTable, ErpThead, ErpTh, ErpTbody, ErpTr, ErpTd, ErpEmpty, ErpPagination } from '@/components/ui/erp-table';
import { toast } from '@/components/ui/toast';

interface CategoryNode {
  id: string; code: string; name: string;
  children?: CategoryNode[];
}

interface MaterialPickerDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: (item: any) => void;
}

export function MaterialPickerDialog({ open, onOpenChange, onConfirm }: MaterialPickerDialogProps) {
  const [items, setItems] = useState<any[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(30);
  const [selected, setSelected] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  // Search
  const [code, setCode] = useState('');
  const [name, setName] = useState('');
  const [spec, setSpec] = useState('');
  const [planAttr, setPlanAttr] = useState('');

  // Category tree
  const [cats, setCats] = useState<CategoryNode[]>([]);
  const [activeCatId, setActiveCatId] = useState<string | null>(null);
  const [expanded, setExpanded] = useState<Set<string>>(new Set());

  // Build tree from flat list
  function buildTree(flat: any[]): CategoryNode[] {
    const map = new Map<string, CategoryNode>();
    flat.forEach(c => map.set(c.id, { id: c.id, code: c.code, name: c.name, children: [] }));
    const roots: CategoryNode[] = [];
    flat.forEach(c => {
      const node = map.get(c.id)!;
      if (c.parentId && map.has(c.parentId)) {
        map.get(c.parentId)!.children!.push(node);
      } else {
        roots.push(node);
      }
    });
    return roots;
  }

  // Load categories
  useEffect(() => {
    if (open) {
      api.get('/material-categories', { params: { pageSize: 999, status: 'ACTIVE' } })
        .then(r => {
          const flat: any[] = r.data.items || [];
          const tree = buildTree(flat);
          setCats(tree);
        }).catch(() => setCats([]));
    }
  }, [open]);

  // Fetch materials
  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const params: any = { page, pageSize, status: 'ACTIVE' };
      if (code) params.code = code;
      if (name) params.name = name;
      if (spec) params.specification = spec;
      if (planAttr) params.planAttribute = planAttr;
      if (activeCatId) params.categoryId = activeCatId;
      const { data } = await api.get('/materials', { params });
      setItems(data.items || []);
      setTotal(data.total || 0);
    } catch { setItems([]); setTotal(0); }
    finally { setLoading(false); }
  }, [page, pageSize, code, name, spec, planAttr, activeCatId]);

  useEffect(() => { if (open) fetchData(); }, [page, pageSize, fetchData]);

  // Reset on open
  useEffect(() => {
    if (open) { setSelected(null); setPage(1); setCode(''); setName(''); setSpec(''); setPlanAttr(''); setActiveCatId(null); }
  }, [open]);

  const handleSearch = () => { setPage(1); fetchData(); };
  const handleReset = () => { setCode(''); setName(''); setSpec(''); setPlanAttr(''); setPage(1); };

  const toggleExpand = (id: string) => {
    setExpanded(prev => { const n = new Set(prev); if (n.has(id)) n.delete(id); else n.add(id); return n; });
  };

  const renderTree = (nodes: CategoryNode[], level: number = 0) => (
    <ul className={level === 0 ? '' : 'ml-3'}>
      {nodes.map(n => (
        <li key={n.id}>
          <button
            type="button"
            onClick={() => { setActiveCatId(n.id); setPage(1); }}
            className={`w-full text-left text-[12px] px-2 py-1 rounded flex items-center gap-1
              ${activeCatId === n.id ? 'bg-[#ecf5ff] text-[#409eff] font-medium' : 'hover:bg-muted text-muted-foreground'}`}
          >
            {n.children && n.children.length > 0 && (
              <span onClick={(e) => { e.stopPropagation(); toggleExpand(n.id); }} className="text-[#909399] mr-0.5">
                {expanded.has(n.id) ? '▾' : '▸'}
              </span>
            )}
            {!n.children?.length && <span className="w-3" />}
            {n.name}
          </button>
          {n.children && n.children.length > 0 && expanded.has(n.id) && renderTree(n.children, level + 1)}
        </li>
      ))}
    </ul>
  );

  const handleConfirm = () => {
    if (!selected) { toast('请选择一条数据', 'info'); return; }
    confirmItem(selected);
  };

  // Direct confirm with a specific item — bypasses React state timing issue
  const confirmItem = (item: any) => {
    onConfirm(item);
    onOpenChange(false);
  };

  const colSpan = 9;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="!max-w-[85vw] !w-[85vw] max-h-[80vh] flex flex-col p-0 gap-0">
        <DialogHeader className="px-4 py-3 border-b border-border shrink-0 bg-white">
          <DialogTitle className="text-[15px]">选择物料</DialogTitle>
        </DialogHeader>

        <div className="flex-1 flex min-h-0 overflow-hidden">
          {/* Category Tree Sidebar */}
          <div className="w-[200px] border-r border-border overflow-y-auto shrink-0 p-3 bg-[#fafafa]">
            <button
              type="button"
              onClick={() => setActiveCatId(null)}
              className={`w-full text-left text-[12px] px-2 py-1 rounded mb-1
                ${activeCatId === null ? 'bg-[#ecf5ff] text-[#409eff] font-medium' : 'hover:bg-muted text-muted-foreground'}`}
            >全部类别</button>
            {renderTree(cats)}
          </div>

          {/* Right content */}
          <div className="flex-1 flex flex-col min-w-0">
            {/* Search */}
            <div className="px-4 py-3 border-b border-border bg-white flex items-center gap-3 flex-wrap">
              <SearchField label="物料编码"><Input className="w-[120px] h-9 rounded-md border border-border bg-background px-3 text-[13px]" value={code} onChange={e => setCode(e.target.value)} placeholder="编码" onKeyDown={e => { if (e.key === 'Enter') handleSearch(); }} /></SearchField>
              <SearchField label="物料名称"><Input className="w-[140px] h-9 rounded-md border border-border bg-background px-3 text-[13px]" value={name} onChange={e => setName(e.target.value)} placeholder="名称" onKeyDown={e => { if (e.key === 'Enter') handleSearch(); }} /></SearchField>
              <SearchField label="规格型号"><Input className="w-[120px] h-9 rounded-md border border-border bg-background px-3 text-[13px]" value={spec} onChange={e => setSpec(e.target.value)} placeholder="规格" onKeyDown={e => { if (e.key === 'Enter') handleSearch(); }} /></SearchField>
              <SearchField label="计划属性"><Input className="w-[100px] h-9 rounded-md border border-border bg-background px-3 text-[13px]" value={planAttr} onChange={e => setPlanAttr(e.target.value)} placeholder="属性" onKeyDown={e => { if (e.key === 'Enter') handleSearch(); }} /></SearchField>
              <div className="flex items-center gap-1 ml-auto">
                <Button variant="ghost" size="sm" onClick={handleReset}>重置</Button>
                <Button variant="default" size="sm" onClick={handleSearch}>查询</Button>
              </div>
            </div>

            {/* Table */}
            <div className="flex-1 overflow-auto min-h-0">
              <ErpTable>
                <ErpThead>
                  <ErpTh className="w-10" />
                  <ErpTh className="w-12">序号</ErpTh>
                  <ErpTh>物料编码</ErpTh>
                  <ErpTh>物料名称</ErpTh>
                  <ErpTh>规格型号</ErpTh>
                  <ErpTh>物料分类</ErpTh>
                  <ErpTh>物料性质</ErpTh>
                  <ErpTh>计量单位</ErpTh>
                </ErpThead>
                <ErpTbody>
                  {items.map((item, idx) => {
                    const isSel = selected?.id === item.id;
                    return (
                      <ErpTr key={item.id} className={isSel ? 'bg-[#ecf5ff]' : ''}>
                        <ErpTd>
                          <input type="radio" checked={isSel} onChange={() => setSelected(item)} className="accent-[#409eff]" />
                        </ErpTd>
                        <ErpTd className="text-[#909399]">{(page - 1) * pageSize + idx + 1}</ErpTd>
                        <ErpTd><span className="text-[#409eff] cursor-pointer" onClick={() => confirmItem(item)}>{item.code}</span></ErpTd>
                        <ErpTd>{item.name}</ErpTd>
                        <ErpTd className="text-[#909399]">{item.specification || '-'}</ErpTd>
                        <ErpTd className="text-[#909399]">{item.categoryName || '-'}</ErpTd>
                        <ErpTd>{item.materialType === 'PHYSICAL' ? '实物' : '虚拟'}</ErpTd>
                        <ErpTd>{item.unitName || item.unit || '-'}</ErpTd>
                      </ErpTr>
                    );
                  })}
                  {!loading && items.length === 0 && <ErpEmpty colSpan={colSpan} />}
                </ErpTbody>
              </ErpTable>
            </div>

            {/* Pagination */}
            <div className="shrink-0">
              <ErpPagination page={page} pageSize={pageSize} total={total}
                onPage={setPage} onPageSize={v => { setPageSize(+v); setPage(1); }} />
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-2 px-4 py-3 border-t border-border shrink-0 bg-white">
          <Button variant="outline" onClick={() => onOpenChange(false)}>取消</Button>
          <Button onClick={handleConfirm}>确定</Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

function SearchField({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex items-center gap-1.5">
      <span className="text-[12px] text-muted-foreground w-[60px] text-right shrink-0">{label}</span>
      {children}
    </div>
  );
}
