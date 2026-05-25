'use client';
import { useEffect, useState, useCallback } from 'react';
import api from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { TooltipProvider } from '@/components/ui/tooltip';
import { Search, Download } from 'lucide-react';
import { ErpTable, ErpThead, ErpTh, ErpTbody, ErpTr, ErpTd, ErpEmpty, ErpLink, ErpTools, ErpPagination } from '@/components/ui/erp-table';
interface Item { id:string;inspectionNo:string;materialName:string|null;unqualifiedQty:string|null;result:string|null;inspector:string|null;createdAt:string; }
export default function DefectivePage() {
  const [items,setItems]=useState<Item[]>([]);const [total,setTotal]=useState(0);const [pg,setPg]=useState(1);const [ps,setPs]=useState(30);
  const [s,setS]=useState({code:'',name:''});
  const fetch=useCallback(async()=>{const p:any={page:pg,pageSize:ps};if(s.code)p.code=s.code;if(s.name)p.name=s.name;const {data}=await api.get('/inspections',{params:{...p,status:'APPROVED'}});setItems(data.items.filter((i:any)=>Number(i.unqualifiedQty)>0));setTotal(data.total);},[pg,ps,s]);useEffect(()=>{fetch();},[fetch]);
  return (<TooltipProvider><div className="bg-background rounded-lg border shadow-sm">
    <div className="flex items-center justify-between px-4 h-14 border-b border-border"><div className="flex items-center gap-1"><Button variant="outline" size="sm"><Download className="h-3.5 w-3.5 mr-1"/>导出</Button></div><div className="flex items-center gap-1"><Button variant="ghost" size="sm" onClick={()=>setS({code:'',name:''})}>重置</Button><Button variant="default" size="sm" onClick={fetch}><Search className="h-3.5 w-3.5 mr-1"/>搜索</Button></div></div>
    <div className="flex items-center gap-4 px-4 py-2.5 border-b border-border bg-muted/30"><F label="质检单号"><Input className="w-[140px] h-9 rounded-md border border-border bg-background px-3 text-[13px]" value={s.code} onChange={e=>setS({...s,code:e.target.value})}/></F><F label="物料"><Input className="w-[140px] h-9 rounded-md border border-border bg-background px-3 text-[13px]" value={s.name} onChange={e=>setS({...s,name:e.target.value})}/></F></div>
    <ErpTools onRefresh={fetch}/>
    <div className="overflow-auto"><ErpTable><ErpThead><ErpTh>质检单号</ErpTh><ErpTh>物料</ErpTh><ErpTh>不合格数</ErpTh><ErpTh>检验结果</ErpTh><ErpTh>检验员</ErpTh><ErpTh>创建时间</ErpTh></ErpThead><ErpTbody>
    {items.map(i=>(<ErpTr key={i.id}><ErpTd><ErpLink>{i.inspectionNo}</ErpLink></ErpTd><ErpTd>{i.materialName||'-'}</ErpTd><ErpTd className="text-destructive font-medium">{i.unqualifiedQty||'0'}</ErpTd><ErpTd className="text-muted-foreground">{i.result||'-'}</ErpTd><ErpTd className="text-muted-foreground">{i.inspector||'-'}</ErpTd><ErpTd className="text-muted-foreground">{new Date(i.createdAt).toLocaleDateString('zh-CN')}</ErpTd></ErpTr>))}
    {items.length===0 && <ErpEmpty colSpan={6}/>}
    </ErpTbody></ErpTable></div>
    <ErpPagination page={pg} pageSize={ps} total={total} onPage={setPg} onPageSize={v=>setPs(+v)}/>
  </div></TooltipProvider>);
}
function F({label,children}:{label:string;children:React.ReactNode}){return<div className="flex items-center gap-1.5"><span className="text-[13px] text-muted-foreground w-[80px] text-right shrink-0">{label}</span>{children}</div>;}
