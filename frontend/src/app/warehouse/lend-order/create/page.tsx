'use client';import { useState } from 'react';import { useRouter } from 'next/navigation';import api from '@/lib/api';import { Input } from '@/components/ui/input';import { toast } from '@/components/ui/toast';
import { FormLayout,FormSection,FormGrid,FormField } from '@/components/form/form-layout';
const FI='h-9 rounded-md border border-border bg-background px-3 text-[13px] w-full';
export default function LCreate(){const router=useRouter();const [f,setF]=useState({orderNo:'',type:'LEND',materialName:'',quantity:'',borrower:'',borrowDate:'',expectedReturn:''});
const save=async()=>{try{await api.post('/lend-orders',f);router.push('/warehouse/lend-order');}catch(e:any){toast(e.response?.data?.message||'保存失败','error');}};
return(<FormLayout title="新增借出单" onSave={save} sections={[{id:'b',title:'借出信息'}]} activeSection="b"><FormSection id="b" title="借出信息"><FormGrid>
<FormField label="借出单号" required><Input className={FI} value={f.orderNo} onChange={e=>setF({...f,orderNo:e.target.value})}/></FormField>
<FormField label="物料名称"><Input className={FI} value={f.materialName} onChange={e=>setF({...f,materialName:e.target.value})}/></FormField>
<FormField label="数量"><Input type="number" className={FI} value={f.quantity} onChange={e=>setF({...f,quantity:e.target.value})}/></FormField>
<FormField label="借用人"><Input className={FI} value={f.borrower} onChange={e=>setF({...f,borrower:e.target.value})}/></FormField>
<FormField label="借出日期"><Input type="date" className={FI} value={f.borrowDate} onChange={e=>setF({...f,borrowDate:e.target.value})}/></FormField>
<FormField label="预计归还"><Input type="date" className={FI} value={f.expectedReturn} onChange={e=>setF({...f,expectedReturn:e.target.value})}/></FormField>
</FormGrid></FormSection></FormLayout>);}
