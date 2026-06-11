'use client';

import { Fragment, useCallback, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import api from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { toast } from '@/components/ui/toast';
import { ErpAction, ErpActionBtn, ErpApproval, ErpEmpty, ErpLink, ErpPagination, ErpTable, ErpTbody, ErpTd, ErpTh, ErpThead, ErpTr } from '@/components/ui/erp-table';
import { ChevronDown, Download, MoreHorizontal, Pencil, Plus, RefreshCw, Search, Trash2 } from 'lucide-react';

/* ── types ── */
interface InspLine { id:string; lineNo:number; materialCode:string|null; materialName:string|null; spec:string|null; unit:string|null; inspectQty:string|null; qualifiedQty:string|null; unqualifiedQty:string|null; result:string|null; remark:string|null; }
interface Inspection {
  id:string; inspectionNo:string; sourceType:string|null; sourceNo:string|null;
  materialName:string|null; quantity:string|null; qualifiedQty:string|null; unqualifiedQty:string|null;
  inspector:string|null; inspectionDate:string|null; result:string|null;
  approvalStatus:string; businessStatus:string; createdAt:string;
  lines?: InspLine[];
}

/* ── detail row (flattened from lines) ── */
interface DetailRow {
  inspId:string; inspectionNo:string; sourceType:string|null; sourceNo:string|null;
  approvalStatus:string; businessStatus:string; createdAt:string;
  lineNo:number; materialCode:string; materialName:string; spec:string; unit:string;
  inspectQty:string; qualifiedQty:string; unqualifiedQty:string; result:string;
}

const STATUS_OPTS = [{v:'ALL',l:'全部'},{v:'DRAFT',l:'草稿'},{v:'SUBMITTED',l:'已提交'},{v:'APPROVED',l:'已通过'}];

function fmtDt(v:string|null){return v?new Date(v).toLocaleDateString('zh-CN'):'-';}

export default function InspectionPage() {
  const router = useRouter();
  const [viewMode,setViewMode]=useState<'main'|'detail'>('detail'); // default detail per doc
  const [items,setItems]=useState<Inspection[]>([]);
  const [detailRows,setDetailRows]=useState<DetailRow[]>([]);
  const [total,setTotal]=useState(0);
  const [pg,setPg]=useState(1);const [ps,setPs]=useState(30);
  const [sel,setSel]=useState<Set<string>>(new Set());
  const [delId,setDelId]=useState<string|null>(null);
  const [s,setS]=useState({status:'',code:''});

  const isMain = viewMode==='main';

  const fetch = useCallback(async()=>{
    const p:any={page:pg,pageSize:ps};
    if(isMain){p.mode='detail';}
    if(s.status)p.status=s.status;if(s.code)p.code=s.code;
    const {data}=await api.get('/inspections',{params:p});
    const raw:Inspection[]=data.items||[];
    if(isMain){
      setItems(raw);setTotal(data.total||0);setDetailRows([]);
    }else{
      const rows:DetailRow[]=[];
      for(const insp of raw){
        const lines=insp.lines||[];
        if(lines.length>0){
          for(const ln of lines){
            rows.push({
              inspId:insp.id,inspectionNo:insp.inspectionNo,
              sourceType:insp.sourceType,sourceNo:insp.sourceNo,
              approvalStatus:insp.approvalStatus,businessStatus:insp.businessStatus,
              createdAt:insp.createdAt,
              lineNo:ln.lineNo,materialCode:ln.materialCode||'',materialName:ln.materialName||'',
              spec:ln.spec||'',unit:ln.unit||'',
              inspectQty:ln.inspectQty||'0',qualifiedQty:ln.qualifiedQty||'0',
              unqualifiedQty:ln.unqualifiedQty||'0',result:ln.result||'',
            });
          }
        }else{
          rows.push({
            inspId:insp.id,inspectionNo:insp.inspectionNo,
            sourceType:insp.sourceType,sourceNo:insp.sourceNo,
            approvalStatus:insp.approvalStatus,businessStatus:insp.businessStatus,
            createdAt:insp.createdAt,
            lineNo:1,materialCode:'',materialName:insp.materialName||'',
            spec:'',unit:'',inspectQty:insp.quantity||'0',
            qualifiedQty:insp.qualifiedQty||'0',unqualifiedQty:insp.unqualifiedQty||'0',
            result:insp.result||'',
          });
        }
      }
      setDetailRows(rows);setTotal(rows.length);setItems([]);
    }
  },[isMain,pg,ps,s]);

  useEffect(()=>{fetch();},[fetch]);

  const reset=()=>{setS({status:'',code:''});setPg(1);};
  const toggleSel=(id:string)=>setSel(p=>{const n=new Set(p);n.has(id)?n.delete(id):n.add(id);return n;});
  const toggleAll=()=>{const allIds=isMain?items.map(i=>i.id):detailRows.map(r=>r.inspId);setSel(p=>p.size===allIds.length?new Set():new Set(allIds));};

  const wf=async(id:string,action:'submit'|'approve'|'reject')=>{
    try{await api.put(`/inspections/${id}/${action}`);fetch();}
    catch(e:any){toast(e.response?.data?.message||'操作失败','error');}
  };

  const batchQualify=async()=>{
    if(sel.size===0)return toast('请先勾选数据','info');
    let ok=0;
    for(const id of sel){
      try{
        await api.put(`/inspections/${id}`,{result:'QUALIFIED'});
        ok++;
      }catch(e:any){toast(e.response?.data?.message||'批量合格失败','error');}
    }
    if(ok>0)toast(`批量合格: ${ok}条成功`,'success');
    setSel(new Set());fetch();
  };

  const pushInbound=(id:string)=>{
    if(!confirm('确定下推入库单？将生成合格品入库单。'))return;
    // Approve → auto-creates inbound
    wf(id,'approve');
  };

  const switchMode=(m:'main'|'detail')=>{setViewMode(m);setSel(new Set());setPg(1);};

  /* batch submit selected (主单 mode) */
  const batchSubmit=async()=>{
    if(sel.size===0)return toast('请先勾选数据','info');
    let ok=0;
    for(const id of sel){
      try{await api.put(`/inspections/${id}/submit`);ok++;}catch{}
    }
    toast(`批量提交: ${ok}条成功`,ok>0?'success':'error');
    setSel(new Set());fetch();
  };

  const doDel=async()=>{if(!delId)return;try{await api.delete(`/inspections/${delId}`);setDelId(null);fetch();}catch(e:any){toast(e.response?.data?.message||'删除失败','error');}};

  const selItem=items.find(i=>sel.has(i.id));
  const single=sel.size===1;const multi=sel.size>0;

  return (
    <div className="flex h-full min-h-0 flex-col rounded-lg border border-[#dcdfe6] bg-white">
      {/* ── Toolbar: 新增|修改|删除|提交|更多操作 ── */}
      <div className="flex shrink-0 items-center justify-between gap-2 border-b border-[#ebeef5] bg-white px-4 py-3">
        <div className="flex items-center gap-1.5">
          <Button variant="secondary" size="sm" className="gap-1" onClick={()=>router.push('/quality/inspection/create')}><Plus className="h-3.5 w-3.5"/>新增</Button>
          <Button variant="outline" size="sm" className="gap-1 text-[#67c23a]" disabled={!single}
            onClick={()=>selItem&&router.push(`/quality/inspection/${selItem.id}/edit`)}><Pencil className="h-3.5 w-3.5"/>修改</Button>
          <Button variant="outline" size="sm" className="gap-1 text-[#f56c6c]" disabled={!single}
            onClick={()=>{if(selItem)setDelId(selItem.id);}}><Trash2 className="h-3.5 w-3.5"/>删除</Button>
          <DropdownMenu>
            <DropdownMenuTrigger className="inline-flex items-center gap-1 rounded-md border border-border bg-background px-3 h-9 text-[13px] font-medium shadow-sm hover:bg-accent disabled:opacity-50"
              disabled={!multi}>
              <MoreHorizontal className="h-3.5 w-3.5"/>更多操作<ChevronDown className="h-3.5 w-3.5"/>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start">
              <DropdownMenuItem onClick={batchQualify}>批量合格</DropdownMenuItem>
              {selItem?.approvalStatus==='SUBMITTED'&&<DropdownMenuItem onClick={()=>{if(selItem)wf(selItem.id,'approve');}}>审核通过</DropdownMenuItem>}
              {selItem?.approvalStatus==='APPROVED'&&<DropdownMenuItem onClick={()=>{if(selItem)pushInbound(selItem.id);}}>下推入库单</DropdownMenuItem>}
            </DropdownMenuContent>
          </DropdownMenu>
          {isMain && <Button variant="outline" size="sm" onClick={batchSubmit}>提交</Button>}
          {!isMain && <Button variant="outline" size="sm" onClick={batchQualify}>质检</Button>}
          <Button variant="outline" size="sm" className="gap-1" onClick={()=>toast('导出待接入','info')}><Download className="h-3.5 w-3.5"/>导出</Button>
        </div>
        <div className="flex items-center gap-1">
          <Button variant="ghost" size="sm" onClick={reset}>重置</Button>
          <Button variant="default" size="sm" className="gap-1" onClick={()=>{setPg(1);fetch();}}><Search className="h-4 w-4"/>搜索</Button>
        </div>
      </div>

      {/* ── Search ── */}
      <div className="shrink-0 border-b border-[#ebeef5] bg-[#fafafa] px-4 py-3">
        <div className="flex items-center gap-4 flex-wrap">
          <FS label="审批状态" v={s.status} onChange={v=>setS({...s,status:v})}/>
          <FI label="质检单号" v={s.code} onChange={v=>setS({...s,code:v})} ph="质检单号"/>
        </div>
      </div>

      {/* ── Sub-toolbar: 主单/主单+明细 toggle ── */}
      <div className="flex shrink-0 items-center justify-between border-b border-[#ebeef5] bg-white px-4 py-2.5">
        <div className="flex items-center gap-6">
          <label className={`inline-flex items-center gap-2 text-[14px] cursor-pointer ${isMain?'text-[#409eff]':'text-[#303133]'}`}>
            <input type="radio" checked={isMain} onChange={()=>switchMode('main')} className="accent-[#409eff]"/>主单</label>
          <label className={`inline-flex items-center gap-2 text-[14px] cursor-pointer ${!isMain?'text-[#409eff]':'text-[#303133]'}`}>
            <input type="radio" checked={!isMain} onChange={()=>switchMode('detail')} className="accent-[#409eff]"/>主单+明细</label>
          <span className="text-[13px] text-[#606266]">共 {total} 条</span>
        </div>
        <button onClick={fetch} title="刷新" className="rounded border border-[#dcdfe6] p-1.5 text-[#606266] hover:bg-[#f5f7fa]"><RefreshCw className="h-4 w-4"/></button>
      </div>

      {/* ── Table ── */}
      <div className="min-h-0 flex-1 overflow-auto">
      {isMain ? (
        <ErpTable>
          <ErpThead>
            <ErpTh className="w-[48px]"><Checkbox checked={items.length>0&&sel.size===items.length} onCheckedChange={toggleAll}/></ErpTh>
            <ErpTh className="w-[100px]">审批状态</ErpTh>
            <ErpTh className="w-[170px]">质检单号</ErpTh>
            <ErpTh className="w-[120px]">来源类型</ErpTh>
            <ErpTh className="w-[170px]">来源单号</ErpTh>
            <ErpTh className="w-[160px]">物料</ErpTh>
            <ErpTh className="w-[90px]">数量</ErpTh>
            <ErpTh className="w-[90px]">合格数</ErpTh>
            <ErpTh className="w-[90px]">不合格数</ErpTh>
            <ErpTh className="w-[100px]">检验员</ErpTh>
            <ErpTh className="w-[80px]">结果</ErpTh>
            <ErpTh className="w-[120px]">创建时间</ErpTh>
            <ErpTh className="w-[200px] sticky right-0 z-10 bg-[#f5f7fa]">操作</ErpTh>
          </ErpThead>
          <ErpTbody>
            {items.map(i=>{
              const st=i.approvalStatus;
              return (<ErpTr key={i.id}>
                <ErpTd><Checkbox checked={sel.has(i.id)} onCheckedChange={()=>toggleSel(i.id)}/></ErpTd>
                <ErpTd><ErpApproval status={st}/></ErpTd>
                <ErpTd><ErpLink onClick={()=>router.push(`/quality/inspection/${i.id}/edit`)}>{i.inspectionNo}</ErpLink></ErpTd>
                <ErpTd className="text-[#909399]">{i.sourceType==='PURCHASE_ORDER'?'采购质检':i.sourceType||'-'}</ErpTd>
                <ErpTd className="text-[#909399]">{i.sourceNo||'-'}</ErpTd>
                <ErpTd>{i.materialName||'-'}</ErpTd>
                <ErpTd>{i.quantity?Number(i.quantity).toLocaleString():'-'}</ErpTd>
                <ErpTd className="text-[#67c23a]">{i.qualifiedQty?Number(i.qualifiedQty).toLocaleString():'0'}</ErpTd>
                <ErpTd className="text-[#f56c6c]">{i.unqualifiedQty?Number(i.unqualifiedQty).toLocaleString():'0'}</ErpTd>
                <ErpTd>{i.inspector||'-'}</ErpTd>
                <ErpTd>{i.result||'-'}</ErpTd>
                <ErpTd className="text-[#909399]">{fmtDt(i.createdAt)}</ErpTd>
                <ErpTd className="sticky right-0 z-10 bg-white">
                  <ErpAction>
                    <ErpActionBtn onClick={()=>router.push(`/quality/inspection/${i.id}/edit`)}><Pencil className="h-3.5 w-3.5"/>修改</ErpActionBtn>
                    {st==='DRAFT'&&<ErpActionBtn danger onClick={()=>setDelId(i.id)}><Trash2 className="h-3.5 w-3.5"/>删除</ErpActionBtn>}
                    {st==='DRAFT'&&<ErpActionBtn onClick={()=>wf(i.id,'submit')}>提交</ErpActionBtn>}
                    {st==='SUBMITTED'&&<ErpActionBtn onClick={()=>wf(i.id,'approve')}>审核/生成入库</ErpActionBtn>}
                  </ErpAction>
                </ErpTd>
              </ErpTr>);
            })}
            {items.length===0&&<ErpEmpty colSpan={14}/>}
          </ErpTbody>
        </ErpTable>
      ) : (
        <ErpTable>
          <ErpThead>
            <ErpTh className="w-[48px]"><Checkbox checked={detailRows.length>0&&sel.size===detailRows.length} onCheckedChange={toggleAll}/></ErpTh>
            <ErpTh className="w-[100px]">审批状态</ErpTh>
            <ErpTh className="w-[170px]">质检单号</ErpTh>
            <ErpTh className="w-[120px]">来源类型</ErpTh>
            <ErpTh className="w-[120px]">来源单号</ErpTh>
            <ErpTh className="w-[130px]">物料编码</ErpTh>
            <ErpTh className="w-[150px]">物料名称</ErpTh>
            <ErpTh className="w-[120px]">规格型号</ErpTh>
            <ErpTh className="w-[80px]">单位</ErpTh>
            <ErpTh className="w-[90px]">检验数量</ErpTh>
            <ErpTh className="w-[90px]">合格数量</ErpTh>
            <ErpTh className="w-[100px]">不合格数量</ErpTh>
            <ErpTh className="w-[80px]">结果</ErpTh>
            <ErpTh className="w-[200px] sticky right-0 z-10 bg-[#f5f7fa]">操作</ErpTh>
          </ErpThead>
          <ErpTbody>
            {detailRows.map(row=>{
              const st=row.approvalStatus;
              return (<ErpTr key={`${row.inspId}-${row.lineNo}`}>
                <ErpTd><Checkbox checked={sel.has(row.inspId)} onCheckedChange={()=>toggleSel(row.inspId)}/></ErpTd>
                <ErpTd><ErpApproval status={st}/></ErpTd>
                <ErpTd><ErpLink onClick={()=>router.push(`/quality/inspection/${row.inspId}/edit`)}>{row.inspectionNo}</ErpLink></ErpTd>
                <ErpTd className="text-[#909399]">{row.sourceType==='PURCHASE_ORDER'?'采购质检':row.sourceType||'-'}</ErpTd>
                <ErpTd className="text-[#409eff]">{row.sourceNo||'-'}</ErpTd>
                <ErpTd className="text-[#409eff]">{row.materialCode||'-'}</ErpTd>
                <ErpTd>{row.materialName||'-'}</ErpTd>
                <ErpTd className="text-[#909399]">{row.spec||'-'}</ErpTd>
                <ErpTd>{row.unit||'-'}</ErpTd>
                <ErpTd>{Number(row.inspectQty)>0?Number(row.inspectQty).toLocaleString():'-'}</ErpTd>
                <ErpTd className="text-[#67c23a]">{Number(row.qualifiedQty)>0?Number(row.qualifiedQty).toLocaleString():'-'}</ErpTd>
                <ErpTd className="text-[#f56c6c]">{Number(row.unqualifiedQty)>0?Number(row.unqualifiedQty).toLocaleString():'-'}</ErpTd>
                <ErpTd>{row.result==='QUALIFIED'?<span className="text-[#67c23a]">合格</span>:row.result==='UNQUALIFIED'?<span className="text-[#f56c6c]">不合格</span>:'-'}</ErpTd>
                <ErpTd className="sticky right-0 z-10 bg-white">
                  <ErpAction>
                    <ErpActionBtn onClick={()=>router.push(`/quality/inspection/${row.inspId}/edit`)}><Pencil className="h-3.5 w-3.5"/>查看质检</ErpActionBtn>
                    {st==='DRAFT'&&<ErpActionBtn onClick={()=>router.push(`/quality/inspection/${row.inspId}/edit`)}>修改质检</ErpActionBtn>}
                    {st==='APPROVED'&&<ErpActionBtn onClick={()=>pushInbound(row.inspId)}>下推入库单</ErpActionBtn>}
                  </ErpAction>
                </ErpTd>
              </ErpTr>);
            })}
            {detailRows.length===0&&<ErpEmpty colSpan={14}/>}
          </ErpTbody>
        </ErpTable>
      )}
      </div>

      <ErpPagination page={pg} pageSize={ps} total={total} onPage={setPg} onPageSize={v=>setPs(+v)}/>

      <AlertDialog open={!!delId} onOpenChange={()=>setDelId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader><AlertDialogTitle>确认删除？</AlertDialogTitle></AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>取消</AlertDialogCancel>
            <AlertDialogAction onClick={doDel} className="bg-[#f56c6c] text-white hover:bg-[#f56c6c]/90">删除</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

function FI({label,v,onChange,ph}:{label:string;v:string;onChange:(v:string)=>void;ph:string}){
  return <div className="flex items-center gap-1.5"><span className="text-[13px] text-muted-foreground w-[70px] text-right shrink-0">{label}</span><Input className="w-[140px] h-9 rounded-md border border-[#dcdfe6] bg-white px-3 text-[13px]" value={v} onChange={e=>onChange(e.target.value)} placeholder={ph}/></div>;
}
function FS({label,v,onChange}:{label:string;v:string;onChange:(v:string)=>void}){
  return <div className="flex items-center gap-1.5"><span className="text-[13px] text-muted-foreground w-[70px] text-right shrink-0">{label}</span><Select value={v||'ALL'} onValueChange={x=>onChange(!x||x==='ALL'?'':String(x))}><SelectTrigger className="w-[110px] h-9 rounded-md border border-[#dcdfe6] bg-white px-3 text-[13px]"><SelectValue/></SelectTrigger><SelectContent>{STATUS_OPTS.map(o=><SelectItem key={o.v} value={o.v}>{o.l}</SelectItem>)}</SelectContent></Select></div>;
}
