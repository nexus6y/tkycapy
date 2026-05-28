'use client';import { useEffect, useState } from 'react';import { useRouter } from 'next/navigation';import api from '@/lib/api';import { Input } from '@/components/ui/input';import { FormLayout,FormSection,FormGrid,FormField } from '@/components/form/form-layout';import { toast } from '@/components/ui/toast';
const FI='h-9 rounded-md border border-border bg-background px-3 text-[13px] w-full';
export default function ICreate(){const router=useRouter();const [f,setF]=useState({orderNo:'',sourceType:'',sourceNo:'',supplierName:'',materialName:'',specification:'',quantity:'',warehouseName:'',unitPrice:'',totalAmount:'',remark:''});
useEffect(()=>{api.get('/common/next-code',{params:{entity:'inboundOrder'}}).then(r=>setF((prev:any)=>({...prev,orderNo:r.data.code})));},[]);
const save=async()=>{if(!f.materialName)return toast('请填写物料名称','error');if(!f.quantity)return toast('请填写数量','error');const p:any={...f};if(p.totalAmount==='')p.totalAmount=undefined;await api.post('/inbound-orders',p);router.push('/warehouse/inbound');};
return(<FormLayout title="新增入库单" onSave={save} sections={[{id:'b',title:'入库信息'}]} activeSection="b"><FormSection id="b" title="入库信息"><FormGrid>
<FormField label="入库单号"><Input className={FI} value={f.orderNo} readOnly disabled/></FormField>
<FormField label="来源类型"><Input className={FI} value={f.sourceType} placeholder="PURCHASE/INSPECTION/PRODUCTION" onChange={e=>setF({...f,sourceType:e.target.value})}/></FormField>
<FormField label="来源单号"><Input className={FI} value={f.sourceNo} onChange={e=>setF({...f,sourceNo:e.target.value})}/></FormField>
<FormField label="供应商"><Input className={FI} value={f.supplierName} onChange={e=>setF({...f,supplierName:e.target.value})}/></FormField>
<FormField label="物料名称" required><Input className={FI} value={f.materialName} onChange={e=>setF({...f,materialName:e.target.value})}/></FormField>
<FormField label="规格型号"><Input className={FI} value={f.specification} onChange={e=>setF({...f,specification:e.target.value})}/></FormField>
<FormField label="数量" required><Input type="number" className={FI} value={f.quantity} onChange={e=>setF({...f,quantity:e.target.value})}/></FormField>
<FormField label="仓库"><Input className={FI} value={f.warehouseName} onChange={e=>setF({...f,warehouseName:e.target.value})}/></FormField>
<FormField label="单价"><Input type="number" className={FI} value={f.unitPrice} onChange={e=>setF({...f,unitPrice:e.target.value})} placeholder="0.00"/></FormField>
<FormField label="金额"><Input type="number" className={FI} value={f.totalAmount} onChange={e=>setF({...f,totalAmount:e.target.value})} placeholder="自动=数量×单价"/></FormField>
<FormField label="备注"><Input className={FI} value={f.remark} onChange={e=>setF({...f,remark:e.target.value})}/></FormField>
</FormGrid></FormSection></FormLayout>);}
