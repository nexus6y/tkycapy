'use client';import { useState, useEffect } from 'react';import { useRouter, useParams } from 'next/navigation';import api from '@/lib/api';import { Input } from '@/components/ui/input';import { FormLayout,FormSection,FormGrid,FormField } from '@/components/form/form-layout';import { LinesEditor, LineItem } from '@/components/ui/lines-editor';import { EntitySelect } from '@/components/form/entity-select';import { applySupplierSelection } from '@/lib/field-linkage';import { calcTotalFromLines } from '@/lib/calc';const FI='h-9 rounded-md border border-border bg-background px-3 text-[13px] w-full';

export default function PurchaseOrderEdit(){const router=useRouter();const {id}=useParams();const [f,setF]=useState({orderNo:'',orderName:'',supplierId:'',supplierCode:'',supplierName:'',purchaser:'',orderType:'',totalAmount:'',expectedDeliveryDate:'',remark:''} as any);
const [lines,setLines]=useState<LineItem[]>([]);
useEffect(()=>{api.get('/purchase-orders/'+id).then(r=>{const d=r.data;setF({orderNo:d.orderNo||'',orderName:d.orderName||'',supplierId:d.supplierId||'',supplierCode:d.supplierCode||'',supplierName:d.supplierName||'',purchaser:d.purchaser||'',orderType:d.purchaseType||'',totalAmount:d.totalAmount||'',expectedDeliveryDate:d.expectedDeliveryDate?d.expectedDeliveryDate.slice(0,10):'',remark:d.remark||''});if(d.lines)setLines(d.lines);});},[id]);
const save=async()=>{
  const payload:any={...f};
  if(lines.length>0){payload.lines=lines;payload.totalAmount=calcTotalFromLines(lines);}
  await api.put('/purchase-orders/'+id,payload);router.push('/purchase/order');
};
return(<FormLayout title="修改采购订单" onSave={save} sections={[{id:'b',title:'基本信息'},{id:'l',title:'明细信息'}]} activeSection="b">
<FormSection id="b" title="基本信息"><FormGrid>
<FormField label="订单编号" required><Input className={FI} value={f.orderNo} onChange={e=>setF({...f,orderNo:e.target.value})}/></FormField>
<FormField label="订单名称" required><Input className={FI} value={f.orderName} onChange={e=>setF({...f,orderName:e.target.value})}/></FormField>
<FormField label="供应商" required><EntitySelect entity="supplier" value={f.supplierId||''} onChange={(id,s)=>{setF({...f,...applySupplierSelection(s)});}}/></FormField>
<FormField label="采购负责人"><Input className={FI} value={f.purchaser||''} onChange={e=>setF({...f,purchaser:e.target.value})}/></FormField>
<FormField label="采购方式"><Input className={FI} value={f.orderType||''} onChange={e=>setF({...f,orderType:e.target.value})}/></FormField>
<FormField label="金额"><Input className={FI} value={lines.length>0?calcTotalFromLines(lines):(f.totalAmount||'')} placeholder="自动=明细合计" readOnly disabled/></FormField>
<FormField label="期望交货日"><Input type="date" className={FI} value={f.expectedDeliveryDate||''} onChange={e=>setF({...f,expectedDeliveryDate:e.target.value})}/></FormField>
<FormField label="备注"><Input className={FI} value={f.remark||''} onChange={e=>setF({...f,remark:e.target.value})}/></FormField>
</FormGrid></FormSection>
<FormSection id="l" title="明细信息"><LinesEditor lines={lines} onChange={setLines}/></FormSection>
</FormLayout>);}
