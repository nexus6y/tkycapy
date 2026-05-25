'use client';import { useEffect, useState } from 'react';import { useRouter, useParams } from 'next/navigation';import api from '@/lib/api';import { Input } from '@/components/ui/input';import { FormLayout,FormSection,FormGrid,FormField } from '@/components/form/form-layout';
const FI='h-9 rounded-md border border-border bg-background px-3 text-[13px] w-full';
export default function ShEdit(){const router=useRouter();const {id}=useParams<{id:string}>();const [loading,setLoading]=useState(true);const [f,setF]=useState<any>({});
useEffect(()=>{api.get('/sales-shipments/'+id).then(r=>{setF(r.data);setLoading(false);});},[id]);
const save=async()=>{try{await api.put('/sales-shipments/'+id,f);router.push('/sales/shipment');}catch(e:any){alert(e.response?.data?.message||'保存失败');}};
if(loading)return<div className="h-full flex items-center justify-center text-muted-foreground">加载中...</div>;
return(<FormLayout title={'编辑出货单：'+f.shipmentNo} onSave={save} sections={[{id:'b',title:'出货信息'}]} activeSection="b"><FormSection id="b" title="出货信息"><FormGrid>
<FormField label="出货单号"><Input className={FI} value={f.shipmentNo} disabled/></FormField>
<FormField label="关联订单"><Input className={FI} value={f.orderNo||''} onChange={e=>setF({...f,orderNo:e.target.value})}/></FormField>
<FormField label="客户"><Input className={FI} value={f.customerName||''} onChange={e=>setF({...f,customerName:e.target.value})}/></FormField>
<FormField label="数量"><Input type="number" className={FI} value={f.totalQuantity||''} onChange={e=>setF({...f,totalQuantity:e.target.value})}/></FormField>
<FormField label="金额"><Input type="number" className={FI} value={f.totalAmount||''} onChange={e=>setF({...f,totalAmount:e.target.value})}/></FormField>
</FormGrid></FormSection></FormLayout>);}
