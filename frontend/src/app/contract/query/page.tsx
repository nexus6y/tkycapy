'use client';
import { useEffect, useState, useCallback } from 'react';
import api from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

interface Contract { id: string; code: string; name: string; type: string; customerName: string | null; supplierName: string | null; totalAmount: string | null; approvalStatus: string; createdAt: string; }
const S: Record<string, string> = { DRAFT: '草稿', SUBMITTED: '已提交', APPROVED: '已通过', REJECTED: '已拒绝', WITHDRAWN: '已撤回' };

export default function ContractQueryPage() {
  const [items, setItems] = useState<Contract[]>([]);
  const [total, setTotal] = useState(0); const [page, setPage] = useState(1);
  const [search, setSearch] = useState({ code: '', name: '', status: '', type: '' });

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

  return (
    <div className="p-6 space-y-4">
      <h1 className="text-xl font-bold">合同查询</h1>
      <Card className="p-4"><div className="flex gap-3 flex-wrap items-end">
        <div className="w-36"><label className="text-xs text-gray-500">合同编码</label><Input value={search.code} onChange={e => setSearch({ ...search, code: e.target.value })} /></div>
        <div className="w-36"><label className="text-xs text-gray-500">合同名称</label><Input value={search.name} onChange={e => setSearch({ ...search, name: e.target.value })} /></div>
        <Button onClick={fetchData}>搜索</Button><Button variant="outline" onClick={() => setSearch({ code: '', name: '', status: '', type: '' })}>重置</Button>
      </div></Card>
      <Card><Table><TableHeader><TableRow><TableHead>合同编码</TableHead><TableHead>合同名称</TableHead><TableHead>类型</TableHead><TableHead>客户/供应商</TableHead><TableHead>金额</TableHead><TableHead>状态</TableHead><TableHead>创建时间</TableHead></TableRow></TableHeader>
      <TableBody>
        {items.map(item => (<TableRow key={item.id}><TableCell className="font-mono text-sm">{item.code}</TableCell><TableCell>{item.name}</TableCell><TableCell>{item.type}</TableCell><TableCell>{item.customerName || item.supplierName || '-'}</TableCell><TableCell>{item.totalAmount ? Number(item.totalAmount).toLocaleString() : '-'}</TableCell><TableCell><span className={`px-2 py-0.5 rounded text-xs ${item.approvalStatus === 'APPROVED' ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'}`}>{S[item.approvalStatus]}</span></TableCell><TableCell>{new Date(item.createdAt).toLocaleDateString('zh-CN')}</TableCell></TableRow>))}
        {items.length === 0 && <TableRow><TableCell colSpan={7} className="text-center text-gray-400 py-8">暂无数据</TableCell></TableRow>}
      </TableBody></Table>
      <div className="flex items-center justify-between px-4 py-3 border-t"><span className="text-sm text-gray-500">共 {total} 条</span><div className="flex gap-2"><Button variant="outline" size="sm" disabled={page <= 1} onClick={() => setPage(p => p - 1)}>上一页</Button><Button variant="outline" size="sm" disabled={page * 20 >= total} onClick={() => setPage(p => p + 1)}>下一页</Button></div></div></Card>
    </div>
  );
}
