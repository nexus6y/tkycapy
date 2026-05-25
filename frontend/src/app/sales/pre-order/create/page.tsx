'use client';import { useState } from 'react';import { useRouter } from 'next/navigation';import api from '@/lib/api';import { Input } from '@/components/ui/input';import { FormLayout,FormSection,FormGrid,FormField } from '@/components/form/form-layout';
const FI='h-9 rounded-md border border-border bg-background px-3 text-[13px] w-full';
export default function PreOrderCreate(){const router=useRouter();const [f,setF]=useState({orderNo:'',orderName:'',customerName:'',contractName:'',totalAmount:''});
const save=async()=>{try{await api.post('/pre-orders',f);router.push('/sales/pre-order');}catch(e:any){alert(e.response?.data?.message||'保存失败');}};
return(<FormLayout title="新增分劈单" onSave={save} sections={[{id:'b',title:'分劈单信息'}]} activeSection="b"><FormSection id="b" title="分劈单信息"><FormGrid>
<FormField label="分劈单号" required><Input className={FI} value={f.orderNo} onChange={e=>setF({...f,orderNo:e.target.value})}/></FormField>
<FormField label="分劈名称" required><Input className={FI} value={f.orderName} onChange={e=>setF({...f,orderName:e.target.value})}/></FormField>
<FormField label="客户"><Input className={FI} value={f.customerName} onChange={e=>setF({...f,customerName:e.target.value})}/></FormField>
<FormField label="合同"><Input className={FI} value={f.contractName} onChange={e=>setF({...f,contractName:e.target.value})}/></FormField>
<FormField label="金额"><Input type="number" className={FI} value={f.totalAmount} onChange={e=>setF({...f,totalAmount:e.target.value})}/></FormField>
</FormGrid></FormSection></FormLayout>);}
