'use client';import { useState } from 'react';import { useRouter } from 'next/navigation';import api from '@/lib/api';import { Input } from '@/components/ui/input';import { toast } from '@/components/ui/toast';
import { FormLayout,FormSection,FormGrid,FormField } from '@/components/form/form-layout';
import { EntitySelect } from '@/components/form/entity-select';
import { applyMaterialSelection } from '@/lib/field-linkage';
const FI='h-9 rounded-md border border-border bg-background px-3 text-[13px] w-full';

export default function SCreate(){const router=useRouter();
const [f,setF]=useState({orderNo:'',materialId:'',materialCode:'',materialName:'',quantity:'',scrapReason:'',disposalMethod:''});
const save=async()=>{try{await api.post('/scrap-orders',f);router.push('/warehouse/scrap-apply');}catch(e:any){toast(e.response?.data?.message||'保存失败','error');}};
return(<FormLayout title="新增报废申请" onSave={save} sections={[{id:'b',title:'报废信息'}]} activeSection="b"><FormSection id="b" title="报废信息"><FormGrid>
<FormField label="报废单号"><Input className={FI} value={f.orderNo} onChange={e=>setF({...f,orderNo:e.target.value})} placeholder="留空自动生成"/></FormField>
<FormField label="物料"><EntitySelect entity="material" value={f.materialId} onChange={(id,m)=>{setF({...f,...applyMaterialSelection(m)});}}/></FormField>
<FormField label="数量"><Input type="number" className={FI} value={f.quantity} onChange={e=>setF({...f,quantity:e.target.value})}/></FormField>
<FormField label="报废原因"><Input className={FI} value={f.scrapReason} onChange={e=>setF({...f,scrapReason:e.target.value})}/></FormField>
<FormField label="处置方式"><Input className={FI} value={f.disposalMethod} onChange={e=>setF({...f,disposalMethod:e.target.value})}/></FormField>
</FormGrid></FormSection></FormLayout>);}
