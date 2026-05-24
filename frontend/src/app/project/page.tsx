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

interface Project { id: string; code: string; name: string; source: string | null; approvalStatus: string; createdAt: string; }

const STATUS_MAP: Record<string, string> = {
  DRAFT: '草稿', SUBMITTED: '已提交', APPROVED: '已通过', REJECTED: '已拒绝',
};

export default function ProjectPage() {
  const [items, setItems] = useState<Project[]>([]);
  const [total, setTotal] = useState(0); const [page, setPage] = useState(1);
  const [search, setSearch] = useState({ code: '', name: '', status: '' });
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<Project | null>(null);
  const [form, setForm] = useState({ code: '', name: '', source: '' });
  const [deleteId, setDeleteId] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    const params: any = { page, pageSize: 20 };
    if (search.code) params.code = search.code;
    if (search.name) params.name = search.name;
    if (search.status) params.status = search.status;
    const { data } = await api.get('/projects', { params });
    setItems(data.items); setTotal(data.total);
  }, [page, search]);

  useEffect(() => { fetchData(); }, [fetchData]);

  const openAdd = () => { setEditing(null); setForm({ code: '', name: '', source: '' }); setDialogOpen(true); };
  const openEdit = (item: Project) => { setEditing(item); setForm({ code: item.code, name: item.name, source: item.source || '' }); setDialogOpen(true); };

  const handleSave = async () => {
    try {
      if (editing) await api.put(`/projects/${editing.id}`, { name: form.name, source: form.source || null });
      else await api.post('/projects', form);
      setDialogOpen(false); fetchData();
    } catch (err: any) { alert(err.response?.data?.message || '保存失败'); }
  };

  const handleDelete = async () => {
    if (!deleteId) return;
    await api.delete(`/projects/${deleteId}`); setDeleteId(null); fetchData();
  };

  return (
    <div className="p-6 space-y-4">
      <h1 className="text-xl font-bold">项目维护</h1>
      <Card className="p-4">
        <div className="flex gap-3 flex-wrap items-end">
          <div className="w-36"><label className="text-xs text-gray-500">项目编码</label><Input value={search.code} onChange={e => setSearch({ ...search, code: e.target.value })} /></div>
          <div className="w-36"><label className="text-xs text-gray-500">项目名称</label><Input value={search.name} onChange={e => setSearch({ ...search, name: e.target.value })} /></div>
          <div className="w-32"><label className="text-xs text-gray-500">审批状态</label>
            <Select value={search.status} onValueChange={v => setSearch({ ...search, status: v === 'ALL' ? '' : v })}>
              <SelectTrigger><SelectValue placeholder="全部" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="ALL">全部</SelectItem><SelectItem value="DRAFT">草稿</SelectItem><SelectItem value="SUBMITTED">已提交</SelectItem><SelectItem value="APPROVED">已通过</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <Button onClick={fetchData}>搜索</Button><Button variant="outline" onClick={() => setSearch({ code: '', name: '', status: '' })}>重置</Button>
          <div className="ml-auto"><Button onClick={openAdd}>新增</Button></div>
        </div>
      </Card>

      <Card>
        <Table><TableHeader><TableRow>
          <TableHead>审批状态</TableHead><TableHead>项目编码</TableHead><TableHead>项目名称</TableHead><TableHead>项目来源</TableHead><TableHead>创建时间</TableHead><TableHead>操作</TableHead>
        </TableRow></TableHeader>
        <TableBody>
          {items.map(item => (
            <TableRow key={item.id}>
              <TableCell><span className={`px-2 py-0.5 rounded text-xs ${item.approvalStatus === 'APPROVED' ? 'bg-green-100 text-green-700' : item.approvalStatus === 'SUBMITTED' ? 'bg-blue-100 text-blue-700' : 'bg-gray-100 text-gray-500'}`}>{STATUS_MAP[item.approvalStatus]}</span></TableCell>
              <TableCell className="font-mono text-sm">{item.code}</TableCell>
              <TableCell>{item.name}</TableCell>
              <TableCell>{item.source || '-'}</TableCell>
              <TableCell>{new Date(item.createdAt).toLocaleDateString('zh-CN')}</TableCell>
              <TableCell><div className="flex gap-1">
                <Button size="sm" variant="outline" onClick={() => openEdit(item)}>修改</Button>
                {item.approvalStatus === 'DRAFT' && <Button size="sm" onClick={() => { api.put(`/projects/${item.id}/submit`).then(fetchData); }}>提交</Button>}
                <Button size="sm" variant="outline" className="text-red-600" onClick={() => setDeleteId(item.id)}>删除</Button>
              </div></TableCell>
            </TableRow>
          ))}
          {items.length === 0 && <TableRow><TableCell colSpan={6} className="text-center text-gray-400 py-8">暂无数据</TableCell></TableRow>}
        </TableBody></Table>
        <div className="flex items-center justify-between px-4 py-3 border-t">
          <span className="text-sm text-gray-500">共 {total} 条</span>
          <div className="flex gap-2"><Button variant="outline" size="sm" disabled={page <= 1} onClick={() => setPage(p => p - 1)}>上一页</Button><Button variant="outline" size="sm" disabled={page * 20 >= total} onClick={() => setPage(p => p + 1)}>下一页</Button></div>
        </div>
      </Card>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent><DialogHeader><DialogTitle>{editing ? '修改项目' : '新增项目'}</DialogTitle></DialogHeader>
          <div className="space-y-3 py-2">
            <div><label className="text-sm font-medium">项目编码 *</label><Input value={form.code} onChange={e => setForm({ ...form, code: e.target.value })} disabled={!!editing} /></div>
            <div><label className="text-sm font-medium">项目名称 *</label><Input value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} /></div>
            <div><label className="text-sm font-medium">项目来源</label><Input value={form.source} onChange={e => setForm({ ...form, source: e.target.value })} /></div>
          </div>
          <DialogFooter><Button variant="outline" onClick={() => setDialogOpen(false)}>取消</Button><Button onClick={handleSave}>确定</Button></DialogFooter>
        </DialogContent>
      </Dialog>

      <AlertDialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
        <AlertDialogContent><AlertDialogHeader><AlertDialogTitle>确认删除？</AlertDialogTitle></AlertDialogHeader>
          <AlertDialogFooter><AlertDialogCancel>取消</AlertDialogCancel><AlertDialogAction onClick={handleDelete} className="bg-red-600 hover:bg-red-700">删除</AlertDialogAction></AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
