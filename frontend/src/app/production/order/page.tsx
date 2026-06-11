'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import api from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { toast } from '@/components/ui/toast';
import { ErpAction, ErpActionBtn, ErpApproval, ErpPagination, ErpTable, ErpTbody, ErpTd, ErpTh, ErpThead, ErpTr, ErpEmpty, ErpLink } from '@/components/ui/erp-table';
import { ChevronDown, MoreHorizontal, Pencil, Plus, RefreshCw, Search, Trash2 } from 'lucide-react';

/* ── types ── */
interface ProdLine { id:string; lineNo:number; materialCode:string|null; materialName:string|null; spec:string|null; unit:string|null; plannedQty:string|null; actualQty:string|null; }
interface MatLine  { id:string; lineNo:number; materialCode:string|null; materialName:string|null; spec:string|null; unit:string|null; quantity:string|null; issuedQty:string|null; }
interface ProdOrder {
  id:string; orderNo:string; orderName:string;
  materialName:string|null; quantity:string|null;
  departmentName:string|null; startDate:string|null; endDate:string|null;
  approvalStatus:string; businessStatus:string;
  remark:string|null; createdAt:string; createdBy?:string|null;
  lines?: ProdLine[]; materials?: MatLine[];
}

/* ── 主单+明细 row (flattened from lines) ── */
interface DetailRow {
  orderId:string; orderNo:string; orderName:string;
  departmentName:string|null; approvalStatus:string; businessStatus:string;
  createdAt:string;
  lineNo:number; productCode:string; productName:string; productSpec:string;
  productUnit:string; plannedQty:string; actualQty:string;
}

/* ── labels ── */
const AS_LABEL:Record<string,string> = { DRAFT:'草稿', SUBMITTED:'已提交', APPROVED:'已通过', REJECTED:'已拒绝' };
const BS_LABEL:Record<string,string> = { PENDING_ISSUE:'待开工', ISSUING:'领料中', IN_PRODUCTION:'生产中', PENDING_STOCK:'待入库', COMPLETED:'已完工' };
const BS_COLOR:Record<string,string> = {
  PENDING_ISSUE:'bg-[#fdf6ec] text-[#b88230] border-[#faecd8]',
  ISSUING:'bg-[#ecf5ff] text-[#409eff] border-[#d9ecff]',
  IN_PRODUCTION:'bg-[#e6f7ff] text-[#13c2c2] border-[#b5f5ec]',
  PENDING_STOCK:'bg-[#fdf6ec] text-[#b88230] border-[#faecd8]',
  COMPLETED:'bg-[#f0f9eb] text-[#67c23a] border-[#e1f3d8]',
};
const BS_STOCK:Record<string,{text:string;cls:string}> = {
  COMPLETED: {text:'已生成入库',cls:'text-[#67c23a]'},
  PENDING_STOCK: {text:'待生成入库',cls:'text-[#e6a23c]'},
};

function Badge(s:string, map:Record<string,string>, colors:Record<string,string>) {
  return <span className={`inline-flex rounded border px-2 py-0.5 text-[12px] ${colors[s]||'bg-[#f4f4f5] text-[#909399] border-[#e9e9eb]'}`}>{map[s]||s||'-'}</span>;
}
function StockLabel(s:string) {
  const cfg = BS_STOCK[s];
  if (cfg) return <span className={`text-[13px] ${cfg.cls}`}>{cfg.text}</span>;
  return <span className="text-[#c0c4cc] text-[13px]">-</span>;
}
function fmtDt(v:string|null) { return v ? new Date(v).toLocaleDateString('zh-CN') : '-'; }

/* ── main ═══ */
export default function ProductionOrderWorkbenchPage() {
  const router = useRouter();
  const [viewMode, setViewMode] = useState<'main'|'detail'>('main');
  const [items,setItems]=useState<ProdOrder[]>([]);
  const [detailRows,setDetailRows]=useState<DetailRow[]>([]);
  const [total,setTotal]=useState(0);
  const [pg,setPg]=useState(1); const [ps,setPs]=useState(30);
  const [sel,setSel]=useState<Set<string>>(new Set());
  const [delId,setDelId]=useState<string|null>(null);

  /* ── 主单 search ── */
  const [sm,setSM]=useState({status:'',code:'',name:'',dept:''});
  /* ── 明细 search ── */
  const [sd,setSD]=useState({apprStatus:'',bizStatus:'',code:'',name:'',prodCode:'',prodName:''});

  const isMain = viewMode==='main';

  const fetch = useCallback(async () => {
    const params:any = { page:pg, pageSize:ps };
    if (isMain) {
      if (sm.status) params.status = sm.status;
      if (sm.code) params.code = sm.code;
      if (sm.name) params.name = sm.name;
      if (sm.dept) params.departmentName = sm.dept;
    } else {
      params.mode = 'detail';
      if (sd.apprStatus) params.status = sd.apprStatus;
      if (sd.bizStatus) params.biz = sd.bizStatus;
      if (sd.code) params.code = sd.code;
      if (sd.name) params.name = sd.name;
      if (sd.prodCode) params.materialCode = sd.prodCode;
      if (sd.prodName) params.materialName = sd.prodName;
    }
    const {data} = await api.get('/production-orders',{params});
    const raw:ProdOrder[] = data.items||[];
    if (isMain) {
      setItems(raw); setTotal(data.total||0); setDetailRows([]);
    } else {
      // Flatten: each product line → one detail row
      const rows:DetailRow[] = [];
      for (const order of raw) {
        const lines = order.lines||[];
        if (lines.length>0) {
          for (const ln of lines) {
            rows.push({
              orderId:order.id, orderNo:order.orderNo, orderName:order.orderName,
              departmentName:order.departmentName,
              approvalStatus:order.approvalStatus, businessStatus:order.businessStatus,
              createdAt:order.createdAt,
              lineNo:ln.lineNo, productCode:ln.materialCode||'', productName:ln.materialName||'',
              productSpec:ln.spec||'', productUnit:ln.unit||'',
              plannedQty:ln.plannedQty||'0', actualQty:ln.actualQty||'0',
            });
          }
        } else {
          // No product lines → show header as one row
          rows.push({
            orderId:order.id, orderNo:order.orderNo, orderName:order.orderName,
            departmentName:order.departmentName,
            approvalStatus:order.approvalStatus, businessStatus:order.businessStatus,
            createdAt:order.createdAt,
            lineNo:1, productCode:'', productName:order.materialName||'', productSpec:'',
            productUnit:'', plannedQty:order.quantity||'0', actualQty:'0',
          });
        }
      }
      setDetailRows(rows); setTotal(rows.length); setItems([]);
    }
  },[isMain,pg,ps,sm,sd]);
  useEffect(()=>{fetch();},[fetch]);

  const toggleSel = (id:string) => setSel(p=>{const n=new Set(p); n.has(id)?n.delete(id):n.add(id); return n;});
  const toggleAll = () => setSel(p=>{
    const allIds = isMain ? items.map(i=>i.id) : detailRows.map(r=>r.orderId);
    return p.size===allIds.length ? new Set() : new Set(allIds);
  });

  const wf = async (id:string, a:'submit'|'approve'|'withdraw') => {
    try { await api.put(`/production-orders/${id}/${a}`); fetch(); }
    catch(e:any){ toast(e.response?.data?.message||'操作失败','error'); }
  };
  const batchWf = async (action:string, label:string) => {
    if (sel.size===0) return toast('请先勾选数据','info');
    let ok=0; const errs:string[]=[];
    for (const id of sel) {
      try { await api.put(`/production-orders/${id}/${action}`); ok++; }
      catch(e:any){ errs.push(e.response?.data?.message||'失败'); }
    }
    toast(`${label}: 成功${ok}`+(errs.length?`, 失败${errs.length}`:''), ok>0?'success':'error');
    setSel(new Set()); fetch();
  };
  const pushIssue = async (id:string) => {
    if (!confirm('确定下推领料单？')) return;
    try { await api.post(`/production-orders/${id}/generate-issue`); toast('领料单已生成','success'); fetch(); }
    catch(e:any){ toast(e.response?.data?.message||'下推失败','error'); }
  };
  const pushComplete = async (id:string) => {
    if (!confirm('确定下推完工报告？')) return;
    try { await api.post(`/production-orders/${id}/generate-complete-report`); toast('完工报告已生成','success'); fetch(); }
    catch(e:any){ toast(e.response?.data?.message||'下推失败','error'); }
  };
  const tryDel = (id:string) => {
    const item = items.find(i=>i.id===id);
    if (item && item.approvalStatus!=='DRAFT' && item.approvalStatus!=='REJECTED') return toast('只有草稿或已拒绝状态可删除','error');
    setDelId(id);
  };
  const doDel = async () => {
    if (!delId) return;
    try { await api.delete(`/production-orders/${delId}`); setDelId(null); setSel(new Set()); fetch(); }
    catch(e:any){ toast(e.response?.data?.message||'删除失败','error'); }
  };

  const selItem = isMain ? items.find(i=>sel.has(i.id)) : null;
  const single = sel.size===1;
  const multi = sel.size>0;

  /* ── Mode switch handler: reset everything ── */
  const switchMode = (m:'main'|'detail') => {
    setViewMode(m); setSel(new Set()); setPg(1); setTotal(0);
    if (m==='main') { setSM({status:'',code:'',name:'',dept:''}); }
    else { setSD({apprStatus:'',bizStatus:'',code:'',name:'',prodCode:'',prodName:''}); }
  };

  return (
    <div className="flex h-full min-h-0 flex-col rounded-lg border border-[#dcdfe6] bg-white">
      {/* ═══════════ Toolbar (per viewMode) ═══════════ */}
      <div className="flex shrink-0 items-center justify-between gap-2 border-b border-[#ebeef5] bg-white px-4 py-3">
        <div className="flex items-center gap-1.5">
          {isMain ? <>
            {/* ── 主单 toolbar ── */}
            <Button variant="outline" size="sm" className="gap-1" onClick={()=>router.push('/production/order/create')}>
              <Pencil className="h-3.5 w-3.5"/>业务引导</Button>
            <Button variant="secondary" size="sm" className="gap-1" onClick={()=>router.push('/production/order/create')}>
              <Plus className="h-3.5 w-3.5"/>新增</Button>
            <Button variant="outline" size="sm" className="gap-1 text-[#67c23a]" disabled={!single}
              onClick={()=>selItem&&router.push(`/production/order/${selItem.id}/edit`)}>
              <Pencil className="h-3.5 w-3.5"/>修改</Button>
            <Button variant="outline" size="sm" className="gap-1 text-[#f56c6c]" disabled={!single}
              onClick={()=>selItem&&tryDel(selItem.id)}>
              <Trash2 className="h-3.5 w-3.5"/>删除</Button>
            <DropdownMenu>
              <DropdownMenuTrigger className="inline-flex items-center gap-1 rounded-md border border-border bg-background px-3 h-9 text-[13px] font-medium shadow-sm hover:bg-accent hover:text-accent-foreground transition-colors disabled:opacity-50"
                disabled={!single}>
                <MoreHorizontal className="h-3.5 w-3.5"/>更多操作<ChevronDown className="h-3.5 w-3.5"/>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="start">
                {selItem?.approvalStatus==='DRAFT' && <DropdownMenuItem onClick={()=>{if(selItem)wf(selItem.id,'submit');}}>提交</DropdownMenuItem>}
                {selItem?.approvalStatus==='SUBMITTED' && <DropdownMenuItem onClick={()=>{if(selItem)wf(selItem.id,'withdraw');}}>撤回</DropdownMenuItem>}
                <DropdownMenuItem onClick={()=>toast('流程查看待接入','info')}>流程查看</DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </> : <>
            {/* ── 主单+明细 toolbar ── */}
            <DropdownMenu>
              <DropdownMenuTrigger className="inline-flex items-center gap-1 rounded-md border border-border bg-background px-3 h-9 text-[13px] font-medium shadow-sm hover:bg-accent hover:text-accent-foreground transition-colors disabled:opacity-50"
                disabled={!multi}>
                批量操作<ChevronDown className="h-3.5 w-3.5"/>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="start">
                <DropdownMenuItem onClick={()=>batchWf('start','批量开工')}>批量开工</DropdownMenuItem>
                <DropdownMenuItem onClick={()=>batchWf('complete','批量完工')}>批量完工</DropdownMenuItem>
                <DropdownMenuItem onClick={()=>{if(sel.size!==1)return toast('部分完工仅支持单选','info');batchWf('partial-complete','部分完工');}}>部分完工</DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
            <Button variant="secondary" size="sm" className="gap-1" onClick={()=>router.push('/production/order/create')}>
              <Plus className="h-3.5 w-3.5"/>新增</Button>
            <Button variant="outline" size="sm" className="gap-1 text-[#67c23a]" disabled={!single}
              onClick={()=>{const r=detailRows.find(d=>sel.has(d.orderId)); if(r)router.push(`/production/order/${r.orderId}/edit`);}}>
              <Pencil className="h-3.5 w-3.5"/>修改</Button>
            <Button variant="outline" size="sm" className="gap-1 text-[#f56c6c]" disabled={!single}
              onClick={()=>{const r=detailRows.find(d=>sel.has(d.orderId)); if(r)tryDel(r.orderId);}}>
              <Trash2 className="h-3.5 w-3.5"/>删除</Button>
            <DropdownMenu>
              <DropdownMenuTrigger className="inline-flex items-center gap-1 rounded-md border border-border bg-background px-3 h-9 text-[13px] font-medium shadow-sm hover:bg-accent hover:text-accent-foreground transition-colors disabled:opacity-50"
                disabled={!single}>
                <MoreHorizontal className="h-3.5 w-3.5"/>更多操作<ChevronDown className="h-3.5 w-3.5"/>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="start">
                <DropdownMenuItem onClick={()=>toast('齐套分析待接入','info')}>齐套分析</DropdownMenuItem>
                <DropdownMenuItem onClick={()=>toast('领料追溯待接入','info')}>领料追溯</DropdownMenuItem>
                <DropdownMenuItem onClick={()=>toast('全局联查待接入','info')}>全局联查</DropdownMenuItem>
                <DropdownMenuItem onClick={()=>{if(selItem)pushComplete(selItem.id);}}>完工报告</DropdownMenuItem>
                <DropdownMenuItem onClick={()=>toast('历史版本待接入','info')}>历史版本</DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </>}
        </div>
        <div className="flex items-center gap-1">
          <Button variant="ghost" size="sm" onClick={()=>{isMain?setSM({status:'',code:'',name:'',dept:''}):setSD({apprStatus:'',bizStatus:'',code:'',name:'',prodCode:'',prodName:''});setPg(1);}}>重置</Button>
          <DropdownMenu>
            <DropdownMenuTrigger className="inline-flex items-center gap-1 rounded-md px-2.5 h-7 text-[13px] font-medium hover:bg-accent">常用搜索方案<ChevronDown className="h-3.5 w-3.5"/></DropdownMenuTrigger>
            <DropdownMenuContent align="end"><DropdownMenuItem disabled>保存当前搜索</DropdownMenuItem></DropdownMenuContent>
          </DropdownMenu>
          <Button variant="default" size="sm" className="gap-1" onClick={()=>{setPg(1);fetch();}}><Search className="h-4 w-4"/>搜索</Button>
          <Button variant="outline" size="sm" onClick={()=>toast('高级搜索待接入','info')}>高级搜索</Button>
        </div>
      </div>

      {/* ═══════════ Search (per viewMode) ═══════════ */}
      <div className="shrink-0 border-b border-[#ebeef5] bg-[#fafafa] px-4 py-3">
      {isMain ? (
        <div className="flex items-center gap-4 flex-wrap">
          <FS label="状态" v={sm.status} opts={APPROVALS} onChange={v=>setSM({...sm,status:v})}/>
          <FI label="生产编号" v={sm.code} onChange={v=>setSM({...sm,code:v})} ph="生产编号"/>
          <FI label="生产名称" v={sm.name} onChange={v=>setSM({...sm,name:v})} ph="生产名称"/>
          <FI label="生产部门" v={sm.dept} onChange={v=>setSM({...sm,dept:v})} ph="生产部门"/>
        </div>
      ) : (
        <div className="flex flex-col gap-3">
          <div className="flex items-center gap-4 flex-wrap">
            <FS label="审批状态" v={sd.apprStatus} opts={APPROVALS} onChange={v=>setSD({...sd,apprStatus:v})}/>
            <FS label="生产状态" v={sd.bizStatus} opts={BIZ_OPTS} onChange={v=>setSD({...sd,bizStatus:v})}/>
            <FI label="生产编码" v={sd.code} onChange={v=>setSD({...sd,code:v})} ph="生产编码"/>
            <FI label="生产名称" v={sd.name} onChange={v=>setSD({...sd,name:v})} ph="生产名称"/>
          </div>
          <div className="flex items-center gap-4 flex-wrap">
            <FI label="生产单号" v={sd.code} onChange={v=>setSD({...sd,code:v})} ph="生产单号"/>
            <FI label="产品编码" v={sd.prodCode} onChange={v=>setSD({...sd,prodCode:v})} ph="产品编码"/>
            <FI label="产品名称" v={sd.prodName} onChange={v=>setSD({...sd,prodName:v})} ph="产品名称"/>
          </div>
        </div>
      )}
      </div>

      {/* ═══════════ Sub-toolbar: 主单/主单+明细 toggle ═══════════ */}
      <div className="flex shrink-0 items-center justify-between border-b border-[#ebeef5] bg-white px-4 py-2.5">
        <div className="flex items-center gap-6">
          <label className={`inline-flex items-center gap-2 text-[14px] cursor-pointer ${isMain?'text-[#409eff]':'text-[#303133]'}`}>
            <input type="radio" checked={isMain} onChange={()=>switchMode('main')} className="accent-[#409eff]"/>主单</label>
          <label className={`inline-flex items-center gap-2 text-[14px] cursor-pointer ${!isMain?'text-[#409eff]':'text-[#303133]'}`}>
            <input type="radio" checked={!isMain} onChange={()=>switchMode('detail')} className="accent-[#409eff]"/>主单+明细</label>
          <span className="text-[13px] text-[#606266]">共 {total} 条</span>
        </div>
        <div className="flex items-center gap-1">
          <Button variant="outline" size="sm" onClick={()=>toast('导出待接入','info')}>导出</Button>
          <button onClick={fetch} title="刷新" className="rounded border border-[#dcdfe6] p-1.5 text-[#606266] hover:bg-[#f5f7fa]"><RefreshCw className="h-4 w-4"/></button>
        </div>
      </div>

      {/* ═══════════ Table (per viewMode) ═══════════ */}
      <div className="min-h-0 flex-1 overflow-auto">
      {isMain ? (
        /* ── 主单 12 cols ── */
        <ErpTable>
          <ErpThead>
            <ErpTh className="w-[48px]"><Checkbox checked={items.length>0&&sel.size===items.length} onCheckedChange={toggleAll}/></ErpTh>
            <ErpTh className="w-[100px]">状态</ErpTh>
            <ErpTh className="w-[180px]">生产编号</ErpTh>
            <ErpTh className="w-[220px]">生产名称</ErpTh>
            <ErpTh className="w-[150px]">所属组织</ErpTh>
            <ErpTh className="w-[150px]">生产部门</ErpTh>
            <ErpTh className="w-[100px]">创建人</ErpTh>
            <ErpTh className="w-[130px]">创建日期</ErpTh>
            <ErpTh className="w-[160px]">备注</ErpTh>
            <ErpTh className="w-[80px]">附件</ErpTh>
            <ErpTh className="w-[220px] sticky right-0 z-10 bg-[#f5f7fa]">操作</ErpTh>
          </ErpThead>
          <ErpTbody>
            {items.map(item => (
              <ErpTr key={item.id}>
                <ErpTd><Checkbox checked={sel.has(item.id)} onCheckedChange={()=>toggleSel(item.id)}/></ErpTd>
                <ErpTd><ErpApproval status={item.approvalStatus}/></ErpTd>
                <ErpTd><ErpLink onClick={()=>router.push(`/production/order/${item.id}/edit`)}>{item.orderNo}</ErpLink></ErpTd>
                <ErpTd>{item.orderName||'-'}</ErpTd>
                <ErpTd className="text-[#606266]">默认企业</ErpTd>
                <ErpTd className="text-[#606266]">{item.departmentName||'-'}</ErpTd>
                <ErpTd>{item.createdBy||'测试用户(001test)'}</ErpTd>
                <ErpTd className="text-[#909399]">{fmtDt(item.createdAt)}</ErpTd>
                <ErpTd className="text-[#909399] max-w-[160px] truncate" title={item.remark||''}>{item.remark||'-'}</ErpTd>
                <ErpTd><span className="text-[#409eff] text-[13px] cursor-pointer hover:underline">📎</span></ErpTd>
                <ErpTd className="sticky right-0 z-10 bg-white">
                  <ErpAction>
                    <ErpActionBtn onClick={()=>router.push(`/production/order/${item.id}/edit`)}><Pencil className="h-3.5 w-3.5"/>修改</ErpActionBtn>
                    <ErpActionBtn danger onClick={()=>tryDel(item.id)}><Trash2 className="h-3.5 w-3.5"/>删除</ErpActionBtn>
                    <ErpActionBtn onClick={()=>switchMode('detail')}>明细</ErpActionBtn>
                    {item.approvalStatus==='DRAFT' && <ErpActionBtn onClick={()=>wf(item.id,'submit')}>提交</ErpActionBtn>}
                    {item.approvalStatus==='SUBMITTED' && <ErpActionBtn onClick={()=>wf(item.id,'withdraw')}>撤回</ErpActionBtn>}
                    {item.approvalStatus==='SUBMITTED' && <ErpActionBtn onClick={()=>wf(item.id,'approve')}>通过</ErpActionBtn>}
                    {item.approvalStatus==='APPROVED'&&(item.businessStatus==='PENDING_ISSUE'||item.businessStatus==='ISSUING')&&<ErpActionBtn onClick={()=>pushIssue(item.id)}>下推领料</ErpActionBtn>}
                    {item.approvalStatus==='APPROVED'&&item.businessStatus==='IN_PRODUCTION'&&<ErpActionBtn onClick={()=>pushComplete(item.id)}>下推完工</ErpActionBtn>}
                  </ErpAction>
                </ErpTd>
              </ErpTr>
            ))}
            {items.length===0 && <ErpEmpty colSpan={12}/>}
          </ErpTbody>
        </ErpTable>
      ) : (
        /* ── 主单+明细 16 cols ── */
        <ErpTable>
          <ErpThead>
            <ErpTh className="w-[48px]"><Checkbox checked={detailRows.length>0&&sel.size===detailRows.length} onCheckedChange={toggleAll}/></ErpTh>
            <ErpTh className="w-[60px]">阶层</ErpTh>
            <ErpTh className="w-[100px]">审批状态</ErpTh>
            <ErpTh className="w-[110px]">产品入库状态</ErpTh>
            <ErpTh className="w-[100px]">生产状态</ErpTh>
            <ErpTh className="w-[170px]">生产编码</ErpTh>
            <ErpTh className="w-[200px]">生产名称</ErpTh>
            <ErpTh className="w-[140px]">所属组织</ErpTh>
            <ErpTh className="w-[160px]">产品编码</ErpTh>
            <ErpTh className="w-[160px]">产品名称</ErpTh>
            <ErpTh className="w-[120px]">规格型号</ErpTh>
            <ErpTh className="w-[80px]">计量单位</ErpTh>
            <ErpTh className="w-[110px]">预计生产数量</ErpTh>
            <ErpTh className="w-[110px]">实际生产数量</ErpTh>
            <ErpTh className="w-[130px]">创建时间</ErpTh>
            <ErpTh className="w-[220px] sticky right-0 z-10 bg-[#f5f7fa]">操作</ErpTh>
          </ErpThead>
          <ErpTbody>
            {detailRows.map((row,idx) => {
              const st = row.approvalStatus; const biz = row.businessStatus;
              return (
              <ErpTr key={`${row.orderId}-${row.lineNo}`}>
                <ErpTd><Checkbox checked={sel.has(row.orderId)} onCheckedChange={()=>toggleSel(row.orderId)}/></ErpTd>
                <ErpTd className="text-[#909399]">{idx+1}</ErpTd>
                <ErpTd><ErpApproval status={st}/></ErpTd>
                <ErpTd>{StockLabel(biz)}</ErpTd>
                <ErpTd>{Badge(biz,BS_LABEL,BS_COLOR)}</ErpTd>
                <ErpTd><ErpLink onClick={()=>router.push(`/production/order/${row.orderId}/edit`)}>{row.orderNo}</ErpLink></ErpTd>
                <ErpTd>{row.orderName||'-'}</ErpTd>
                <ErpTd className="text-[#606266]">默认企业</ErpTd>
                <ErpTd className="text-[#409eff]">{row.productCode||'-'}</ErpTd>
                <ErpTd>{row.productName||'-'}</ErpTd>
                <ErpTd className="text-[#909399]">{row.productSpec||'-'}</ErpTd>
                <ErpTd>{row.productUnit||'-'}</ErpTd>
                <ErpTd>{Number(row.plannedQty)>0?Number(row.plannedQty).toLocaleString():'-'}</ErpTd>
                <ErpTd>{Number(row.actualQty)>0?Number(row.actualQty).toLocaleString():'-'}</ErpTd>
                <ErpTd className="text-[#909399]">{fmtDt(row.createdAt)}</ErpTd>
                <ErpTd className="sticky right-0 z-10 bg-white">
                  <ErpAction>
                    <ErpActionBtn onClick={()=>router.push(`/production/order/${row.orderId}/edit`)}><Pencil className="h-3.5 w-3.5"/>修改</ErpActionBtn>
                    <ErpActionBtn danger onClick={()=>tryDel(row.orderId)}><Trash2 className="h-3.5 w-3.5"/>删除</ErpActionBtn>
                    {/* APPROVED orders: modify/delete disabled per original system */}
                    <DropdownMenu>
                      <DropdownMenuTrigger className="inline-flex items-center gap-0.5 px-1 text-[13px] text-[#409eff] hover:opacity-80">更多<ChevronDown className="h-3 w-3"/></DropdownMenuTrigger>
                      <DropdownMenuContent align="end" className="w-[132px]">
                        <DropdownMenuItem onClick={()=>toast('齐套分析待接入','info')}>齐套分析</DropdownMenuItem>
                        <DropdownMenuItem onClick={()=>toast('领料追溯待接入','info')}>领料追溯</DropdownMenuItem>
                        <DropdownMenuItem onClick={()=>toast('全局联查待接入','info')}>全局联查</DropdownMenuItem>
                        <DropdownMenuItem onClick={()=>pushComplete(row.orderId)}>完工报告</DropdownMenuItem>
                        <DropdownMenuItem onClick={()=>toast('历史版本待接入','info')}>历史版本</DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </ErpAction>
                </ErpTd>
              </ErpTr>
            )})}
            {detailRows.length===0 && <ErpEmpty colSpan={16}/>}
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

/* ── options ── */
const APPROVALS = [{v:'ALL',l:'全部'},{v:'DRAFT',l:'草稿'},{v:'SUBMITTED',l:'已提交'},{v:'APPROVED',l:'已通过'},{v:'REJECTED',l:'已拒绝'}];
const BIZ_OPTS = [{v:'ALL',l:'全部'},{v:'PENDING_ISSUE',l:'待开工'},{v:'ISSUING',l:'领料中'},{v:'IN_PRODUCTION',l:'生产中'},{v:'PENDING_STOCK',l:'待入库'},{v:'COMPLETED',l:'已完工'}];

/* ── helpers ── */
function FI({label,v,onChange,ph}:{label:string;v:string;onChange:(v:string)=>void;ph:string}) {
  return <div className="flex items-center gap-1.5"><span className="text-[13px] text-muted-foreground w-[70px] text-right shrink-0">{label}</span><Input className="w-[140px] h-9 rounded-md border border-[#dcdfe6] bg-white px-3 text-[13px]" value={v} onChange={e=>onChange(e.target.value)} placeholder={ph}/></div>;
}
function FS({label,v,opts,onChange}:{label:string;v:string;opts:{v:string;l:string}[];onChange:(v:string)=>void}) {
  return <div className="flex items-center gap-1.5"><span className="text-[13px] text-muted-foreground w-[70px] text-right shrink-0">{label}</span><Select value={v||'ALL'} onValueChange={x=>onChange(!x||x==='ALL'?'':String(x))}><SelectTrigger className="w-[110px] h-9 rounded-md border border-[#dcdfe6] bg-white px-3 text-[13px]"><SelectValue/></SelectTrigger><SelectContent>{opts.map(o=><SelectItem key={o.v} value={o.v}>{o.l}</SelectItem>)}</SelectContent></Select></div>;
}
