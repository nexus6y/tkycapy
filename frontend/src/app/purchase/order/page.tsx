'use client';
import { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import api from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { exportCSV } from '@/lib/export';
import { TooltipProvider } from '@/components/ui/tooltip';
import { Download, Pencil, Plus, Search, Trash2 } from 'lucide-react';
import { toast } from '@/components/ui/toast';
import { ErpTable,ErpThead,ErpTh,ErpTbody,ErpTr,ErpTd,ErpEmpty,ErpLink,ErpAction,ErpActionBtn,ErpTools,ErpApproval,ErpPagination } from '@/components/ui/erp-table';

interface LineItem { id:string;lineNo:number;materialCode:string|null;materialName:string|null;spec:string|null;unit:string|null;quantity:string|null;unitPrice:string|null;amount:string|null; }
interface Item { id:string;orderNo:string;orderName:string;supplierName:string|null;totalAmount:string|null;approvalStatus:string;businessStatus:string;createdAt:string;lines?:LineItem[] }

export default function PurchaseOrderPage() {
  const router=useRouter();
  const [items,setItems]=useState<Item[]>([]);const [total,setTotal]=useState(0);const [pg,setPg]=useState(1);const [ps,setPs]=useState(30);
  const [sel,setSel]=useState<Set<string>>(new Set());const [s,setS]=useState({code:'',name:'',status:'',bizStatus:''});
  const [del,setDel]=useState<string|null>(null);
  const [detailMode,setDetailMode]=useState(false);

  const fetch=useCallback(async()=>{
    const p:any={page:pg,pageSize:ps}; if(s.code)p.code=s.code; if(s.name)p.name=s.name; if(s.status)p.status=s.status; if(s.bizStatus)p.bizStatus=s.bizStatus;
    if(detailMode)p.mode='detail';
    const {data}=await api.get('/purchase-orders',{params:p}); setItems(data.items); setTotal(data.total);
  },[pg,ps,s,detailMode]); useEffect(()=>{fetch();},[fetch]);

  const doDel=async()=>{if(!del)return;try{await api.delete(`/purchase-orders/${del}`);setDel(null);fetch();}catch(e:any){toast(e.response?.data?.message||'删除失败','error');}};
  const toggleAll=(v:boolean)=>setSel(v?new Set(items.map(i=>i.id)):new Set());

  return (<TooltipProvider><div className="bg-background rounded-lg border shadow-sm">
    <div className="flex items-center justify-between px-4 h-14 border-b border-border">
      <div className="flex items-center gap-1">
        <Button variant="secondary" size="sm" onClick={()=>router.push('/purchase/order/create')}><Plus className="h-3.5 w-3.5"/>新增</Button>
        <Button variant="outline" size="sm" disabled={sel.size===0} onClick={()=>toast('请先勾选数据','info')}>修改</Button>
        <Button variant="outline" size="sm" disabled={sel.size===0} onClick={()=>toast('请先勾选数据','info')}>删除</Button>
        <Button variant="outline" size="sm" onClick={()=>exportCSV(items,'export')}><Download className="h-3.5 w-3.5 mr-1"/>导出</Button>
      </div>
      <div className="flex items-center gap-1">
        <Button variant="ghost" size="sm" onClick={()=>setS({code:'',name:'',status:'',bizStatus:''})}>重置</Button>
        <Button variant="default" size="sm" onClick={fetch}><Search className="h-3.5 w-3.5 mr-1"/>搜索</Button>
      </div>
    </div>
    <div className="flex items-center gap-4 px-4 py-2.5 border-b border-border bg-muted/30 flex-wrap">
      <F label="审批"><Select value={s.status} onValueChange={(v:any)=>setS({...s,status:v==='ALL'?'':v})}><SelectTrigger className="w-[90px] h-9 rounded-md border border-border bg-background px-3 text-[13px]"><SelectValue placeholder="全部"/></SelectTrigger><SelectContent><SelectItem value="ALL">全部</SelectItem><SelectItem value="DRAFT">草稿</SelectItem><SelectItem value="SUBMITTED">已提交</SelectItem><SelectItem value="APPROVED">已通过</SelectItem></SelectContent></Select></F>
      <F label="业务"><Select value={s.bizStatus} onValueChange={(v:any)=>setS({...s,bizStatus:v==='ALL'?'':v})}><SelectTrigger className="w-[100px] h-9 rounded-md border border-border bg-background px-3 text-[13px]"><SelectValue placeholder="全部"/></SelectTrigger><SelectContent><SelectItem value="ALL">全部</SelectItem><SelectItem value="PENDING_RECEIPT">待收货</SelectItem><SelectItem value="PARTIAL_RECEIPT">部分收货</SelectItem><SelectItem value="FULLY_RECEIVED">收货完成</SelectItem></SelectContent></Select></F>
      <F label="订单编号"><Input className="w-[140px] h-9 rounded-md border border-border bg-background px-3 text-[13px]" value={s.code} onChange={e=>setS({...s,code:e.target.value})}/></F>
      <F label="订单名称"><Input className="w-[140px] h-9 rounded-md border border-border bg-background px-3 text-[13px]" value={s.name} onChange={e=>setS({...s,name:e.target.value})}/></F>
    </div>
    <ErpTools onRefresh={fetch}/>
    <div className="flex items-center gap-2 px-4 py-1">
      <Button variant={detailMode?"secondary":"outline"} size="sm" onClick={()=>setDetailMode(!detailMode)}>主单+明细</Button>
    </div>
    <div className="overflow-auto"><ErpTable><ErpThead><ErpTh className="w-10"><Checkbox checked={items.length>0&&sel.size===items.length} onCheckedChange={(v:boolean)=>toggleAll(v)}/></ErpTh><ErpTh>审批状态</ErpTh><ErpTh>业务状态</ErpTh><ErpTh>订单编号</ErpTh><ErpTh>订单名称</ErpTh><ErpTh>供应商</ErpTh><ErpTh>金额</ErpTh><ErpTh>创建时间</ErpTh><ErpTh>操作</ErpTh></ErpThead><ErpTbody>
    {items.map(i=>(<><ErpTr key={i.id} className={detailMode&&i.lines&&i.lines.length>0?'border-b-0':''}><ErpTd><Checkbox checked={sel.has(i.id)} onCheckedChange={(v:boolean)=>{const n=new Set(sel);v?n.add(i.id):n.delete(i.id);setSel(n);}}/></ErpTd><ErpTd><ErpApproval status={i.approvalStatus}/></ErpTd><ErpTd><span className="text-[12px] text-muted-foreground">{i.businessStatus||'-'}{i.lines?` (${i.lines.length}行)`:''}</span></ErpTd><ErpTd><ErpLink onClick={()=>router.push('/purchase/order/'+i.id+'/edit')}>{i.orderNo}</ErpLink></ErpTd><ErpTd>{i.orderName||'-'}</ErpTd><ErpTd className="text-muted-foreground">{i.supplierName||'-'}</ErpTd><ErpTd>{i.totalAmount?Number(i.totalAmount).toLocaleString():'-'}</ErpTd><ErpTd className="text-muted-foreground">{new Date(i.createdAt).toLocaleDateString('zh-CN')}</ErpTd><ErpTd><ErpAction><ErpActionBtn onClick={()=>router.push('/purchase/order/'+i.id+'/edit')}><Pencil className="h-3.5 w-3.5"/>修改</ErpActionBtn>{i.approvalStatus==='DRAFT'&&<button onClick={()=>{api.put(`/purchase-orders/${i.id}/submit`).then(fetch).catch((e:any)=>toast(e.response?.data?.message||'提交失败','error'));}} className="text-primary text-[13px] hover:underline">提交</button>}{i.approvalStatus==='SUBMITTED'&&<button onClick={()=>{api.put(`/purchase-orders/${i.id}/approve`).then(fetch).catch((e:any)=>toast(e.response?.data?.message||'审批失败','error'));}} className="text-green-600 text-[13px] hover:underline">通过</button>}{i.approvalStatus==='SUBMITTED'&&<button onClick={()=>{api.put(`/purchase-orders/${i.id}/withdraw`).then(fetch).catch((e:any)=>toast(e.response?.data?.message||'撤回失败','error'));}} className="text-orange-500 text-[13px] hover:underline">撤回</button>}<ErpActionBtn danger onClick={()=>setDel(i.id)}><Trash2 className="h-3.5 w-3.5"/>删除</ErpActionBtn></ErpAction></ErpTd></ErpTr>
    {detailMode&&i.lines&&i.lines.map(l=>(<ErpTr key={l.id||l.lineNo} className="bg-[#f0f7ff]"><ErpTd/><ErpTd/><ErpTd className="text-[12px] text-muted-foreground">└ 行{l.lineNo}</ErpTd><ErpTd className="text-[12px]">{l.materialCode||'-'}</ErpTd><ErpTd className="text-[12px]">{l.materialName||'-'}</ErpTd><ErpTd className="text-[12px] text-muted-foreground">{l.spec||'-'}</ErpTd><ErpTd className="text-[12px]">{l.quantity?Number(l.quantity).toLocaleString():'-'}{l.unit?` ${l.unit}`:''}</ErpTd><ErpTd className="text-[12px] text-muted-foreground">{l.unitPrice?Number(l.unitPrice).toFixed(2):'-'}</ErpTd><ErpTd/></ErpTr>))}
    </>))}
    {items.length===0&&<ErpEmpty colSpan={9}/>}
    </ErpTbody></ErpTable></div>
    <ErpPagination page={pg} pageSize={ps} total={total} onPage={setPg} onPageSize={v=>setPs(+v)}/>
    <AlertDialog open={!!del} onOpenChange={()=>setDel(null)}><AlertDialogContent><AlertDialogHeader><AlertDialogTitle>确认删除？</AlertDialogTitle></AlertDialogHeader><AlertDialogFooter><AlertDialogCancel>取消</AlertDialogCancel><AlertDialogAction onClick={doDel} className="bg-[#f56c6c] text-white hover:bg-[#f56c6c]/90">删除</AlertDialogAction></AlertDialogFooter></AlertDialogContent></AlertDialog>
  </div></TooltipProvider>);
}
function F({label,children}:{label:string;children:React.ReactNode}){return<div className="flex items-center gap-1.5"><span className="text-[13px] text-muted-foreground w-[80px] text-right shrink-0">{label}</span>{children}</div>;}
