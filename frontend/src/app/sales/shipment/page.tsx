'use client';
import { useRouter } from 'next/navigation';
import { useEffect, useState, useCallback } from 'react';
import api from '@/lib/api';
import { Button } from '@/components/ui/button'; import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { ChevronDown, Pencil, RefreshCw, Search, Settings, Trash2, Download, Upload } from 'lucide-react';

interface Item { id:string;shipmentNo:string;orderNo:string|null;customerName:string|null;totalQuantity:string|null;totalAmount:string|null;approvalStatus:string;businessStatus:string;createdAt:string; }
const AP:Record<string,string>={DRAFT:'草稿',SUBMITTED:'已提交',APPROVED:'已通过',REJECTED:'已拒绝'};

export default function SalesShipmentPage() {
  const [items,setItems]=useState<Item[]>([]);const [total,setTotal]=useState(0);const [pg,setPg]=useState(1);const [ps,setPs]=useState(30);
  const [sel,setSel]=useState<Set<string>>(new Set());const [s,setS]=useState({code:'',name:'',status:''});
  const [open,setOpen]=useState(false);const [ed,setEd]=useState<Item|null>(null);
  const [f,setF]=useState({shipmentNo:'',orderNo:'',customerName:'',totalQuantity:'',totalAmount:''});
  const [del,setDel]=useState<string|null>(null);

  const fetch=useCallback(async()=>{
    const p:any={page:pg,pageSize:ps}; if(s.code)p.code=s.code; if(s.name)p.name=s.name; if(s.status)p.status=s.status;
    const {data}=await api.get('/sales-shipments',{params:p}); setItems(data.items); setTotal(data.total);
  },[pg,ps,s]); useEffect(()=>{fetch();},[fetch]);

  const add=()=>{setEd(null);setF({shipmentNo:'',orderNo:'',customerName:'',totalQuantity:'',totalAmount:''});setOpen(true);};
  const edit=(i:Item)=>{setEd(i);setF({shipmentNo:i.shipmentNo,orderNo:i.orderNo||'',customerName:i.customerName||'',totalQuantity:i.totalQuantity||'',totalAmount:i.totalAmount||''});setOpen(true);};
  const save=async()=>{try{const d={...f,totalQuantity:f.totalQuantity?+f.totalQuantity:null,totalAmount:f.totalAmount?+f.totalAmount:null};await (ed?api.put(`/sales-shipments/${ed.id}`,d):api.post('/sales-shipments',d));setOpen(false);fetch();}catch(e:any){alert(e.response?.data?.message||'保存失败');}};
  const doDel=async()=>{if(!del)return;await api.delete(`/sales-shipments/${del}`);setDel(null);fetch();};
  const tp=Math.ceil(total/ps); const pgs=Array.from({length:tp},(_,i)=>i+1).filter(p=>p===1||p===tp||Math.abs(p-pg)<=2);

  return (<TooltipProvider><div className="h-full flex flex-col bg-white">
    <Toolbar onAdd={add} selCount={sel.size} onSearch={fetch} onReset={()=>setS({code:'',name:'',status:''})}/>
    <div className="flex items-center gap-3 px-4 py-2.5 bg-gray-50/50 border-b border-gray-100 flex-wrap">
      <F name="状态" w="w-[90px]"><Select value={s.status} onValueChange={v=>setS({...s,status:v==='ALL'?'':v})}><SelectTrigger className="w-[90px] h-8 text-[12px]"><SelectValue placeholder="全部"/></SelectTrigger><SelectContent><SelectItem value="ALL">全部</SelectItem><SelectItem value="DRAFT">草稿</SelectItem><SelectItem value="SUBMITTED">已提交</SelectItem><SelectItem value="APPROVED">已通过</SelectItem></SelectContent></Select></F>
      <F name="出货单号"><Input className="w-[130px] h-8 text-[12px]" value={s.code} onChange={e=>setS({...s,code:e.target.value})}/></F>
      <F name="客户"><Input className="w-[130px] h-8 text-[12px]" value={s.name} onChange={e=>setS({...s,name:e.target.value})}/></F>
    </div>
    <div className="flex-1 overflow-auto"><Hdr/><table className="w-full text-[13px]"><thead className="bg-gray-50 border-y border-gray-200 sticky top-0"><tr><ThC/><Th>审批状态</Th><Th>出货单号</Th><Th>关联订单</Th><Th>客户</Th><Th>数量</Th><Th>金额</Th><Th>业务状态</Th><Th>创建时间</Th><Th>操作</Th></tr></thead><tbody>{items.map(i=>(<Tr key={i.id} sel={sel} id={i.id} onSel={(v)=>{const n=new Set(sel);v?n.add(i.id):n.delete(i.id);setSel(n);}}><Td><span className={`inline-flex px-1 py-0.5 rounded text-[11px] ${i.approvalStatus==='APPROVED'?'bg-green-50 text-green-700':i.approvalStatus==='SUBMITTED'?'bg-blue-50 text-blue-700':'bg-gray-50 text-gray-500'}`}>{AP[i.approvalStatus]}</span></Td><Td><button className="text-blue-600 hover:text-blue-800 hover:underline text-[13px]">{i.shipmentNo}</button></Td><Td className="text-gray-500">{i.orderNo||'-'}</Td><Td className="text-gray-700">{i.customerName||'-'}</Td><Td className="text-gray-700">{i.totalQuantity||'-'}</Td><Td className="text-gray-700">{i.totalAmount?Number(i.totalAmount).toLocaleString():'-'}</Td><Td className="text-gray-600 text-[12px]">{i.businessStatus}</Td><Td className="text-gray-500 text-[12px]">{new Date(i.createdAt).toLocaleDateString('zh-CN')}</Td><Td><div className="flex items-center gap-2"><button onClick={()=>edit(i)} className="text-blue-600 hover:text-blue-800 text-[12px]"><Pencil size={12} className="inline mr-0.5"/>修改</button>{i.approvalStatus==='DRAFT'&&<button onClick={()=>{api.put(`/sales-shipments/${i.id}/submit`).then(fetch);}} className="text-blue-600 text-[12px]">提交</button>}<button onClick={()=>setDel(i.id)} className="text-red-500 hover:text-red-700 text-[12px]"><Trash2 size={12} className="inline mr-0.5"/>删除</button></div></Td></Tr>))}{items.length===0&&<tr><td colSpan={10} className="text-center text-gray-400 py-16">暂无数据</td></tr>}</tbody></table></div>
    <Pgr pg={pg} ps={ps} total={total} onPg={setPg} onPs={v=>{setPs(+v);setPg(1);}} tp={tp} pgs={pgs}/>
    <Dlg open={open} onOpen={setOpen} ed={!!ed} label="销售出货" onSave={save}><div className="grid grid-cols-2 gap-3"><div><lab>出货单号 *</lab><Input className="h-8 text-[13px]" value={f.shipmentNo} onChange={e=>setF({...f,shipmentNo:e.target.value})} disabled={!!ed}/></div><div><lab>关联订单</lab><Input className="h-8 text-[13px]" value={f.orderNo} onChange={e=>setF({...f,orderNo:e.target.value})}/></div><div><lab>客户</lab><Input className="h-8 text-[13px]" value={f.customerName} onChange={e=>setF({...f,customerName:e.target.value})}/></div><div><lab>数量</lab><Input type="number" className="h-8 text-[13px]" value={f.totalQuantity} onChange={e=>setF({...f,totalQuantity:e.target.value})}/></div><div><lab>金额</lab><Input type="number" className="h-8 text-[13px]" value={f.totalAmount} onChange={e=>setF({...f,totalAmount:e.target.value})}/></div></div></Dlg>
    <Cfm open={!!del} onOpen={()=>setDel(null)} onConfirm={doDel}/>
  </div></TooltipProvider>);
}

// Shared inline helpers
function Toolbar({onAdd,selCount,onSearch,onReset}:{onAdd:()=>void;selCount:number;onSearch:()=>void;onReset:()=>void}){return<div className="flex items-center justify-between px-4 py-2 border-b border-gray-100"><div className="flex items-center gap-1"><Button size="sm" onClick={onAdd}><span className="mr-1">+</span>新增</Button><Button size="sm" variant="outline" disabled={selCount===0}>修改</Button><Button size="sm" variant="outline" disabled={selCount===0}>删除</Button><DropdownMenu><DropdownMenuTrigger asChild><Button size="sm" variant="outline">导入 <ChevronDown size={12} className="ml-1"/></Button></DropdownMenuTrigger><DropdownMenuContent><DropdownMenuItem><Upload size={14} className="mr-2"/>导入数据</DropdownMenuItem></DropdownMenuContent></DropdownMenu><Button size="sm" variant="outline"><Download size={14} className="mr-1"/>导出</Button></div><div className="flex items-center gap-1"><Button size="sm" variant="ghost" onClick={onReset}>重置</Button><Button size="sm" onClick={onSearch}><Search size={14} className="mr-1"/>搜索</Button></div></div>;}
function F({name,children,w}:{name:string;children:React.ReactNode;w?:string}){return<div className={`flex items-center gap-1.5 ${w||''}`}><span className="text-[12px] text-gray-500">{name}</span>{children}</div>;}
function Hdr(){return<div className="flex items-center justify-end px-4 py-1.5 bg-gray-50/30 border-b border-gray-100 gap-1"><Tooltip><TooltipTrigger asChild><button className="p-1.5 hover:bg-gray-100 rounded text-gray-400 hover:text-gray-600"><RefreshCw size={14}/></button></TooltipTrigger><TooltipContent>刷新</TooltipContent></Tooltip><Tooltip><TooltipTrigger asChild><button className="p-1.5 hover:bg-gray-100 rounded text-gray-400 hover:text-gray-600"><Settings size={14}/></button></TooltipTrigger><TooltipContent>列设置</TooltipContent></Tooltip></div>;}
function Th({children}:{children:React.ReactNode}){return<th className="text-left px-1.5 py-2.5 font-medium text-gray-600 text-[13px]">{children}</th>;}
function ThC(){return<th className="w-10 px-3 py-2.5"><Checkbox/></th>;}
function Tr({children,sel,id,onSel}:{children:React.ReactNode;sel:Set<string>;id:string;onSel:(v:boolean)=>void}){return<tr className="border-b border-gray-100 hover:bg-blue-50/30"><td className="px-3 py-2.5"><Checkbox checked={sel.has(id)} onCheckedChange={onSel}/></td>{children}</tr>;}
function Td({children,className}:{children:React.ReactNode;className?:string}){return<td className={`px-1.5 py-2.5 ${className||''}`}>{children}</td>;}
function lab({children}:{children:React.ReactNode}){return<label className="text-[12px] font-medium">{children}</label>;}
function Pgr({pg,ps,total,onPg,onPs,tp,pgs}:{pg:number;ps:number;total:number;onPg:(p:number)=>void;onPs:(v:string)=>void;tp:number;pgs:number[]}){return<div className="flex items-center justify-between px-4 py-2.5 border-t border-gray-200 bg-white shrink-0"><span className="text-[12px] text-gray-500">共 {total} 条</span><div className="flex items-center gap-3"><Select value={String(ps)} onValueChange={onPs}><SelectTrigger className="w-[100px] h-8 text-[12px]"><SelectValue/></SelectTrigger><SelectContent>{[20,30,50,100].map(n=><SelectItem key={n} value={String(n)}>{n}条/页</SelectItem>)}</SelectContent></Select><div className="flex items-center gap-0.5"><Button size="sm" variant="ghost" disabled={pg<=1} onClick={()=>onPg(pg-1)} className="text-[12px] px-2">‹</Button>{pgs.map((p,i)=>(<span key={p}>{i>0&&pgs[i-1]!==p-1&&<span className="text-gray-300 mx-0.5">...</span>}<button onClick={()=>onPg(p)} className={`w-7 h-7 rounded text-[12px] transition-colors ${p===pg?'bg-blue-600 text-white':'text-gray-600 hover:bg-gray-100'}`}>{p}</button></span>))}<Button size="sm" variant="ghost" disabled={pg>=tp} onClick={()=>onPg(pg+1)} className="text-[12px] px-2">›</Button></div></div></div>;}
function Dlg({open,onOpen,ed,label,onSave,children}:{open:boolean;onOpen:(v:boolean)=>void;ed:boolean;label:string;onSave:()=>void;children:React.ReactNode}){return<Dialog open={open} onOpenChange={onOpen}><DialogContent className="max-w-lg"><DialogHeader><DialogTitle>{ed?'修改'+label:'新增'+label}</DialogTitle></DialogHeader><div className="space-y-3 max-h-[60vh] overflow-y-auto py-2">{children}</div><DialogFooter><Button variant="outline" size="sm" onClick={()=>onOpen(false)}>取消</Button><Button size="sm" onClick={onSave}>确定</Button></DialogFooter></DialogContent></Dialog>;}
function Cfm({open,onOpen,onConfirm}:{open:boolean;onOpen:()=>void;onConfirm:()=>void}){return<AlertDialog open={open} onOpenChange={onOpen}><AlertDialogContent><AlertDialogHeader><AlertDialogTitle>确认删除？</AlertDialogTitle></AlertDialogHeader><AlertDialogFooter><AlertDialogCancel>取消</AlertDialogCancel><AlertDialogAction onClick={onConfirm} className="bg-red-600 hover:bg-red-700">删除</AlertDialogAction></AlertDialogFooter></AlertDialogContent></AlertDialog>;}
