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
import { ChevronDown, ChevronLeft, ChevronRight, Download, Pencil, Plus, RefreshCw, Search, Settings, Trash2, Upload } from 'lucide-react';

interface Item { id:string;code:string;name:string;specification:string|null;categoryName:string;materialType:string;unitName:string;unitSymbol:string|null;status:string;approvalStatus:string;createdAt:string; }
interface Category { id:string;code:string;name:string; }
interface Unit { id:string;code:string;name:string;symbol:string|null; }

const PGS = [20,30,50,100];
const AS:Record<string,string>={DRAFT:'草稿',SUBMITTED:'已提交',APPROVED:'已通过',REJECTED:'已拒绝'};

export default function MaterialPage() {
  const [items,setItems]=useState<Item[]>([]);const [total,setTotal]=useState(0);const [pg,setPg]=useState(1);const [ps,setPs]=useState(30);
  const [sel,setSel]=useState<Set<string>>(new Set());const [s,setS]=useState({status:'',approvalStatus:'',code:'',name:'',startDate:'',endDate:''});
  const [categories,setCategories]=useState<Category[]>([]);const [units,setUnits]=useState<Unit[]>([]);
  const [open,setOpen]=useState(false);const [ed,setEd]=useState<Item|null>(null);
  const [f,setF]=useState({code:'',name:'',categoryId:'',unitId:'',specification:'',externalCode:'',materialType:'PHYSICAL',materialProperty:'',productCategory:'',sortOrder:0,status:'ACTIVE',remark:''});
  const [del,setDel]=useState<string|null>(null);
  const [advanced,setAdvanced]=useState(false);

  const fetch=useCallback(async()=>{
    const p:any={page:pg,pageSize:ps}; if(s.code)p.code=s.code; if(s.name)p.name=s.name; if(s.status)p.status=s.status;
    const {data}=await api.get('/materials',{params:p}); setItems(data.items); setTotal(data.total);
  },[pg,ps,s]);
  useEffect(()=>{fetch();},[fetch]);
  useEffect(()=>{api.get('/material-categories',{params:{pageSize:200}}).then(r=>setCategories(r.data.items));api.get('/measurement-units',{params:{pageSize:200}}).then(r=>setUnits(r.data.items));},[]);

  const add=()=>{setEd(null);setF({code:'',name:'',categoryId:'',unitId:'',specification:'',externalCode:'',materialType:'PHYSICAL',materialProperty:'',productCategory:'',sortOrder:0,status:'ACTIVE',remark:''});setOpen(true);};
  const edit=(i:Item)=>{setEd(i);setF({code:i.code,name:i.name,categoryId:i.categoryId||'',unitId:i.unitId||'',specification:i.specification||'',externalCode:i.externalCode||'',materialType:i.materialType,materialProperty:i.materialProperty||'',productCategory:i.productCategory||'',sortOrder:i.sortOrder||0,status:i.status,remark:''});setOpen(true);};
  const save=async()=>{try{await (ed?api.put(`/materials/${ed.id}`,f):api.post('/materials',f));setOpen(false);fetch();}catch(e:any){alert(e.response?.data?.message||'保存失败');}};
  const doDel=async()=>{if(!del)return;await api.delete(`/materials/${del}`);setDel(null);fetch();};
  const tp=Math.ceil(total/ps);const pgs=Array.from({length:tp},(_,i)=>i+1).filter(p=>p===1||p===tp||Math.abs(p-pg)<=2);

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
        <Button variant="ghost" size="sm" onClick={()=>setAdvanced(!advanced)}>高级搜索 {advanced?<ChevronDown className="h-3 w-3 rotate-180 ml-0.5"/>:<ChevronDown className="h-3 w-3 ml-0.5"/>}</Button>
      </div>
    </div>

    {/* Search */}
    <div className="flex items-center gap-4 px-4 py-2.5 border-b border-border bg-muted/30 flex-wrap">
      <div className="flex items-center gap-1.5"><span className="text-[13px] text-muted-foreground w-[80px] text-right shrink-0">状态</span><Select value={s.status} onValueChange={v=>setS({...s,status:v==='ALL'?'':v})}><SelectTrigger className="w-[100px] h-9 rounded-md border border-border bg-background px-3 text-[13px]"><SelectValue placeholder="全部"/></SelectTrigger><SelectContent><SelectItem value="ALL">全部</SelectItem><SelectItem value="ACTIVE">启用</SelectItem><SelectItem value="INACTIVE">停用</SelectItem></SelectContent></Select></div>
      <div className="flex items-center gap-1.5"><span className="text-[13px] text-muted-foreground w-[80px] text-right shrink-0">审批</span><Select value={s.approvalStatus} onValueChange={v=>setS({...s,approvalStatus:v==='ALL'?'':v})}><SelectTrigger className="w-[100px] h-9 rounded-md border border-border bg-background px-3 text-[13px]"><SelectValue placeholder="全部"/></SelectTrigger><SelectContent><SelectItem value="ALL">全部</SelectItem><SelectItem value="DRAFT">草稿</SelectItem><SelectItem value="SUBMITTED">已提交</SelectItem><SelectItem value="APPROVED">已通过</SelectItem></SelectContent></Select></div>
      <div className="flex items-center gap-1.5"><span className="text-[13px] text-muted-foreground w-[80px] text-right shrink-0">物料编码</span><Input className="w-[140px] h-9 rounded-md border border-border bg-background px-3 text-[13px]" value={s.code} onChange={e=>setS({...s,code:e.target.value})} placeholder="编码"/></div>
      <div className="flex items-center gap-1.5"><span className="text-[13px] text-muted-foreground w-[80px] text-right shrink-0">物料名称</span><Input className="w-[140px] h-9 rounded-md border border-border bg-background px-3 text-[13px]" value={s.name} onChange={e=>setS({...s,name:e.target.value})} placeholder="名称"/></div>
      {advanced && (<>
        <div className="flex items-center gap-1.5"><span className="text-[13px] text-muted-foreground w-[80px] text-right shrink-0">创建时间</span><Input type="date" className="w-[130px] h-9 rounded-md border border-border bg-background px-3 text-[13px]" value={s.startDate} onChange={e=>setS({...s,startDate:e.target.value})}/><span className="text-muted-foreground">-</span><Input type="date" className="w-[130px] h-9 rounded-md border border-border bg-background px-3 text-[13px]" value={s.endDate} onChange={e=>setS({...s,endDate:e.target.value})}/></div>
      </>)}
    </div>

    {/* Table */}
    <div className="flex items-center justify-end px-4 py-1 bg-muted/20 border-b border-border gap-1">
      <Tooltip><TooltipTrigger asChild><button className="btn-icon text-muted-foreground hover:text-primary"><RefreshCw className="h-4 w-4"/></button></TooltipTrigger><TooltipContent>刷新</TooltipContent></Tooltip>
      <Tooltip><TooltipTrigger asChild><button className="btn-icon text-muted-foreground hover:text-primary"><Settings className="h-4 w-4"/></button></TooltipTrigger><TooltipContent>列设置</TooltipContent></Tooltip>
    </div>
    <div className="overflow-auto">
    <table className="w-full text-[13px]">
      <thead><tr className="bg-table-head border-y border-border">
        <th className="table-th w-10"><Checkbox checked={items.length>0&&sel.size===items.length} onCheckedChange={(v:boolean)=>setSel(v?new Set(items.map(i=>i.id)):new Set())}/></th>
        <th className="table-th">启用状态</th><th className="table-th">审批状态</th><th className="table-th">物料编码</th><th className="table-th">物料名称</th><th className="table-th">规格型号</th><th className="table-th">物料分类</th><th className="table-th">物料性质</th><th className="table-th">计量单位</th><th className="table-th">创建时间</th><th className="table-th">操作</th>
      </tr></thead>
      <tbody>
        {items.map(i=>(<tr key={i.id} className="border-b border-border hover:bg-muted/50 transition-colors">
          <td className="table-td"><Checkbox checked={sel.has(i.id)} onCheckedChange={(v:boolean)=>{const n=new Set(sel);v?n.add(i.id):n.delete(i.id);setSel(n);}}/></td>
          <td className="table-td"><span className="status-dot status-active">{i.status==='ACTIVE'?'启用':'停用'}</span></td>
          <td className="table-td"><span className={`inline-flex px-1.5 py-0.5 rounded text-[11px] ${i.approvalStatus==='APPROVED'?'bg-success/10 text-success':i.approvalStatus==='SUBMITTED'?'bg-primary/10 text-primary':'bg-muted text-muted-foreground'}`}>{AS[i.approvalStatus]}</span></td>
          <td className="table-td"><button className="text-primary hover:underline">{i.code}</button></td>
          <td className="table-td text-foreground">{i.name}</td>
          <td className="table-td text-muted-foreground">{i.specification||'-'}</td>
          <td className="table-td text-foreground">{i.categoryName}</td>
          <td className="table-td text-foreground">{i.materialType==='PHYSICAL'?'实物':'虚拟'}</td>
          <td className="table-td text-foreground">{i.unitName}{i.unitSymbol?`(${i.unitSymbol})`:''}</td>
          <td className="table-td text-muted-foreground">{new Date(i.createdAt).toLocaleDateString('zh-CN')}</td>
          <td className="table-td"><div className="flex items-center gap-4">
            <button onClick={()=>edit(i)} className="text-primary hover:text-primary/80 text-[12px] inline-flex items-center gap-0.5"><Pencil className="h-3 w-3"/>修改</button>
            <button onClick={()=>setDel(i.id)} className="text-destructive hover:text-destructive/80 text-[12px] inline-flex items-center gap-0.5"><Trash2 className="h-3 w-3"/>删除</button>
          </div></td>
        </tr>))}
        {items.length===0&&<tr><td colSpan={11} className="table-td text-center text-muted-foreground py-16">暂无数据</td></tr>}
      </tbody>
    </table>
    </div>

    {/* Pagination */}
    <div className="flex items-center justify-end px-4 py-2.5 border-t border-border gap-3">
      <span className="text-[13px] text-muted-foreground">共 <span className="text-primary">{total}</span> 条</span>
      <Select value={String(ps)} onValueChange={v=>{setPs(+v);setPg(1);}}><SelectTrigger className="w-[100px] h-9 rounded-md border border-border bg-background px-3 text-[13px]"><SelectValue/></SelectTrigger><SelectContent>{PGS.map(n=><SelectItem key={n} value={String(n)}>{n}条/页</SelectItem>)}</SelectContent></Select>
      <div className="flex items-center gap-0.5">
        <Button variant="outline" size="icon" className="h-8 w-8" disabled={pg<=1} onClick={()=>setPg(p=>p-1)}><ChevronLeft className="h-4 w-4"/></Button>
        {pgs.map((p,i)=>(<span key={p}>{i>0&&pgs[i-1]!==p-1&&<span className="text-muted-foreground mx-0.5">...</span>}<button onClick={()=>setPg(p)} className={`h-8 w-8 rounded-md text-[13px] transition-colors ${p===pg?'bg-primary text-primary-foreground':'border border-border text-muted-foreground hover:bg-muted'}`}>{p}</button></span>))}
        <Button variant="outline" size="icon" className="h-8 w-8" disabled={pg>=tp} onClick={()=>setPg(p=>p+1)}><ChevronRight className="h-4 w-4"/></Button>
      </div>
    </div>

    <Dialog open={open} onOpenChange={setOpen}><DialogContent className="max-w-lg"><DialogHeader><DialogTitle>{ed?'修改物料':'新增物料'}</DialogTitle></DialogHeader>
    <div className="space-y-3 max-h-[60vh] overflow-y-auto py-2"><div className="grid grid-cols-2 gap-3">
      <div><label className="text-[13px] font-medium">物料编码 *</label><Input className="h-9 rounded-md border border-border bg-background px-3 text-[13px] w-full" value={f.code} onChange={e=>setF({...f,code:e.target.value})} disabled={!!ed}/></div>
      <div><label className="text-[13px] font-medium">物料名称 *</label><Input className="h-9 rounded-md border border-border bg-background px-3 text-[13px] w-full" value={f.name} onChange={e=>setF({...f,name:e.target.value})}/></div>
      <div><label className="text-[13px] font-medium">规格型号</label><Input className="h-9 rounded-md border border-border bg-background px-3 text-[13px] w-full" value={f.specification} onChange={e=>setF({...f,specification:e.target.value})}/></div>
      <div><label className="text-[13px] font-medium">外部编码</label><Input className="h-9 rounded-md border border-border bg-background px-3 text-[13px] w-full" value={f.externalCode} onChange={e=>setF({...f,externalCode:e.target.value})}/></div>
      <div><label className="text-[13px] font-medium">物料分类 *</label><Select value={f.categoryId} onValueChange={v=>setF({...f,categoryId:v})}><SelectTrigger className="h-9 rounded-md border border-border bg-background px-3 text-[13px] w-full"><SelectValue placeholder="选择分类"/></SelectTrigger><SelectContent>{categories.map(c=><SelectItem key={c.id} value={c.id}>{c.code} {c.name}</SelectItem>)}</SelectContent></Select></div>
      <div><label className="text-[13px] font-medium">计量单位 *</label><Select value={f.unitId} onValueChange={v=>setF({...f,unitId:v})}><SelectTrigger className="h-9 rounded-md border border-border bg-background px-3 text-[13px] w-full"><SelectValue placeholder="选择单位"/></SelectTrigger><SelectContent>{units.map(u=><SelectItem key={u.id} value={u.id}>{u.name}{u.symbol?`(${u.symbol})`:''}</SelectItem>)}</SelectContent></Select></div>
      <div><label className="text-[13px] font-medium">物料性质</label><Select value={f.materialType} onValueChange={v=>setF({...f,materialType:v})}><SelectTrigger className="h-9 rounded-md border border-border bg-background px-3 text-[13px] w-full"><SelectValue/></SelectTrigger><SelectContent><SelectItem value="PHYSICAL">实物</SelectItem><SelectItem value="VIRTUAL">虚拟</SelectItem></SelectContent></Select></div>
      <div><label className="text-[13px] font-medium">排序</label><Input type="number" className="input w-full" value={f.sortOrder} onChange={e=>setF({...f,sortOrder:+e.target.value})}/></div>
      <div><label className="text-[13px] font-medium">状态</label><Select value={f.status} onValueChange={v=>setF({...f,status:v})}><SelectTrigger className="h-9 rounded-md border border-border bg-background px-3 text-[13px] w-full"><SelectValue/></SelectTrigger><SelectContent><SelectItem value="ACTIVE">启用</SelectItem><SelectItem value="INACTIVE">停用</SelectItem></SelectContent></Select></div>
    </div></div>
    <DialogFooter><Button variant="outline" size="sm" onClick={()=>setOpen(false)}>取消</Button><Button variant="default" size="sm" onClick={save}>确定</Button></DialogFooter></DialogContent></Dialog>

    <AlertDialog open={!!del} onOpenChange={()=>setDel(null)}><AlertDialogContent><AlertDialogHeader><AlertDialogTitle>确认删除？</AlertDialogTitle></AlertDialogHeader><AlertDialogFooter><AlertDialogCancel>取消</AlertDialogCancel><AlertDialogAction onClick={doDel} className="bg-destructive text-white hover:bg-destructive/90">删除</AlertDialogAction></AlertDialogFooter></AlertDialogContent></AlertDialog>
  </div></TooltipProvider>);
}
