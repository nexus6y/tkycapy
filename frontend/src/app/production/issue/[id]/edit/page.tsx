'use client';import { useState, useEffect } from 'react';import { useRouter, useParams } from 'next/navigation';import api from '@/lib/api';import { Input } from '@/components/ui/input';import { FormLayout,FormSection,FormGrid,FormField } from '@/components/form/form-layout';const FI='h-9 rounded-md border border-border bg-background px-3 text-[13px] w-full';
export default function IssueEdit(){const router=useRouter();const {id}=useParams();const [f,setF]=useState({orderNo:'',orderName:'',materialName:'',quantity:'',departmentName:'',startDate:''} as any);
useEffect(()=>{api.get('/issue-orders/'+id).then(r=>{const d=r.data;setF({...d,startDate:d.startDate?d.startDate.split('T')[0]:''});});},[id]);
const save=async()=>{await api.put('/issue-orders/'+id,f);router.push('/production/issue');};
return(<FormLayout title="修改领料单" onSave={save} sections={[{id:'b',title:'领料信息'}]} activeSection="b"><FormSection id="b" title="领料信息"><FormGrid>
<FormField label="领料单号" required><Input className={FI} value={f.orderNo} onChange={e=>setF({...f,orderNo:e.target.value})}/></FormField>
<FormField label="订单名称" required><Input className={FI} value={f.orderName} onChange={e=>setF({...f,orderName:e.target.value})}/></FormField>
<FormField label="物料"><Input className={FI} value={f.materialName} onChange={e=>setF({...f,materialName:e.target.value})}/></FormField>
<FormField label="数量"><Input type="number" className={FI} value={f.quantity} onChange={e=>setF({...f,quantity:e.target.value})}/></FormField>
<FormField label="领料部门"><Input className={FI} value={f.departmentName} onChange={e=>setF({...f,departmentName:e.target.value})}/></FormField>
<FormField label="开始日期"><Input type="date" className={FI} value={f.startDate||''} onChange={e=>setF({...f,startDate:e.target.value})}/></FormField>
</FormGrid></FormSection></FormLayout>);}
