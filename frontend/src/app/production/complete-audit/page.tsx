'use client';
import { useEffect, useState, useCallback } from 'react';
import api from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { TooltipProvider } from '@/components/ui/tooltip';
import { Search, CheckCircle, XCircle } from 'lucide-react';
import { ErpTable,ErpThead,ErpTh,ErpTbody,ErpTr,ErpTd,ErpEmpty,ErpLink,ErpTools,ErpApproval,ErpPagination } from '@/components/ui/erp-table';

interface Item { id:string;reportNo:string;sourceType:string|null;productionOrderId:string|null;productionOrderNo:string|null;materialCode:string|null;materialName:string|null;spec:string|null;unit:string|null;plannedQty:string;actualQty:string;deptName:string|null;approvalStatus:string;createdAt:string; }

export default function CompleteAuditPage() {
  const [items,setItems]=useState<Item[]>([]);const [total,setTotal]=useState(0);const [pg,setPg]=useState(1);const [ps,setPs]=useState(30);
  const [s,setS]=useState({code:'',name:'',status:''});

  const fetch=useCallback(async()=>{
    const p:any={page:pg,pageSize:ps}; if(s.code)p.code=s.code; if(s.name)p.name=s.name; if(s.status)p.status=s.status;
    const {data}=await api.get('/complete-reports',{params:p}); setItems(data.items); setTotal(data.total);
  },[pg,ps,s]); useEffect(()=>{fetch();},[fetch]);

  const audit=async(id:string,status:string)=>{await api.put(`/complete-reports/${id}`,{approvalStatus:status}); fetch();};

  return (<TooltipProvider><div className="bg-background rounded-lg border shadow-sm">
    <div className="flex items-center justify-between px-4 h-14 border-b border-border">
      <span className="text-sm font-medium text-foreground">完工报告审核</span>
      <div className="flex items-center gap-1">
        <Button variant="ghost" size="sm" onClick={()=>setS({code:'',name:'',status:''})}>重置</Button>
        <Button variant="default" size="sm" onClick={fetch}><Search className="h-3.5 w-3.5 mr-1"/>搜索</Button>
      </div>
    </div>
    <div className="flex items-center gap-4 px-4 py-2.5 border-b border-border bg-muted/30 flex-wrap">
      <F label="审批状态"><Select value={s.status} onValueChange={v=>setS({...s,status:v==='ALL'?'':v})}><SelectTrigger className="w-[100px] h-9 rounded-md border border-border bg-background px-3 text-[13px]"><SelectValue placeholder="全部"/></SelectTrigger><SelectContent><SelectItem value="ALL">全部</SelectItem><SelectItem value="SUBMITTED">已提交</SelectItem><SelectItem value="APPROVED">已通过</SelectItem><SelectItem value="REJECTED">已拒绝</SelectItem></SelectContent></Select></F>
      <F label="报告单号"><Input className="w-[140px] h-9 rounded-md border border-border bg-background px-3 text-[13px]" value={s.code} onChange={e=>setS({...s,code:e.target.value})}/></F>
      <F label="生产单号"><Input className="w-[140px] h-9 rounded-md border border-border bg-background px-3 text-[13px]" value={s.name} onChange={e=>setS({...s,name:e.target.value})}/></F>
    </div>
    <ErpTools onRefresh={fetch}/>
    <div className="overflow-auto"><ErpTable><ErpThead><ErpTh>报告单号</ErpTh><ErpTh>来源</ErpTh><ErpTh>生产单号</ErpTh><ErpTh>物料</ErpTh><ErpTh>规格</ErpTh><ErpTh>预计产量</ErpTh><ErpTh>实际产量</ErpTh><ErpTh>差异</ErpTh><ErpTh>部门</ErpTh><ErpTh>审批状态</ErpTh><ErpTh>操作</ErpTh></ErpThead><ErpTbody>
    {items.map(i=>{const diff=Number(i.actualQty||0)-Number(i.plannedQty||0);
      return(<ErpTr key={i.id}><ErpTd><ErpLink>{i.reportNo}</ErpLink></ErpTd><ErpTd className="text-muted-foreground">{i.sourceType||'-'}</ErpTd><ErpTd>{i.productionOrderNo||'-'}</ErpTd><ErpTd>{i.materialName||'-'}</ErpTd><ErpTd className="text-muted-foreground">{i.spec||'-'}</ErpTd><ErpTd>{i.plannedQty?Number(i.plannedQty).toLocaleString():'-'}</ErpTd><ErpTd className="font-medium">{i.actualQty?Number(i.actualQty).toLocaleString():'-'}</ErpTd><ErpTd className={diff<0?'text-[#f56c6c]':diff>0?'text-[#67c23a]':'text-muted-foreground'}>{diff!==0?diff.toLocaleString():'0'}</ErpTd><ErpTd className="text-muted-foreground">{i.deptName||'-'}</ErpTd><ErpTd><ErpApproval status={i.approvalStatus}/></ErpTd><ErpTd>{i.approvalStatus==='SUBMITTED'?<div className="flex gap-1"><button onClick={()=>audit(i.id,'APPROVED')} className="text-[#67c23a] text-[13px] hover:underline"><CheckCircle className="h-3.5 w-3.5 inline mr-0.5"/>通过</button><button onClick={()=>audit(i.id,'REJECTED')} className="text-[#f56c6c] text-[13px] hover:underline ml-2"><XCircle className="h-3.5 w-3.5 inline mr-0.5"/>拒绝</button></div>:<span className="text-[13px] text-muted-foreground">-</span>}</ErpTd></ErpTr>)})}
    {items.length===0&&<ErpEmpty colSpan={11}/>}
    </ErpTbody></ErpTable></div>
    <ErpPagination page={pg} pageSize={ps} total={total} onPage={setPg} onPageSize={v=>setPs(+v)}/>
  </div></TooltipProvider>);
}
function F({label,children}:{label:string;children:React.ReactNode}){return<div className="flex items-center gap-1.5"><span className="text-[13px] text-muted-foreground w-[80px] text-right shrink-0">{label}</span>{children}</div>;}
