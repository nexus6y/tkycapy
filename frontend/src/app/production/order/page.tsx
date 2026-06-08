'use client';

import { Fragment, useCallback, useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  Boxes,
  ChevronDown,
  FileSearch,
  MoreHorizontal,
  Pencil,
  Plus,
  RefreshCw,
  Search,
  Settings,
  Trash2,
} from 'lucide-react';
import api from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { toast } from '@/components/ui/toast';
import {
  ErpAction,
  ErpActionBtn,
  ErpApproval,
  ErpEmpty,
  ErpLink,
  ErpPagination,
  ErpTable,
  ErpTbody,
  ErpTd,
  ErpTh,
  ErpThead,
  ErpTr,
} from '@/components/ui/erp-table';

interface ProductLine {
  id: string;
  lineNo: number;
  materialCode: string | null;
  materialName: string | null;
  spec: string | null;
  unit: string | null;
  plannedQty: string | null;
  actualQty: string | null;
}

interface MaterialLine {
  id: string;
  lineNo: number;
  materialCode: string | null;
  materialName: string | null;
  spec: string | null;
  unit: string | null;
  quantity: string | null;
  issuedQty: string | null;
}

interface ProductionOrder {
  id: string;
  orderNo: string;
  orderName: string;
  materialName: string | null;
  departmentName: string | null;
  quantity: string | null;
  startDate: string | null;
  endDate: string | null;
  approvalStatus: string;
  businessStatus: string;
  createdAt: string;
  lines?: ProductLine[];
  materials?: MaterialLine[];
}

const APPROVAL_OPTIONS = [
  { value: 'ALL', label: '全部' },
  { value: 'DRAFT', label: '草稿' },
  { value: 'SUBMITTED', label: '已提交' },
  { value: 'APPROVED', label: '已通过' },
  { value: 'REJECTED', label: '已拒绝' },
];

const BUSINESS_OPTIONS = [
  { value: 'ALL', label: '全部' },
  { value: 'PENDING_ISSUE', label: '待开工' },
  { value: 'ISSUING', label: '领料中' },
  { value: 'IN_PRODUCTION', label: '生产中' },
  { value: 'PENDING_STOCK', label: '待入库' },
  { value: 'COMPLETED', label: '已完工' },
];

const BUSINESS_LABELS: Record<string, string> = {
  PENDING_ISSUE: '待开工',
  ISSUING: '领料中',
  IN_PRODUCTION: '生产中',
  PENDING_STOCK: '待入库',
  COMPLETED: '已完工',
};

const BUSINESS_CLASSES: Record<string, string> = {
  PENDING_ISSUE: 'bg-[#fdf6ec] text-[#b88230] border-[#faecd8]',
  ISSUING: 'bg-[#ecf5ff] text-[#409eff] border-[#d9ecff]',
  IN_PRODUCTION: 'bg-[#e6f7ff] text-[#13c2c2] border-[#b5f5ec]',
  PENDING_STOCK: 'bg-[#fdf6ec] text-[#b88230] border-[#faecd8]',
  COMPLETED: 'bg-[#f0f9eb] text-[#67c23a] border-[#e1f3d8]',
};

function statusBadge(status: string) {
  return (
    <span className={`inline-flex rounded border px-2 py-0.5 text-[12px] ${BUSINESS_CLASSES[status] || 'bg-[#f4f4f5] text-[#909399] border-[#e9e9eb]'}`}>
      {BUSINESS_LABELS[status] || status || '-'}
    </span>
  );
}

function stockStatus(status: string) {
  if (status === 'COMPLETED') {
    return <span className="inline-flex rounded border border-[#e1f3d8] bg-[#f0f9eb] px-2 py-0.5 text-[12px] text-[#67c23a]">全部生成入库单</span>;
  }
  if (status === 'PENDING_STOCK') {
    return <span className="inline-flex rounded border border-[#faecd8] bg-[#fdf6ec] px-2 py-0.5 text-[12px] text-[#b88230]">待生成入库单</span>;
  }
  return <span className="text-[#c0c4cc]">-</span>;
}

function fmtDate(v: string | null) {
  return v ? new Date(v).toLocaleDateString('zh-CN') : '-';
}

export default function ProductionOrderWorkbenchPage() {
  const router = useRouter();
  const [items, setItems] = useState<ProductionOrder[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(30);
  const [detailMode, setDetailMode] = useState(true);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [openMoreId, setOpenMoreId] = useState<string | null>(null);
  const [search, setSearch] = useState({
    status: '',
    biz: '',
    code: '',
    name: '',
    materialCode: '',
    materialName: '',
    departmentName: '',
  });

  const selectedOrder = useMemo(
    () => items.find(item => selected.has(item.id)),
    [items, selected],
  );

  const fetchData = useCallback(async () => {
    const params: any = { page, pageSize };
    if (detailMode) params.mode = 'detail';
    Object.entries(search).forEach(([key, value]) => {
      if (value) params[key] = value;
    });
    const { data } = await api.get('/production-orders', { params });
    setItems(data.items || []);
    setTotal(data.total || 0);
  }, [detailMode, page, pageSize, search]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const resetSearch = () => {
    setSearch({ status: '', biz: '', code: '', name: '', materialCode: '', materialName: '', departmentName: '' });
    setPage(1);
  };

  const toggleSelect = (id: string) => {
    setSelected(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const toggleAll = () => {
    setSelected(prev => prev.size === items.length ? new Set() : new Set(items.map(item => item.id)));
  };

  const editSelected = () => {
    if (!selectedOrder) return toast('请先勾选数据', 'info');
    router.push(`/production/order/${selectedOrder.id}/edit`);
  };

  const deleteSelected = () => {
    if (!selectedOrder) return toast('请先勾选数据', 'info');
    setDeleteId(selectedOrder.id);
  };

  const doDelete = async () => {
    if (!deleteId) return;
    try {
      await api.delete(`/production-orders/${deleteId}`);
      setDeleteId(null);
      setSelected(new Set());
      fetchData();
    } catch (e: any) {
      toast(e.response?.data?.message || '删除失败', 'error');
    }
  };

  const workflow = async (id: string, action: 'submit' | 'approve' | 'withdraw') => {
    try {
      await api.put(`/production-orders/${id}/${action}`);
      fetchData();
    } catch (e: any) {
      toast(e.response?.data?.message || '操作失败', 'error');
    }
  };

  const pushIssue = async (id: string) => {
    if (!window.confirm('确定下推领料单？将从材料明细生成领料单。')) return;
    try {
      await api.post(`/production-orders/${id}/generate-issue`);
      toast('领料单已生成', 'success');
      fetchData();
    } catch (e: any) {
      toast(e.response?.data?.message || '下推失败', 'error');
    }
  };

  const pushComplete = async (id: string) => {
    if (!window.confirm('确定下推完工报告？将从产品明细生成完工报告。')) return;
    try {
      await api.post(`/production-orders/${id}/generate-complete-report`);
      toast('完工报告已生成', 'success');
      fetchData();
    } catch (e: any) {
      toast(e.response?.data?.message || '下推失败', 'error');
    }
  };

  const renderMore = (item: ProductionOrder) => {
    const open = openMoreId === item.id;
    return (
      <span className="relative">
        <button
          type="button"
          className="inline-flex items-center gap-0.5 text-[13px] text-[#409eff] hover:opacity-80"
          onClick={() => setOpenMoreId(open ? null : item.id)}
        >
          更多 <ChevronDown className="h-3.5 w-3.5" />
        </button>
        {open && (
          <div className="absolute right-0 top-6 z-30 w-[132px] rounded-md border border-[#dcdfe6] bg-white py-1 shadow-lg">
            <button type="button" onClick={() => { setOpenMoreId(null); toast('齐套分析待接入', 'info'); }} className="block w-full px-3 py-1.5 text-left text-[13px] text-[#409eff] hover:bg-[#ecf5ff]">齐套分析</button>
            <button type="button" onClick={() => { setOpenMoreId(null); toast('领料追溯请使用左侧“领料全追溯”', 'info'); }} className="block w-full px-3 py-1.5 text-left text-[13px] text-[#409eff] hover:bg-[#ecf5ff]">领料追溯</button>
            <button type="button" onClick={() => { setOpenMoreId(null); toast('全局联查待接入', 'info'); }} className="block w-full px-3 py-1.5 text-left text-[13px] text-[#409eff] hover:bg-[#ecf5ff]">全局联查</button>
            <button type="button" onClick={() => { setOpenMoreId(null); pushComplete(item.id); }} className="block w-full px-3 py-1.5 text-left text-[13px] text-[#409eff] hover:bg-[#ecf5ff]">完工报告</button>
            <button type="button" onClick={() => { setOpenMoreId(null); toast('历史版本待接入', 'info'); }} className="block w-full px-3 py-1.5 text-left text-[13px] text-[#909399] hover:bg-[#f5f7fa]">历史版本</button>
          </div>
        )}
      </span>
    );
  };

  return (
    <div className="flex h-full min-h-0 flex-col rounded-lg border border-[#dcdfe6] bg-white">
      <div className="flex shrink-0 items-center justify-between gap-2 border-b border-[#ebeef5] bg-white px-4 py-3">
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" className="gap-1" onClick={() => toast('业务引导待接入', 'info')}>
            <Boxes className="h-3.5 w-3.5" />业务引导
          </Button>
          <Button variant="outline" size="sm" className="gap-1" onClick={() => toast('请选择批量操作', 'info')}>
            <Pencil className="h-3.5 w-3.5" />批量操作 <ChevronDown className="h-3.5 w-3.5" />
          </Button>
          <Button variant="secondary" size="sm" className="gap-1" onClick={() => router.push('/production/order/create')}>
            <Plus className="h-3.5 w-3.5" />新增
          </Button>
          <Button variant="outline" size="sm" className="gap-1" onClick={editSelected}>
            <Pencil className="h-3.5 w-3.5" />修改
          </Button>
          <Button variant="outline" size="sm" className="gap-1" onClick={deleteSelected}>
            <Trash2 className="h-3.5 w-3.5" />删除
          </Button>
          <Button variant="outline" size="sm" className="gap-1" onClick={() => toast('请选择更多操作', 'info')}>
            <MoreHorizontal className="h-3.5 w-3.5" />更多操作 <ChevronDown className="h-3.5 w-3.5" />
          </Button>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="sm" onClick={resetSearch}>重置</Button>
          <Button variant="outline" size="sm" className="gap-1" onClick={() => toast('常用搜索方案待接入', 'info')}>常用搜索方案 <ChevronDown className="h-3.5 w-3.5" /></Button>
          <Button variant="default" size="sm" className="gap-1" onClick={() => { setPage(1); fetchData(); }}>
            <Search className="h-4 w-4" />搜索
          </Button>
          <Button variant="outline" size="sm" onClick={() => toast('高级搜索待接入', 'info')}>高级搜索</Button>
        </div>
      </div>

      <div className="grid shrink-0 grid-cols-4 gap-x-8 gap-y-3 border-b border-[#ebeef5] bg-[#fafafa] px-4 py-4">
        <SearchSelect label="审批状态" value={search.status} options={APPROVAL_OPTIONS} onChange={v => setSearch({ ...search, status: v })} placeholder="请选择审批状态" />
        <SearchSelect label="生产状态" value={search.biz} options={BUSINESS_OPTIONS} onChange={v => setSearch({ ...search, biz: v })} placeholder="请选择生产状态" />
        <SearchInput label="生产编码" value={search.code} onChange={v => setSearch({ ...search, code: v })} placeholder="请输入生产编码" />
        <SearchInput label="生产名称" value={search.name} onChange={v => setSearch({ ...search, name: v })} placeholder="请输入生产名称" />
        <SearchInput label="所属组织" value={search.departmentName} onChange={v => setSearch({ ...search, departmentName: v })} placeholder="请输入所属组织" />
        <SearchInput label="生产单号" value={search.code} onChange={v => setSearch({ ...search, code: v })} placeholder="请输入生产单号" />
        <SearchInput label="产品编码" value={search.materialCode} onChange={v => setSearch({ ...search, materialCode: v })} placeholder="请输入产品编码" />
        <SearchInput label="产品名称" value={search.materialName} onChange={v => setSearch({ ...search, materialName: v })} placeholder="请输入产品名称" />
      </div>

      <div className="flex shrink-0 items-center justify-between border-b border-[#ebeef5] bg-white px-4 py-2.5">
        <div className="flex items-center gap-6">
          <label className="inline-flex items-center gap-2 text-[14px] text-[#303133]">
            <input type="radio" checked={!detailMode} onChange={() => setDetailMode(false)} className="accent-[#409eff]" />
            主单
          </label>
          <label className="inline-flex items-center gap-2 text-[14px] text-[#409eff]">
            <input type="radio" checked={detailMode} onChange={() => setDetailMode(true)} className="accent-[#409eff]" />
            主单+明细
          </label>
          <span className="text-[13px] text-[#606266]">搜索条件：</span>
        </div>
        <div className="flex items-center gap-1">
          <button type="button" onClick={fetchData} title="刷新" className="rounded border border-[#dcdfe6] p-1.5 text-[#606266] hover:bg-[#f5f7fa]"><RefreshCw className="h-4 w-4" /></button>
          <button type="button" title="列设置" className="rounded border border-[#dcdfe6] p-1.5 text-[#606266] hover:bg-[#f5f7fa]"><Settings className="h-4 w-4" /></button>
        </div>
      </div>

      <div className="min-h-0 flex-1 overflow-auto">
        <ErpTable>
          <ErpThead>
            <ErpTh className="w-[48px]"><Checkbox checked={items.length > 0 && selected.size === items.length} onCheckedChange={toggleAll} /></ErpTh>
            <ErpTh className="w-[80px]">阶层</ErpTh>
            <ErpTh className="w-[120px]">审批状态</ErpTh>
            <ErpTh className="w-[150px]">产品入库状态</ErpTh>
            <ErpTh className="w-[130px]">生产状态</ErpTh>
            <ErpTh className="w-[170px]">生产编码</ErpTh>
            <ErpTh className="w-[220px]">生产名称</ErpTh>
            <ErpTh className="w-[160px]">所属组织</ErpTh>
            <ErpTh className="w-[260px] sticky right-0 z-10 bg-[#f5f7fa]">操作</ErpTh>
          </ErpThead>
          <ErpTbody>
            {items.map(item => (
              <Fragment key={item.id}>
                <ErpTr>
                  <ErpTd><Checkbox checked={selected.has(item.id)} onCheckedChange={() => toggleSelect(item.id)} /></ErpTd>
                  <ErpTd>0</ErpTd>
                  <ErpTd><ErpApproval status={item.approvalStatus} /></ErpTd>
                  <ErpTd>{stockStatus(item.businessStatus)}</ErpTd>
                  <ErpTd>{statusBadge(item.businessStatus)}</ErpTd>
                  <ErpTd><ErpLink onClick={() => router.push(`/production/order/${item.id}/edit`)}>{item.orderNo}</ErpLink></ErpTd>
                  <ErpTd>{item.orderName || '-'}</ErpTd>
                  <ErpTd className="text-[#606266]">{item.departmentName || '-'}</ErpTd>
                  <ErpTd className="sticky right-0 z-10 bg-white">
                    <ErpAction>
                      <ErpActionBtn onClick={() => router.push(`/production/order/${item.id}/edit`)}><Pencil className="h-3.5 w-3.5" />修改</ErpActionBtn>
                      <ErpActionBtn danger onClick={() => setDeleteId(item.id)}><Trash2 className="h-3.5 w-3.5" />删除</ErpActionBtn>
                      {item.approvalStatus === 'DRAFT' && <ErpActionBtn onClick={() => workflow(item.id, 'submit')}>提交</ErpActionBtn>}
                      {item.approvalStatus === 'SUBMITTED' && <ErpActionBtn onClick={() => workflow(item.id, 'approve')}>通过</ErpActionBtn>}
                      {item.approvalStatus === 'SUBMITTED' && <ErpActionBtn onClick={() => workflow(item.id, 'withdraw')}>撤回</ErpActionBtn>}
                      {item.approvalStatus === 'APPROVED' && ['PENDING_ISSUE', 'ISSUING'].includes(item.businessStatus) && <ErpActionBtn onClick={() => pushIssue(item.id)}>下推领料</ErpActionBtn>}
                      {renderMore(item)}
                    </ErpAction>
                  </ErpTd>
                </ErpTr>
                {detailMode && item.lines?.map(line => (
                  <ErpTr key={`product-${line.id || line.lineNo}`} className="bg-[#f8fffb]">
                    <ErpTd />
                    <ErpTd className="text-[#909399]">产品 {line.lineNo}</ErpTd>
                    <ErpTd />
                    <ErpTd />
                    <ErpTd className="text-[12px] text-[#67c23a]">产品明细</ErpTd>
                    <ErpTd>{line.materialCode || '-'}</ErpTd>
                    <ErpTd>{line.materialName || '-'}</ErpTd>
                    <ErpTd className="text-[#909399]">{line.plannedQty ? `${Number(line.plannedQty).toLocaleString()} ${line.unit || ''}` : '-'}</ErpTd>
                    <ErpTd className="sticky right-0 z-10 bg-[#f8fffb]" />
                  </ErpTr>
                ))}
                {detailMode && item.materials?.map(line => (
                  <ErpTr key={`material-${line.id || line.lineNo}`} className="bg-[#f8f9ff]">
                    <ErpTd />
                    <ErpTd className="text-[#909399]">材料 {line.lineNo}</ErpTd>
                    <ErpTd />
                    <ErpTd />
                    <ErpTd className="text-[12px] text-[#409eff]">材料明细</ErpTd>
                    <ErpTd>{line.materialCode || '-'}</ErpTd>
                    <ErpTd>{line.materialName || '-'}</ErpTd>
                    <ErpTd className="text-[#909399]">{line.quantity ? `${Number(line.quantity).toLocaleString()} ${line.unit || ''}` : '-'}</ErpTd>
                    <ErpTd className="sticky right-0 z-10 bg-[#f8f9ff]" />
                  </ErpTr>
                ))}
              </Fragment>
            ))}
            {items.length === 0 && <ErpEmpty colSpan={9} />}
          </ErpTbody>
        </ErpTable>
      </div>

      <ErpPagination page={page} pageSize={pageSize} total={total} onPage={setPage} onPageSize={v => setPageSize(+v)} />

      <AlertDialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader><AlertDialogTitle>确认删除？</AlertDialogTitle></AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>取消</AlertDialogCancel>
            <AlertDialogAction onClick={doDelete} className="bg-[#f56c6c] text-white hover:bg-[#f56c6c]/90">删除</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

function SearchInput({ label, value, onChange, placeholder }: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  placeholder: string;
}) {
  return (
    <div className="flex items-center gap-3">
      <span className="w-[72px] shrink-0 text-right text-[14px] text-[#303133]">{label}</span>
      <Input className="h-9 rounded-md border border-[#dcdfe6] bg-white px-3 text-[13px]" value={value} onChange={e => onChange(e.target.value)} placeholder={placeholder} />
    </div>
  );
}

function SearchSelect({ label, value, onChange, placeholder, options }: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  placeholder: string;
  options: { value: string; label: string }[];
}) {
  return (
    <div className="flex items-center gap-3">
      <span className="w-[72px] shrink-0 text-right text-[14px] text-[#303133]">{label}</span>
      <Select value={value || 'ALL'} onValueChange={v => onChange(!v || v === 'ALL' ? '' : String(v))}>
        <SelectTrigger className="h-9 rounded-md border border-[#dcdfe6] bg-white px-3 text-[13px]">
          <SelectValue placeholder={placeholder} />
        </SelectTrigger>
        <SelectContent>
          {options.map(option => <SelectItem key={option.value} value={option.value}>{option.label}</SelectItem>)}
        </SelectContent>
      </Select>
    </div>
  );
}
