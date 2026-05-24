'use client';
import { useEffect, useState, useCallback } from 'react';
import api from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { ChevronDown, Pencil, RefreshCw, Search, Settings, Trash2, Download, Upload } from 'lucide-react';

interface Customer { id:string;code:string;name:string;industry:string|null;valueLevel:string|null;creditLevel:string|null;contactPerson:string|null;contactPhone:string|null;contactEmail:string|null;address:string|null;status:string;createdAt:string; }

const PAGE_SIZE_OPTS = [20,30,50,100];

export default function CustomerPage() {
  const [items,setItems]=useState<Customer[]>([]); const [total,setTotal]=useState(0);
  const [page,setPage]=useState(1); const [pageSize,setPageSize]=useState(30);
  const [selected,setSelected]=useState<Set<string>>(new Set());
  const [s,setS]=useState({code:'',name:'',status:''});
  const [dialog,setDialog]=useState(false); const [editing,setEditing]=useState<Customer|null>(null);
  const [f,setF]=useState({code:'',name:'',industry:'',valueLevel:'',creditLevel:'',contactPerson:'',contactPhone:'',contactEmail:'',address:'',status:'ACTIVE'});
  const [delId,setDelId]=useState<string|null>(null);

  const fetch=useCallback(async()=>{
    const p:any={page,pageSize}; if(s.code)p.code=s.code; if(s.name)p.name=s.name; if(s.status)p.status=s.status;
    const {data}=await api.get('/customers',{params:p}); setItems(data.items); setTotal(data.total);
  },[page,pageSize,s]);
  useEffect(()=>{fetch();},[fetch]);

  const openAdd=()=>{setEditing(null);setF({code:'',name:'',industry:'',valueLevel:'',creditLevel:'',contactPerson:'',contactPhone:'',contactEmail:'',address:'',status:'ACTIVE'});setDialog(true);};
  const openEdit=(item:Customer)=>{setEditing(item);setF({code:item.code,name:item.name,industry:item.industry||'',valueLevel:item.valueLevel||'',creditLevel:item.creditLevel||'',contactPerson:item.contactPerson||'',contactPhone:item.contactPhone||'',contactEmail:item.contactEmail||'',address:item.address||'',status:item.status});setDialog(true);};
  const save=async()=>{try{if(editing)await api.put(`/customers/${editing.id}`,f);else await api.post('/customers',f);setDialog(false);fetch();}catch(err:any){alert(err.response?.data?.message||'保存失败');}};
  const del=async()=>{if(!delId)return;await api.delete(`/customers/${delId}`);setDelId(null);fetch();};
  const toggleAll=(v:boolean)=>setSelected(v?new Set(items.map(i=>i.id)):new Set());
  const toggleOne=(id:string,v:boolean)=>{const n=new Set(selected);v?n.add(id):n.delete(id);setSelected(n);};
  const totalPages=Math.ceil(total/pageSize);
  const pages=Array.from({length:totalPages},(_,i)=>i+1).filter(p=>p===1||p===totalPages||Math.abs(p-page)<=2);

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
        <Select value={s.status} onValueChange={v=>setS({...s,status:v==='ALL'?'':v})}><SelectTrigger className="w-[100px] h-8 text-[12px]"><SelectValue placeholder="全部"/></SelectTrigger><SelectContent><SelectItem value="ALL">全部</SelectItem><SelectItem value="ACTIVE">启用</SelectItem><SelectItem value="INACTIVE">停用</SelectItem></SelectContent></Select>
      </div>
      <div className="flex items-center gap-1.5"><span className="text-[12px] text-gray-500">客户编码</span><Input className="w-[140px] h-8 text-[12px]" value={s.code} onChange={e=>setS({...s,code:e.target.value})} placeholder="编码"/></div>
      <div className="flex items-center gap-1.5"><span className="text-[12px] text-gray-500">客户名称</span><Input className="w-[140px] h-8 text-[12px]" value={s.name} onChange={e=>setS({...s,name:e.target.value})} placeholder="名称"/></div>
    </div>
    <div className="flex-1 overflow-auto">
      <div className="flex items-center justify-end px-4 py-1.5 bg-gray-50/30 border-b border-gray-100 gap-1">
        <Tooltip><TooltipTrigger asChild><button className="p-1.5 hover:bg-gray-100 rounded text-gray-400 hover:text-gray-600"><RefreshCw size={14}/></button></TooltipTrigger><TooltipContent>刷新</TooltipContent></Tooltip>
        <Tooltip><TooltipTrigger asChild><button className="p-1.5 hover:bg-gray-100 rounded text-gray-400 hover:text-gray-600"><Settings size={14}/></button></TooltipTrigger><TooltipContent>列设置</TooltipContent></Tooltip>
      </div>
      <table className="w-full text-[13px]"><thead className="bg-gray-50 border-y border-gray-200 sticky top-0"><tr>
        <th className="w-10 px-3 py-2.5"><Checkbox checked={items.length>0&&selected.size===items.length} onCheckedChange={(v:boolean)=>toggleAll(v)}/></th>
        <th className="text-left px-2 py-2.5 font-medium text-gray-600">状态</th>
        <th className="text-left px-2 py-2.5 font-medium text-gray-600">客户编码</th>
        <th className="text-left px-2 py-2.5 font-medium text-gray-600">客户名称</th>
        <th className="text-left px-2 py-2.5 font-medium text-gray-600">所属行业</th>
        <th className="text-left px-2 py-2.5 font-medium text-gray-600">客户价值</th>
        <th className="text-left px-2 py-2.5 font-medium text-gray-600">信用等级</th>
        <th className="text-left px-2 py-2.5 font-medium text-gray-600">联系人</th>
        <th className="text-left px-2 py-2.5 font-medium text-gray-600">联系电话</th>
        <th className="text-left px-2 py-2.5 font-medium text-gray-600">创建时间</th>
        <th className="text-left px-2 py-2.5 font-medium text-gray-600">操作</th>
      </tr></thead><tbody>
        {items.map(item=>(<tr key={item.id} className="border-b border-gray-100 hover:bg-blue-50/30 transition-colors">
          <td className="px-3 py-2.5"><Checkbox checked={selected.has(item.id)} onCheckedChange={(v:boolean)=>toggleOne(item.id,v)}/></td>
          <td className="px-2 py-2.5"><span className="inline-flex items-center gap-1"><span className={`w-1.5 h-1.5 rounded-full ${item.status==='ACTIVE'?'bg-green-500':'bg-gray-400'}`}/><span className="text-gray-700">{item.status==='ACTIVE'?'启用':'停用'}</span></span></td>
          <td className="px-2 py-2.5"><button className="text-blue-600 hover:text-blue-800 hover:underline text-[13px]">{item.code}</button></td>
          <td className="px-2 py-2.5 text-gray-700">{item.name}</td>
          <td className="px-2 py-2.5 text-gray-500">{item.industry||'-'}</td>
          <td className="px-2 py-2.5 text-gray-700">{item.valueLevel||'-'}</td>
          <td className="px-2 py-2.5 text-gray-700">{item.creditLevel||'-'}</td>
          <td className="px-2 py-2.5 text-gray-700">{item.contactPerson||'-'}</td>
          <td className="px-2 py-2.5 text-gray-700">{item.contactPhone||'-'}</td>
          <td className="px-2 py-2.5 text-gray-500 text-[12px]">{new Date(item.createdAt).toLocaleDateString('zh-CN')}</td>
          <td className="px-2 py-2.5"><div className="flex items-center gap-3">
            <button onClick={()=>openEdit(item)} className="text-blue-600 hover:text-blue-800 text-[12px] inline-flex items-center gap-0.5"><Pencil size={12}/>修改</button>
            <button onClick={()=>setDelId(item.id)} className="text-red-500 hover:text-red-700 text-[12px] inline-flex items-center gap-0.5"><Trash2 size={12}/>删除</button>
          </div></td>
        </tr>))}
        {items.length===0&&<tr><td colSpan={11} className="text-center text-gray-400 py-16">暂无数据</td></tr>}
      </tbody></table>
    </div>
    <div className="flex items-center justify-between px-4 py-2.5 border-t border-gray-200 bg-white shrink-0">
      <span className="text-[12px] text-gray-500">共 {total} 条</span>
      <div className="flex items-center gap-3">
        <Select value={String(pageSize)} onValueChange={v=>{setPageSize(+v);setPage(1);}}><SelectTrigger className="w-[100px] h-8 text-[12px]"><SelectValue/></SelectTrigger><SelectContent>{PAGE_SIZE_OPTS.map(n=><SelectItem key={n} value={String(n)}>{n}条/页</SelectItem>)}</SelectContent></Select>
        <div className="flex items-center gap-0.5">
          <Button size="sm" variant="ghost" disabled={page<=1} onClick={()=>setPage(p=>p-1)} className="text-[12px] px-2">‹</Button>
          {pages.map((p,i)=>(<span key={p}>{i>0&&pages[i-1]!==p-1&&<span className="text-gray-300 mx-0.5">...</span>}<button onClick={()=>setPage(p)} className={`w-7 h-7 rounded text-[12px] transition-colors ${p===page?'bg-blue-600 text-white':'text-gray-600 hover:bg-gray-100'}`}>{p}</button></span>))}
          <Button size="sm" variant="ghost" disabled={page>=totalPages} onClick={()=>setPage(p=>p+1)} className="text-[12px] px-2">›</Button>
        </div>
      </div>
    </div>

    <Dialog open={dialog} onOpenChange={setDialog}><DialogContent className="max-w-lg"><DialogHeader><DialogTitle>{editing?'修改客户':'新增客户'}</DialogTitle></DialogHeader>
    <div className="space-y-3 max-h-[60vh] overflow-y-auto py-2"><div className="grid grid-cols-2 gap-3">
      <div><label className="text-[12px] font-medium">客户编码 *</label><Input className="h-8 text-[13px]" value={f.code} onChange={e=>setF({...f,code:e.target.value})} disabled={!!editing}/></div>
      <div><label className="text-[12px] font-medium">客户名称 *</label><Input className="h-8 text-[13px]" value={f.name} onChange={e=>setF({...f,name:e.target.value})}/></div>
      <div><label className="text-[12px] font-medium">所属行业</label><Input className="h-8 text-[13px]" value={f.industry} onChange={e=>setF({...f,industry:e.target.value})}/></div>
      <div><label className="text-[12px] font-medium">客户价值</label><Input className="h-8 text-[13px]" value={f.valueLevel} onChange={e=>setF({...f,valueLevel:e.target.value})}/></div>
      <div><label className="text-[12px] font-medium">信用等级</label><Input className="h-8 text-[13px]" value={f.creditLevel} onChange={e=>setF({...f,creditLevel:e.target.value})}/></div>
      <div><label className="text-[12px] font-medium">状态</label><Select value={f.status} onValueChange={v=>setF({...f,status:v})}><SelectTrigger className="h-8 text-[13px]"><SelectValue/></SelectTrigger><SelectContent><SelectItem value="ACTIVE">启用</SelectItem><SelectItem value="INACTIVE">停用</SelectItem></SelectContent></Select></div>
      <div><label className="text-[12px] font-medium">联系人</label><Input className="h-8 text-[13px]" value={f.contactPerson} onChange={e=>setF({...f,contactPerson:e.target.value})}/></div>
      <div><label className="text-[12px] font-medium">联系电话</label><Input className="h-8 text-[13px]" value={f.contactPhone} onChange={e=>setF({...f,contactPhone:e.target.value})}/></div>
      <div><label className="text-[12px] font-medium">邮箱</label><Input className="h-8 text-[13px]" value={f.contactEmail} onChange={e=>setF({...f,contactEmail:e.target.value})}/></div>
      <div className="col-span-2"><label className="text-[12px] font-medium">地址</label><Input className="h-8 text-[13px]" value={f.address} onChange={e=>setF({...f,address:e.target.value})}/></div>
    </div></div>
    <DialogFooter><Button variant="outline" size="sm" onClick={()=>setDialog(false)}>取消</Button><Button size="sm" onClick={save}>确定</Button></DialogFooter></DialogContent></Dialog>

    <AlertDialog open={!!delId} onOpenChange={()=>setDelId(null)}><AlertDialogContent><AlertDialogHeader><AlertDialogTitle>确认删除？</AlertDialogTitle></AlertDialogHeader><AlertDialogFooter><AlertDialogCancel>取消</AlertDialogCancel><AlertDialogAction onClick={del} className="bg-red-600 hover:bg-red-700">删除</AlertDialogAction></AlertDialogFooter></AlertDialogContent></AlertDialog>
  </div></TooltipProvider>);
}
