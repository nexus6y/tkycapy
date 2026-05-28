'use client';
import { useEffect, useState, useCallback } from 'react';
import api from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { TooltipProvider } from '@/components/ui/tooltip';
import { Download, Search } from 'lucide-react';
import { ErpTable, ErpThead, ErpTh, ErpTbody, ErpTr, ErpTd, ErpEmpty, ErpLink, ErpTools, ErpApproval, ErpPagination } from '@/components/ui/erp-table';

interface Item { id:string;planNo:string;planName:string;demandSource:string|null;demandUse:string|null;projectName:string|null;requiredDate:string|null;totalQuantity:string|null;approvalStatus:string;businessStatus:string;createdAt:string; }

export default function DemandQueryPage() {
  const [items,setItems]=useState<Item[]>([]);const [total,setTotal]=useState(0);const [pg,setPg]=useState(1);const [ps,setPs]=useState(30);
  const [s,setS]=useState({code:'',name:'',status:'',source:'',use:''});

  const fetch=useCallback(async()=>{
    const p:any={page:pg,pageSize:ps}; if(s.code)p.code=s.code; if(s.name)p.name=s.name; if(s.status)p.status=s.status;
    const {data}=await api.get('/demand-plans',{params:p}); setItems(data.items); setTotal(data.total);
  },[pg,ps,s]); useEffect(()=>{fetch();},[fetch]);

  return (<TooltipProvider><div className="bg-background rounded-lg border shadow-sm">
    <div className="flex items-center justify-between px-4 h-14 border-b border-border">
      <div/><div className="flex items-center gap-1">
        <Button variant="ghost" size="sm" onClick={()=>setS({code:'',name:'',status:'',source:'',use:''})}>重置</Button>
        <Button variant="default" size="sm" onClick={fetch}><Search className="h-3.5 w-3.5 mr-1"/>搜索</Button>
      </div>
    </div>
    <div className="flex items-center gap-4 px-4 py-2.5 border-b border-border bg-muted/30 flex-wrap">
      <F label="状态"><Select value={s.status} onValueChange={(v:any)=>setS({...s,status:v==='ALL'?'':v})}><SelectTrigger className="w-[100px] h-9 rounded-md border border-border bg-background px-3 text-[13px]"><SelectValue placeholder="全部"/></SelectTrigger><SelectContent><SelectItem value="ALL">全部</SelectItem><SelectItem value="DRAFT">草稿</SelectItem><SelectItem value="APPROVED">已通过</SelectItem></SelectContent></Select></F>
      <F label="计划单号"><Input className="w-[140px] h-9 rounded-md border border-border bg-background px-3 text-[13px]" value={s.code} onChange={e=>setS({...s,code:e.target.value})}/></F>
      <F label="计划名称"><Input className="w-[140px] h-9 rounded-md border border-border bg-background px-3 text-[13px]" value={s.name} onChange={e=>setS({...s,name:e.target.value})}/></F>
      <F label="需求来源"><Input className="w-[130px] h-9 rounded-md border border-border bg-background px-3 text-[13px]" value={s.source} onChange={e=>setS({...s,source:e.target.value})}/></F>
    </div>
    <ErpTools onRefresh={fetch}/>
    <div className="overflow-auto"><ErpTable><ErpThead><ErpTh>审批状态</ErpTh><ErpTh>计划单号</ErpTh><ErpTh>计划名称</ErpTh><ErpTh>需求来源</ErpTh><ErpTh>需求用途</ErpTh><ErpTh>项目</ErpTh><ErpTh>需求日期</ErpTh><ErpTh>数量</ErpTh><ErpTh>创建时间</ErpTh></ErpThead><ErpTbody>
    {items.map(i=>(<ErpTr key={i.id}><ErpTd><ErpApproval status={i.approvalStatus}/></ErpTd><ErpTd><ErpLink>{i.planNo}</ErpLink></ErpTd><ErpTd>{i.planName}</ErpTd><ErpTd className="text-muted-foreground">{i.demandSource||'-'}</ErpTd><ErpTd className="text-muted-foreground">{i.demandUse||'-'}</ErpTd><ErpTd className="text-muted-foreground">{i.projectName||'-'}</ErpTd><ErpTd className="text-muted-foreground">{i.requiredDate?new Date(i.requiredDate).toLocaleDateString('zh-CN'):'-'}</ErpTd><ErpTd>{i.totalQuantity||'-'}</ErpTd><ErpTd className="text-muted-foreground">{new Date(i.createdAt).toLocaleDateString('zh-CN')}</ErpTd></ErpTr>))}
    {items.length===0 && <ErpEmpty colSpan={9}/>}
    </ErpTbody></ErpTable></div>
    <ErpPagination page={pg} pageSize={ps} total={total} onPage={setPg} onPageSize={v=>setPs(+v)}/>
  </div></TooltipProvider>);
}
function F({label,children}:{label:string;children:React.ReactNode}){return<div className="flex items-center gap-1.5"><span className="text-[13px] text-muted-foreground w-[80px] text-right shrink-0">{label}</span>{children}</div>;}
