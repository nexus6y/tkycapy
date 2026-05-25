'use client';import { useState } from 'react';import { useRouter } from 'next/navigation';import api from '@/lib/api';import { Input } from '@/components/ui/input';import { FormLayout,FormSection,FormGrid,FormField } from '@/components/form/form-layout';
const FI='h-9 rounded-md border border-border bg-background px-3 text-[13px] w-full';
export default function SCreate(){const router=useRouter();const [f,setF]=useState({shipmentNo:'',orderNo:'',customerName:'',totalQuantity:'',totalAmount:''});
const save=async()=>{try{await api.post('/sales-shipments',f);router.push('/sales/shipment');}catch(e:any){alert(e.response?.data?.message||'保存失败');}};
return(<FormLayout title="新增销售出货" onSave={save} sections={[{id:'b',title:'出货信息'}]} activeSection="b"><FormSection id="b" title="出货信息"><FormGrid>
<FormField label="出货单号" required><Input className={FI} value={f.shipmentNo} onChange={e=>setF({...f,shipmentNo:e.target.value})}/></FormField>
<FormField label="关联订单"><Input className={FI} value={f.orderNo} onChange={e=>setF({...f,orderNo:e.target.value})}/></FormField>
<FormField label="客户"><Input className={FI} value={f.customerName} onChange={e=>setF({...f,customerName:e.target.value})}/></FormField>
<FormField label="数量"><Input type="number" className={FI} value={f.totalQuantity} onChange={e=>setF({...f,totalQuantity:e.target.value})}/></FormField>
<FormField label="金额"><Input type="number" className={FI} value={f.totalAmount} onChange={e=>setF({...f,totalAmount:e.target.value})}/></FormField>
</FormGrid></FormSection></FormLayout>);}
