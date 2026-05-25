'use client';
import { useEffect, useState } from 'react';
import api from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { TooltipProvider } from '@/components/ui/tooltip';
import { Search } from 'lucide-react';
import { ErpTable, ErpThead, ErpTh, ErpTbody, ErpTr, ErpTd, ErpEmpty, ErpTools, ErpPagination } from '@/components/ui/erp-table';
interface Item { id:string;code:string;name:string;version:string|null;materialName:string|null;quantity:string|null;createdAt:string; }
export default function BomDiffPage() {
  const [items,setItems]=useState<Item[]>([]);const [total,setTotal]=useState(0);const [pg,setPg]=useState(1);const [ps,setPs]=useState(30);
  const fetch=async()=>{const {data}=await api.get('/boms',{params:{page:pg,pageSize:ps}});setItems(data.items);setTotal(data.total);};
  useEffect(()=>{fetch();},[pg]);
  return (<TooltipProvider><div className="bg-background rounded-lg border shadow-sm"><div className="flex items-center justify-between px-4 h-14 border-b border-border"><div/><div className="flex items-center gap-1"><Button variant="ghost" size="sm" onClick={fetch}>重置</Button><Button variant="default" size="sm" onClick={fetch}><Search className="h-3.5 w-3.5 mr-1"/>搜索</Button></div></div>
    <ErpTools onRefresh={fetch}/><div className="overflow-auto"><ErpTable><ErpThead><ErpTh>BOM编码</ErpTh><ErpTh>BOM名称</ErpTh><ErpTh>版本</ErpTh><ErpTh>物料</ErpTh><ErpTh>数量</ErpTh><ErpTh>创建时间</ErpTh></ErpThead><ErpTbody>
    {items.map(i=>(<ErpTr key={i.id}><ErpTd className="text-primary font-medium">{i.code}</ErpTd><ErpTd>{i.name}</ErpTd><ErpTd className="text-muted-foreground">{i.version||'-'}</ErpTd><ErpTd className="text-muted-foreground">{i.materialName||'-'}</ErpTd><ErpTd>{i.quantity||'-'}</ErpTd><ErpTd className="text-muted-foreground">{new Date(i.createdAt).toLocaleDateString('zh-CN')}</ErpTd></ErpTr>))}
    {items.length===0 && <ErpEmpty colSpan={6}/>}
    </ErpTbody></ErpTable></div>
    <ErpPagination page={pg} pageSize={ps} total={total} onPage={setPg} onPageSize={v=>setPs(+v)}/>
  </div></TooltipProvider>);
}
