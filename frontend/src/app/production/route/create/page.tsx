'use client';
import { useState } from 'react';import { useRouter } from 'next/navigation';import api from '@/lib/api';
import { Input } from '@/components/ui/input';import { toast } from '@/components/ui/toast';
import { FormLayout,FormSection,FormGrid,FormField } from '@/components/form/form-layout';
import { EntityPickerInput } from '@/components/form/entity-picker-input';
import { Select,SelectContent,SelectItem,SelectTrigger,SelectValue } from '@/components/ui/select';
const FI='h-9 rounded-md border border-border bg-background px-3 text-[13px] w-full';

export default function RouteCreate(){const router=useRouter();
const [f,setF]=useState({code:'',name:'',bomId:'',processIds:'',status:'ACTIVE'});
const save=async()=>{
  if(!f.code||!f.name)return toast('编码和名称必填','error');
  try{await api.post('/process-routes',f);router.push('/production/route');}
  catch(e:any){toast(e.response?.data?.message||'保存失败','error');}
};
return(<FormLayout title="新增工艺路线" onSave={save} sections={[{id:'b',title:'路线信息'}]} activeSection="b">
<FormSection id="b" title="路线信息"><FormGrid>
<FormField label="路由编码" required><Input className={FI} value={f.code} onChange={e=>setF({...f,code:e.target.value})} placeholder="路由编码"/></FormField>
<FormField label="路由名称" required><Input className={FI} value={f.name} onChange={e=>setF({...f,name:e.target.value})} placeholder="路由名称"/></FormField>
<FormField label="关联BOM"><EntityPickerInput entity="bom" value="" onChange={(id:any)=>setF({...f,bomId:id})}/></FormField>
<FormField label="工序列表"><Input className={FI} value={f.processIds} onChange={e=>setF({...f,processIds:e.target.value})} placeholder="工序ID列表"/></FormField>
<FormField label="状态"><Select value={f.status} onValueChange={(v:any)=>setF({...f,status:v})}><SelectTrigger className={FI}><SelectValue/></SelectTrigger><SelectContent><SelectItem value="ACTIVE">启用</SelectItem><SelectItem value="INACTIVE">停用</SelectItem></SelectContent></Select></FormField>
</FormGrid></FormSection>
</FormLayout>);}
