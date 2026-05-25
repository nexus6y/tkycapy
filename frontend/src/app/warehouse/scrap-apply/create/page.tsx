'use client';import { useState } from 'react';import { useRouter } from 'next/navigation';import api from '@/lib/api';import { Input } from '@/components/ui/input';import { FormLayout,FormSection,FormGrid,FormField } from '@/components/form/form-layout';
const FI='h-9 rounded-md border border-border bg-background px-3 text-[13px] w-full';
export default function SCreate(){const router=useRouter();const [f,setF]=useState({orderNo:'',materialName:'',quantity:'',scrapReason:'',disposalMethod:''});
const save=async()=>{try{await api.post('/scrap-orders',f);router.push('/warehouse/scrap-apply');}catch(e:any){alert(e.response?.data?.message||'保存失败');}};
return(<FormLayout title="新增报废申请" onSave={save} sections={[{id:'b',title:'报废信息'}]} activeSection="b"><FormSection id="b" title="报废信息"><FormGrid>
<FormField label="报废单号" required><Input className={FI} value={f.orderNo} onChange={e=>setF({...f,orderNo:e.target.value})}/></FormField>
<FormField label="物料名称"><Input className={FI} value={f.materialName} onChange={e=>setF({...f,materialName:e.target.value})}/></FormField>
<FormField label="数量"><Input type="number" className={FI} value={f.quantity} onChange={e=>setF({...f,quantity:e.target.value})}/></FormField>
<FormField label="报废原因"><Input className={FI} value={f.scrapReason} onChange={e=>setF({...f,scrapReason:e.target.value})}/></FormField>
<FormField label="处置方式"><Input className={FI} value={f.disposalMethod} onChange={e=>setF({...f,disposalMethod:e.target.value})}/></FormField>
</FormGrid></FormSection></FormLayout>);}
