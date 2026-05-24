'use client';
import { useEffect, useState, useCallback } from 'react';
import { useRouter } from "next/navigation";
import api from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { TooltipProvider } from '@/components/ui/tooltip';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { ChevronDown, Download, Pencil, Plus, Search, Trash2, Upload } from 'lucide-react';
import { ErpTable, ErpThead, ErpTh, ErpTbody, ErpTr, ErpTd, ErpEmpty, ErpLink, ErpAction, ErpActionBtn, ErpTools, ErpStatus, ErpApproval, ErpPagination } from '@/components/ui/erp-table';

interface Item { id:string;code:string;name:string;specification:string|null;categoryName:string;materialType:string;unitName:string;unitSymbol:string|null;status:string;approvalStatus:string;createdAt:string; }
interface Category { id:string;code:string;name:string; }
interface Unit { id:string;code:string;name:string;symbol:string|null; }

const FI = 'h-9 rounded-md border border-border bg-background px-3 text-[13px]';
const FL = 'text-[13px] font-medium';

export default function MaterialPage() {
  const router = useRouter();
  const [items,setItems]=useState<Item[]>([]);const [total,setTotal]=useState(0);const [pg,setPg]=useState(1);const [ps,setPs]=useState(30);
  const [sel,setSel]=useState<Set<string>>(new Set());const [s,setS]=useState({status:'',approvalStatus:'',code:'',name:'',startDate:'',endDate:''});
  const [del,setDel]=useState<string|null>(null);const [advanced,setAdvanced]=useState(false);

  const fetch=useCallback(async()=>{
    const p:any={page:pg,pageSize:ps}; if(s.code)p.code=s.code; if(s.name)p.name=s.name; if(s.status)p.status=s.status;
    const {data}=await api.get('/materials',{params:p}); setItems(data.items); setTotal(data.total);
  },[pg,ps,s]);
  useEffect(()=>{fetch();},[fetch]);

  const add = () => router.push('/material/create');
  const edit = (i:any) => router.push(`/material/${i.id}/edit`);
  const doDel=async()=>{if(!del)return;await api.delete(`/materials/${del}`);setDel(null);fetch();};
  const FF =(l:string)=> <span className="text-[13px] text-muted-foreground w-[80px] text-right shrink-0">{l}</span>;
  const FI2 = `${FI} w-full`;

  return (<TooltipProvider><div className="bg-background rounded-lg border shadow-sm">
    {/* Toolbar */}
    <div className="flex items-center justify-between px-4 h-14 border-b border-border">
      <div className="flex items-center gap-1">
        <Button variant="secondary" size="sm" onClick={add}><Plus className="h-3.5 w-3.5"/>新增</Button>
        <Button variant="outline" size="sm" disabled={sel.size===0}>修改</Button>
        <Button variant="outline" size="sm" disabled={sel.size===0}>删除</Button>
        <DropdownMenu><DropdownMenuTrigger asChild><Button variant="outline" size="sm">导入 <ChevronDown className="h-3 w-3 ml-0.5"/></Button></DropdownMenuTrigger><DropdownMenuContent align="start"><DropdownMenuItem><Upload className="h-3.5 w-3.5 mr-2"/>导入数据</DropdownMenuItem><DropdownMenuItem><Download className="h-3.5 w-3.5 mr-2"/>下载模板</DropdownMenuItem></DropdownMenuContent></DropdownMenu>
        <Button variant="outline" size="sm"><Download className="h-3.5 w-3.5 mr-1"/>导出</Button>
      </div>
      <div className="flex items-center gap-1">
        <Button variant="ghost" size="sm" onClick={()=>setS({status:'',approvalStatus:'',code:'',name:'',startDate:'',endDate:''})}>重置</Button>
        <DropdownMenu><DropdownMenuTrigger asChild><Button variant="ghost" size="sm">常用搜索方案 <ChevronDown className="h-3 w-3 ml-0.5"/></Button></DropdownMenuTrigger><DropdownMenuContent align="end"><DropdownMenuItem>保存当前搜索</DropdownMenuItem></DropdownMenuContent></DropdownMenu>
        <Button variant="default" size="sm" onClick={fetch}><Search className="h-3.5 w-3.5 mr-1"/>搜索</Button>
        <Button variant="ghost" size="sm" onClick={()=>setAdvanced(!advanced)}>高级搜索</Button>
      </div>
    </div>
    {/* Search filters */}
    <div className="flex items-center gap-4 px-4 py-2.5 border-b border-border bg-muted/30 flex-wrap">
      <div className="flex items-center gap-1.5">{FF('状态')}<Select value={s.status} onValueChange={v=>setS({...s,status:v==='ALL'?'':v})}><SelectTrigger className="w-[100px] h-9 rounded-md border border-border bg-background px-3 text-[13px]"><SelectValue placeholder="全部"/></SelectTrigger><SelectContent><SelectItem value="ALL">全部</SelectItem><SelectItem value="ACTIVE">启用</SelectItem><SelectItem value="INACTIVE">停用</SelectItem></SelectContent></Select></div>
      <div className="flex items-center gap-1.5">{FF('审批')}<Select value={s.approvalStatus} onValueChange={v=>setS({...s,approvalStatus:v==='ALL'?'':v})}><SelectTrigger className="w-[100px] h-9 rounded-md border border-border bg-background px-3 text-[13px]"><SelectValue placeholder="全部"/></SelectTrigger><SelectContent><SelectItem value="ALL">全部</SelectItem><SelectItem value="DRAFT">草稿</SelectItem><SelectItem value="SUBMITTED">已提交</SelectItem><SelectItem value="APPROVED">已通过</SelectItem></SelectContent></Select></div>
      <div className="flex items-center gap-1.5">{FF('物料编码')}<Input className="w-[140px] h-9 rounded-md border border-border bg-background px-3 text-[13px]" value={s.code} onChange={e=>setS({...s,code:e.target.value})} placeholder="编码"/></div>
      <div className="flex items-center gap-1.5">{FF('物料名称')}<Input className="w-[140px] h-9 rounded-md border border-border bg-background px-3 text-[13px]" value={s.name} onChange={e=>setS({...s,name:e.target.value})} placeholder="名称"/></div>
      {advanced && <div className="flex items-center gap-1.5">{FF('创建时间')}<Input type="date" className="w-[130px] h-9 rounded-md border border-border bg-background px-3 text-[13px]" value={s.startDate} onChange={e=>setS({...s,startDate:e.target.value})}/><span className="text-muted-foreground">-</span><Input type="date" className="w-[130px] h-9 rounded-md border border-border bg-background px-3 text-[13px]" value={s.endDate} onChange={e=>setS({...s,endDate:e.target.value})}/></div>}
    </div>
    {/* Table */}
    <ErpTools onRefresh={fetch} />
    <div className="overflow-auto"><ErpTable><ErpThead><ErpTh className="w-10"><Checkbox checked={items.length>0&&sel.size===items.length} onCheckedChange={(v:boolean)=>setSel(v?new Set(items.map(i=>i.id)):new Set())}/></ErpTh><ErpTh>启用状态</ErpTh><ErpTh>审批状态</ErpTh><ErpTh>物料编码</ErpTh><ErpTh>物料名称</ErpTh><ErpTh>规格型号</ErpTh><ErpTh>物料分类</ErpTh><ErpTh>物料性质</ErpTh><ErpTh>计量单位</ErpTh><ErpTh>创建时间</ErpTh><ErpTh>操作</ErpTh></ErpThead><ErpTbody>
    {items.map(i=>(<ErpTr key={i.id}><ErpTd><Checkbox checked={sel.has(i.id)} onCheckedChange={(v:boolean)=>{const n=new Set(sel);v?n.add(i.id):n.delete(i.id);setSel(n);}}/></ErpTd><ErpTd><ErpStatus active={i.status==='ACTIVE'}/></ErpTd><ErpTd><ErpApproval status={i.approvalStatus}/></ErpTd><ErpTd><ErpLink onClick={()=>edit(i)}>{i.code}</ErpLink></ErpTd><ErpTd>{i.name}</ErpTd><ErpTd className="text-[#909399]">{i.specification||'-'}</ErpTd><ErpTd>{i.categoryName}</ErpTd><ErpTd>{i.materialType==='PHYSICAL'?'实物':'虚拟'}</ErpTd><ErpTd>{i.unitName}{i.unitSymbol?`(${i.unitSymbol})`:''}</ErpTd><ErpTd className="text-[#909399]">{new Date(i.createdAt).toLocaleDateString('zh-CN')}</ErpTd><ErpTd><ErpAction><ErpActionBtn onClick={()=>edit(i)}><Pencil className="h-3.5 w-3.5"/>修改</ErpActionBtn><ErpActionBtn danger onClick={()=>setDel(i.id)}><Trash2 className="h-3.5 w-3.5"/>删除</ErpActionBtn></ErpAction></ErpTd></ErpTr>))}
    {items.length===0 && <ErpEmpty colSpan={11}/>}
    </ErpTbody></ErpTable></div>
    <ErpPagination page={pg} pageSize={ps} total={total} onPage={setPg} onPageSize={v=>setPs(+v)}/>

    <AlertDialog open={!!del} onOpenChange={()=>setDel(null)}><AlertDialogContent><AlertDialogHeader><AlertDialogTitle>确认删除？</AlertDialogTitle></AlertDialogHeader><AlertDialogFooter><AlertDialogCancel>取消</AlertDialogCancel><AlertDialogAction onClick={doDel} className="bg-[#f56c6c] text-white hover:bg-[#f56c6c]/90">删除</AlertDialogAction></AlertDialogFooter></AlertDialogContent></AlertDialog>
  </div></TooltipProvider>);
}
