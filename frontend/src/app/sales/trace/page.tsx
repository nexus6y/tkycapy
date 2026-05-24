'use client';
import { useEffect, useState, useCallback } from 'react';
import api from '@/lib/api';
import { Button } from '@/components/ui/button'; import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { RefreshCw, Search, Settings } from 'lucide-react';

interface Item { id:string;orderNo:string;orderName:string;customerName:string|null;approvalStatus:string;businessStatus:string;totalAmount:string|null;createdAt:string; }

export default function SalesTracePage() {
  const [items,setItems]=useState<Item[]>([]);const [total,setTotal]=useState(0);const [pg,setPg]=useState(1);const [ps,setPs]=useState(30);
  const [s,setS]=useState({code:'',name:'',status:'',bizStatus:''});

  const fetch=useCallback(async()=>{
    const p:any={page:pg,pageSize:ps}; if(s.code)p.code=s.code; if(s.name)p.name=s.name; if(s.status)p.status=s.status; if(s.bizStatus)p.bizStatus=s.bizStatus;
    const {data}=await api.get('/sales-orders',{params:p}); setItems(data.items); setTotal(data.total);
  },[pg,ps,s]); useEffect(()=>{fetch();},[fetch]);

  const tp=Math.ceil(total/ps);const pgs=Array.from({length:tp},(_,i)=>i+1).filter(p=>p===1||p===tp||Math.abs(p-pg)<=2);

  return (<TooltipProvider><div className="h-full flex flex-col bg-white">
    <div className="flex items-center justify-between px-4 py-2 border-b border-gray-100"><div/><div className="flex items-center gap-1"><Button size="sm" variant="ghost" onClick={()=>setS({code:'',name:'',status:'',bizStatus:''})}>重置</Button><Button size="sm" onClick={fetch}><Search size={14} className="mr-1"/>搜索</Button></div></div>
    <div className="flex items-center gap-3 px-4 py-2.5 bg-gray-50/50 border-b border-gray-100 flex-wrap">
      <div className="flex items-center gap-1.5"><span className="text-[12px] text-gray-500">审批</span><Select value={s.status} onValueChange={v=>setS({...s,status:v==='ALL'?'':v})}><SelectTrigger className="w-[90px] h-8 text-[12px]"><SelectValue placeholder="全部"/></SelectTrigger><SelectContent><SelectItem value="ALL">全部</SelectItem><SelectItem value="APPROVED">已通过</SelectItem><SelectItem value="SUBMITTED">已提交</SelectItem></SelectContent></Select></div>
      <div className="flex items-center gap-1.5"><span className="text-[12px] text-gray-500">业务</span><Select value={s.bizStatus} onValueChange={v=>setS({...s,bizStatus:v==='ALL'?'':v})}><SelectTrigger className="w-[100px] h-8 text-[12px]"><SelectValue placeholder="全部"/></SelectTrigger><SelectContent><SelectItem value="ALL">全部</SelectItem><SelectItem value="PENDING_SHIP">待出货</SelectItem><SelectItem value="PARTIAL_SHIP">部分出货</SelectItem><SelectItem value="FULLY_SHIPPED">出货完成</SelectItem></SelectContent></Select></div>
      <div className="flex items-center gap-1.5"><span className="text-[12px] text-gray-500">订单号</span><Input className="w-[130px] h-8 text-[12px]" value={s.code} onChange={e=>setS({...s,code:e.target.value})}/></div>
      <div className="flex items-center gap-1.5"><span className="text-[12px] text-gray-500">客户</span><Input className="w-[130px] h-8 text-[12px]" value={s.name} onChange={e=>setS({...s,name:e.target.value})}/></div>
    </div>
    <div className="flex-1 overflow-auto"><div className="flex items-center justify-end px-4 py-1.5 bg-gray-50/30 border-b border-gray-100 gap-1"><Tooltip><TooltipTrigger asChild><button className="p-1.5 hover:bg-gray-100 rounded text-gray-400 hover:text-gray-600"><RefreshCw size={14}/></button></TooltipTrigger><TooltipContent>刷新</TooltipContent></Tooltip><Tooltip><TooltipTrigger asChild><button className="p-1.5 hover:bg-gray-100 rounded text-gray-400 hover:text-gray-600"><Settings size={14}/></button></TooltipTrigger><TooltipContent>列设置</TooltipContent></Tooltip></div>
    <table className="w-full text-[13px]"><thead className="bg-gray-50 border-y border-gray-200 sticky top-0"><tr><th className="text-left px-2 py-2.5 font-medium text-gray-600">订单号</th><th className="text-left px-2 py-2.5 font-medium text-gray-600">订单名称</th><th className="text-left px-2 py-2.5 font-medium text-gray-600">客户</th><th className="text-left px-2 py-2.5 font-medium text-gray-600">审批状态</th><th className="text-left px-2 py-2.5 font-medium text-gray-600">业务状态</th><th className="text-left px-2 py-2.5 font-medium text-gray-600">金额</th><th className="text-left px-2 py-2.5 font-medium text-gray-600">创建时间</th></tr></thead><tbody>
    {items.map(i=>(<tr key={i.id} className="border-b border-gray-100 hover:bg-blue-50/30"><td className="px-2 py-2.5"><button className="text-blue-600 hover:text-blue-800 hover:underline text-[13px]">{i.orderNo}</button></td><td className="px-2 py-2.5 text-gray-700">{i.orderName}</td><td className="px-2 py-2.5 text-gray-700">{i.customerName||'-'}</td><td className="px-2 py-2.5"><span className={`inline-flex px-1.5 py-0.5 rounded text-[11px] ${i.approvalStatus==='APPROVED'?'bg-green-50 text-green-700':'bg-blue-50 text-blue-700'}`}>{i.approvalStatus==='APPROVED'?'已通过':'已提交'}</span></td><td className="px-2 py-2.5 text-gray-600 text-[12px]">{i.businessStatus}</td><td className="px-2 py-2.5 text-gray-700">{i.totalAmount?Number(i.totalAmount).toLocaleString():'-'}</td><td className="px-2 py-2.5 text-gray-500 text-[12px]">{new Date(i.createdAt).toLocaleDateString('zh-CN')}</td></tr>))}
    {items.length===0&&<tr><td colSpan={7} className="text-center text-gray-400 py-16">暂无数据</td></tr>}
    </tbody></table></div>
    <div className="flex items-center justify-between px-4 py-2.5 border-t border-gray-200 bg-white shrink-0"><span className="text-[12px] text-gray-500">共 {total} 条</span><div className="flex items-center gap-3"><Select value={String(ps)} onValueChange={v=>{setPs(+v);setPg(1);}}><SelectTrigger className="w-[100px] h-8 text-[12px]"><SelectValue/></SelectTrigger><SelectContent>{[20,30,50,100].map(n=><SelectItem key={n} value={String(n)}>{n}条/页</SelectItem>)}</SelectContent></Select><div className="flex items-center gap-0.5"><Button size="sm" variant="ghost" disabled={pg<=1} onClick={()=>setPg(p=>p-1)} className="text-[12px] px-2">‹</Button>{pgs.map((p,i)=>(<span key={p}>{i>0&&pgs[i-1]!==p-1&&<span className="text-gray-300 mx-0.5">...</span>}<button onClick={()=>setPg(p)} className={`w-7 h-7 rounded text-[12px] transition-colors ${p===pg?'bg-blue-600 text-white':'text-gray-600 hover:bg-gray-100'}`}>{p}</button></span>))}<Button size="sm" variant="ghost" disabled={pg>=tp} onClick={()=>setPg(p=>p+1)} className="text-[12px] px-2">›</Button></div></div></div>
  </div></TooltipProvider>);
}
