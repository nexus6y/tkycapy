'use client';import { useEffect, useState } from 'react';import { useRouter, useParams } from 'next/navigation';import api from '@/lib/api';import { Input } from '@/components/ui/input';import { toast } from '@/components/ui/toast';
import { FormLayout,FormSection,FormGrid,FormField } from '@/components/form/form-layout';
const FI='h-9 rounded-md border border-border bg-background px-3 text-[13px] w-full';
export default function QEdit(){const router=useRouter();const {id}=useParams<{id:string}>();const [loading,setLoading]=useState(true);const [f,setF]=useState<any>({});
useEffect(()=>{api.get('/quotations/'+id).then(r=>{setF(r.data);setLoading(false);});},[id]);
const save=async()=>{try{await api.put('/quotations/'+id,f);router.push('/sales/quotation');}catch(e:any){toast(e.response?.data?.message||'保存失败','error');}};
if(loading)return<div className="h-full flex items-center justify-center text-muted-foreground">加载中...</div>;
return(<FormLayout title={'编辑报价单：'+f.quotationNo} onSave={save} sections={[{id:'b',title:'报价单信息'}]} activeSection="b"><FormSection id="b" title="报价单信息"><FormGrid>
<FormField label="报价单号"><Input className={FI} value={f.quotationNo} disabled/></FormField>
<FormField label="报价名称" required><Input className={FI} value={f.quotationName} onChange={e=>setF({...f,quotationName:e.target.value})}/></FormField>
<FormField label="客户名称"><Input className={FI} value={f.customerName||''} onChange={e=>setF({...f,customerName:e.target.value})}/></FormField>
<FormField label="报价部门"><Input className={FI} value={f.departmentName||''} onChange={e=>setF({...f,departmentName:e.target.value})}/></FormField>
<FormField label="负责人"><Input className={FI} value={f.responsibleName||''} onChange={e=>setF({...f,responsibleName:e.target.value})}/></FormField>
<FormField label="截止日期"><Input type="date" className={FI} value={f.validUntil?.split('T')[0]||''} onChange={e=>setF({...f,validUntil:e.target.value})}/></FormField>
<FormField label="金额"><Input type="number" className={FI} value={f.totalAmount||''} onChange={e=>setF({...f,totalAmount:e.target.value})}/></FormField>
</FormGrid></FormSection></FormLayout>);}
