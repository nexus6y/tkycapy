'use client';

import { useCallback, useEffect, useState } from 'react';
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
import { ChevronDown, MoreHorizontal, Pencil, Plus, RefreshCw, Search, Trash2 } from 'lucide-react';

interface ProdOrder {
  id:string; orderNo:string; orderName:string;
  materialName:string|null; quantity:string|null;
  departmentName:string|null; startDate:string|null; endDate:string|null;
  approvalStatus:string; businessStatus:string;
  remark:string|null; createdAt:string; createdBy?:string|null;
  productCode?:string; productName?:string; productSpec?:string;
  productUnit?:string; plannedQty?:string; actualQty?:string;
  qualifiedQty?:string; defectQty?:string; reworkQty?:string;
  completionRate?:string; stockInQty?:string;
  materialLines?:{lineNo:number;materialCode:string|null;materialName:string|null;spec:string|null;unit:string|null;quantity:string|null;warehouseCode:string|null;}[];
  productLines?:{lineNo:number;materialCode:string|null;materialName:string|null;spec:string|null;unit:string|null;plannedQty:string|null;actualQty:string|null;}[];
}

const STATUS_OPTS = [
  {v:'ALL',l:'全部'},{v:'DRAFT',l:'草稿'},{v:'SUBMITTED',l:'已提交'},
  {v:'APPROVED',l:'已通过'},{v:'REJECTED',l:'已拒绝'},
];

function fmtDt(v:string|null) { return v ? new Date(v).toLocaleDateString('zh-CN') : '-'; }

export default function ProductionOrderWorkbenchPage() {
  const router = useRouter();
  const [items,setItems]=useState<ProdOrder[]>([]); const [total,setTotal]=useState(0);
  const [pg,setPg]=useState(1); const [ps,setPs]=useState(30);
  const [detail,setDetail]=useState(false);
  const [sel,setSel]=useState<Set<string>>(new Set());
  const [delId,setDelId]=useState<string|null>(null);
  const [s,setS]=useState({status:'',code:'',name:'',deptName:'',orgName:'',createdBy:''});

  const fetch = useCallback(async () => {
    const p:any = { page:pg, pageSize:ps };
    if (detail) p.mode = 'detail';
    if (s.status) p.status = s.status;
    if (s.code) p.code = s.code;
    if (s.name) p.name = s.name;
    if (s.deptName) p.departmentName = s.deptName;
    const { data } = await api.get('/production-orders',{params:p});
    const raw = data.items||[];
    if (detail && raw.length > 0) {
      const flattened:ProdOrder[] = [];
      for (const order of raw) {
        const lines = order.lines||[];
        const materials = order.materials||[];
        if (lines.length > 0) {
          for (const line of lines) {
            flattened.push({...order,
              productCode:line.materialCode, productName:line.materialName,
              productSpec:line.spec, productUnit:line.unit,
              plannedQty:line.plannedQty, actualQty:line.actualQty,
              productLines:lines, materialLines:materials,
            });
          }
        } else {
          flattened.push({...order, productLines:[], materialLines:materials});
        }
      }
      setItems(flattened); setTotal(flattened.length);
    } else {
      setItems(raw); setTotal(data.total||0);
    }
  },[detail,pg,ps,s]);
  useEffect(()=>{fetch();},[fetch]);

  const reset = () => { setS({status:'',code:'',name:'',deptName:'',orgName:'',createdBy:''}); setPg(1); };
  const toggleSel = (id:string) => setSel(p=>{const n=new Set(p); n.has(id)?n.delete(id):n.add(id); return n;});
  const toggleAll = () => setSel(p=>p.size===items.length?new Set():new Set(items.map(i=>i.id)));

  const wf = async (id:string, a:'submit'|'withdraw') => {
    try { await api.put(`/production-orders/${id}/${a}`); fetch(); }
    catch(e:any){ toast(e.response?.data?.message||'操作失败','error'); }
  };
  const batchAction = async (action:string, label:string) => {
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
  const single = sel.size===1;
  const multi = sel.size>0;

  /* ── 主单 行操作 ── */
  const mainActions = (item:ProdOrder) => {
    const st = item.approvalStatus; const biz = item.businessStatus;
    return (
      <ErpAction>
        <ErpActionBtn onClick={()=>router.push(`/production/order/${item.id}/edit`)}><Pencil className="h-3.5 w-3.5"/>修改</ErpActionBtn>
        <ErpActionBtn danger onClick={()=>tryDel(item)}><Trash2 className="h-3.5 w-3.5"/>删除</ErpActionBtn>
        <DropdownMenu>
          <DropdownMenuTrigger className="inline-flex items-center gap-0.5 px-1 text-[13px] text-[#409eff] hover:opacity-80">明细<ChevronDown className="h-3 w-3"/></DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-[132px]">
            <DropdownMenuItem onClick={()=>toast('齐套分析待接入','info')}>齐套分析</DropdownMenuItem>
            <DropdownMenuItem onClick={()=>{setDetail(true);setPg(1);}}>领料追溯</DropdownMenuItem>
            <DropdownMenuItem onClick={()=>toast('全局联查待接入','info')}>全局联查</DropdownMenuItem>
            <DropdownMenuItem onClick={()=>pushComplete(item.id)}>完工报告</DropdownMenuItem>
            <DropdownMenuItem onClick={()=>toast('历史版本待接入','info')}>历史版本</DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
        {st==='DRAFT' && <ErpActionBtn onClick={()=>wf(item.id,'submit')}>提交</ErpActionBtn>}
        {st==='SUBMITTED' && <ErpActionBtn onClick={()=>wf(item.id,'withdraw')}>撤回</ErpActionBtn>}
        {st==='APPROVED' && (biz==='PENDING_ISSUE'||biz==='ISSUING') && <ErpActionBtn onClick={()=>pushIssue(item.id)}>下推领料</ErpActionBtn>}
        {st==='APPROVED' && biz==='IN_PRODUCTION' && <ErpActionBtn onClick={()=>pushComplete(item.id)}>下推完工</ErpActionBtn>}
      </ErpAction>
    );
  };

  /* ── 主单+明细 行操作 (document: 只有 修改/删除 且 APPROVED 时 disabled) ── */
  const detailActions = (item:ProdOrder) => {
    const approved = item.approvalStatus==='APPROVED';
    return (
      <ErpAction>
        <ErpActionBtn disabled={approved} onClick={()=>router.push(`/production/order/${item.id}/edit`)}><Pencil className="h-3.5 w-3.5"/>修改</ErpActionBtn>
        <ErpActionBtn danger disabled={approved} onClick={()=>tryDel(item)}><Trash2 className="h-3.5 w-3.5"/>删除</ErpActionBtn>
        <DropdownMenu>
          <DropdownMenuTrigger className="inline-flex items-center gap-0.5 px-1 text-[13px] text-[#409eff] hover:opacity-80">更多<ChevronDown className="h-3 w-3"/></DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-[132px]">
            <DropdownMenuItem onClick={()=>toast('齐套分析待接入','info')}>齐套分析</DropdownMenuItem>
            <DropdownMenuItem onClick={()=>{setDetail(true);setPg(1);}}>领料追溯</DropdownMenuItem>
            <DropdownMenuItem onClick={()=>toast('全局联查待接入','info')}>全局联查</DropdownMenuItem>
            <DropdownMenuItem onClick={()=>pushComplete(item.id)}>完工报告</DropdownMenuItem>
            <DropdownMenuItem onClick={()=>toast('历史版本待接入','info')}>历史版本</DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </ErpAction>
    );
  };

  return (
    <div className="flex h-full min-h-0 flex-col rounded-lg border border-[#dcdfe6] bg-white">
      {/* ──── Toolbar ──── */}
      <div className="flex shrink-0 items-center justify-between gap-2 border-b border-[#ebeef5] bg-white px-4 py-3">
        <div className="flex items-center gap-1.5">
          <Button variant="outline" size="sm" className="gap-1" onClick={()=>router.push('/production/order/create')}>
            <Pencil className="h-3.5 w-3.5"/>业务引导</Button>
          <DropdownMenu>
            <DropdownMenuTrigger className="inline-flex items-center gap-1 rounded-md border border-border bg-background px-3 h-9 text-[13px] font-medium shadow-sm hover:bg-accent hover:text-accent-foreground transition-colors" disabled={!multi}>
              批量操作<ChevronDown className="h-3.5 w-3.5"/>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start">
              {!detail ? <>
                <DropdownMenuItem onClick={()=>batchAction('submit','批量提交')}>批量提交</DropdownMenuItem>
                <DropdownMenuItem onClick={()=>batchAction('approve','批量审批')}>批量审批</DropdownMenuItem>
              </> : <>
                <DropdownMenuItem onClick={()=>batchAction('start','批量开工')}>批量开工</DropdownMenuItem>
                <DropdownMenuItem onClick={()=>batchAction('complete','批量完工')}>批量完工</DropdownMenuItem>
                <DropdownMenuItem onClick={()=>{if(sel.size!==1)return toast('请勾选一条数据','info');batchAction('partial-complete','部分完工');}}>部分完工</DropdownMenuItem>
                <DropdownMenuItem onClick={()=>{if(sel.size===0)return toast('请先勾选数据','info');if(!confirm('确定下推入库？'))return;batchAction('complete','下推入库');}}>下推入库</DropdownMenuItem>
              </>}
            </DropdownMenuContent>
          </DropdownMenu>
          <Button variant="secondary" size="sm" className="gap-1" onClick={()=>router.push('/production/order/create')}>
            <Plus className="h-3.5 w-3.5"/>新增</Button>
          <Button variant="outline" size="sm" className="gap-1 text-[#67c23a]" disabled={!single}
            onClick={()=>selItem&&router.push(`/production/order/${selItem.id}/edit`)}>
            <Pencil className="h-3.5 w-3.5"/>修改</Button>
          <Button variant="outline" size="sm" className="gap-1 text-[#f56c6c]" disabled={!single}
            onClick={()=>selItem&&tryDel(selItem)}>
            <Trash2 className="h-3.5 w-3.5"/>删除</Button>
          <DropdownMenu>
            <DropdownMenuTrigger className="inline-flex items-center gap-1 rounded-md border border-border bg-background px-3 h-9 text-[13px] font-medium shadow-sm hover:bg-accent hover:text-accent-foreground transition-colors">
              <MoreHorizontal className="h-3.5 w-3.5"/>更多操作<ChevronDown className="h-3.5 w-3.5"/>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start">
              {selItem?.approvalStatus==='DRAFT' && <DropdownMenuItem onClick={()=>wf(selItem.id,'submit')}>提交</DropdownMenuItem>}
              {selItem?.approvalStatus==='SUBMITTED' && <DropdownMenuItem onClick={()=>wf(selItem.id,'withdraw')}>撤回</DropdownMenuItem>}
              <DropdownMenuItem onClick={()=>toast('流程查看待接入','info')}>流程查看</DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
        <div className="flex items-center gap-1">
          <Button variant="ghost" size="sm" onClick={reset}>重置</Button>
          <DropdownMenu>
            <DropdownMenuTrigger className="inline-flex items-center gap-1 rounded-md px-2.5 h-7 text-[13px] font-medium hover:bg-accent">
              常用搜索方案<ChevronDown className="h-3.5 w-3.5"/></DropdownMenuTrigger>
            <DropdownMenuContent align="end"><DropdownMenuItem disabled>保存当前搜索</DropdownMenuItem></DropdownMenuContent>
          </DropdownMenu>
          <Button variant="default" size="sm" className="gap-1" onClick={()=>{setPg(1);fetch();}}><Search className="h-4 w-4"/>搜索</Button>
          <Button variant="outline" size="sm" onClick={()=>toast('高级搜索待接入','info')}>高级搜索</Button>
        </div>
      </div>

      {/* ──── Search ──── */}
      <div className="shrink-0 border-b border-[#ebeef5] bg-[#fafafa] px-4 py-3">
        <div className="flex items-center gap-4 flex-wrap">
          <S label="状态" v={s.status} opts={STATUS_OPTS} onChange={v=>setS({...s,status:v})}/>
          <SI label="生产编号" v={s.code} onChange={v=>setS({...s,code:v})} ph="生产编号"/>
          <SI label="生产名称" v={s.name} onChange={v=>setS({...s,name:v})} ph="生产名称"/>
          <SI label="生产部门" v={s.deptName} onChange={v=>setS({...s,deptName:v})} ph="生产部门"/>
          <SI label="所属组织" v={s.orgName} onChange={v=>setS({...s,orgName:v})} ph="所属组织"/>
          <SI label="创建人" v={s.createdBy} onChange={v=>setS({...s,createdBy:v})} ph="创建人"/>
        </div>
      </div>

      {/* ──── Sub-toolbar: 主单/主单+明细 toggle ──── */}
      <div className="flex shrink-0 items-center justify-between border-b border-[#ebeef5] bg-white px-4 py-2.5">
        <div className="flex items-center gap-6">
          <label className={`inline-flex items-center gap-2 text-[14px] cursor-pointer ${!detail?'text-[#409eff]':'text-[#303133]'}`}>
            <input type="radio" checked={!detail} onChange={()=>{setDetail(false);setSel(new Set());setPg(1);}} className="accent-[#409eff]"/>主单</label>
          <label className={`inline-flex items-center gap-2 text-[14px] cursor-pointer ${detail?'text-[#409eff]':'text-[#303133]'}`}>
            <input type="radio" checked={detail} onChange={()=>{setDetail(true);setSel(new Set());setPg(1);}} className="accent-[#409eff]"/>主单+明细</label>
          <span className="text-[13px] text-[#606266]">共 {total} 条</span>
        </div>
        <button onClick={fetch} title="刷新" className="rounded border border-[#dcdfe6] p-1.5 text-[#606266] hover:bg-[#f5f7fa]"><RefreshCw className="h-4 w-4"/></button>
      </div>

      {/* ──── Table ──── */}
      <div className="min-h-0 flex-1 overflow-auto">
      {!detail ? (
        /* ═══ 主单 (12 cols) ═══ */
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
                <ErpTd>{item.createdBy||'测试用户'}</ErpTd>
                <ErpTd className="text-[#909399]">{fmtDt(item.createdAt)}</ErpTd>
                <ErpTd className="text-[#909399] max-w-[160px] truncate" title={item.remark||''}>{item.remark||'-'}</ErpTd>
                <ErpTd><span className="text-[#409eff] text-[13px] cursor-pointer hover:underline">📎</span></ErpTd>
                <ErpTd className="sticky right-0 z-10 bg-white">{mainActions(item)}</ErpTd>
              </ErpTr>
            ))}
            {items.length===0 && <ErpEmpty colSpan={12}/>}
          </ErpTbody>
        </ErpTable>
      ) : (
        /* ═══ 主单+明细 (16 cols, product-level) ═══ */
        <ErpTable>
          <ErpThead>
            <ErpTh className="w-[48px]"><Checkbox checked={false} disabled/></ErpTh>
            <ErpTh className="w-[80px]">阶层</ErpTh>
            <ErpTh className="w-[100px]">审批状态</ErpTh>
            <ErpTh className="w-[100px]">产品入库状态</ErpTh>
            <ErpTh className="w-[90px]">生产状态</ErpTh>
            <ErpTh className="w-[150px]">生产编码</ErpTh>
            <ErpTh className="w-[150px]">生产名称</ErpTh>
            <ErpTh className="w-[120px]">所属组织</ErpTh>
            <ErpTh className="w-[160px]">产品编码</ErpTh>
            <ErpTh className="w-[150px]">产品名称</ErpTh>
            <ErpTh className="w-[120px]">规格型号</ErpTh>
            <ErpTh className="w-[80px]">计量单位</ErpTh>
            <ErpTh className="w-[100px]">预计生产数量</ErpTh>
            <ErpTh className="w-[100px]">实际生产数量</ErpTh>
            <ErpTh className="w-[160px]">创建时间</ErpTh>
            <ErpTh className="w-[180px] sticky right-0 z-10 bg-[#f5f7fa]">操作</ErpTh>
          </ErpThead>
          <ErpTbody>
            {items.map((item,idx) => (
              <ErpTr key={`${item.id}-${idx}`}>
                <ErpTd><Checkbox checked={false} disabled/></ErpTd>
                <ErpTd className="text-[#909399]">{idx+1}</ErpTd>
                <ErpTd><ErpApproval status={item.approvalStatus}/></ErpTd>
                <ErpTd><span className="text-[13px] text-[#909399]">-</span></ErpTd>
                <ErpTd><span className="text-[13px] text-[#909399]">-</span></ErpTd>
                <ErpTd><ErpLink onClick={()=>router.push(`/production/order/${item.id}/edit`)}>{item.orderNo}</ErpLink></ErpTd>
                <ErpTd>{item.orderName||'-'}</ErpTd>
                <ErpTd className="text-[#606266]">默认企业</ErpTd>
                <ErpTd className="text-[#409eff]">{item.productCode||'-'}</ErpTd>
                <ErpTd>{item.productName||item.materialName||'-'}</ErpTd>
                <ErpTd className="text-[#909399]">{item.productSpec||'-'}</ErpTd>
                <ErpTd>{item.productUnit||'-'}</ErpTd>
                <ErpTd>{item.plannedQty?Number(item.plannedQty).toLocaleString():'-'}</ErpTd>
                <ErpTd>{item.actualQty?Number(item.actualQty).toLocaleString():'-'}</ErpTd>
                <ErpTd className="text-[#909399]">{fmtDt(item.createdAt)}</ErpTd>
                <ErpTd className="sticky right-0 z-10 bg-white">{detailActions(item)}</ErpTd>
              </ErpTr>
            ))}
            {items.length===0 && <ErpEmpty colSpan={16}/>}
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

function SI({label,v,onChange,ph}:{label:string;v:string;onChange:(v:string)=>void;ph:string}) {
  return <div className="flex items-center gap-1.5"><span className="text-[13px] text-muted-foreground w-[70px] text-right shrink-0">{label}</span><Input className="w-[140px] h-9 rounded-md border border-[#dcdfe6] bg-white px-3 text-[13px]" value={v} onChange={e=>onChange(e.target.value)} placeholder={ph}/></div>;
}
function S({label,v,opts,onChange}:{label:string;v:string;opts:{v:string;l:string}[];onChange:(v:string)=>void}) {
  return <div className="flex items-center gap-1.5"><span className="text-[13px] text-muted-foreground w-[70px] text-right shrink-0">{label}</span><Select value={v||'ALL'} onValueChange={x=>onChange(!x||x==='ALL'?'':String(x))}><SelectTrigger className="w-[110px] h-9 rounded-md border border-[#dcdfe6] bg-white px-3 text-[13px]"><SelectValue/></SelectTrigger><SelectContent>{opts.map(o=><SelectItem key={o.v} value={o.v}>{o.l}</SelectItem>)}</SelectContent></Select></div>;
}
