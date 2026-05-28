'use client';
import { useEffect, useState } from 'react';import { useRouter, useParams } from 'next/navigation';import api from '@/lib/api';
import { Input } from '@/components/ui/input';import { Select,SelectContent,SelectItem,SelectTrigger,SelectValue } from '@/components/ui/select';import { RadioGroup,RadioGroupItem } from '@/components/ui/radio-group';
import { toast } from '@/components/ui/toast';
import { FormLayout,FormSection,FormGrid,FormField } from '@/components/form/form-layout';
const FI='h-9 rounded-md border border-border bg-background px-3 text-[13px] w-full';
export default function MCEdit(){const router=useRouter();const {id}=useParams<{id:string}>();
const [cats,setCats]=useState<any[]>([]);const [loading,setLoading]=useState(true);const [f,setF]=useState<any>({});
useEffect(()=>{api.get('/material-categories',{params:{pageSize:200}}).then(r=>setCats(r.data.items));api.get('/material-categories/'+id).then(r=>{setF(r.data);setLoading(false);});},[id]);
const save=async()=>{try{await api.put('/material-categories/'+id,f);router.push('/material-category');}catch(e:any){toast(e.response?.data?.message||'保存失败','error');}};
if(loading)return<div className="h-full flex items-center justify-center text-muted-foreground">加载中...</div>;
return(<FormLayout title={'编辑物料分类：'+f.code} onSave={save} sections={[{id:'b',title:'基本信息'}]} activeSection="b"><FormSection id="b" title="基本信息"><FormGrid>
<FormField label="分类编码"><Input className={FI} value={f.code} disabled/></FormField>
<FormField label="分类名称" required><Input className={FI} value={f.name} onChange={e=>setF({...f,name:e.target.value})}/></FormField>
<FormField label="上级分类"><Select value={f.parentId||''} onValueChange={(v:any)=>setF({...f,parentId:v==='NONE'?'':v})}><SelectTrigger className={FI}><SelectValue placeholder="无"/></SelectTrigger><SelectContent><SelectItem value="NONE">无</SelectItem>{cats.filter((c:any)=>c.id!==id).map((c:any)=><SelectItem key={c.id} value={c.id}>{c.code} {c.name}</SelectItem>)}</SelectContent></Select></FormField>
<FormField label="排序"><Input type="number" className={FI} value={f.sortOrder} onChange={e=>setF({...f,sortOrder:+e.target.value})}/></FormField>
<FormField label="状态"><RadioGroup value={f.status} onValueChange={(v:any)=>setF({...f,status:v})} className="flex gap-4 pt-1.5"><div className="flex items-center gap-1.5"><RadioGroupItem value="ACTIVE" id="me-a"/><label htmlFor="me-a" className="text-[13px]">启用</label></div><div className="flex items-center gap-1.5"><RadioGroupItem value="INACTIVE" id="me-i"/><label htmlFor="me-i" className="text-[13px]">停用</label></div></RadioGroup></FormField>
</FormGrid></FormSection></FormLayout>);}
