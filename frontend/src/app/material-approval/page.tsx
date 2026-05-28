'use client';
import { useEffect, useState, useCallback } from 'react';
import api from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';

interface Material {
  id: string; code: string; name: string; specification: string | null;
  categoryName: string; unitName: string; approvalStatus: string; remark: string | null; createdAt: string;
}

const STATUS_MAP: Record<string, string> = {
  DRAFT: '草稿', SUBMITTED: '已提交', APPROVED: '已通过', REJECTED: '已拒绝',
};

export default function MaterialApprovalPage() {
  const [items, setItems] = useState<Material[]>([]);
  const [total, setTotal] = useState(0); const [page, setPage] = useState(1);
  const [status, setStatus] = useState(''); const [code, setCode] = useState('');
  const [comment, setComment] = useState(''); const [actionTarget, setActionTarget] = useState<{ id: string; action: string } | null>(null);

  const fetchData = useCallback(async () => {
    const { data } = await api.get('/material-approvals', { params: { page, pageSize: 20, status: status || undefined, code: code || undefined } });
    setItems(data.items); setTotal(data.total);
  }, [page, status, code]);

  useEffect(() => { fetchData(); }, [fetchData]);

  const handleAction = async () => {
    if (!actionTarget) return;
    const { id, action } = actionTarget;
    const url = `/material-approvals/${id}/${action}`;
    await api.put(url, { comment: comment || undefined });
    setActionTarget(null); setComment(''); fetchData();
  };

  const openAction = (id: string, action: string) => { setActionTarget({ id, action }); setComment(''); };

  return (
    <div className="p-6 space-y-4">
      <h1 className="text-xl font-bold">物料审批</h1>
      <Card className="p-4">
        <div className="flex gap-3 flex-wrap items-end">
          <div className="w-36"><label className="text-xs text-gray-500">物料编码</label><Input value={code} onChange={e => setCode(e.target.value)} /></div>
          <div className="w-32"><label className="text-xs text-gray-500">审批状态</label>
            <Select value={status} onValueChange={(v:any) => setStatus(v === 'ALL' ? '' : v)}>
              <SelectTrigger><SelectValue placeholder="全部" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="ALL">全部</SelectItem><SelectItem value="DRAFT">草稿</SelectItem>
                <SelectItem value="SUBMITTED">已提交</SelectItem><SelectItem value="APPROVED">已通过</SelectItem><SelectItem value="REJECTED">已拒绝</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <Button onClick={fetchData}>搜索</Button>
          <Button variant="outline" onClick={() => { setCode(''); setStatus(''); }}>重置</Button>
        </div>
      </Card>

      <Card>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>物料编码</TableHead><TableHead>物料名称</TableHead><TableHead>规格型号</TableHead>
              <TableHead>分类</TableHead><TableHead>单位</TableHead><TableHead>审批状态</TableHead>
              <TableHead>创建时间</TableHead><TableHead>操作</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {items.map(item => (
              <TableRow key={item.id}>
                <TableCell className="font-mono text-sm">{item.code}</TableCell>
                <TableCell>{item.name}</TableCell>
                <TableCell>{item.specification || '-'}</TableCell>
                <TableCell>{item.categoryName}</TableCell>
                <TableCell>{item.unitName}</TableCell>
                <TableCell>
                  <span className={`px-2 py-0.5 rounded text-xs ${
                    item.approvalStatus === 'APPROVED' ? 'bg-green-100 text-green-700' :
                    item.approvalStatus === 'REJECTED' ? 'bg-red-100 text-red-700' :
                    item.approvalStatus === 'SUBMITTED' ? 'bg-blue-100 text-blue-700' : 'bg-gray-100 text-gray-500'
                  }`}>{STATUS_MAP[item.approvalStatus] || item.approvalStatus}</span>
                </TableCell>
                <TableCell>{new Date(item.createdAt).toLocaleDateString('zh-CN')}</TableCell>
                <TableCell>
                  <div className="flex gap-1">
                    {item.approvalStatus === 'DRAFT' && (
                      <Button size="sm" onClick={() => { api.put(`/material-approvals/${item.id}/submit`).then(fetchData); }}>提交</Button>
                    )}
                    {item.approvalStatus === 'SUBMITTED' && (
                      <>
                        <Button size="sm" onClick={() => openAction(item.id, 'approve')}>通过</Button>
                        <Button size="sm" variant="outline" className="text-red-600" onClick={() => openAction(item.id, 'reject')}>拒绝</Button>
                      </>
                    )}
                  </div>
                </TableCell>
              </TableRow>
            ))}
            {items.length === 0 && <TableRow><TableCell colSpan={8} className="text-center text-gray-400 py-8">暂无审批数据</TableCell></TableRow>}
          </TableBody>
        </Table>
        <div className="flex items-center justify-between px-4 py-3 border-t">
          <span className="text-sm text-gray-500">共 {total} 条</span>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" disabled={page <= 1} onClick={() => setPage(p => p - 1)}>上一页</Button>
            <Button variant="outline" size="sm" disabled={page * 20 >= total} onClick={() => setPage(p => p + 1)}>下一页</Button>
          </div>
        </div>
      </Card>

      <Dialog open={!!actionTarget} onOpenChange={() => setActionTarget(null)}>
        <DialogContent>
          <DialogHeader><DialogTitle>{actionTarget?.action === 'approve' ? '审批通过' : '审批拒绝'}</DialogTitle></DialogHeader>
          <div className="space-y-3 py-2">
            <div><label className="text-sm font-medium">审批意见</label><Input value={comment} onChange={e => setComment(e.target.value)} placeholder="可选" /></div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setActionTarget(null)}>取消</Button>
            <Button onClick={handleAction} className={actionTarget?.action === 'reject' ? 'bg-red-600 hover:bg-red-700' : ''}>确定</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
