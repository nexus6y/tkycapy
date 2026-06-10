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
import { Boxes, ChevronDown, Download, MoreHorizontal, Pencil, Plus, Printer, RefreshCw, Search, Settings, Trash2 } from 'lucide-react';

/* ── types ── */
interface ProdLine { id:string; lineNo:number; materialCode:string|null; materialName:string|null; spec:string|null; unit:string|null; plannedQty:string|null; actualQty:string|null; }
interface MatLine  { id:string; lineNo:number; materialCode:string|null; materialName:string|null; spec:string|null; unit:string|null; quantity:string|null; issuedQty:string|null; }
interface ProdOrder {
  id:string; orderNo:string; orderName:string;
  materialId:string|null; materialName:string|null; quantity:string|null;
  departmentName:string|null; startDate:string|null; endDate:string|null;
  approvalStatus:string; businessStatus:string;
  remark:string|null; createdAt:string; createdBy?:string|null;
  lines?: ProdLine[]; materials?: MatLine[];
}

/* ── labels ── */
const AS:{[k:string]:string} = { DRAFT:'草稿', SUBMITTED:'已提交', APPROVED:'已通过', REJECTED:'已拒绝' };
const BS:{[k:string]:string} = { PENDING_ISSUE:'待开工', ISSUING:'领料中', IN_PRODUCTION:'生产中', PENDING_STOCK:'待入库', COMPLETED:'已完工' };
const BS_COLOR:{[k:string]:string} = {
  PENDING_ISSUE:'bg-[#fdf6ec] text-[#b88230] border-[#faecd8]',
  ISSUING:'bg-[#ecf5ff] text-[#409eff] border-[#d9ecff]',
  IN_PRODUCTION:'bg-[#e6f7ff] text-[#13c2c2] border-[#b5f5ec]',
  PENDING_STOCK:'bg-[#fdf6ec] text-[#b88230] border-[#faecd8]',
  COMPLETED:'bg-[#f0f9eb] text-[#67c23a] border-[#e1f3d8]',
};

function BizBadge(s:string) {
  return <span className={`inline-flex rounded border px-2 py-0.5 text-[12px] ${BS_COLOR[s]||'bg-[#f4f4f5] text-[#909399] border-[#e9e9eb]'}`}>{BS[s]||s||'-'}</span>;
}
function StockLabel(biz:string) {
  if (biz==='COMPLETED') return <span className="text-[13px] text-[#67c23a]">已生成入库</span>;
  if (biz==='PENDING_STOCK') return <span className="text-[13px] text-[#e6a23c]">待生成入库</span>;
  return <span className="text-[#c0c4cc]">-</span>;
}
function fmtDt(v:string|null) { return v ? new Date(v).toLocaleDateString('zh-CN') : '-'; }

/* ── page ── */
export default function ProductionOrderWorkbenchPage() {
  const router = useRouter();
  const [items,setItems]=useState<ProdOrder[]>([]); const [total,setTotal]=useState(0);
  const [pg,setPg]=useState(1); const [ps,setPs]=useState(30);
  const [detail,setDetail]=useState(false); // 主单(default) / 主单+明细
  const [sel,setSel]=useState<Set<string>>(new Set());
  const [delId,setDelId]=useState<string|null>(null);
  const [adv,setAdv]=useState(false);
  const [s,setS]=useState({status:'',biz:'',code:'',name:'',materialCode:'',materialName:'',deptName:'',startDate:'',endDate:''});

  const fetch = useCallback(async () => {
    const p:any = { page:pg, pageSize:ps };
    if (detail) p.mode = 'detail';
    Object.entries(s).forEach(([k,v])=>{if(v)p[k]=v;});
    const { data } = await api.get('/production-orders',{params:p});
    setItems(data.items||[]); setTotal(data.total||0);
  },[detail,pg,ps,s]);
  useEffect(()=>{fetch();},[fetch]);

  const reset = () => { setS({status:'',biz:'',code:'',name:'',materialCode:'',materialName:'',deptName:'',startDate:'',endDate:''}); setAdv(false); setPg(1); };
  const toggleSel = (id:string) => setSel(p=>{const n=new Set(p); n.has(id)?n.delete(id):n.add(id); return n;});
  const toggleAll = () => setSel(p=>p.size===items.length?new Set():new Set(items.map(i=>i.id)));

  const wf = async (id:string, a:'submit'|'approve'|'withdraw') => {
    try { await api.put(`/production-orders/${id}/${a}`); fetch(); }
    catch(e:any){ toast(e.response?.data?.message||'操作失败','error'); }
  };
  const batchProductionAction = async (action:'start'|'complete'|'partial-complete', label:string) => {
    if (sel.size===0) return toast('请先勾选数据','info');
    let ok=0; const errs:string[]=[];
    for (const id of sel) {
      try {
        await api.put(`/production-orders/${id}/${action}`);
        ok++;
      } catch(e:any) {
        errs.push(e.response?.data?.message||'失败');
      }
    }
    toast(`${label}: 成功${ok}`+(errs.length?`, 失败${errs.length}`:''), ok>0?'success':'error');
    setSel(new Set()); fetch();
  };
  const pushIssue = async (id:string) => {
    if (!confirm('确定下推领料单？将从材料明细生成领料单。')) return;
    try { await api.post(`/production-orders/${id}/generate-issue`); toast('领料单已生成','success'); fetch(); }
    catch(e:any){ toast(e.response?.data?.message||'下推失败','error'); }
  };
  const pushComplete = async (id:string) => {
    if (!confirm('确定下推完工报告？')) return;
    try { await api.post(`/production-orders/${id}/generate-complete-report`); toast('完工报告已生成','success'); fetch(); }
    catch(e:any){ toast(e.response?.data?.message||'下推失败','error'); }
  };
  const tryDel = (item:ProdOrder) => {
    if (item.approvalStatus!=='DRAFT' && item.approvalStatus!=='REJECTED') return toast('只有草稿或已拒绝状态可删除','error');
    setDelId(item.id);
  };
  const doDel = async () => {
    if (!delId) return;
    try { await api.delete(`/production-orders/${delId}`); setDelId(null); setSel(new Set()); fetch(); }
    catch(e:any){ toast(e.response?.data?.message||'删除失败','error'); }
  };
  const selItem = items.find(i=>sel.has(i.id));

  // Derive: "修改"/"删除" → need exactly 1 selected
  const single = sel.size===1;
  // Derive: "批量操作" → need at least 1 selected
  const multi = sel.size>=1;

  return (
    <div className="flex h-full min-h-0 flex-col rounded-lg border border-[#dcdfe6] bg-white">
      {/* ──── Toolbar (原系统 el-button 风格) ──── */}
      <div className="flex shrink-0 items-center justify-between gap-2 border-b border-[#ebeef5] bg-white px-4 py-3">
        <div className="flex items-center gap-1.5">
          {/* 业务引导 → 下拉菜单 (不用 asChild 避免 button 嵌套) */}
          <DropdownMenu>
            <DropdownMenuTrigger className="inline-flex items-center gap-1 rounded-md border border-border bg-background px-3 h-9 text-[13px] font-medium shadow-sm hover:bg-accent hover:text-accent-foreground transition-colors">
              <Boxes className="h-3.5 w-3.5"/>业务引导<ChevronDown className="h-3.5 w-3.5"/>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start">
              <DropdownMenuItem onClick={()=>router.push('/production/order/create')}>向导式创建（选择BOM）</DropdownMenuItem>
              <DropdownMenuItem onClick={()=>router.push('/production/order/create')}>直接新增</DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
          {/* 批量操作 → 独立下拉菜单 (always visible) */}
          <DropdownMenu>
            <DropdownMenuTrigger className="inline-flex items-center gap-1 rounded-md border border-border bg-background px-3 h-9 text-[13px] font-medium shadow-sm hover:bg-accent hover:text-accent-foreground transition-colors">
              批量操作<ChevronDown className="h-3.5 w-3.5"/>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start">
              <DropdownMenuItem onClick={()=>batchProductionAction('start','批量开工')}>批量开工</DropdownMenuItem>
              <DropdownMenuItem onClick={()=>batchProductionAction('complete','批量完工')}>批量完工</DropdownMenuItem>
              <DropdownMenuItem onClick={()=>batchProductionAction('partial-complete','部分完工')}>部分完工</DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
          {/* [新增] */}
          <Button variant="secondary" size="sm" className="gap-1" onClick={()=>router.push('/production/order/create')}><Plus className="h-3.5 w-3.5"/>新增</Button>
          {/* [修改] */}
          <Button variant="outline" size="sm" className="gap-1" disabled={!single}
            onClick={()=>selItem&&router.push(`/production/order/${selItem.id}/edit`)}><Pencil className="h-3.5 w-3.5"/>修改</Button>
          {/* [删除] */}
          <Button variant="outline" size="sm" className="gap-1" disabled={!single}
            onClick={()=>selItem&&tryDel(selItem)}><Trash2 className="h-3.5 w-3.5"/>删除</Button>
          {/* [更多操作] → 工具栏级下拉 */}
          <DropdownMenu>
            <DropdownMenuTrigger className="inline-flex items-center gap-1 rounded-md border border-border bg-background px-3 h-9 text-[13px] font-medium shadow-sm hover:bg-accent hover:text-accent-foreground transition-colors disabled:opacity-50 disabled:pointer-events-none"
              disabled={!multi}>
              <MoreHorizontal className="h-3.5 w-3.5"/>更多操作<ChevronDown className="h-3.5 w-3.5"/>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start">
              <DropdownMenuItem onClick={()=>{
                if (!selItem) return toast('请先勾选一条数据','info');
                const st=selItem.approvalStatus; const biz=selItem.businessStatus;
                if (st==='APPROVED'&&(biz==='PENDING_ISSUE'||biz==='ISSUING')) pushIssue(selItem.id);
                else toast('请勾选已通过且待开工/领料中的订单','info');
              }}>下推领料</DropdownMenuItem>
              <DropdownMenuItem onClick={()=>{
                if (!selItem) return toast('请先勾选一条数据','info');
                const st=selItem.approvalStatus; const biz=selItem.businessStatus;
                if (st==='APPROVED'&&biz==='IN_PRODUCTION') pushComplete(selItem.id);
                else toast('请勾选已通过且生产中的订单','info');
              }}>下推完工</DropdownMenuItem>
              <DropdownMenuItem onClick={()=>window.print()}><Printer className="h-3.5 w-3.5 mr-1"/>打印</DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
        <div className="flex items-center gap-1.5">
          <Button variant="ghost" size="sm" onClick={reset}>重置</Button>
          <DropdownMenu>
            <DropdownMenuTrigger className="inline-flex items-center gap-1 rounded-md border border-border bg-background px-3 h-9 text-[13px] font-medium shadow-sm hover:bg-accent hover:text-accent-foreground transition-colors">
              常用搜索方案<ChevronDown className="h-3.5 w-3.5"/>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end"><DropdownMenuItem disabled>保存当前搜索</DropdownMenuItem></DropdownMenuContent>
          </DropdownMenu>
          <Button variant="default" size="sm" className="gap-1" onClick={()=>{setPg(1);fetch();}}><Search className="h-4 w-4"/>搜索</Button>
          <Button variant="outline" size="sm" onClick={()=>setAdv(!adv)}>高级搜索</Button>
        </div>
      </div>

      {/* ──── Search area ──── */}
      <div className="shrink-0 border-b border-[#ebeef5] bg-[#fafafa] px-4 py-3">
        <div className="grid grid-cols-4 gap-x-8 gap-y-3">
          <S label="审批状态" v={s.status} opts={AS} onChange={v=>setS({...s,status:v})}/>
          <S label="生产状态" v={s.biz} opts={BS} onChange={v=>setS({...s,biz:v})}/>
          <SI label="生产编码" v={s.code} onChange={v=>setS({...s,code:v})} ph="生产编码"/>
          <SI label="生产名称" v={s.name} onChange={v=>setS({...s,name:v})} ph="生产名称"/>
          {adv && <>
            <SI label="所属组织" v={s.deptName} onChange={v=>setS({...s,deptName:v})} ph="所属组织"/>
            <SI label="产品编码" v={s.materialCode} onChange={v=>setS({...s,materialCode:v})} ph="产品编码"/>
            <SI label="产品名称" v={s.materialName} onChange={v=>setS({...s,materialName:v})} ph="产品名称"/>
            <div className="flex items-center gap-3">
              <span className="w-[72px] shrink-0 text-right text-[14px] text-[#303133]">日期范围</span>
              <Input type="date" className="w-[130px] h-9 rounded-md border border-[#dcdfe6] bg-white px-3 text-[13px]" value={s.startDate} onChange={e=>setS({...s,startDate:e.target.value})}/>
              <span className="text-[#909399]">-</span>
              <Input type="date" className="w-[130px] h-9 rounded-md border border-[#dcdfe6] bg-white px-3 text-[13px]" value={s.endDate} onChange={e=>setS({...s,endDate:e.target.value})}/>
            </div>
          </>}
        </div>
      </div>

      {/* ──── Sub-toolbar: 主单/明细 + 刷新 ──── */}
      <div className="flex shrink-0 items-center justify-between border-b border-[#ebeef5] bg-white px-4 py-2.5">
        <div className="flex items-center gap-6">
          <label className="inline-flex items-center gap-2 text-[14px] text-[#303133]">
            <input type="radio" checked={!detail} onChange={()=>{setDetail(false);setPg(1);}} className="accent-[#409eff]"/>主单</label>
          <label className="inline-flex items-center gap-2 text-[14px] text-[#409eff]">
            <input type="radio" checked={detail} onChange={()=>{setDetail(true);setPg(1);}} className="accent-[#409eff]"/>主单+明细</label>
          <span className="text-[13px] text-[#606266]">共 {total} 条</span>
        </div>
        <div className="flex items-center gap-1">
          <Button variant="outline" size="sm" className="gap-1" onClick={()=>toast('导出待接入','info')}><Download className="h-3.5 w-3.5"/>导出</Button>
          <button onClick={fetch} title="刷新" className="rounded border border-[#dcdfe6] p-1.5 text-[#606266] hover:bg-[#f5f7fa]"><RefreshCw className="h-4 w-4"/></button>
          <button title="列设置" className="rounded border border-[#dcdfe6] p-1.5 text-[#606266] hover:bg-[#f5f7fa]" onClick={()=>toast('列设置待接入','info')}><Settings className="h-4 w-4"/></button>
        </div>
      </div>

      {/* ──── Table ──── */}
      <div className="min-h-0 flex-1 overflow-auto">
        <ErpTable>
          <ErpThead>
            <ErpTh className="w-[48px]"><Checkbox checked={items.length>0&&sel.size===items.length} onCheckedChange={toggleAll}/></ErpTh>
            <ErpTh className="w-[60px]">阶层</ErpTh>
            <ErpTh className="w-[110px]">审批状态</ErpTh>
            <ErpTh className="w-[120px]">产品入库状态</ErpTh>
            <ErpTh className="w-[110px]">生产状态</ErpTh>
            <ErpTh className="w-[170px]">生产编码</ErpTh>
            <ErpTh className="w-[220px]">生产名称</ErpTh>
            <ErpTh className="w-[150px]">产品名称</ErpTh>
            <ErpTh className="w-[120px]">生产数量</ErpTh>
            <ErpTh className="w-[140px]">所属组织</ErpTh>
            <ErpTh className="w-[100px]">开工日期</ErpTh>
            <ErpTh className="w-[100px]">完工日期</ErpTh>
            <ErpTh className="w-[260px] sticky right-0 z-10 bg-[#f5f7fa]">操作</ErpTh>
          </ErpThead>
          <ErpTbody>
            {items.map(item => {
              const st=item.approvalStatus; const biz=item.businessStatus;
              const showIssue = st==='APPROVED' && (biz==='PENDING_ISSUE'||biz==='ISSUING');
              const showComplete = st==='APPROVED' && biz==='IN_PRODUCTION';
              const hasSub = detail && ((item.lines&&item.lines.length>0)||(item.materials&&item.materials.length>0));
              return (<Fragment key={item.id}>
                {/* ── 主单行 ── */}
                <ErpTr className={hasSub?'border-b-0':''}>
                  <ErpTd><Checkbox checked={sel.has(item.id)} onCheckedChange={()=>toggleSel(item.id)}/></ErpTd>
                  <ErpTd className="text-[#909399]">0</ErpTd>
                  <ErpTd><ErpApproval status={st}/></ErpTd>
                  <ErpTd>{StockLabel(biz)}</ErpTd>
                  <ErpTd>{BizBadge(biz)}</ErpTd>
                  <ErpTd><ErpLink onClick={()=>router.push(`/production/order/${item.id}/edit`)}>{item.orderNo}</ErpLink></ErpTd>
                  <ErpTd>{item.orderName||'-'}</ErpTd>
                  <ErpTd>{item.materialName||'-'}</ErpTd>
                  <ErpTd>{item.quantity?Number(item.quantity).toLocaleString():'-'}</ErpTd>
                  <ErpTd className="text-[#606266]">{item.departmentName||'-'}</ErpTd>
                  <ErpTd className="text-[#909399]">{fmtDt(item.startDate)}</ErpTd>
                  <ErpTd className="text-[#909399]">{fmtDt(item.endDate)}</ErpTd>
                  <ErpTd className="sticky right-0 z-10 bg-white">
                    <ErpAction>
                      <ErpActionBtn onClick={()=>router.push(`/production/order/${item.id}/edit`)}><Pencil className="h-3.5 w-3.5"/>修改</ErpActionBtn>
                      <ErpActionBtn danger onClick={()=>tryDel(item)}><Trash2 className="h-3.5 w-3.5"/>删除</ErpActionBtn>
                      {st==='DRAFT' && <ErpActionBtn onClick={()=>wf(item.id,'submit')}>提交</ErpActionBtn>}
                      {st==='SUBMITTED' && <ErpActionBtn onClick={()=>wf(item.id,'approve')}>通过</ErpActionBtn>}
                      {st==='SUBMITTED' && <ErpActionBtn onClick={()=>wf(item.id,'withdraw')}>撤回</ErpActionBtn>}
                      {showIssue && <ErpActionBtn onClick={()=>pushIssue(item.id)}>下推领料</ErpActionBtn>}
                      {showComplete && <ErpActionBtn onClick={()=>pushComplete(item.id)}>下推完工</ErpActionBtn>}
                      <DropdownMenu>
                        <DropdownMenuTrigger className="inline-flex items-center gap-0.5 px-1 text-[13px] text-[#409eff] hover:opacity-80">更多<ChevronDown className="h-3 w-3"/></DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="w-[132px]">
                          <DropdownMenuItem onClick={()=>toast('齐套分析待接入','info')}>齐套分析</DropdownMenuItem>
                          <DropdownMenuItem onClick={()=>router.push('/production/issue-trace')}>领料追溯</DropdownMenuItem>
                          {showComplete && <DropdownMenuItem onClick={()=>pushComplete(item.id)}>完工报告</DropdownMenuItem>}
                          <DropdownMenuItem onClick={()=>toast('全局联查待接入','info')}>全局联查</DropdownMenuItem>
                          <DropdownMenuItem onClick={()=>window.print()}><Printer className="h-3.5 w-3.5 mr-1"/>打印</DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </ErpAction>
                  </ErpTd>
                </ErpTr>

                {/* ── 主单+明细: 产品子行 (成品明细) ── */}
                {detail && item.lines?.map(ln=>(
                  <ErpTr key={`p-${ln.id||ln.lineNo}`} className="bg-[#f8fffb]">
                    <ErpTd/>
                    <ErpTd className="text-[#909399]">产品{ln.lineNo}</ErpTd>
                    <ErpTd/>
                    <ErpTd/>
                    <ErpTd><span className="text-[12px] text-[#67c23a]">成品明细</span></ErpTd>
                    <ErpTd className="text-[12px]">{ln.materialCode||'-'}</ErpTd>
                    <ErpTd className="text-[12px]">{ln.materialName||'-'}</ErpTd>
                    <ErpTd className="text-[12px] text-[#909399]">{ln.spec||'-'}</ErpTd>
                    <ErpTd className="text-[12px]">{ln.plannedQty?`${Number(ln.plannedQty).toLocaleString()} ${ln.unit||''}`:'-'}</ErpTd>
                    <ErpTd/>
                    <ErpTd/>
                    <ErpTd/>
                    <ErpTd className="sticky right-0 z-10 bg-[#f8fffb]"/>
                  </ErpTr>
                ))}

                {/* ── 主单+明细: 材料子行 (材料明细) ── */}
                {detail && item.materials?.map(ln=>(
                  <ErpTr key={`m-${ln.id||ln.lineNo}`} className="bg-[#f8f9ff]">
                    <ErpTd/>
                    <ErpTd className="text-[#909399]">材料{ln.lineNo}</ErpTd>
                    <ErpTd/>
                    <ErpTd/>
                    <ErpTd><span className="text-[12px] text-[#409eff]">材料明细</span></ErpTd>
                    <ErpTd className="text-[12px]">{ln.materialCode||'-'}</ErpTd>
                    <ErpTd className="text-[12px]">{ln.materialName||'-'}</ErpTd>
                    <ErpTd className="text-[12px] text-[#909399]">{ln.spec||'-'}</ErpTd>
                    <ErpTd className="text-[12px]">{ln.quantity?`${Number(ln.quantity).toLocaleString()} ${ln.unit||''}`:'-'}</ErpTd>
                    <ErpTd/>
                    <ErpTd/>
                    <ErpTd/>
                    <ErpTd className="sticky right-0 z-10 bg-[#f8f9ff]"/>
                  </ErpTr>
                ))}
              </Fragment>);
            })}
            {items.length===0 && <ErpEmpty colSpan={14}/>}
          </ErpTbody>
        </ErpTable>
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

/* ── search helpers ── */
function SI({label,v,onChange,ph}:{label:string;v:string;onChange:(v:string)=>void;ph:string}) {
  return <div className="flex items-center gap-3"><span className="w-[72px] shrink-0 text-right text-[14px] text-[#303133]">{label}</span><Input className="h-9 rounded-md border border-[#dcdfe6] bg-white px-3 text-[13px]" value={v} onChange={e=>onChange(e.target.value)} placeholder={ph}/></div>;
}
function S({label,v,opts,onChange}:{label:string;v:string;opts:{[k:string]:string};onChange:(v:string)=>void}) {
  return <div className="flex items-center gap-3"><span className="w-[72px] shrink-0 text-right text-[14px] text-[#303133]">{label}</span><Select value={v||'ALL'} onValueChange={x=>onChange(!x||x==='ALL'?'':String(x))}><SelectTrigger className="h-9 rounded-md border border-[#dcdfe6] bg-white px-3 text-[13px]"><SelectValue/></SelectTrigger><SelectContent><SelectItem value="ALL">全部</SelectItem>{Object.entries(opts).map(([k,l])=><SelectItem key={k} value={k}>{l}</SelectItem>)}</SelectContent></Select></div>;
}
