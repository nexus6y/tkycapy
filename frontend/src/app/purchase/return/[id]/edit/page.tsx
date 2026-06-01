'use client';import { useState, useEffect } from 'react';import { useRouter, useParams } from 'next/navigation';import api from '@/lib/api';import { Input } from '@/components/ui/input';import { FormLayout,FormSection,FormGrid,FormField } from '@/components/form/form-layout';import { EntitySelect } from '@/components/form/entity-select';import { applySupplierSelection } from '@/lib/field-linkage';const FI='h-9 rounded-md border border-border bg-background px-3 text-[13px] w-full';

export default function PurchaseReturnEdit(){const router=useRouter();const {id}=useParams();const [f,setF]=useState({returnNo:'',purchaseOrderId:'',purchaseOrderNo:'',supplierId:'',supplierCode:'',supplierName:'',materialName:'',totalQuantity:'',totalAmount:'',returnReason:''} as any);
useEffect(()=>{api.get('/purchase-returns/'+id).then(r=>{const d=r.data;setF({...d,returnNo:d.returnNo||'',purchaseOrderId:d.purchaseOrderId||'',purchaseOrderNo:d.purchaseOrderNo||'',supplierId:d.supplierId||'',supplierCode:d.supplierCode||'',supplierName:d.supplierName||'',materialName:d.materialName||'',totalQuantity:Number(d.totalQuantity||0).toString(),totalAmount:Number(d.totalAmount||0).toString(),returnReason:d.returnReason||''});});},[id]);
const save=async()=>{await api.put('/purchase-returns/'+id,f);router.push('/purchase/return');};
return(<FormLayout title="修改退供单" onSave={save} sections={[{id:'b',title:'退供信息'}]} activeSection="b"><FormSection id="b" title="退供信息"><FormGrid>
<FormField label="退供单号"><Input className={FI} value={f.returnNo} disabled/></FormField>
<FormField label="供应商"><EntitySelect entity="supplier" value={f.supplierId||''} onChange={(id,s)=>{setF({...f,...applySupplierSelection(s)});}}/></FormField>
<FormField label="关联采购"><Input className={FI} value={f.purchaseOrderNo||''} disabled/></FormField>
<FormField label="物料名称"><Input className={FI} value={f.materialName||''} onChange={e=>setF({...f,materialName:e.target.value})}/></FormField>
<FormField label="数量"><Input type="number" className={FI} value={f.totalQuantity||''} onChange={e=>setF({...f,totalQuantity:e.target.value})}/></FormField>
<FormField label="金额"><Input type="number" className={FI} value={f.totalAmount||''} onChange={e=>setF({...f,totalAmount:e.target.value})}/></FormField>
<FormField label="退货原因"><Input className={FI} value={f.returnReason||''} onChange={e=>setF({...f,returnReason:e.target.value})}/></FormField>
</FormGrid></FormSection></FormLayout>);}
