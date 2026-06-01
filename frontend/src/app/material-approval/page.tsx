'use client';
import { useEffect, useState, useCallback } from 'react';
import api from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { TooltipProvider } from '@/components/ui/tooltip';
import { ErpTable, ErpThead, ErpTh, ErpTbody, ErpTr, ErpTd, ErpEmpty, ErpApproval, ErpPagination, ErpListPage } from '@/components/ui/erp-table';
import { ErpToolbar } from '@/components/ui/erp-toolbar';
import { ErpSearchFields, ErpSearchField } from '@/components/ui/erp-search-fields';

interface Material {
  id: string; code: string; name: string; specification: string | null;
  categoryName: string; unitName: string; approvalStatus: string; remark: string | null; createdAt: string;
}

export default function MaterialApprovalPage() {
  const [items, setItems] = useState<Material[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(30);
  const [status, setStatus] = useState('');
  const [code, setCode] = useState('');
  const [comment, setComment] = useState('');
  const [actionTarget, setActionTarget] = useState<{ id: string; action: string } | null>(null);

  const fetchData = useCallback(async () => {
    const { data } = await api.get('/material-approvals', {
      params: { page, pageSize, status: status || undefined, code: code || undefined },
    });
    setItems(data.items);
    setTotal(data.total);
  }, [page, pageSize, status, code]);

  useEffect(() => { fetchData(); }, [fetchData]);

  const handleAction = async () => {
    if (!actionTarget) return;
    const { id, action } = actionTarget;
    await api.put(`/material-approvals/${id}/${action}`, { comment: comment || undefined });
    setActionTarget(null);
    setComment('');
    fetchData();
  };

  const openAction = (id: string, action: string) => {
    setActionTarget({ id, action });
    setComment('');
  };

  const handleSubmit = (id: string) => {
    api.put(`/material-approvals/${id}/submit`).then(fetchData);
  };

  const colSpan = 8;

  return (
    <TooltipProvider>
      <ErpListPage>
        <ErpToolbar
          addLabel=""
          showReset
          onReset={() => { setCode(''); setStatus(''); }}
          onSearch={fetchData}
          searchLabel="查询"
        />

        <ErpSearchFields>
          <ErpSearchField label="物料编码">
            <Input
              className="w-[140px] h-9 rounded-md border border-border bg-background px-3 text-[13px]"
              value={code}
              onChange={e => setCode(e.target.value)}
              placeholder="编码"
            />
          </ErpSearchField>
          <ErpSearchField label="审批状态">
            <Select
              value={status}
              onValueChange={(v: any) => setStatus(v === 'ALL' ? '' : v)}
            >
              <SelectTrigger className="w-[120px] h-9 rounded-md border border-border bg-background px-3 text-[13px]">
                <SelectValue placeholder="全部" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ALL">全部</SelectItem>
                <SelectItem value="DRAFT">草稿</SelectItem>
                <SelectItem value="SUBMITTED">已提交</SelectItem>
                <SelectItem value="APPROVED">已通过</SelectItem>
                <SelectItem value="REJECTED">已拒绝</SelectItem>
              </SelectContent>
            </Select>
          </ErpSearchField>
        </ErpSearchFields>

        <div className="overflow-auto">
          <ErpTable>
            <ErpThead>
              <ErpTh>物料编码</ErpTh>
              <ErpTh>物料名称</ErpTh>
              <ErpTh>规格型号</ErpTh>
              <ErpTh>分类</ErpTh>
              <ErpTh>单位</ErpTh>
              <ErpTh>审批状态</ErpTh>
              <ErpTh>创建时间</ErpTh>
              <ErpTh>操作</ErpTh>
            </ErpThead>
            <ErpTbody>
              {items.map(item => (
                <ErpTr key={item.id}>
                  <ErpTd className="font-mono">{item.code}</ErpTd>
                  <ErpTd>{item.name}</ErpTd>
                  <ErpTd className="text-[#909399]">{item.specification || '-'}</ErpTd>
                  <ErpTd>{item.categoryName}</ErpTd>
                  <ErpTd>{item.unitName}</ErpTd>
                  <ErpTd>
                    <ErpApproval status={item.approvalStatus} />
                  </ErpTd>
                  <ErpTd className="text-[#909399]">
                    {new Date(item.createdAt).toLocaleDateString('zh-CN')}
                  </ErpTd>
                  <ErpTd>
                    <div className="flex items-center gap-2">
                      {item.approvalStatus === 'DRAFT' && (
                        <Button size="sm" onClick={() => handleSubmit(item.id)}>提交</Button>
                      )}
                      {item.approvalStatus === 'SUBMITTED' && (
                        <>
                          <Button size="sm" onClick={() => openAction(item.id, 'approve')}>通过</Button>
                          <Button size="sm" variant="outline" className="text-[#f56c6c] border-[#f56c6c]" onClick={() => openAction(item.id, 'reject')}>拒绝</Button>
                        </>
                      )}
                    </div>
                  </ErpTd>
                </ErpTr>
              ))}
              {items.length === 0 && <ErpEmpty colSpan={colSpan} />}
            </ErpTbody>
          </ErpTable>
        </div>

        <ErpPagination page={page} pageSize={pageSize} total={total} onPage={setPage} onPageSize={v => setPageSize(+v)} />

        <Dialog open={!!actionTarget} onOpenChange={() => setActionTarget(null)}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>{actionTarget?.action === 'approve' ? '审批通过' : '审批拒绝'}</DialogTitle>
            </DialogHeader>
            <div className="space-y-3 py-2">
              <div>
                <label className="text-sm font-medium">审批意见</label>
                <Input value={comment} onChange={e => setComment(e.target.value)} placeholder="可选" />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setActionTarget(null)}>取消</Button>
              <Button onClick={handleAction} className={actionTarget?.action === 'reject' ? 'bg-[#f56c6c] hover:bg-[#f56c6c]/90' : ''}>确定</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </ErpListPage>
    </TooltipProvider>
  );
}
