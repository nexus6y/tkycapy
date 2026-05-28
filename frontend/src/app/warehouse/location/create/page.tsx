'use client';import { useState, useEffect } from 'react';import { useRouter } from 'next/navigation';import api from '@/lib/api';import { Input } from '@/components/ui/input';import { Select,SelectContent,SelectItem,SelectTrigger,SelectValue } from '@/components/ui/select';import { RadioGroup,RadioGroupItem } from '@/components/ui/radio-group';import { toast } from '@/components/ui/toast';
import { FormLayout,FormSection,FormGrid,FormField } from '@/components/form/form-layout';const FI='h-9 rounded-md border border-border bg-background px-3 text-[13px] w-full';
export default function LocationCreate(){const router=useRouter();const [shelves,setShelves]=useState<any[]>([]);const [f,setF]=useState({code:'',name:'',type:'',usageStatus:'',shelfId:'',shelfName:'',layer:'',col:'',zoneName:'',warehouseName:'',sortOrder:0,status:'ACTIVE'});
useEffect(()=>{api.get('/common/next-code',{params:{entity:'location'}}).then(r=>setF((prev:any)=>({...prev,code:r.data.code})));api.get('/shelves',{params:{pageSize:999}}).then(r=>setShelves(r.data.items));},[]);
const save=async()=>{try{await api.post('/locations',f);router.push('/warehouse/location');}catch(e:any){toast(e.response?.data?.message||'保存失败','error');}};
return(<FormLayout title="新增货位" onSave={save} sections={[{id:'b',title:'基本信息'}]} activeSection="b"><FormSection id="b" title="基本信息"><FormGrid>
<FormField label="货位编码" required><Input className={FI} value={f.code} readOnly disabled/></FormField>
<FormField label="货位名称" required><Input className={FI} value={f.name} onChange={e=>setF({...f,name:e.target.value})}/></FormField>
<FormField label="货位类型"><Input className={FI} value={f.type} onChange={e=>setF({...f,type:e.target.value})}/></FormField>
<FormField label="使用状态"><Input className={FI} value={f.usageStatus} onChange={e=>setF({...f,usageStatus:e.target.value})}/></FormField>
<FormField label="所属货架"><Select value={f.shelfId} onValueChange={(v:any)=>{const s=shelves.find(x=>x.id===v);setF({...f,shelfId:v,shelfName:s?.name||'',zoneName:s?.zoneName||'',warehouseName:s?.warehouseName||''});}}><SelectTrigger className={FI}><SelectValue placeholder="请选择"/></SelectTrigger><SelectContent>{shelves.map(s=><SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>)}</SelectContent></Select></FormField>
<FormField label="层"><Input className={FI} value={f.layer} onChange={e=>setF({...f,layer:e.target.value})}/></FormField>
<FormField label="列"><Input className={FI} value={f.col} onChange={e=>setF({...f,col:e.target.value})}/></FormField>
<FormField label="排序"><Input type="number" className={FI} value={f.sortOrder} onChange={e=>setF({...f,sortOrder:+e.target.value})}/></FormField>
<FormField label="状态"><RadioGroup value={f.status} onValueChange={(v:any)=>setF({...f,status:v})} className="flex gap-4 pt-1.5"><div className="flex items-center gap-1.5"><RadioGroupItem value="ACTIVE" id="a"/><label htmlFor="a" className="text-[13px]">启用</label></div><div className="flex items-center gap-1.5"><RadioGroupItem value="INACTIVE" id="i"/><label htmlFor="i" className="text-[13px]">停用</label></div></RadioGroup></FormField>
</FormGrid></FormSection></FormLayout>);}
