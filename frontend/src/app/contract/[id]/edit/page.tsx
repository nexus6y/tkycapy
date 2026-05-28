'use client';import { useEffect, useState } from 'react';import { useRouter, useParams } from 'next/navigation';import api from '@/lib/api';import { Input } from '@/components/ui/input';import { Select,SelectContent,SelectItem,SelectTrigger,SelectValue } from '@/components/ui/select';import { toast } from '@/components/ui/toast';
import { FormLayout,FormSection,FormGrid,FormField } from '@/components/form/form-layout';
const FI='h-9 rounded-md border border-border bg-background px-3 text-[13px] w-full';
export default function CEdit(){const router=useRouter();const {id}=useParams<{id:string}>();const [loading,setLoading]=useState(true);const [f,setF]=useState<any>({});
useEffect(()=>{api.get('/contracts/'+id).then(r=>{setF(r.data);setLoading(false);});},[id]);
const save=async()=>{try{await api.put('/contracts/'+id,f);router.push('/contract');}catch(e:any){toast(e.response?.data?.message||'保存失败','error');}};
if(loading)return<div className="h-full flex items-center justify-center text-muted-foreground">加载中...</div>;
return(<FormLayout title={'编辑合同：'+f.code} onSave={save} sections={[{id:'b',title:'基本信息'}]} activeSection="b"><FormSection id="b" title="基本信息"><FormGrid>
<FormField label="合同编码"><Input className={FI} value={f.code} disabled/></FormField>
<FormField label="合同名称" required><Input className={FI} value={f.name} onChange={e=>setF({...f,name:e.target.value})}/></FormField>
<FormField label="合同类型"><Select value={f.type} onValueChange={(v:any)=>setF({...f,type:v})}><SelectTrigger className={FI}><SelectValue/></SelectTrigger><SelectContent><SelectItem value="销售合同">销售合同</SelectItem><SelectItem value="采购合同">采购合同</SelectItem></SelectContent></Select></FormField>
<FormField label="金额"><Input type="number" className={FI} value={f.totalAmount||''} onChange={e=>setF({...f,totalAmount:e.target.value})}/></FormField>
</FormGrid></FormSection></FormLayout>);}
