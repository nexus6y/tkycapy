'use client';import { useEffect, useState } from 'react';import { useRouter, useParams } from 'next/navigation';import api from '@/lib/api';import { Input } from '@/components/ui/input';import { FormLayout,FormSection,FormGrid,FormField } from '@/components/form/form-layout';
const FI='h-9 rounded-md border border-border bg-background px-3 text-[13px] w-full';
export default function SOEdit(){const router=useRouter();const {id}=useParams<{id:string}>();const [loading,setLoading]=useState(true);const [f,setF]=useState<any>({});
useEffect(()=>{api.get('/sales-orders/'+id).then(r=>{setF(r.data);setLoading(false);});},[id]);
const save=async()=>{try{await api.put('/sales-orders/'+id,f);router.push('/sales/order');}catch(e:any){alert(e.response?.data?.message||'保存失败');}};
if(loading)return<div className="h-full flex items-center justify-center text-muted-foreground">加载中...</div>;
return(<FormLayout title={'编辑销售订单：'+f.orderNo} onSave={save} sections={[{id:'b',title:'订单信息'}]} activeSection="b"><FormSection id="b" title="订单信息"><FormGrid>
<FormField label="订单号"><Input className={FI} value={f.orderNo} disabled/></FormField>
<FormField label="订单名称" required><Input className={FI} value={f.orderName} onChange={e=>setF({...f,orderName:e.target.value})}/></FormField>
<FormField label="客户"><Input className={FI} value={f.customerName||''} onChange={e=>setF({...f,customerName:e.target.value})}/></FormField>
<FormField label="项目"><Input className={FI} value={f.projectName||''} onChange={e=>setF({...f,projectName:e.target.value})}/></FormField>
<FormField label="订单类型"><Input className={FI} value={f.orderType||''} onChange={e=>setF({...f,orderType:e.target.value})}/></FormField>
<FormField label="金额"><Input type="number" className={FI} value={f.totalAmount||''} onChange={e=>setF({...f,totalAmount:e.target.value})}/></FormField>
</FormGrid></FormSection></FormLayout>);}
