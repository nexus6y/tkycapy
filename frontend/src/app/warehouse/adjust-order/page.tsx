'use client';
import { useEffect, useState, useCallback } from 'react';
import api from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { TooltipProvider } from '@/components/ui/tooltip';
import { Search, CheckCircle, XCircle } from 'lucide-react';
import { ErpTable,ErpThead,ErpTh,ErpTbody,ErpTr,ErpTd,ErpEmpty,ErpLink,ErpTools,ErpApproval,ErpPagination } from '@/components/ui/erp-table';

interface Item { id:string;orderNo:string;checkOrderId:string|null;checkOrderNo:string|null;materialName:string|null;warehouseName:string|null;adjustQty:string;adjustReason:string|null;approvalStatus:string;createdAt:string; }

export default function AdjustOrderPage() {
  const [items,setItems]=useState<Item[]>([]);const [total,setTotal]=useState(0);const [pg,setPg]=useState(1);const [ps,setPs]=useState(30);
  const [s,setS]=useState({code:'',status:''});

  const fetch=useCallback(async()=>{
    const p:any={page:pg,pageSize:ps}; if(s.code)p.code=s.code; if(s.status)p.status=s.status;
    const {data}=await api.get('/adjust-orders',{params:p}); setItems(data.items); setTotal(data.total);
  },[pg,ps,s]); useEffect(()=>{fetch();},[fetch]);

  const audit=async(id:string,status:string)=>{await api.put(`/adjust-orders/${id}/approve`); fetch();};

  return (<TooltipProvider><div className="bg-background rounded-lg border shadow-sm">
    <div className="flex items-center justify-between px-4 h-14 border-b border-border">
      <span className="text-sm font-medium text-foreground">调整单审核</span>
      <div className="flex items-center gap-1">
        <Button variant="ghost" size="sm" onClick={()=>setS({code:'',status:''})}>重置</Button>
        <Button variant="default" size="sm" onClick={fetch}><Search className="h-3.5 w-3.5 mr-1"/>搜索</Button>
      </div>
    </div>
    <div className="flex items-center gap-4 px-4 py-2.5 border-b border-border bg-muted/30 flex-wrap">
      <F label="审批状态"><Select value={s.status} onValueChange={(v:any)=>setS({...s,status:v==='ALL'?'':v})}><SelectTrigger className="w-[100px] h-9 rounded-md border border-border bg-background px-3 text-[13px]"><SelectValue placeholder="全部"/></SelectTrigger><SelectContent><SelectItem value="ALL">全部</SelectItem><SelectItem value="DRAFT">草稿</SelectItem><SelectItem value="SUBMITTED">已提交</SelectItem><SelectItem value="APPROVED">已通过</SelectItem></SelectContent></Select></F>
      <F label="调整单号"><Input className="w-[140px] h-9 rounded-md border border-border bg-background px-3 text-[13px]" value={s.code} onChange={e=>setS({...s,code:e.target.value})}/></F>
    </div>
    <ErpTools onRefresh={fetch}/>
    <div className="overflow-auto"><ErpTable><ErpThead><ErpTh>调整单号</ErpTh><ErpTh>盘点单号</ErpTh><ErpTh>物料</ErpTh><ErpTh>仓库</ErpTh><ErpTh>调整数量</ErpTh><ErpTh>调整原因</ErpTh><ErpTh>审批状态</ErpTh><ErpTh>创建时间</ErpTh><ErpTh>操作</ErpTh></ErpThead><ErpTbody>
    {items.map(i=>(<ErpTr key={i.id}><ErpTd><ErpLink>{i.orderNo}</ErpLink></ErpTd><ErpTd className="text-muted-foreground">{i.checkOrderNo||'-'}</ErpTd><ErpTd>{i.materialName||'-'}</ErpTd><ErpTd className="text-muted-foreground">{i.warehouseName||'-'}</ErpTd><ErpTd className={Number(i.adjustQty)>0?'text-[#67c23a] font-medium':'text-[#f56c6c] font-medium'}>{Number(i.adjustQty)>0?'+':''}{Number(i.adjustQty).toLocaleString()}</ErpTd><ErpTd className="text-muted-foreground">{i.adjustReason||'-'}</ErpTd><ErpTd><ErpApproval status={i.approvalStatus}/></ErpTd><ErpTd className="text-muted-foreground">{new Date(i.createdAt).toLocaleDateString('zh-CN')}</ErpTd><ErpTd>{i.approvalStatus==='SUBMITTED'?<div className="flex gap-1"><button onClick={()=>audit(i.id,'APPROVED')} className="text-[#67c23a] text-[13px] hover:underline"><CheckCircle className="h-3.5 w-3.5 inline mr-0.5"/>通过</button><button onClick={()=>audit(i.id,'REJECTED')} className="text-[#f56c6c] text-[13px] hover:underline ml-2"><XCircle className="h-3.5 w-3.5 inline mr-0.5"/>拒绝</button></div>:<span className="text-[13px] text-muted-foreground">-</span>}</ErpTd></ErpTr>))}
    {items.length===0&&<ErpEmpty colSpan={9}/>}
    </ErpTbody></ErpTable></div>
    <ErpPagination page={pg} pageSize={ps} total={total} onPage={setPg} onPageSize={v=>setPs(+v)}/>
  </div></TooltipProvider>);
}
function F({label,children}:{label:string;children:React.ReactNode}){return<div className="flex items-center gap-1.5"><span className="text-[13px] text-muted-foreground w-[80px] text-right shrink-0">{label}</span>{children}</div>;}
