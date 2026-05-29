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
import { ErpTable, ErpThead, ErpTh, ErpTbody, ErpTr, ErpTd, ErpEmpty, ErpLink, ErpAction, ErpActionBtn, ErpTools, ErpApproval, ErpPagination } from '@/components/ui/erp-table';

interface PLineItem { id:string;lineNo:number;materialCode:string|null;materialName:string|null;spec:string|null;unit:string|null;plannedQty:string|null;actualQty:string|null; }
interface PMatItem { id:string;lineNo:number;materialCode:string|null;materialName:string|null;spec:string|null;unit:string|null;quantity:string|null;issuedQty:string|null; }
interface Item { id:string;orderNo:string;orderName:string;materialName:string|null;departmentName:string|null;quantity:string|null;startDate:string|null;endDate:string|null;approvalStatus:string;businessStatus:string;createdAt:string;lines?:PLineItem[];materials?:PMatItem[] }
const BS:Record<string,string>={PENDING_ISSUE:'待领料',ISSUING:'领料中',IN_PRODUCTION:'生产中',PENDING_STOCK:'待入库',COMPLETED:'已完成'};

export default function ProductionOrderPage() {
  const router = useRouter();const [items,setItems]=useState<Item[]>([]);const [total,setTotal]=useState(0);const [pg,setPg]=useState(1);const [ps,setPs]=useState(30);
  const [s,setS]=useState({code:'',status:'',biz:''});const [del,setDel]=useState<string|null>(null);
  const [detailMode,setDetailMode]=useState(false);
  const fetch=useCallback(async()=>{
    const p:any={page:pg,pageSize:ps}; if(s.code)p.code=s.code; if(s.status)p.status=s.status; if(s.biz)p.biz=s.biz;
    if(detailMode)p.mode='detail';
    const {data}=await api.get('/production-orders',{params:p}); setItems(data.items); setTotal(data.total);
  },[pg,ps,s,detailMode]); useEffect(()=>{fetch();},[fetch]);
  const doDel=async()=>{if(!del)return;try{await api.delete(`/production-orders/${del}`);setDel(null);fetch();}catch(e:any){toast(e.response?.data?.message||'删除失败','error');}};

  return (<TooltipProvider><div className="bg-background rounded-lg border shadow-sm">
    <div className="flex items-center justify-between px-4 h-14 border-b border-border">
      <div className="flex items-center gap-1">
        <Button variant="secondary" size="sm" onClick={()=>router.push('/production/order/create')}><Plus className="h-3.5 w-3.5"/>新增</Button>
        <Button variant="outline" size="sm">修改</Button><Button variant="outline" size="sm">删除</Button>
        <Button variant="outline" size="sm" onClick={()=>exportCSV(items,'export')}><Download className="h-3.5 w-3.5 mr-1"/>导出</Button>
      </div>
      <div className="flex items-center gap-1">
        <Button variant="ghost" size="sm" onClick={()=>setS({code:'',status:'',biz:''})}>重置</Button>
        <Button variant={detailMode?"secondary":"outline"} size="sm" onClick={()=>setDetailMode(!detailMode)}>主单+明细</Button>
        <Button variant="default" size="sm" onClick={fetch}><Search className="h-3.5 w-3.5 mr-1"/>搜索</Button>
      </div>
    </div>
    <div className="flex items-center gap-4 px-4 py-2.5 border-b border-border bg-muted/30">
      <div className="flex items-center gap-1.5"><span className="text-[13px] text-muted-foreground w-[80px] text-right shrink-0">审批</span><Select value={s.status} onValueChange={(v:any)=>setS({...s,status:v==='ALL'?'':v})}><SelectTrigger className="w-[100px] h-9 rounded-md border border-border bg-background px-3 text-[13px]"><SelectValue placeholder="全部"/></SelectTrigger><SelectContent><SelectItem value="ALL">全部</SelectItem><SelectItem value="DRAFT">草稿</SelectItem><SelectItem value="APPROVED">已通过</SelectItem></SelectContent></Select></div>
      <div className="flex items-center gap-1.5"><span className="text-[13px] text-muted-foreground w-[80px] text-right shrink-0">业务</span><Select value={s.biz} onValueChange={(v:any)=>setS({...s,biz:v==='ALL'?'':v})}><SelectTrigger className="w-[110px] h-9 rounded-md border border-border bg-background px-3 text-[13px]"><SelectValue placeholder="全部"/></SelectTrigger><SelectContent><SelectItem value="ALL">全部</SelectItem><SelectItem value="PENDING_ISSUE">待领料</SelectItem><SelectItem value="IN_PRODUCTION">生产中</SelectItem><SelectItem value="COMPLETED">已完成</SelectItem></SelectContent></Select></div>
      <div className="flex items-center gap-1.5"><span className="text-[13px] text-muted-foreground w-[80px] text-right shrink-0">生产编号</span><Input className="w-[140px] h-9 rounded-md border border-border bg-background px-3 text-[13px]" value={s.code} onChange={e=>setS({...s,code:e.target.value})}/></div>
    </div>
    <ErpTools onRefresh={fetch}/>
    <div className="overflow-auto"><ErpTable><ErpThead><ErpTh className="w-10"><Checkbox/></ErpTh><ErpTh>审批状态</ErpTh><ErpTh>业务状态</ErpTh><ErpTh>生产编号</ErpTh><ErpTh>生产名称</ErpTh><ErpTh>物料</ErpTh><ErpTh>生产部门</ErpTh><ErpTh>数量</ErpTh><ErpTh>开始日期</ErpTh><ErpTh>结束日期</ErpTh><ErpTh>创建时间</ErpTh><ErpTh>操作</ErpTh></ErpThead><ErpTbody>
    {items.map(i=>(<><ErpTr key={i.id} className={detailMode&&((i.lines&&i.lines.length>0)||(i.materials&&i.materials.length>0))?'border-b-0':''}><ErpTd><Checkbox/></ErpTd><ErpTd><ErpApproval status={i.approvalStatus}/></ErpTd><ErpTd><span className="text-[12px] text-muted-foreground">{BS[i.businessStatus]||i.businessStatus}{i.lines&&i.lines.length>0?` (${i.lines.length}产品)`:''}{i.materials&&i.materials.length>0?` (${i.materials.length}材料)`:''}</span></ErpTd><ErpTd><ErpLink onClick={()=>router.push(`/production/order/${i.id}/edit`)}>{i.orderNo}</ErpLink></ErpTd><ErpTd>{i.orderName}</ErpTd><ErpTd className="text-muted-foreground">{i.materialName||'-'}</ErpTd><ErpTd className="text-muted-foreground">{i.departmentName||'-'}</ErpTd><ErpTd>{i.quantity||'-'}</ErpTd><ErpTd className="text-muted-foreground">{i.startDate?new Date(i.startDate).toLocaleDateString('zh-CN'):'-'}</ErpTd><ErpTd className="text-muted-foreground">{i.endDate?new Date(i.endDate).toLocaleDateString('zh-CN'):'-'}</ErpTd><ErpTd className="text-muted-foreground">{new Date(i.createdAt).toLocaleDateString('zh-CN')}</ErpTd><ErpTd><ErpAction><ErpActionBtn onClick={()=>router.push(`/production/order/${i.id}/edit`)}><Pencil className="h-3.5 w-3.5"/>修改</ErpActionBtn>{i.approvalStatus==='DRAFT'&&<button onClick={()=>{api.put(`/production-orders/${i.id}/submit`).then(fetch);}} className="text-primary text-[13px] hover:underline">提交</button>}{i.approvalStatus==='SUBMITTED'&&<button onClick={()=>{api.put(`/production-orders/${i.id}/approve`).then(fetch);}} className="text-green-600 text-[13px] hover:underline">通过</button>}{i.approvalStatus==='SUBMITTED'&&<button onClick={()=>{api.put(`/production-orders/${i.id}/withdraw`).then(fetch);}} className="text-orange-500 text-[13px] hover:underline">撤回</button>}{i.approvalStatus==='APPROVED'&&['PENDING_ISSUE','ISSUING'].includes(i.businessStatus)&&<button onClick={()=>{if(window.confirm('确定下推领料单？将从材料明细生成领料单。')){api.post(`/production-orders/${i.id}/generate-issue`).then(()=>{fetch();toast('领料单已生成','success');}).catch((e:any)=>toast(e.response?.data?.message||'下推失败','error'));}}} className="text-blue-600 text-[13px] hover:underline">下推领料</button>}{i.approvalStatus==='APPROVED'&&['IN_PRODUCTION'].includes(i.businessStatus)&&<button onClick={()=>{if(window.confirm('确定下推完工报告？将从产品明细生成完工报告。')){api.post(`/production-orders/${i.id}/generate-complete-report`).then(()=>{fetch();toast('完工报告已生成','success');}).catch((e:any)=>toast(e.response?.data?.message||'下推失败','error'));}}} className="text-purple-600 text-[13px] hover:underline">下推完工</button>}<ErpActionBtn danger onClick={()=>setDel(i.id)}><Trash2 className="h-3.5 w-3.5"/>删除</ErpActionBtn></ErpAction></ErpTd></ErpTr>
    {detailMode&&i.lines&&i.lines.map(l=>(<ErpTr key={'pl'+l.id||l.lineNo} className="bg-[#f0fff0]"><ErpTd/><ErpTd/><ErpTd className="text-[12px] text-muted-foreground">产品 行{l.lineNo}</ErpTd><ErpTd className="text-[12px]">{l.materialCode||'-'}</ErpTd><ErpTd className="text-[12px]">{l.materialName||'-'}</ErpTd><ErpTd className="text-[12px] text-muted-foreground">{l.spec||'-'}</ErpTd><ErpTd/><ErpTd className="text-[12px]">{l.plannedQty?Number(l.plannedQty).toLocaleString():'-'}{l.unit?` ${l.unit}`:''}</ErpTd><ErpTd/><ErpTd/><ErpTd/><ErpTd/></ErpTr>))}
    {detailMode&&i.materials&&i.materials.map(l=>(<ErpTr key={'pm'+l.id||l.lineNo} className="bg-[#f0f0ff]"><ErpTd/><ErpTd/><ErpTd className="text-[12px] text-muted-foreground">材料 行{l.lineNo}</ErpTd><ErpTd className="text-[12px]">{l.materialCode||'-'}</ErpTd><ErpTd className="text-[12px]">{l.materialName||'-'}</ErpTd><ErpTd className="text-[12px] text-muted-foreground">{l.spec||'-'}</ErpTd><ErpTd/><ErpTd className="text-[12px]">{l.quantity?Number(l.quantity).toLocaleString():'-'}{l.unit?` ${l.unit}`:''}</ErpTd><ErpTd/><ErpTd/><ErpTd/><ErpTd/></ErpTr>))}
    </>))}
    {items.length===0 && <ErpEmpty colSpan={12}/>}
    </ErpTbody></ErpTable></div>
    <ErpPagination page={pg} pageSize={ps} total={total} onPage={setPg} onPageSize={v=>setPs(+v)}/>
    <AlertDialog open={!!del} onOpenChange={()=>setDel(null)}><AlertDialogContent><AlertDialogHeader><AlertDialogTitle>确认删除？</AlertDialogTitle></AlertDialogHeader><AlertDialogFooter><AlertDialogCancel>取消</AlertDialogCancel><AlertDialogAction onClick={doDel} className="bg-[#f56c6c] text-white hover:bg-[#f56c6c]/90">删除</AlertDialogAction></AlertDialogFooter></AlertDialogContent></AlertDialog>
  </div></TooltipProvider>);
}
