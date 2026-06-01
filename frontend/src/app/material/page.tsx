'use client';
import { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import api from '@/lib/api';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { TooltipProvider } from '@/components/ui/tooltip';
import { ChevronDown, Download, Pencil, Trash2, Upload } from 'lucide-react';
import { toast } from '@/components/ui/toast';
import { ErpTable, ErpThead, ErpTh, ErpTbody, ErpTr, ErpTd, ErpEmpty, ErpLink, ErpAction, ErpActionBtn, ErpTools, ErpStatus, ErpApproval, ErpPagination, ErpListPage } from '@/components/ui/erp-table';
import { ErpToolbar } from '@/components/ui/erp-toolbar';
import { ErpSearchFields, ErpSearchField } from '@/components/ui/erp-search-fields';

interface Item { id:string;code:string;name:string;specification:string|null;categoryName:string;materialType:string;unitName:string;unitSymbol:string|null;status:string;approvalStatus:string;createdAt:string; }

export default function MaterialPage() {
  const router = useRouter();
  const [items, setItems] = useState<Item[]>([]);
  const [total, setTotal] = useState(0);
  const [pg, setPg] = useState(1);
  const [ps, setPs] = useState(30);
  const [sel, setSel] = useState<Set<string>>(new Set());
  const [s, setS] = useState({ status: '', approvalStatus: '', code: '', name: '', startDate: '', endDate: '' });
  const [del, setDel] = useState<string | null>(null);
  const [advanced, setAdvanced] = useState(false);

  const fetch = useCallback(async () => {
    const p: any = { page: pg, pageSize: ps };
    if (s.code) p.code = s.code;
    if (s.name) p.name = s.name;
    if (s.status) p.status = s.status;
    const { data } = await api.get('/materials', { params: p });
    setItems(data.items);
    setTotal(data.total);
  }, [pg, ps, s]);

  useEffect(() => { fetch(); }, [fetch]);

  const doDel = async () => {
    if (!del) return;
    try {
      await api.delete(`/materials/${del}`);
      setDel(null);
      fetch();
    } catch (e: any) {
      toast(e.response?.data?.message || '删除失败', 'error');
    }
  };

  const resetSearch = () => setS({ status: '', approvalStatus: '', code: '', name: '', startDate: '', endDate: '' });

  const colSpan = 11;

  return (
    <TooltipProvider>
      <ErpListPage>
        <ErpToolbar
          addHref="/material/create"
          editDisabled={sel.size === 0}
          onEdit={() => toast('请先勾选数据', 'info')}
          deleteDisabled={sel.size === 0}
          onDelete={() => toast('请先勾选数据', 'info')}
          showImport
          importItems={[
            { label: '导入数据', icon: <Upload className="h-3.5 w-3.5 mr-2" />, onClick: () => {} },
            { label: '下载模板', icon: <Download className="h-3.5 w-3.5 mr-2" />, onClick: () => {} },
          ]}
          showExport
          onExport={() => {}}
          onReset={resetSearch}
          onSearch={fetch}
          extraRight={
            <DropdownMenu>
              <DropdownMenuTrigger className="inline-flex items-center justify-center gap-1 rounded-md px-2.5 h-7 text-[13px] font-medium hover:bg-accent hover:text-accent-foreground transition-colors">
                常用搜索方案 <ChevronDown className="h-3 w-3" />
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem>保存当前搜索</DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          }
          showAdvanced
          advancedOpen={advanced}
          onAdvancedToggle={() => setAdvanced(!advanced)}
        />

        <ErpSearchFields advancedOpen={advanced} advancedChildren={
          <ErpSearchField label="创建时间">
            <Input type="date" className="w-[130px] h-9 rounded-md border border-border bg-background px-3 text-[13px]" value={s.startDate} onChange={e => setS({ ...s, startDate: e.target.value })} />
            <span className="text-muted-foreground mx-1">-</span>
            <Input type="date" className="w-[130px] h-9 rounded-md border border-border bg-background px-3 text-[13px]" value={s.endDate} onChange={e => setS({ ...s, endDate: e.target.value })} />
          </ErpSearchField>
        }>
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
          <ErpSearchField label="审批">
            <Select value={s.approvalStatus} onValueChange={(v: any) => setS({ ...s, approvalStatus: v === 'ALL' ? '' : v })}>
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
          <ErpSearchField label="物料编码">
            <Input className="w-[140px] h-9 rounded-md border border-border bg-background px-3 text-[13px]" value={s.code} onChange={e => setS({ ...s, code: e.target.value })} placeholder="编码" />
          </ErpSearchField>
          <ErpSearchField label="物料名称">
            <Input className="w-[140px] h-9 rounded-md border border-border bg-background px-3 text-[13px]" value={s.name} onChange={e => setS({ ...s, name: e.target.value })} placeholder="名称" />
          </ErpSearchField>
        </ErpSearchFields>

        <ErpTools onRefresh={fetch} />

        <div className="overflow-auto">
          <ErpTable>
            <ErpThead>
              <ErpTh className="w-10"><Checkbox checked={items.length > 0 && sel.size === items.length} onCheckedChange={(v: boolean) => setSel(v ? new Set(items.map(i => i.id)) : new Set())} /></ErpTh>
              <ErpTh>启用状态</ErpTh>
              <ErpTh>审批状态</ErpTh>
              <ErpTh>物料编码</ErpTh>
              <ErpTh>物料名称</ErpTh>
              <ErpTh>规格型号</ErpTh>
              <ErpTh>物料分类</ErpTh>
              <ErpTh>物料性质</ErpTh>
              <ErpTh>计量单位</ErpTh>
              <ErpTh>创建时间</ErpTh>
              <ErpTh>操作</ErpTh>
            </ErpThead>
            <ErpTbody>
              {items.map(i => (
                <ErpTr key={i.id}>
                  <ErpTd><Checkbox checked={sel.has(i.id)} onCheckedChange={(v: boolean) => { const n = new Set(sel); v ? n.add(i.id) : n.delete(i.id); setSel(n); }} /></ErpTd>
                  <ErpTd><ErpStatus active={i.status === 'ACTIVE'} /></ErpTd>
                  <ErpTd><ErpApproval status={i.approvalStatus} /></ErpTd>
                  <ErpTd><ErpLink onClick={() => router.push(`/material/${i.id}/edit`)}>{i.code}</ErpLink></ErpTd>
                  <ErpTd>{i.name}</ErpTd>
                  <ErpTd className="text-[#909399]">{i.specification || '-'}</ErpTd>
                  <ErpTd>{i.categoryName}</ErpTd>
                  <ErpTd>{i.materialType === 'PHYSICAL' ? '实物' : '虚拟'}</ErpTd>
                  <ErpTd>{i.unitName}{i.unitSymbol ? `(${i.unitSymbol})` : ''}</ErpTd>
                  <ErpTd className="text-[#909399]">{new Date(i.createdAt).toLocaleDateString('zh-CN')}</ErpTd>
                  <ErpTd>
                    <ErpAction>
                      <ErpActionBtn onClick={() => router.push(`/material/${i.id}/edit`)}>
                        <Pencil className="h-3.5 w-3.5" />修改
                      </ErpActionBtn>
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
