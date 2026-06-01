'use client';import { useState, useEffect } from 'react';import { useRouter } from 'next/navigation';import api from '@/lib/api';import { Input } from '@/components/ui/input';import { FormLayout,FormSection,FormGrid,FormField } from '@/components/form/form-layout';import { LinesEditor, LineItem } from '@/components/ui/lines-editor';import { EntitySelect } from '@/components/form/entity-select';import { applySupplierSelection, applyDepartmentSelection, applyProjectSelection, applyContractSelection, applySourceDocumentSelection } from '@/lib/field-linkage';import { calcTotalFromLines, recalcHeaderTotals } from '@/lib/calc';import { toast } from '@/components/ui/toast';const FI='h-9 rounded-md border border-border bg-background px-3 text-[13px] w-full';

export default function PurchaseOrderCreate(){const router=useRouter();
const [f,setF]=useState({orderNo:'',orderName:'',supplierId:'',supplierCode:'',supplierName:'',purchaser:'',orderType:'',
  projectId:'',projectCode:'',projectName:'',contractId:'',contractCode:'',contractName:'',
  departmentId:'',departmentCode:'',departmentName:'',
  purchasePlanId:'',purchasePlanNo:'',totalAmount:'',expectedDeliveryDate:'',remark:''});
const [lines,setLines]=useState<LineItem[]>([]);
const [planLoading,setPlanLoading]=useState(false);
useEffect(()=>{api.get('/common/next-code',{params:{entity:'purchaseOrder'}}).then(r=>setF((prev:any)=>({...prev,orderNo:r.data.code})));},[]);

const onLinesChange=(newLines:LineItem[])=>{
  setLines(newLines);
  if(newLines.length>0){const h=recalcHeaderTotals(newLines);setF(prev=>({...prev,totalAmount:h.totalAmount}));}
};

const onPlanSelect=async(id:string)=>{
  setPlanLoading(true);
  try{
    const result=await applySourceDocumentSelection('PURCHASE_PLAN',id,{
      materialCode:'materialCode',materialName:'materialName',spec:'spec',unit:'unit',
      quantity:'quantity',unitPrice:'unitPrice',amount:'amount',requiredDate:'requiredDate',warehouseCode:'warehouseCode',
    },api);
    setF(prev=>({...prev,purchasePlanId:id,purchasePlanNo:result.header.sourceNo||'',
      supplierId:result.header.supplierId||prev.supplierId,
      supplierName:result.header.supplierName||prev.supplierName,}));
    if(result.lines.length>0)onLinesChange(result.lines as LineItem[]);
    toast('已加载采购计划明细','success');
  }catch(e:any){toast(e.response?.data?.message||'加载失败','error');}
  finally{setPlanLoading(false);}
};

const save=async()=>{
  if(!f.orderName)return toast('请填写订单名称','error');
  if(!f.supplierName)return toast('请选择供应商','error');
  const payload:any={...f};
  if(lines.length>0){payload.lines=lines;payload.totalAmount=calcTotalFromLines(lines);}
  await api.post('/purchase-orders',payload);router.push('/purchase/order');
};

return(<FormLayout title="新增采购订单" onSave={save} sections={[{id:'b',title:'基本信息'},{id:'s',title:'来源关联'},{id:'l',title:'明细信息'}]} activeSection="b">
<FormSection id="b" title="基本信息"><FormGrid>
<FormField label="订单编号"><Input className={FI} value={f.orderNo} readOnly disabled/></FormField>
<FormField label="订单名称" required><Input className={FI} value={f.orderName} onChange={e=>setF({...f,orderName:e.target.value})}/></FormField>
<FormField label="供应商" required>
  <EntitySelect entity="supplier" value={f.supplierId}
    onChange={(id,s)=>{setF({...f,...applySupplierSelection(s)});}}/></FormField>
<FormField label="采购负责人"><Input className={FI} value={f.purchaser} onChange={e=>setF({...f,purchaser:e.target.value})}/></FormField>
<FormField label="采购方式"><Input className={FI} value={f.orderType} onChange={e=>setF({...f,orderType:e.target.value})}/></FormField>
<FormField label="金额"><Input className={FI} value={lines.length>0?calcTotalFromLines(lines):f.totalAmount} placeholder="自动=明细合计" readOnly disabled/></FormField>
<FormField label="期望交货日"><Input type="date" className={FI} value={f.expectedDeliveryDate} onChange={e=>setF({...f,expectedDeliveryDate:e.target.value})}/></FormField>
<FormField label="备注"><Input className={FI} value={f.remark} onChange={e=>setF({...f,remark:e.target.value})}/></FormField>
</FormGrid></FormSection>
<FormSection id="s" title="来源关联"><FormGrid>
<FormField label="关联计划"><EntitySelect entity="purchasePlan" value={f.purchasePlanId} status="APPROVED"
  onChange={(id)=>{setF({...f,purchasePlanId:id});onPlanSelect(id);}} disabled={planLoading}/></FormField>
<FormField label="关联项目"><EntitySelect entity="project" value={f.projectId}
  onChange={(id,p)=>{setF({...f,...applyProjectSelection(p)});}}/></FormField>
<FormField label="关联合同"><EntitySelect entity="contract" value={f.contractId}
  onChange={(id,c)=>{setF({...f,...applyContractSelection(c)});}}/></FormField>
<FormField label="采购部门"><EntitySelect entity="department" value={f.departmentId}
  onChange={(id,d)=>{setF({...f,...applyDepartmentSelection(d)});}}/></FormField>
</FormGrid></FormSection>
<FormSection id="l" title="明细信息"><LinesEditor lines={lines} onChange={onLinesChange}/></FormSection>
</FormLayout>);}
