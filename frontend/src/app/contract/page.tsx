'use client';
import { useEffect, useState, useCallback } from 'react';
import api from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

interface Contract { id: string; code: string; name: string; type: string; isProjectContract: boolean; isFrameworkContract: boolean; projectId: string | null; customerName: string | null; supplierName: string | null; startDate: string | null; endDate: string | null; totalAmount: string | null; approvalStatus: string; createdAt: string; }

const STATUS_MAP: Record<string, string> = { DRAFT: '草稿', SUBMITTED: '已提交', APPROVED: '已通过', REJECTED: '已拒绝', WITHDRAWN: '已撤回' };

export default function ContractPage() {
  const [items, setItems] = useState<Contract[]>([]);
  const [total, setTotal] = useState(0); const [page, setPage] = useState(1);
  const [search, setSearch] = useState({ code: '', name: '', status: '', type: '' });
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<Contract | null>(null);
  const [form, setForm] = useState({ code: '', name: '', type: '销售合同', isProjectContract: false, isFrameworkContract: false, customerName: '', supplierName: '', startDate: '', endDate: '', totalAmount: '' });
  const [deleteId, setDeleteId] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    const params: any = { page, pageSize: 20 };
    if (search.code) params.code = search.code;
    if (search.name) params.name = search.name;
    if (search.status) params.status = search.status;
    if (search.type) params.type = search.type;
    const { data } = await api.get('/contracts', { params });
    setItems(data.items); setTotal(data.total);
  }, [page, search]);

  useEffect(() => { fetchData(); }, [fetchData]);

  const openAdd = () => {
    setEditing(null); setForm({ code: '', name: '', type: '销售合同', isProjectContract: false, isFrameworkContract: false, customerName: '', supplierName: '', startDate: '', endDate: '', totalAmount: '' });
    setDialogOpen(true);
  };
  const openEdit = (item: Contract) => {
    setEditing(item);
    setForm({ code: item.code, name: item.name, type: item.type, isProjectContract: item.isProjectContract, isFrameworkContract: item.isFrameworkContract, customerName: item.customerName || '', supplierName: item.supplierName || '', startDate: item.startDate?.split('T')[0] || '', endDate: item.endDate?.split('T')[0] || '', totalAmount: item.totalAmount || '' });
    setDialogOpen(true);
  };

  const handleSave = async () => {
    try {
      const data = { ...form, totalAmount: form.totalAmount ? +form.totalAmount : null, isProjectContract: form.isProjectContract, isFrameworkContract: form.isFrameworkContract, startDate: form.startDate ? new Date(form.startDate).toISOString() : null, endDate: form.endDate ? new Date(form.endDate).toISOString() : null };
      if (editing) await api.put(`/contracts/${editing.id}`, data);
      else await api.post('/contracts', data);
      setDialogOpen(false); fetchData();
    } catch (err: any) { alert(err.response?.data?.message || '保存失败'); }
  };

  const handleDelete = async () => { if (!deleteId) return; await api.delete(`/contracts/${deleteId}`); setDeleteId(null); fetchData(); };

  const STATUS = STATUS_MAP;

  return (
    <div className="p-6 space-y-4">
      <h1 className="text-xl font-bold">合同维护</h1>
      <Card className="p-4"><div className="flex gap-3 flex-wrap items-end">
        <div className="w-36"><label className="text-xs text-gray-500">合同编码</label><Input value={search.code} onChange={e => setSearch({ ...search, code: e.target.value })} /></div>
        <div className="w-36"><label className="text-xs text-gray-500">合同名称</label><Input value={search.name} onChange={e => setSearch({ ...search, name: e.target.value })} /></div>
        <div className="w-28"><label className="text-xs text-gray-500">类型</label>
          <Select value={search.type} onValueChange={v => setSearch({ ...search, type: v === 'ALL' ? '' : v })}>
            <SelectTrigger><SelectValue placeholder="全部" /></SelectTrigger><SelectContent><SelectItem value="ALL">全部</SelectItem><SelectItem value="销售合同">销售合同</SelectItem><SelectItem value="采购合同">采购合同</SelectItem></SelectContent>
          </Select>
        </div>
        <div className="w-28"><label className="text-xs text-gray-500">状态</label>
          <Select value={search.status} onValueChange={v => setSearch({ ...search, status: v === 'ALL' ? '' : v })}>
            <SelectTrigger><SelectValue placeholder="全部" /></SelectTrigger><SelectContent><SelectItem value="ALL">全部</SelectItem><SelectItem value="DRAFT">草稿</SelectItem><SelectItem value="SUBMITTED">已提交</SelectItem><SelectItem value="APPROVED">已通过</SelectItem></SelectContent>
          </Select>
        </div>
        <Button onClick={fetchData}>搜索</Button><Button variant="outline" onClick={() => setSearch({ code: '', name: '', status: '', type: '' })}>重置</Button>
        <div className="ml-auto"><Button onClick={openAdd}>新增</Button></div>
      </div></Card>

      <Card><Table><TableHeader><TableRow>
        <TableHead>状态</TableHead><TableHead>合同编码</TableHead><TableHead>合同名称</TableHead><TableHead>类型</TableHead><TableHead>客户/供应商</TableHead><TableHead>金额</TableHead><TableHead>创建时间</TableHead><TableHead>操作</TableHead>
      </TableRow></TableHeader>
      <TableBody>
        {items.map(item => (
          <TableRow key={item.id}>
            <TableCell><span className={`px-2 py-0.5 rounded text-xs ${item.approvalStatus === 'APPROVED' ? 'bg-green-100 text-green-700' : item.approvalStatus === 'SUBMITTED' ? 'bg-blue-100 text-blue-700' : 'bg-gray-100 text-gray-500'}`}>{STATUS[item.approvalStatus]}</span></TableCell>
            <TableCell className="font-mono text-sm">{item.code}</TableCell>
            <TableCell>{item.name}</TableCell>
            <TableCell>{item.type}</TableCell>
            <TableCell>{item.customerName || item.supplierName || '-'}</TableCell>
            <TableCell>{item.totalAmount ? Number(item.totalAmount).toLocaleString() : '-'}</TableCell>
            <TableCell>{new Date(item.createdAt).toLocaleDateString('zh-CN')}</TableCell>
            <TableCell><div className="flex gap-1">
              <Button size="sm" variant="outline" onClick={() => openEdit(item)}>修改</Button>
              {item.approvalStatus === 'DRAFT' && <Button size="sm" onClick={() => { api.put(`/contracts/${item.id}/submit`).then(fetchData); }}>提交</Button>}
              {item.approvalStatus === 'SUBMITTED' && <Button size="sm" variant="outline" onClick={() => { api.put(`/contracts/${item.id}/withdraw`).then(fetchData); }}>撤回</Button>}
              <Button size="sm" variant="outline" className="text-red-600" onClick={() => setDeleteId(item.id)}>删除</Button>
            </div></TableCell>
          </TableRow>
        ))}
        {items.length === 0 && <TableRow><TableCell colSpan={8} className="text-center text-gray-400 py-8">暂无数据</TableCell></TableRow>}
      </TableBody></Table>
      <div className="flex items-center justify-between px-4 py-3 border-t"><span className="text-sm text-gray-500">共 {total} 条</span><div className="flex gap-2"><Button variant="outline" size="sm" disabled={page <= 1} onClick={() => setPage(p => p - 1)}>上一页</Button><Button variant="outline" size="sm" disabled={page * 20 >= total} onClick={() => setPage(p => p + 1)}>下一页</Button></div></div></Card>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-lg"><DialogHeader><DialogTitle>{editing ? '修改合同' : '新增合同'}</DialogTitle></DialogHeader>
        <div className="space-y-3 max-h-[60vh] overflow-y-auto py-2">
          <div className="grid grid-cols-2 gap-3">
            <div><label className="text-sm font-medium">合同编码 *</label><Input value={form.code} onChange={e => setForm({ ...form, code: e.target.value })} disabled={!!editing} /></div>
            <div><label className="text-sm font-medium">合同名称 *</label><Input value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} /></div>
            <div><label className="text-sm font-medium">合同类型</label>
              <Select value={form.type} onValueChange={v => setForm({ ...form, type: v, customerName: '', supplierName: '' })}>
                <SelectTrigger><SelectValue /></SelectTrigger><SelectContent><SelectItem value="销售合同">销售合同</SelectItem><SelectItem value="采购合同">采购合同</SelectItem></SelectContent>
              </Select>
            </div>
            <div><label className="text-sm font-medium">{form.type === '销售合同' ? '客户名称' : '供应商名称'}</label>
              <Input value={form.type === '销售合同' ? form.customerName : form.supplierName} onChange={e => setForm({ ...form, [form.type === '销售合同' ? 'customerName' : 'supplierName']: e.target.value })} />
            </div>
            <div><label className="text-sm font-medium">开始日期</label><Input type="date" value={form.startDate} onChange={e => setForm({ ...form, startDate: e.target.value })} /></div>
            <div><label className="text-sm font-medium">结束日期</label><Input type="date" value={form.endDate} onChange={e => setForm({ ...form, endDate: e.target.value })} /></div>
            <div><label className="text-sm font-medium">金额</label><Input type="number" value={form.totalAmount} onChange={e => setForm({ ...form, totalAmount: e.target.value })} /></div>
          </div>
          <div className="flex gap-4">
            <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={form.isProjectContract} onChange={e => setForm({ ...form, isProjectContract: e.target.checked })} />项目合同</label>
            <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={form.isFrameworkContract} onChange={e => setForm({ ...form, isFrameworkContract: e.target.checked })} />框架合同</label>
          </div>
        </div>
        <DialogFooter><Button variant="outline" onClick={() => setDialogOpen(false)}>取消</Button><Button onClick={handleSave}>确定</Button></DialogFooter></DialogContent>
      </Dialog>

      <AlertDialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
        <AlertDialogContent><AlertDialogHeader><AlertDialogTitle>确认删除？</AlertDialogTitle></AlertDialogHeader>
          <AlertDialogFooter><AlertDialogCancel>取消</AlertDialogCancel><AlertDialogAction onClick={handleDelete} className="bg-red-600 hover:bg-red-700">删除</AlertDialogAction></AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
