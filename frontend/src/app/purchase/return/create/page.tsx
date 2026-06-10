'use client';import { useState, useEffect } from 'react';import { useRouter } from 'next/navigation';import api from '@/lib/api';import { Input } from '@/components/ui/input';import { FormLayout,FormSection,FormGrid,FormField } from '@/components/form/form-layout';import { EntitySelect } from '@/components/form/entity-select';import { EntityPickerInput } from '@/components/form/entity-picker-input';import { applySupplierSelection } from '@/lib/field-linkage';import { toast } from '@/components/ui/toast';const FI='h-9 rounded-md border border-border bg-background px-3 text-[13px] w-full';

export default function PurchaseReturnCreate(){const router=useRouter();
const [f,setF]=useState({returnNo:'',purchaseOrderId:'',purchaseOrderNo:'',supplierId:'',supplierCode:'',supplierName:'',materialName:'',totalQuantity:'',totalAmount:'',returnReason:''});
useEffect(()=>{api.get('/common/next-code',{params:{entity:'purchaseReturn'}}).then(r=>setF((prev:any)=>({...prev,returnNo:r.data.code})));},[]);
const onPOSelect=(id:string,doc:any)=>{
  // Immediately set header fields from the PO list entry
  setF(prev=>({...prev,purchaseOrderId:id,purchaseOrderNo:doc.orderNo||'',
    supplierId:doc.supplierId||'',supplierName:doc.supplierName||'',
    materialName:doc.materialName||'',totalAmount:doc.totalAmount||''}));
  // Then fetch detail for line-level fields (materialName, quantity)
  api.get(`/purchase-orders/${id}`).then(({data:poDetail})=>{
    const lines = poDetail.lines || [];
    const firstLine = lines[0] || {};
    const totalQty = lines.reduce((s:number,l:any)=>s+Number(l.quantity||0),0);
    setF(prev=>({...prev,
      materialName:firstLine.materialName||prev.materialName,
      totalQuantity:String(totalQty),
      totalAmount:poDetail.totalAmount||prev.totalAmount}));
  }).catch(()=>{});
};
const save=async()=>{
  try{
    const payload:any={
      returnNo:f.returnNo||undefined,
      purchaseOrderId:f.purchaseOrderId||undefined,
      purchaseOrderNo:f.purchaseOrderNo||undefined,
      supplierId:f.supplierId||undefined,
      supplierName:f.supplierName||undefined,
      materialName:f.materialName||undefined,
      totalQuantity:f.totalQuantity||undefined,
      totalAmount:f.totalAmount||undefined,
      returnReason:f.returnReason||undefined,
    };
    await api.post('/purchase-returns',payload);
    router.push('/purchase/return');
  }
  catch(e:any){toast(e.response?.data?.message||'保存失败','error');}
};
return(<FormLayout title="新增退供单" onSave={save} sections={[{id:'b',title:'退供信息'}]} activeSection="b"><FormSection id="b" title="退供信息"><FormGrid>
<FormField label="退供单号"><Input className={FI} value={f.returnNo} onChange={e=>setF({...f,returnNo:e.target.value})} placeholder="留空自动生成"/></FormField>
<FormField label="供应商"><EntityPickerInput entity="supplier" value={f.supplierCode} displayText={f.supplierName ? `${f.supplierCode||''} ${f.supplierName}` : ''} onChange={(id,s)=>{setF({...f,...applySupplierSelection(s)});}} placeholder="选择供应商"/></FormField>
<FormField label="关联采购"><EntityPickerInput entity="purchaseOrder" value={f.purchaseOrderNo} displayText={f.purchaseOrderNo || ''} status="APPROVED" onChange={(id,doc)=>{onPOSelect(id,doc);}} placeholder="选择采购单"/></FormField>
<FormField label="采购单号">{f.purchaseOrderNo&&<Input className={FI} value={f.purchaseOrderNo} readOnly disabled/>}</FormField>
<FormField label="物料名称"><Input className={FI} value={f.materialName} onChange={e=>setF({...f,materialName:e.target.value})}/></FormField>
<FormField label="数量"><Input type="number" className={FI} value={f.totalQuantity} onChange={e=>setF({...f,totalQuantity:e.target.value})}/></FormField>
<FormField label="金额"><Input type="number" className={FI} value={f.totalAmount} onChange={e=>setF({...f,totalAmount:e.target.value})}/></FormField>
<FormField label="退货原因"><Input className={FI} value={f.returnReason} onChange={e=>setF({...f,returnReason:e.target.value})}/></FormField>
</FormGrid></FormSection></FormLayout>);}
