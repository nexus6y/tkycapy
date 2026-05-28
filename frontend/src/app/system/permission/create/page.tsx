'use client';import { useState, useEffect } from 'react';import { useRouter } from 'next/navigation';import api from '@/lib/api';import { Input } from '@/components/ui/input';import { Select,SelectContent,SelectItem,SelectTrigger,SelectValue } from '@/components/ui/select';import { FormLayout,FormSection,FormGrid,FormField } from '@/components/form/form-layout';const FI='h-9 rounded-md border border-border bg-background px-3 text-[13px] w-full';
export default function PermissionCreate(){const router=useRouter();const [roles,setRoles]=useState<any[]>([]);const [f,setF]=useState({permission:'',type:'API',roleId:''});
useEffect(()=>{api.get('/roles',{params:{pageSize:999}}).then(r=>setRoles(r.data.items));},[]);
const save=async()=>{await api.post('/permissions-mgmt',f);router.push('/system/permission');};
return(<FormLayout title="新增权限" onSave={save} sections={[{id:'b',title:'基本信息'}]} activeSection="b"><FormSection id="b" title="基本信息"><FormGrid>
<FormField label="权限标识" required><Input className={FI} value={f.permission} onChange={e=>setF({...f,permission:e.target.value})}/></FormField>
<FormField label="类型" required><Select value={f.type} onValueChange={(v:any)=>setF({...f,type:v})}><SelectTrigger className={FI}><SelectValue/></SelectTrigger><SelectContent><SelectItem value="API">API</SelectItem><SelectItem value="MENU">MENU</SelectItem></SelectContent></Select></FormField>
<FormField label="所属角色"><Select value={f.roleId} onValueChange={(v:any)=>setF({...f,roleId:v})}><SelectTrigger className={FI}><SelectValue placeholder="请选择"/></SelectTrigger><SelectContent>{roles.map(r=><SelectItem key={r.id} value={r.id}>{r.name}</SelectItem>)}</SelectContent></Select></FormField>
</FormGrid></FormSection></FormLayout>);}
