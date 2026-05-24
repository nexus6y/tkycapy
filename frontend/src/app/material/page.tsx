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

const FI = 'h-9 rounded-md border border-border bg-background px-3 text-[13px]';
const FL = 'text-[13px] font-medium';

export default function MaterialPage() {
  const [items,setItems]=useState<Item[]>([]);const [total,setTotal]=useState(0);const [pg,setPg]=useState(1);const [ps,setPs]=useState(30);
  const [sel,setSel]=useState<Set<string>>(new Set());const [s,setS]=useState({status:'',approvalStatus:'',code:'',name:'',startDate:'',endDate:''});
  const [categories,setCategories]=useState<Category[]>([]);const [units,setUnits]=useState<Unit[]>([]);
  const [open,setOpen]=useState(false);const [ed,setEd]=useState<Item|null>(null);
  const [f,setF]=useState<any>({});
  const [del,setDel]=useState<string|null>(null);const [advanced,setAdvanced]=useState(false);

  const fetch=useCallback(async()=>{
    const p:any={page:pg,pageSize:ps}; if(s.code)p.code=s.code; if(s.name)p.name=s.name; if(s.status)p.status=s.status;
    const {data}=await api.get('/materials',{params:p}); setItems(data.items); setTotal(data.total);
  },[pg,ps,s]);
  useEffect(()=>{fetch();},[fetch]);
  useEffect(()=>{api.get('/material-categories',{params:{pageSize:200}}).then(r=>setCategories(r.data.items));api.get('/measurement-units',{params:{pageSize:200}}).then(r=>setUnits(r.data.items));},[]);

  const baseF = {code:'',name:'',categoryId:'',unitId:'',specification:'',externalCode:'',materialType:'PHYSICAL',materialProperty:'',productCategory:'',unifiedUnit:true,sortOrder:0,status:'ACTIVE',remark:'',defaultSupplier:'',defaultPurchaser:'',minPurchaseQty:'',plannedPrice:'',requiredManufacturer:'',excludedManufacturer:'',responsiblePerson:'',needInspection:false,defectRateLimit:'',defaultSalesperson:'',minOrderQty:'',defaultWarehouseId:'',safetyStockQty:'',maxStockQty:'',minStockQty:'',batchManaged:false,shelfLifeManaged:false,remainingShelfLife:'',serialManaged:false,directProduction:false,planAttribute:'',economicBatch:'',batchMultiple:'',lossRate:'',defaultDeptId:'',issueMethod:'',prodStdQty:'',prodStdHours:'',repairStdQty:'',repairStdHours:'',maintStdQty:'',maintStdHours:''};

  const add=()=>{setEd(null);setF({...baseF});setOpen(true);};
  const edit=(i:any)=>{setEd(i);setF({code:i.code,name:i.name,categoryId:i.categoryId||'',unitId:i.unitId||'',specification:i.specification||'',externalCode:i.externalCode||'',materialType:i.materialType||'PHYSICAL',...baseF,...i});setOpen(true);};
  const save=async()=>{try{await (ed?api.put(`/materials/${ed.id}`,f):api.post('/materials',f));setOpen(false);fetch();}catch(e:any){alert(e.response?.data?.message||'保存失败');}};
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

    {/* ====== ADD/EDIT DIALOG ====== */}
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent className="max-w-2xl"><DialogHeader><DialogTitle>{ed?'修改物料':'新增物料'}</DialogTitle></DialogHeader>
      <div className="space-y-4 max-h-[65vh] overflow-y-auto py-2">
        {/* 基本信息 */}
        <fieldset className="border rounded-lg p-3"><legend className="text-[13px] font-bold text-foreground px-1">基本信息</legend>
        <div className="grid grid-cols-2 gap-3">
          <div><label className={FL}>1级分类 *</label><Select value={f.categoryId} onValueChange={v=>setF({...f,categoryId:v})}><SelectTrigger className={FI2}><SelectValue placeholder="选择分类"/></SelectTrigger><SelectContent>{categories.map(c=><SelectItem key={c.id} value={c.id}>{c.code} {c.name}</SelectItem>)}</SelectContent></Select></div>
          <div><label className={FL}>物料编号</label><Input className={FI2} value={f.code} onChange={e=>setF({...f,code:e.target.value})} disabled={!!ed}/></div>
          <div><label className={FL}>物料名称 *</label><Input className={FI2} value={f.name} onChange={e=>setF({...f,name:e.target.value})}/></div>
          <div><label className={FL}>规格型号</label><Input className={FI2} value={f.specification} onChange={e=>setF({...f,specification:e.target.value})}/></div>
          <div><label className={FL}>外部编码</label><Input className={FI2} value={f.externalCode} onChange={e=>setF({...f,externalCode:e.target.value})}/></div>
          <div><label className={FL}>排序</label><Input type="number" className={FI2} value={f.sortOrder} onChange={e=>setF({...f,sortOrder:+e.target.value})}/></div>
          <div><label className={FL}>状态</label><Select value={f.status} onValueChange={v=>setF({...f,status:v})}><SelectTrigger className={FI2}><SelectValue/></SelectTrigger><SelectContent><SelectItem value="ACTIVE">启用</SelectItem><SelectItem value="INACTIVE">停用</SelectItem></SelectContent></Select></div>
          <div className="col-span-2"><label className={FL}>备注</label><Input className={FI2} value={f.remark} onChange={e=>setF({...f,remark:e.target.value})}/></div>
        </div></fieldset>

        {/* 物料性质 */}
        <fieldset className="border rounded-lg p-3"><legend className="text-[13px] font-bold text-foreground px-1">物料性质</legend>
        <div className="grid grid-cols-2 gap-3">
          <div><label className={FL}>物料性质 *</label><Select value={f.materialType} onValueChange={v=>setF({...f,materialType:v})}><SelectTrigger className={FI2}><SelectValue/></SelectTrigger><SelectContent><SelectItem value="PHYSICAL">实物</SelectItem><SelectItem value="VIRTUAL">虚拟</SelectItem></SelectContent></Select></div>
          <div><label className={FL}>物料属性</label><Input className={FI2} value={f.materialProperty} onChange={e=>setF({...f,materialProperty:e.target.value})}/></div>
          <div><label className={FL}>产品分类 *</label><Input className={FI2} value={f.productCategory} onChange={e=>setF({...f,productCategory:e.target.value})}/></div>
        </div></fieldset>

        {/* 计量单位 */}
        <fieldset className="border rounded-lg p-3"><legend className="text-[13px] font-bold text-foreground px-1">计量单位</legend>
        <div className="grid grid-cols-2 gap-3">
          <div><label className={FL}>是否统一计量单位</label><Select value={f.unifiedUnit?'true':'false'} onValueChange={v=>setF({...f,unifiedUnit:v==='true'})}><SelectTrigger className={FI2}><SelectValue/></SelectTrigger><SelectContent><SelectItem value="true">是</SelectItem><SelectItem value="false">否</SelectItem></SelectContent></Select></div>
          <div><label className={FL}>计量单位 *</label><Select value={f.unitId} onValueChange={v=>setF({...f,unitId:v})}><SelectTrigger className={FI2}><SelectValue placeholder="选择单位"/></SelectTrigger><SelectContent>{units.map(u=><SelectItem key={u.id} value={u.id}>{u.name}{u.symbol?`(${u.symbol})`:''}</SelectItem>)}</SelectContent></Select></div>
        </div></fieldset>

        {/* 采购信息 */}
        <fieldset className="border rounded-lg p-3"><legend className="text-[13px] font-bold text-foreground px-1">采购信息</legend>
        <div className="grid grid-cols-2 gap-3">
          <div><label className={FL}>默认供应商</label><Input className={FI2} value={f.defaultSupplier} onChange={e=>setF({...f,defaultSupplier:e.target.value})}/></div>
          <div><label className={FL}>默认采购员</label><Input className={FI2} value={f.defaultPurchaser} onChange={e=>setF({...f,defaultPurchaser:e.target.value})}/></div>
          <div><label className={FL}>最小采购数量</label><Input type="number" className={FI2} value={f.minPurchaseQty} onChange={e=>setF({...f,minPurchaseQty:e.target.value})}/></div>
          <div><label className={FL}>计划采购价</label><Input type="number" className={FI2} value={f.plannedPrice} onChange={e=>setF({...f,plannedPrice:e.target.value})}/></div>
          <div><label className={FL}>要求生产厂家</label><Input className={FI2} value={f.requiredManufacturer} onChange={e=>setF({...f,requiredManufacturer:e.target.value})}/></div>
          <div><label className={FL}>排除厂家</label><Input className={FI2} value={f.excludedManufacturer} onChange={e=>setF({...f,excludedManufacturer:e.target.value})}/></div>
          <div><label className={FL}>主办人</label><Input className={FI2} value={f.responsiblePerson} onChange={e=>setF({...f,responsiblePerson:e.target.value})}/></div>
        </div></fieldset>

        {/* 质检+销售 */}
        <fieldset className="border rounded-lg p-3"><legend className="text-[13px] font-bold text-foreground px-1">质检与销售</legend>
        <div className="grid grid-cols-2 gap-3">
          <div className="flex items-center gap-2 pt-1"><input type="checkbox" checked={f.needInspection} onChange={e=>setF({...f,needInspection:e.target.checked})} className="w-4 h-4"/><label className={FL}>是否质检</label></div>
          <div><label className={FL}>不合格比例下限(%)</label><Input type="number" className={FI2} value={f.defectRateLimit} onChange={e=>setF({...f,defectRateLimit:e.target.value})}/></div>
          <div><label className={FL}>默认销售员</label><Input className={FI2} value={f.defaultSalesperson} onChange={e=>setF({...f,defaultSalesperson:e.target.value})}/></div>
          <div><label className={FL}>最小起订数量</label><Input type="number" className={FI2} value={f.minOrderQty} onChange={e=>setF({...f,minOrderQty:e.target.value})}/></div>
        </div></fieldset>

        {/* 仓储信息 */}
        <fieldset className="border rounded-lg p-3"><legend className="text-[13px] font-bold text-foreground px-1">仓储信息</legend>
        <div className="grid grid-cols-2 gap-3">
          <div><label className={FL}>默认存储仓库</label><Input className={FI2} value={f.defaultWarehouseId} onChange={e=>setF({...f,defaultWarehouseId:e.target.value})}/></div>
          <div><label className={FL}>安全库存数量</label><Input type="number" className={FI2} value={f.safetyStockQty} onChange={e=>setF({...f,safetyStockQty:e.target.value})}/></div>
          <div><label className={FL}>最高库存数量</label><Input type="number" className={FI2} value={f.maxStockQty} onChange={e=>setF({...f,maxStockQty:e.target.value})}/></div>
          <div><label className={FL}>最低库存数量</label><Input type="number" className={FI2} value={f.minStockQty} onChange={e=>setF({...f,minStockQty:e.target.value})}/></div>
          <div className="flex items-center gap-2 pt-1"><input type="checkbox" checked={f.batchManaged} onChange={e=>setF({...f,batchManaged:e.target.checked})} className="w-4 h-4"/><label className={FL}>是否批次管理</label></div>
          <div className="flex items-center gap-2 pt-1"><input type="checkbox" checked={f.shelfLifeManaged} onChange={e=>setF({...f,shelfLifeManaged:e.target.checked})} className="w-4 h-4"/><label className={FL}>是否效期管理</label></div>
          <div><label className={FL}>剩余有效期(天)</label><Input type="number" className={FI2} value={f.remainingShelfLife} onChange={e=>setF({...f,remainingShelfLife:e.target.value})}/></div>
          <div className="flex items-center gap-2 pt-1"><input type="checkbox" checked={f.serialManaged} onChange={e=>setF({...f,serialManaged:e.target.checked})} className="w-4 h-4"/><label className={FL}>是否序列号/单品码管理</label></div>
        </div></fieldset>

        {/* 生产+工时 */}
        <fieldset className="border rounded-lg p-3"><legend className="text-[13px] font-bold text-foreground px-1">生产与工时</legend>
        <div className="grid grid-cols-2 gap-3">
          <div className="flex items-center gap-2 pt-1"><input type="checkbox" checked={f.directProduction} onChange={e=>setF({...f,directProduction:e.target.checked})} className="w-4 h-4"/><label className={FL}>是否直接生产</label></div>
          <div><label className={FL}>计划属性 *</label><Input className={FI2} value={f.planAttribute} onChange={e=>setF({...f,planAttribute:e.target.value})}/></div>
          <div><label className={FL}>经济批量</label><Input type="number" className={FI2} value={f.economicBatch} onChange={e=>setF({...f,economicBatch:e.target.value})}/></div>
          <div><label className={FL}>批量倍量</label><Input type="number" className={FI2} value={f.batchMultiple} onChange={e=>setF({...f,batchMultiple:e.target.value})}/></div>
          <div><label className={FL}>损耗率(%)</label><Input type="number" className={FI2} value={f.lossRate} onChange={e=>setF({...f,lossRate:e.target.value})}/></div>
          <div><label className={FL}>默认生产部门</label><Input className={FI2} value={f.defaultDeptId} onChange={e=>setF({...f,defaultDeptId:e.target.value})}/></div>
          <div><label className={FL}>发料方式</label><Input className={FI2} value={f.issueMethod} onChange={e=>setF({...f,issueMethod:e.target.value})}/></div>
          <div className="col-span-2 border-t pt-2 mt-1"><label className="text-[12px] font-bold text-foreground">生产标准工时</label></div>
          <div><label className={FL}>生产数量</label><Input type="number" className={FI2} value={f.prodStdQty} onChange={e=>setF({...f,prodStdQty:e.target.value})}/></div>
          <div><label className={FL}>单人用时(时)</label><Input type="number" className={FI2} value={f.prodStdHours} onChange={e=>setF({...f,prodStdHours:e.target.value})}/></div>
          <div><label className={FL}>检修数量</label><Input type="number" className={FI2} value={f.repairStdQty} onChange={e=>setF({...f,repairStdQty:e.target.value})}/></div>
          <div><label className={FL}>单人工时(检修)</label><Input type="number" className={FI2} value={f.repairStdHours} onChange={e=>setF({...f,repairStdHours:e.target.value})}/></div>
          <div><label className={FL}>维修数量</label><Input type="number" className={FI2} value={f.maintStdQty} onChange={e=>setF({...f,maintStdQty:e.target.value})}/></div>
          <div><label className={FL}>单人工时(维修)</label><Input type="number" className={FI2} value={f.maintStdHours} onChange={e=>setF({...f,maintStdHours:e.target.value})}/></div>
        </div></fieldset>
      </div>
      <DialogFooter><Button variant="outline" size="sm" onClick={()=>setOpen(false)}>取消</Button><Button variant="default" size="sm" onClick={save}>确定</Button></DialogFooter></DialogContent>
    </Dialog>

    <AlertDialog open={!!del} onOpenChange={()=>setDel(null)}><AlertDialogContent><AlertDialogHeader><AlertDialogTitle>确认删除？</AlertDialogTitle></AlertDialogHeader><AlertDialogFooter><AlertDialogCancel>取消</AlertDialogCancel><AlertDialogAction onClick={doDel} className="bg-[#f56c6c] text-white hover:bg-[#f56c6c]/90">删除</AlertDialogAction></AlertDialogFooter></AlertDialogContent></AlertDialog>
  </div></TooltipProvider>);
}
