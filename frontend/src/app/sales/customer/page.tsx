'use client';
import { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import api from '@/lib/api';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { TooltipProvider } from '@/components/ui/tooltip';
import { toast } from '@/components/ui/toast';
import { Pencil, Trash2 } from 'lucide-react';
import { ErpTable, ErpThead, ErpTh, ErpTbody, ErpTr, ErpTd, ErpEmpty, ErpLink, ErpAction, ErpActionBtn, ErpStatus, ErpPagination, ErpListPage } from '@/components/ui/erp-table';
import { ErpToolbar } from '@/components/ui/erp-toolbar';
import { ErpSearchFields, ErpSearchField } from '@/components/ui/erp-search-fields';

interface Item { id:string;code:string;name:string;industry:string|null;valueLevel:string|null;creditLevel:string|null;contactPerson:string|null;contactPhone:string|null;contactEmail:string|null;address:string|null;status:string;createdAt:string; }

export default function CustomerPage() {
  const router = useRouter();
  const [items, setItems] = useState<Item[]>([]);
  const [total, setTotal] = useState(0);
  const [pg, setPg] = useState(1);
  const [ps, setPs] = useState(30);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [s, setS] = useState({ code: '', name: '', status: '' });
  const [delId, setDelId] = useState<string | null>(null);

  const fetch = useCallback(async () => {
    const p: any = { page: pg, pageSize: ps };
    if (s.code) p.code = s.code;
    if (s.name) p.name = s.name;
    if (s.status) p.status = s.status;
    const { data } = await api.get('/customers', { params: p });
    setItems(data.items);
    setTotal(data.total);
  }, [pg, ps, s]);

  useEffect(() => { fetch(); }, [fetch]);

  const doDelete = async () => {
    if (!delId) return;
    try {
      await api.delete(`/customers/${delId}`);
      setDelId(null);
      fetch();
    } catch (e: any) {
      toast(e.response?.data?.message || '删除失败', 'error');
    }
  };

  const toggleAll = (v: boolean) => setSelected(v ? new Set(items.map(i => i.id)) : new Set());
  const toggleOne = (id: string, v: boolean) => {
    const n = new Set(selected);
    v ? n.add(id) : n.delete(id);
    setSelected(n);
  };

  const colSpan = 11;

  return (
    <TooltipProvider>
      <ErpListPage>
        <ErpToolbar
          addHref="/sales/customer/create"
          editDisabled={selected.size === 0}
          onEdit={() => toast('请先勾选数据', 'info')}
          deleteDisabled={selected.size === 0}
          onDelete={() => toast('请先勾选数据', 'info')}
          showExport
          onExport={() => {}}
          onReset={() => setS({ code: '', name: '', status: '' })}
          onSearch={fetch}
        />

        <ErpSearchFields>
          <ErpSearchField label="状态">
            <Select value={s.status} onValueChange={(v: any) => setS({ ...s, status: v === 'ALL' ? '' : v })}>
              <SelectTrigger className="w-[100px] h-9 rounded-md border border-border bg-background px-3 text-[13px]">
                <SelectValue placeholder="全部" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ALL">全部</SelectItem>
                <SelectItem value="ACTIVE">启用</SelectItem>
                <SelectItem value="INACTIVE">停用</SelectItem>
              </SelectContent>
            </Select>
          </ErpSearchField>
          <ErpSearchField label="客户编码">
            <Input className="w-[140px] h-9 rounded-md border border-border bg-background px-3 text-[13px]" value={s.code} onChange={e => setS({ ...s, code: e.target.value })} />
          </ErpSearchField>
          <ErpSearchField label="客户名称">
            <Input className="w-[140px] h-9 rounded-md border border-border bg-background px-3 text-[13px]" value={s.name} onChange={e => setS({ ...s, name: e.target.value })} />
          </ErpSearchField>
        </ErpSearchFields>

        <div className="min-h-0">
          <ErpTable>
            <ErpThead>
              <ErpTh className="w-[48px]">
                <Checkbox checked={items.length > 0 && selected.size === items.length} onCheckedChange={(v: boolean) => toggleAll(v)} />
              </ErpTh>
              <ErpTh className="w-[70px]">状态</ErpTh>
              <ErpTh className="w-[160px]">客户编码</ErpTh>
              <ErpTh className="w-[220px]">客户名称</ErpTh>
              <ErpTh className="w-[120px]">所属行业</ErpTh>
              <ErpTh className="w-[100px]">客户价值</ErpTh>
              <ErpTh className="w-[100px]">信用等级</ErpTh>
              <ErpTh className="w-[100px]">联系人</ErpTh>
              <ErpTh className="w-[130px]">联系电话</ErpTh>
              <ErpTh className="w-[160px]">创建时间</ErpTh>
              <ErpTh className="w-[140px] sticky right-0 bg-[#f5f7fa] z-10">操作</ErpTh>
            </ErpThead>
            <ErpTbody>
              {items.map(i => (
                <ErpTr key={i.id}>
                  <ErpTd>
                    <Checkbox checked={selected.has(i.id)} onCheckedChange={(v: boolean) => toggleOne(i.id, v)} />
                  </ErpTd>
                  <ErpTd><ErpStatus active={i.status === 'ACTIVE'} /></ErpTd>
                  <ErpTd><ErpLink onClick={() => router.push(`/sales/customer/${i.id}/edit`)}>{i.code}</ErpLink></ErpTd>
                  <ErpTd>{i.name}</ErpTd>
                  <ErpTd className="text-muted-foreground">{i.industry || '-'}</ErpTd>
                  <ErpTd>{i.valueLevel || '-'}</ErpTd>
                  <ErpTd>{i.creditLevel || '-'}</ErpTd>
                  <ErpTd>{i.contactPerson || '-'}</ErpTd>
                  <ErpTd>{i.contactPhone || '-'}</ErpTd>
                  <ErpTd className="text-muted-foreground">{new Date(i.createdAt).toLocaleDateString('zh-CN')}</ErpTd>
                  <ErpTd>
                    <ErpAction>
                      <ErpActionBtn onClick={() => router.push(`/sales/customer/${i.id}/edit`)}>
                        <Pencil className="h-3.5 w-3.5" />修改
                      </ErpActionBtn>
                      <ErpActionBtn danger onClick={() => setDelId(i.id)}>
                        <Trash2 className="h-3.5 w-3.5" />删除
                      </ErpActionBtn>
                    </ErpAction>
                  </ErpTd>
                </ErpTr>
              ))}
              {items.length === 0 && <ErpEmpty colSpan={colSpan} />}
            </ErpTbody>
          </ErpTable>
        </div>

        <ErpPagination page={pg} pageSize={ps} total={total} onPage={setPg} onPageSize={v => setPs(+v)} />

        <AlertDialog open={!!delId} onOpenChange={() => setDelId(null)}>
          <AlertDialogContent>
            <AlertDialogHeader><AlertDialogTitle>确认删除？</AlertDialogTitle></AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>取消</AlertDialogCancel>
              <AlertDialogAction onClick={doDelete} className="bg-[#f56c6c] text-white hover:bg-[#f56c6c]/90">删除</AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </ErpListPage>
    </TooltipProvider>
  );
}
