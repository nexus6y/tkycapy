'use client';import { useEffect, useState } from 'react';import { useRouter } from 'next/navigation';import api from '@/lib/api';import { Input } from '@/components/ui/input';import { toast } from '@/components/ui/toast';
import { FormLayout,FormSection,FormGrid,FormField } from '@/components/form/form-layout';
import { EntitySelect } from '@/components/form/entity-select';
import { EntityPickerInput } from '@/components/form/entity-picker-input';
import { applyCustomerSelection } from '@/lib/field-linkage';
const FI='h-9 rounded-md border border-border bg-background px-3 text-[13px] w-full';

export default function SRCreate(){const router=useRouter();
const [f,setF]=useState({returnNo:'',shipmentId:'',shipmentNo:'',customerId:'',customerCode:'',customerName:'',totalQuantity:'',totalAmount:'',returnReason:''});
useEffect(()=>{api.get('/common/next-code',{params:{entity:'salesReturn'}}).then(r=>setF((prev:any)=>({...prev,returnNo:r.data.code})));},[]);
const save=async()=>{try{await api.post('/sales-returns',f);router.push('/sales/return');}catch(e:any){toast(e.response?.data?.message||'保存失败','error');}};
const onShipmentSelect=(id:string,doc:any)=>{
  setF({...f,shipmentId:id,shipmentNo:doc.shipmentNo||doc.orderNo||'',
    customerId:doc.customerId||'',customerCode:doc.customerCode||'',customerName:doc.customerName||'',
    totalQuantity:doc.totalQuantity||'',totalAmount:doc.totalAmount||''});
  console.log('shipment selected:', {cid:doc.customerId, ccode:doc.customerCode, cname:doc.customerName, qty:doc.totalQuantity, amt:doc.totalAmount});
};
return(<FormLayout title="新增销售退货" onSave={save} sections={[{id:'b',title:'退货信息'}]} activeSection="b"><FormSection id="b" title="退货信息"><FormGrid>
<FormField label="退货单号"><Input className={FI} value={f.returnNo} readOnly disabled/></FormField>
<FormField label="关联出货"><EntitySelect entity="salesShipment" value={f.shipmentId} onChange={onShipmentSelect}/></FormField>
<FormField label="客户"><EntityPickerInput entity="customer" value={f.customerCode} displayText={f.customerName ? `${f.customerCode||''} ${f.customerName}` : ''} onChange={(id,c)=>{setF({...f,...applyCustomerSelection(c)});}} placeholder="选择客户"/></FormField>
<FormField label="出货单号">{f.shipmentNo&&<Input className={FI} value={f.shipmentNo} readOnly disabled/>}</FormField>
<FormField label="数量"><Input type="number" className={FI} value={f.totalQuantity} onChange={e=>setF({...f,totalQuantity:e.target.value})}/></FormField>
<FormField label="金额"><Input type="number" className={FI} value={f.totalAmount} onChange={e=>setF({...f,totalAmount:e.target.value})}/></FormField>
<FormField label="退货原因"><Input className={FI} value={f.returnReason} onChange={e=>setF({...f,returnReason:e.target.value})}/></FormField>
</FormGrid></FormSection></FormLayout>);}
