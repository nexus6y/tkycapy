'use client';
import { useCallback, useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { toast } from '@/components/ui/toast';
import { ErpAction, ErpActionBtn, ErpApproval, ErpEmpty, ErpLink, ErpPagination, ErpTable, ErpTbody, ErpTd, ErpTh, ErpThead, ErpTr } from '@/components/ui/erp-table';
import { ChevronDown, Search } from 'lucide-react';
import api from '@/lib/api';

interface Item {
  id:string; damageNo:string; approvalStatus:string; opinion:string|null;
  materialCode:string|null; materialName:string|null; spec:string|null; unit:string|null;
  orgName:string|null; prodOrderNo:string|null; issueOrderNo:string|null;
  issueOutNo:string|null; returnOrderNo:string|null; returnLineNo:string|null;
  inspectionNo:string|null; inspectionLineNo:string|null;
  projectCode:string|null; projectName:string|null; createdAt:string;
  purchasePlanId:string|null; purchasePlanNo:string|null;
}

function fmtDt(v:string|null){return v?new Date(v).toLocaleDateString('zh-CN'):'-';}

export default function DamageAuditPage() {
  const [items,setItems]=useState<Item[]>([]);const [total,setTotal]=useState(0);
  const [pg,setPg]=useState(1);const [ps,setPs]=useState(30);
  const [s,setS]=useState({status:'',code:'',name:''});

  const fetch=useCallback(async()=>{
    const p:any={page:pg,pageSize:ps};
    if(s.status)p.status=s.status; if(s.code)p.code=s.code; if(s.name)p.name=s.name;
    try {
      const {data}=await api.get('/scrap-orders',{params:p});
      const mapped = (data.items||[]).map((so:any)=>({
        id:so.id, damageNo:so.orderNo, approvalStatus:so.approvalStatus,
        opinion:so.disposalMethod, materialCode:so.materialCode,
        materialName:so.materialName, spec:so.spec, unit:so.unit,
        orgName:so.orgName??so.tenantName??null, prodOrderNo:null,
        issueOrderNo:null, issueOutNo:null, returnOrderNo:null, returnLineNo:null,
        inspectionNo:null, inspectionLineNo:null, projectCode:null, projectName:null,
        createdAt:so.createdAt,
        purchasePlanId:so.purchasePlanId??null, purchasePlanNo:so.purchasePlanNo??null,
      }));
      setItems(mapped); setTotal(data.total||0);
    } catch { setItems([]); setTotal(0); }
  },[pg,ps,s]); useEffect(()=>{fetch();},[fetch]);

  const wf=async(id:string,action:'submit'|'approve'|'withdraw')=>{
    try{await api.put(`/scrap-orders/${id}/${action}`);fetch();}
    catch(e:any){toast(e.response?.data?.message||'操作失败','error');}
  };

  const pushPlan=async(id:string)=>{
    try{
      const {data}=await api.post(`/scrap-orders/${id}/push-to-purchase-plan`);
      toast(`采购计划已生成: ${data.purchasePlanNo}`,'success');
      fetch();
    }catch(e:any){toast(e.response?.data?.message||'下推失败','error');}
  };

  return (
    <div className="flex h-full min-h-0 flex-col rounded-lg border border-[#dcdfe6] bg-white">
      {/* Toolbar: 业务引导|下推采购计划|流程查看|导出 — per docs/business-flows.md §7.7 */}
      <div className="flex shrink-0 items-center justify-between gap-2 border-b border-[#ebeef5] bg-white px-4 py-3">
        <div className="flex items-center gap-1.5">
          <span className="text-sm font-medium">制损单审核</span>
          <Button variant="outline" size="sm" onClick={()=>toast('业务引导待接入','info')}>业务引导</Button>
          <Button variant="outline" size="sm" onClick={()=>toast('流程查看待接入','info')}>流程查看</Button>
          <Button variant="outline" size="sm" onClick={()=>toast('导出待接入','info')}>导出</Button>
        </div>
        <div className="flex items-center gap-1">
          <Button variant="ghost" size="sm" onClick={()=>setS({status:'',code:'',name:''})}>重置</Button>
          <Button variant="outline" size="sm">展开</Button>
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
          <FI label="制损单号" v={s.code} onChange={v=>setS({...s,code:v})} ph="制损单号"/>
          <FI label="物料名称" v={s.name} onChange={v=>setS({...s,name:v})} ph="物料名称"/>
        </div>
      </div>
      {/* Table */}
      <div className="min-h-0 flex-1 overflow-auto">
        <ErpTable>
          <ErpThead>
            <ErpTh className="w-[100px]">审批状态</ErpTh>
            <ErpTh className="w-[90px]">处理意见</ErpTh>
            <ErpTh className="w-[170px]">制损单号</ErpTh>
            <ErpTh className="w-[130px]">物料编码</ErpTh>
            <ErpTh className="w-[140px]">物料名称</ErpTh>
            <ErpTh className="w-[120px]">规格型号</ErpTh>
            <ErpTh className="w-[80px]">计量单位</ErpTh>
            <ErpTh className="w-[120px]">所属组织</ErpTh>
            <ErpTh className="w-[150px]">来源生产单号</ErpTh>
            <ErpTh className="w-[150px]">来源领料单号</ErpTh>
            <ErpTh className="w-[160px]">来源领料出库单号</ErpTh>
            <ErpTh className="w-[150px]">来源退料单号</ErpTh>
            <ErpTh className="w-[130px]">来源退料行号</ErpTh>
            <ErpTh className="w-[150px]">来源质检单号</ErpTh>
            <ErpTh className="w-[140px]">来源质检单行号</ErpTh>
            <ErpTh className="w-[150px]">来源项目编码</ErpTh>
            <ErpTh className="w-[150px]">来源项目名称</ErpTh>
            <ErpTh className="w-[130px]">创建日期</ErpTh>
            <ErpTh className="w-[220px] sticky right-0 z-10 bg-[#f5f7fa]">操作</ErpTh>
          </ErpThead>
          <ErpTbody>
            {items.map(i=>{
              const st=i.approvalStatus;
              return (<ErpTr key={i.id}>
                <ErpTd><ErpApproval status={st}/></ErpTd>
                <ErpTd className="text-[#909399]">{i.opinion||'-'}</ErpTd>
                <ErpTd><ErpLink>{i.damageNo}</ErpLink></ErpTd>
                <ErpTd className="text-[#409eff]">{i.materialCode||'-'}</ErpTd>
                <ErpTd>{i.materialName||'-'}</ErpTd>
                <ErpTd className="text-[#909399]">{i.spec||'-'}</ErpTd>
                <ErpTd>{i.unit||'-'}</ErpTd>
                <ErpTd className="text-[#606266]">{i.orgName||'-'}</ErpTd>
                <ErpTd className="text-[#409eff]">{i.prodOrderNo||'-'}</ErpTd>
                <ErpTd className="text-[#409eff]">{i.issueOrderNo||'-'}</ErpTd>
                <ErpTd className="text-[#409eff]">{i.issueOutNo||'-'}</ErpTd>
                <ErpTd className="text-[#409eff]">{i.returnOrderNo||'-'}</ErpTd>
                <ErpTd className="text-[#909399]">{i.returnLineNo||'-'}</ErpTd>
                <ErpTd className="text-[#409eff]">{i.inspectionNo||'-'}</ErpTd>
                <ErpTd className="text-[#909399]">{i.inspectionLineNo||'-'}</ErpTd>
                <ErpTd className="text-[#409eff]">{i.projectCode||'-'}</ErpTd>
                <ErpTd>{i.projectName||'-'}</ErpTd>
                <ErpTd className="text-[#909399]">{fmtDt(i.createdAt)}</ErpTd>
                <ErpTd className="sticky right-0 z-10 bg-white">
                  <ErpAction>
                    {st==='DRAFT'&&<ErpActionBtn onClick={()=>wf(i.id,'submit')}>提交</ErpActionBtn>}
                    {st==='SUBMITTED'&&<ErpActionBtn onClick={()=>wf(i.id,'withdraw')}>撤回</ErpActionBtn>}
                    {st==='SUBMITTED'&&<ErpActionBtn onClick={()=>wf(i.id,'approve')}>审核通过</ErpActionBtn>}
                    {st==='APPROVED'&&<ErpActionBtn onClick={()=>pushPlan(i.id)}>下推采购计划</ErpActionBtn>}
                  </ErpAction>
                </ErpTd>
              </ErpTr>);
            })}
            {items.length===0&&<ErpEmpty colSpan={19}/>}
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
