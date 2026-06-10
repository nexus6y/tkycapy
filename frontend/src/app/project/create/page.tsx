'use client';
import { useEffect, useState } from 'react';import { useRouter } from 'next/navigation';import api from '@/lib/api';
import { Input } from '@/components/ui/input';import { toast } from '@/components/ui/toast';
import { FormLayout,FormSection,FormGrid,FormField } from '@/components/form/form-layout';
const FI='h-9 rounded-md border border-border bg-background px-3 text-[13px] w-full';
export default function ProjectCreate(){const router=useRouter();const [f,setF]=useState({code:'',name:'',source:''});
useEffect(()=>{api.get('/common/next-code',{params:{entity:'project'}}).then(r=>setF((prev:any)=>({...prev,code:r.data.code})));},[]);
const save=async()=>{try{await api.post('/projects',f);router.push('/project');}catch(e:any){toast(e.response?.data?.message||'保存失败','error');}};
return(<FormLayout title="新增项目" onSave={save} sections={[{id:'b',title:'基本信息'}]} activeSection="b"><FormSection id="b" title="基本信息"><FormGrid>
<FormField label="项目编码" required><Input className={FI} value={f.code} readOnly disabled/></FormField>
<FormField label="项目名称" required><Input className={FI} value={f.name} onChange={e=>setF({...f,name:e.target.value})}/></FormField>
<FormField label="项目来源"><Input className={FI} value={f.source} onChange={e=>setF({...f,source:e.target.value})}/></FormField>
</FormGrid></FormSection></FormLayout>);}
