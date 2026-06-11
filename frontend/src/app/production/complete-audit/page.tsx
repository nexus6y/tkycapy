'use client';
import { useCallback, useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { toast } from '@/components/ui/toast';
import { ErpAction, ErpActionBtn, ErpApproval, ErpEmpty, ErpLink, ErpPagination, ErpTable, ErpTbody, ErpTd, ErpTh, ErpThead, ErpTr } from '@/components/ui/erp-table';
import { ChevronDown, MoreHorizontal, Pencil, RefreshCw, Search } from 'lucide-react';
import api from '@/lib/api';

interface Item { id:string;reportNo:string;sourceType:string|null;productionOrderId:string|null;productionOrderNo:string|null;materialCode:string|null;materialName:string|null;spec:string|null;unit:string|null;plannedQty:string;actualQty:string;deptName:string|null;approvalStatus:string;businessStatus:string;createdAt:string; }

function fmtDt(v:string|null){return v?new Date(v).toLocaleDateString('zh-CN'):'-';}

export default function CompleteAuditPage() {
  const [items,setItems]=useState<Item[]>([]);const [total,setTotal]=useState(0);const [pg,setPg]=useState(1);const [ps,setPs]=useState(30);
  const [s,setS]=useState({status:'',code:'',prodCode:'',name:''});

  const fetch=useCallback(async()=>{
    const p:any={page:pg,pageSize:ps};
    if(s.status)p.status=s.status; if(s.code)p.code=s.code; if(s.prodCode)p.productionOrderNo=s.prodCode; if(s.name)p.materialName=s.name;
    const {data}=await api.get('/complete-reports',{params:p}); setItems(data.items); setTotal(data.total);
  },[pg,ps,s]); useEffect(()=>{fetch();},[fetch]);

  const wf=async(id:string,action:'submit'|'approve'|'withdraw'|'cancel-approve')=>{
    try{
      if(action==='cancel-approve'&&!window.confirm('确认撤销完工登卡？产品库存将扣回。'))return;
      await api.put(`/complete-reports/${id}/${action}`);
      toast(action==='approve'?'完工登卡成功':'操作成功','success'); fetch();
    }catch(e:any){toast(e.response?.data?.message||'操作失败','error');}
  };

  return (
    <div className="flex h-full min-h-0 flex-col rounded-lg border border-[#dcdfe6] bg-white">
      {/* Toolbar: 修改|提交|撤回|流程查看|导出 */}
      <div className="flex shrink-0 items-center justify-between gap-2 border-b border-[#ebeef5] bg-white px-4 py-3">
        <div className="flex items-center gap-1.5">
          <span className="text-sm font-medium text-foreground">完工报告</span>
          <DropdownMenu>
            <DropdownMenuTrigger className="inline-flex items-center gap-1 rounded-md border border-border bg-background px-3 h-9 text-[13px] font-medium shadow-sm hover:bg-accent">
              <MoreHorizontal className="h-3.5 w-3.5"/>更多操作<ChevronDown className="h-3.5 w-3.5"/>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start">
              <DropdownMenuItem onClick={()=>toast('流程查看待接入','info')}>流程查看</DropdownMenuItem>
              <DropdownMenuItem onClick={()=>toast('导出待接入','info')}>导出</DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
        <div className="flex items-center gap-1">
          <Button variant="ghost" size="sm" onClick={()=>setS({status:'',code:'',prodCode:'',name:''})}>重置</Button>
          <DropdownMenu>
            <DropdownMenuTrigger className="inline-flex items-center gap-1 rounded-md px-2.5 h-7 text-[13px] font-medium hover:bg-accent">常用搜索方案<ChevronDown className="h-3.5 w-3.5"/></DropdownMenuTrigger>
            <DropdownMenuContent align="end"><DropdownMenuItem disabled>保存当前搜索</DropdownMenuItem></DropdownMenuContent>
          </DropdownMenu>
          <Button variant="default" size="sm" className="gap-1" onClick={()=>{setPg(1);fetch();}}><Search className="h-4 w-4"/>搜索</Button>
        </div>
      </div>
      {/* Search */}
      <div className="shrink-0 border-b border-[#ebeef5] bg-[#fafafa] px-4 py-3">
        <div className="flex items-center gap-4 flex-wrap">
          <FS label="审批状态" v={s.status} onChange={v=>setS({...s,status:v})}/>
          <FI label="报告单号" v={s.code} onChange={v=>setS({...s,code:v})} ph="报告单号"/>
          <FI label="生产单号" v={s.prodCode} onChange={v=>setS({...s,prodCode:v})} ph="生产单号"/>
          <FI label="物料名称" v={s.name} onChange={v=>setS({...s,name:v})} ph="物料名称"/>
        </div>
      </div>
      {/* Table: 报告单号|来源|生产单号|物料|规格|预计产量|实际产量|部门|审批状态|操作 */}
      <div className="min-h-0 flex-1 overflow-auto">
        <ErpTable>
          <ErpThead>
            <ErpTh className="w-[170px]">报告单号</ErpTh>
            <ErpTh className="w-[90px]">来源</ErpTh>
            <ErpTh className="w-[170px]">生产单号</ErpTh>
            <ErpTh className="w-[160px]">物料</ErpTh>
            <ErpTh className="w-[120px]">规格</ErpTh>
            <ErpTh className="w-[100px]">预计产量</ErpTh>
            <ErpTh className="w-[100px]">实际产量</ErpTh>
            <ErpTh className="w-[140px]">部门</ErpTh>
            <ErpTh className="w-[100px]">审批状态</ErpTh>
            <ErpTh className="w-[220px] sticky right-0 z-10 bg-[#f5f7fa]">操作</ErpTh>
          </ErpThead>
          <ErpTbody>
            {items.map(i=>{
              const st=i.approvalStatus;
              return (<ErpTr key={i.id}>
                <ErpTd><ErpLink>{i.reportNo}</ErpLink></ErpTd>
                <ErpTd className="text-[#909399]">{i.sourceType||'-'}</ErpTd>
                <ErpTd className="text-[#409eff]">{i.productionOrderNo||'-'}</ErpTd>
                <ErpTd>{i.materialName||'-'}</ErpTd>
                <ErpTd className="text-[#909399]">{i.spec||'-'}</ErpTd>
                <ErpTd>{i.plannedQty?Number(i.plannedQty).toLocaleString():'-'}</ErpTd>
                <ErpTd className="font-medium">{i.actualQty?Number(i.actualQty).toLocaleString():'-'}</ErpTd>
                <ErpTd className="text-[#606266]">{i.deptName||'-'}</ErpTd>
                <ErpTd><ErpApproval status={st}/></ErpTd>
                <ErpTd className="sticky right-0 z-10 bg-white">
                  <ErpAction>
                    {st==='DRAFT'&&<ErpActionBtn onClick={()=>wf(i.id,'submit')}>提交</ErpActionBtn>}
                    {st==='SUBMITTED'&&<ErpActionBtn onClick={()=>wf(i.id,'withdraw')}>撤回</ErpActionBtn>}
                    {st==='SUBMITTED'&&<ErpActionBtn onClick={()=>wf(i.id,'approve')}>登卡/审核</ErpActionBtn>}
                    {st==='APPROVED'&&<ErpActionBtn onClick={()=>wf(i.id,'cancel-approve')}>撤销登卡</ErpActionBtn>}
                  </ErpAction>
                </ErpTd>
              </ErpTr>);
            })}
            {items.length===0&&<ErpEmpty colSpan={10}/>}
          </ErpTbody>
        </ErpTable>
      </div>
      <ErpPagination page={pg} pageSize={ps} total={total} onPage={setPg} onPageSize={v=>setPs(+v)}/>
    </div>
  );
}
function FI({label,v,onChange,ph}:{label:string;v:string;onChange:(v:string)=>void;ph:string}){
  return <div className="flex items-center gap-1.5"><span className="text-[13px] text-muted-foreground w-[70px] text-right shrink-0">{label}</span><Input className="w-[140px] h-9 rounded-md border border-[#dcdfe6] bg-white px-3 text-[13px]" value={v} onChange={e=>onChange(e.target.value)} placeholder={ph}/></div>;
}
function FS({label,v,onChange}:{label:string;v:string;onChange:(v:string)=>void}){
  const opts=[{v:'ALL',l:'全部'},{v:'DRAFT',l:'草稿'},{v:'SUBMITTED',l:'已提交'},{v:'APPROVED',l:'已通过'}];
  return <div className="flex items-center gap-1.5"><span className="text-[13px] text-muted-foreground w-[70px] text-right shrink-0">{label}</span><Select value={v||'ALL'} onValueChange={x=>onChange(!x||x==='ALL'?'':String(x))}><SelectTrigger className="w-[110px] h-9 rounded-md border border-[#dcdfe6] bg-white px-3 text-[13px]"><SelectValue/></SelectTrigger><SelectContent>{opts.map(o=><SelectItem key={o.v} value={o.v}>{o.l}</SelectItem>)}</SelectContent></Select></div>;
}
