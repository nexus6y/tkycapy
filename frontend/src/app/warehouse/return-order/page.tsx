'use client';
import { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import api from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { TooltipProvider } from '@/components/ui/tooltip';
import { Search, Download, Pencil } from 'lucide-react';
import { ErpTable,ErpThead,ErpTh,ErpTbody,ErpTr,ErpTd,ErpEmpty,ErpLink,ErpAction,ErpActionBtn,ErpTools,ErpApproval,ErpPagination } from '@/components/ui/erp-table';

interface Item { id:string;orderNo:string;materialName:string|null;quantity:string;borrower:string|null;borrowDate:string;expectedReturn:string;actualReturn:string|null;approvalStatus:string; }

export default function ReturnOrderPage() {
  const router=useRouter();
  const [items,setItems]=useState<Item[]>([]);const [total,setTotal]=useState(0);const [pg,setPg]=useState(1);const [ps,setPs]=useState(30);
  const [s,setS]=useState({code:'',name:'',status:''});

  const fetch=useCallback(async()=>{
    const p:any={page:pg,pageSize:ps}; if(s.code)p.code=s.code; if(s.name)p.name=s.name; if(s.status)p.status=s.status;
    const {data}=await api.get('/lend-orders',{params:p}); setItems(data.items.filter((i:Item)=>i.actualReturn)); setTotal(data.total);
  },[pg,ps,s]); useEffect(()=>{fetch();},[fetch]);

  return (<TooltipProvider><div className="bg-background rounded-lg border shadow-sm">
    <div className="flex items-center justify-between px-4 h-14 border-b border-border">
      <div className="flex items-center gap-1">
        <Button variant="outline" size="sm"><Download className="h-3.5 w-3.5 mr-1"/>导出</Button>
      </div>
      <div className="flex items-center gap-1">
        <Button variant="ghost" size="sm" onClick={()=>setS({code:'',name:'',status:''})}>重置</Button>
        <Button variant="default" size="sm" onClick={fetch}><Search className="h-3.5 w-3.5 mr-1"/>搜索</Button>
      </div>
    </div>
    <div className="flex items-center gap-4 px-4 py-2.5 border-b border-border bg-muted/30 flex-wrap">
      <F label="审批状态"><Select value={s.status} onValueChange={v=>setS({...s,status:v==='ALL'?'':v})}><SelectTrigger className="w-[100px] h-9 rounded-md border border-border bg-background px-3 text-[13px]"><SelectValue placeholder="全部"/></SelectTrigger><SelectContent><SelectItem value="ALL">全部</SelectItem><SelectItem value="DRAFT">草稿</SelectItem><SelectItem value="SUBMITTED">已提交</SelectItem><SelectItem value="APPROVED">已通过</SelectItem></SelectContent></Select></F>
      <F label="单号"><Input className="w-[140px] h-9 rounded-md border border-border bg-background px-3 text-[13px]" value={s.code} onChange={e=>setS({...s,code:e.target.value})}/></F>
      <F label="借用人"><Input className="w-[140px] h-9 rounded-md border border-border bg-background px-3 text-[13px]" value={s.name} onChange={e=>setS({...s,name:e.target.value})}/></F>
    </div>
    <ErpTools onRefresh={fetch}/>
    <div className="overflow-auto"><ErpTable><ErpThead><ErpTh>归还单号</ErpTh><ErpTh>物料</ErpTh><ErpTh>数量</ErpTh><ErpTh>借用人</ErpTh><ErpTh>借出日期</ErpTh><ErpTh>预计归还</ErpTh><ErpTh>归还日期</ErpTh><ErpTh>审批状态</ErpTh><ErpTh>操作</ErpTh></ErpThead><ErpTbody>
    {items.map(i=>(<ErpTr key={i.id}><ErpTd><ErpLink onClick={()=>router.push('/warehouse/lend-order/'+i.id+'/edit')}>{i.orderNo}</ErpLink></ErpTd><ErpTd>{i.materialName||'-'}</ErpTd><ErpTd>{i.quantity?Number(i.quantity).toLocaleString():'-'}</ErpTd><ErpTd>{i.borrower||'-'}</ErpTd><ErpTd className="text-muted-foreground">{i.borrowDate?new Date(i.borrowDate).toLocaleDateString('zh-CN'):'-'}</ErpTd><ErpTd className="text-muted-foreground">{i.expectedReturn?new Date(i.expectedReturn).toLocaleDateString('zh-CN'):'-'}</ErpTd><ErpTd className="text-muted-foreground">{i.actualReturn?new Date(i.actualReturn).toLocaleDateString('zh-CN'):'-'}</ErpTd><ErpTd><ErpApproval status={i.approvalStatus}/></ErpTd><ErpTd><ErpAction><ErpActionBtn onClick={()=>router.push('/warehouse/lend-order/'+i.id+'/edit')}><Pencil className="h-3.5 w-3.5"/>归还</ErpActionBtn></ErpAction></ErpTd></ErpTr>))}
    {items.length===0&&<ErpEmpty colSpan={9}/>}
    </ErpTbody></ErpTable></div>
    <ErpPagination page={pg} pageSize={ps} total={total} onPage={setPg} onPageSize={v=>setPs(+v)}/>
  </div></TooltipProvider>);
}
function F({label,children}:{label:string;children:React.ReactNode}){return<div className="flex items-center gap-1.5"><span className="text-[13px] text-muted-foreground w-[80px] text-right shrink-0">{label}</span>{children}</div>;}
