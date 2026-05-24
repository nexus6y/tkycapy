'use client';
import { useEffect, useState, useCallback } from 'react';
import api from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { ChevronDown, ChevronUp, Download, FileDown, FileUp, MoreHorizontal, Pencil, RefreshCw, Search, Settings, Trash2, Upload } from 'lucide-react';

interface Material { id: string; code: string; name: string; specification: string|null; externalCode: string|null; categoryCode: string; categoryName: string; materialType: string; unitName: string; unitSymbol: string|null; status: string; approvalStatus: string; createdAt: string; }
interface Category { id: string; code: string; name: string; }
interface Unit { id: string; code: string; name: string; symbol: string|null; }

const PAGE_SIZE_OPTS = [20, 30, 50, 100];

export default function MaterialPage() {
  const [items, setItems] = useState<Material[]>([]);
  const [total, setTotal] = useState(0); const [page, setPage] = useState(1); const [pageSize, setPageSize] = useState(30);
  const [categories, setCategories] = useState<Category[]>([]);
  const [units, setUnits] = useState<Unit[]>([]);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [advancedOpen, setAdvancedOpen] = useState(false);

  // Search
  const [s, setS] = useState({ status:'', approvalStatus:'', code:'', name:'', startDate:'', endDate:'' });

  // Dialog
  const [dialog, setDialog] = useState(false); const [editing, setEditing] = useState<Material|null>(null);
  const [f, setF] = useState({ code:'', name:'', categoryId:'', unitId:'', specification:'', externalCode:'', materialType:'PHYSICAL', materialProperty:'', productCategory:'', sortOrder:0, status:'ACTIVE', remark:'' });

  // Delete
  const [delId, setDelId] = useState<string|null>(null);

  const fetchData = useCallback(async () => {
    const params: any = { page, pageSize };
    if(s.code) params.code=s.code; if(s.name) params.name=s.name;
    if(s.status) params.status=s.status;
    const { data } = await api.get('/materials', { params });
    setItems(data.items); setTotal(data.total);
  }, [page, pageSize, s]);

  useEffect(() => { fetchData(); }, [fetchData]);
  useEffect(() => {
    api.get('/material-categories', { params: { pageSize: 200 } }).then(r => setCategories(r.data.items));
    api.get('/measurement-units', { params: { pageSize: 200 } }).then(r => setUnits(r.data.items));
  }, []);

  const openAdd = () => { setEditing(null); setF({ code:'',name:'',categoryId:'',unitId:'',specification:'',externalCode:'',materialType:'PHYSICAL',materialProperty:'',productCategory:'',sortOrder:0,status:'ACTIVE',remark:'' }); setDialog(true); };
  const openEdit = (item: Material) => { setEditing(item); setF({ code:item.code,name:item.name,categoryId:item.categoryId||'',unitId:item.unitId||'',specification:item.specification||'',externalCode:item.externalCode||'',materialType:item.materialType,materialProperty:item.materialProperty||'',productCategory:item.productCategory||'',sortOrder:item.sortOrder||0,status:item.status,remark:'' }); setDialog(true); };
  const save = async () => { try { editing ? await api.put(`/materials/${editing.id}`, f) : await api.post('/materials', f); setDialog(false); fetchData(); } catch(err:any){ alert(err.response?.data?.message||'保存失败'); } };
  const del = async () => { if(!delId)return; await api.delete(`/materials/${delId}`); setDelId(null); fetchData(); };

  const toggleAll = (checked: boolean) => { setSelected(checked ? new Set(items.map(i=>i.id)) : new Set()); };
  const toggleOne = (id: string, checked: boolean) => { const next=new Set(selected); checked?next.add(id):next.delete(id); setSelected(next); };

  const totalPages = Math.ceil(total/pageSize);
  const pages = Array.from({length: totalPages}, (_,i)=>i+1).filter(p => p===1||p===totalPages||Math.abs(p-page)<=2);

  return (
    <TooltipProvider>
    <div className="h-full flex flex-col bg-white">
      {/* ====== TOOLBAR ROW ====== */}
      <div className="flex items-center justify-between px-4 py-2 border-b border-gray-100">
        <div className="flex items-center gap-1">
          <Button size="sm" onClick={openAdd}><span className="mr-1">+</span>新增</Button>
          <Button size="sm" variant="outline" disabled={selected.size===0}>修改</Button>
          <Button size="sm" variant="outline" disabled={selected.size===0}>批改</Button>
          <DropdownMenu>
            <DropdownMenuTrigger asChild><Button size="sm" variant="outline">导入 <ChevronDown size={12} className="ml-1"/></Button></DropdownMenuTrigger>
            <DropdownMenuContent align="start">
              <DropdownMenuItem><Upload size={14} className="mr-2"/>导入数据</DropdownMenuItem>
              <DropdownMenuItem><FileDown size={14} className="mr-2"/>下载模板</DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
          <Button size="sm" variant="outline">导出</Button>
          <DropdownMenu>
            <DropdownMenuTrigger asChild><Button size="sm" variant="outline">更多操作 <ChevronDown size={12} className="ml-1"/></Button></DropdownMenuTrigger>
            <DropdownMenuContent align="start">
              <DropdownMenuItem>批量审批</DropdownMenuItem>
              <DropdownMenuItem>批量打印</DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
        <div className="flex items-center gap-1">
          <Button size="sm" variant="ghost" onClick={()=>setS({status:'',approvalStatus:'',code:'',name:'',startDate:'',endDate:''})}>重置</Button>
          <DropdownMenu>
            <DropdownMenuTrigger asChild><Button size="sm" variant="ghost">常用搜索方案 <ChevronDown size={12} className="ml-1"/></Button></DropdownMenuTrigger>
            <DropdownMenuContent align="end"><DropdownMenuItem>保存当前搜索</DropdownMenuItem></DropdownMenuContent>
          </DropdownMenu>
          <Button size="sm" onClick={fetchData}><Search size={14} className="mr-1"/>搜索</Button>
          <Button size="sm" variant="ghost" onClick={()=>setAdvancedOpen(!advancedOpen)}>{advancedOpen ? <><ChevronUp size={14} className="mr-1"/>收起</> : <>高级搜索 <ChevronDown size={12} className="ml-1"/></>}</Button>
        </div>
      </div>

      {/* ====== SEARCH ROW ====== */}
      <div className="flex items-center gap-3 px-4 py-2.5 bg-gray-50/50 border-b border-gray-100 flex-wrap">
        <div className="flex items-center gap-1.5">
          <span className="text-[12px] text-gray-500 w-12">状态</span>
          <Select value={s.status} onValueChange={v=>setS({...s,status:v==='ALL'?'':v})}>
            <SelectTrigger className="w-[100px] h-8 text-[12px]"><SelectValue placeholder="全部"/></SelectTrigger>
            <SelectContent><SelectItem value="ALL">全部</SelectItem><SelectItem value="ACTIVE">启用</SelectItem><SelectItem value="INACTIVE">停用</SelectItem></SelectContent>
          </Select>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="text-[12px] text-gray-500 w-12">审批</span>
          <Select value={s.approvalStatus} onValueChange={v=>setS({...s,approvalStatus:v==='ALL'?'':v})}>
            <SelectTrigger className="w-[100px] h-8 text-[12px]"><SelectValue placeholder="全部"/></SelectTrigger>
            <SelectContent><SelectItem value="ALL">全部</SelectItem><SelectItem value="DRAFT">草稿</SelectItem><SelectItem value="SUBMITTED">已提交</SelectItem><SelectItem value="APPROVED">已通过</SelectItem></SelectContent>
          </Select>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="text-[12px] text-gray-500">物料编码</span>
          <Input className="w-[140px] h-8 text-[12px]" value={s.code} onChange={e=>setS({...s,code:e.target.value})} placeholder="编码"/>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="text-[12px] text-gray-500">物料名称</span>
          <Input className="w-[140px] h-8 text-[12px]" value={s.name} onChange={e=>setS({...s,name:e.target.value})} placeholder="名称"/>
        </div>
        {advancedOpen && (<>
          <div className="flex items-center gap-1.5">
            <span className="text-[12px] text-gray-500">创建时间</span>
            <Input type="date" className="w-[130px] h-8 text-[12px]" value={s.startDate} onChange={e=>setS({...s,startDate:e.target.value})}/>
            <span className="text-[12px] text-gray-400">-</span>
            <Input type="date" className="w-[130px] h-8 text-[12px]" value={s.endDate} onChange={e=>setS({...s,endDate:e.target.value})}/>
          </div>
        </>)}
      </div>

      {/* ====== TABLE ====== */}
      <div className="flex-1 overflow-auto">
        {/* Table header icons */}
        <div className="flex items-center justify-end px-4 py-1.5 bg-gray-50/30 border-b border-gray-100 gap-1">
          <Tooltip><TooltipTrigger asChild><button className="p-1.5 hover:bg-gray-100 rounded text-gray-400 hover:text-gray-600"><RefreshCw size={14}/></button></TooltipTrigger><TooltipContent>刷新</TooltipContent></Tooltip>
          <Tooltip><TooltipTrigger asChild><button className="p-1.5 hover:bg-gray-100 rounded text-gray-400 hover:text-gray-600"><Settings size={14}/></button></TooltipTrigger><TooltipContent>列设置</TooltipContent></Tooltip>
        </div>

        <table className="w-full text-[13px]">
          <thead className="bg-gray-50 border-y border-gray-200 sticky top-0">
            <tr>
              <th className="w-10 px-3 py-2.5"><Checkbox checked={items.length>0 && selected.size===items.length} onCheckedChange={(v:boolean)=>toggleAll(v)}/></th>
              <th className="text-left px-2 py-2.5 font-medium text-gray-600 whitespace-nowrap">启用状态</th>
              <th className="text-left px-2 py-2.5 font-medium text-gray-600 whitespace-nowrap">审批状态</th>
              <th className="text-left px-2 py-2.5 font-medium text-gray-600 whitespace-nowrap">物料编码</th>
              <th className="text-left px-2 py-2.5 font-medium text-gray-600 whitespace-nowrap">物料名称</th>
              <th className="text-left px-2 py-2.5 font-medium text-gray-600 whitespace-nowrap">规格型号</th>
              <th className="text-left px-2 py-2.5 font-medium text-gray-600 whitespace-nowrap">物料分类</th>
              <th className="text-left px-2 py-2.5 font-medium text-gray-600 whitespace-nowrap">物料性质</th>
              <th className="text-left px-2 py-2.5 font-medium text-gray-600 whitespace-nowrap">计量单位</th>
              <th className="text-left px-2 py-2.5 font-medium text-gray-600 whitespace-nowrap">创建时间</th>
              <th className="text-left px-2 py-2.5 font-medium text-gray-600 whitespace-nowrap">操作</th>
            </tr>
          </thead>
          <tbody>
            {items.map(item => (
              <tr key={item.id} className="border-b border-gray-100 hover:bg-blue-50/30 transition-colors">
                <td className="px-3 py-2.5"><Checkbox checked={selected.has(item.id)} onCheckedChange={(v:boolean)=>toggleOne(item.id,v)}/></td>
                <td className="px-2 py-2.5">
                  <span className="inline-flex items-center gap-1">
                    <span className={`w-1.5 h-1.5 rounded-full ${item.status==='ACTIVE'?'bg-green-500':'bg-gray-400'}`}/>
                    <span className="text-gray-700">{item.status==='ACTIVE'?'启用':'停用'}</span>
                  </span>
                </td>
                <td className="px-2 py-2.5">
                  <span className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[11px]
                    ${item.approvalStatus==='APPROVED'?'bg-green-50 text-green-700':
                      item.approvalStatus==='SUBMITTED'?'bg-blue-50 text-blue-700':
                      item.approvalStatus==='REJECTED'?'bg-red-50 text-red-700':'bg-gray-50 text-gray-500'}`}>
                    {item.approvalStatus==='APPROVED'?'已通过':item.approvalStatus==='SUBMITTED'?'已提交':item.approvalStatus==='REJECTED'?'已拒绝':'草稿'}
                  </span>
                </td>
                <td className="px-2 py-2.5"><button className="text-blue-600 hover:text-blue-800 hover:underline text-[13px]">{item.code}</button></td>
                <td className="px-2 py-2.5 text-gray-700">{item.name}</td>
                <td className="px-2 py-2.5 text-gray-500">{item.specification||'-'}</td>
                <td className="px-2 py-2.5 text-gray-700">{item.categoryName}</td>
                <td className="px-2 py-2.5 text-gray-700">{item.materialType==='PHYSICAL'?'实物':'虚拟'}</td>
                <td className="px-2 py-2.5 text-gray-700">{item.unitName}{item.unitSymbol?`(${item.unitSymbol})`:''}</td>
                <td className="px-2 py-2.5 text-gray-500 text-[12px]">{new Date(item.createdAt).toLocaleDateString('zh-CN')}</td>
                <td className="px-2 py-2.5">
                  <div className="flex items-center gap-3">
                    <button onClick={()=>openEdit(item)} className="text-blue-600 hover:text-blue-800 text-[12px] inline-flex items-center gap-0.5"><Pencil size={12}/>修改</button>
                    <button onClick={()=>setDelId(item.id)} className="text-red-500 hover:text-red-700 text-[12px] inline-flex items-center gap-0.5"><Trash2 size={12}/>删除</button>
                  </div>
                </td>
              </tr>
            ))}
            {items.length===0 && <tr><td colSpan={11} className="text-center text-gray-400 py-16">暂无数据</td></tr>}
          </tbody>
        </table>
      </div>

      {/* ====== PAGINATION ====== */}
      <div className="flex items-center justify-between px-4 py-2.5 border-t border-gray-200 bg-white shrink-0">
        <span className="text-[12px] text-gray-500">共 {total} 条</span>
        <div className="flex items-center gap-3">
          <Select value={String(pageSize)} onValueChange={v=>{setPageSize(+v);setPage(1);}}>
            <SelectTrigger className="w-[100px] h-8 text-[12px]"><SelectValue/></SelectTrigger>
            <SelectContent>
              {PAGE_SIZE_OPTS.map(n=><SelectItem key={n} value={String(n)}>{n}条/页</SelectItem>)}
            </SelectContent>
          </Select>
          <div className="flex items-center gap-0.5">
            <Button size="sm" variant="ghost" disabled={page<=1} onClick={()=>setPage(p=>p-1)} className="text-[12px] px-2">‹</Button>
            {pages.map((p,i)=>(
              <span key={p}>
                {i>0 && pages[i-1]!==p-1 && <span className="text-gray-300 mx-0.5">...</span>}
                <button onClick={()=>setPage(p)} className={`w-7 h-7 rounded text-[12px] transition-colors ${p===page?'bg-blue-600 text-white':'text-gray-600 hover:bg-gray-100'}`}>{p}</button>
              </span>
            ))}
            <Button size="sm" variant="ghost" disabled={page>=totalPages} onClick={()=>setPage(p=>p+1)} className="text-[12px] px-2">›</Button>
          </div>
        </div>
      </div>

      {/* ====== DIALOG ====== */}
      <Dialog open={dialog} onOpenChange={setDialog}>
        <DialogContent className="max-w-lg"><DialogHeader><DialogTitle>{editing?'修改物料':'新增物料'}</DialogTitle></DialogHeader>
        <div className="space-y-3 max-h-[60vh] overflow-y-auto py-2">
          <div className="grid grid-cols-2 gap-3">
            <div><label className="text-[12px] font-medium">物料编码 *</label><Input className="h-8 text-[13px]" value={f.code} onChange={e=>setF({...f,code:e.target.value})} disabled={!!editing}/></div>
            <div><label className="text-[12px] font-medium">物料名称 *</label><Input className="h-8 text-[13px]" value={f.name} onChange={e=>setF({...f,name:e.target.value})}/></div>
            <div><label className="text-[12px] font-medium">规格型号</label><Input className="h-8 text-[13px]" value={f.specification} onChange={e=>setF({...f,specification:e.target.value})}/></div>
            <div><label className="text-[12px] font-medium">外部编码</label><Input className="h-8 text-[13px]" value={f.externalCode} onChange={e=>setF({...f,externalCode:e.target.value})}/></div>
            <div><label className="text-[12px] font-medium">物料分类 *</label>
              <Select value={f.categoryId} onValueChange={v=>setF({...f,categoryId:v})}><SelectTrigger className="h-8 text-[13px]"><SelectValue placeholder="选择分类"/></SelectTrigger>
              <SelectContent>{categories.map(c=><SelectItem key={c.id} value={c.id}>{c.code} {c.name}</SelectItem>)}</SelectContent></Select>
            </div>
            <div><label className="text-[12px] font-medium">计量单位 *</label>
              <Select value={f.unitId} onValueChange={v=>setF({...f,unitId:v})}><SelectTrigger className="h-8 text-[13px]"><SelectValue placeholder="选择单位"/></SelectTrigger>
              <SelectContent>{units.map(u=><SelectItem key={u.id} value={u.id}>{u.name}{u.symbol?`(${u.symbol})`:''}</SelectItem>)}</SelectContent></Select>
            </div>
            <div><label className="text-[12px] font-medium">物料性质</label>
              <Select value={f.materialType} onValueChange={v=>setF({...f,materialType:v})}><SelectTrigger className="h-8 text-[13px]"><SelectValue/></SelectTrigger>
              <SelectContent><SelectItem value="PHYSICAL">实物</SelectItem><SelectItem value="VIRTUAL">虚拟</SelectItem></SelectContent></Select>
            </div>
            <div><label className="text-[12px] font-medium">排序</label><Input type="number" className="h-8 text-[13px]" value={f.sortOrder} onChange={e=>setF({...f,sortOrder:+e.target.value})}/></div>
            <div><label className="text-[12px] font-medium">状态</label>
              <Select value={f.status} onValueChange={v=>setF({...f,status:v})}><SelectTrigger className="h-8 text-[13px]"><SelectValue/></SelectTrigger>
              <SelectContent><SelectItem value="ACTIVE">启用</SelectItem><SelectItem value="INACTIVE">停用</SelectItem></SelectContent></Select>
            </div>
          </div>
        </div>
        <DialogFooter><Button variant="outline" size="sm" onClick={()=>setDialog(false)}>取消</Button><Button size="sm" onClick={save}>确定</Button></DialogFooter></DialogContent>
      </Dialog>

      <AlertDialog open={!!delId} onOpenChange={()=>setDelId(null)}>
        <AlertDialogContent><AlertDialogHeader><AlertDialogTitle>确认删除？</AlertDialogTitle></AlertDialogHeader>
        <AlertDialogFooter><AlertDialogCancel>取消</AlertDialogCancel><AlertDialogAction onClick={del} className="bg-red-600 hover:bg-red-700">删除</AlertDialogAction></AlertDialogFooter></AlertDialogContent>
      </AlertDialog>
    </div>
    </TooltipProvider>
  );
}
