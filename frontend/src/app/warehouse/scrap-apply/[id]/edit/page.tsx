'use client';import { useEffect, useState } from 'react';import { useRouter, useParams } from 'next/navigation';import api from '@/lib/api';import { Input } from '@/components/ui/input';import { FormLayout,FormSection,FormGrid,FormField } from '@/components/form/form-layout';
const FI='h-9 rounded-md border border-border bg-background px-3 text-[13px] w-full';
export default function SEdit(){const router=useRouter();const {id}=useParams<{id:string}>();const [l,setL]=useState(true);const [f,setF]=useState<any>({});
useEffect(()=>{api.get('/scrap-orders/'+id).then(r=>{setF(r.data);setL(false);});},[id]);
const save=async()=>{try{await api.put('/scrap-orders/'+id,f);router.push('/warehouse/scrap-apply');}catch(e:any){alert(e.response?.data?.message||'保存失败');}};
if(l)return<div className="h-full flex items-center justify-center text-muted-foreground">加载中...</div>;
return(<FormLayout title={'编辑报废单：'+f.orderNo} onSave={save} sections={[{id:'b',title:'报废信息'}]} activeSection="b"><FormSection id="b" title="报废信息"><FormGrid>
<FormField label="报废单号"><Input className={FI} value={f.orderNo} disabled/></FormField>
<FormField label="物料名称"><Input className={FI} value={f.materialName||''} onChange={e=>setF({...f,materialName:e.target.value})}/></FormField>
<FormField label="数量"><Input type="number" className={FI} value={f.quantity||''} onChange={e=>setF({...f,quantity:e.target.value})}/></FormField>
<FormField label="报废原因"><Input className={FI} value={f.scrapReason||''} onChange={e=>setF({...f,scrapReason:e.target.value})}/></FormField>
<FormField label="处置方式"><Input className={FI} value={f.disposalMethod||''} onChange={e=>setF({...f,disposalMethod:e.target.value})}/></FormField>
</FormGrid></FormSection></FormLayout>);}
