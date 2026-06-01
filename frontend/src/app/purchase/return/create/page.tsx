'use client';import { useState } from 'react';import { useRouter } from 'next/navigation';import api from '@/lib/api';import { Input } from '@/components/ui/input';import { FormLayout,FormSection,FormGrid,FormField } from '@/components/form/form-layout';import { EntitySelect } from '@/components/form/entity-select';import { applySupplierSelection } from '@/lib/field-linkage';import { toast } from '@/components/ui/toast';const FI='h-9 rounded-md border border-border bg-background px-3 text-[13px] w-full';

export default function PurchaseReturnCreate(){const router=useRouter();
const [f,setF]=useState({returnNo:'',purchaseOrderId:'',purchaseOrderNo:'',supplierId:'',supplierCode:'',supplierName:'',materialName:'',totalQuantity:'',totalAmount:'',returnReason:''});
const save=async()=>{
  try{await api.post('/purchase-returns',f);router.push('/purchase/return');}
  catch(e:any){toast(e.response?.data?.message||'保存失败','error');}
};
return(<FormLayout title="新增退供单" onSave={save} sections={[{id:'b',title:'退供信息'}]} activeSection="b"><FormSection id="b" title="退供信息"><FormGrid>
<FormField label="退供单号"><Input className={FI} value={f.returnNo} onChange={e=>setF({...f,returnNo:e.target.value})} placeholder="留空自动生成"/></FormField>
<FormField label="供应商"><EntitySelect entity="supplier" value={f.supplierId} onChange={(id,s)=>{setF({...f,...applySupplierSelection(s)});}}/></FormField>
<FormField label="关联采购"><EntitySelect entity="purchaseOrder" value={f.purchaseOrderId} status="APPROVED" onChange={(id,doc)=>{setF({...f,purchaseOrderId:id,purchaseOrderNo:doc.orderNo||'',supplierId:doc.supplierId||f.supplierId,supplierName:doc.supplierName||f.supplierName,materialName:doc.materialName||f.materialName,totalQuantity:doc.quantity||f.totalQuantity,totalAmount:doc.totalAmount||f.totalAmount});}}/></FormField>
<FormField label="物料名称"><Input className={FI} value={f.materialName} onChange={e=>setF({...f,materialName:e.target.value})}/></FormField>
<FormField label="数量"><Input type="number" className={FI} value={f.totalQuantity} onChange={e=>setF({...f,totalQuantity:e.target.value})}/></FormField>
<FormField label="金额"><Input type="number" className={FI} value={f.totalAmount} onChange={e=>setF({...f,totalAmount:e.target.value})}/></FormField>
<FormField label="退货原因"><Input className={FI} value={f.returnReason} onChange={e=>setF({...f,returnReason:e.target.value})}/></FormField>
</FormGrid></FormSection></FormLayout>);}
