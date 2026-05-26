'use client';import { useState, useEffect } from 'react';import { useRouter } from 'next/navigation';import api from '@/lib/api';import { Input } from '@/components/ui/input';import { Select,SelectContent,SelectItem,SelectTrigger,SelectValue } from '@/components/ui/select';import { FormLayout,FormSection,FormGrid,FormField } from '@/components/form/form-layout';const FI='h-9 rounded-md border border-border bg-background px-3 text-[13px] w-full';
export default function PurchasePlanCreate(){const router=useRouter();const [suppliers,setSuppliers]=useState<any[]>([]);
const [f,setF]=useState({orderNo:'',orderName:'',supplierId:'',supplierName:'',materialName:'',quantity:'',requiredDate:''});
useEffect(()=>{api.get('/suppliers',{params:{pageSize:999}}).then(r=>setSuppliers(r.data.items));},[]);
const save=async()=>{await api.post('/purchase-plans',f);router.push('/purchase/plan');};
return(<FormLayout title="新增采购计划" onSave={save} sections={[{id:'b',title:'计划信息'}]} activeSection="b"><FormSection id="b" title="计划信息"><FormGrid>
<FormField label="计划编号" required><Input className={FI} value={f.orderNo} onChange={e=>setF({...f,orderNo:e.target.value})}/></FormField>
<FormField label="计划名称" required><Input className={FI} value={f.orderName} onChange={e=>setF({...f,orderName:e.target.value})}/></FormField>
<FormField label="供应商"><Select value={f.supplierId} onValueChange={v=>{const s=suppliers.find(x=>x.id===v);setF({...f,supplierId:v,supplierName:s?.name||''});}}><SelectTrigger className={FI}><SelectValue placeholder="选择供应商"/></SelectTrigger><SelectContent>{suppliers.map(s=><SelectItem key={s.id} value={s.id}>{s.code} {s.name}</SelectItem>)}</SelectContent></Select></FormField>
<FormField label="物料名称"><Input className={FI} value={f.materialName} onChange={e=>setF({...f,materialName:e.target.value})}/></FormField>
<FormField label="数量"><Input type="number" className={FI} value={f.quantity} onChange={e=>setF({...f,quantity:e.target.value})}/></FormField>
<FormField label="需求日期"><Input type="date" className={FI} value={f.requiredDate} onChange={e=>setF({...f,requiredDate:e.target.value})}/></FormField>
</FormGrid></FormSection></FormLayout>);}
