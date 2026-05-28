'use client';import { useEffect, useState } from 'react';import { useRouter, useParams } from 'next/navigation';import api from '@/lib/api';import { Input } from '@/components/ui/input';import { toast } from '@/components/ui/toast';
import { FormLayout,FormSection,FormGrid,FormField } from '@/components/form/form-layout';
const FI='h-9 rounded-md border border-border bg-background px-3 text-[13px] w-full';
export default function IEdit(){const router=useRouter();const {id}=useParams<{id:string}>();const [l,setL]=useState(true);const [f,setF]=useState<any>({});
useEffect(()=>{api.get('/inbound-orders/'+id).then(r=>{setF(r.data);setL(false);});},[id]);
const save=async()=>{try{await api.put('/inbound-orders/'+id,f);router.push('/warehouse/inbound');}catch(e:any){toast(e.response?.data?.message||'保存失败','error');}};
if(l)return<div className="h-full flex items-center justify-center text-muted-foreground">加载中...</div>;
return(<FormLayout title={'编辑入库单：'+f.orderNo} onSave={save} sections={[{id:'b',title:'入库信息'}]} activeSection="b"><FormSection id="b" title="入库信息"><FormGrid>
<FormField label="入库单号"><Input className={FI} value={f.orderNo} disabled/></FormField>
<FormField label="物料名称"><Input className={FI} value={f.materialName||''} onChange={e=>setF({...f,materialName:e.target.value})}/></FormField>
<FormField label="规格型号"><Input className={FI} value={f.specification||''} onChange={e=>setF({...f,specification:e.target.value})}/></FormField>
<FormField label="数量"><Input type="number" className={FI} value={f.quantity||''} onChange={e=>setF({...f,quantity:e.target.value})}/></FormField>
<FormField label="仓库"><Input className={FI} value={f.warehouseName||''} onChange={e=>setF({...f,warehouseName:e.target.value})}/></FormField>
<FormField label="单价"><Input type="number" className={FI} value={f.unitPrice||''} onChange={e=>setF({...f,unitPrice:e.target.value})}/></FormField>
<FormField label="金额"><Input type="number" className={FI} value={f.totalAmount||''} onChange={e=>setF({...f,totalAmount:e.target.value})}/></FormField>
</FormGrid></FormSection></FormLayout>);}
