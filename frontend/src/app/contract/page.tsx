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
import { ErpTable, ErpThead, ErpTh, ErpTbody, ErpTr, ErpTd, ErpEmpty, ErpLink, ErpAction, ErpActionBtn, ErpApproval, ErpPagination, ErpListPage } from '@/components/ui/erp-table';
import { ErpToolbar } from '@/components/ui/erp-toolbar';
import { ErpSearchFields, ErpSearchField } from '@/components/ui/erp-search-fields';
import { FileSearch, Pencil, RotateCcw, Send, Trash2, CheckCircle, XCircle } from 'lucide-react';

interface Item {
  id: string; code: string; name: string; type: string; category: string | null;
  customerName: string | null; supplierName: string | null;
  organizationName: string | null;
  totalAmount: string | null; startDate: string | null; endDate: string | null;
  approvalStatus: string; createdAt: string;
}

export default function ContractPage() {
  const router = useRouter();
  const [items, setItems] = useState<Item[]>([]); const [total, setTotal] = useState(0);
  const [pg, setPg] = useState(1); const [ps, setPs] = useState(30);
  const [sel, setSel] = useState<Set<string>>(new Set());
  const [s, setS] = useState({ status: '', code: '', name: '', type: '', category: '', counterparty: '', organization: '' });
  const [delId, setDelId] = useState<string | null>(null);

  const fetch = useCallback(async () => {
    const p: any = { page: pg, pageSize: ps };
    if (s.status) p.status = s.status;
    if (s.code) p.code = s.code;
    if (s.name) p.name = s.name;
    if (s.type) p.type = s.type;
    if (s.category) p.category = s.category;
    if (s.counterparty) p.counterparty = s.counterparty;
    if (s.organization) p.organization = s.organization;
    const { data } = await api.get('/contracts', { params: p });
    setItems(data.items); setTotal(data.total);
  }, [pg, ps, s]);

  useEffect(() => { fetch(); }, [fetch]);

  const resetSearch = () => setS({ status: '', code: '', name: '', type: '', category: '', counterparty: '', organization: '' });

  const doDelete = async () => {
    if (!delId) return;
    try { await api.delete(`/contracts/${delId}`); setDelId(null); fetch(); toast('删除成功', 'success'); }
    catch (e: any) { toast(e.response?.data?.message || '删除失败', 'error'); setDelId(null); }
  };

  const doSubmit = async (id: string) => {
    try { await api.put(`/contracts/${id}/submit`); fetch(); toast('已提交', 'success'); }
    catch (e: any) { toast(e.response?.data?.message || '提交失败', 'error'); }
  };

  const doApprove = async (id: string) => {
    try { await api.put(`/contracts/${id}/approve`); fetch(); toast('已审批', 'success'); }
    catch (e: any) { toast(e.response?.data?.message || '审批失败', 'error'); }
  };

  const doReject = async (id: string) => {
    try { await api.put(`/contracts/${id}/reject`); fetch(); toast('已拒绝', 'success'); }
    catch (e: any) { toast(e.response?.data?.message || '操作失败', 'error'); }
  };

  const doWithdraw = async (id: string) => {
    try { await api.put(`/contracts/${id}/withdraw`); fetch(); toast('已撤回', 'success'); }
    catch (e: any) { toast(e.response?.data?.message || '撤回失败', 'error'); }
  };

  const toggleAll = (v: boolean) => setSel(v ? new Set(items.map(i => i.id)) : new Set());
  const toggleOne = (id: string, v: boolean) => { const n = new Set(sel); v ? n.add(id) : n.delete(id); setSel(n); };

  const counterpartyName = (i: Item) => i.customerName || i.supplierName || '-';
  const colSpan = 13;

  const handleDeleteClick = () => {
    const toDelete = items.filter(i => sel.has(i.id));
    if (toDelete.length === 0) return toast('请先勾选数据', 'info');
    if (toDelete.some(i => i.approvalStatus !== 'DRAFT' && i.approvalStatus !== 'REJECTED'))
      return toast('只有草稿和已拒绝状态可删除', 'info');
    setDelId(toDelete[0].id);
  };

  return (
    <TooltipProvider>
      <ErpListPage>
        <ErpToolbar
          addHref="/contract/create"
          editDisabled={sel.size !== 1}
          onEdit={() => { const ids = Array.from(sel); if (ids.length > 0) router.push(`/contract/${ids[0]}/edit`); }}
          deleteDisabled={sel.size === 0}
          onDelete={handleDeleteClick}
          showExport onExport={() => { }}
          showImport importItems={[{ label: '导入合同', onClick: () => { } }, { label: '下载模板', onClick: () => { } }]}
          onReset={resetSearch} onSearch={fetch}
          extraLeft={(
            <>
              <button onClick={() => {
                const ids = Array.from(sel);
                if (ids.length === 0) return toast('请先勾选数据', 'info');
                const item = items.find(i => i.id === ids[0]);
                if (item?.approvalStatus === 'DRAFT' || item?.approvalStatus === 'REJECTED') doSubmit(ids[0]);
                else toast('只有草稿状态可提交', 'info');
              }} className="inline-flex items-center gap-1 rounded-md border border-border px-2.5 h-7 text-[13px] font-medium hover:bg-accent">
                <Send className="h-3 w-3" />提交
              </button>
              <button onClick={() => {
                const ids = Array.from(sel);
                if (ids.length === 0) return toast('请先勾选数据', 'info');
                const item = items.find(i => i.id === ids[0]);
                if (item?.approvalStatus === 'SUBMITTED') doWithdraw(ids[0]);
                else toast('只有已提交状态可撤回', 'info');
              }} className="inline-flex items-center gap-1 rounded-md border border-border px-2.5 h-7 text-[13px] font-medium hover:bg-accent">
                <RotateCcw className="h-3 w-3" />撤回
              </button>
              <button onClick={() => {
                const ids = Array.from(sel);
                if (ids.length > 0) router.push(`/contract/${ids[0]}/edit`);
                else toast('请先勾选数据', 'info');
              }} className="inline-flex items-center gap-1 rounded-md border border-border px-2.5 h-7 text-[13px] font-medium hover:bg-accent">
                <FileSearch className="h-3 w-3" />流程查看
              </button>
            </>
          )}
        />

        <ErpSearchFields>
          <ErpSearchField label="审批状态">
            <Select value={s.status} onValueChange={(v: any) => setS({ ...s, status: v === 'ALL' ? '' : v })}>
              <SelectTrigger className="w-[100px] h-9 rounded-md border border-border bg-background px-3 text-[13px]"><SelectValue placeholder="全部" /></SelectTrigger>
              <SelectContent><SelectItem value="ALL">全部</SelectItem><SelectItem value="DRAFT">草稿</SelectItem><SelectItem value="SUBMITTED">已提交</SelectItem><SelectItem value="APPROVED">已通过</SelectItem><SelectItem value="REJECTED">已拒绝</SelectItem></SelectContent>
            </Select>
          </ErpSearchField>
          <ErpSearchField label="合同编码"><Input className="w-[140px] h-9 rounded-md border border-border bg-background px-3 text-[13px]" value={s.code} onChange={e => setS({ ...s, code: e.target.value })} /></ErpSearchField>
          <ErpSearchField label="合同名称"><Input className="w-[160px] h-9 rounded-md border border-border bg-background px-3 text-[13px]" value={s.name} onChange={e => setS({ ...s, name: e.target.value })} /></ErpSearchField>
          <ErpSearchField label="合同类型">
            <Select value={s.type} onValueChange={(v: any) => setS({ ...s, type: v === 'ALL' ? '' : v })}>
              <SelectTrigger className="w-[110px] h-9 rounded-md border border-border bg-background px-3 text-[13px]"><SelectValue placeholder="全部" /></SelectTrigger>
              <SelectContent><SelectItem value="ALL">全部</SelectItem><SelectItem value="销售合同">销售合同</SelectItem><SelectItem value="采购合同">采购合同</SelectItem></SelectContent>
            </Select>
          </ErpSearchField>
          <ErpSearchField label="合同类别"><Input className="w-[140px] h-9 rounded-md border border-border bg-background px-3 text-[13px]" value={s.category} onChange={e => setS({ ...s, category: e.target.value })} /></ErpSearchField>
          <ErpSearchField label="相对方名称"><Input className="w-[160px] h-9 rounded-md border border-border bg-background px-3 text-[13px]" value={s.counterparty} onChange={e => setS({ ...s, counterparty: e.target.value })} /></ErpSearchField>
          <ErpSearchField label="所属组织"><Input className="w-[140px] h-9 rounded-md border border-border bg-background px-3 text-[13px]" value={s.organization} onChange={e => setS({ ...s, organization: e.target.value })} /></ErpSearchField>
        </ErpSearchFields>

        <div className="min-h-0">
          <ErpTable>
            <ErpThead>
              <ErpTh className="w-[48px]"><Checkbox checked={items.length > 0 && sel.size === items.length} onCheckedChange={(v: boolean) => toggleAll(v)} /></ErpTh>
              <ErpTh className="w-[64px]">序号</ErpTh>
              <ErpTh className="w-[100px]">审批状态</ErpTh>
              <ErpTh className="w-[170px]">合同编码</ErpTh>
              <ErpTh className="w-[220px]">合同名称</ErpTh>
              <ErpTh className="w-[130px]">合同类别</ErpTh>
              <ErpTh className="w-[200px]">相对方名称</ErpTh>
              <ErpTh className="w-[140px]">合同总金额</ErpTh>
              <ErpTh className="w-[120px]">履约开始</ErpTh>
              <ErpTh className="w-[120px]">履约结束</ErpTh>
              <ErpTh className="w-[160px]">所属组织</ErpTh>
              <ErpTh className="w-[160px]">创建时间</ErpTh>
              <ErpTh className="w-[220px] sticky right-0 bg-[#f5f7fa] z-10">操作</ErpTh>
            </ErpThead>
            <ErpTbody>
              {items.map((i, idx) => (
                <ErpTr key={i.id}>
                  <ErpTd><Checkbox checked={sel.has(i.id)} onCheckedChange={(v: boolean) => toggleOne(i.id, v)} /></ErpTd>
                  <ErpTd className="text-[#909399]">{(pg - 1) * ps + idx + 1}</ErpTd>
                  <ErpTd><ErpApproval status={i.approvalStatus} /></ErpTd>
                  <ErpTd><ErpLink onClick={() => router.push(`/contract/${i.id}/edit`)}>{i.code}</ErpLink></ErpTd>
                  <ErpTd>{i.name}</ErpTd>
                  <ErpTd className="text-[#909399]">{i.category || '-'}</ErpTd>
                  <ErpTd>{counterpartyName(i)}</ErpTd>
                  <ErpTd className="text-right">{i.totalAmount ? Number(i.totalAmount).toLocaleString('zh-CN', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) : '-'}</ErpTd>
                  <ErpTd className="text-[#909399]">{i.startDate ? new Date(i.startDate).toLocaleDateString('zh-CN') : '-'}</ErpTd>
                  <ErpTd className="text-[#909399]">{i.endDate ? new Date(i.endDate).toLocaleDateString('zh-CN') : '-'}</ErpTd>
                  <ErpTd className="text-[#909399]">{i.organizationName || '-'}</ErpTd>
                  <ErpTd className="text-[#909399]">{new Date(i.createdAt).toLocaleDateString('zh-CN')}</ErpTd>
                  <ErpTd className="sticky right-0 bg-white z-10">
                    <ErpAction>
                      <ErpActionBtn onClick={() => router.push(`/contract/${i.id}/edit`)}><Pencil className="h-3.5 w-3.5" />修改</ErpActionBtn>
                      {i.approvalStatus === 'DRAFT' && <ErpActionBtn onClick={() => doSubmit(i.id)}><Send className="h-3.5 w-3.5" />提交</ErpActionBtn>}
                      {i.approvalStatus === 'SUBMITTED' && (
                        <>
                          <ErpActionBtn onClick={() => doApprove(i.id)}><CheckCircle className="h-3.5 w-3.5" />通过</ErpActionBtn>
                          <ErpActionBtn onClick={() => doReject(i.id)} danger><XCircle className="h-3.5 w-3.5" />拒绝</ErpActionBtn>
                          <ErpActionBtn onClick={() => doWithdraw(i.id)}><RotateCcw className="h-3.5 w-3.5" />撤回</ErpActionBtn>
                        </>
                      )}
                      {(i.approvalStatus === 'DRAFT' || i.approvalStatus === 'REJECTED') && (
                        <ErpActionBtn danger onClick={() => setDelId(i.id)}><Trash2 className="h-3.5 w-3.5" />删除</ErpActionBtn>
                      )}
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
