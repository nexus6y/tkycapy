'use client';import { useEffect, useState } from 'react';import { useRouter, useParams } from 'next/navigation';import api from '@/lib/api';import { Input } from '@/components/ui/input';import { toast } from '@/components/ui/toast';
import { FormLayout,FormSection,FormGrid,FormField } from '@/components/form/form-layout';
import { Select,SelectContent,SelectItem,SelectTrigger,SelectValue } from '@/components/ui/select';
const FI='h-9 rounded-md border border-border bg-background px-3 text-[13px] w-full';

export default function ProcessEdit(){const router=useRouter();const {id}=useParams<{id:string}>();const [loading,setLoading]=useState(true);const [f,setF]=useState<any>({});
useEffect(()=>{api.get('/processes/'+id).then(r=>{setF(r.data);setLoading(false);});},[id]);
const save=async()=>{try{await api.put('/processes/'+id,f);router.push('/production/process');}catch(e:any){toast(e.response?.data?.message||'保存失败','error');}};
if(loading)return<div className="h-full flex items-center justify-center text-muted-foreground">加载中...</div>;
return(<FormLayout title={'修改标准工序：'+f.code} onSave={save} sections={[{id:'b',title:'工序信息'}]} activeSection="b">
<FormSection id="b" title="工序信息"><FormGrid>
<FormField label="工序编码"><Input className={FI} value={f.code} disabled/></FormField>
<FormField label="工序名称" required><Input className={FI} value={f.name||''} onChange={e=>setF({...f,name:e.target.value})}/></FormField>
<FormField label="工序类型"><Input className={FI} value={f.processType||''} onChange={e=>setF({...f,processType:e.target.value})}/></FormField>
<FormField label="工作中心"><Input className={FI} value={f.workCenter||''} onChange={e=>setF({...f,workCenter:e.target.value})}/></FormField>
<FormField label="标准工时"><Input className={FI} value={f.standardTime||''} onChange={e=>setF({...f,standardTime:e.target.value})}/></FormField>
<FormField label="状态"><Select value={f.status||'ACTIVE'} onValueChange={(v:any)=>setF({...f,status:v})}><SelectTrigger className={FI}><SelectValue/></SelectTrigger><SelectContent><SelectItem value="ACTIVE">启用</SelectItem><SelectItem value="INACTIVE">停用</SelectItem></SelectContent></Select></FormField>
</FormGrid></FormSection>
</FormLayout>);}
