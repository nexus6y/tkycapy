'use client';
import { useState } from 'react';import { useRouter } from 'next/navigation';import api from '@/lib/api';
import { Input } from '@/components/ui/input';import { toast } from '@/components/ui/toast';
import { FormLayout,FormSection,FormGrid,FormField } from '@/components/form/form-layout';
import { Select,SelectContent,SelectItem,SelectTrigger,SelectValue } from '@/components/ui/select';
const FI='h-9 rounded-md border border-border bg-background px-3 text-[13px] w-full';

export default function ProcessCreate(){const router=useRouter();
const [f,setF]=useState({code:'',name:'',processType:'',workCenter:'',standardTime:'',status:'ACTIVE'});
const save=async()=>{
  if(!f.code||!f.name)return toast('编码和名称必填','error');
  try{await api.post('/processes',f);router.push('/production/process');}
  catch(e:any){toast(e.response?.data?.message||'保存失败','error');}
};
return(<FormLayout title="新增标准工序" onSave={save} sections={[{id:'b',title:'工序信息'}]} activeSection="b">
<FormSection id="b" title="工序信息"><FormGrid>
<FormField label="工序编码" required><Input className={FI} value={f.code} onChange={e=>setF({...f,code:e.target.value})} placeholder="工序编码"/></FormField>
<FormField label="工序名称" required><Input className={FI} value={f.name} onChange={e=>setF({...f,name:e.target.value})} placeholder="工序名称"/></FormField>
<FormField label="工序类型"><Input className={FI} value={f.processType} onChange={e=>setF({...f,processType:e.target.value})} placeholder="如 加工/检验"/></FormField>
<FormField label="工作中心"><Input className={FI} value={f.workCenter} onChange={e=>setF({...f,workCenter:e.target.value})} placeholder="工作中心"/></FormField>
<FormField label="标准工时"><Input className={FI} value={f.standardTime} onChange={e=>setF({...f,standardTime:e.target.value})} placeholder="如 30min"/></FormField>
<FormField label="状态"><Select value={f.status} onValueChange={(v:any)=>setF({...f,status:v})}><SelectTrigger className={FI}><SelectValue/></SelectTrigger><SelectContent><SelectItem value="ACTIVE">启用</SelectItem><SelectItem value="INACTIVE">停用</SelectItem></SelectContent></Select></FormField>
</FormGrid></FormSection>
</FormLayout>);}
