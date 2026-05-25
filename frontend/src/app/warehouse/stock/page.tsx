'use client';
import { useEffect, useState, useCallback } from 'react';
import api from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { TooltipProvider } from '@/components/ui/tooltip';
import { Download, Search } from 'lucide-react';
import { ErpTable, ErpThead, ErpTh, ErpTbody, ErpTr, ErpTd, ErpEmpty, ErpTools, ErpPagination } from '@/components/ui/erp-table';

interface Item { id:string;materialName:string|null;warehouseName:string|null;locationCode:string|null;batchNo:string|null;quantity:string;availableQty:string;lockedQty:string;updatedAt:string; }

export default function StockPage() {
  const [items,setItems]=useState<Item[]>([]);const [total,setTotal]=useState(0);const [pg,setPg]=useState(1);const [ps,setPs]=useState(30);
  const [s,setS]=useState({code:'',name:''});

  const fetch=useCallback(async()=>{
    const p:any={page:pg,pageSize:ps}; if(s.code)p.code=s.code; if(s.name)p.name=s.name;
    const {data}=await api.get('/inventory',{params:p}); setItems(data.items); setTotal(data.total);
  },[pg,ps,s]); useEffect(()=>{fetch();},[fetch]);

  return (<TooltipProvider><div className="bg-background rounded-lg border shadow-sm">
    <div className="flex items-center justify-between px-4 h-14 border-b border-border">
      <div className="flex items-center gap-1">
        <Button variant="outline" size="sm"><Download className="h-3.5 w-3.5 mr-1"/>导出</Button>
      </div>
      <div className="flex items-center gap-1">
        <Button variant="ghost" size="sm" onClick={()=>setS({code:'',name:''})}>重置</Button>
        <Button variant="default" size="sm" onClick={fetch}><Search className="h-3.5 w-3.5 mr-1"/>搜索</Button>
      </div>
    </div>
    <div className="flex items-center gap-4 px-4 py-2.5 border-b border-border bg-muted/30">
      <div className="flex items-center gap-1.5"><span className="text-[13px] text-muted-foreground w-[80px] text-right shrink-0">物料编码</span><Input className="w-[140px] h-9 rounded-md border border-border bg-background px-3 text-[13px]" value={s.code} onChange={e=>setS({...s,code:e.target.value})}/></div>
      <div className="flex items-center gap-1.5"><span className="text-[13px] text-muted-foreground w-[80px] text-right shrink-0">物料名称</span><Input className="w-[140px] h-9 rounded-md border border-border bg-background px-3 text-[13px]" value={s.name} onChange={e=>setS({...s,name:e.target.value})}/></div>
    </div>
    <ErpTools onRefresh={fetch}/>
    <div className="overflow-auto"><ErpTable><ErpThead><ErpTh>物料名称</ErpTh><ErpTh>仓库</ErpTh><ErpTh>库位</ErpTh><ErpTh>批次号</ErpTh><ErpTh>库存数量</ErpTh><ErpTh>可用数量</ErpTh><ErpTh>锁定数量</ErpTh><ErpTh>更新时间</ErpTh></ErpThead><ErpTbody>
    {items.map(i=>(<ErpTr key={i.id}><ErpTd>{i.materialName||'-'}</ErpTd><ErpTd className="text-muted-foreground">{i.warehouseName||'-'}</ErpTd><ErpTd className="text-muted-foreground">{i.locationCode||'-'}</ErpTd><ErpTd className="text-muted-foreground">{i.batchNo||'-'}</ErpTd><ErpTd className="font-medium">{Number(i.quantity).toLocaleString()}</ErpTd><ErpTd className="text-success">{Number(i.availableQty).toLocaleString()}</ErpTd><ErpTd className="text-destructive">{Number(i.lockedQty).toLocaleString()}</ErpTd><ErpTd className="text-muted-foreground">{new Date(i.updatedAt).toLocaleDateString('zh-CN')}</ErpTd></ErpTr>))}
    {items.length===0 && <ErpEmpty colSpan={8}/>}
    </ErpTbody></ErpTable></div>
    <ErpPagination page={pg} pageSize={ps} total={total} onPage={setPg} onPageSize={v=>setPs(+v)}/>
  </div></TooltipProvider>);
}
