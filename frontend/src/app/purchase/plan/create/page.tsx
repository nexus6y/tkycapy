'use client';import { useState } from 'react';import { useRouter } from 'next/navigation';import api from '@/lib/api';import { Input } from '@/components/ui/input';import { FormLayout,FormSection,FormGrid,FormField } from '@/components/form/form-layout';const FI='h-9 rounded-md border border-border bg-background px-3 text-[13px] w-full';
export default function PurchasePlanCreate(){const router=useRouter();const [f,setF]=useState({orderNo:'',orderName:'',customerName:'',totalAmount:''});
const save=async()=>{await api.post('/purchase-plans',f);router.push('/purchase/plan');};
return(<FormLayout title="新增采购计划" onSave={save} sections={[{id:'b',title:'计划信息'}]} activeSection="b"><FormSection id="b" title="计划信息"><FormGrid>
<FormField label="计划编号" required><Input className={FI} value={f.orderNo} onChange={e=>setF({...f,orderNo:e.target.value})}/></FormField>
<FormField label="计划名称" required><Input className={FI} value={f.orderName} onChange={e=>setF({...f,orderName:e.target.value})}/></FormField>
<FormField label="供应商"><Input className={FI} value={f.customerName} onChange={e=>setF({...f,customerName:e.target.value})}/></FormField>
<FormField label="金额"><Input type="number" className={FI} value={f.totalAmount} onChange={e=>setF({...f,totalAmount:e.target.value})}/></FormField>
</FormGrid></FormSection></FormLayout>);}
