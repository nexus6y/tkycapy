'use client';
import { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import api from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { TooltipProvider } from '@/components/ui/tooltip';
import { Download, FileSearch, Search } from 'lucide-react';
import { ErpTable, ErpThead, ErpTh, ErpTbody, ErpTr, ErpTd, ErpEmpty, ErpLink, ErpTools, ErpApproval, ErpPagination } from '@/components/ui/erp-table';

interface Item {
  id: string; code: string; name: string; type: string; category: string | null;
  customerName: string | null; supplierName: string | null;
  organizationName: string | null;
  totalAmount: string | null; startDate: string | null; endDate: string | null;
  approvalStatus: string; createdAt: string;
}

export default function ContractQueryPage() {
  const router = useRouter();
  const [items, setItems] = useState<Item[]>([]); const [total, setTotal] = useState(0);
  const [pg, setPg] = useState(1); const [ps, setPs] = useState(30);
  const [s, setS] = useState({ code: '', name: '', type: '', counterparty: '', status: '', startDate: '', endDate: '' });

  const fetch = useCallback(async () => {
    const p: any = { page: pg, pageSize: ps };
    if (s.code) p.code = s.code;
    if (s.name) p.name = s.name;
    if (s.type) p.type = s.type;
    if (s.counterparty) p.counterparty = s.counterparty;
    if (s.status) p.status = s.status;
    const { data } = await api.get('/contracts', { params: p });
    setItems(data.items); setTotal(data.total);
  }, [pg, ps, s]);

  useEffect(() => { fetch(); }, [fetch]);

  const resetSearch = () => setS({ code: '', name: '', type: '', counterparty: '', status: '', startDate: '', endDate: '' });

  const counterpartyName = (i: Item) => i.customerName || i.supplierName || '-';

  return (
    <TooltipProvider>
      <div className="bg-background rounded-lg border border-border flex flex-col min-h-0">
        <div className="flex items-center justify-between px-4 h-14 border-b border-border">
          <div><Button variant="outline" size="sm"><Download className="h-3.5 w-3.5 mr-1" />导出</Button></div>
          <div className="flex items-center gap-1">
            <Button variant="ghost" size="sm" onClick={resetSearch}>重置</Button>
            <Button variant="default" size="sm" onClick={fetch}><Search className="h-3.5 w-3.5 mr-1" />搜索</Button>
          </div>
        </div>

        <div className="flex items-center gap-4 px-4 py-2.5 border-b border-border bg-muted/30 flex-wrap">
          <F label="审批状态">
            <Select value={s.status} onValueChange={(v: any) => setS({ ...s, status: v === 'ALL' ? '' : v })}>
              <SelectTrigger className="w-[100px] h-9 rounded-md border border-border bg-background px-3 text-[13px]"><SelectValue placeholder="全部" /></SelectTrigger>
              <SelectContent><SelectItem value="ALL">全部</SelectItem><SelectItem value="DRAFT">草稿</SelectItem><SelectItem value="SUBMITTED">已提交</SelectItem><SelectItem value="APPROVED">已通过</SelectItem><SelectItem value="REJECTED">已拒绝</SelectItem></SelectContent>
            </Select>
          </F>
          <F label="合同编码"><Input className="w-[140px] h-9 rounded-md border border-border bg-background px-3 text-[13px]" value={s.code} onChange={e => setS({ ...s, code: e.target.value })} /></F>
          <F label="合同名称"><Input className="w-[160px] h-9 rounded-md border border-border bg-background px-3 text-[13px]" value={s.name} onChange={e => setS({ ...s, name: e.target.value })} /></F>
          <F label="合同类型">
            <Select value={s.type} onValueChange={(v: any) => setS({ ...s, type: v === 'ALL' ? '' : v })}>
              <SelectTrigger className="w-[110px] h-9 rounded-md border border-border bg-background px-3 text-[13px]"><SelectValue placeholder="全部" /></SelectTrigger>
              <SelectContent><SelectItem value="ALL">全部</SelectItem><SelectItem value="销售合同">销售合同</SelectItem><SelectItem value="采购合同">采购合同</SelectItem></SelectContent>
            </Select>
          </F>
          <F label="相对方"><Input className="w-[140px] h-9 rounded-md border border-border bg-background px-3 text-[13px]" value={s.counterparty} onChange={e => setS({ ...s, counterparty: e.target.value })} placeholder="客户/供应商" /></F>
        </div>

        <ErpTools onRefresh={fetch} />

        <div className="min-h-0">
          <ErpTable>
            <ErpThead>
              <ErpTh className="w-[64px]">序号</ErpTh>
              <ErpTh className="w-[100px]">审批状态</ErpTh>
              <ErpTh className="w-[170px]">合同编码</ErpTh>
              <ErpTh className="w-[220px]">合同名称</ErpTh>
              <ErpTh className="w-[110px]">合同类型</ErpTh>
              <ErpTh className="w-[200px]">相对方名称</ErpTh>
              <ErpTh className="w-[140px]">合同总金额</ErpTh>
              <ErpTh className="w-[120px]">履约开始</ErpTh>
              <ErpTh className="w-[120px]">履约结束</ErpTh>
              <ErpTh className="w-[160px]">创建时间</ErpTh>
              <ErpTh className="w-[100px]">操作</ErpTh>
            </ErpThead>
            <ErpTbody>
              {items.map((i, idx) => (
                <ErpTr key={i.id}>
                  <ErpTd className="text-[#909399]">{(pg - 1) * ps + idx + 1}</ErpTd>
                  <ErpTd><ErpApproval status={i.approvalStatus} /></ErpTd>
                  <ErpTd><ErpLink onClick={() => router.push(`/contract/${i.id}/edit`)}>{i.code}</ErpLink></ErpTd>
                  <ErpTd>{i.name}</ErpTd>
                  <ErpTd>{i.type || '-'}</ErpTd>
                  <ErpTd>{counterpartyName(i)}</ErpTd>
                  <ErpTd className="text-right">{i.totalAmount ? Number(i.totalAmount).toLocaleString('zh-CN', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) : '-'}</ErpTd>
                  <ErpTd className="text-[#909399]">{i.startDate ? new Date(i.startDate).toLocaleDateString('zh-CN') : '-'}</ErpTd>
                  <ErpTd className="text-[#909399]">{i.endDate ? new Date(i.endDate).toLocaleDateString('zh-CN') : '-'}</ErpTd>
                  <ErpTd className="text-[#909399]">{new Date(i.createdAt).toLocaleDateString('zh-CN')}</ErpTd>
                  <ErpTd>
                    <button onClick={() => router.push(`/contract/${i.id}/edit`)} className="text-[13px] text-[#409eff] hover:underline inline-flex items-center gap-0.5">
                      <FileSearch className="h-3.5 w-3.5" />查看
                    </button>
                  </ErpTd>
                </ErpTr>
              ))}
              {items.length === 0 && <ErpEmpty colSpan={11} />}
            </ErpTbody>
          </ErpTable>
        </div>

        <ErpPagination page={pg} pageSize={ps} total={total} onPage={setPg} onPageSize={v => setPs(+v)} />
      </div>
    </TooltipProvider>
  );
}

function F({ label, children }: { label: string; children: React.ReactNode }) {
  return <div className="flex items-center gap-1.5"><span className="text-[13px] text-muted-foreground w-[80px] text-right shrink-0">{label}</span>{children}</div>;
}
