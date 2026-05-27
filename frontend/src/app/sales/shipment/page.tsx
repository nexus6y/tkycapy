'use client';
import { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import api from '@/lib/api';
import { Button } from '@/components/ui/button';import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { exportCSV } from '@/lib/export';
import { TooltipProvider } from '@/components/ui/tooltip';

import { ChevronDown, Download, Pencil, Plus, Search, Trash2, Upload } from 'lucide-react';
import { ErpTable,ErpThead,ErpTh,ErpTbody,ErpTr,ErpTd,ErpEmpty,ErpLink,ErpAction,ErpActionBtn,ErpTools,ErpApproval,ErpPagination } from '@/components/ui/erp-table';

interface Item { id:string;shipmentNo:string;orderNo:string|null;customerName:string|null;totalQuantity:string|null;totalAmount:string|null;approvalStatus:string;businessStatus:string;createdAt:string; }
const AP:Record<string,string>={DRAFT:'草稿',SUBMITTED:'已提交',APPROVED:'已通过',REJECTED:'已拒绝'};

export default function SalesShipmentPage() {
  const router=useRouter();
  const [items,setItems]=useState<Item[]>([]);const [total,setTotal]=useState(0);const [pg,setPg]=useState(1);const [ps,setPs]=useState(30);
  const [sel,setSel]=useState<Set<string>>(new Set());const [s,setS]=useState({code:'',name:'',status:''});
  const [del,setDel]=useState<string|null>(null);

  const fetch=useCallback(async()=>{
    const p:any={page:pg,pageSize:ps}; if(s.code)p.code=s.code; if(s.name)p.name=s.name; if(s.status)p.status=s.status;
    const {data}=await api.get('/sales-shipments',{params:p}); setItems(data.items); setTotal(data.total);
  },[pg,ps,s]); useEffect(()=>{fetch();},[fetch]);

  const doDel=async()=>{if(!del)return;await api.delete(`/sales-shipments/${del}`);setDel(null);fetch();};
  const tp=Math.ceil(total/ps);const pgs=Array.from({length:tp},(_,i)=>i+1).filter(p=>p===1||p===tp||Math.abs(p-pg)<=2);

  return (<TooltipProvider><div className="bg-background rounded-lg border shadow-sm">
    <div className="flex items-center justify-between px-4 h-14 border-b border-border">
      <div className="flex items-center gap-1">
        <Button variant="secondary" size="sm" onClick={()=>router.push('/sales/shipment/create')}><Plus className="h-3.5 w-3.5"/>新增</Button>
        <Button variant="outline" size="sm" disabled={sel.size===0}>修改</Button><Button variant="outline" size="sm" disabled={sel.size===0}>删除</Button>
        
        <Button variant="outline" size="sm" onClick={()=>exportCSV(items,'export')}><Download className="h-3.5 w-3.5 mr-1"/>导出</Button>
      </div>
      <div className="flex items-center gap-1"><Button variant="ghost" size="sm" onClick={()=>setS({code:'',name:'',status:''})}>重置</Button><Button variant="default" size="sm" onClick={fetch}><Search className="h-3.5 w-3.5 mr-1"/>搜索</Button></div>
    </div>
    <div className="flex items-center gap-4 px-4 py-2.5 border-b border-border bg-muted/30 flex-wrap">
      <F label="状态"><Select value={s.status} onValueChange={v=>setS({...s,status:v==='ALL'?'':v})}><SelectTrigger className="w-[90px] h-9 rounded-md border border-border bg-background px-3 text-[13px]"><SelectValue placeholder="全部"/></SelectTrigger><SelectContent><SelectItem value="ALL">全部</SelectItem><SelectItem value="DRAFT">草稿</SelectItem><SelectItem value="SUBMITTED">已提交</SelectItem><SelectItem value="APPROVED">已通过</SelectItem></SelectContent></Select></F>
      <F label="出货单号"><Input className="w-[130px] h-9 rounded-md border border-border bg-background px-3 text-[13px]" value={s.code} onChange={e=>setS({...s,code:e.target.value})}/></F>
      <F label="客户"><Input className="w-[130px] h-9 rounded-md border border-border bg-background px-3 text-[13px]" value={s.name} onChange={e=>setS({...s,name:e.target.value})}/></F>
    </div>
    <ErpTools onRefresh={fetch}/>
    <div className="overflow-auto"><ErpTable><ErpThead><ErpTh className="w-10"><Checkbox/></ErpTh><ErpTh>审批状态</ErpTh><ErpTh>出货单号</ErpTh><ErpTh>关联订单</ErpTh><ErpTh>客户</ErpTh><ErpTh>数量</ErpTh><ErpTh>金额</ErpTh><ErpTh>业务状态</ErpTh><ErpTh>创建时间</ErpTh><ErpTh>操作</ErpTh></ErpThead><ErpTbody>
    {items.map(i=>(<ErpTr key={i.id}><ErpTd><Checkbox/></ErpTd><ErpTd><ErpApproval status={i.approvalStatus}/></ErpTd><ErpTd><ErpLink onClick={()=>router.push('/sales/shipment/'+i.id+'/edit')}>{i.shipmentNo}</ErpLink></ErpTd><ErpTd className="text-muted-foreground">{i.orderNo||'-'}</ErpTd><ErpTd className="text-muted-foreground">{i.customerName||'-'}</ErpTd><ErpTd>{i.totalQuantity||'-'}</ErpTd><ErpTd>{i.totalAmount?Number(i.totalAmount).toLocaleString():'-'}</ErpTd><ErpTd className="text-muted-foreground">{i.businessStatus}</ErpTd><ErpTd className="text-muted-foreground">{new Date(i.createdAt).toLocaleDateString('zh-CN')}</ErpTd><ErpTd><ErpAction><ErpActionBtn onClick={()=>router.push('/sales/shipment/'+i.id+'/edit')}><Pencil className="h-3.5 w-3.5"/>修改</ErpActionBtn>{i.approvalStatus==='DRAFT'&&<button onClick={()=>{api.put(`/sales-shipments/${i.id}/submit`).then(fetch);}} className="text-primary text-[13px]">提交</button>}<ErpActionBtn danger onClick={()=>setDel(i.id)}><Trash2 className="h-3.5 w-3.5"/>删除</ErpActionBtn></ErpAction></ErpTd></ErpTr>))}
    {items.length===0&&<ErpEmpty colSpan={10}/>}
    </ErpTbody></ErpTable></div>
    <ErpPagination page={pg} pageSize={ps} total={total} onPage={setPg} onPageSize={v=>setPs(+v)}/>
    <AlertDialog open={!!del} onOpenChange={()=>setDel(null)}><AlertDialogContent><AlertDialogHeader><AlertDialogTitle>确认删除？</AlertDialogTitle></AlertDialogHeader><AlertDialogFooter><AlertDialogCancel>取消</AlertDialogCancel><AlertDialogAction onClick={doDel} className="bg-[#f56c6c] text-white hover:bg-[#f56c6c]/90">删除</AlertDialogAction></AlertDialogFooter></AlertDialogContent></AlertDialog>
  </div></TooltipProvider>);
}
function F({label,children}:{label:string;children:React.ReactNode}){return<div className="flex items-center gap-1.5"><span className="text-[13px] text-muted-foreground w-[80px] text-right shrink-0">{label}</span>{children}</div>;}
