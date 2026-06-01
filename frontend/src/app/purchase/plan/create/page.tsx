'use client';import { useState, useEffect } from 'react';import { useRouter } from 'next/navigation';import api from '@/lib/api';import { Input } from '@/components/ui/input';import { FormLayout,FormSection,FormGrid,FormField } from '@/components/form/form-layout';import { LinesEditor,LineItem } from '@/components/ui/lines-editor';import { EntitySelect } from '@/components/form/entity-select';import { applySupplierSelection, applyMaterialSelection, applySourceDocumentSelection } from '@/lib/field-linkage';import { calcTotalFromLines, recalcHeaderTotals } from '@/lib/calc';import { toast } from '@/components/ui/toast';const FI='h-9 rounded-md border border-border bg-background px-3 text-[13px] w-full';

export default function PurchasePlanCreate(){const router=useRouter();
const [f,setF]=useState({orderNo:'',orderName:'',supplierId:'',supplierCode:'',supplierName:'',demandPlanId:'',demandPlanNo:'',materialId:'',materialCode:'',materialName:'',specification:'',unit:'',quantity:'',requiredDate:'',totalAmount:'',remark:''});
const [lines,setLines]=useState<LineItem[]>([]);
useEffect(()=>{api.get('/common/next-code',{params:{entity:'purchasePlan'}}).then(r=>setF((prev:any)=>({...prev,orderNo:r.data.code})));},[]);

const onLinesChange=(newLines:LineItem[])=>{
  setLines(newLines);
  if(newLines.length>0){const h=recalcHeaderTotals(newLines);setF(prev=>({...prev,totalAmount:h.totalAmount,quantity:h.totalQuantity}));}
};

const onDemandPlanSelect=async(id:string)=>{
  try{
    const result=await applySourceDocumentSelection('DEMAND_PLAN',id,{
      materialCode:'materialCode',materialName:'materialName',spec:'spec',unit:'unit',
      quantity:'quantity',warehouseCode:'warehouseCode',
    },api);
    setF(prev=>({...prev,demandPlanId:id,demandPlanNo:result.header.sourceNo||''}));
    if(result.lines.length>0)onLinesChange(result.lines as LineItem[]);
    toast('已加载需求计划明细','success');
  }catch(e:any){toast(e.response?.data?.message||'加载失败','error');}
};

const save=async()=>{
  if(!f.orderName)return toast('请填写计划名称','error');
  const payload:any={...f};
  if(lines.length>0){payload.lines=lines;payload.totalAmount=calcTotalFromLines(lines);}
  await api.post('/purchase-plans',payload);router.push('/purchase/plan');
};

return(<FormLayout title="新增采购计划" onSave={save} sections={[{id:'b',title:'计划信息'},{id:'s',title:'来源关联'},{id:'l',title:'明细信息'}]} activeSection="b">
<FormSection id="b" title="计划信息"><FormGrid>
<FormField label="计划编号"><Input className={FI} value={f.orderNo} readOnly disabled/></FormField>
<FormField label="计划名称" required><Input className={FI} value={f.orderName} onChange={e=>setF({...f,orderName:e.target.value})}/></FormField>
<FormField label="供应商"><EntitySelect entity="supplier" value={f.supplierId} onChange={(id,s)=>{setF({...f,...applySupplierSelection(s)});}}/></FormField>
<FormField label="供应商编码">{f.supplierCode&&<Input className={FI} value={f.supplierCode} readOnly disabled/>}</FormField>
<FormField label="需求日期"><Input type="date" className={FI} value={f.requiredDate} onChange={e=>setF({...f,requiredDate:e.target.value})}/></FormField>
<FormField label="金额"><Input className={FI} value={lines.length>0?calcTotalFromLines(lines):f.totalAmount} placeholder="自动=明细合计" readOnly disabled/></FormField>
<div className="col-span-2"><FormField label="备注"><Input className={FI} value={f.remark} onChange={e=>setF({...f,remark:e.target.value})}/></FormField></div>
</FormGrid></FormSection>
<FormSection id="s" title="来源关联"><FormGrid>
<FormField label="来源需求计划"><EntitySelect entity="demandPlan" value={f.demandPlanId} status="APPROVED" onChange={(id)=>{setF({...f,demandPlanId:id});onDemandPlanSelect(id);}}/></FormField>
<FormField label="物料选择"><EntitySelect entity="material" value={f.materialId} onChange={(id,m)=>{setF({...f,...applyMaterialSelection(m)});}}/></FormField>
</FormGrid></FormSection>
<FormSection id="l" title="明细信息"><LinesEditor lines={lines} onChange={onLinesChange}/></FormSection>
</FormLayout>);}
