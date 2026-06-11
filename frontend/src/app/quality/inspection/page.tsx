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
import { ChevronDown, Download, MoreHorizontal, Pencil, Plus, Printer, RefreshCw, Search, Trash2 } from 'lucide-react';

/* ── types ── */
interface InspLine { id:string; lineNo:number; materialCode:string|null; materialName:string|null; spec:string|null; unit:string|null;
  inspectQty:string|null; qualifiedQty:string|null; unqualifiedQty:string|null; result:string|null; remark:string|null;
  inspectionMethod?:string; sampleRatio?:string; sampleQty?:string; sampleQualified?:string; sampleUnqualified?:string;
  unqualifiedRatio?:string; sourceLineNo?:string; batchNo?:string; sourceQty?:string; }
interface Inspection {
  id:string; inspectionNo:string; sourceType:string|null; sourceNo:string|null;
  materialName:string|null; quantity:string|null; qualifiedQty:string|null; unqualifiedQty:string|null;
  inspector:string|null; inspectionDate:string|null; result:string|null;
  approvalStatus:string; businessStatus:string; createdAt:string;
  lines?: InspLine[]; deptName?:string|null; remark?:string|null;
}
interface DetailRow {
  inspId:string; inspectionNo:string; sourceType:string|null; sourceNo:string|null;
  approvalStatus:string; businessStatus:string; createdAt:string;
  lineNo:number; materialCode:string; materialName:string; spec:string; unit:string;
  inspectQty:string; qualifiedQty:string; unqualifiedQty:string; result:string;
  sourceLineNo:string; batchNo:string; sourceQty:string;
  inspectionMethod:string; sampleRatio:string; sampleQty:string;
  sampleQualified:string; sampleUnqualified:string; unqualifiedRatio:string;
  orgName:string; projectCode:string; projectName:string;
  supplierCode:string; supplierName:string; inspector:string; inspectionDate:string;
}

/* ── labels ── */
const A_OPTS = [{v:'ALL',l:'全部'},{v:'DRAFT',l:'草稿'},{v:'SUBMITTED',l:'已提交'},{v:'APPROVED',l:'已通过'}];
const B_OPTS = [{v:'ALL',l:'全部'},{v:'PENDING',l:'待质检'},{v:'COMPLETED',l:'质检完成'}];
const BS_LABEL:Record<string,string>={PENDING:'待质检',COMPLETED:'质检完成'};

function fmtDt(v:string|null){return v?new Date(v).toLocaleDateString('zh-CN'):'-';}

export default function InspectionPage() {
  const router = useRouter();
  const [viewMode,setViewMode]=useState<'main'|'detail'>('detail');
  const [items,setItems]=useState<Inspection[]>([]);
  const [detailRows,setDetailRows]=useState<DetailRow[]>([]);
  const [total,setTotal]=useState(0);
  const [pg,setPg]=useState(1);const [ps,setPs]=useState(30);
  const [sel,setSel]=useState<Set<string>>(new Set());
  const [delId,setDelId]=useState<string|null>(null);
  const [adv,setAdv]=useState(false);
  /* ── search ── */
  const [s,setS]=useState({apprStatus:'',bizStatus:'',code:'',sourceNo:'',matCode:'',matName:'',spec:'',method:'',orgName:'',projectName:'',supplierName:'',inspDate:''});

  const isMain = viewMode==='main';

  const fetch = useCallback(async()=>{
    const p:any={page:pg,pageSize:ps,mode:'detail'};
    if(s.apprStatus)p.status=s.apprStatus; if(s.code)p.code=s.code;
    if(s.matCode)p.materialCode=s.matCode; if(s.matName)p.materialName=s.matName;
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
              sourceLineNo:ln.sourceLineNo||'',batchNo:ln.batchNo||'',
              sourceQty:ln.sourceQty||'',inspectionMethod:ln.inspectionMethod||'',
              sampleRatio:ln.sampleRatio||'',sampleQty:ln.sampleQty||'',
              sampleQualified:ln.sampleQualified||'',sampleUnqualified:ln.sampleUnqualified||'',
              unqualifiedRatio:ln.unqualifiedRatio||'',
              orgName:'默认企业',projectCode:'',projectName:'',
              supplierCode:'',supplierName:'',
              inspector:insp.inspector||'',inspectionDate:insp.inspectionDate||'',
            });
          }
        }else{
          rows.push({
            inspId:insp.id,inspectionNo:insp.inspectionNo,
            sourceType:insp.sourceType,sourceNo:insp.sourceNo,
            approvalStatus:insp.approvalStatus,businessStatus:insp.businessStatus,
            createdAt:insp.createdAt,lineNo:1,
            materialCode:'',materialName:insp.materialName||'',spec:'',unit:'',
            inspectQty:insp.quantity||'0',qualifiedQty:insp.qualifiedQty||'0',
            unqualifiedQty:insp.unqualifiedQty||'0',result:insp.result||'',
            sourceLineNo:'',batchNo:'',sourceQty:insp.quantity||'0',
            inspectionMethod:'',sampleRatio:'',sampleQty:'',
            sampleQualified:'',sampleUnqualified:'',unqualifiedRatio:'',
            orgName:'默认企业',projectCode:'',projectName:'',
            supplierCode:'',supplierName:'',
            inspector:insp.inspector||'',inspectionDate:insp.inspectionDate||'',
          });
        }
      }
      setDetailRows(rows);setTotal(rows.length);setItems([]);
    }
  },[isMain,pg,ps,s]);
  useEffect(()=>{fetch();},[fetch]);

  const reset=()=>{setS({apprStatus:'',bizStatus:'',code:'',sourceNo:'',matCode:'',matName:'',spec:'',method:'',orgName:'',projectName:'',supplierName:'',inspDate:''});setAdv(false);setPg(1);};
  const toggleSel=(id:string)=>setSel(p=>{const n=new Set(p);n.has(id)?n.delete(id):n.add(id);return n;});
  const toggleAll=()=>{const allIds=isMain?items.map(i=>i.id):detailRows.map(r=>r.inspId);setSel(p=>p.size===allIds.length?new Set():new Set(allIds));};

  /* ── workflow ── */
  const wf=async(id:string,action:'submit'|'approve'|'reject')=>{
    try{await api.put(`/inspections/${id}/${action}`);fetch();}
    catch(e:any){toast(e.response?.data?.message||'操作失败','error');}
  };
  const batchQualify=async()=>{
    if(sel.size===0)return toast('请先勾选数据','info');
    let ok=0;
    for(const id of sel){
      try{await api.put(`/inspections/${id}`,{result:'QUALIFIED'});ok++;}
      catch(e:any){toast(e.response?.data?.message||'批量合格失败','error');}
    }
    if(ok>0)toast(`批量合格: ${ok}条`,'success');
    setSel(new Set());fetch();
  };
  const pushInbound=(id:string)=>{
    if(!confirm('确定下推入库单？合格品将生成入库单。'))return;
    wf(id,'approve');
  };
  const switchMode=(m:'main'|'detail')=>{setViewMode(m);setSel(new Set());setPg(1);};
  const doDel=async()=>{if(!delId)return;try{await api.delete(`/inspections/${delId}`);setDelId(null);fetch();}catch(e:any){toast(e.response?.data?.message||'删除失败','error');}};

  const selItem=items.find(i=>sel.has(i.id));
  const single=sel.size===1;const multi=sel.size>0;

  return (
    <div className="flex h-full min-h-0 flex-col rounded-lg border border-[#dcdfe6] bg-white">
      {/* ═══ TOOLBAR: 新增|修改|删除|质检|下推入库单|导出|打印 ═══ */}
      <div className="flex shrink-0 items-center justify-between gap-2 border-b border-[#ebeef5] bg-white px-4 py-3">
        <div className="flex items-center gap-1.5">
          <Button variant="secondary" size="sm" className="gap-1" onClick={()=>router.push('/quality/inspection/create')}><Plus className="h-3.5 w-3.5"/>新增</Button>
          <Button variant="outline" size="sm" className="gap-1 text-[#67c23a]" disabled={!single}
            onClick={()=>selItem&&router.push(`/quality/inspection/${selItem.id}/edit`)}><Pencil className="h-3.5 w-3.5"/>修改</Button>
          <Button variant="outline" size="sm" className="gap-1 text-[#f56c6c]" disabled={!single}
            onClick={()=>{if(selItem&&selItem.approvalStatus==='DRAFT')setDelId(selItem.id);else toast('只有草稿状态可删除','error');}}><Trash2 className="h-3.5 w-3.5"/>删除</Button>
          {!isMain && <Button variant="outline" size="sm" className="gap-1" onClick={batchQualify}>质检</Button>}
          <Button variant="outline" size="sm" className="gap-1" disabled={!single}
            onClick={()=>{if(selItem&&selItem.approvalStatus==='APPROVED')pushInbound(selItem.id);else toast('请选择已通过的质检单','info');}}>
            <Download className="h-3.5 w-3.5 mr-0.5"/>下推入库单</Button>
          <Button variant="outline" size="sm" className="gap-1" onClick={()=>toast('导出待接入','info')}><Download className="h-3.5 w-3.5 mr-0.5"/>导出</Button>
          <Button variant="outline" size="sm" className="gap-1 text-[#67c23a]" disabled onClick={()=>toast('打印待接入','info')}><Printer className="h-3.5 w-3.5 mr-0.5"/>打印</Button>
        </div>
        <div className="flex items-center gap-1">
          <Button variant="ghost" size="sm" onClick={reset}>重置</Button>
          <DropdownMenu>
            <DropdownMenuTrigger className="inline-flex items-center gap-1 rounded-md px-2.5 h-7 text-[13px] font-medium hover:bg-accent">常用搜索方案<ChevronDown className="h-3.5 w-3.5"/></DropdownMenuTrigger>
            <DropdownMenuContent align="end"><DropdownMenuItem disabled>保存当前搜索</DropdownMenuItem></DropdownMenuContent>
          </DropdownMenu>
          <Button variant="default" size="sm" className="gap-1" onClick={()=>{setPg(1);fetch();}}><Search className="h-4 w-4"/>搜索</Button>
          <Button variant="outline" size="sm" onClick={()=>setAdv(!adv)}>{adv?'收起':'展开'}</Button>
        </div>
      </div>

      {/* ═══ SEARCH ARRAY: 12 conditions (高级搜索可展开) ═══ */}
      <div className="shrink-0 border-b border-[#ebeef5] bg-[#fafafa] px-4 py-3">
        <div className="space-y-3">
          <div className="flex items-center gap-4 flex-wrap">
            <FS label="审批状态" v={s.apprStatus} opts={A_OPTS} onChange={v=>setS({...s,apprStatus:v})}/>
            <FS label="业务状态" v={s.bizStatus} opts={B_OPTS} onChange={v=>setS({...s,bizStatus:v})}/>
            <FI label="质检单号" v={s.code} onChange={v=>setS({...s,code:v})} ph="质检单号"/>
            <FI label="来源单号" v={s.sourceNo} onChange={v=>setS({...s,sourceNo:v})} ph="来源单号"/>
            <FI label="物料编码" v={s.matCode} onChange={v=>setS({...s,matCode:v})} ph="物料编码"/>
            <FI label="物料名称" v={s.matName} onChange={v=>setS({...s,matName:v})} ph="物料名称"/>
          </div>
          {adv && (
            <div className="flex items-center gap-4 flex-wrap">
              <FI label="规格型号" v={s.spec} onChange={v=>setS({...s,spec:v})} ph="规格型号"/>
              <FS label="质检方式" v={s.method} opts={[{v:'ALL',l:'全部'},{v:'抽检',l:'抽检'},{v:'全检',l:'全检'}]} onChange={v=>setS({...s,method:v})}/>
              <FI label="项目名称" v={s.projectName} onChange={v=>setS({...s,projectName:v})} ph="项目名称"/>
              <FI label="供应商名称" v={s.supplierName} onChange={v=>setS({...s,supplierName:v})} ph="供应商名称"/>
              <div className="flex items-center gap-1.5"><span className="text-[13px] text-muted-foreground w-[70px] text-right shrink-0">质检日期</span><Input type="date" className="w-[140px] h-9 rounded-md border border-[#dcdfe6] bg-white px-3 text-[13px]" value={s.inspDate} onChange={e=>setS({...s,inspDate:e.target.value})}/></div>
            </div>
          )}
        </div>
      </div>

      {/* ═══ SUB-TOOLBAR: 主单/主单+明细 toggle ═══ */}
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

      {/* ═══ TABLE ═══ */}
      <div className="min-h-0 flex-1 overflow-auto">
      {isMain ? (
        /* ── 主单: 10 cols ── */
        <ErpTable>
          <ErpThead>
            <ErpTh className="w-[48px]"><Checkbox checked={items.length>0&&sel.size===items.length} onCheckedChange={toggleAll}/></ErpTh>
            <ErpTh className="w-[100px]">审批状态</ErpTh>
            <ErpTh className="w-[90px]">业务状态</ErpTh>
            <ErpTh className="w-[170px]">质检单号</ErpTh>
            <ErpTh className="w-[100px]">质检来源</ErpTh>
            <ErpTh className="w-[120px]">质检部门</ErpTh>
            <ErpTh className="w-[90px]">质检负责人</ErpTh>
            <ErpTh className="w-[130px]">质检完成日期</ErpTh>
            <ErpTh className="w-[90px]">创建人</ErpTh>
            <ErpTh className="w-[140px]">备注</ErpTh>
            <ErpTh className="w-[200px] sticky right-0 z-10 bg-[#f5f7fa]">操作</ErpTh>
          </ErpThead>
          <ErpTbody>
            {items.map(i=>{
              const st=i.approvalStatus;
              return (<ErpTr key={i.id}>
                <ErpTd><Checkbox checked={sel.has(i.id)} onCheckedChange={()=>toggleSel(i.id)}/></ErpTd>
                <ErpTd><ErpApproval status={st}/></ErpTd>
                <ErpTd><span className="text-[12px] text-muted-foreground">{BS_LABEL[i.businessStatus]||i.businessStatus||'-'}</span></ErpTd>
                <ErpTd><ErpLink onClick={()=>switchMode('detail')}>{i.inspectionNo}</ErpLink></ErpTd>
                <ErpTd className="text-[#909399]">{i.sourceType==='PURCHASE_ORDER'?'采购单':i.sourceType||'-'}</ErpTd>
                <ErpTd className="text-[#606266]">{i.deptName||'测试质检部'}</ErpTd>
                <ErpTd>{i.inspector||'-'}</ErpTd>
                <ErpTd className="text-[#909399]">{i.inspectionDate?fmtDt(i.inspectionDate):'-'}</ErpTd>
                <ErpTd>测试用户</ErpTd>
                <ErpTd className="text-[#909399] max-w-[140px] truncate">{i.remark||'-'}</ErpTd>
                <ErpTd className="sticky right-0 z-10 bg-white">
                  <ErpAction>
                    <ErpActionBtn onClick={()=>router.push(`/quality/inspection/${i.id}/edit`)}><Pencil className="h-3.5 w-3.5"/>修改</ErpActionBtn>
                    {st==='DRAFT'&&<ErpActionBtn onClick={()=>wf(i.id,'submit')}>提交</ErpActionBtn>}
                    {st==='SUBMITTED'&&<ErpActionBtn onClick={()=>wf(i.id,'approve')}>审核通过</ErpActionBtn>}
                    {st==='APPROVED'&&<ErpActionBtn onClick={()=>pushInbound(i.id)}>下推入库单</ErpActionBtn>}
                  </ErpAction>
                </ErpTd>
              </ErpTr>);
            })}
            {items.length===0&&<ErpEmpty colSpan={11}/>}
          </ErpTbody>
        </ErpTable>
      ) : (
        /* ── 主单+明细: 29 cols matching original ── */
        <ErpTable>
          <ErpThead>
            <ErpTh className="w-[48px]"><Checkbox checked={detailRows.length>0&&sel.size===detailRows.length} onCheckedChange={toggleAll}/></ErpTh>
            <ErpTh className="w-[100px]">审批状态</ErpTh>
            <ErpTh className="w-[90px]">业务状态</ErpTh>
            <ErpTh className="w-[170px]">质检单号</ErpTh>
            <ErpTh className="w-[90px]">质检来源</ErpTh>
            <ErpTh className="w-[130px]">来源单号</ErpTh>
            <ErpTh className="w-[80px]">来源行号</ErpTh>
            <ErpTh className="w-[100px]">批号</ErpTh>
            <ErpTh className="w-[130px]">物料编码</ErpTh>
            <ErpTh className="w-[140px]">物料名称</ErpTh>
            <ErpTh className="w-[120px]">规格型号</ErpTh>
            <ErpTh className="w-[80px]">计量单位</ErpTh>
            <ErpTh className="w-[90px]">单据原量</ErpTh>
            <ErpTh className="w-[100px]">本次可质检数量</ErpTh>
            <ErpTh className="w-[80px]">质检方式</ErpTh>
            <ErpTh className="w-[80px]">抽检比例</ErpTh>
            <ErpTh className="w-[80px]">抽样数量</ErpTh>
            <ErpTh className="w-[90px]">抽样合格数量</ErpTh>
            <ErpTh className="w-[100px]">抽样不合格数量</ErpTh>
            <ErpTh className="w-[80px]">不合格比例</ErpTh>
            <ErpTh className="w-[100px]">不合格比例下限</ErpTh>
            <ErpTh className="w-[80px]">质检结果</ErpTh>
            <ErpTh className="w-[90px]">总合格数量</ErpTh>
            <ErpTh className="w-[100px]">总不合格品数量</ErpTh>
            <ErpTh className="w-[110px]">所属组织</ErpTh>
            <ErpTh className="w-[120px]">项目编码</ErpTh>
            <ErpTh className="w-[120px]">项目名称</ErpTh>
            <ErpTh className="w-[120px]">供应商编码</ErpTh>
            <ErpTh className="w-[120px]">供应商名称</ErpTh>
            <ErpTh className="w-[90px]">质检负责人</ErpTh>
            <ErpTh className="w-[120px]">质检日期</ErpTh>
            <ErpTh className="w-[200px] sticky right-0 z-10 bg-[#f5f7fa]">操作</ErpTh>
          </ErpThead>
          <ErpTbody>
            {detailRows.map(row=>{
              const st=row.approvalStatus;
              return (<ErpTr key={`${row.inspId}-${row.lineNo}`}>
                <ErpTd><Checkbox checked={sel.has(row.inspId)} onCheckedChange={()=>toggleSel(row.inspId)}/></ErpTd>
                <ErpTd><ErpApproval status={st}/></ErpTd>
                <ErpTd><span className="text-[12px] text-muted-foreground">{BS_LABEL[row.businessStatus]||row.businessStatus||'-'}</span></ErpTd>
                <ErpTd><ErpLink onClick={()=>router.push(`/quality/inspection/${row.inspId}/edit`)}>{row.inspectionNo}</ErpLink></ErpTd>
                <ErpTd className="text-[#909399]">{row.sourceType==='PURCHASE_ORDER'?'采购单':row.sourceType||'-'}</ErpTd>
                <ErpTd className="text-[#409eff]">{row.sourceNo||'-'}</ErpTd>
                <ErpTd className="text-[#909399]">{row.sourceLineNo||'-'}</ErpTd>
                <ErpTd className="text-[#909399]">{row.batchNo||'-'}</ErpTd>
                <ErpTd className="text-[#409eff]">{row.materialCode||'-'}</ErpTd>
                <ErpTd>{row.materialName||'-'}</ErpTd>
                <ErpTd className="text-[#909399]">{row.spec||'-'}</ErpTd>
                <ErpTd>{row.unit||'-'}</ErpTd>
                <ErpTd>{row.sourceQty?Number(row.sourceQty).toLocaleString():'-'}</ErpTd>
                <ErpTd>{Number(row.inspectQty)>0?Number(row.inspectQty).toLocaleString():'-'}</ErpTd>
                <ErpTd>{row.inspectionMethod||'-'}</ErpTd>
                <ErpTd>{row.sampleRatio||'-'}</ErpTd>
                <ErpTd>{row.sampleQty||'-'}</ErpTd>
                <ErpTd className="text-[#67c23a]">{row.sampleQualified||'-'}</ErpTd>
                <ErpTd className="text-[#f56c6c]">{row.sampleUnqualified||'-'}</ErpTd>
                <ErpTd>{row.unqualifiedRatio||'-'}</ErpTd>
                <ErpTd>{'-'}</ErpTd>
                <ErpTd>{row.result==='QUALIFIED'?<span className="text-[#67c23a]">合格</span>:row.result==='UNQUALIFIED'?<span className="text-[#f56c6c]">不合格</span>:row.result||'-'}</ErpTd>
                <ErpTd className="text-[#67c23a]">{Number(row.qualifiedQty)>0?Number(row.qualifiedQty).toLocaleString():'-'}</ErpTd>
                <ErpTd className="text-[#f56c6c]">{Number(row.unqualifiedQty)>0?Number(row.unqualifiedQty).toLocaleString():'-'}</ErpTd>
                <ErpTd className="text-[#606266]">{row.orgName||'-'}</ErpTd>
                <ErpTd className="text-[#409eff]">{row.projectCode||'-'}</ErpTd>
                <ErpTd>{row.projectName||'-'}</ErpTd>
                <ErpTd className="text-[#409eff]">{row.supplierCode||'-'}</ErpTd>
                <ErpTd>{row.supplierName||'-'}</ErpTd>
                <ErpTd>{row.inspector||'-'}</ErpTd>
                <ErpTd className="text-[#909399]">{row.inspectionDate?fmtDt(row.inspectionDate):'-'}</ErpTd>
                <ErpTd className="sticky right-0 z-10 bg-white">
                  <ErpAction>
                    <ErpActionBtn onClick={()=>{toast('质检填报页待接入，请点击编辑进入','info');router.push(`/quality/inspection/${row.inspId}/edit`);}}>质检</ErpActionBtn>
                    <ErpActionBtn onClick={()=>router.push(`/quality/inspection/${row.inspId}/edit`)}>修改质检</ErpActionBtn>
                    <ErpActionBtn onClick={()=>{toast('查看质检详情','info');}}>查看质检</ErpActionBtn>
                    {st==='APPROVED'&&<ErpActionBtn onClick={()=>pushInbound(row.inspId)}>下推入库单</ErpActionBtn>}
                  </ErpAction>
                </ErpTd>
              </ErpTr>);
            })}
            {detailRows.length===0&&<ErpEmpty colSpan={32}/>}
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
function FS({label,v,opts,onChange}:{label:string;v:string;opts:{v:string;l:string}[];onChange:(v:string)=>void}){
  return <div className="flex items-center gap-1.5"><span className="text-[13px] text-muted-foreground w-[70px] text-right shrink-0">{label}</span><Select value={v||'ALL'} onValueChange={x=>onChange(!x||x==='ALL'?'':String(x))}><SelectTrigger className="w-[110px] h-9 rounded-md border border-[#dcdfe6] bg-white px-3 text-[13px]"><SelectValue/></SelectTrigger><SelectContent>{opts.map(o=><SelectItem key={o.v} value={o.v}>{o.l}</SelectItem>)}</SelectContent></Select></div>;
}
