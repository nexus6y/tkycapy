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
import { Download, Pencil, Plus, Search, Trash2 } from 'lucide-react';
import { toast } from '@/components/ui/toast';
import { ErpTable,ErpThead,ErpTh,ErpTbody,ErpTr,ErpTd,ErpEmpty,ErpLink,ErpAction,ErpActionBtn,ErpTools,ErpStatus,ErpPagination } from '@/components/ui/erp-table';

interface Item { id:string;code:string;name:string;contactPerson:string|null;contactPhone:string|null;contactEmail:string|null;address:string|null;creditLevel:string|null;taxId:string|null;status:string;createdAt:string; }

export default function SupplierPage() {
  const router=useRouter();const [items,setItems]=useState<Item[]>([]);const [total,setTotal]=useState(0);const [pg,setPg]=useState(1);const [ps,setPs]=useState(30);
  const [s,setS]=useState({code:'',name:'',status:''});const [del,setDel]=useState<string|null>(null);
  const fetch=useCallback(async()=>{const p:any={page:pg,pageSize:ps};if(s.code)p.code=s.code;if(s.name)p.name=s.name;if(s.status)p.status=s.status;const {data}=await api.get('/suppliers',{params:p});setItems(data.items);setTotal(data.total);},[pg,ps,s]);useEffect(()=>{fetch();},[fetch]);
  const doDel=async()=>{if(!del)return;try{await api.delete(`/suppliers/${del}`);setDel(null);fetch();}catch(e:any){toast(e.response?.data?.message||'删除失败','error');}};
  return (<TooltipProvider><div className="bg-background rounded-lg border shadow-sm">
    <div className="flex items-center justify-between px-4 h-14 border-b border-border"><div className="flex items-center gap-1"><Button variant="secondary" size="sm" onClick={()=>router.push('/purchase/supplier/create')}><Plus className="h-3.5 w-3.5"/>新增</Button><Button variant="outline" size="sm">修改</Button><Button variant="outline" size="sm">删除</Button><Button variant="outline" size="sm"><Download className="h-3.5 w-3.5 mr-1"/>导出</Button></div><div className="flex items-center gap-1"><Button variant="ghost" size="sm" onClick={()=>setS({code:'',name:'',status:''})}>重置</Button><Button variant="default" size="sm" onClick={fetch}><Search className="h-3.5 w-3.5 mr-1"/>搜索</Button></div></div>
    <div className="flex items-center gap-4 px-4 py-2.5 border-b border-border bg-muted/30"><F label="状态"><Select value={s.status} onValueChange={(v:any)=>setS({...s,status:v==='ALL'?'':v})}><SelectTrigger className="w-[100px] h-9 rounded-md border border-border bg-background px-3 text-[13px]"><SelectValue placeholder="全部"/></SelectTrigger><SelectContent><SelectItem value="ALL">全部</SelectItem><SelectItem value="ACTIVE">启用</SelectItem><SelectItem value="INACTIVE">停用</SelectItem></SelectContent></Select></F><F label="供应商编码"><Input className="w-[140px] h-9 rounded-md border border-border bg-background px-3 text-[13px]" value={s.code} onChange={e=>setS({...s,code:e.target.value})}/></F><F label="供应商名称"><Input className="w-[140px] h-9 rounded-md border border-border bg-background px-3 text-[13px]" value={s.name} onChange={e=>setS({...s,name:e.target.value})}/></F></div>
    <ErpTools onRefresh={fetch}/>
    <div className="overflow-auto"><ErpTable><ErpThead><ErpTh className="w-10"><Checkbox/></ErpTh><ErpTh>状态</ErpTh><ErpTh>供应商编码</ErpTh><ErpTh>供应商名称</ErpTh><ErpTh>联系人</ErpTh><ErpTh>电话</ErpTh><ErpTh>信用等级</ErpTh><ErpTh>税号</ErpTh><ErpTh>创建时间</ErpTh><ErpTh>操作</ErpTh></ErpThead><ErpTbody>
    {items.map(i=>(<ErpTr key={i.id}><ErpTd><Checkbox/></ErpTd><ErpTd><ErpStatus active={i.status==='ACTIVE'}/></ErpTd><ErpTd><ErpLink>{i.code}</ErpLink></ErpTd><ErpTd>{i.name}</ErpTd><ErpTd className="text-muted-foreground">{i.contactPerson||'-'}</ErpTd><ErpTd className="text-muted-foreground">{i.contactPhone||'-'}</ErpTd><ErpTd>{i.creditLevel||'-'}</ErpTd><ErpTd className="text-muted-foreground">{i.taxId||'-'}</ErpTd><ErpTd className="text-muted-foreground">{new Date(i.createdAt).toLocaleDateString('zh-CN')}</ErpTd><ErpTd><ErpAction><ErpActionBtn onClick={()=>router.push(`/purchase/supplier/${i.id}/edit`)}><Pencil className="h-3.5 w-3.5"/>修改</ErpActionBtn><ErpActionBtn danger onClick={()=>setDel(i.id)}><Trash2 className="h-3.5 w-3.5"/>删除</ErpActionBtn></ErpAction></ErpTd></ErpTr>))}
    {items.length===0 && <ErpEmpty colSpan={10}/>}
    </ErpTbody></ErpTable></div>
    <ErpPagination page={pg} pageSize={ps} total={total} onPage={setPg} onPageSize={v=>setPs(+v)}/>
    <AlertDialog open={!!del} onOpenChange={()=>setDel(null)}><AlertDialogContent><AlertDialogHeader><AlertDialogTitle>确认删除？</AlertDialogTitle></AlertDialogHeader><AlertDialogFooter><AlertDialogCancel>取消</AlertDialogCancel><AlertDialogAction onClick={doDel} className="bg-[#f56c6c] text-white hover:bg-[#f56c6c]/90">删除</AlertDialogAction></AlertDialogFooter></AlertDialogContent></AlertDialog>
  </div></TooltipProvider>);
}
function F({label,children}:{label:string;children:React.ReactNode}){return<div className="flex items-center gap-1.5"><span className="text-[13px] text-muted-foreground w-[80px] text-right shrink-0">{label}</span>{children}</div>;}
