'use client';
import { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import api from '@/lib/api';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { TooltipProvider } from '@/components/ui/tooltip';
import { Copy, Download, FileSearch, Pencil, RotateCcw, Send, Trash2 } from 'lucide-react';
import { toast } from '@/components/ui/toast';
import { ErpTable, ErpThead, ErpTh, ErpTbody, ErpTr, ErpTd, ErpEmpty, ErpLink, ErpAction, ErpActionBtn, ErpStatus, ErpApproval, ErpPagination, ErpListPage } from '@/components/ui/erp-table';
import { ErpToolbar } from '@/components/ui/erp-toolbar';
import { ErpSearchFields, ErpSearchField } from '@/components/ui/erp-search-fields';

interface Item { id:string;code:string;name:string;productMaterialCode:string|null;productMaterialName:string|null;productSpec:string|null;version:string|null;baseQty:string|null;productUnit:string|null;status:string;approvalStatus:string;createdAt:string; }

export default function BomPage() {
  const router = useRouter();
  const [items,setItems]=useState<Item[]>([]);const [total,setTotal]=useState(0);const [pg,setPg]=useState(1);const [ps,setPs]=useState(30);
  const [sel,setSel]=useState<Set<string>>(new Set());const [s,setS]=useState({approvalStatus:'',code:'',name:'',productCode:'',productName:'',version:'',enabled:''});
  const [del,setDel]=useState<string|null>(null);

  const fetch=useCallback(async()=>{
    const p:any={page:pg,pageSize:ps};
    if(s.approvalStatus)p.status=s.approvalStatus; if(s.code)p.code=s.code; if(s.name)p.name=s.name;
    if(s.productCode)p.productCode=s.productCode; if(s.productName)p.productName=s.productName;
    if(s.version)p.version=s.version; if(s.enabled)p.enabled=s.enabled;
    const {data}=await api.get('/boms',{params:p}); setItems(data.items); setTotal(data.total);
  },[pg,ps,s]); useEffect(()=>{fetch();},[fetch]);

  const doDel=async()=>{if(!del)return;try{await api.delete(`/boms/${del}`);setDel(null);fetch();}catch(e:any){toast(e.response?.data?.message||'删除失败','error');}};
  const doSubmit=async(id:string)=>{try{await api.put(`/boms/${id}/submit`);fetch();toast('已提交','success');}catch(e:any){toast(e.response?.data?.message||'提交失败','error');}};
  const doApprove=async(id:string)=>{try{await api.put(`/boms/${id}/approve`);fetch();toast('已通过','success');}catch(e:any){toast(e.response?.data?.message||'审批失败','error');}};
  const doWithdraw=async(id:string)=>{try{await api.put(`/boms/${id}/withdraw`);fetch();toast('已撤回','success');}catch(e:any){toast(e.response?.data?.message||'撤回失败','error');}};
  const doCopy=async(id:string)=>{try{await api.post(`/boms/${id}/copy`);fetch();toast('复制成功','success');}catch(e:any){toast(e.response?.data?.message||'复制失败','error');}};
  const resetSearch=()=>setS({approvalStatus:'',code:'',name:'',productCode:'',productName:'',version:'',enabled:''});
  const toggleAll=(v:boolean)=>setSel(v?new Set(items.map(i=>i.id)):new Set());
  const toggleOne=(id:string,v:boolean)=>{const n=new Set(sel);v?n.add(id):n.delete(id);setSel(n);};

  const colSpan=14;

  return (<TooltipProvider><ErpListPage>
    <ErpToolbar
      addHref="/production/bom/create"
      editDisabled={sel.size!==1}
      onEdit={()=>{const ids=Array.from(sel);if(ids.length>0)router.push(`/production/bom/${ids[0]}/edit`);}}
      deleteDisabled={sel.size===0}
      onDelete={()=>toast(items.filter(i=>sel.has(i.id)&&i.approvalStatus!=='DRAFT').length>0?'只有草稿状态可删除':'请先勾选数据','info')}
      showExport onExport={()=>{}}
      showImport importItems={[{label:'导入BOM',onClick:()=>{}},{label:'下载模板',onClick:()=>{}}]}
      onReset={resetSearch} onSearch={fetch}
      extraLeft={(
        <>
          <button onClick={()=>{const ids=Array.from(sel);if(ids.length>0)api.put(`/boms/${ids[0]}/submit`).then(fetch).catch((e:any)=>toast(e.response?.data?.message||'','error'));else toast('请先勾选数据','info');}} className="inline-flex items-center gap-1 rounded-md border border-border px-2.5 h-7 text-[13px] font-medium hover:bg-accent"><Send className="h-3 w-3"/>提交</button>
          <button onClick={()=>{const ids=Array.from(sel);if(ids.length>0)api.put(`/boms/${ids[0]}/withdraw`).then(fetch).catch((e:any)=>toast(e.response?.data?.message||'','error'));else toast('请先勾选数据','info');}} className="inline-flex items-center gap-1 rounded-md border border-border px-2.5 h-7 text-[13px] font-medium hover:bg-accent"><RotateCcw className="h-3 w-3"/>撤回</button>
          <button onClick={()=>{const ids=Array.from(sel);if(ids.length>0)router.push(`/production/bom/${ids[0]}/edit`);else toast('请先勾选数据','info');}} className="inline-flex items-center gap-1 rounded-md border border-border px-2.5 h-7 text-[13px] font-medium hover:bg-accent"><FileSearch className="h-3 w-3"/>流程查看</button>
        </>
      )}
    />

    <ErpSearchFields>
      <ErpSearchField label="审批状态">
        <Select value={s.approvalStatus} onValueChange={(v:any)=>setS({...s,approvalStatus:v==='ALL'?'':v})}>
          <SelectTrigger className="w-[100px] h-9 rounded-md border border-border bg-background px-3 text-[13px]"><SelectValue placeholder="全部"/></SelectTrigger>
          <SelectContent><SelectItem value="ALL">全部</SelectItem><SelectItem value="DRAFT">草稿</SelectItem><SelectItem value="SUBMITTED">已提交</SelectItem><SelectItem value="APPROVED">已通过</SelectItem><SelectItem value="REJECTED">已拒绝</SelectItem></SelectContent></Select>
      </ErpSearchField>
      <ErpSearchField label="BOM编码"><Input className="w-[140px] h-9 rounded-md border border-border bg-background px-3 text-[13px]" value={s.code} onChange={e=>setS({...s,code:e.target.value})}/></ErpSearchField>
      <ErpSearchField label="BOM名称"><Input className="w-[140px] h-9 rounded-md border border-border bg-background px-3 text-[13px]" value={s.name} onChange={e=>setS({...s,name:e.target.value})}/></ErpSearchField>
      <ErpSearchField label="成品编码"><Input className="w-[140px] h-9 rounded-md border border-border bg-background px-3 text-[13px]" value={s.productCode} onChange={e=>setS({...s,productCode:e.target.value})}/></ErpSearchField>
      <ErpSearchField label="成品名称"><Input className="w-[140px] h-9 rounded-md border border-border bg-background px-3 text-[13px]" value={s.productName} onChange={e=>setS({...s,productName:e.target.value})}/></ErpSearchField>
      <ErpSearchField label="版本"><Input className="w-[80px] h-9 rounded-md border border-border bg-background px-3 text-[13px]" value={s.version} onChange={e=>setS({...s,version:e.target.value})}/></ErpSearchField>
      <ErpSearchField label="启用">
        <Select value={s.enabled} onValueChange={(v:any)=>setS({...s,enabled:v==='ALL'?'':v})}>
          <SelectTrigger className="w-[100px] h-9 rounded-md border border-border bg-background px-3 text-[13px]"><SelectValue placeholder="全部"/></SelectTrigger>
          <SelectContent><SelectItem value="ALL">全部</SelectItem><SelectItem value="ACTIVE">启用</SelectItem><SelectItem value="INACTIVE">停用</SelectItem></SelectContent></Select>
      </ErpSearchField>
    </ErpSearchFields>

    <div className="min-h-0"><ErpTable><ErpThead>
      <ErpTh className="w-[48px]"><Checkbox checked={items.length>0&&sel.size===items.length} onCheckedChange={(v:boolean)=>toggleAll(v)}/></ErpTh>
      <ErpTh className="w-[64px]">序号</ErpTh>
      <ErpTh className="w-[100px]">审批状态</ErpTh><ErpTh className="w-[160px]">BOM编码</ErpTh><ErpTh className="w-[220px]">BOM名称</ErpTh>
      <ErpTh className="w-[160px]">成品物料编码</ErpTh><ErpTh className="w-[180px]">成品物料名称</ErpTh>
      <ErpTh className="w-[130px]">规格型号</ErpTh><ErpTh className="w-[80px]">版本</ErpTh><ErpTh className="w-[90px]">基准数量</ErpTh>
      <ErpTh className="w-[80px]">单位</ErpTh><ErpTh className="w-[70px]">启用</ErpTh><ErpTh className="w-[160px]">创建时间</ErpTh><ErpTh className="w-[200px] sticky right-0 bg-[#f5f7fa] z-10">操作</ErpTh>
    </ErpThead><ErpTbody>
    {items.map((i,idx)=>(<ErpTr key={i.id}>
      <ErpTd><Checkbox checked={sel.has(i.id)} onCheckedChange={(v:boolean)=>toggleOne(i.id,v)}/></ErpTd>
      <ErpTd className="text-[#909399]">{(pg-1)*ps+idx+1}</ErpTd>
      <ErpTd><ErpApproval status={i.approvalStatus}/></ErpTd>
      <ErpTd><ErpLink onClick={()=>router.push(`/production/bom/${i.id}/edit`)}>{i.code}</ErpLink></ErpTd>
      <ErpTd>{i.name}</ErpTd>
      <ErpTd className="text-[#909399]">{i.productMaterialCode||'-'}</ErpTd>
      <ErpTd>{i.productMaterialName||'-'}</ErpTd>
      <ErpTd className="text-[#909399]">{i.productSpec||'-'}</ErpTd>
      <ErpTd className="text-[#909399]">{i.version||'-'}</ErpTd>
      <ErpTd>{i.baseQty||'1'}</ErpTd>
      <ErpTd className="text-[#909399]">{i.productUnit||'-'}</ErpTd>
      <ErpTd><ErpStatus active={i.status==='ACTIVE'}/></ErpTd>
      <ErpTd className="text-[#909399]">{new Date(i.createdAt).toLocaleDateString('zh-CN')}</ErpTd>
      <ErpTd className="sticky right-0 bg-white z-10">
        <ErpAction>
          <ErpActionBtn onClick={()=>router.push(`/production/bom/${i.id}/edit`)}><Pencil className="h-3.5 w-3.5"/>修改</ErpActionBtn>
          {i.approvalStatus==='DRAFT'&&<ErpActionBtn onClick={()=>doSubmit(i.id)}><Send className="h-3.5 w-3.5"/>提交</ErpActionBtn>}
          {i.approvalStatus==='SUBMITTED'&&<><ErpActionBtn onClick={()=>doApprove(i.id)}>通过</ErpActionBtn><ErpActionBtn onClick={()=>doWithdraw(i.id)}><RotateCcw className="h-3.5 w-3.5"/>撤回</ErpActionBtn></>}
          <ErpActionBtn onClick={()=>doCopy(i.id)}><Copy className="h-3.5 w-3.5"/>复制</ErpActionBtn>
          <ErpActionBtn danger onClick={()=>setDel(i.id)}><Trash2 className="h-3.5 w-3.5"/>删除</ErpActionBtn>
        </ErpAction>
      </ErpTd>
    </ErpTr>))}
    {items.length===0 && <ErpEmpty colSpan={colSpan}/>}
    </ErpTbody></ErpTable></div>

    <ErpPagination page={pg} pageSize={ps} total={total} onPage={setPg} onPageSize={v=>setPs(+v)}/>

    <AlertDialog open={!!del} onOpenChange={()=>setDel(null)}><AlertDialogContent><AlertDialogHeader><AlertDialogTitle>确认删除？</AlertDialogTitle></AlertDialogHeader><AlertDialogFooter><AlertDialogCancel>取消</AlertDialogCancel><AlertDialogAction onClick={doDel} className="bg-[#f56c6c] text-white hover:bg-[#f56c6c]/90">删除</AlertDialogAction></AlertDialogFooter></AlertDialogContent></AlertDialog>
  </ErpListPage></TooltipProvider>);
}
