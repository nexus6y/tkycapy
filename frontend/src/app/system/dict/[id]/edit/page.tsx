'use client';import { useState, useEffect } from 'react';import { useRouter, useParams } from 'next/navigation';import api from '@/lib/api';import { Input } from '@/components/ui/input';import { RadioGroup,RadioGroupItem } from '@/components/ui/radio-group';import { FormLayout,FormSection,FormGrid,FormField } from '@/components/form/form-layout';const FI='h-9 rounded-md border border-border bg-background px-3 text-[13px] w-full';
export default function DictEdit(){const router=useRouter();const {id}=useParams();const [f,setF]=useState({code:'',name:'',value:'',type:'',status:'ACTIVE'});
useEffect(()=>{api.get('/dictionaries/'+id).then(r=>setF(r.data));},[id]);
const save=async()=>{await api.put('/dictionaries/'+id,f);router.push('/system/dict');};
return(<FormLayout title="修改字典" onSave={save} sections={[{id:'b',title:'基本信息'}]} activeSection="b"><FormSection id="b" title="基本信息"><FormGrid>
<FormField label="字典编码" required><Input className={FI} value={f.code} onChange={e=>setF({...f,code:e.target.value})}/></FormField>
<FormField label="字典名称" required><Input className={FI} value={f.name} onChange={e=>setF({...f,name:e.target.value})}/></FormField>
<FormField label="字典值"><Input className={FI} value={f.value} onChange={e=>setF({...f,value:e.target.value})}/></FormField>
<FormField label="类型"><Input className={FI} value={f.type} onChange={e=>setF({...f,type:e.target.value})}/></FormField>
<FormField label="状态"><RadioGroup value={f.status} onValueChange={(v:any)=>setF({...f,status:v})} className="flex gap-4 pt-1.5"><div className="flex items-center gap-1.5"><RadioGroupItem value="ACTIVE" id="a"/><label htmlFor="a" className="text-[13px]">启用</label></div><div className="flex items-center gap-1.5"><RadioGroupItem value="INACTIVE" id="i"/><label htmlFor="i" className="text-[13px]">停用</label></div></RadioGroup></FormField>
</FormGrid></FormSection></FormLayout>);}
