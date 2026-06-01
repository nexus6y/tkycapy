'use client';import { useState, useEffect } from 'react';import { useRouter, useParams } from 'next/navigation';import api from '@/lib/api';import { Input } from '@/components/ui/input';import { FormLayout,FormSection,FormGrid,FormField } from '@/components/form/form-layout';import { LinesEditor, LineItem } from '@/components/ui/lines-editor';import { EntitySelect } from '@/components/form/entity-select';import { applySupplierSelection, applyMaterialSelection } from '@/lib/field-linkage';import { calcTotalFromLines, recalcHeaderTotals } from '@/lib/calc';import { toast } from '@/components/ui/toast';const FI='h-9 rounded-md border border-border bg-background px-3 text-[13px] w-full';

export default function PurchasePlanEdit(){const router=useRouter();const {id}=useParams();const [f,setF]=useState({orderNo:'',orderName:'',supplierId:'',supplierCode:'',supplierName:'',materialId:'',materialCode:'',materialName:'',specification:'',unit:'',quantity:'',requiredDate:'',totalAmount:''} as any);
const [lines,setLines]=useState<LineItem[]>([]);
useEffect(()=>{api.get('/purchase-plans/'+id).then(r=>{const d=r.data;setF({...d,requiredDate:d.requiredDate?d.requiredDate.split('T')[0]:''});if(d.lines)setLines(d.lines);});},[id]);

const onLinesChange=(newLines:LineItem[])=>{
  setLines(newLines);
  if(newLines.length>0){const h=recalcHeaderTotals(newLines);setF((prev:any)=>({...prev,totalAmount:h.totalAmount,quantity:h.totalQuantity}));}
};

const save=async()=>{
  try{
    if(!f.orderName)return toast('请填写计划名称','error');
    const payload:any={...f};
    if(lines.length>0){payload.lines=lines;payload.totalAmount=calcTotalFromLines(lines);}
    await api.put('/purchase-plans/'+id,payload);router.push('/purchase/plan');
  }catch(e:any){toast(e.response?.data?.message||'保存失败','error');}
};

return(<FormLayout title="修改采购计划" onSave={save} sections={[{id:'b',title:'计划信息'},{id:'l',title:'明细信息'}]} activeSection="b">
<FormSection id="b" title="计划信息"><FormGrid>
<FormField label="计划编号" required><Input className={FI} value={f.orderNo} onChange={e=>setF({...f,orderNo:e.target.value})}/></FormField>
<FormField label="计划名称" required><Input className={FI} value={f.orderName} onChange={e=>setF({...f,orderName:e.target.value})}/></FormField>
<FormField label="供应商"><EntitySelect entity="supplier" value={f.supplierId||''} onChange={(id,s)=>{setF({...f,...applySupplierSelection(s)});}}/></FormField>
<FormField label="物料"><EntitySelect entity="material" value={f.materialId||''} onChange={(id,m)=>{setF({...f,...applyMaterialSelection(m)});}}/></FormField>
<FormField label="数量"><Input className={FI} value={lines.length>0?recalcHeaderTotals(lines).totalQuantity:(f.quantity||'')} readOnly disabled/></FormField>
<FormField label="金额"><Input className={FI} value={lines.length>0?calcTotalFromLines(lines):(f.totalAmount||'')} placeholder="自动=明细合计" readOnly disabled/></FormField>
<FormField label="需求日期"><Input type="date" className={FI} value={f.requiredDate||''} onChange={e=>setF({...f,requiredDate:e.target.value})}/></FormField>
</FormGrid></FormSection>
<FormSection id="l" title="明细信息"><LinesEditor lines={lines} onChange={onLinesChange}/></FormSection>
</FormLayout>);}
