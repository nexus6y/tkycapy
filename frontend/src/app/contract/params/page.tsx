'use client';
import { useEffect, useState, useCallback } from 'react';
import api from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { TooltipProvider } from '@/components/ui/tooltip';
import { Pencil, Plus, Search, Trash2 } from 'lucide-react';
import { toast } from '@/components/ui/toast';
import { ErpTable, ErpThead, ErpTh, ErpTbody, ErpTr, ErpTd, ErpEmpty, ErpLink, ErpAction, ErpActionBtn, ErpTools, ErpStatus, ErpPagination } from '@/components/ui/erp-table';

interface Item { id: string; code: string; name: string; value: string | null; parentId: string | null; sortOrder: number; status: string; remark: string | null; }

const PARAM_TYPES = [
  { label: '合同类别', value: 'contract_category' },
  { label: '合同类型', value: 'contract_type' },
  { label: '采购方式', value: 'purchase_method' },
  { label: '收付方式', value: 'payment_method' },
  { label: '币种', value: 'currency' },
  { label: '金额类型', value: 'amount_type' },
];

export default function ContractParamsPage() {
  const [items, setItems] = useState<Item[]>([]);
  const [allItems, setAllItems] = useState<Item[]>([]);
  const [total, setTotal] = useState(0);
  const [pg, setPg] = useState(1); const [ps, setPs] = useState(30);
  const [sel, setSel] = useState<Set<string>>(new Set());
  const [paramType, setParamType] = useState('contract_category');
  const [s, setS] = useState({ code: '', name: '' });
  const [delId, setDelId] = useState<string | null>(null);
  const [editItem, setEditItem] = useState<Item | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ code: '', name: '', value: '', sortOrder: '0', status: 'ACTIVE', remark: '' });

  const fetchAll = useCallback(async () => {
    const { data } = await api.get('/dictionaries', { params: { pageSize: 999 } });
    setAllItems(data.items || []);
  }, []);

  useEffect(() => { fetchAll(); }, [fetchAll]);

  // Find or create parent dict for the selected type
  const getOrCreateParent = useCallback(async () => {
    const parent = allItems.find(d => d.code === paramType && !d.parentId);
    if (parent) return parent;
    // Create parent
    const { data } = await api.post('/dictionaries', { code: paramType, name: PARAM_TYPES.find(t => t.value === paramType)?.label || paramType, sortOrder: 0, status: 'ACTIVE' });
    await fetchAll();
    return data;
  }, [paramType, allItems, fetchAll]);

  // Filter items by parent
  useEffect(() => {
    const parent = allItems.find(d => d.code === paramType && !d.parentId);
    if (!parent) { setItems([]); setTotal(0); return; }
    let filtered = allItems.filter(d => d.parentId === parent.id);
    if (s.code) filtered = filtered.filter(d => d.code.includes(s.code));
    if (s.name) filtered = filtered.filter(d => d.name.includes(s.name));
    setTotal(filtered.length);
    const start = (pg - 1) * ps;
    setItems(filtered.slice(start, start + ps));
  }, [allItems, paramType, s, pg, ps]);

  const resetSearch = () => { setS({ code: '', name: '' }); setPg(1); };

  const openCreate = () => {
    setEditItem(null);
    setForm({ code: '', name: '', value: '', sortOrder: '0', status: 'ACTIVE', remark: '' });
    setShowForm(true);
  };

  const openEdit = (item: Item) => {
    setEditItem(item);
    setForm({ code: item.code, name: item.name, value: item.value || '', sortOrder: String(item.sortOrder || 0), status: item.status, remark: item.remark || '' });
    setShowForm(true);
  };

  const handleSave = async () => {
    if (!form.code || !form.name) return toast('编码和名称不能为空', 'error');
    try {
      const parent = await getOrCreateParent();
      const payload = { ...form, sortOrder: +form.sortOrder, parentId: parent.id };
      if (editItem) {
        await api.put(`/dictionaries/${editItem.id}`, payload);
        toast('修改成功', 'success');
      } else {
        // Check for parent dict code collision
        if (allItems.find(d => d.code === form.code && d.parentId === undefined)) {
          return toast('编码与参数类型标识冲突', 'error');
        }
        await api.post('/dictionaries', payload);
        toast('新增成功', 'success');
      }
      setShowForm(false);
      fetchAll();
    } catch (e: any) { toast(e.response?.data?.message || '保存失败', 'error'); }
  };

  const doDelete = async () => {
    if (!delId) return;
    try { await api.delete(`/dictionaries/${delId}`); setDelId(null); fetchAll(); toast('删除成功', 'success'); }
    catch (e: any) { toast(e.response?.data?.message || '删除失败', 'error'); setDelId(null); }
  };

  const toggleAll = (v: boolean) => setSel(v ? new Set(items.map(i => i.id)) : new Set());
  const toggleOne = (id: string, v: boolean) => { const n = new Set(sel); v ? n.add(id) : n.delete(id); setSel(n); };

  return (
    <TooltipProvider>
      <div className="bg-background rounded-lg border border-border flex flex-col min-h-0">
        <div className="flex items-center justify-between px-4 h-14 border-b border-border">
          <div className="flex items-center gap-1">
            <Button variant="secondary" size="sm" onClick={openCreate}><Plus className="h-3.5 w-3.5"/>新增</Button>
            <Button variant="outline" size="sm" disabled={sel.size !== 1} onClick={() => { const i = items.find(x => sel.has(x.id)); if (i) openEdit(i); }}>修改</Button>
            <Button variant="outline" size="sm" disabled={sel.size === 0} onClick={() => { const i = items.find(x => sel.has(x.id)); if (i) setDelId(i.id); }}>删除</Button>
          </div>
          <div className="flex items-center gap-1">
            <Button variant="ghost" size="sm" onClick={resetSearch}>重置</Button>
            <Button variant="default" size="sm" onClick={() => { setPg(1); }}><Search className="h-3.5 w-3.5 mr-1"/>搜索</Button>
          </div>
        </div>

        <div className="flex items-center gap-4 px-4 py-2.5 border-b border-border bg-muted/30 flex-wrap">
          <F label="参数类型">
            <Select value={paramType} onValueChange={(v: any) => { setParamType(v); setPg(1); }}>
              <SelectTrigger className="w-[130px] h-9 rounded-md border border-border bg-background px-3 text-[13px]"><SelectValue /></SelectTrigger>
              <SelectContent>{PARAM_TYPES.map(t => <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>)}</SelectContent>
            </Select>
          </F>
          <F label="编码"><Input className="w-[140px] h-9 rounded-md border border-border bg-background px-3 text-[13px]" value={s.code} onChange={e => setS({ ...s, code: e.target.value })} /></F>
          <F label="名称"><Input className="w-[140px] h-9 rounded-md border border-border bg-background px-3 text-[13px]" value={s.name} onChange={e => setS({ ...s, name: e.target.value })} /></F>
        </div>

        <ErpTools onRefresh={fetchAll} />

        <div className="min-h-0">
          <ErpTable>
            <ErpThead>
              <ErpTh className="w-[48px]"><Checkbox checked={items.length > 0 && sel.size === items.length} onCheckedChange={(v: boolean) => toggleAll(v)} /></ErpTh>
              <ErpTh className="w-[64px]">序号</ErpTh>
              <ErpTh className="w-[160px]">编码</ErpTh>
              <ErpTh className="w-[200px]">名称</ErpTh>
              <ErpTh className="w-[140px]">值</ErpTh>
              <ErpTh className="w-[80px]">排序</ErpTh>
              <ErpTh className="w-[80px]">状态</ErpTh>
              <ErpTh className="w-[160px]">备注</ErpTh>
              <ErpTh className="w-[120px]">操作</ErpTh>
            </ErpThead>
            <ErpTbody>
              {items.map((i, idx) => (
                <ErpTr key={i.id}>
                  <ErpTd><Checkbox checked={sel.has(i.id)} onCheckedChange={(v: boolean) => toggleOne(i.id, v)} /></ErpTd>
                  <ErpTd className="text-[#909399]">{(pg - 1) * ps + idx + 1}</ErpTd>
                  <ErpTd><ErpLink onClick={() => openEdit(i)}>{i.code}</ErpLink></ErpTd>
                  <ErpTd>{i.name}</ErpTd>
                  <ErpTd className="text-[#909399]">{i.value || '-'}</ErpTd>
                  <ErpTd>{i.sortOrder}</ErpTd>
                  <ErpTd><ErpStatus active={i.status === 'ACTIVE'} /></ErpTd>
                  <ErpTd className="text-[#909399]">{i.remark || '-'}</ErpTd>
                  <ErpTd>
                    <ErpAction>
                      <ErpActionBtn onClick={() => openEdit(i)}><Pencil className="h-3.5 w-3.5" />修改</ErpActionBtn>
                      <ErpActionBtn danger onClick={() => setDelId(i.id)}><Trash2 className="h-3.5 w-3.5" />删除</ErpActionBtn>
                    </ErpAction>
                  </ErpTd>
                </ErpTr>
              ))}
              {items.length === 0 && <ErpEmpty colSpan={9} message="暂无参数数据，请新增" />}
            </ErpTbody>
          </ErpTable>
        </div>

        <ErpPagination page={pg} pageSize={ps} total={total} onPage={setPg} onPageSize={v => setPs(+v)} />

        {/* Create/Edit Dialog */}
        {showForm && (
          <div className="fixed inset-0 z-50 flex items-center justify-center">
            <div className="absolute inset-0 bg-black/30" onClick={() => setShowForm(false)} />
            <div className="relative bg-background rounded-lg border shadow-lg w-[480px] max-h-[80vh] overflow-auto p-6 space-y-4">
              <h2 className="text-[15px] font-bold">{editItem ? '修改参数' : '新增参数'}</h2>
              <div className="space-y-3">
                <F label="编码"><Input className="h-9 rounded-md border border-border bg-background px-3 text-[13px]" value={form.code} onChange={e => setForm({ ...form, code: e.target.value })} placeholder="必填" /></F>
                <F label="名称"><Input className="h-9 rounded-md border border-border bg-background px-3 text-[13px]" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} placeholder="必填" /></F>
                <F label="值"><Input className="h-9 rounded-md border border-border bg-background px-3 text-[13px]" value={form.value} onChange={e => setForm({ ...form, value: e.target.value })} /></F>
                <F label="排序"><Input className="h-9 rounded-md border border-border bg-background px-3 text-[13px]" type="number" value={form.sortOrder} onChange={e => setForm({ ...form, sortOrder: e.target.value })} /></F>
                <F label="状态">
                  <Select value={form.status} onValueChange={(v: any) => setForm({ ...form, status: v })}>
                    <SelectTrigger className="h-9 rounded-md border border-border bg-background px-3 text-[13px]"><SelectValue /></SelectTrigger>
                    <SelectContent><SelectItem value="ACTIVE">启用</SelectItem><SelectItem value="INACTIVE">停用</SelectItem></SelectContent>
                  </Select>
                </F>
                <F label="备注"><Input className="h-9 rounded-md border border-border bg-background px-3 text-[13px]" value={form.remark} onChange={e => setForm({ ...form, remark: e.target.value })} /></F>
              </div>
              <div className="flex justify-end gap-2 pt-2">
                <Button variant="outline" size="sm" onClick={() => setShowForm(false)}>取消</Button>
                <Button variant="default" size="sm" onClick={handleSave}>保存</Button>
              </div>
            </div>
          </div>
        )}

        <AlertDialog open={!!delId} onOpenChange={() => setDelId(null)}>
          <AlertDialogContent>
            <AlertDialogHeader><AlertDialogTitle>确认删除？</AlertDialogTitle></AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>取消</AlertDialogCancel>
              <AlertDialogAction onClick={doDelete} className="bg-[#f56c6c] text-white hover:bg-[#f56c6c]/90">删除</AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </TooltipProvider>
  );
}

function F({ label, children }: { label: string; children: React.ReactNode }) {
  return <div className="flex items-center gap-1.5"><span className="text-[13px] text-muted-foreground w-[80px] text-right shrink-0">{label}</span>{children}</div>;
}
