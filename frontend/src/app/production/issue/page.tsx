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

interface IssueItem {
  id:string; orderNo:string; productionOrderNo:string|null;
  materialName:string|null; spec:string|null; quantity:string;
  departmentName:string|null; issueDate:string;
  approvalStatus:string; businessStatus:string; remark:string|null; createdAt:string;
}

const STATUS_OPTS = [{v:'ALL',l:'全部'},{v:'DRAFT',l:'草稿'},{v:'SUBMITTED',l:'已提交'},{v:'APPROVED',l:'已通过'}];

function fmtDt(v:string|null) { return v ? new Date(v).toLocaleDateString('zh-CN') : '-'; }

export default function IssuePage() {
  const router = useRouter();
  const [items,setItems]=useState<IssueItem[]>([]); const [total,setTotal]=useState(0);
  const [pg,setPg]=useState(1); const [ps,setPs]=useState(30);
  const [sel,setSel]=useState<Set<string>>(new Set());
  const [del,setDel]=useState<string|null>(null);
  const [s,setS]=useState({status:'',code:'',name:'',dept:''});

  const fetch=useCallback(async()=>{
    const p:any={page:pg,pageSize:ps};
    if (s.status) p.status = s.status;
    if (s.code) p.code = s.code;
    if (s.name) p.name = s.name;
    if (s.dept) p.departmentName = s.dept;
    const {data}=await api.get('/issue-orders',{params:p});
    setItems(data.items); setTotal(data.total);
  },[pg,ps,s]);
  useEffect(()=>{fetch();},[fetch]);

  const reset = () => setS({status:'',code:'',name:'',dept:''});
  const toggleSel = (id:string) => setSel(p=>{const n=new Set(p); n.has(id)?n.delete(id):n.add(id); return n;});
  const toggleAll = () => setSel(p=>p.size===items.length?new Set():new Set(items.map(i=>i.id)));

  const wf = async (id:string, action:'submit'|'approve'|'cancel-approve'|'withdraw') => {
    try { await api.put(`/issue-orders/${id}/${action}`); fetch(); }
    catch(e:any){ toast(e.response?.data?.message||'操作失败','error'); }
  };

  const doDel = async () => {
    if (!del) return;
    try { await api.delete(`/issue-orders/${del}`); setDel(null); fetch(); }
    catch(e:any){ toast(e.response?.data?.message||'删除失败','error'); }
  };

  const selItem = items.find(i=>sel.has(i.id));
  const single = sel.size===1;

  return (
    <div className="flex h-full min-h-0 flex-col rounded-lg border border-[#dcdfe6] bg-white">
      {/* ── Toolbar (原系统: 新增|修改|删除|提交|撤回|流程查看|打印) ── */}
      <div className="flex shrink-0 items-center justify-between gap-2 border-b border-[#ebeef5] bg-white px-4 py-3">
        <div className="flex items-center gap-1.5">
          <Button variant="secondary" size="sm" className="gap-1" onClick={()=>router.push('/production/issue/create')}>
            <Plus className="h-3.5 w-3.5"/>新增</Button>
          <Button variant="outline" size="sm" className="gap-1 text-[#67c23a]" disabled={!single}
            onClick={()=>selItem&&router.push(`/production/issue/${selItem.id}/edit`)}>
            <Pencil className="h-3.5 w-3.5"/>修改</Button>
          <Button variant="outline" size="sm" className="gap-1 text-[#f56c6c]" disabled={!single}
            onClick={()=>{if(selItem)setDel(selItem.id);}}>
            <Trash2 className="h-3.5 w-3.5"/>删除</Button>
          <DropdownMenu>
            <DropdownMenuTrigger className="inline-flex items-center gap-1 rounded-md border border-border bg-background px-3 h-9 text-[13px] font-medium shadow-sm hover:bg-accent hover:text-accent-foreground transition-colors disabled:opacity-50"
              disabled={!single}>
              <MoreHorizontal className="h-3.5 w-3.5"/>更多操作<ChevronDown className="h-3.5 w-3.5"/>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start">
              {selItem?.approvalStatus==='DRAFT' && <DropdownMenuItem onClick={()=>{if(selItem)wf(selItem.id,'submit');}}>提交</DropdownMenuItem>}
              {selItem?.approvalStatus==='SUBMITTED' && <DropdownMenuItem onClick={()=>{if(selItem)wf(selItem.id,'withdraw');}}>撤回</DropdownMenuItem>}
              {selItem?.approvalStatus==='SUBMITTED' && <DropdownMenuItem onClick={()=>{if(selItem)wf(selItem.id,'approve');}}>登卡</DropdownMenuItem>}
              {selItem?.approvalStatus==='APPROVED' && <DropdownMenuItem onClick={()=>{if(selItem)wf(selItem.id,'cancel-approve');}}>撤销登卡</DropdownMenuItem>}
              <DropdownMenuItem onClick={()=>toast('流程查看待接入','info')}>流程查看</DropdownMenuItem>
              <DropdownMenuItem onClick={()=>window.print()}>打印</DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
        <div className="flex items-center gap-1">
          <Button variant="ghost" size="sm" onClick={reset}>重置</Button>
          <Button variant="outline" size="sm" onClick={()=>toast('展开待接入','info')}>展开</Button>
          <DropdownMenu>
            <DropdownMenuTrigger className="inline-flex items-center gap-1 rounded-md px-2.5 h-7 text-[13px] font-medium hover:bg-accent">
              常用搜索方案<ChevronDown className="h-3.5 w-3.5"/></DropdownMenuTrigger>
            <DropdownMenuContent align="end"><DropdownMenuItem disabled>保存当前搜索</DropdownMenuItem></DropdownMenuContent>
          </DropdownMenu>
          <Button variant="default" size="sm" className="gap-1" onClick={()=>{setPg(1);fetch();}}><Search className="h-4 w-4"/>搜索</Button>
        </div>
      </div>

      {/* ── Search ── */}
      <div className="shrink-0 border-b border-[#ebeef5] bg-[#fafafa] px-4 py-3">
        <div className="flex items-center gap-4 flex-wrap">
          <FS label="审批状态" v={s.status} opts={STATUS_OPTS} onChange={v=>setS({...s,status:v})}/>
          <FI label="领料单号" v={s.code} onChange={v=>setS({...s,code:v})} ph="领料单号"/>
          <FI label="物料名称" v={s.name} onChange={v=>setS({...s,name:v})} ph="物料名称"/>
          <FI label="生产部门" v={s.dept} onChange={v=>setS({...s,dept:v})} ph="生产部门"/>
        </div>
      </div>

      {/* ── Table (12 cols matching original) ── */}
      <div className="min-h-0 flex-1 overflow-auto">
        <ErpTable>
          <ErpThead>
            <ErpTh className="w-[48px]"><Checkbox checked={items.length>0&&sel.size===items.length} onCheckedChange={toggleAll}/></ErpTh>
            <ErpTh className="w-[100px]">审批状态</ErpTh>
            <ErpTh className="w-[170px]">领料单号</ErpTh>
            <ErpTh className="w-[180px]">生产订单号</ErpTh>
            <ErpTh className="w-[140px]">物料</ErpTh>
            <ErpTh className="w-[100px]">数量</ErpTh>
            <ErpTh className="w-[140px]">生产部门</ErpTh>
            <ErpTh className="w-[120px]">领料日期</ErpTh>
            <ErpTh className="w-[160px]">备注</ErpTh>
            <ErpTh className="w-[100px]">创建人</ErpTh>
            <ErpTh className="w-[130px]">创建日期</ErpTh>
            <ErpTh className="w-[60px]">附件</ErpTh>
            <ErpTh className="w-[220px] sticky right-0 z-10 bg-[#f5f7fa]">操作</ErpTh>
          </ErpThead>
          <ErpTbody>
            {items.map(i => {
              const st=i.approvalStatus;
              return (
              <ErpTr key={i.id}>
                <ErpTd><Checkbox checked={sel.has(i.id)} onCheckedChange={()=>toggleSel(i.id)}/></ErpTd>
                <ErpTd><ErpApproval status={st}/></ErpTd>
                <ErpTd><ErpLink onClick={()=>router.push(`/production/issue/${i.id}/edit`)}>{i.orderNo}</ErpLink></ErpTd>
                <ErpTd className="text-[#409eff]">{i.productionOrderNo||'-'}</ErpTd>
                <ErpTd>{i.materialName||'-'}</ErpTd>
                <ErpTd>{i.quantity?Number(i.quantity).toLocaleString():'-'}</ErpTd>
                <ErpTd className="text-[#606266]">{i.departmentName||'-'}</ErpTd>
                <ErpTd className="text-[#909399]">{fmtDt(i.issueDate)}</ErpTd>
                <ErpTd className="text-[#909399] max-w-[160px] truncate" title={i.remark||''}>{i.remark||'-'}</ErpTd>
                <ErpTd>测试用户</ErpTd>
                <ErpTd className="text-[#909399]">{fmtDt(i.createdAt)}</ErpTd>
                <ErpTd><span className="text-[#409eff] text-[13px] cursor-pointer hover:underline">📎</span></ErpTd>
                <ErpTd className="sticky right-0 z-10 bg-white">
                  <ErpAction>
                    <ErpActionBtn onClick={()=>router.push(`/production/issue/${i.id}/edit`)}><Pencil className="h-3.5 w-3.5"/>修改</ErpActionBtn>
                    <ErpActionBtn danger onClick={()=>setDel(i.id)}><Trash2 className="h-3.5 w-3.5"/>删除</ErpActionBtn>
                    {st==='DRAFT'&&<ErpActionBtn onClick={()=>wf(i.id,'submit')}>提交</ErpActionBtn>}
                    {st==='SUBMITTED'&&<ErpActionBtn onClick={()=>wf(i.id,'withdraw')}>撤回</ErpActionBtn>}
                    {st==='SUBMITTED'&&<ErpActionBtn onClick={()=>{if(confirm('确认登卡？原材料库存将减少。'))wf(i.id,'approve');}}>登卡</ErpActionBtn>}
                    {st==='APPROVED'&&<ErpActionBtn onClick={()=>{if(confirm('确认撤销登卡？原材料库存将回退。'))wf(i.id,'cancel-approve');}}>撤销登卡</ErpActionBtn>}
                  </ErpAction>
                </ErpTd>
              </ErpTr>
            )})}
            {items.length===0 && <ErpEmpty colSpan={13}/>}
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

function FI({label,v,onChange,ph}:{label:string;v:string;onChange:(v:string)=>void;ph:string}) {
  return <div className="flex items-center gap-1.5"><span className="text-[13px] text-muted-foreground w-[70px] text-right shrink-0">{label}</span><Input className="w-[140px] h-9 rounded-md border border-[#dcdfe6] bg-white px-3 text-[13px]" value={v} onChange={e=>onChange(e.target.value)} placeholder={ph}/></div>;
}
function FS({label,v,opts,onChange}:{label:string;v:string;opts:{v:string;l:string}[];onChange:(v:string)=>void}) {
  return <div className="flex items-center gap-1.5"><span className="text-[13px] text-muted-foreground w-[70px] text-right shrink-0">{label}</span><Select value={v||'ALL'} onValueChange={x=>onChange(!x||x==='ALL'?'':String(x))}><SelectTrigger className="w-[110px] h-9 rounded-md border border-[#dcdfe6] bg-white px-3 text-[13px]"><SelectValue/></SelectTrigger><SelectContent>{opts.map(o=><SelectItem key={o.v} value={o.v}>{o.l}</SelectItem>)}</SelectContent></Select></div>;
}
