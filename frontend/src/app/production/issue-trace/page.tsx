'use client';
import { useCallback, useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { ErpApproval, ErpEmpty, ErpLink, ErpPagination, ErpTable, ErpTbody, ErpTd, ErpTh, ErpThead, ErpTr } from '@/components/ui/erp-table';
import { ChevronDown, Search } from 'lucide-react';
import { toast } from '@/components/ui/toast';
import api from '@/lib/api';

interface TraceItem {
  id:string; orderNo:string; orderName:string; orgName:string|null;
  prodOrderNo:string|null; businessStatus:string;
  productCode:string|null; productName:string|null; isProduct:boolean;
  level:number; materialCode:string|null; materialName:string|null;
  spec:string|null; unit:string|null; requiredDate:string|null; shortage:boolean;
}

const BS_LABEL:Record<string,string>={PENDING_ISSUE:'待领料',ISSUING:'领料中',IN_PRODUCTION:'生产中',PENDING_STOCK:'待入库',COMPLETED:'已完成'};
function fmtDt(v:string|null){return v?new Date(v).toLocaleDateString('zh-CN'):'-';}

export default function IssueTracePage() {
  const [allTraces,setAllTraces]=useState<TraceItem[]>([]);
  const [pg,setPg]=useState(1);const [ps,setPs]=useState(30);
  const [s,setS]=useState({status:'',code:'',name:''});

  const fetch=useCallback(async()=>{
    const p:any={page:1,pageSize:1000,mode:'detail'};
    if(s.status)p.status=s.status; if(s.code)p.code=s.code; if(s.name)p.name=s.name;
    try {
      const {data}=await api.get('/production-orders',{params:p});
      const traces:TraceItem[]=[];
      for(const po of (data.items||[])) {
        const mats=po.materials||[];
        const lines=po.lines||[];
        if(mats.length>0){
          for(const m of mats) traces.push({
            id:m.id||`${po.id}-${m.lineNo}`, orderNo:po.orderNo, orderName:po.orderName,
            orgName:po.orgName??po.tenantName??null, prodOrderNo:po.orderNo,
            businessStatus:po.businessStatus,
            productCode:lines[0]?.materialCode||'', productName:lines[0]?.materialName||'',
            isProduct:false, level:1, materialCode:m.materialCode, materialName:m.materialName,
            spec:m.spec, unit:m.unit, requiredDate:null, shortage:false,
          });
        }else{
          traces.push({
            id:po.id, orderNo:po.orderNo, orderName:po.orderName,
            orgName:po.orgName??po.tenantName??null, prodOrderNo:po.orderNo,
            businessStatus:po.businessStatus,
            productCode:lines[0]?.materialCode||'', productName:lines[0]?.materialName||'',
            isProduct:true, level:0, materialCode:po.materialName, materialName:po.materialName,
            spec:'', unit:'', requiredDate:null, shortage:false,
          });
        }
      }
      setAllTraces(traces); setPg(1);
    }catch{setAllTraces([]);}
  },[s]); useEffect(()=>{fetch();},[fetch]);

  const total = allTraces.length;
  const items = allTraces.slice((pg-1)*ps, pg*ps);

  return (
    <div className="flex h-full min-h-0 flex-col rounded-lg border border-[#dcdfe6] bg-white">
      <div className="flex shrink-0 items-center justify-between gap-2 border-b border-[#ebeef5] bg-white px-4 py-3">
        <div className="flex items-center gap-1.5">
          <span className="text-sm font-medium">领料全追溯</span>
          <DropdownMenu>
            <DropdownMenuTrigger className="inline-flex items-center gap-1 rounded-md border border-border bg-background px-3 h-9 text-[13px] font-medium shadow-sm hover:bg-accent">
              更多操作<ChevronDown className="h-3.5 w-3.5"/></DropdownMenuTrigger>
            <DropdownMenuContent align="start">
              <DropdownMenuItem onClick={()=>toast('总览待接入','info')}>总览</DropdownMenuItem>
              <DropdownMenuItem onClick={()=>toast('导出待接入','info')}>导出</DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
        <div className="flex items-center gap-1">
          <Button variant="ghost" size="sm" onClick={()=>setS({status:'',code:'',name:''})}>重置</Button>
          <Button variant="default" size="sm" className="gap-1" onClick={()=>{setPg(1);fetch();}}><Search className="h-4 w-4"/>搜索</Button>
        </div>
      </div>
      <div className="shrink-0 border-b border-[#ebeef5] bg-[#fafafa] px-4 py-3">
        <div className="flex items-center gap-4 flex-wrap">
          <FS label="审批状态" v={s.status} onChange={v=>setS({...s,status:v})}/>
          <FI label="生产编码" v={s.code} onChange={v=>setS({...s,code:v})} ph="生产编码"/>
          <FI label="生产名称" v={s.name} onChange={v=>setS({...s,name:v})} ph="生产名称"/>
        </div>
      </div>
      <div className="min-h-0 flex-1 overflow-auto">
        <ErpTable>
          <ErpThead>
            <ErpTh className="w-[170px]">生产编码</ErpTh>
            <ErpTh className="w-[200px]">生产名称</ErpTh>
            <ErpTh className="w-[120px]">所属组织</ErpTh>
            <ErpTh className="w-[170px]">生产单号</ErpTh>
            <ErpTh className="w-[100px]">生产单业务状态</ErpTh>
            <ErpTh className="w-[130px]">产品编码</ErpTh>
            <ErpTh className="w-[150px]">产品名称</ErpTh>
            <ErpTh className="w-[90px]">阶次</ErpTh>
            <ErpTh className="w-[130px]">材料编码</ErpTh>
            <ErpTh className="w-[150px]">材料名称</ErpTh>
            <ErpTh className="w-[120px]">规格型号</ErpTh>
            <ErpTh className="w-[80px]">计量单位</ErpTh>
            <ErpTh className="w-[120px]">需求日期</ErpTh>
            <ErpTh className="w-[80px]">缺料</ErpTh>
          </ErpThead>
          <ErpTbody>
            {items.map(i=>(
              <ErpTr key={i.id}>
                <ErpTd className="text-[#409eff]">{i.orderNo}</ErpTd>
                <ErpTd>{i.orderName||'-'}</ErpTd>
                <ErpTd className="text-[#606266]">{i.orgName||'-'}</ErpTd>
                <ErpTd><ErpLink>{i.prodOrderNo||'-'}</ErpLink></ErpTd>
                <ErpTd><ErpApproval status={i.businessStatus} labels={BS_LABEL}/></ErpTd>
                <ErpTd className="text-[#409eff]">{i.productCode||'-'}</ErpTd>
                <ErpTd>{i.productName||'-'}</ErpTd>
                <ErpTd className="text-[#909399]">{i.level}</ErpTd>
                <ErpTd className="text-[#409eff]">{i.materialCode||'-'}</ErpTd>
                <ErpTd>{i.materialName||'-'}</ErpTd>
                <ErpTd className="text-[#909399]">{i.spec||'-'}</ErpTd>
                <ErpTd>{i.unit||'-'}</ErpTd>
                <ErpTd className="text-[#909399]">{fmtDt(i.requiredDate)}</ErpTd>
                <ErpTd>{i.shortage?<span className="text-[#f56c6c]">是</span>:<span className="text-[#67c23a]">否</span>}</ErpTd>
              </ErpTr>
            ))}
            {items.length===0&&<ErpEmpty colSpan={14}/>}
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
