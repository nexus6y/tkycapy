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

interface Material {
  id: string; code: string; name: string; specification: string | null; externalCode: string | null;
  categoryId: string; categoryCode: string; categoryName: string;
  materialType: string; materialProperty: string | null; productCategory: string | null;
  unitId: string; unitCode: string; unitName: string; unitSymbol: string | null;
  sortOrder: number; status: string; remark: string | null; createdAt: string;
}

interface Category { id: string; code: string; name: string; }
interface Unit { id: string; code: string; name: string; symbol: string | null; }

export default function MaterialPage() {
  const [items, setItems] = useState<Material[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [categories, setCategories] = useState<Category[]>([]);
  const [units, setUnits] = useState<Unit[]>([]);
  const [search, setSearch] = useState({ code: '', name: '', categoryId: '', status: '', specification: '' });
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<Material | null>(null);
  const [form, setForm] = useState({
    code: '', name: '', categoryId: '', unitId: '', specification: '', externalCode: '',
    materialType: 'PHYSICAL', materialProperty: '', productCategory: '', sortOrder: 0, status: 'ACTIVE', remark: '',
  });
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [advancedOpen, setAdvancedOpen] = useState(false);

  const fetchData = useCallback(async () => {
    const params: any = { page, pageSize: 20 };
    if (search.code) params.code = search.code;
    if (search.name) params.name = search.name;
    if (search.categoryId) params.categoryId = search.categoryId;
    if (search.status) params.status = search.status;
    if (search.specification) params.specification = search.specification;
    const { data } = await api.get('/materials', { params });
    setItems(data.items); setTotal(data.total);
  }, [page, search]);

  useEffect(() => { fetchData(); }, [fetchData]);
  useEffect(() => {
    api.get('/material-categories', { params: { pageSize: 200 } }).then(r => setCategories(r.data.items));
    api.get('/measurement-units', { params: { pageSize: 200 } }).then(r => setUnits(r.data.items));
  }, []);

  const openAdd = () => {
    setEditing(null);
    setForm({ code: '', name: '', categoryId: '', unitId: '', specification: '', externalCode: '', materialType: 'PHYSICAL', materialProperty: '', productCategory: '', sortOrder: 0, status: 'ACTIVE', remark: '' });
    setDialogOpen(true);
  };
  const openEdit = (item: Material) => {
    setEditing(item);
    setForm({
      code: item.code, name: item.name, categoryId: item.categoryId, unitId: item.unitId,
      specification: item.specification || '', externalCode: item.externalCode || '',
      materialType: item.materialType, materialProperty: item.materialProperty || '',
      productCategory: item.productCategory || '', sortOrder: item.sortOrder,
      status: item.status, remark: item.remark || '',
    });
    setDialogOpen(true);
  };
  const handleSave = async () => {
    try {
      if (editing) {
        await api.put(`/materials/${editing.id}`, form);
      } else {
        await api.post('/materials', form);
      }
      setDialogOpen(false);
      fetchData();
    } catch (err: any) { alert(err.response?.data?.message || '保存失败'); }
  };
  const handleDelete = async () => {
    if (!deleteId) return;
    try { await api.delete(`/materials/${deleteId}`); setDeleteId(null); fetchData(); }
    catch (err: any) { alert(err.response?.data?.message || '删除失败'); }
  };

  return (
    <div className="p-6 space-y-4">
      <h1 className="text-xl font-bold">物料档案管理</h1>
      <Card className="p-4">
        <div className="flex gap-3 flex-wrap items-end">
          <div className="w-36"><label className="text-xs text-gray-500">物料编码</label><Input value={search.code} onChange={e => setSearch({ ...search, code: e.target.value })} /></div>
          <div className="w-36"><label className="text-xs text-gray-500">物料名称</label><Input value={search.name} onChange={e => setSearch({ ...search, name: e.target.value })} /></div>
          <div className="w-40"><label className="text-xs text-gray-500">物料分类</label>
            <Select value={search.categoryId} onValueChange={v => setSearch({ ...search, categoryId: v === 'ALL' ? '' : v })}>
              <SelectTrigger><SelectValue placeholder="全部" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="ALL">全部</SelectItem>
                {categories.map(c => <SelectItem key={c.id} value={c.id}>{c.code} {c.name}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <div className="w-32"><label className="text-xs text-gray-500">状态</label>
            <Select value={search.status} onValueChange={v => setSearch({ ...search, status: v === 'ALL' ? '' : v })}>
              <SelectTrigger><SelectValue placeholder="全部" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="ALL">全部</SelectItem><SelectItem value="ACTIVE">启用</SelectItem><SelectItem value="INACTIVE">停用</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <Button onClick={fetchData}>搜索</Button>
          <Button variant="outline" onClick={() => setSearch({ code: '', name: '', categoryId: '', status: '', specification: '' })}>重置</Button>
          <Button variant="ghost" onClick={() => setAdvancedOpen(!advancedOpen)}>{advancedOpen ? '收起' : '展开'}</Button>
          <div className="ml-auto"><Button onClick={openAdd}>新增</Button></div>
        </div>
        {advancedOpen && (
          <div className="flex gap-3 flex-wrap items-end mt-3 pt-3 border-t">
            <div className="w-36"><label className="text-xs text-gray-500">规格型号</label><Input value={search.specification} onChange={e => setSearch({ ...search, specification: e.target.value })} /></div>
          </div>
        )}
      </Card>

      <Card>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>物料编码</TableHead><TableHead>物料名称</TableHead><TableHead>规格型号</TableHead><TableHead>物料分类</TableHead>
              <TableHead>物料性质</TableHead><TableHead>计量单位</TableHead><TableHead>状态</TableHead>
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
                <TableCell>{item.materialType === 'PHYSICAL' ? '实物' : '虚拟'}</TableCell>
                <TableCell>{item.unitName}{item.unitSymbol ? `(${item.unitSymbol})` : ''}</TableCell>
                <TableCell>
                  <span className={`px-2 py-0.5 rounded text-xs ${item.status === 'ACTIVE' ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'}`}>
                    {item.status === 'ACTIVE' ? '启用' : '停用'}
                  </span>
                </TableCell>
                <TableCell>{new Date(item.createdAt).toLocaleDateString('zh-CN')}</TableCell>
                <TableCell>
                  <div className="flex gap-1">
                    <Button size="sm" variant="outline" onClick={() => openEdit(item)}>修改</Button>
                    <Button size="sm" variant="outline" className="text-red-600" onClick={() => setDeleteId(item.id)}>删除</Button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
            {items.length === 0 && (
              <TableRow><TableCell colSpan={9} className="text-center text-gray-400 py-8">暂无数据</TableCell></TableRow>
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
        <DialogContent className="max-w-lg">
          <DialogHeader><DialogTitle>{editing ? '修改物料' : '新增物料'}</DialogTitle></DialogHeader>
          <div className="space-y-3 max-h-[60vh] overflow-y-auto py-2">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-sm font-medium">物料编码 *</label>
                <Input value={form.code} onChange={e => setForm({ ...form, code: e.target.value })} disabled={!!editing} />
              </div>
              <div>
                <label className="text-sm font-medium">物料名称 *</label>
                <Input value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} />
              </div>
              <div>
                <label className="text-sm font-medium">规格型号</label>
                <Input value={form.specification} onChange={e => setForm({ ...form, specification: e.target.value })} />
              </div>
              <div>
                <label className="text-sm font-medium">外部编码</label>
                <Input value={form.externalCode} onChange={e => setForm({ ...form, externalCode: e.target.value })} />
              </div>
              <div>
                <label className="text-sm font-medium">物料分类 *</label>
                <Select value={form.categoryId} onValueChange={v => setForm({ ...form, categoryId: v })}>
                  <SelectTrigger><SelectValue placeholder="选择分类" /></SelectTrigger>
                  <SelectContent>{categories.map(c => <SelectItem key={c.id} value={c.id}>{c.code} {c.name}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div>
                <label className="text-sm font-medium">计量单位 *</label>
                <Select value={form.unitId} onValueChange={v => setForm({ ...form, unitId: v })}>
                  <SelectTrigger><SelectValue placeholder="选择单位" /></SelectTrigger>
                  <SelectContent>{units.map(u => <SelectItem key={u.id} value={u.id}>{u.name}{u.symbol ? `(${u.symbol})` : ''}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div>
                <label className="text-sm font-medium">物料性质</label>
                <Select value={form.materialType} onValueChange={v => setForm({ ...form, materialType: v })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent><SelectItem value="PHYSICAL">实物</SelectItem><SelectItem value="VIRTUAL">虚拟</SelectItem></SelectContent>
                </Select>
              </div>
              <div>
                <label className="text-sm font-medium">物料属性</label>
                <Input value={form.materialProperty} onChange={e => setForm({ ...form, materialProperty: e.target.value })} />
              </div>
              <div>
                <label className="text-sm font-medium">产品分类</label>
                <Input value={form.productCategory} onChange={e => setForm({ ...form, productCategory: e.target.value })} />
              </div>
              <div>
                <label className="text-sm font-medium">排序</label>
                <Input type="number" value={form.sortOrder} onChange={e => setForm({ ...form, sortOrder: +e.target.value })} />
              </div>
              <div>
                <label className="text-sm font-medium">状态</label>
                <Select value={form.status} onValueChange={v => setForm({ ...form, status: v })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent><SelectItem value="ACTIVE">启用</SelectItem><SelectItem value="INACTIVE">停用</SelectItem></SelectContent>
                </Select>
              </div>
            </div>
            <div>
              <label className="text-sm font-medium">备注</label>
              <Input value={form.remark} onChange={e => setForm({ ...form, remark: e.target.value })} />
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
