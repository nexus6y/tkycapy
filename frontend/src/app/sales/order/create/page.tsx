'use client';import { useState } from 'react';import { useRouter } from 'next/navigation';import api from '@/lib/api';import { Input } from '@/components/ui/input';import { FormLayout,FormSection,FormGrid,FormField } from '@/components/form/form-layout';
const FI='h-9 rounded-md border border-border bg-background px-3 text-[13px] w-full';
export default function SalesOrderCreate(){const router=useRouter();
const [f,setF]=useState({orderNo:'',orderName:'',customerName:'',projectName:'',orderType:'',totalAmount:'',deliveryDate:''});
const save=async()=>{try{await api.post('/sales-orders',f);router.push('/sales/order');}catch(e:any){alert(e.response?.data?.message||'保存失败');}};
return(<FormLayout title="新增销售订单" onSave={save} sections={[{id:'b',title:'订单信息'}]} activeSection="b"><FormSection id="b" title="订单信息"><FormGrid>
<FormField label="订单号" required><Input className={FI} value={f.orderNo} onChange={e=>setF({...f,orderNo:e.target.value})}/></FormField>
<FormField label="订单名称" required><Input className={FI} value={f.orderName} onChange={e=>setF({...f,orderName:e.target.value})}/></FormField>
<FormField label="客户"><Input className={FI} value={f.customerName} onChange={e=>setF({...f,customerName:e.target.value})}/></FormField>
<FormField label="项目"><Input className={FI} value={f.projectName} onChange={e=>setF({...f,projectName:e.target.value})}/></FormField>
<FormField label="订单类型"><Input className={FI} value={f.orderType} onChange={e=>setF({...f,orderType:e.target.value})}/></FormField>
<FormField label="金额"><Input type="number" className={FI} value={f.totalAmount} onChange={e=>setF({...f,totalAmount:e.target.value})}/></FormField>
<FormField label="交货日期"><Input type="date" className={FI} value={f.deliveryDate} onChange={e=>setF({...f,deliveryDate:e.target.value})}/></FormField>
</FormGrid></FormSection></FormLayout>);}
