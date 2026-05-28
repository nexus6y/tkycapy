'use client';import { useEffect, useState } from 'react';import { useRouter, useParams } from 'next/navigation';import api from '@/lib/api';import { Input } from '@/components/ui/input';import { toast } from '@/components/ui/toast';
import { FormLayout,FormSection,FormGrid,FormField } from '@/components/form/form-layout';
const FI='h-9 rounded-md border border-border bg-background px-3 text-[13px] w-full';
export default function BEdit(){const router=useRouter();const {id}=useParams<{id:string}>();const [loading,setLoading]=useState(true);const [f,setF]=useState<any>({});
useEffect(()=>{api.get('/boms/'+id).then(r=>{setF(r.data);setLoading(false);});},[id]);
const save=async()=>{try{await api.put('/boms/'+id,f);router.push('/production/bom');}catch(e:any){toast(e.response?.data?.message||'保存失败','error');}};
if(loading)return<div className="h-full flex items-center justify-center text-muted-foreground">加载中...</div>;
return(<FormLayout title={'编辑BOM：'+f.code} onSave={save} sections={[{id:'b',title:'BOM信息'}]} activeSection="b"><FormSection id="b" title="BOM信息"><FormGrid>
<FormField label="BOM编码"><Input className={FI} value={f.code} disabled/></FormField>
<FormField label="BOM名称" required><Input className={FI} value={f.name} onChange={e=>setF({...f,name:e.target.value})}/></FormField>
<FormField label="物料名称"><Input className={FI} value={f.materialName||''} onChange={e=>setF({...f,materialName:e.target.value})}/></FormField>
<FormField label="版本"><Input className={FI} value={f.version||''} onChange={e=>setF({...f,version:e.target.value})}/></FormField>
<FormField label="数量"><Input type="number" className={FI} value={f.quantity||''} onChange={e=>setF({...f,quantity:e.target.value})}/></FormField>
</FormGrid></FormSection></FormLayout>);}
