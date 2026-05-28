'use client';
import { useEffect, useState, useCallback } from 'react';
import api from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { TooltipProvider } from '@/components/ui/tooltip';
import { toast } from '@/components/ui/toast';
import { Search, CheckCircle, XCircle, GitBranch } from 'lucide-react';
import { ErpTable,ErpThead,ErpTh,ErpTbody,ErpTr,ErpTd,ErpEmpty,ErpLink,ErpTools,ErpApproval,ErpPagination } from '@/components/ui/erp-table';

interface Item { id:string;orderNo:string;orderName:string;materialName:string|null;quantity:string;departmentName:string|null;approvalStatus:string;businessStatus:string;remark:string|null;createdAt:string; }

export default function DamageAuditPage() {
  const [items,setItems]=useState<Item[]>([]);const [total,setTotal]=useState(0);const [pg,setPg]=useState(1);const [ps,setPs]=useState(30);
  const [s,setS]=useState({code:'',name:'',status:''});

  const fetch=useCallback(async()=>{
    const p:any={page:pg,pageSize:ps}; if(s.code)p.code=s.code; if(s.name)p.name=s.name; if(s.status)p.status=s.status;
    const {data}=await api.get('/production-orders',{params:p}); setItems(data.items); setTotal(data.total);
  },[pg,ps,s]); useEffect(()=>{fetch();},[fetch]);

  const audit=async(id:string,status:string)=>{await api.put(`/production-orders/${id}`,{approvalStatus:status}); fetch();};
const pushPlan=async(i:Item)=>{await api.post('/purchase-plans',{orderNo:'PLAN-'+Date.now(),orderName:'补采购-'+i.materialName,supplierName:'',materialName:i.materialName,quantity:i.quantity,requiredDate:new Date().toISOString().split('T')[0]});toast('已生成采购计划', 'info');fetch();};

  return (<TooltipProvider><div className="bg-background rounded-lg border shadow-sm">
    <div className="flex items-center justify-between px-4 h-14 border-b border-border">
      <span className="text-sm font-medium text-foreground">制损单审核</span>
      <div className="flex items-center gap-1">
        <Button variant="ghost" size="sm" onClick={()=>setS({code:'',name:'',status:''})}>重置</Button>
        <Button variant="default" size="sm" onClick={fetch}><Search className="h-3.5 w-3.5 mr-1"/>搜索</Button>
      </div>
    </div>
    <div className="flex items-center gap-4 px-4 py-2.5 border-b border-border bg-muted/30 flex-wrap">
      <F label="审批状态"><Select value={s.status} onValueChange={(v:any)=>setS({...s,status:v==='ALL'?'':v})}><SelectTrigger className="w-[100px] h-9 rounded-md border border-border bg-background px-3 text-[13px]"><SelectValue placeholder="全部"/></SelectTrigger><SelectContent><SelectItem value="ALL">全部</SelectItem><SelectItem value="SUBMITTED">已提交</SelectItem><SelectItem value="APPROVED">已通过</SelectItem><SelectItem value="REJECTED">已拒绝</SelectItem></SelectContent></Select></F>
      <F label="订单编号"><Input className="w-[140px] h-9 rounded-md border border-border bg-background px-3 text-[13px]" value={s.code} onChange={e=>setS({...s,code:e.target.value})}/></F>
      <F label="物料"><Input className="w-[140px] h-9 rounded-md border border-border bg-background px-3 text-[13px]" value={s.name} onChange={e=>setS({...s,name:e.target.value})}/></F>
    </div>
    <ErpTools onRefresh={fetch}/>
    <div className="overflow-auto"><ErpTable><ErpThead><ErpTh>订单单号</ErpTh><ErpTh>订单名称</ErpTh><ErpTh>物料</ErpTh><ErpTh>数量</ErpTh><ErpTh>部门</ErpTh><ErpTh>业务状态</ErpTh><ErpTh>审批状态</ErpTh><ErpTh>备注</ErpTh><ErpTh>操作</ErpTh></ErpThead><ErpTbody>
    {items.map(i=>(<ErpTr key={i.id}><ErpTd><ErpLink>{i.orderNo}</ErpLink></ErpTd><ErpTd>{i.orderName||'-'}</ErpTd><ErpTd className="text-muted-foreground">{i.materialName||'-'}</ErpTd><ErpTd>{i.quantity?Number(i.quantity).toLocaleString():'-'}</ErpTd><ErpTd className="text-muted-foreground">{i.departmentName||'-'}</ErpTd><ErpTd><ErpApproval status={i.businessStatus} labels={{PENDING_ISSUE:'待领料',IN_PRODUCTION:'生产中',PENDING_STOCK:'待入库',COMPLETED:'已完成'}}/></ErpTd><ErpTd><ErpApproval status={i.approvalStatus}/></ErpTd><ErpTd className="text-muted-foreground max-w-[120px] truncate">{i.remark||'-'}</ErpTd><ErpTd><div className="flex gap-1"><button onClick={()=>pushPlan(i)} className="text-[#e6a23c] text-[13px] hover:underline"><GitBranch className="h-3.5 w-3.5 inline mr-0.5"/>下推采购</button>{i.approvalStatus==='SUBMITTED'?<><button onClick={()=>audit(i.id,'APPROVED')} className="text-[#67c23a] text-[13px] hover:underline ml-1"><CheckCircle className="h-3.5 w-3.5 inline mr-0.5"/>通过</button><button onClick={()=>audit(i.id,'REJECTED')} className="text-[#f56c6c] text-[13px] hover:underline ml-1"><XCircle className="h-3.5 w-3.5 inline mr-0.5"/>拒绝</button></>:null}</div></ErpTd></ErpTr>))}
    {items.length===0&&<ErpEmpty colSpan={10}/>}
    </ErpTbody></ErpTable></div>
    <ErpPagination page={pg} pageSize={ps} total={total} onPage={setPg} onPageSize={v=>setPs(+v)}/>
  </div></TooltipProvider>);
}
function F({label,children}:{label:string;children:React.ReactNode}){return<div className="flex items-center gap-1.5"><span className="text-[13px] text-muted-foreground w-[80px] text-right shrink-0">{label}</span>{children}</div>;}
