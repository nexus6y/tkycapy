'use client';import { useState, useEffect } from 'react';import { useRouter, useParams } from 'next/navigation';import api from '@/lib/api';import { Input } from '@/components/ui/input';import { FormLayout,FormSection,FormGrid,FormField } from '@/components/form/form-layout';import { LinesEditor, LineItem } from '@/components/ui/lines-editor';import { EntityPickerInput } from '@/components/form/entity-picker-input';import { applySupplierSelection, applyDepartmentSelection, applyProjectSelection, applyPurchaseContractSelection } from '@/lib/field-linkage';import { calcTotalFromLines, recalcHeaderTotals } from '@/lib/calc';import { toast } from '@/components/ui/toast';const FI='h-9 rounded-md border border-border bg-background px-3 text-[13px] w-full';

export default function PurchaseOrderEdit(){const router=useRouter();const {id}=useParams<{id:string}>();const [loading,setLoading]=useState(true);
const [f,setF]=useState<any>({});
const [lines,setLines]=useState<LineItem[]>([]);
const [contractLoading,setContractLoading]=useState(false);
const editable=f.approvalStatus==='DRAFT'||f.approvalStatus==='REJECTED';

useEffect(()=>{
  api.get('/purchase-orders/'+id).then(r=>{const d=r.data;setF({
    orderNo:d.orderNo||'',orderName:d.orderName||'',
    supplierId:d.supplierId||'',supplierName:d.supplierName||'',
    approvalStatus:d.approvalStatus||'DRAFT',
    purchaser:d.purchaser||'',purchaseType:d.purchaseType||'',
    projectId:d.projectId||'',projectName:d.projectName||'',
    contractId:d.contractId||'',contractName:d.contractName||'',
    departmentId:d.departmentId||'',departmentName:d.departmentName||'',
    purchasePlanId:d.purchasePlanId||'',purchasePlanNo:d.purchasePlanNo||'',
    totalAmount:d.totalAmount||'',
    expectedDeliveryDate:d.expectedDeliveryDate?d.expectedDeliveryDate.slice(0,10):'',
    remark:d.remark||'',
  });if(d.lines)setLines(d.lines);setLoading(false);});
},[id]);

const onLinesChange=(newLines:LineItem[])=>{
  setLines(newLines);
  if(newLines.length>0){const h=recalcHeaderTotals(newLines);setF((prev:any)=>({...prev,totalAmount:h.totalAmount}));}
};

const onContractSelect=(cid:string,contract:any)=>{
  const fill=applyPurchaseContractSelection(contract);
  setF((prev:any)=>({
    ...prev,
    contractId:fill.contractId||'',contractName:fill.contractName||'',
    supplierId:fill.supplierId||prev.supplierId,
    supplierName:fill.supplierName||prev.supplierName,
    projectId:fill.projectId||prev.projectId,
    projectName:fill.projectName||prev.projectName,
    departmentId:fill.departmentId||prev.departmentId,
    departmentName:fill.departmentName||prev.departmentName,
    purchaseType:fill.purchaseType||prev.purchaseType||'',
  }));
  if(!cid)return;
  setContractLoading(true);
  api.get('/contracts/'+cid).then(r=>{
    const lns=r.data.lines;
    if(lns&&lns.length>0){
      const m=lns.map((l:any,i:number)=>({
        lineNo:l.lineNo||i+1,materialCode:l.materialCode||'',materialName:l.materialName||'',
        spec:l.specification||'',unit:l.unit||'',
        quantity:l.quantity!=null?String(l.quantity):'',unitPrice:l.unitPrice!=null?String(l.unitPrice):'',
        amount:l.amount!=null?String(l.amount):'',warehouseCode:'',remark:l.remark||'',
      }));
      setLines(m);const h=recalcHeaderTotals(m);setF((prev:any)=>({...prev,totalAmount:h.totalAmount}));
      toast(`已加载合同${lns.length}条明细`,'success');
    }
  }).catch(()=>{}).finally(()=>setContractLoading(false));
};

const save=async()=>{
  const payload:any={
    orderNo:f.orderNo,orderName:f.orderName,
    supplierId:f.supplierId,supplierName:f.supplierName,
    purchaseType:f.purchaseType,purchaser:f.purchaser,
    projectId:f.projectId||undefined,projectName:f.projectName||undefined,
    contractId:f.contractId||undefined,contractName:f.contractName||undefined,
    departmentId:f.departmentId||undefined,departmentName:f.departmentName||undefined,
    purchasePlanId:f.purchasePlanId||undefined,purchasePlanNo:f.purchasePlanNo||undefined,
    expectedDeliveryDate:f.expectedDeliveryDate||undefined,
    totalAmount:lines.length>0?calcTotalFromLines(lines):(f.totalAmount||undefined),
    remark:f.remark||undefined,
  };
  if(lines.length>0)payload.lines=lines;
  try{
    await api.put('/purchase-orders/'+id,payload);
    router.push('/purchase/order');
  }catch(e:any){toast(e.response?.data?.message||'保存失败','error');}
};

if(loading)return<div className="h-full flex items-center justify-center text-muted-foreground">加载中...</div>;

return(<FormLayout title={'编辑采购订单：'+f.orderNo} onSave={editable?save:(async()=>{})} sections={[{id:'b',title:'基本信息'},{id:'s',title:'来源关联'},{id:'l',title:'明细信息'}]} activeSection="b">
{!editable&&<div className="px-4 py-2 bg-[#fdf6ec] text-[#e6a23c] text-[13px] border border-[#faecd8] rounded">订单已提交/审批，不可编辑。</div>}
<FormSection id="b" title="基本信息"><FormGrid>
<FormField label="订单编号"><Input className={FI} value={f.orderNo} readOnly disabled/></FormField>
<FormField label="订单名称" required><Input className={FI} value={f.orderName||''} onChange={e=>setF({...f,orderName:e.target.value})} disabled={!editable} data-testid="po-ordername-input"/></FormField>
<FormField label="供应商" required>
  <EntityPickerInput entity="supplier" value={f.supplierName||''} displayText={f.supplierName}
    onChange={(id:any,s:any)=>{setF({...f,...applySupplierSelection(s)});}} disabled={!editable}/></FormField>
<FormField label="采购负责人"><Input className={FI} value={f.purchaser||''} onChange={e=>setF({...f,purchaser:e.target.value})} disabled={!editable}/></FormField>
<FormField label="采购方式"><Input className={FI} value={f.purchaseType||''} onChange={e=>setF({...f,purchaseType:e.target.value})} disabled={!editable}/></FormField>
<FormField label="金额"><Input className={FI} value={lines.length>0?calcTotalFromLines(lines):(f.totalAmount||'')} placeholder="自动=明细合计" readOnly disabled/></FormField>
<FormField label="期望交货日"><Input type="date" className={FI} value={f.expectedDeliveryDate||''} onChange={e=>setF({...f,expectedDeliveryDate:e.target.value})} disabled={!editable}/></FormField>
<FormField label="备注"><Input className={FI} value={f.remark||''} onChange={e=>setF({...f,remark:e.target.value})} disabled={!editable}/></FormField>
</FormGrid></FormSection>
<FormSection id="s" title="来源关联"><FormGrid>
<FormField label="关联项目"><EntityPickerInput entity="project" value={f.projectName||''} displayText={f.projectName}
  onChange={(id:any,p:any)=>{setF({...f,...applyProjectSelection(p)});}} disabled={!editable}/></FormField>
<FormField label="关联合同">
  <EntityPickerInput entity="contract" value={f.contractName||''} displayText={f.contractName}
    status="APPROVED" extraParams={{type:'采购合同'}}
    onChange={(id:any,c:any)=>{onContractSelect(id,c);}} disabled={!editable}/></FormField>
<FormField label="采购部门"><EntityPickerInput entity="department" value={f.departmentName||''} displayText={f.departmentName}
  onChange={(id:any,d:any)=>{setF({...f,...applyDepartmentSelection(d)});}} disabled={!editable}/></FormField>
</FormGrid></FormSection>
<FormSection id="l" title="明细信息">{contractLoading?<div className="py-4 text-center text-[13px] text-muted-foreground">加载合同明细中...</div>:<LinesEditor lines={lines} onChange={editable?onLinesChange:(()=>{})}/>}</FormSection>
</FormLayout>);}
