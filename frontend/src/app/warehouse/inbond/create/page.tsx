'use client';import { useState } from 'react';import { useRouter } from 'next/navigation';import api from '@/lib/api';import { Input } from '@/components/ui/input';import { FormLayout,FormSection,FormGrid,FormField } from '@/components/form/form-layout';
const FI='h-9 rounded-md border border-border bg-background px-3 text-[13px] w-full';
export default function ICreate(){const router=useRouter();const [f,setF]=useState({orderNo:'',materialName:'',specification:'',quantity:'',warehouseName:'',unitPrice:'',totalAmount:'',remark:''});
const save=async()=>{try{await api.post('/inbound-orders',f);router.push('/warehouse/inbond');}catch(e:any){alert(e.response?.data?.message||'保存失败');}};
return(<FormLayout title="新增入库单" onSave={save} sections={[{id:'b',title:'入库信息'}]} activeSection="b"><FormSection id="b" title="入库信息"><FormGrid>
<FormField label="入库单号" required><Input className={FI} value={f.orderNo} onChange={e=>setF({...f,orderNo:e.target.value})}/></FormField>
<FormField label="物料名称"><Input className={FI} value={f.materialName} onChange={e=>setF({...f,materialName:e.target.value})}/></FormField>
<FormField label="规格型号"><Input className={FI} value={f.specification} onChange={e=>setF({...f,specification:e.target.value})}/></FormField>
<FormField label="数量"><Input type="number" className={FI} value={f.quantity} onChange={e=>setF({...f,quantity:e.target.value})}/></FormField>
<FormField label="仓库"><Input className={FI} value={f.warehouseName} onChange={e=>setF({...f,warehouseName:e.target.value})}/></FormField>
<FormField label="单价"><Input type="number" className={FI} value={f.unitPrice} onChange={e=>setF({...f,unitPrice:e.target.value})}/></FormField>
<FormField label="金额"><Input type="number" className={FI} value={f.totalAmount} onChange={e=>setF({...f,totalAmount:e.target.value})}/></FormField>
<FormField label="备注"><Input className={FI} value={f.remark} onChange={e=>setF({...f,remark:e.target.value})}/></FormField>
</FormGrid></FormSection></FormLayout>);}
