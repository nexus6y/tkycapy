'use client';
import { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import api from '@/lib/api';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { TooltipProvider } from '@/components/ui/tooltip';
import { Pencil, Trash2 } from 'lucide-react';
import { toast } from '@/components/ui/toast';
import { ErpTable, ErpThead, ErpTh, ErpTbody, ErpTr, ErpTd, ErpEmpty, ErpLink, ErpAction, ErpActionBtn, ErpStatus, ErpPagination, ErpListPage } from '@/components/ui/erp-table';
import { ErpToolbar } from '@/components/ui/erp-toolbar';
import { ErpSearchFields, ErpSearchField } from '@/components/ui/erp-search-fields';

interface Category { id:string;code:string;name:string;parentId:string|null;parentCode:string;parentName:string;sortOrder:number;status:string;createdAt:string; }

export default function MaterialCategoryPage() {
  const router = useRouter();
  const [items, setItems] = useState<Category[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(30);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [s, setS] = useState({ code: '', name: '', status: '' });
  const [delId, setDelId] = useState<string | null>(null);

  const fetch = useCallback(async () => {
    const p: any = { page, pageSize };
    if (s.code) p.code = s.code;
    if (s.name) p.name = s.name;
    if (s.status) p.status = s.status;
    const { data } = await api.get('/material-categories', { params: p });
    setItems(data.items);
    setTotal(data.total);
  }, [page, pageSize, s]);

  useEffect(() => { fetch(); }, [fetch]);

  const doDelete = async () => {
    if (!delId) return;
    try {
      await api.delete(`/material-categories/${delId}`);
      setDelId(null);
      fetch();
    } catch (e: any) {
      toast(e.response?.data?.message || '删除失败', 'error');
    }
  };

  const toggleAll = (v: boolean) =>
    setSelected(v ? new Set(items.map(i => i.id)) : new Set());

  const toggleOne = (id: string, v: boolean) => {
    const n = new Set(selected);
    v ? n.add(id) : n.delete(id);
    setSelected(n);
  };

  const resetSearch = () => setS({ code: '', name: '', status: '' });

  const colSpan = 9;

  return (
    <TooltipProvider>
      <ErpListPage>
        <ErpToolbar
          addHref="/material-category/create"
          editDisabled={selected.size === 0}
          onEdit={() => toast('请先勾选数据', 'info')}
          deleteDisabled={selected.size === 0}
          onDelete={() => toast('请先勾选数据', 'info')}
          onReset={resetSearch}
          onSearch={fetch}
        />

        <ErpSearchFields>
          <ErpSearchField label="状态">
            <Select
              value={s.status}
              onValueChange={(v: any) => setS({ ...s, status: v === 'ALL' ? '' : v })}
            >
              <SelectTrigger className="w-[100px] h-9 rounded-md border border-border bg-background px-3 text-[13px]">
                <SelectValue placeholder="全部" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ALL">全部</SelectItem>
                <SelectItem value="ACTIVE">启用</SelectItem>
                <SelectItem value="INACTIVE">停用</SelectItem>
              </SelectContent>
            </Select>
          </ErpSearchField>
          <ErpSearchField label="分类编码">
            <Input
              className="w-[140px] h-9 rounded-md border border-border bg-background px-3 text-[13px]"
              value={s.code}
              onChange={e => setS({ ...s, code: e.target.value })}
              placeholder="编码"
            />
          </ErpSearchField>
          <ErpSearchField label="分类名称">
            <Input
              className="w-[140px] h-9 rounded-md border border-border bg-background px-3 text-[13px]"
              value={s.name}
              onChange={e => setS({ ...s, name: e.target.value })}
              placeholder="名称"
            />
          </ErpSearchField>
        </ErpSearchFields>

        <div className="overflow-auto">
          <ErpTable>
            <ErpThead>
              <ErpTh className="w-10">
                <Checkbox
                  checked={items.length > 0 && selected.size === items.length}
                  onCheckedChange={(v: boolean) => toggleAll(v)}
                />
              </ErpTh>
              <ErpTh>状态</ErpTh>
              <ErpTh>分类编码</ErpTh>
              <ErpTh>分类名称</ErpTh>
              <ErpTh>上级分类编码</ErpTh>
              <ErpTh>上级分类名称</ErpTh>
              <ErpTh>排序</ErpTh>
              <ErpTh>创建时间</ErpTh>
              <ErpTh>操作</ErpTh>
            </ErpThead>
            <ErpTbody>
              {items.map(item => (
                <ErpTr key={item.id}>
                  <ErpTd>
                    <Checkbox
                      checked={selected.has(item.id)}
                      onCheckedChange={(v: boolean) => toggleOne(item.id, v)}
                    />
                  </ErpTd>
                  <ErpTd>
                    <ErpStatus active={item.status === 'ACTIVE'} />
                  </ErpTd>
                  <ErpTd>
                    <ErpLink onClick={() => router.push(`/material-category/${item.id}/edit`)}>
                      {item.code}
                    </ErpLink>
                  </ErpTd>
                  <ErpTd>{item.name}</ErpTd>
                  <ErpTd className="text-[#909399]">{item.parentCode || '-'}</ErpTd>
                  <ErpTd className="text-[#909399]">{item.parentName || '-'}</ErpTd>
                  <ErpTd>{item.sortOrder}</ErpTd>
                  <ErpTd className="text-[#909399] text-[12px]">
                    {new Date(item.createdAt).toLocaleDateString('zh-CN')}
                  </ErpTd>
                  <ErpTd>
                    <ErpAction>
                      <ErpActionBtn onClick={() => router.push(`/material-category/${item.id}/edit`)}>
                        <Pencil className="h-3.5 w-3.5" />修改
                      </ErpActionBtn>
                      <ErpActionBtn danger onClick={() => setDelId(item.id)}>
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

        <ErpPagination
          page={page}
          pageSize={pageSize}
          total={total}
          onPage={setPage}
          onPageSize={v => setPageSize(+v)}
        />

        <AlertDialog open={!!delId} onOpenChange={() => setDelId(null)}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>确认删除？</AlertDialogTitle>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>取消</AlertDialogCancel>
              <AlertDialogAction
                onClick={doDelete}
                className="bg-[#f56c6c] text-white hover:bg-[#f56c6c]/90"
              >
                删除
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </ErpListPage>
    </TooltipProvider>
  );
}
