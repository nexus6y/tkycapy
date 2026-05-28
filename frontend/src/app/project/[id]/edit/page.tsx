'use client';import { useEffect, useState } from 'react';import { useRouter, useParams } from 'next/navigation';import api from '@/lib/api';import { Input } from '@/components/ui/input';import { toast } from '@/components/ui/toast';
import { FormLayout,FormSection,FormGrid,FormField } from '@/components/form/form-layout';
const FI='h-9 rounded-md border border-border bg-background px-3 text-[13px] w-full';
export default function PEdit(){const router=useRouter();const {id}=useParams<{id:string}>();const [loading,setLoading]=useState(true);const [f,setF]=useState<any>({});
useEffect(()=>{api.get('/projects/'+id).then(r=>{setF(r.data);setLoading(false);});},[id]);
const save=async()=>{try{await api.put('/projects/'+id,f);router.push('/project');}catch(e:any){toast(e.response?.data?.message||'保存失败','error');}};
if(loading)return<div className="h-full flex items-center justify-center text-muted-foreground">加载中...</div>;
return(<FormLayout title={'编辑项目：'+f.code} onSave={save} sections={[{id:'b',title:'基本信息'}]} activeSection="b"><FormSection id="b" title="基本信息"><FormGrid>
<FormField label="项目编码"><Input className={FI} value={f.code} disabled/></FormField>
<FormField label="项目名称" required><Input className={FI} value={f.name} onChange={e=>setF({...f,name:e.target.value})}/></FormField>
<FormField label="项目来源"><Input className={FI} value={f.source||''} onChange={e=>setF({...f,source:e.target.value})}/></FormField>
</FormGrid></FormSection></FormLayout>);}
