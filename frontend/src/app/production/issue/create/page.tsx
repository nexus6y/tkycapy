'use client';import { useState } from 'react';import { useRouter } from 'next/navigation';import api from '@/lib/api';import { Input } from '@/components/ui/input';import { FormLayout,FormSection,FormGrid,FormField } from '@/components/form/form-layout';const FI='h-9 rounded-md border border-border bg-background px-3 text-[13px] w-full';
export default function IssueCreate(){const router=useRouter();const [f,setF]=useState({orderNo:'',orderName:'',materialName:'',quantity:'',departmentName:'',startDate:''});
const save=async()=>{await api.post('/production-orders',{...f,businessStatus:'PENDING_ISSUE'});router.push('/production/issue');};
return(<FormLayout title="新增领料单" onSave={save} sections={[{id:'b',title:'领料信息'}]} activeSection="b"><FormSection id="b" title="领料信息"><FormGrid>
<FormField label="领料单号" required><Input className={FI} value={f.orderNo} onChange={e=>setF({...f,orderNo:e.target.value})}/></FormField>
<FormField label="订单名称" required><Input className={FI} value={f.orderName} onChange={e=>setF({...f,orderName:e.target.value})}/></FormField>
<FormField label="物料"><Input className={FI} value={f.materialName} onChange={e=>setF({...f,materialName:e.target.value})}/></FormField>
<FormField label="数量"><Input type="number" className={FI} value={f.quantity} onChange={e=>setF({...f,quantity:e.target.value})}/></FormField>
<FormField label="领料部门"><Input className={FI} value={f.departmentName} onChange={e=>setF({...f,departmentName:e.target.value})}/></FormField>
<FormField label="开始日期"><Input type="date" className={FI} value={f.startDate} onChange={e=>setF({...f,startDate:e.target.value})}/></FormField>
</FormGrid></FormSection></FormLayout>);}
