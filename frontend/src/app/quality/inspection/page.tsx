'use client';
import { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import api from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { TooltipProvider } from '@/components/ui/tooltip';
import { toast } from '@/components/ui/toast';
import { ChevronDown, Download, Pencil, Plus, Search, Trash2, Upload } from 'lucide-react';
import { ErpTable, ErpThead, ErpTh, ErpTbody, ErpTr, ErpTd, ErpEmpty, ErpLink, ErpAction, ErpActionBtn, ErpTools, ErpApproval, ErpPagination } from '@/components/ui/erp-table';

interface Item { id:string;inspectionNo:string;sourceType:string|null;sourceNo:string|null;materialName:string|null;quantity:string|null;qualifiedQty:string|null;unqualifiedQty:string|null;inspector:string|null;result:string|null;approvalStatus:string;businessStatus:string;createdAt:string; }

export default function InspectionPage() {
  const router = useRouter();
  const [items,setItems]=useState<Item[]>([]);const [total,setTotal]=useState(0);const [pg,setPg]=useState(1);const [ps,setPs]=useState(30);
  const [s,setS]=useState({code:'',status:''});const [del,setDel]=useState<string|null>(null);

  const fetch=useCallback(async()=>{
    const p:any={page:pg,pageSize:ps}; if(s.code)p.code=s.code; if(s.status)p.status=s.status;
    const {data}=await api.get('/inspections',{params:p}); setItems(data.items); setTotal(data.total);
  },[pg,ps,s]); useEffect(()=>{fetch();},[fetch]);
  const doDel=async()=>{if(!del)return;try{await api.delete(`/inspections/${del}`);setDel(null);fetch();}catch(e:any){toast(e.response?.data?.message||'删除失败','error');}};

  return (<TooltipProvider><div className="bg-background rounded-lg border shadow-sm">
    <div className="flex items-center justify-between px-4 h-14 border-b border-border">
      <div className="flex items-center gap-1">
        <Button variant="secondary" size="sm" onClick={()=>router.push('/quality/inspection/create')}><Plus className="h-3.5 w-3.5"/>新增</Button>
        <Button variant="outline" size="sm" onClick={()=>toast('请先勾选数据', 'info')}>修改</Button>
        <Button variant="outline" size="sm" onClick={()=>toast('请先勾选数据', 'info')}>删除</Button>
        <Button variant="outline" size="sm"><Download className="h-3.5 w-3.5 mr-1"/>导出</Button>
      </div>
      <div className="flex items-center gap-1">
        <Button variant="ghost" size="sm" onClick={()=>setS({code:'',status:''})}>重置</Button>
        <Button variant="default" size="sm" onClick={fetch}><Search className="h-3.5 w-3.5 mr-1"/>搜索</Button>
      </div>
    </div>
    <div className="flex items-center gap-4 px-4 py-2.5 border-b border-border bg-muted/30">
      <div className="flex items-center gap-1.5"><span className="text-[13px] text-muted-foreground w-[80px] text-right shrink-0">状态</span><Select value={s.status} onValueChange={(v:any)=>setS({...s,status:v==='ALL'?'':v})}><SelectTrigger className="w-[100px] h-9 rounded-md border border-border bg-background px-3 text-[13px]"><SelectValue placeholder="全部"/></SelectTrigger><SelectContent><SelectItem value="ALL">全部</SelectItem><SelectItem value="DRAFT">草稿</SelectItem><SelectItem value="SUBMITTED">已提交</SelectItem><SelectItem value="APPROVED">已通过</SelectItem></SelectContent></Select></div>
      <div className="flex items-center gap-1.5"><span className="text-[13px] text-muted-foreground w-[80px] text-right shrink-0">质检单号</span><Input className="w-[140px] h-9 rounded-md border border-border bg-background px-3 text-[13px]" value={s.code} onChange={e=>setS({...s,code:e.target.value})}/></div>
    </div>
    <ErpTools onRefresh={fetch}/>
    <div className="min-h-0"><ErpTable><ErpThead><ErpTh className="w-[48px]"><Checkbox/></ErpTh><ErpTh className="w-[100px]">审批状态</ErpTh><ErpTh className="w-[100px]">业务状态</ErpTh><ErpTh className="w-[160px]">质检单号</ErpTh><ErpTh className="w-[100px]">来源类型</ErpTh><ErpTh className="w-[160px]">来源单号</ErpTh><ErpTh className="w-[180px]">物料</ErpTh><ErpTh className="w-[100px]">数量</ErpTh><ErpTh className="w-[100px]">合格数</ErpTh><ErpTh className="w-[100px]">不合格数</ErpTh><ErpTh className="w-[100px]">检验员</ErpTh><ErpTh className="w-[90px]">结果</ErpTh><ErpTh className="w-[160px]">创建时间</ErpTh><ErpTh className="w-[180px] sticky right-0 bg-[#f5f7fa] z-10">操作</ErpTh></ErpThead><ErpTbody>
    {items.map(i=>(<ErpTr key={i.id}><ErpTd><Checkbox/></ErpTd><ErpTd><ErpApproval status={i.approvalStatus}/></ErpTd><ErpTd><span className="text-[12px] text-muted-foreground">{i.businessStatus}</span></ErpTd><ErpTd><ErpLink onClick={()=>router.push(`/quality/inspection/${i.id}/edit`)}>{i.inspectionNo}</ErpLink></ErpTd><ErpTd className="text-muted-foreground">{i.sourceType||'-'}</ErpTd><ErpTd className="text-muted-foreground">{i.sourceNo||'-'}</ErpTd><ErpTd>{i.materialName||'-'}</ErpTd><ErpTd>{i.quantity||'-'}</ErpTd><ErpTd className="text-success">{i.qualifiedQty||'0'}</ErpTd><ErpTd className="text-destructive">{i.unqualifiedQty||'0'}</ErpTd><ErpTd className="text-muted-foreground">{i.inspector||'-'}</ErpTd><ErpTd>{i.result||'-'}</ErpTd><ErpTd className="text-muted-foreground">{new Date(i.createdAt).toLocaleDateString('zh-CN')}</ErpTd><ErpTd className="sticky right-0 bg-white z-10"><ErpAction><ErpActionBtn onClick={()=>router.push(`/quality/inspection/${i.id}/edit`)}><Pencil className="h-3.5 w-3.5"/>修改</ErpActionBtn>{i.approvalStatus==='DRAFT'&&<ErpActionBtn onClick={()=>{api.put(`/inspections/${i.id}/submit`).then(fetch).catch((e:any)=>toast(e.response?.data?.message||'提交失败','error'));}}>提交</ErpActionBtn>}{i.approvalStatus==='SUBMITTED'&&<ErpActionBtn onClick={()=>{api.put(`/inspections/${i.id}/approve`).then(fetch).catch((e:any)=>toast(e.response?.data?.message||'审核失败','error'));}}>审核/生成入库</ErpActionBtn>}<ErpActionBtn danger onClick={()=>setDel(i.id)}><Trash2 className="h-3.5 w-3.5"/>删除</ErpActionBtn></ErpAction></ErpTd></ErpTr>))}
    {items.length===0 && <ErpEmpty colSpan={15}/>}
    </ErpTbody></ErpTable></div>
    <ErpPagination page={pg} pageSize={ps} total={total} onPage={setPg} onPageSize={v=>setPs(+v)}/>
    <AlertDialog open={!!del} onOpenChange={()=>setDel(null)}><AlertDialogContent><AlertDialogHeader><AlertDialogTitle>确认删除？</AlertDialogTitle></AlertDialogHeader><AlertDialogFooter><AlertDialogCancel>取消</AlertDialogCancel><AlertDialogAction onClick={doDel} className="bg-[#f56c6c] text-white hover:bg-[#f56c6c]/90">删除</AlertDialogAction></AlertDialogFooter></AlertDialogContent></AlertDialog>
  </div></TooltipProvider>);
}
