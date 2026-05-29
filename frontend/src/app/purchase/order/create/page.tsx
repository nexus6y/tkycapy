'use client';import { useState } from 'react';import { useRouter } from 'next/navigation';import api from '@/lib/api';import { Input } from '@/components/ui/input';import { FormLayout,FormSection,FormGrid,FormField } from '@/components/form/form-layout';import { LinesEditor, LineItem } from '@/components/ui/lines-editor';
const FI='h-9 rounded-md border border-border bg-background px-3 text-[13px] w-full';
export default function PurchaseOrderCreate(){const router=useRouter();const [f,setF]=useState({orderNo:'',orderName:'',supplierName:'',purchaser:'',orderType:'',totalAmount:'',expectedDeliveryDate:'',remark:''});
const [lines,setLines]=useState<LineItem[]>([]);
const save=async()=>{await api.post('/purchase-orders',{...f,lines});router.push('/purchase/order');};
return(<FormLayout title="新增采购订单" onSave={save} sections={[{id:'b',title:'基本信息'},{id:'l',title:'明细信息'}]} activeSection="b">
<FormSection id="b" title="基本信息"><FormGrid>
<FormField label="订单编号"><Input className={FI} placeholder="留空自动生成" value={f.orderNo} onChange={e=>setF({...f,orderNo:e.target.value})}/></FormField>
<FormField label="订单名称" required><Input className={FI} value={f.orderName} onChange={e=>setF({...f,orderName:e.target.value})}/></FormField>
<FormField label="供应商" required><Input className={FI} value={f.supplierName} onChange={e=>setF({...f,supplierName:e.target.value})}/></FormField>
<FormField label="采购负责人"><Input className={FI} value={f.purchaser} onChange={e=>setF({...f,purchaser:e.target.value})}/></FormField>
<FormField label="采购方式"><Input className={FI} value={f.orderType} onChange={e=>setF({...f,orderType:e.target.value})}/></FormField>
<FormField label="金额"><Input type="number" className={FI} value={f.totalAmount} onChange={e=>setF({...f,totalAmount:e.target.value})}/></FormField>
<FormField label="期望交货日"><Input type="date" className={FI} value={f.expectedDeliveryDate} onChange={e=>setF({...f,expectedDeliveryDate:e.target.value})}/></FormField>
<FormField label="备注"><Input className={FI} value={f.remark} onChange={e=>setF({...f,remark:e.target.value})}/></FormField>
</FormGrid></FormSection>
<FormSection id="l" title="明细信息"><LinesEditor lines={lines} onChange={setLines}/></FormSection>
</FormLayout>);}
