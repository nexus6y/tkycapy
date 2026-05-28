'use client';import { useState } from 'react';import { useRouter } from 'next/navigation';import api from '@/lib/api';import { Input } from '@/components/ui/input';import { toast } from '@/components/ui/toast';
import { FormLayout,FormSection,FormGrid,FormField } from '@/components/form/form-layout';
const FI='h-9 rounded-md border border-border bg-background px-3 text-[13px] w-full';
export default function SRCreate(){const router=useRouter();const [f,setF]=useState({returnNo:'',shipmentNo:'',customerName:'',totalQuantity:'',totalAmount:'',returnReason:''});
const save=async()=>{try{await api.post('/sales-returns',f);router.push('/sales/return');}catch(e:any){toast(e.response?.data?.message||'保存失败','error');}};
return(<FormLayout title="新增销售退货" onSave={save} sections={[{id:'b',title:'退货信息'}]} activeSection="b"><FormSection id="b" title="退货信息"><FormGrid>
<FormField label="退货单号" required><Input className={FI} value={f.returnNo} onChange={e=>setF({...f,returnNo:e.target.value})}/></FormField>
<FormField label="关联出货"><Input className={FI} value={f.shipmentNo} onChange={e=>setF({...f,shipmentNo:e.target.value})}/></FormField>
<FormField label="客户"><Input className={FI} value={f.customerName} onChange={e=>setF({...f,customerName:e.target.value})}/></FormField>
<FormField label="数量"><Input type="number" className={FI} value={f.totalQuantity} onChange={e=>setF({...f,totalQuantity:e.target.value})}/></FormField>
<FormField label="金额"><Input type="number" className={FI} value={f.totalAmount} onChange={e=>setF({...f,totalAmount:e.target.value})}/></FormField>
<FormField label="退货原因"><Input className={FI} value={f.returnReason} onChange={e=>setF({...f,returnReason:e.target.value})}/></FormField>
</FormGrid></FormSection></FormLayout>);}
