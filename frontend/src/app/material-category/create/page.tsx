'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import api from '@/lib/api';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { toast } from '@/components/ui/toast';
import { FormLayout, FormSection, FormGrid, FormField } from '@/components/form/form-layout';
const FI='h-9 rounded-md border border-border bg-background px-3 text-[13px] w-full';
interface C { id:string;code:string;name:string; }
export default function MaterialCategoryCreate() {
  const router=useRouter();const [cats,setCats]=useState<C[]>([]);
  const [f,setF]=useState({code:'',name:'',parentId:'',sortOrder:0,status:'ACTIVE'});
  useEffect(()=>{api.get('/material-categories',{params:{pageSize:200}}).then(r=>setCats(r.data.items));},[]);
  const save=async()=>{try{await api.post('/material-categories',f);router.push('/material-category');}catch(e:any){toast(e.response?.data?.message||'保存失败','error');}};
  return (<FormLayout title="新增物料分类" onSave={save} sections={[{id:'b',title:'基本信息'}]} activeSection="b">
    <FormSection id="b" title="基本信息"><FormGrid>
      <FormField label="分类编码" required><Input className={FI} value={f.code} onChange={e=>setF({...f,code:e.target.value})}/></FormField>
      <FormField label="分类名称" required><Input className={FI} value={f.name} onChange={e=>setF({...f,name:e.target.value})}/></FormField>
      <FormField label="上级分类"><Select value={f.parentId} onValueChange={(v:any)=>setF({...f,parentId:v==='NONE'?'':v})}><SelectTrigger className={FI}><SelectValue placeholder="无"/></SelectTrigger><SelectContent><SelectItem value="NONE">无</SelectItem>{cats.map(c=><SelectItem key={c.id} value={c.id}>{c.code} {c.name}</SelectItem>)}</SelectContent></Select></FormField>
      <FormField label="排序"><Input type="number" className={FI} value={f.sortOrder} onChange={e=>setF({...f,sortOrder:+e.target.value})}/></FormField>
      <FormField label="状态"><RadioGroup value={f.status} onValueChange={(v:any)=>setF({...f,status:v})} className="flex gap-4 pt-1.5"><div className="flex items-center gap-1.5"><RadioGroupItem value="ACTIVE" id="mc-a"/><label htmlFor="mc-a" className="text-[13px]">启用</label></div><div className="flex items-center gap-1.5"><RadioGroupItem value="INACTIVE" id="mc-i"/><label htmlFor="mc-i" className="text-[13px]">停用</label></div></RadioGroup></FormField>
    </FormGrid></FormSection>
  </FormLayout>);
}
