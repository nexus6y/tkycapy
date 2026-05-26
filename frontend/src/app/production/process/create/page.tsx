'use client';import { useState } from 'react';import { useRouter } from 'next/navigation';import api from '@/lib/api';import { Input } from '@/components/ui/input';import { FormLayout,FormSection,FormGrid,FormField } from '@/components/form/form-layout';const FI='h-9 rounded-md border border-border bg-background px-3 text-[13px] w-full';
export default function ProcessCreate(){const router=useRouter();const [f,setF]=useState({code:'',name:'',version:'',materialName:'',quantity:''});
const save=async()=>{await api.post('/boms',f);router.push('/production/process');};
return(<FormLayout title="新增标准工序" onSave={save} sections={[{id:'b',title:'工序信息'}]} activeSection="b"><FormSection id="b" title="工序信息"><FormGrid>
<FormField label="工序编码" required><Input className={FI} value={f.code} onChange={e=>setF({...f,code:e.target.value})}/></FormField>
<FormField label="工序名称" required><Input className={FI} value={f.name} onChange={e=>setF({...f,name:e.target.value})}/></FormField>
<FormField label="版本"><Input className={FI} value={f.version} onChange={e=>setF({...f,version:e.target.value})}/></FormField>
<FormField label="物料"><Input className={FI} value={f.materialName} onChange={e=>setF({...f,materialName:e.target.value})}/></FormField>
<FormField label="数量"><Input type="number" className={FI} value={f.quantity} onChange={e=>setF({...f,quantity:e.target.value})}/></FormField>
</FormGrid></FormSection></FormLayout>);}
