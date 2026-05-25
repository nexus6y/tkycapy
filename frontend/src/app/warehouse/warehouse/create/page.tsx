'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import api from '@/lib/api';
import { Input } from '@/components/ui/input';
import { FormLayout, FormSection, FormGrid, FormField } from '@/components/form/form-layout';
const FI='h-9 rounded-md border border-border bg-background px-3 text-[13px] w-full';
export default function WarehouseCreatePage() {
  const router=useRouter();const [f,setF]=useState({code:'',name:'',address:'',sortOrder:0});
  const save=async()=>{try{await api.post('/warehouses',f);router.push('/warehouse/warehouse');}catch(e:any){alert(e.response?.data?.message||'保存失败');}};
  return (<FormLayout title="新增仓库" onSave={save} sections={[{id:'b',title:'基本信息'}]} activeSection="b">
    <FormSection id="b" title="基本信息"><FormGrid>
      <FormField label="仓库编码" required><Input className={FI} value={f.code} onChange={e=>setF({...f,code:e.target.value})}/></FormField>
      <FormField label="仓库名称" required><Input className={FI} value={f.name} onChange={e=>setF({...f,name:e.target.value})}/></FormField>
      <FormField label="地址"><Input className={FI} value={f.address} onChange={e=>setF({...f,address:e.target.value})}/></FormField>
      <FormField label="排序"><Input type="number" className={FI} value={f.sortOrder} onChange={e=>setF({...f,sortOrder:+e.target.value})}/></FormField>
    </FormGrid></FormSection>
  </FormLayout>);
}
