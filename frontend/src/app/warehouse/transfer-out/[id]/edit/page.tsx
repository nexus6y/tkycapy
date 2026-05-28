'use client';import { useEffect, useState } from 'react';import { useRouter, useParams } from 'next/navigation';import api from '@/lib/api';import { Input } from '@/components/ui/input';import { RadioGroup,RadioGroupItem } from '@/components/ui/radio-group';import { toast } from '@/components/ui/toast';
import { FormLayout,FormSection,FormGrid,FormField } from '@/components/form/form-layout';
const FI='h-9 rounded-md border border-border bg-background px-3 text-[13px] w-full';
export default function TEdit(){const router=useRouter();const {id}=useParams<{id:string}>();const [l,setL]=useState(true);const [f,setF]=useState<any>({});
useEffect(()=>{api.get('/transfer-orders/'+id).then(r=>{setF(r.data);setL(false);});},[id]);
const save=async()=>{try{await api.put('/transfer-orders/'+id,f);router.push('/warehouse/transfer-out');}catch(e:any){toast(e.response?.data?.message||'保存失败','error');}};
if(l)return<div className="h-full flex items-center justify-center text-muted-foreground">加载中...</div>;
return(<FormLayout title={'编辑调拨单：'+f.orderNo} onSave={save} sections={[{id:'b',title:'调拨信息'}]} activeSection="b"><FormSection id="b" title="调拨信息"><FormGrid>
<FormField label="调拨单号"><Input className={FI} value={f.orderNo} disabled/></FormField>
<FormField label="调拨类型" required><RadioGroup value={f.type} onValueChange={(v:any)=>setF({...f,type:v})} className="flex gap-4 pt-1.5"><div className="flex items-center gap-1.5"><RadioGroupItem value="OUT" id="te-o"/><label htmlFor="te-o" className="text-[13px]">调出</label></div><div className="flex items-center gap-1.5"><RadioGroupItem value="IN" id="te-i"/><label htmlFor="te-i" className="text-[13px]">调入</label></div></RadioGroup></FormField>
<FormField label="物料名称"><Input className={FI} value={f.materialName||''} onChange={e=>setF({...f,materialName:e.target.value})}/></FormField>
<FormField label="数量"><Input type="number" className={FI} value={f.quantity||''} onChange={e=>setF({...f,quantity:e.target.value})}/></FormField>
<FormField label="调出仓库"><Input className={FI} value={f.fromWarehouse||''} onChange={e=>setF({...f,fromWarehouse:e.target.value})}/></FormField>
<FormField label="调入仓库"><Input className={FI} value={f.toWarehouse||''} onChange={e=>setF({...f,toWarehouse:e.target.value})}/></FormField>
</FormGrid></FormSection></FormLayout>);}
