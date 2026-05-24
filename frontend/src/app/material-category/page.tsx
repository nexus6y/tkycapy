'use client';
import { useEffect, useState, useCallback } from 'react';
import api from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card } from '@/components/ui/card';
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from '@/components/ui/dialog';
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel,
  AlertDialogContent, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

interface Category {
  id: string; code: string; name: string; parentId: string | null;
  parentCode: string; parentName: string; sortOrder: number;
  status: string; createdAt: string;
}

export default function MaterialCategoryPage() {
  const [items, setItems] = useState<Category[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState({ code: '', name: '', status: '' });
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<Category | null>(null);
  const [form, setForm] = useState({ code: '', name: '', parentId: '', sortOrder: 0, status: 'ACTIVE' });
  const [deleteId, setDeleteId] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    setLoading(true);
    const params: any = { page, pageSize: 20 };
    if (search.code) params.code = search.code;
    if (search.name) params.name = search.name;
    if (search.status) params.status = search.status;
    const { data } = await api.get('/material-categories', { params });
    setItems(data.items);
    setTotal(data.total);
    setLoading(false);
  }, [page, search]);

  useEffect(() => { fetchData(); }, [fetchData]);

  const openAdd = () => {
    setEditing(null);
    setForm({ code: '', name: '', parentId: '', sortOrder: 0, status: 'ACTIVE' });
    setDialogOpen(true);
  };

  const openEdit = (item: Category) => {
    setEditing(item);
    setForm({ code: item.code, name: item.name, parentId: item.parentId || '', sortOrder: item.sortOrder, status: item.status });
    setDialogOpen(true);
  };

  const handleSave = async () => {
    try {
      if (editing) {
        await api.put(`/material-categories/${editing.id}`, {
          name: form.name, parentId: form.parentId || null, sortOrder: form.sortOrder, status: form.status,
        });
      } else {
        await api.post('/material-categories', form);
      }
      setDialogOpen(false);
      fetchData();
    } catch (err: any) {
      alert(err.response?.data?.message || '保存失败');
    }
  };

  const handleDelete = async () => {
    if (!deleteId) return;
    try {
      await api.delete(`/material-categories/${deleteId}`);
      setDeleteId(null);
      fetchData();
    } catch (err: any) {
      alert(err.response?.data?.message || '删除失败');
    }
  };

  const toggleStatus = async (item: Category) => {
    await api.put(`/material-categories/${item.id}`, { status: item.status === 'ACTIVE' ? 'INACTIVE' : 'ACTIVE' });
    fetchData();
  };

  return (
    <div className="p-6 space-y-4">
      <h1 className="text-xl font-bold">物料分类管理</h1>

      <Card className="p-4">
        <div className="flex gap-3 flex-wrap items-end">
          <div className="w-40">
            <label className="text-xs text-gray-500">分类编码</label>
            <Input value={search.code} onChange={e => setSearch({ ...search, code: e.target.value })} placeholder="编码" />
          </div>
          <div className="w-40">
            <label className="text-xs text-gray-500">分类名称</label>
            <Input value={search.name} onChange={e => setSearch({ ...search, name: e.target.value })} placeholder="名称" />
          </div>
          <div className="w-32">
            <label className="text-xs text-gray-500">状态</label>
            <Select value={search.status} onValueChange={v => setSearch({ ...search, status: v === 'ALL' ? '' : v })}>
              <SelectTrigger><SelectValue placeholder="全部" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="ALL">全部</SelectItem>
                <SelectItem value="ACTIVE">启用</SelectItem>
                <SelectItem value="INACTIVE">停用</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <Button onClick={fetchData}>搜索</Button>
          <Button variant="outline" onClick={() => setSearch({ code: '', name: '', status: '' })}>重置</Button>
          <div className="ml-auto">
            <Button onClick={openAdd}>新增</Button>
          </div>
        </div>
      </Card>

      <Card>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>状态</TableHead>
              <TableHead>分类编码</TableHead>
              <TableHead>分类名称</TableHead>
              <TableHead>上级分类编码</TableHead>
              <TableHead>上级分类名称</TableHead>
              <TableHead>排序</TableHead>
              <TableHead>创建时间</TableHead>
              <TableHead>操作</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {items.map(item => (
              <TableRow key={item.id}>
                <TableCell>
                  <span className={`px-2 py-0.5 rounded text-xs ${item.status === 'ACTIVE' ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'}`}>
                    {item.status === 'ACTIVE' ? '启用' : '停用'}
                  </span>
                </TableCell>
                <TableCell>{item.code}</TableCell>
                <TableCell>{item.name}</TableCell>
                <TableCell>{item.parentCode}</TableCell>
                <TableCell>{item.parentName}</TableCell>
                <TableCell>{item.sortOrder}</TableCell>
                <TableCell>{new Date(item.createdAt).toLocaleDateString('zh-CN')}</TableCell>
                <TableCell>
                  <div className="flex gap-2">
                    <Button size="sm" variant="outline" onClick={() => openEdit(item)}>修改</Button>
                    <Button size="sm" variant="outline" onClick={() => toggleStatus(item)}>
                      {item.status === 'ACTIVE' ? '停用' : '启用'}
                    </Button>
                    <Button size="sm" variant="outline" className="text-red-600" onClick={() => setDeleteId(item.id)}>删除</Button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
            {items.length === 0 && (
              <TableRow><TableCell colSpan={8} className="text-center text-gray-400 py-8">暂无数据</TableCell></TableRow>
            )}
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

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editing ? '修改分类' : '新增分类'}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div>
              <label className="text-sm font-medium">分类编码 *</label>
              <Input value={form.code} onChange={e => setForm({ ...form, code: e.target.value })} disabled={!!editing} />
            </div>
            <div>
              <label className="text-sm font-medium">分类名称 *</label>
              <Input value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} />
            </div>
            <div>
              <label className="text-sm font-medium">上级分类</label>
              <Select value={form.parentId} onValueChange={v => setForm({ ...form, parentId: v === 'NONE' ? '' : v })}>
                <SelectTrigger><SelectValue placeholder="无" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="NONE">无</SelectItem>
                  {items.filter(i => i.id !== editing?.id).map(i => (
                    <SelectItem key={i.id} value={i.id}>{i.code} - {i.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="text-sm font-medium">排序</label>
              <Input type="number" value={form.sortOrder} onChange={e => setForm({ ...form, sortOrder: +e.target.value })} />
            </div>
            <div>
              <label className="text-sm font-medium">状态</label>
              <Select value={form.status} onValueChange={v => setForm({ ...form, status: v })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="ACTIVE">启用</SelectItem>
                  <SelectItem value="INACTIVE">停用</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>取消</Button>
            <Button onClick={handleSave}>确定</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <AlertDialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader><AlertDialogTitle>确认删除？</AlertDialogTitle></AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>取消</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-red-600 hover:bg-red-700">删除</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
