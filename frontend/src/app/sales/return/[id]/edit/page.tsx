'use client';import { useEffect, useState } from 'react';import { useRouter, useParams } from 'next/navigation';import api from '@/lib/api';import { Input } from '@/components/ui/input';import { toast } from '@/components/ui/toast';
import { FormLayout,FormSection,FormGrid,FormField } from '@/components/form/form-layout';
import { EntitySelect } from '@/components/form/entity-select';
import { applyCustomerSelection } from '@/lib/field-linkage';
const FI='h-9 rounded-md border border-border bg-background px-3 text-[13px] w-full';

export default function SREdit(){const router=useRouter();const {id}=useParams<{id:string}>();const [loading,setLoading]=useState(true);const [f,setF]=useState<any>({});
useEffect(()=>{api.get('/sales-returns/'+id).then(r=>{setF(r.data);setLoading(false);});},[id]);
const save=async()=>{try{await api.put('/sales-returns/'+id,f);router.push('/sales/return');}catch(e:any){toast(e.response?.data?.message||'保存失败','error');}};
if(loading)return<div className="h-full flex items-center justify-center text-muted-foreground">加载中...</div>;
return(<FormLayout title={'编辑退货单：'+f.returnNo} onSave={save} sections={[{id:'b',title:'退货信息'}]} activeSection="b"><FormSection id="b" title="退货信息"><FormGrid>
<FormField label="退货单号"><Input className={FI} value={f.returnNo} disabled/></FormField>
<FormField label="关联出货"><Input className={FI} value={f.shipmentNo||''} readOnly disabled/></FormField>
<FormField label="客户"><EntitySelect entity="customer" value={f.customerId||''} onChange={(id,c)=>{setF({...f,...applyCustomerSelection(c)});}}/></FormField>
<FormField label="数量"><Input className={FI} value={f.totalQuantity||''} readOnly disabled/></FormField>
<FormField label="金额"><Input className={FI} value={f.totalAmount||''} readOnly disabled/></FormField>
<FormField label="退货原因"><Input className={FI} value={f.returnReason||''} onChange={e=>setF({...f,returnReason:e.target.value})} data-testid="sr-returnreason-input"/></FormField>
</FormGrid></FormSection></FormLayout>);}
