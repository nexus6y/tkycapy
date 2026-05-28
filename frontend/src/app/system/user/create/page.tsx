'use client';import { useState } from 'react';import { useRouter } from 'next/navigation';import api from '@/lib/api';import { Input } from '@/components/ui/input';import { RadioGroup,RadioGroupItem } from '@/components/ui/radio-group';import { FormLayout,FormSection,FormGrid,FormField } from '@/components/form/form-layout';const FI='h-9 rounded-md border border-border bg-background px-3 text-[13px] w-full';
export default function UserCreate(){const router=useRouter();const [f,setF]=useState({username:'',password:'',name:'',email:'',phone:'',sortOrder:0,status:'ACTIVE'});
const save=async()=>{await api.post('/users',f);router.push('/system/user');};
return(<FormLayout title="新增用户" onSave={save} sections={[{id:'b',title:'基本信息'}]} activeSection="b"><FormSection id="b" title="基本信息"><FormGrid>
<FormField label="用户名" required><Input className={FI} value={f.username} onChange={e=>setF({...f,username:e.target.value})}/></FormField>
<FormField label="姓名" required><Input className={FI} value={f.name} onChange={e=>setF({...f,name:e.target.value})}/></FormField>
<FormField label="密码" required><Input type="password" className={FI} value={f.password} onChange={e=>setF({...f,password:e.target.value})}/></FormField>
<FormField label="邮箱"><Input className={FI} value={f.email} onChange={e=>setF({...f,email:e.target.value})}/></FormField>
<FormField label="手机号"><Input className={FI} value={f.phone} onChange={e=>setF({...f,phone:e.target.value})}/></FormField>
<FormField label="排序"><Input type="number" className={FI} value={f.sortOrder} onChange={e=>setF({...f,sortOrder:+e.target.value})}/></FormField>
<FormField label="状态"><RadioGroup value={f.status} onValueChange={(v:any)=>setF({...f,status:v})} className="flex gap-4 pt-1.5"><div className="flex items-center gap-1.5"><RadioGroupItem value="ACTIVE" id="a"/><label htmlFor="a" className="text-[13px]">启用</label></div><div className="flex items-center gap-1.5"><RadioGroupItem value="INACTIVE" id="i"/><label htmlFor="i" className="text-[13px]">停用</label></div></RadioGroup></FormField>
</FormGrid></FormSection></FormLayout>);}
