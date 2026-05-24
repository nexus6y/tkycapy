'use client';
import { useEffect, useState, useCallback } from 'react';
import api from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { TooltipProvider } from '@/components/ui/tooltip';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { ChevronDown, Download, Pencil, Plus, Search, Trash2, Upload } from 'lucide-react';
import { ErpTable, ErpThead, ErpTh, ErpTbody, ErpTr, ErpTd, ErpEmpty, ErpLink, ErpAction, ErpActionBtn, ErpTools, ErpStatus, ErpApproval, ErpPagination } from '@/components/ui/erp-table';

interface Item { id:string;code:string;name:string;specification:string|null;categoryName:string;materialType:string;unitName:string;unitSymbol:string|null;status:string;approvalStatus:string;createdAt:string; }
interface Category { id:string;code:string;name:string; }
interface Unit { id:string;code:string;name:string;symbol:string|null; }

export default function MaterialPage() {
  const [items,setItems]=useState<Item[]>([]);const [total,setTotal]=useState(0);const [pg,setPg]=useState(1);const [ps,setPs]=useState(30);
  const [sel,setSel]=useState<Set<string>>(new Set());const [s,setS]=useState({status:'',approvalStatus:'',code:'',name:'',startDate:'',endDate:''});
  const [categories,setCategories]=useState<Category[]>([]);const [units,setUnits]=useState<Unit[]>([]);
  const [open,setOpen]=useState(false);const [ed,setEd]=useState<Item|null>(null);
  const [f,setF]=useState({code:'',name:'',categoryId:'',unitId:'',specification:'',externalCode:'',materialType:'PHYSICAL',materialProperty:'',productCategory:'',sortOrder:0,status:'ACTIVE',remark:''});
  const [del,setDel]=useState<string|null>(null);const [advanced,setAdvanced]=useState(false);

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
  const F = 'text-[13px] text-muted-foreground w-[80px] text-right shrink-0';
  const I = 'w-[140px] h-9 rounded-md border border-border bg-background px-3 text-[13px]';

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

    {/* Search filters */}
    <div className="flex items-center gap-4 px-4 py-2.5 border-b border-border bg-muted/30 flex-wrap">
      <div className="flex items-center gap-1.5"><span className={F}>状态</span><Select value={s.status} onValueChange={v=>setS({...s,status:v==='ALL'?'':v})}><SelectTrigger className="w-[100px] h-9 rounded-md border border-border bg-background px-3 text-[13px]"><SelectValue placeholder="全部"/></SelectTrigger><SelectContent><SelectItem value="ALL">全部</SelectItem><SelectItem value="ACTIVE">启用</SelectItem><SelectItem value="INACTIVE">停用</SelectItem></SelectContent></Select></div>
      <div className="flex items-center gap-1.5"><span className={F}>审批</span><Select value={s.approvalStatus} onValueChange={v=>setS({...s,approvalStatus:v==='ALL'?'':v})}><SelectTrigger className="w-[100px] h-9 rounded-md border border-border bg-background px-3 text-[13px]"><SelectValue placeholder="全部"/></SelectTrigger><SelectContent><SelectItem value="ALL">全部</SelectItem><SelectItem value="DRAFT">草稿</SelectItem><SelectItem value="SUBMITTED">已提交</SelectItem><SelectItem value="APPROVED">已通过</SelectItem></SelectContent></Select></div>
      <div className="flex items-center gap-1.5"><span className={F}>物料编码</span><Input className={I} value={s.code} onChange={e=>setS({...s,code:e.target.value})} placeholder="编码"/></div>
      <div className="flex items-center gap-1.5"><span className={F}>物料名称</span><Input className={I} value={s.name} onChange={e=>setS({...s,name:e.target.value})} placeholder="名称"/></div>
      {advanced && <div className="flex items-center gap-1.5"><span className={F}>创建时间</span><Input type="date" className="w-[130px] h-9 rounded-md border border-border bg-background px-3 text-[13px]" value={s.startDate} onChange={e=>setS({...s,startDate:e.target.value})}/><span className="text-muted-foreground">-</span><Input type="date" className="w-[130px] h-9 rounded-md border border-border bg-background px-3 text-[13px]" value={s.endDate} onChange={e=>setS({...s,endDate:e.target.value})}/></div>}
    </div>

    {/* Data table */}
    <ErpTools onRefresh={fetch} />
    <div className="overflow-auto">
    <ErpTable>
      <ErpThead>
        <ErpTh className="w-10"><Checkbox checked={items.length>0&&sel.size===items.length} onCheckedChange={(v:boolean)=>setSel(v?new Set(items.map(i=>i.id)):new Set())}/></ErpTh>
        <ErpTh>启用状态</ErpTh><ErpTh>审批状态</ErpTh><ErpTh>物料编码</ErpTh><ErpTh>物料名称</ErpTh><ErpTh>规格型号</ErpTh><ErpTh>物料分类</ErpTh><ErpTh>物料性质</ErpTh><ErpTh>计量单位</ErpTh><ErpTh>创建时间</ErpTh><ErpTh>操作</ErpTh>
      </ErpThead>
      <ErpTbody>
        {items.map(i=>(<ErpTr key={i.id}>
          <ErpTd><Checkbox checked={sel.has(i.id)} onCheckedChange={(v:boolean)=>{const n=new Set(sel);v?n.add(i.id):n.delete(i.id);setSel(n);}}/></ErpTd>
          <ErpTd><ErpStatus active={i.status==='ACTIVE'}/></ErpTd>
          <ErpTd><ErpApproval status={i.approvalStatus}/></ErpTd>
          <ErpTd><ErpLink onClick={()=>edit(i)}>{i.code}</ErpLink></ErpTd>
          <ErpTd>{i.name}</ErpTd>
          <ErpTd className="text-[#909399]">{i.specification||'-'}</ErpTd>
          <ErpTd>{i.categoryName}</ErpTd>
          <ErpTd>{i.materialType==='PHYSICAL'?'实物':'虚拟'}</ErpTd>
          <ErpTd>{i.unitName}{i.unitSymbol?`(${i.unitSymbol})`:''}</ErpTd>
          <ErpTd className="text-[#909399]">{new Date(i.createdAt).toLocaleDateString('zh-CN')}</ErpTd>
          <ErpTd><ErpAction>
            <ErpActionBtn onClick={()=>edit(i)}><Pencil className="h-3.5 w-3.5"/>修改</ErpActionBtn>
            <ErpActionBtn danger onClick={()=>setDel(i.id)}><Trash2 className="h-3.5 w-3.5"/>删除</ErpActionBtn>
          </ErpAction></ErpTd>
        </ErpTr>))}
        {items.length===0 && <ErpEmpty colSpan={11}/>}
      </ErpTbody>
    </ErpTable>
    </div>
    <ErpPagination page={pg} pageSize={ps} total={total} onPage={setPg} onPageSize={v=>setPs(+v)}/>

    {/* Add/Edit Dialog */}
    <Dialog open={open} onOpenChange={setOpen}><DialogContent className="max-w-lg"><DialogHeader><DialogTitle>{ed?'修改物料':'新增物料'}</DialogTitle></DialogHeader>
    <div className="space-y-3 max-h-[60vh] overflow-y-auto py-2"><div className="grid grid-cols-2 gap-3">
      <div><label className="text-[13px] font-medium">物料编码 *</label><Input className="h-9 rounded-md border border-border bg-background px-3 text-[13px] w-full" value={f.code} onChange={e=>setF({...f,code:e.target.value})} disabled={!!ed}/></div>
      <div><label className="text-[13px] font-medium">物料名称 *</label><Input className="h-9 rounded-md border border-border bg-background px-3 text-[13px] w-full" value={f.name} onChange={e=>setF({...f,name:e.target.value})}/></div>
      <div><label className="text-[13px] font-medium">规格型号</label><Input className="h-9 rounded-md border border-border bg-background px-3 text-[13px] w-full" value={f.specification} onChange={e=>setF({...f,specification:e.target.value})}/></div>
      <div><label className="text-[13px] font-medium">外部编码</label><Input className="h-9 rounded-md border border-border bg-background px-3 text-[13px] w-full" value={f.externalCode} onChange={e=>setF({...f,externalCode:e.target.value})}/></div>
      <div><label className="text-[13px] font-medium">物料分类 *</label><Select value={f.categoryId} onValueChange={v=>setF({...f,categoryId:v})}><SelectTrigger className="h-9 rounded-md border border-border bg-background px-3 text-[13px] w-full"><SelectValue placeholder="选择分类"/></SelectTrigger><SelectContent>{categories.map(c=><SelectItem key={c.id} value={c.id}>{c.code} {c.name}</SelectItem>)}</SelectContent></Select></div>
      <div><label className="text-[13px] font-medium">计量单位 *</label><Select value={f.unitId} onValueChange={v=>setF({...f,unitId:v})}><SelectTrigger className="h-9 rounded-md border border-border bg-background px-3 text-[13px] w-full"><SelectValue placeholder="选择单位"/></SelectTrigger><SelectContent>{units.map(u=><SelectItem key={u.id} value={u.id}>{u.name}{u.symbol?`(${u.symbol})`:''}</SelectItem>)}</SelectContent></Select></div>
      <div><label className="text-[13px] font-medium">物料性质</label><Select value={f.materialType} onValueChange={v=>setF({...f,materialType:v})}><SelectTrigger className="h-9 rounded-md border border-border bg-background px-3 text-[13px] w-full"><SelectValue/></SelectTrigger><SelectContent><SelectItem value="PHYSICAL">实物</SelectItem><SelectItem value="VIRTUAL">虚拟</SelectItem></SelectContent></Select></div>
      <div><label className="text-[13px] font-medium">排序</label><Input type="number" className="h-9 rounded-md border border-border bg-background px-3 text-[13px] w-full" value={f.sortOrder} onChange={e=>setF({...f,sortOrder:+e.target.value})}/></div>
      <div><label className="text-[13px] font-medium">状态</label><Select value={f.status} onValueChange={v=>setF({...f,status:v})}><SelectTrigger className="h-9 rounded-md border border-border bg-background px-3 text-[13px] w-full"><SelectValue/></SelectTrigger><SelectContent><SelectItem value="ACTIVE">启用</SelectItem><SelectItem value="INACTIVE">停用</SelectItem></SelectContent></Select></div>
    </div></div>
    <DialogFooter><Button variant="outline" size="sm" onClick={()=>setOpen(false)}>取消</Button><Button variant="default" size="sm" onClick={save}>确定</Button></DialogFooter></DialogContent></Dialog>

    <AlertDialog open={!!del} onOpenChange={()=>setDel(null)}><AlertDialogContent><AlertDialogHeader><AlertDialogTitle>确认删除？</AlertDialogTitle></AlertDialogHeader><AlertDialogFooter><AlertDialogCancel>取消</AlertDialogCancel><AlertDialogAction onClick={doDel} className="bg-[#f56c6c] text-white hover:bg-[#f56c6c]/90">删除</AlertDialogAction></AlertDialogFooter></AlertDialogContent></AlertDialog>
  </div></TooltipProvider>);
}
