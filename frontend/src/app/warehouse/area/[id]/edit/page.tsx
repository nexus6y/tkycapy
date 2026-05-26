'use client';import { useState, useEffect } from 'react';import { useRouter, useParams } from 'next/navigation';import api from '@/lib/api';import { Input } from '@/components/ui/input';import { RadioGroup,RadioGroupItem } from '@/components/ui/radio-group';import { FormLayout,FormSection,FormGrid,FormField } from '@/components/form/form-layout';const FI='h-9 rounded-md border border-border bg-background px-3 text-[13px] w-full';
export default function AreaEdit(){const router=useRouter();const {id}=useParams();const [f,setF]=useState({code:'',name:'',address:'',sortOrder:0,status:'ACTIVE'});
useEffect(()=>{api.get('/warehouses/'+id).then(r=>setF(r.data));},[id]);
const save=async()=>{try{await api.put('/warehouses/'+id,f);router.push('/warehouse/area');}catch(e:any){alert(e.response?.data?.message||'保存失败');}};
return(<FormLayout title="修改地区" onSave={save} sections={[{id:'b',title:'基本信息'}]} activeSection="b"><FormSection id="b" title="基本信息"><FormGrid>
<FormField label="地区编码" required><Input className={FI} value={f.code} onChange={e=>setF({...f,code:e.target.value})}/></FormField>
<FormField label="地区名称" required><Input className={FI} value={f.name} onChange={e=>setF({...f,name:e.target.value})}/></FormField>
<FormField label="地址"><Input className={FI} value={f.address} onChange={e=>setF({...f,address:e.target.value})}/></FormField>
<FormField label="排序"><Input type="number" className={FI} value={f.sortOrder} onChange={e=>setF({...f,sortOrder:+e.target.value})}/></FormField>
<FormField label="状态"><RadioGroup value={f.status} onValueChange={v=>setF({...f,status:v})} className="flex gap-4 pt-1.5"><div className="flex items-center gap-1.5"><RadioGroupItem value="ACTIVE" id="a"/><label htmlFor="a" className="text-[13px]">启用</label></div><div className="flex items-center gap-1.5"><RadioGroupItem value="INACTIVE" id="i"/><label htmlFor="i" className="text-[13px]">停用</label></div></RadioGroup></FormField>
</FormGrid></FormSection></FormLayout>);}
