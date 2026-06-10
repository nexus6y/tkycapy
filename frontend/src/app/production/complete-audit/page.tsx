'use client';
import { useEffect, useState, useCallback } from 'react';
import api from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { TooltipProvider } from '@/components/ui/tooltip';
import { Search } from 'lucide-react';
import { toast } from '@/components/ui/toast';
import { ErpTable,ErpThead,ErpTh,ErpTbody,ErpTr,ErpTd,ErpEmpty,ErpLink,ErpTools,ErpApproval,ErpPagination } from '@/components/ui/erp-table';

interface Item { id:string;reportNo:string;sourceType:string|null;productionOrderId:string|null;productionOrderNo:string|null;materialCode:string|null;materialName:string|null;spec:string|null;unit:string|null;plannedQty:string;actualQty:string;deptName:string|null;approvalStatus:string;businessStatus:string;createdAt:string; }

export default function CompleteAuditPage() {
  const [items,setItems]=useState<Item[]>([]);const [total,setTotal]=useState(0);const [pg,setPg]=useState(1);const [ps,setPs]=useState(30);
  const [s,setS]=useState({code:'',name:'',status:''});

  const fetch=useCallback(async()=>{
    const p:any={page:pg,pageSize:ps}; if(s.code)p.code=s.code; if(s.name)p.name=s.name; if(s.status)p.status=s.status;
    const {data}=await api.get('/complete-reports',{params:p}); setItems(data.items); setTotal(data.total);
  },[pg,ps,s]); useEffect(()=>{fetch();},[fetch]);

  const doSubmit=async(id:string)=>{
    try{await api.put(`/complete-reports/${id}/submit`); toast('已提交','success'); fetch();}
    catch(e:any){toast(e.response?.data?.message||'提交失败','error');}
  };

  const doApprove=async(id:string)=>{
    try{await api.put(`/complete-reports/${id}/approve`); toast('完工登卡成功，产品库存已更新','success'); fetch();}
    catch(e:any){toast(e.response?.data?.message||'登卡失败','error');}
  };

  const doCancel=async(id:string)=>{
    if(!window.confirm('确认撤销完工登卡？产品库存将扣回。')) return;
    try{await api.put(`/complete-reports/${id}/cancel-approve`); toast('已撤销完工登卡','success'); fetch();}
    catch(e:any){toast(e.response?.data?.message||'撤销失败','error');}
  };

  return (<TooltipProvider><div className="bg-background rounded-lg border shadow-sm">
    <div className="flex items-center justify-between px-4 h-14 border-b border-border">
      <span className="text-sm font-medium text-foreground">完工报告</span>
      <div className="flex items-center gap-1">
        <Button variant="ghost" size="sm" onClick={()=>setS({code:'',name:'',status:''})}>重置</Button>
        <Button variant="default" size="sm" onClick={fetch}><Search className="h-3.5 w-3.5 mr-1"/>搜索</Button>
      </div>
    </div>
    <div className="flex items-center gap-4 px-4 py-2.5 border-b border-border bg-muted/30 flex-wrap">
      <F label="审批状态"><Select value={s.status} onValueChange={(v:any)=>setS({...s,status:v==='ALL'?'':v})}><SelectTrigger className="w-[100px] h-9 rounded-md border border-border bg-background px-3 text-[13px]"><SelectValue placeholder="全部"/></SelectTrigger><SelectContent><SelectItem value="ALL">全部</SelectItem><SelectItem value="DRAFT">草稿</SelectItem><SelectItem value="SUBMITTED">已提交</SelectItem><SelectItem value="APPROVED">已通过</SelectItem></SelectContent></Select></F>
      <F label="报告单号"><Input className="w-[140px] h-9 rounded-md border border-border bg-background px-3 text-[13px]" value={s.code} onChange={e=>setS({...s,code:e.target.value})}/></F>
      <F label="生产单号"><Input className="w-[140px] h-9 rounded-md border border-border bg-background px-3 text-[13px]" value={s.name} onChange={e=>setS({...s,name:e.target.value})}/></F>
    </div>
    <ErpTools onRefresh={fetch}/>
    <div className="overflow-auto"><ErpTable><ErpThead><ErpTh>报告单号</ErpTh><ErpTh>来源</ErpTh><ErpTh>生产单号</ErpTh><ErpTh>物料</ErpTh><ErpTh>规格</ErpTh><ErpTh>预计产量</ErpTh><ErpTh>实际产量</ErpTh><ErpTh>部门</ErpTh><ErpTh>审批状态</ErpTh><ErpTh>操作</ErpTh></ErpThead><ErpTbody>
    {items.map(i=>(<ErpTr key={i.id}><ErpTd><ErpLink>{i.reportNo}</ErpLink></ErpTd><ErpTd className="text-muted-foreground">{i.sourceType||'-'}</ErpTd><ErpTd>{i.productionOrderNo||'-'}</ErpTd><ErpTd>{i.materialName||'-'}</ErpTd><ErpTd className="text-muted-foreground">{i.spec||'-'}</ErpTd><ErpTd>{i.plannedQty?Number(i.plannedQty).toLocaleString():'-'}</ErpTd><ErpTd className="font-medium">{i.actualQty?Number(i.actualQty).toLocaleString():'-'}</ErpTd><ErpTd className="text-muted-foreground">{i.deptName||'-'}</ErpTd><ErpTd><ErpApproval status={i.approvalStatus}/></ErpTd><ErpTd>
    {(i.approvalStatus==='DRAFT')?<button onClick={()=>doSubmit(i.id)} className="text-primary text-[13px] hover:underline mr-2">提交</button>:null}
    {i.approvalStatus==='SUBMITTED'?<button onClick={()=>doApprove(i.id)} className="text-green-600 text-[13px] hover:underline mr-2">登卡/审核</button>:null}
    {i.approvalStatus==='APPROVED'?<button onClick={()=>doCancel(i.id)} className="text-orange-500 text-[13px] hover:underline">撤销登卡</button>:null}
    {i.approvalStatus==='DRAFT'||i.approvalStatus==='SUBMITTED'||i.approvalStatus==='APPROVED'?null:<span className="text-[13px] text-muted-foreground">-</span>}
    </ErpTd></ErpTr>))}
    {items.length===0&&<ErpEmpty colSpan={10}/>}
    </ErpTbody></ErpTable></div>
    <ErpPagination page={pg} pageSize={ps} total={total} onPage={setPg} onPageSize={v=>setPs(+v)}/>
  </div></TooltipProvider>);
}
function F({label,children}:{label:string;children:React.ReactNode}){return<div className="flex items-center gap-1.5"><span className="text-[13px] text-muted-foreground w-[80px] text-right shrink-0">{label}</span>{children}</div>;}
