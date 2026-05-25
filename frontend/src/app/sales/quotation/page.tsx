'use client';
import { useRouter } from 'next/navigation';
import { useEffect, useState, useCallback } from 'react';
import api from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { ChevronDown, Pencil, RefreshCw, Search, Settings, Trash2, Download, Upload } from 'lucide-react';

interface Quotation { id:string;quotationNo:string;quotationName:string;customerName:string|null;departmentName:string|null;responsibleName:string|null;validUntil:string|null;totalAmount:string|null;approvalStatus:string;createdAt:string; }
const ST:Record<string,string>={DRAFT:'草稿',SUBMITTED:'已提交',APPROVED:'已通过',REJECTED:'已拒绝'};

export default function QuotationPage() {
  const [items,setItems]=useState<Quotation[]>([]); const [total,setTotal]=useState(0); const [page,setPage]=useState(1); const [pageSize,setPageSize]=useState(30);
  const [selected,setSelected]=useState<Set<string>>(new Set()); const [s,setS]=useState({code:'',name:'',status:''});
  const [dialog,setDialog]=useState(false); const [editing,setEditing]=useState<Quotation|null>(null);
  const [f,setF]=useState({quotationNo:'',quotationName:'',customerName:'',departmentName:'',responsibleName:'',validUntil:'',totalAmount:'',remark:''});
  const [delId,setDelId]=useState<string|null>(null);

  const fetch=useCallback(async()=>{
    const p:any={page,pageSize}; if(s.code)p.code=s.code; if(s.name)p.name=s.name; if(s.status)p.status=s.status;
    const {data}=await api.get('/quotations',{params:p}); setItems(data.items); setTotal(data.total);
  },[page,pageSize,s]);
  useEffect(()=>{fetch();},[fetch]);

  const openAdd=()=>{setEditing(null);setF({quotationNo:'',quotationName:'',customerName:'',departmentName:'',responsibleName:'',validUntil:'',totalAmount:'',remark:''});setDialog(true);};
  const openEdit=(item:Quotation)=>{setEditing(item);setF({quotationNo:item.quotationNo,quotationName:item.quotationName,customerName:item.customerName||'',departmentName:item.departmentName||'',responsibleName:item.responsibleName||'',validUntil:item.validUntil?.split('T')[0]||'',totalAmount:item.totalAmount||'',remark:''});setDialog(true);};
  const save=async()=>{try{const d={...f,totalAmount:f.totalAmount?+f.totalAmount:null,validUntil:f.validUntil?new Date(f.validUntil).toISOString():null};if(editing)await api.put(`/quotations/${editing.id}`,d);else await api.post('/quotations',d);setDialog(false);fetch();}catch(err:any){alert(err.response?.data?.message||'保存失败');}};
  const del=async()=>{if(!delId)return;await api.delete(`/quotations/${delId}`);setDelId(null);fetch();};
  const toggleAll=(v:boolean)=>setSelected(v?new Set(items.map(i=>i.id)):new Set());
  const toggleOne=(id:string,v:boolean)=>{const n=new Set(selected);v?n.add(id):n.delete(id);setSelected(n);};
  const totalPages=Math.ceil(total/pageSize); const pages=Array.from({length:totalPages},(_,i)=>i+1).filter(p=>p===1||p===totalPages||Math.abs(p-page)<=2);

  return (<TooltipProvider><div className="h-full flex flex-col bg-white">
    <div className="flex items-center justify-between px-4 py-2 border-b border-gray-100">
      <div className="flex items-center gap-1">
        <Button size="sm" onClick={openAdd}><span className="mr-1">+</span>新增</Button>
        <Button size="sm" variant="outline" disabled={selected.size===0}>修改</Button>
        <Button size="sm" variant="outline" disabled={selected.size===0}>删除</Button>
        <DropdownMenu><DropdownMenuTrigger asChild><Button size="sm" variant="outline">导入 <ChevronDown size={12} className="ml-1"/></Button></DropdownMenuTrigger><DropdownMenuContent><DropdownMenuItem><Upload size={14} className="mr-2"/>导入数据</DropdownMenuItem></DropdownMenuContent></DropdownMenu>
        <Button size="sm" variant="outline"><Download size={14} className="mr-1"/>导出</Button>
      </div>
      <div className="flex items-center gap-1">
        <Button size="sm" variant="ghost" onClick={()=>setS({code:'',name:'',status:''})}>重置</Button>
        <Button size="sm" onClick={fetch}><Search size={14} className="mr-1"/>搜索</Button>
      </div>
    </div>
    <div className="flex items-center gap-3 px-4 py-2.5 bg-gray-50/50 border-b border-gray-100 flex-wrap">
      <div className="flex items-center gap-1.5"><span className="text-[12px] text-gray-500 w-12">状态</span>
        <Select value={s.status} onValueChange={v=>setS({...s,status:v==='ALL'?'':v})}><SelectTrigger className="w-[100px] h-8 text-[12px]"><SelectValue placeholder="全部"/></SelectTrigger><SelectContent><SelectItem value="ALL">全部</SelectItem><SelectItem value="DRAFT">草稿</SelectItem><SelectItem value="SUBMITTED">已提交</SelectItem><SelectItem value="APPROVED">已通过</SelectItem></SelectContent></Select>
      </div>
      <div className="flex items-center gap-1.5"><span className="text-[12px] text-gray-500">报价单号</span><Input className="w-[140px] h-8 text-[12px]" value={s.code} onChange={e=>setS({...s,code:e.target.value})}/></div>
      <div className="flex items-center gap-1.5"><span className="text-[12px] text-gray-500">报价名称</span><Input className="w-[140px] h-8 text-[12px]" value={s.name} onChange={e=>setS({...s,name:e.target.value})}/></div>
    </div>
    <div className="flex-1 overflow-auto">
      <div className="flex items-center justify-end px-4 py-1.5 bg-gray-50/30 border-b border-gray-100 gap-1">
        <Tooltip><TooltipTrigger asChild><button className="p-1.5 hover:bg-gray-100 rounded text-gray-400 hover:text-gray-600"><RefreshCw size={14}/></button></TooltipTrigger><TooltipContent>刷新</TooltipContent></Tooltip>
        <Tooltip><TooltipTrigger asChild><button className="p-1.5 hover:bg-gray-100 rounded text-gray-400 hover:text-gray-600"><Settings size={14}/></button></TooltipTrigger><TooltipContent>列设置</TooltipContent></Tooltip>
      </div>
      <table className="w-full text-[13px]"><thead className="bg-gray-50 border-y border-gray-200 sticky top-0"><tr>
        <th className="w-10 px-3 py-2.5"><Checkbox checked={items.length>0&&selected.size===items.length} onCheckedChange={(v:boolean)=>toggleAll(v)}/></th>
        <th className="text-left px-2 py-2.5 font-medium text-gray-600">审批状态</th><th className="text-left px-2 py-2.5 font-medium text-gray-600">报价单号</th><th className="text-left px-2 py-2.5 font-medium text-gray-600">报价名称</th><th className="text-left px-2 py-2.5 font-medium text-gray-600">客户</th><th className="text-left px-2 py-2.5 font-medium text-gray-600">报价部门</th><th className="text-left px-2 py-2.5 font-medium text-gray-600">负责人</th><th className="text-left px-2 py-2.5 font-medium text-gray-600">有效期至</th><th className="text-left px-2 py-2.5 font-medium text-gray-600">金额</th><th className="text-left px-2 py-2.5 font-medium text-gray-600">创建时间</th><th className="text-left px-2 py-2.5 font-medium text-gray-600">操作</th>
      </tr></thead><tbody>
        {items.map(item=>(<tr key={item.id} className="border-b border-gray-100 hover:bg-blue-50/30 transition-colors">
          <td className="px-3 py-2.5"><Checkbox checked={selected.has(item.id)} onCheckedChange={(v:boolean)=>toggleOne(item.id,v)}/></td>
          <td className="px-2 py-2.5"><span className={`inline-flex px-1.5 py-0.5 rounded text-[11px] ${item.approvalStatus==='APPROVED'?'bg-green-50 text-green-700':item.approvalStatus==='SUBMITTED'?'bg-blue-50 text-blue-700':'bg-gray-50 text-gray-500'}`}>{ST[item.approvalStatus]}</span></td>
          <td className="px-2 py-2.5"><button className="text-blue-600 hover:text-blue-800 hover:underline text-[13px]">{item.quotationNo}</button></td>
          <td className="px-2 py-2.5 text-gray-700">{item.quotationName}</td><td className="px-2 py-2.5 text-gray-500">{item.customerName||'-'}</td>
          <td className="px-2 py-2.5 text-gray-700">{item.departmentName||'-'}</td><td className="px-2 py-2.5 text-gray-700">{item.responsibleName||'-'}</td>
          <td className="px-2 py-2.5 text-gray-500 text-[12px]">{item.validUntil?new Date(item.validUntil).toLocaleDateString('zh-CN'):'-'}</td>
          <td className="px-2 py-2.5 text-gray-700">{item.totalAmount?Number(item.totalAmount).toLocaleString():'-'}</td>
          <td className="px-2 py-2.5 text-gray-500 text-[12px]">{new Date(item.createdAt).toLocaleDateString('zh-CN')}</td>
          <td className="px-2 py-2.5"><div className="flex items-center gap-3">
            <button onClick={()=>openEdit(item)} className="text-blue-600 hover:text-blue-800 text-[12px] inline-flex items-center gap-0.5"><Pencil size={12}/>修改</button>
            {item.approvalStatus==='DRAFT'&&<button onClick={()=>{api.put(`/quotations/${item.id}/submit`).then(fetch);}} className="text-blue-600 text-[12px]">提交</button>}
            <button onClick={()=>setDelId(item.id)} className="text-red-500 hover:text-red-700 text-[12px] inline-flex items-center gap-0.5"><Trash2 size={12}/>删除</button>
          </div></td>
        </tr>))}
        {items.length===0&&<tr><td colSpan={11} className="text-center text-gray-400 py-16">暂无数据</td></tr>}
      </tbody></table>
    </div>
    <div className="flex items-center justify-between px-4 py-2.5 border-t border-gray-200 bg-white shrink-0">
      <span className="text-[12px] text-gray-500">共 {total} 条</span>
      <div className="flex items-center gap-3">
        <Select value={String(pageSize)} onValueChange={v=>{setPageSize(+v);setPage(1);}}><SelectTrigger className="w-[100px] h-8 text-[12px]"><SelectValue/></SelectTrigger><SelectContent>{[20,30,50,100].map(n=><SelectItem key={n} value={String(n)}>{n}条/页</SelectItem>)}</SelectContent></Select>
        <div className="flex items-center gap-0.5">
          <Button size="sm" variant="ghost" disabled={page<=1} onClick={()=>setPage(p=>p-1)} className="text-[12px] px-2">‹</Button>
          {pages.map((p,i)=>(<span key={p}>{i>0&&pages[i-1]!==p-1&&<span className="text-gray-300 mx-0.5">...</span>}<button onClick={()=>setPage(p)} className={`w-7 h-7 rounded text-[12px] transition-colors ${p===page?'bg-blue-600 text-white':'text-gray-600 hover:bg-gray-100'}`}>{p}</button></span>))}
          <Button size="sm" variant="ghost" disabled={page>=totalPages} onClick={()=>setPage(p=>p+1)} className="text-[12px] px-2">›</Button>
        </div>
      </div>
    </div>

    <Dialog open={dialog} onOpenChange={setDialog}><DialogContent className="max-w-lg"><DialogHeader><DialogTitle>{editing?'修改报价单':'新增报价单'}</DialogTitle></DialogHeader>
    <div className="space-y-3 max-h-[60vh] overflow-y-auto py-2"><div className="grid grid-cols-2 gap-3">
      <div><label className="text-[12px] font-medium">报价单号 *</label><Input className="h-8 text-[13px]" value={f.quotationNo} onChange={e=>setF({...f,quotationNo:e.target.value})} disabled={!!editing}/></div>
      <div><label className="text-[12px] font-medium">报价名称 *</label><Input className="h-8 text-[13px]" value={f.quotationName} onChange={e=>setF({...f,quotationName:e.target.value})}/></div>
      <div><label className="text-[12px] font-medium">客户名称</label><Input className="h-8 text-[13px]" value={f.customerName} onChange={e=>setF({...f,customerName:e.target.value})}/></div>
      <div><label className="text-[12px] font-medium">报价部门</label><Input className="h-8 text-[13px]" value={f.departmentName} onChange={e=>setF({...f,departmentName:e.target.value})}/></div>
      <div><label className="text-[12px] font-medium">负责人</label><Input className="h-8 text-[13px]" value={f.responsibleName} onChange={e=>setF({...f,responsibleName:e.target.value})}/></div>
      <div><label className="text-[12px] font-medium">截止日期</label><Input type="date" className="h-8 text-[13px]" value={f.validUntil} onChange={e=>setF({...f,validUntil:e.target.value})}/></div>
      <div><label className="text-[12px] font-medium">金额</label><Input type="number" className="h-8 text-[13px]" value={f.totalAmount} onChange={e=>setF({...f,totalAmount:e.target.value})}/></div>
    </div></div>
    <DialogFooter><Button variant="outline" size="sm" onClick={()=>setDialog(false)}>取消</Button><Button size="sm" onClick={save}>确定</Button></DialogFooter></DialogContent></Dialog>

    <AlertDialog open={!!delId} onOpenChange={()=>setDelId(null)}><AlertDialogContent><AlertDialogHeader><AlertDialogTitle>确认删除？</AlertDialogTitle></AlertDialogHeader><AlertDialogFooter><AlertDialogCancel>取消</AlertDialogCancel><AlertDialogAction onClick={del} className="bg-red-600 hover:bg-red-700">删除</AlertDialogAction></AlertDialogFooter></AlertDialogContent></AlertDialog>
  </div></TooltipProvider>);
}
