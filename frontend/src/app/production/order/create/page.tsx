'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import api from '@/lib/api';
import { Input } from '@/components/ui/input';
import { toast } from '@/components/ui/toast';
import { FormLayout, FormSection, FormGrid, FormField } from '@/components/form/form-layout';

const FI='h-9 rounded-md border border-border bg-background px-3 text-[13px] w-full';
const SECS=[{id:'basic',title:'生产订单信息'}];

export default function ProductionOrderCreatePage() {
  const router=useRouter();
  const [f,setF]=useState({orderNo:'',orderName:'',materialName:'',departmentName:'',quantity:'1',startDate:'',endDate:'',remark:''});
  const save=async()=>{try{await api.post('/production-orders',{...f,quantity:+f.quantity});router.push('/production/order');}catch(e:any){toast(e.response?.data?.message||'保存失败','error');}};
  return (<FormLayout title="新增生产订单" onSave={save} sections={SECS} activeSection="basic">
    <FormSection id="basic" title="生产订单信息"><FormGrid>
      <FormField label="生产编号" required><Input className={FI} value={f.orderNo} onChange={e=>setF({...f,orderNo:e.target.value})}/></FormField>
      <FormField label="生产名称" required><Input className={FI} value={f.orderName} onChange={e=>setF({...f,orderName:e.target.value})}/></FormField>
      <FormField label="物料"><Input className={FI} value={f.materialName} onChange={e=>setF({...f,materialName:e.target.value})}/></FormField>
      <FormField label="生产部门"><Input className={FI} value={f.departmentName} onChange={e=>setF({...f,departmentName:e.target.value})}/></FormField>
      <FormField label="数量"><Input type="number" className={FI} value={f.quantity} onChange={e=>setF({...f,quantity:e.target.value})}/></FormField>
      <FormField label="开始日期"><Input type="date" className={FI} value={f.startDate} onChange={e=>setF({...f,startDate:e.target.value})}/></FormField>
      <FormField label="结束日期"><Input type="date" className={FI} value={f.endDate} onChange={e=>setF({...f,endDate:e.target.value})}/></FormField>
      <div className="col-span-2"><FormField label="备注"><Input className={FI} value={f.remark} onChange={e=>setF({...f,remark:e.target.value})}/></FormField></div>
    </FormGrid></FormSection>
  </FormLayout>);
}
