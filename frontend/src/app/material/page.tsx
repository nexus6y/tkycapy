'use client';
import type { ReactNode } from 'react';
import { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import api from '@/lib/api';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { TooltipProvider } from '@/components/ui/tooltip';
import { ChevronDown, Download, Filter, Pencil, Trash2, Upload } from 'lucide-react';
import { toast } from '@/components/ui/toast';
import { ErpTable, ErpThead, ErpTh, ErpTbody, ErpTr, ErpTd, ErpEmpty, ErpLink, ErpAction, ErpActionBtn, ErpTools, ErpStatus, ErpApproval, ErpPagination, ErpListPage } from '@/components/ui/erp-table';
import { ErpToolbar } from '@/components/ui/erp-toolbar';
import { ErpSearchFields, ErpSearchField } from '@/components/ui/erp-search-fields';

interface Item {
  id:string; code:string; name:string; specification:string|null;
  categoryName:string; materialType:string; materialProperty:string|null;
  productCategory:string|null; unitName:string; unitSymbol:string|null;
  planAttribute:string|null; defaultSupplier:string|null;
  responsiblePerson:string|null; status:string; approvalStatus:string;
  createdAt:string; updatedAt:string;
}

export default function MaterialPage() {
  const router = useRouter();
  const [items, setItems] = useState<Item[]>([]);
  const [total, setTotal] = useState(0);
  const [pg, setPg] = useState(1);
  const [ps, setPs] = useState(30);
  const [sel, setSel] = useState<Set<string>>(new Set());
  const [s, setS] = useState({
    status:'', approvalStatus:'', code:'', name:'',
    externalCode:'', specification:'', materialProperty:'',
    productCategory:'', planAttribute:'', defaultSupplierName:'',
    responsiblePerson:'', startDate:'', endDate:'',
  });
  const [del, setDel] = useState<string | null>(null);
  const [advanced, setAdvanced] = useState(false);

  const fetch = useCallback(async () => {
    const p: any = { page: pg, pageSize: ps };
    Object.entries(s).forEach(([k, v]) => { if (v) p[k] = v; });
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

  const resetSearch = () => setS({
    status:'', approvalStatus:'', code:'', name:'',
    externalCode:'', specification:'', materialProperty:'',
    productCategory:'', planAttribute:'', defaultSupplierName:'',
    responsiblePerson:'', startDate:'', endDate:'',
  });

  const colSpan = 16;
  const filterIconClass = (active?: boolean) =>
    `ml-1 inline-flex h-5 w-5 items-center justify-center rounded hover:bg-white ${active ? 'text-[#409eff]' : 'text-[#c0c4cc]'}`;
  const TextColumnFilter = ({ field, placeholder }: { field: keyof typeof s; placeholder: string }) => (
    <DropdownMenu>
      <DropdownMenuTrigger className={filterIconClass(Boolean(s[field]))} onClick={e => e.stopPropagation()}>
        <Filter className="h-3.5 w-3.5" />
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start" className="w-[220px] p-3">
        <Input
          className="h-8 text-[13px]"
          value={s[field]}
          onChange={e => setS({ ...s, [field]: e.target.value })}
          placeholder={placeholder}
        />
        <div className="mt-2 flex justify-end gap-2">
          <button className="text-[12px] text-[#909399] hover:text-[#409eff]" onClick={() => setS({ ...s, [field]: '' })}>重置</button>
          <button className="text-[12px] text-[#409eff]" onClick={fetch}>搜索</button>
        </div>
      </DropdownMenuContent>
    </DropdownMenu>
  );
  const StatusColumnFilter = ({ field, items }: { field: 'status' | 'approvalStatus'; items: { label: string; value: string }[] }) => (
    <DropdownMenu>
      <DropdownMenuTrigger className={filterIconClass(Boolean(s[field]))} onClick={e => e.stopPropagation()}>
        <Filter className="h-3.5 w-3.5" />
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start">
        <DropdownMenuItem onClick={() => setS({ ...s, [field]: '' })}>全部</DropdownMenuItem>
        {items.map(item => (
          <DropdownMenuItem key={item.value} onClick={() => setS({ ...s, [field]: item.value })}>{item.label}</DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
  const PendingColumnFilter = ({ active }: { active?: boolean }) => (
    <button className={filterIconClass(active)} onClick={() => toast('物料分类筛选待接入', 'info')}>
      <Filter className="h-3.5 w-3.5" />
    </button>
  );
  const FilterableTh = ({ children, filter, className }: { children: ReactNode; filter: ReactNode; className?: string }) => (
    <ErpTh className={className}><span className="inline-flex items-center">{children}{filter}</span></ErpTh>
  );

  return (
    <TooltipProvider>
      <ErpListPage>
        <ErpToolbar
          addHref="/material/create"
          editDisabled={sel.size !== 1}
          onEdit={() => {
            const item = items.find(i => sel.has(i.id));
            if (item) router.push(`/material/${item.id}/edit`);
            else toast('请先勾选一条数据', 'info');
          }}
          deleteLabel="批改"
          deleteDisabled={sel.size === 0}
          onDelete={() => toast('批改功能待接入', 'info')}
          showImport
          importItems={[
            { label: '下载模板', icon: <Download className="h-3.5 w-3.5 mr-2" />, onClick: () => toast('导入模板下载待接入', 'info') },
            { label: '导入数据', icon: <Upload className="h-3.5 w-3.5 mr-2" />, onClick: () => toast('导入功能待接入', 'info') },
          ]}
          onReset={resetSearch}
          onSearch={fetch}
          extraRight={
            <DropdownMenu>
              <DropdownMenuTrigger className="inline-flex items-center justify-center gap-1 rounded-md px-2.5 h-7 text-[13px] font-medium hover:bg-accent hover:text-accent-foreground transition-colors">
                常用搜索方案 <ChevronDown className="h-3 w-3" />
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem disabled>保存当前搜索</DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          }
          showAdvanced
          advancedOpen={advanced}
          onAdvancedToggle={() => setAdvanced(!advanced)}
        />

        <ErpSearchFields advancedOpen={advanced} advancedChildren={
          /* ── 高级搜索：与原系统18个搜索条件对齐 ── */
          <>
          <ErpSearchField label="创建时间">
            <Input type="date" className="w-[130px] h-9 rounded-md border border-border bg-background px-3 text-[13px]" value={s.startDate} onChange={e => setS({ ...s, startDate: e.target.value })} />
            <span className="text-muted-foreground mx-1">-</span>
            <Input type="date" className="w-[130px] h-9 rounded-md border border-border bg-background px-3 text-[13px]" value={s.endDate} onChange={e => setS({ ...s, endDate: e.target.value })} />
          </ErpSearchField>
          <ErpSearchField label="规格型号">
            <Input className="w-[140px] h-9 rounded-md border border-border bg-background px-3 text-[13px]" value={s.specification} onChange={e => setS({ ...s, specification: e.target.value })} placeholder="规格型号" />
          </ErpSearchField>
          <ErpSearchField label="物料属性">
            <Input className="w-[140px] h-9 rounded-md border border-border bg-background px-3 text-[13px]" value={s.materialProperty} onChange={e => setS({ ...s, materialProperty: e.target.value })} placeholder="物料属性" />
          </ErpSearchField>
          <ErpSearchField label="产品分类">
            <Input className="w-[140px] h-9 rounded-md border border-border bg-background px-3 text-[13px]" value={s.productCategory} onChange={e => setS({ ...s, productCategory: e.target.value })} placeholder="产品分类" />
          </ErpSearchField>
          <ErpSearchField label="计划属性">
            <Input className="w-[140px] h-9 rounded-md border border-border bg-background px-3 text-[13px]" value={s.planAttribute} onChange={e => setS({ ...s, planAttribute: e.target.value })} placeholder="计划属性" />
          </ErpSearchField>
          <ErpSearchField label="默认供应商">
            <Input className="w-[140px] h-9 rounded-md border border-border bg-background px-3 text-[13px]" value={s.defaultSupplierName} onChange={e => setS({ ...s, defaultSupplierName: e.target.value })} placeholder="供应商名称" />
          </ErpSearchField>
          <ErpSearchField label="外部编码">
            <Input className="w-[140px] h-9 rounded-md border border-border bg-background px-3 text-[13px]" value={s.externalCode} onChange={e => setS({ ...s, externalCode: e.target.value })} placeholder="外部编码" />
          </ErpSearchField>
          <ErpSearchField label="主办人">
            <Input className="w-[140px] h-9 rounded-md border border-border bg-background px-3 text-[13px]" value={s.responsiblePerson} onChange={e => setS({ ...s, responsiblePerson: e.target.value })} placeholder="主办人" />
          </ErpSearchField>
          </>
        }>
          {/* ── 默认搜索 ── */}
          <ErpSearchField label="启用状态">
            <Select value={s.status} onValueChange={(v: any) => setS({ ...s, status: v === 'ALL' ? '' : v })}>
              <SelectTrigger className="w-[110px] h-9 rounded-md border border-border bg-background px-3 text-[13px]">
                <SelectValue placeholder="请选择" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ALL">全部</SelectItem>
                <SelectItem value="ACTIVE">启用</SelectItem>
                <SelectItem value="INACTIVE">停用</SelectItem>
              </SelectContent>
            </Select>
          </ErpSearchField>
          <ErpSearchField label="审批状态">
            <Select value={s.approvalStatus} onValueChange={(v: any) => setS({ ...s, approvalStatus: v === 'ALL' ? '' : v })}>
              <SelectTrigger className="w-[110px] h-9 rounded-md border border-border bg-background px-3 text-[13px]">
                <SelectValue placeholder="请选择" />
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
            <Input className="w-[140px] h-9 rounded-md border border-border bg-background px-3 text-[13px]" value={s.code} onChange={e => setS({ ...s, code: e.target.value })} placeholder="物料编码" />
          </ErpSearchField>
          <ErpSearchField label="物料名称">
            <Input className="w-[140px] h-9 rounded-md border border-border bg-background px-3 text-[13px]" value={s.name} onChange={e => setS({ ...s, name: e.target.value })} placeholder="物料名称" />
          </ErpSearchField>
        </ErpSearchFields>

        <ErpTools onRefresh={fetch} />

        <div className="min-h-0">
          <ErpTable>
            <ErpThead>
              <ErpTh className="w-[48px]"><Checkbox checked={items.length > 0 && sel.size === items.length} onCheckedChange={(v: boolean) => setSel(v ? new Set(items.map(i => i.id)) : new Set())} /></ErpTh>
              <FilterableTh className="w-[80px]" filter={<StatusColumnFilter field="status" items={[{ label: '启用', value: 'ACTIVE' }, { label: '停用', value: 'INACTIVE' }]} />}>启用状态</FilterableTh>
              <FilterableTh className="w-[90px]" filter={<StatusColumnFilter field="approvalStatus" items={[{ label: '草稿', value: 'DRAFT' }, { label: '已提交', value: 'SUBMITTED' }, { label: '已通过', value: 'APPROVED' }]} />}>审批状态</FilterableTh>
              <FilterableTh className="w-[150px]" filter={<TextColumnFilter field="code" placeholder="物料编码" />}>物料编码</FilterableTh>
              <FilterableTh className="w-[160px]" filter={<TextColumnFilter field="name" placeholder="物料名称" />}>物料名称</FilterableTh>
              <FilterableTh className="w-[120px]" filter={<TextColumnFilter field="specification" placeholder="规格型号" />}>规格型号</FilterableTh>
              <ErpTh className="w-[80px]">计量单位</ErpTh>
              <FilterableTh className="w-[100px]" filter={<PendingColumnFilter />}>物料分类</FilterableTh>
              <FilterableTh className="w-[80px]" filter={<TextColumnFilter field="materialProperty" placeholder="物料属性" />}>物料属性</FilterableTh>
              <FilterableTh className="w-[80px]" filter={<TextColumnFilter field="productCategory" placeholder="产品分类" />}>产品分类</FilterableTh>
              <FilterableTh className="w-[80px]" filter={<TextColumnFilter field="planAttribute" placeholder="计划属性" />}>计划属性</FilterableTh>
              <FilterableTh className="w-[120px]" filter={<TextColumnFilter field="defaultSupplierName" placeholder="默认供应商" />}>默认供应商</FilterableTh>
              <ErpTh className="w-[120px]">创建时间</ErpTh>
              <ErpTh className="w-[120px]">修改时间</ErpTh>
              <FilterableTh className="w-[80px]" filter={<TextColumnFilter field="responsiblePerson" placeholder="主办人" />}>主办人</FilterableTh>
              <ErpTh className="w-[140px] sticky right-0 bg-[#f5f7fa] z-10">操作</ErpTh>
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
                  <ErpTd>{i.unitName}{i.unitSymbol ? `(${i.unitSymbol})` : ''}</ErpTd>
                  <ErpTd>{i.categoryName || '-'}</ErpTd>
                  <ErpTd>{i.materialProperty || '-'}</ErpTd>
                  <ErpTd>{i.productCategory || '-'}</ErpTd>
                  <ErpTd>{i.planAttribute || '-'}</ErpTd>
                  <ErpTd className="text-[#909399]">{i.defaultSupplier || '-'}</ErpTd>
                  <ErpTd className="text-[#909399]">{new Date(i.createdAt).toLocaleDateString('zh-CN')}</ErpTd>
                  <ErpTd className="text-[#909399]">{i.updatedAt ? new Date(i.updatedAt).toLocaleDateString('zh-CN') : '-'}</ErpTd>
                  <ErpTd>{i.responsiblePerson || '-'}</ErpTd>
                  <ErpTd className="sticky right-0 bg-white z-10">
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
