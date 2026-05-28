'use client';import { useEffect, useState } from 'react';import { useRouter, useParams } from 'next/navigation';import api from '@/lib/api';import { Input } from '@/components/ui/input';import { toast } from '@/components/ui/toast';
import { FormLayout,FormSection,FormGrid,FormField } from '@/components/form/form-layout';
const FI='h-9 rounded-md border border-border bg-background px-3 text-[13px] w-full';
export default function DPEdit(){const router=useRouter();const {id}=useParams<{id:string}>();const [l,setL]=useState(true);const [f,setF]=useState<any>({});
useEffect(()=>{api.get('/demand-plans/'+id).then(r=>{setF(r.data);setL(false);});},[id]);
const save=async()=>{try{await api.put('/demand-plans/'+id,f);router.push('/ops/demand-plan');}catch(e:any){toast(e.response?.data?.message||'保存失败','error');}};
if(l)return<div className="h-full flex items-center justify-center text-muted-foreground">加载中...</div>;
return(<FormLayout title={'编辑需求计划：'+f.planNo} onSave={save} sections={[{id:'b',title:'基本信息'}]} activeSection="b"><FormSection id="b" title="基本信息"><FormGrid>
<FormField label="计划单号"><Input className={FI} value={f.planNo} disabled/></FormField>
<FormField label="计划名称" required><Input className={FI} value={f.planName} onChange={e=>setF({...f,planName:e.target.value})}/></FormField>
<FormField label="需求来源"><Input className={FI} value={f.demandSource||''} onChange={e=>setF({...f,demandSource:e.target.value})}/></FormField>
<FormField label="需求用途"><Input className={FI} value={f.demandUse||''} onChange={e=>setF({...f,demandUse:e.target.value})}/></FormField>
<FormField label="项目"><Input className={FI} value={f.projectName||''} onChange={e=>setF({...f,projectName:e.target.value})}/></FormField>
<FormField label="需求日期"><Input type="date" className={FI} value={f.requiredDate?.split('T')[0]||''} onChange={e=>setF({...f,requiredDate:e.target.value})}/></FormField>
<FormField label="数量"><Input type="number" className={FI} value={f.totalQuantity||''} onChange={e=>setF({...f,totalQuantity:e.target.value})}/></FormField>
</FormGrid></FormSection></FormLayout>);}
