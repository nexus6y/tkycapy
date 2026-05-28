'use client';
import { useState } from 'react';import { useRouter } from 'next/navigation';import api from '@/lib/api';
import { Input } from '@/components/ui/input';import { toast } from '@/components/ui/toast';
import { FormLayout,FormSection,FormGrid,FormField } from '@/components/form/form-layout';
const FI='h-9 rounded-md border border-border bg-background px-3 text-[13px] w-full';
export default function QuotationCreate(){const router=useRouter();
const [f,setF]=useState({quotationNo:'',quotationName:'',customerName:'',departmentName:'',responsibleName:'',validUntil:'',totalAmount:''});
const save=async()=>{try{await api.post('/quotations',f);router.push('/sales/quotation');}catch(e:any){toast(e.response?.data?.message||'保存失败','error');}};
return(<FormLayout title="新增报价单" onSave={save} sections={[{id:'b',title:'报价单信息'}]} activeSection="b"><FormSection id="b" title="报价单信息"><FormGrid>
<FormField label="报价单号" required><Input className={FI} value={f.quotationNo} onChange={e=>setF({...f,quotationNo:e.target.value})}/></FormField>
<FormField label="报价名称" required><Input className={FI} value={f.quotationName} onChange={e=>setF({...f,quotationName:e.target.value})}/></FormField>
<FormField label="客户名称"><Input className={FI} value={f.customerName} onChange={e=>setF({...f,customerName:e.target.value})}/></FormField>
<FormField label="报价部门"><Input className={FI} value={f.departmentName} onChange={e=>setF({...f,departmentName:e.target.value})}/></FormField>
<FormField label="负责人"><Input className={FI} value={f.responsibleName} onChange={e=>setF({...f,responsibleName:e.target.value})}/></FormField>
<FormField label="截止日期"><Input type="date" className={FI} value={f.validUntil} onChange={e=>setF({...f,validUntil:e.target.value})}/></FormField>
<FormField label="金额"><Input type="number" className={FI} value={f.totalAmount} onChange={e=>setF({...f,totalAmount:e.target.value})}/></FormField>
</FormGrid></FormSection></FormLayout>);}
