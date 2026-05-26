'use client';import { useState, useEffect } from 'react';import { useRouter, useParams } from 'next/navigation';import api from '@/lib/api';import { Input } from '@/components/ui/input';import { FormLayout,FormSection,FormGrid,FormField } from '@/components/form/form-layout';const FI='h-9 rounded-md border border-border bg-background px-3 text-[13px] w-full';
export default function PurchaseOrderEdit(){const router=useRouter();const {id}=useParams();const [f,setF]=useState({orderNo:'',orderName:'',customerName:'',totalAmount:''} as any);
useEffect(()=>{api.get('/sales-orders/'+id).then(r=>setF(r.data));},[id]);
const save=async()=>{await api.put('/sales-orders/'+id,f);router.push('/purchase/order');};
return(<FormLayout title="修改采购订单" onSave={save} sections={[{id:'b',title:'订单信息'}]} activeSection="b"><FormSection id="b" title="订单信息"><FormGrid>
<FormField label="订单编号" required><Input className={FI} value={f.orderNo} onChange={e=>setF({...f,orderNo:e.target.value})}/></FormField>
<FormField label="订单名称" required><Input className={FI} value={f.orderName} onChange={e=>setF({...f,orderName:e.target.value})}/></FormField>
<FormField label="供应商"><Input className={FI} value={f.customerName||''} onChange={e=>setF({...f,customerName:e.target.value})}/></FormField>
<FormField label="金额"><Input type="number" className={FI} value={f.totalAmount||''} onChange={e=>setF({...f,totalAmount:e.target.value})}/></FormField>
</FormGrid></FormSection></FormLayout>);}
