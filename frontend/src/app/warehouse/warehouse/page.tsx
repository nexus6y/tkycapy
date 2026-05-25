'use client';
import { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import api from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Checkbox } from '@/components/ui/checkbox';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { TooltipProvider } from '@/components/ui/tooltip';
import { Download, Pencil, Plus, Search, Trash2 } from 'lucide-react';
import { ErpTable, ErpThead, ErpTh, ErpTbody, ErpTr, ErpTd, ErpEmpty, ErpLink, ErpAction, ErpActionBtn, ErpTools, ErpStatus, ErpPagination } from '@/components/ui/erp-table';

interface Item { id:string;code:string;name:string;address:string|null;sortOrder:number;status:string;createdAt:string; }

export default function WarehousePage() {
  const router = useRouter();const [items,setItems]=useState<Item[]>([]);const [total,setTotal]=useState(0);const [pg,setPg]=useState(1);const [ps,setPs]=useState(30);
  const [del,setDel]=useState<string|null>(null);
  const fetch=useCallback(async()=>{
    const {data}=await api.get('/warehouses',{params:{page:pg,pageSize:ps}}); setItems(data.items); setTotal(data.total);
  },[pg,ps]); useEffect(()=>{fetch();},[fetch]);
  const doDel=async()=>{if(!del)return;await api.delete(`/warehouses/${del}`);setDel(null);fetch();};

  return (<TooltipProvider><div className="bg-background rounded-lg border shadow-sm">
    <div className="flex items-center justify-between px-4 h-14 border-b border-border">
      <div className="flex items-center gap-1">
        <Button variant="secondary" size="sm" onClick={()=>router.push('/warehouse/warehouse/create')}><Plus className="h-3.5 w-3.5"/>新增</Button>
        <Button variant="outline" size="sm">修改</Button><Button variant="outline" size="sm">删除</Button>
        <Button variant="outline" size="sm"><Download className="h-3.5 w-3.5 mr-1"/>导出</Button>
      </div>
      <Button variant="default" size="sm" onClick={fetch}><Search className="h-3.5 w-3.5 mr-1"/>搜索</Button>
    </div>
    <ErpTools onRefresh={fetch}/>
    <div className="overflow-auto"><ErpTable><ErpThead><ErpTh className="w-10"><Checkbox/></ErpTh><ErpTh>状态</ErpTh><ErpTh>仓库编码</ErpTh><ErpTh>仓库名称</ErpTh><ErpTh>地址</ErpTh><ErpTh>排序</ErpTh><ErpTh>创建时间</ErpTh><ErpTh>操作</ErpTh></ErpThead><ErpTbody>
    {items.map(i=>(<ErpTr key={i.id}><ErpTd><Checkbox/></ErpTd><ErpTd><ErpStatus active={i.status==='ACTIVE'}/></ErpTd><ErpTd><ErpLink>{i.code}</ErpLink></ErpTd><ErpTd>{i.name}</ErpTd><ErpTd className="text-muted-foreground">{i.address||'-'}</ErpTd><ErpTd>{i.sortOrder}</ErpTd><ErpTd className="text-muted-foreground">{new Date(i.createdAt).toLocaleDateString('zh-CN')}</ErpTd><ErpTd><ErpAction><ErpActionBtn onClick={()=>router.push(`/warehouse/warehouse/${i.id}/edit`)}><Pencil className="h-3.5 w-3.5"/>修改</ErpActionBtn><ErpActionBtn danger onClick={()=>setDel(i.id)}><Trash2 className="h-3.5 w-3.5"/>删除</ErpActionBtn></ErpAction></ErpTd></ErpTr>))}
    {items.length===0 && <ErpEmpty colSpan={8}/>}
    </ErpTbody></ErpTable></div>
    <ErpPagination page={pg} pageSize={ps} total={total} onPage={setPg} onPageSize={v=>setPs(+v)}/>
    <AlertDialog open={!!del} onOpenChange={()=>setDel(null)}><AlertDialogContent><AlertDialogHeader><AlertDialogTitle>确认删除？</AlertDialogTitle></AlertDialogHeader><AlertDialogFooter><AlertDialogCancel>取消</AlertDialogCancel><AlertDialogAction onClick={doDel} className="bg-[#f56c6c] text-white hover:bg-[#f56c6c]/90">删除</AlertDialogAction></AlertDialogFooter></AlertDialogContent></AlertDialog>
  </div></TooltipProvider>);
}
