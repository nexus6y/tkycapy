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
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { ChevronDown, Download, Pencil, Plus, Search, Trash2, Upload } from 'lucide-react';
import { ErpTable,ErpThead,ErpTh,ErpTbody,ErpTr,ErpTd,ErpEmpty,ErpLink,ErpAction,ErpActionBtn,ErpTools,ErpStatus,ErpPagination } from '@/components/ui/erp-table';

interface Item { id:string;code:string;name:string;industry:string|null;valueLevel:string|null;creditLevel:string|null;contactPerson:string|null;contactPhone:string|null;contactEmail:string|null;address:string|null;status:string;createdAt:string; }

export default function CustomerPage() {
  const router=useRouter();
  const [items,setItems]=useState<Item[]>([]);const [total,setTotal]=useState(0);const [pg,setPg]=useState(1);const [ps,setPs]=useState(30);
  const [selected,setSelected]=useState<Set<string>>(new Set());const [s,setS]=useState({code:'',name:'',status:''});
  const [delId,setDelId]=useState<string|null>(null);

  const fetch=useCallback(async()=>{
    const p:any={page:pg,pageSize:ps}; if(s.code)p.code=s.code; if(s.name)p.name=s.name; if(s.status)p.status=s.status;
    const {data}=await api.get('/customers',{params:p}); setItems(data.items); setTotal(data.total);
  },[pg,ps,s]); useEffect(()=>{fetch();},[fetch]);

  const del=async()=>{if(!delId)return;await api.delete(`/customers/${delId}`);setDelId(null);fetch();};
  const toggleAll=(v:boolean)=>setSelected(v?new Set(items.map(i=>i.id)):new Set());
  const tp=Math.ceil(total/ps);const pgs=Array.from({length:tp},(_,i)=>i+1).filter(p=>p===1||p===tp||Math.abs(p-pg)<=2);

  return (<TooltipProvider><div className="bg-background rounded-lg border shadow-sm">
    <div className="flex items-center justify-between px-4 h-14 border-b border-border">
      <div className="flex items-center gap-1">
        <Button variant="secondary" size="sm" onClick={()=>router.push('/sales/customer/create')}><Plus className="h-3.5 w-3.5"/>新增</Button>
        <Button variant="outline" size="sm" disabled={selected.size===0} onClick={()=>alert('请先勾选数据')}>修改</Button>
        <Button variant="outline" size="sm" disabled={selected.size===0} onClick={()=>alert('请先勾选数据')}>删除</Button>
        <DropdownMenu><DropdownMenuTrigger asChild></Button></DropdownMenuTrigger><DropdownMenuContent><DropdownMenuItem><Upload className="h-3.5 w-3.5 mr-2"/>导入数据</DropdownMenuItem></DropdownMenuContent></DropdownMenu>
        <Button variant="outline" size="sm"><Download className="h-3.5 w-3.5 mr-1"/>导出</Button>
      </div>
      <div className="flex items-center gap-1"><Button variant="ghost" size="sm" onClick={()=>setS({code:'',name:'',status:''})}>重置</Button><Button variant="default" size="sm" onClick={fetch}><Search className="h-3.5 w-3.5 mr-1"/>搜索</Button></div>
    </div>
    <div className="flex items-center gap-4 px-4 py-2.5 border-b border-border bg-muted/30 flex-wrap">
      <F label="状态"><Select value={s.status} onValueChange={v=>setS({...s,status:v==='ALL'?'':v})}><SelectTrigger className="w-[100px] h-9 rounded-md border border-border bg-background px-3 text-[13px]"><SelectValue placeholder="全部"/></SelectTrigger><SelectContent><SelectItem value="ALL">全部</SelectItem><SelectItem value="ACTIVE">启用</SelectItem><SelectItem value="INACTIVE">停用</SelectItem></SelectContent></Select></F>
      <F label="客户编码"><Input className="w-[140px] h-9 rounded-md border border-border bg-background px-3 text-[13px]" value={s.code} onChange={e=>setS({...s,code:e.target.value})}/></F>
      <F label="客户名称"><Input className="w-[140px] h-9 rounded-md border border-border bg-background px-3 text-[13px]" value={s.name} onChange={e=>setS({...s,name:e.target.value})}/></F>
    </div>
    <ErpTools onRefresh={fetch}/>
    <div className="overflow-auto"><ErpTable><ErpThead><ErpTh className="w-10"><Checkbox checked={items.length>0&&selected.size===items.length} onCheckedChange={(v:boolean)=>toggleAll(v)}/></ErpTh><ErpTh>状态</ErpTh><ErpTh>客户编码</ErpTh><ErpTh>客户名称</ErpTh><ErpTh>所属行业</ErpTh><ErpTh>客户价值</ErpTh><ErpTh>信用等级</ErpTh><ErpTh>联系人</ErpTh><ErpTh>联系电话</ErpTh><ErpTh>创建时间</ErpTh><ErpTh>操作</ErpTh></ErpThead><ErpTbody>
    {items.map(i=>(<ErpTr key={i.id}><ErpTd><Checkbox checked={selected.has(i.id)} onCheckedChange={(v:boolean)=>{const n=new Set(selected);v?n.add(i.id):n.delete(i.id);setSelected(n);}}/></ErpTd><ErpTd><ErpStatus active={i.status==='ACTIVE'}/></ErpTd><ErpTd><ErpLink onClick={()=>router.push('/sales/customer/'+i.id+'/edit')}>{i.code}</ErpLink></ErpTd><ErpTd>{i.name}</ErpTd><ErpTd className="text-muted-foreground">{i.industry||'-'}</ErpTd><ErpTd>{i.valueLevel||'-'}</ErpTd><ErpTd>{i.creditLevel||'-'}</ErpTd><ErpTd>{i.contactPerson||'-'}</ErpTd><ErpTd>{i.contactPhone||'-'}</ErpTd><ErpTd className="text-muted-foreground">{new Date(i.createdAt).toLocaleDateString('zh-CN')}</ErpTd><ErpTd><ErpAction><ErpActionBtn onClick={()=>router.push('/sales/customer/'+i.id+'/edit')}><Pencil className="h-3.5 w-3.5"/>修改</ErpActionBtn><ErpActionBtn danger onClick={()=>setDelId(i.id)}><Trash2 className="h-3.5 w-3.5"/>删除</ErpActionBtn></ErpAction></ErpTd></ErpTr>))}
    {items.length===0&&<ErpEmpty colSpan={11}/>}
    </ErpTbody></ErpTable></div>
    <ErpPagination page={pg} pageSize={ps} total={total} onPage={setPg} onPageSize={v=>setPs(+v)}/>
    <AlertDialog open={!!delId} onOpenChange={()=>setDelId(null)}><AlertDialogContent><AlertDialogHeader><AlertDialogTitle>确认删除？</AlertDialogTitle></AlertDialogHeader><AlertDialogFooter><AlertDialogCancel>取消</AlertDialogCancel><AlertDialogAction onClick={del} className="bg-[#f56c6c] text-white hover:bg-[#f56c6c]/90">删除</AlertDialogAction></AlertDialogFooter></AlertDialogContent></AlertDialog>
  </div></TooltipProvider>);
}
function F({label,children}:{label:string;children:React.ReactNode}){return<div className="flex items-center gap-1.5"><span className="text-[13px] text-muted-foreground w-[80px] text-right shrink-0">{label}</span>{children}</div>;}
