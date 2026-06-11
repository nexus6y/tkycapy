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
import { ChevronDown, Download, MoreHorizontal, Pencil, Plus, RefreshCw, Search, Trash2 } from 'lucide-react';

/* ── flatten lines into table rows ── */
interface InbRow {
  id:string; orderNo:string; businessStatus:string; approvalStatus:string;
  materialCode:string; materialName:string; spec:string; unit:string;
  supplierName:string; sourceQty:string; sourceType:string; sourceNo:string;
  sourceName:string; sourceLineNo:string; inspectionNo:string;
  orgName:string; projectCode:string; projectName:string;
  inspector:string; receiptDate:string; prodDate:string; expiryDate:string;
}

const BIZ_OPTS = [{v:'ALL',l:'全部'},{v:'PENDING',l:'待收货'},{v:'RECEIVED',l:'已收货'},{v:'CLOSED',l:'已关闭'}];
const SRC_OPTS = [{v:'ALL',l:'全部'},{v:'PURCHASE',l:'采购入库'},{v:'INSPECTION',l:'质检入库'},{v:'OTHER',l:'其他'},{v:'ARRIVAL_CONFIRM',l:'到货确认'}];
const BS_LABEL:Record<string,string>={PENDING:'待收货',RECEIVED:'已收货',CLOSED:'已关闭'};

function fmtDt(v:string|null){return v?new Date(v).toLocaleDateString('zh-CN'):'-';}

export default function InboundPage() {
  const router = useRouter();
  const [rows,setRows]=useState<InbRow[]>([]);
  const [total,setTotal]=useState(0);
  const [pg,setPg]=useState(1);const [ps,setPs]=useState(30);
  const [sel,setSel]=useState<Set<string>>(new Set());
  const [del,setDel]=useState<string|null>(null);
  const [adv,setAdv]=useState(false);
  const [s,setS]=useState({biz:'',code:'',matCode:'',matName:'',spec:'',supplier:'',whQual:'',whDefect:'',sourceType:'',sourceNo:'',sourceName:'',inspNo:'',orgName:'',inspector:'',prodDate:'',expiryDate:''});

  const fetch = useCallback(async()=>{
    const p:any={page:pg,pageSize:ps,mode:'detail'};
    if(s.code)p.code=s.code;
    // Map biz filter
    if(s.biz) p.biz = s.biz;
    const {data}=await api.get('/inbound-orders',{params:p});
    const raw=data.items||[];
    // Flatten each order's lines into individual rows
    const flat:InbRow[]=[];
    for(const o of raw){
      const lns=o.lines||[];
      if(lns.length>0){
        for(const ln of lns){
          flat.push({
            id:o.id, orderNo:o.orderNo, businessStatus:o.businessStatus, approvalStatus:o.approvalStatus,
            materialCode:ln.materialCode||'', materialName:ln.materialName||'', spec:ln.spec||'', unit:ln.unit||'',
            supplierName:o.supplierName||'',
            sourceQty:ln.quantity||'0',
            sourceType:o.sourceType||'', sourceNo:o.sourceNo||'',
            sourceName:'', sourceLineNo:'', inspectionNo:o.inspectionNo||'',
            orgName:'默认企业', projectCode:'', projectName:'',
            inspector:'测试用户', receiptDate:o.receiptDate||o.createdAt,
            prodDate:'', expiryDate:'',
          });
        }
      }else{
        flat.push({
          id:o.id, orderNo:o.orderNo, businessStatus:o.businessStatus, approvalStatus:o.approvalStatus,
          materialCode:'', materialName:o.materialName||'', spec:o.specification||'', unit:'',
          supplierName:o.supplierName||'',
          sourceQty:o.quantity||'0',
          sourceType:o.sourceType||'', sourceNo:o.sourceNo||'',
          sourceName:'', sourceLineNo:'', inspectionNo:o.inspectionNo||'',
          orgName:'默认企业', projectCode:'', projectName:'',
          inspector:'测试用户', receiptDate:o.receiptDate||o.createdAt,
          prodDate:'', expiryDate:'',
        });
      }
    }
    setRows(flat);setTotal(data.total||0);
  },[pg,ps,s]);
  useEffect(()=>{fetch();},[fetch]);

  const reset=()=>{setS({biz:'',code:'',matCode:'',matName:'',spec:'',supplier:'',whQual:'',whDefect:'',sourceType:'',sourceNo:'',sourceName:'',inspNo:'',orgName:'',inspector:'',prodDate:'',expiryDate:''});setAdv(false);setPg(1);};
  const toggleSel=(id:string)=>setSel(p=>{const n=new Set(p);n.has(id)?n.delete(id):n.add(id);return n;});
  const toggleAll=()=>setSel(p=>p.size===rows.length?new Set():new Set(rows.map(r=>r.id)));

  const wf=async(id:string,action:'submit'|'approve'|'cancel-approve')=>{
    try{
      if(action==='cancel-approve'&&!confirm('确认撤销登卡？库存将回退。'))return;
      await api.put(`/inbound-orders/${id}/${action}`);fetch();
    }catch(e:any){toast(e.response?.data?.message||'操作失败','error');}
  };
  const doDel=async()=>{if(!del)return;try{await api.delete(`/inbound-orders/${del}`);setDel(null);fetch();}catch(e:any){toast(e.response?.data?.message||'删除失败','error');}};

  const selItem=rows.find(r=>sel.has(r.id));
  const single=sel.size===1;

  return (
    <div className="flex h-full min-h-0 flex-col rounded-lg border border-[#dcdfe6] bg-white">
      {/* ═══ TOOLBAR: 新增|修改|删除|登卡|更多操作 ═══ */}
      <div className="flex shrink-0 items-center justify-between gap-2 border-b border-[#ebeef5] bg-white px-4 py-3">
        <div className="flex items-center gap-1.5">
          <Button variant="secondary" size="sm" className="gap-1" onClick={()=>router.push('/warehouse/inbound/create')}><Plus className="h-3.5 w-3.5"/>新增</Button>
          <Button variant="outline" size="sm" className="gap-1 text-[#67c23a]" disabled={!single}
            onClick={()=>selItem&&router.push(`/warehouse/inbound/${selItem.id}/edit`)}><Pencil className="h-3.5 w-3.5"/>修改</Button>
          <Button variant="outline" size="sm" className="gap-1 text-[#f56c6c]" disabled={!single}
            onClick={()=>{if(selItem&&selItem.approvalStatus==='DRAFT')setDel(selItem.id);else toast('只有草稿可删除','error');}}><Trash2 className="h-3.5 w-3.5"/>删除</Button>
          <Button variant="outline" size="sm" className="gap-1" disabled={!single}
            onClick={()=>{if(selItem&&selItem.approvalStatus==='SUBMITTED')wf(selItem.id,'approve');else toast('请选择已提交的单','info');}}>
            <Download className="h-3.5 w-3.5 mr-0.5"/>登卡</Button>
          <DropdownMenu>
            <DropdownMenuTrigger className="inline-flex items-center gap-1 rounded-md border border-border bg-background px-3 h-9 text-[13px] font-medium shadow-sm hover:bg-accent disabled:opacity-50">
              <MoreHorizontal className="h-3.5 w-3.5"/>更多操作<ChevronDown className="h-3.5 w-3.5"/></DropdownMenuTrigger>
            <DropdownMenuContent align="start">
              {selItem?.approvalStatus==='DRAFT'&&<DropdownMenuItem onClick={()=>{if(selItem)wf(selItem.id,'submit');}}>提交</DropdownMenuItem>}
              {selItem?.approvalStatus==='APPROVED'&&<DropdownMenuItem onClick={()=>{if(selItem)wf(selItem.id,'cancel-approve');}}>撤销登卡</DropdownMenuItem>}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
        <div className="flex items-center gap-1">
          <Button variant="ghost" size="sm" onClick={reset}>重置</Button>
          <Button variant="outline" size="sm" onClick={()=>setAdv(!adv)}>{adv?'收起':'展开'}</Button>
          <DropdownMenu>
            <DropdownMenuTrigger className="inline-flex items-center gap-1 rounded-md px-2.5 h-7 text-[13px] font-medium hover:bg-accent">常用搜索方案<ChevronDown className="h-3.5 w-3.5"/></DropdownMenuTrigger>
            <DropdownMenuContent align="end"><DropdownMenuItem disabled>保存当前搜索</DropdownMenuItem></DropdownMenuContent>
          </DropdownMenu>
          <Button variant="default" size="sm" className="gap-1" onClick={()=>{setPg(1);fetch();}}><Search className="h-4 w-4"/>搜索</Button>
        </div>
      </div>

      {/* ═══ SEARCH: 16 conditions (default 4 + advanced 12) ═══ */}
      <div className="shrink-0 border-b border-[#ebeef5] bg-[#fafafa] px-4 py-3">
        <div className="space-y-3">
          <div className="flex items-center gap-4 flex-wrap">
            <FS label="业务状态" v={s.biz} opts={BIZ_OPTS} onChange={v=>setS({...s,biz:v})}/>
            <FI label="入库单号" v={s.code} onChange={v=>setS({...s,code:v})} ph="入库单号"/>
            <FI label="物料编码" v={s.matCode} onChange={v=>setS({...s,matCode:v})} ph="物料编码"/>
            <FI label="物料名称" v={s.matName} onChange={v=>setS({...s,matName:v})} ph="物料名称"/>
          </div>
          {adv && (<div className="flex items-center gap-4 flex-wrap">
            <FI label="规格型号" v={s.spec} onChange={v=>setS({...s,spec:v})} ph="规格型号"/>
            <FI label="供应商名称" v={s.supplier} onChange={v=>setS({...s,supplier:v})} ph="供应商名称"/>
            <FS label="入库来源" v={s.sourceType} opts={SRC_OPTS} onChange={v=>setS({...s,sourceType:v})}/>
            <FI label="来源单号" v={s.sourceNo} onChange={v=>setS({...s,sourceNo:v})} ph="来源单号"/>
            <FI label="质检单号" v={s.inspNo} onChange={v=>setS({...s,inspNo:v})} ph="质检单号"/>
            <FI label="入库负责人" v={s.inspector} onChange={v=>setS({...s,inspector:v})} ph="入库负责人"/>
            <FI label="生产日期" v={s.prodDate} onChange={v=>setS({...s,prodDate:v})} ph="生产日期"/>
            <FI label="失效日期" v={s.expiryDate} onChange={v=>setS({...s,expiryDate:v})} ph="失效日期"/>
          </div>)}
        </div>
      </div>

      {/* ═══ Sub-header with refresh ═══ */}
      <div className="flex shrink-0 items-center justify-between border-b border-[#ebeef5] bg-white px-4 py-2.5">
        <span className="text-[13px] text-[#606266]">共 {total} 条</span>
        <button onClick={fetch} title="刷新" className="rounded border border-[#dcdfe6] p-1.5 text-[#606266] hover:bg-[#f5f7fa]"><RefreshCw className="h-4 w-4"/></button>
      </div>

      {/* ═══ TABLE: 20 cols single view (no toggle — per original system) ═══ */}
      <div className="min-h-0 flex-1 overflow-auto">
        <ErpTable>
          <ErpThead>
            <ErpTh className="w-[48px]"><Checkbox checked={rows.length>0&&sel.size===rows.length} onCheckedChange={toggleAll}/></ErpTh>
            <ErpTh className="w-[90px]">业务状态</ErpTh>
            <ErpTh className="w-[170px]">入库单号</ErpTh>
            <ErpTh className="w-[130px]">物料编码</ErpTh>
            <ErpTh className="w-[140px]">物料名称</ErpTh>
            <ErpTh className="w-[120px]">规格型号</ErpTh>
            <ErpTh className="w-[80px]">计量单位</ErpTh>
            <ErpTh className="w-[130px]">供应商名称</ErpTh>
            <ErpTh className="w-[90px]">单据原量</ErpTh>
            <ErpTh className="w-[100px]">入库来源</ErpTh>
            <ErpTh className="w-[140px]">来源单号</ErpTh>
            <ErpTh className="w-[80px]">来源行号</ErpTh>
            <ErpTh className="w-[130px]">质检单号</ErpTh>
            <ErpTh className="w-[110px]">所属组织</ErpTh>
            <ErpTh className="w-[130px]">项目编码</ErpTh>
            <ErpTh className="w-[130px]">项目名称</ErpTh>
            <ErpTh className="w-[90px]">入库负责人</ErpTh>
            <ErpTh className="w-[120px]">入库日期</ErpTh>
            <ErpTh className="w-[110px]">生产日期</ErpTh>
            <ErpTh className="w-[110px]">失效日期</ErpTh>
            <ErpTh className="w-[200px] sticky right-0 z-10 bg-[#f5f7fa]">操作</ErpTh>
          </ErpThead>
          <ErpTbody>
            {rows.map(r=>{
              const st=r.approvalStatus;
              return (<ErpTr key={`${r.id}-${r.materialCode}-${r.sourceLineNo}`}>
                <ErpTd><Checkbox checked={sel.has(r.id)} onCheckedChange={()=>toggleSel(r.id)}/></ErpTd>
                <ErpTd><span className="text-[12px] text-muted-foreground">{BS_LABEL[r.businessStatus]||r.businessStatus||'-'}</span></ErpTd>
                <ErpTd><ErpLink onClick={()=>router.push(`/warehouse/inbound/${r.id}/edit`)}>{r.orderNo}</ErpLink></ErpTd>
                <ErpTd className="text-[#409eff]">{r.materialCode||'-'}</ErpTd>
                <ErpTd>{r.materialName||'-'}</ErpTd>
                <ErpTd className="text-[#909399]">{r.spec||'-'}</ErpTd>
                <ErpTd>{r.unit||'-'}</ErpTd>
                <ErpTd>{r.supplierName||'-'}</ErpTd>
                <ErpTd>{Number(r.sourceQty)>0?Number(r.sourceQty).toLocaleString():'-'}</ErpTd>
                <ErpTd className="text-[#909399]">{r.sourceType||'-'}</ErpTd>
                <ErpTd className="text-[#409eff]">{r.sourceNo||'-'}</ErpTd>
                <ErpTd className="text-[#909399]">{r.sourceLineNo||'-'}</ErpTd>
                <ErpTd className="text-[#409eff]">{r.inspectionNo||'-'}</ErpTd>
                <ErpTd className="text-[#606266]">{r.orgName||'-'}</ErpTd>
                <ErpTd className="text-[#409eff]">{r.projectCode||'-'}</ErpTd>
                <ErpTd>{r.projectName||'-'}</ErpTd>
                <ErpTd>{r.inspector||'-'}</ErpTd>
                <ErpTd className="text-[#909399]">{fmtDt(r.receiptDate)}</ErpTd>
                <ErpTd className="text-[#909399]">{r.prodDate||'-'}</ErpTd>
                <ErpTd className="text-[#909399]">{r.expiryDate||'-'}</ErpTd>
                <ErpTd className="sticky right-0 z-10 bg-white">
                  <ErpAction>
                    <ErpActionBtn onClick={()=>router.push(`/warehouse/inbound/${r.id}/edit`)}><Pencil className="h-3.5 w-3.5"/>修改</ErpActionBtn>
                    {st==='DRAFT'&&<ErpActionBtn danger onClick={()=>setDel(r.id)}><Trash2 className="h-3.5 w-3.5"/>删除</ErpActionBtn>}
                    {st==='APPROVED'&&<ErpActionBtn onClick={()=>wf(r.id,'cancel-approve')}>撤销登卡</ErpActionBtn>}
                  </ErpAction>
                </ErpTd>
              </ErpTr>);
            })}
            {rows.length===0&&<ErpEmpty colSpan={21}/>}
          </ErpTbody>
        </ErpTable>
      </div>

      <ErpPagination page={pg} pageSize={ps} total={total} onPage={setPg} onPageSize={v=>setPs(+v)}/>
      <AlertDialog open={!!del} onOpenChange={()=>setDel(null)}>
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
