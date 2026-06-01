'use client';
import { useEffect, useState, useCallback } from 'react';
import api from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { TooltipProvider } from '@/components/ui/tooltip';
import { toast } from '@/components/ui/toast';
import { Search, CheckCircle } from 'lucide-react';
import { ErpTable,ErpThead,ErpTh,ErpTbody,ErpTr,ErpTd,ErpEmpty,ErpLink,ErpTools,ErpPagination } from '@/components/ui/erp-table';

interface Item { id:string;orderNo:string;orderName:string;supplierName:string|null;totalAmount:string|null;approvalStatus:string;businessStatus:string;createdAt:string; }

export default function ArrivalPage() {
  const [items,setItems]=useState<Item[]>([]);const [total,setTotal]=useState(0);const [pg,setPg]=useState(1);const [ps,setPs]=useState(30);
  const [s,setS]=useState({code:'',name:'',status:'APPROVED'});

  const confirmArrival=async(i:Item)=>{
    if(!window.confirm(`确定确认到货？将从采购订单 ${i.orderNo} 生成入库单。`)) return;
    try {
      const res=await api.post(`/purchase-orders/${i.id}/confirm-arrival`);
      toast(res.data?.message||'到货确认成功','success');
      fetch();
    } catch(e:any) { toast(e.response?.data?.message||'到货确认失败','error'); }
  };

  const fetch=useCallback(async()=>{
    const p:any={page:pg,pageSize:ps};
    if(s.code) p.code=s.code; if(s.name) p.name=s.name; if(s.status) p.status=s.status;
    const {data}=await api.get('/purchase-orders',{params:p}); setItems(data.items); setTotal(data.total);
  },[pg,ps,s]); useEffect(()=>{fetch();},[fetch]);

  return (<TooltipProvider><div className="bg-background rounded-lg border shadow-sm">
    <div className="flex items-center justify-between px-4 h-14 border-b border-border">
      <span className="text-sm font-medium text-foreground">到货确认 — 从已审批采购订单生成入库单</span>
      <div className="flex items-center gap-1">
        <Button variant="ghost" size="sm" onClick={()=>setS({code:'',name:'',status:'APPROVED'})}>重置</Button>
        <Button variant="default" size="sm" onClick={fetch}><Search className="h-3.5 w-3.5 mr-1"/>搜索</Button>
      </div>
    </div>
    <div className="flex items-center gap-4 px-4 py-2.5 border-b border-border bg-muted/30 flex-wrap">
      <F label="采购单号"><Input className="w-[140px] h-9 rounded-md border border-border bg-background px-3 text-[13px]" value={s.code} onChange={e=>setS({...s,code:e.target.value})}/></F>
      <F label="采购名称"><Input className="w-[140px] h-9 rounded-md border border-border bg-background px-3 text-[13px]" value={s.name} onChange={e=>setS({...s,name:e.target.value})}/></F>
      <F label="审批状态"><Select value={s.status} onValueChange={(v:any)=>setS({...s,status:v==='ALL'?'':v})}><SelectTrigger className="w-[100px] h-9 rounded-md border border-border bg-background px-3 text-[13px]"><SelectValue placeholder="全部"/></SelectTrigger><SelectContent><SelectItem value="ALL">全部</SelectItem><SelectItem value="DRAFT">草稿</SelectItem><SelectItem value="SUBMITTED">已提交</SelectItem><SelectItem value="APPROVED">已通过</SelectItem></SelectContent></Select></F>
    </div>
    <ErpTools onRefresh={fetch}/>
    <div className="overflow-auto"><ErpTable><ErpThead><ErpTh>采购单号</ErpTh><ErpTh>采购名称</ErpTh><ErpTh>供应商</ErpTh><ErpTh>金额</ErpTh><ErpTh>审批状态</ErpTh><ErpTh>业务状态</ErpTh><ErpTh>创建时间</ErpTh><ErpTh>操作</ErpTh></ErpThead><ErpTbody>
    {items.map(i=>(<ErpTr key={i.id}><ErpTd><ErpLink>{i.orderNo}</ErpLink></ErpTd><ErpTd>{i.orderName}</ErpTd><ErpTd className="text-muted-foreground">{i.supplierName||'-'}</ErpTd><ErpTd>{i.totalAmount?Number(i.totalAmount).toLocaleString():'-'}</ErpTd><ErpTd>{i.approvalStatus==='APPROVED'?<span className="text-[#67c23a] font-medium">已通过</span>:i.approvalStatus}</ErpTd><ErpTd className="text-muted-foreground">{i.businessStatus||'-'}</ErpTd><ErpTd className="text-muted-foreground">{new Date(i.createdAt).toLocaleDateString('zh-CN')}</ErpTd><ErpTd>{i.approvalStatus==='APPROVED'&&<button onClick={()=>confirmArrival(i)} className="text-[#67c23a] text-[13px] hover:underline"><CheckCircle className="h-3.5 w-3.5 inline mr-0.5"/>确认到货</button>}{i.approvalStatus!=='APPROVED'&&<span className="text-[12px] text-muted-foreground">待审批</span>}</ErpTd></ErpTr>))}
    {items.length===0&&<ErpEmpty colSpan={8}/>}
    </ErpTbody></ErpTable></div>
    <ErpPagination page={pg} pageSize={ps} total={total} onPage={setPg} onPageSize={v=>setPs(+v)}/>
  </div></TooltipProvider>);
}
function F({label,children}:{label:string;children:React.ReactNode}){return<div className="flex items-center gap-1.5"><span className="text-[13px] text-muted-foreground w-[80px] text-right shrink-0">{label}</span>{children}</div>;}
