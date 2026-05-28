'use client';import { useState } from 'react';import { useRouter } from 'next/navigation';import api from '@/lib/api';import { Input } from '@/components/ui/input';import { RadioGroup,RadioGroupItem } from '@/components/ui/radio-group';import { toast } from '@/components/ui/toast';
import { FormLayout,FormSection,FormGrid,FormField } from '@/components/form/form-layout';const FI='h-9 rounded-md border border-border bg-background px-3 text-[13px] w-full';
export default function CheckCreate(){const router=useRouter();const [f,setF]=useState({orderNo:'',checkMethod:'',materialName:'',spec:'',batchNo:'',stockQty:'0',checkQty:'0',diffQty:'0',warehouseName:'',zoneName:'',areaName:'',inspector:'',checkDate:new Date().toISOString().split('T')[0],status:'ACTIVE'});
const save=async()=>{try{await api.post('/check-orders',f);router.push('/warehouse/check');}catch(e:any){toast(e.response?.data?.message||'保存失败','error');}};
return(<FormLayout title="新增盘点单" onSave={save} sections={[{id:'b',title:'基本信息'}]} activeSection="b"><FormSection id="b" title="基本信息"><FormGrid>
<FormField label="盘点单号" required><Input className={FI} value={f.orderNo} onChange={e=>setF({...f,orderNo:e.target.value})}/></FormField>
<FormField label="盘点方式"><Input className={FI} value={f.checkMethod} onChange={e=>setF({...f,checkMethod:e.target.value})}/></FormField>
<FormField label="物料名称"><Input className={FI} value={f.materialName} onChange={e=>setF({...f,materialName:e.target.value})}/></FormField>
<FormField label="规格型号"><Input className={FI} value={f.spec} onChange={e=>setF({...f,spec:e.target.value})}/></FormField>
<FormField label="批次号"><Input className={FI} value={f.batchNo} onChange={e=>setF({...f,batchNo:e.target.value})}/></FormField>
<FormField label="库存数量"><Input type="number" className={FI} value={f.stockQty} onChange={e=>setF({...f,stockQty:e.target.value})}/></FormField>
<FormField label="盘点数量"><Input type="number" className={FI} value={f.checkQty} onChange={e=>setF({...f,checkQty:e.target.value})}/></FormField>
<FormField label="差异数量"><Input type="number" className={FI} value={f.diffQty} onChange={e=>setF({...f,diffQty:e.target.value})}/></FormField>
<FormField label="仓库"><Input className={FI} value={f.warehouseName} onChange={e=>setF({...f,warehouseName:e.target.value})}/></FormField>
<FormField label="盘点人"><Input className={FI} value={f.inspector} onChange={e=>setF({...f,inspector:e.target.value})}/></FormField>
<FormField label="盘点日期"><Input type="date" className={FI} value={f.checkDate} onChange={e=>setF({...f,checkDate:e.target.value})}/></FormField>
</FormGrid></FormSection></FormLayout>);}
