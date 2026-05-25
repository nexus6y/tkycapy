'use client';
import { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import api from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { ChevronDown, Pencil, RefreshCw, Search, Settings, Trash2 } from 'lucide-react';

interface Category { id:string;code:string;name:string;parentId:string|null;parentCode:string;parentName:string;sortOrder:number;status:string;createdAt:string; }

export default function MaterialCategoryPage() {
  const router=useRouter();
  const [items,setItems]=useState<Category[]>([]); const [total,setTotal]=useState(0); const [page,setPage]=useState(1); const [pageSize,setPageSize]=useState(30);
  const [selected,setSelected]=useState<Set<string>>(new Set());
  const [s,setS]=useState({code:'',name:'',status:''});
  const [delId,setDelId]=useState<string|null>(null);
  const [advanced,setAdvanced]=useState(false);

  const fetch=useCallback(async()=>{
    const p:any={page,pageSize}; if(s.code)p.code=s.code; if(s.name)p.name=s.name; if(s.status)p.status=s.status;
    const {data}=await api.get('/material-categories',{params:p}); setItems(data.items); setTotal(data.total);
  },[page,pageSize,s]);
  useEffect(()=>{fetch();},[fetch]);

  const del=async()=>{if(!delId)return;await api.delete(`/material-categories/${delId}`);setDelId(null);fetch();};
  const toggleAll=(v:boolean)=>setSelected(v?new Set(items.map(i=>i.id)):new Set());
  const toggleOne=(id:string,v:boolean)=>{const n=new Set(selected);v?n.add(id):n.delete(id);setSelected(n);};
  const totalPages=Math.ceil(total/pageSize);
  const pages=Array.from({length:totalPages},(_,i)=>i+1).filter(p=>p===1||p===totalPages||Math.abs(p-page)<=2);

  return (
    <TooltipProvider>
    <div className="h-full flex flex-col bg-white">
      <div className="flex items-center justify-between px-4 py-2 border-b border-gray-100">
        <div className="flex items-center gap-1">
          <Button size="sm" onClick={()=>router.push('/material-category/create')}><span className="mr-1">+</span>新增</Button>
          <Button size="sm" variant="outline" disabled={selected.size===0}>修改</Button>
          <Button size="sm" variant="outline" disabled={selected.size===0}>删除</Button>
        </div>
        <div className="flex items-center gap-1">
          <Button size="sm" variant="ghost" onClick={()=>setS({code:'',name:'',status:''})}>重置</Button>
          <Button size="sm" onClick={fetch}><Search size={14} className="mr-1"/>搜索</Button>
          <Button size="sm" variant="ghost" onClick={()=>setAdvanced(!advanced)}>{advanced?'收起':'展开'}</Button>
        </div>
      </div>
      <div className="flex items-center gap-3 px-4 py-2.5 bg-gray-50/50 border-b border-gray-100 flex-wrap">
        <div className="flex items-center gap-1.5"><span className="text-[12px] text-gray-500">状态</span>
          <Select value={s.status} onValueChange={v=>setS({...s,status:v==='ALL'?'':v})}>
            <SelectTrigger className="w-[100px] h-8 text-[12px]"><SelectValue placeholder="全部"/></SelectTrigger>
            <SelectContent><SelectItem value="ALL">全部</SelectItem><SelectItem value="ACTIVE">启用</SelectItem><SelectItem value="INACTIVE">停用</SelectItem></SelectContent></Select>
        </div>
        <div className="flex items-center gap-1.5"><span className="text-[12px] text-gray-500">分类编码</span><Input className="w-[140px] h-8 text-[12px]" value={s.code} onChange={e=>setS({...s,code:e.target.value})} placeholder="编码"/></div>
        <div className="flex items-center gap-1.5"><span className="text-[12px] text-gray-500">分类名称</span><Input className="w-[140px] h-8 text-[12px]" value={s.name} onChange={e=>setS({...s,name:e.target.value})} placeholder="名称"/></div>
      </div>
      <div className="flex-1 overflow-auto">
        <div className="flex items-center justify-end px-4 py-1.5 bg-gray-50/30 border-b border-gray-100 gap-1">
          <Tooltip><TooltipTrigger asChild><button className="p-1.5 hover:bg-gray-100 rounded text-gray-400 hover:text-gray-600"><RefreshCw size={14}/></button></TooltipTrigger><TooltipContent>刷新</TooltipContent></Tooltip>
          <Tooltip><TooltipTrigger asChild><button className="p-1.5 hover:bg-gray-100 rounded text-gray-400 hover:text-gray-600"><Settings size={14}/></button></TooltipTrigger><TooltipContent>列设置</TooltipContent></Tooltip>
        </div>
        <table className="erp-table">
          <thead className="bg-gray-50 border-y border-gray-200 sticky top-0">
            <tr>
              <th className="w-10 px-3 py-2.5"><Checkbox checked={items.length>0&&selected.size===items.length} onCheckedChange={(v:boolean)=>toggleAll(v)}/></th>
              <th className="text-left px-2 py-2.5 font-medium text-gray-600">状态</th>
              <th className="text-left px-2 py-2.5 font-medium text-gray-600">分类编码</th>
              <th className="text-left px-2 py-2.5 font-medium text-gray-600">分类名称</th>
              <th className="text-left px-2 py-2.5 font-medium text-gray-600">上级分类编码</th>
              <th className="text-left px-2 py-2.5 font-medium text-gray-600">上级分类名称</th>
              <th className="text-left px-2 py-2.5 font-medium text-gray-600">排序</th>
              <th className="text-left px-2 py-2.5 font-medium text-gray-600">创建时间</th>
              <th className="text-left px-2 py-2.5 font-medium text-gray-600">操作</th>
            </tr>
          </thead>
          <tbody>
            {items.map(item=>(
              <tr key={item.id} className="border-b border-gray-100 hover:bg-blue-50/30 transition-colors">
                <td className="px-3 py-2.5"><Checkbox checked={selected.has(item.id)} onCheckedChange={(v:boolean)=>toggleOne(item.id,v)}/></td>
                <td className="px-2 py-2.5"><span className="inline-flex items-center gap-1"><span className={`w-1.5 h-1.5 rounded-full ${item.status==='ACTIVE'?'bg-green-500':'bg-gray-400'}`}/><span className="text-gray-700">{item.status==='ACTIVE'?'启用':'停用'}</span></span></td>
                <td className="px-2 py-2.5"><button className="text-blue-600 hover:text-blue-800 hover:underline text-[13px]">{item.code}</button></td>
                <td className="px-2 py-2.5 text-gray-700">{item.name}</td>
                <td className="px-2 py-2.5 text-gray-500">{item.parentCode||'-'}</td>
                <td className="px-2 py-2.5 text-gray-500">{item.parentName||'-'}</td>
                <td className="px-2 py-2.5 text-gray-700">{item.sortOrder}</td>
                <td className="px-2 py-2.5 text-gray-500 text-[12px]">{new Date(item.createdAt).toLocaleDateString('zh-CN')}</td>
                <td className="px-2 py-2.5">
                  <div className="flex items-center gap-3">
                    <button onClick={()=>router.push('/material-category/'+item.id+'/edit')} className="text-blue-600 hover:text-blue-800 text-[12px] inline-flex items-center gap-0.5"><Pencil size={12}/>修改</button>
                    <button onClick={()=>setDelId(item.id)} className="text-red-500 hover:text-red-700 text-[12px] inline-flex items-center gap-0.5"><Trash2 size={12}/>删除</button>
                  </div>
                </td>
              </tr>
            ))}
            {items.length===0&&<tr><td colSpan={9} className="text-center text-gray-400 py-16">暂无数据</td></tr>}
          </tbody>
        </table>
      </div>
      <div className="flex items-center justify-between px-4 py-2.5 border-t border-gray-200 bg-white shrink-0">
        <span className="text-[12px] text-gray-500">共 {total} 条</span>
        <div className="flex items-center gap-3">
          <Select value={String(pageSize)} onValueChange={v=>{setPageSize(+v);setPage(1);}}>
            <SelectTrigger className="w-[100px] h-8 text-[12px]"><SelectValue/></SelectTrigger>
            <SelectContent>{[20,30,50,100].map(n=><SelectItem key={n} value={String(n)}>{n}条/页</SelectItem>)}</SelectContent>
          </Select>
          <div className="flex items-center gap-0.5">
            <Button size="sm" variant="ghost" disabled={page<=1} onClick={()=>setPage(p=>p-1)} className="text-[12px] px-2">‹</Button>
            {pages.map((p,i)=>(<span key={p}>{i>0&&pages[i-1]!==p-1&&<span className="text-gray-300 mx-0.5">...</span>}<button onClick={()=>setPage(p)} className={`w-7 h-7 rounded text-[12px] transition-colors ${p===page?'bg-blue-600 text-white':'text-gray-600 hover:bg-gray-100'}`}>{p}</button></span>))}
            <Button size="sm" variant="ghost" disabled={page>=totalPages} onClick={()=>setPage(p=>p+1)} className="text-[12px] px-2">›</Button>
          </div>
        </div>
      </div>

      <AlertDialog open={!!delId} onOpenChange={()=>setDelId(null)}>
        <AlertDialogContent><AlertDialogHeader><AlertDialogTitle>确认删除？</AlertDialogTitle></AlertDialogHeader>
        <AlertDialogFooter><AlertDialogCancel>取消</AlertDialogCancel><AlertDialogAction onClick={del} className="bg-red-600 hover:bg-red-700">删除</AlertDialogAction></AlertDialogFooter></AlertDialogContent>
      </AlertDialog>
    </div>
    </TooltipProvider>
  );
}
