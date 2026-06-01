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
import { Pencil, Plus, Trash2 } from 'lucide-react';
import { ErpTable, ErpThead, ErpTh, ErpTbody, ErpTr, ErpTd, ErpEmpty, ErpLink, ErpAction, ErpActionBtn, ErpApproval, ErpPagination, ErpListPage } from '@/components/ui/erp-table';
import { ErpToolbar } from '@/components/ui/erp-toolbar';
import { ErpSearchFields, ErpSearchField } from '@/components/ui/erp-search-fields';

interface Item { id:string;code:string;name:string;source:string|null;approvalStatus:string;createdAt:string; }

export default function ProjectPage() {
  const router = useRouter();
  const [items, setItems] = useState<Item[]>([]);
  const [total, setTotal] = useState(0);
  const [pg, setPg] = useState(1);
  const [ps, setPs] = useState(30);
  const [sel, setSel] = useState<Set<string>>(new Set());
  const [s, setS] = useState({ code: '', name: '', status: '' });
  const [del, setDel] = useState<string | null>(null);

  const fetch = useCallback(async () => {
    const p: any = { page: pg, pageSize: ps };
    if (s.code) p.code = s.code;
    if (s.name) p.name = s.name;
    if (s.status) p.status = s.status;
    const { data } = await api.get('/projects', { params: p });
    setItems(data.items);
    setTotal(data.total);
  }, [pg, ps, s]);

  useEffect(() => { fetch(); }, [fetch]);

  const doDel = async () => {
    if (!del) return;
    try {
      await api.delete(`/projects/${del}`);
      setDel(null);
      fetch();
    } catch (e: any) {
      toast(e.response?.data?.message || '删除失败', 'error');
    }
  };

  const toggleAll = (v: boolean) => setSel(v ? new Set(items.map(i => i.id)) : new Set());
  const toggleOne = (id: string, v: boolean) => {
    const n = new Set(sel);
    v ? n.add(id) : n.delete(id);
    setSel(n);
  };

  const handleSubmit = (id: string) => {
    api.put(`/projects/${id}/submit`).then(fetch);
  };

  const colSpan = 7;

  return (
    <TooltipProvider>
      <ErpListPage>
        <ErpToolbar
          addHref="/project/create"
          editDisabled={sel.size === 0}
          onEdit={() => toast('请先勾选数据', 'info')}
          deleteDisabled={sel.size === 0}
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
                <SelectItem value="DRAFT">草稿</SelectItem>
                <SelectItem value="SUBMITTED">已提交</SelectItem>
                <SelectItem value="APPROVED">已通过</SelectItem>
              </SelectContent>
            </Select>
          </ErpSearchField>
          <ErpSearchField label="项目编码">
            <Input className="w-[140px] h-9 rounded-md border border-border bg-background px-3 text-[13px]" value={s.code} onChange={e => setS({ ...s, code: e.target.value })} />
          </ErpSearchField>
          <ErpSearchField label="项目名称">
            <Input className="w-[140px] h-9 rounded-md border border-border bg-background px-3 text-[13px]" value={s.name} onChange={e => setS({ ...s, name: e.target.value })} />
          </ErpSearchField>
        </ErpSearchFields>

        <div className="overflow-auto">
          <ErpTable>
            <ErpThead>
              <ErpTh className="w-10">
                <Checkbox checked={items.length > 0 && sel.size === items.length} onCheckedChange={(v: boolean) => toggleAll(v)} />
              </ErpTh>
              <ErpTh>审批状态</ErpTh>
              <ErpTh>项目编码</ErpTh>
              <ErpTh>项目名称</ErpTh>
              <ErpTh>项目来源</ErpTh>
              <ErpTh>创建时间</ErpTh>
              <ErpTh>操作</ErpTh>
            </ErpThead>
            <ErpTbody>
              {items.map(i => (
                <ErpTr key={i.id}>
                  <ErpTd>
                    <Checkbox checked={sel.has(i.id)} onCheckedChange={(v: boolean) => toggleOne(i.id, v)} />
                  </ErpTd>
                  <ErpTd><ErpApproval status={i.approvalStatus} /></ErpTd>
                  <ErpTd><ErpLink onClick={() => router.push(`/project/${i.id}/edit`)}>{i.code}</ErpLink></ErpTd>
                  <ErpTd>{i.name}</ErpTd>
                  <ErpTd className="text-muted-foreground">{i.source || '-'}</ErpTd>
                  <ErpTd className="text-muted-foreground">{new Date(i.createdAt).toLocaleDateString('zh-CN')}</ErpTd>
                  <ErpTd>
                    <ErpAction>
                      <ErpActionBtn onClick={() => router.push(`/project/${i.id}/edit`)}>
                        <Pencil className="h-3.5 w-3.5" />修改
                      </ErpActionBtn>
                      {i.approvalStatus === 'DRAFT' && (
                        <button onClick={() => handleSubmit(i.id)} className="text-primary text-[13px] hover:underline">提交</button>
                      )}
                      <ErpActionBtn danger onClick={() => setDel(i.id)}>
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

        <AlertDialog open={!!del} onOpenChange={() => setDel(null)}>
          <AlertDialogContent>
            <AlertDialogHeader><AlertDialogTitle>确认删除？</AlertDialogTitle></AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>取消</AlertDialogCancel>
              <AlertDialogAction onClick={doDel} className="bg-[#f56c6c] text-white hover:bg-[#f56c6c]/90">删除</AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </ErpListPage>
    </TooltipProvider>
  );
}
