'use client';import { useEffect, useState } from 'react';import { useRouter, useParams } from 'next/navigation';import api from '@/lib/api';import { Input } from '@/components/ui/input';import { RadioGroup,RadioGroupItem } from '@/components/ui/radio-group';import { FormLayout,FormSection,FormGrid,FormField } from '@/components/form/form-layout';
const FI='h-9 rounded-md border border-border bg-background px-3 text-[13px] w-full';
export default function CEdit(){const router=useRouter();const {id}=useParams<{id:string}>();const [loading,setLoading]=useState(true);const [f,setF]=useState<any>({});
useEffect(()=>{api.get('/customers/'+id).then(r=>{setF(r.data);setLoading(false);});},[id]);
const save=async()=>{try{await api.put('/customers/'+id,f);router.push('/sales/customer');}catch(e:any){alert(e.response?.data?.message||'保存失败');}};
if(loading)return<div className="h-full flex items-center justify-center text-muted-foreground">加载中...</div>;
return(<FormLayout title={'编辑客户：'+f.code} onSave={save} sections={[{id:'b',title:'基本信息'},{id:'c',title:'联系方式'}]} activeSection="b">
<FormSection id="b" title="基本信息"><FormGrid>
<FormField label="客户编码"><Input className={FI} value={f.code} disabled/></FormField>
<FormField label="客户名称" required><Input className={FI} value={f.name} onChange={e=>setF({...f,name:e.target.value})}/></FormField>
<FormField label="所属行业"><Input className={FI} value={f.industry||''} onChange={e=>setF({...f,industry:e.target.value})}/></FormField>
<FormField label="客户价值"><Input className={FI} value={f.valueLevel||''} onChange={e=>setF({...f,valueLevel:e.target.value})}/></FormField>
<FormField label="信用等级"><Input className={FI} value={f.creditLevel||''} onChange={e=>setF({...f,creditLevel:e.target.value})}/></FormField>
<FormField label="状态"><RadioGroup value={f.status} onValueChange={v=>setF({...f,status:v})} className="flex gap-4 pt-1.5"><div className="flex items-center gap-1.5"><RadioGroupItem value="ACTIVE" id="ce-a"/><label htmlFor="ce-a" className="text-[13px]">启用</label></div><div className="flex items-center gap-1.5"><RadioGroupItem value="INACTIVE" id="ce-i"/><label htmlFor="ce-i" className="text-[13px]">停用</label></div></RadioGroup></FormField>
</FormGrid></FormSection>
<FormSection id="c" title="联系方式"><FormGrid>
<FormField label="联系人"><Input className={FI} value={f.contactPerson||''} onChange={e=>setF({...f,contactPerson:e.target.value})}/></FormField>
<FormField label="联系电话"><Input className={FI} value={f.contactPhone||''} onChange={e=>setF({...f,contactPhone:e.target.value})}/></FormField>
<FormField label="邮箱"><Input className={FI} value={f.contactEmail||''} onChange={e=>setF({...f,contactEmail:e.target.value})}/></FormField>
<div className="col-span-2"><FormField label="地址"><Input className={FI} value={f.address||''} onChange={e=>setF({...f,address:e.target.value})}/></FormField></div>
</FormGrid></FormSection></FormLayout>);}
