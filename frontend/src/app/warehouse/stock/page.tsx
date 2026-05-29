'use client';
import { useEffect, useState, useCallback } from 'react';
import api from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { exportCSV } from '@/lib/export';
import { TooltipProvider } from '@/components/ui/tooltip';
import { Download, Search } from 'lucide-react';
import { ErpTable, ErpThead, ErpTh, ErpTbody, ErpTr, ErpTd, ErpEmpty, ErpTools, ErpPagination } from '@/components/ui/erp-table';

interface Item { id:string;materialCode:string|null;materialName:string|null;spec:string|null;unit:string|null;warehouseCode:string|null;warehouseName:string|null;locationCode:string|null;batchNo:string|null;qualityStatus:string|null;quantity:string;availableQty:string;lockedQty:string;updatedAt:string; }

const QS:Record<string,string>={QUALIFIED:'合格',UNQUALIFIED:'不合格',PENDING:'待检'};

export default function StockPage() {
  const [items,setItems]=useState<Item[]>([]);const [total,setTotal]=useState(0);const [pg,setPg]=useState(1);const [ps,setPs]=useState(30);
  const [s,setS]=useState({materialCode:'',materialName:'',warehouseCode:'',qualityStatus:''});

  const fetch=useCallback(async()=>{
    const p:any={page:pg,pageSize:ps};
    if(s.materialCode)p.materialCode=s.materialCode;
    if(s.materialName)p.materialName=s.materialName;
    if(s.warehouseCode)p.warehouseCode=s.warehouseCode;
    if(s.qualityStatus)p.qualityStatus=s.qualityStatus;
    const {data}=await api.get('/inventory',{params:p}); setItems(data.items); setTotal(data.total);
  },[pg,ps,s]); useEffect(()=>{fetch();},[fetch]);

  return (<TooltipProvider><div className="bg-background rounded-lg border shadow-sm">
    <div className="flex items-center justify-between px-4 h-14 border-b border-border">
      <div className="flex items-center gap-1">
        <Button variant="outline" size="sm" onClick={()=>exportCSV(items,'库存查询')}><Download className="h-3.5 w-3.5 mr-1"/>导出</Button>
      </div>
      <div className="flex items-center gap-1">
        <Button variant="ghost" size="sm" onClick={()=>setS({materialCode:'',materialName:'',warehouseCode:'',qualityStatus:''})}>重置</Button>
        <Button variant="default" size="sm" onClick={fetch}><Search className="h-3.5 w-3.5 mr-1"/>搜索</Button>
      </div>
    </div>
    <div className="flex items-center gap-4 px-4 py-2.5 border-b border-border bg-muted/30 flex-wrap">
      <F label="物料编码"><Input className="w-[140px] h-9 rounded-md border border-border bg-background px-3 text-[13px]" value={s.materialCode} onChange={e=>setS({...s,materialCode:e.target.value})}/></F>
      <F label="物料名称"><Input className="w-[140px] h-9 rounded-md border border-border bg-background px-3 text-[13px]" value={s.materialName} onChange={e=>setS({...s,materialName:e.target.value})}/></F>
      <F label="仓库"><Input className="w-[120px] h-9 rounded-md border border-border bg-background px-3 text-[13px]" value={s.warehouseCode} onChange={e=>setS({...s,warehouseCode:e.target.value})}/></F>
      <F label="质量状态"><Select value={s.qualityStatus} onValueChange={(v:any)=>setS({...s,qualityStatus:v==='ALL'?'':v})}><SelectTrigger className="w-[100px] h-9 rounded-md border border-border bg-background px-3 text-[13px]"><SelectValue placeholder="全部"/></SelectTrigger><SelectContent><SelectItem value="ALL">全部</SelectItem><SelectItem value="QUALIFIED">合格</SelectItem><SelectItem value="UNQUALIFIED">不合格</SelectItem><SelectItem value="PENDING">待检</SelectItem></SelectContent></Select></F>
    </div>
    <ErpTools onRefresh={fetch}/>
    <div className="overflow-auto"><ErpTable><ErpThead><ErpTh>物料编码</ErpTh><ErpTh>物料名称</ErpTh><ErpTh>规格型号</ErpTh><ErpTh>单位</ErpTh><ErpTh>仓库</ErpTh><ErpTh>库位</ErpTh><ErpTh>批次号</ErpTh><ErpTh>质量状态</ErpTh><ErpTh>库存数量</ErpTh><ErpTh>可用数量</ErpTh><ErpTh>锁定数量</ErpTh><ErpTh>更新时间</ErpTh></ErpThead><ErpTbody>
    {items.map(i=>(<ErpTr key={i.id}><ErpTd className="text-[13px]">{i.materialCode||'-'}</ErpTd><ErpTd>{i.materialName||'-'}</ErpTd><ErpTd className="text-muted-foreground text-[12px]">{i.spec||'-'}</ErpTd><ErpTd className="text-muted-foreground">{i.unit||'-'}</ErpTd><ErpTd className="text-muted-foreground">{i.warehouseCode||i.warehouseName||'-'}</ErpTd><ErpTd className="text-muted-foreground">{i.locationCode||'-'}</ErpTd><ErpTd className="text-muted-foreground">{i.batchNo||'-'}</ErpTd><ErpTd><span className={`text-[12px] ${i.qualityStatus==='QUALIFIED'?'text-green-600':i.qualityStatus==='UNQUALIFIED'?'text-red-500':'text-orange-500'}`}>{QS[i.qualityStatus||'']||i.qualityStatus||'-'}</span></ErpTd><ErpTd className="font-medium">{Number(i.quantity).toLocaleString()}</ErpTd><ErpTd className="text-success font-medium">{Number(i.availableQty).toLocaleString()}</ErpTd><ErpTd className="text-destructive">{Number(i.lockedQty).toLocaleString()}</ErpTd><ErpTd className="text-muted-foreground text-[12px]">{new Date(i.updatedAt).toLocaleString('zh-CN')}</ErpTd></ErpTr>))}
    {items.length===0 && <ErpEmpty colSpan={12}/>}
    </ErpTbody></ErpTable></div>
    <ErpPagination page={pg} pageSize={ps} total={total} onPage={setPg} onPageSize={v=>setPs(+v)}/>
  </div></TooltipProvider>);
}
function F({label,children}:{label:string;children:React.ReactNode}){return<div className="flex items-center gap-1.5"><span className="text-[13px] text-muted-foreground w-[80px] text-right shrink-0">{label}</span>{children}</div>;}
