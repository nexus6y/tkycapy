'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import api from '@/lib/api';
import { Input } from '@/components/ui/input';
import { FormLayout, FormSection, FormGrid, FormField } from '@/components/form/form-layout';

const FI='h-9 rounded-md border border-border bg-background px-3 text-[13px] w-full';
const SECS=[{id:'basic',title:'BOM基本信息'}];

export default function BomCreatePage() {
  const router=useRouter();
  const [f,setF]=useState({code:'',name:'',materialName:'',version:'V1.0',quantity:'1'});
  const save=async()=>{try{await api.post('/boms',f);router.push('/production/bom');}catch(e:any){alert(e.response?.data?.message||'保存失败');}};
  return (<FormLayout title="新增BOM" onSave={save} sections={SECS} activeSection="basic">
    <FormSection id="basic" title="BOM基本信息"><FormGrid>
      <FormField label="BOM编码" required><Input className={FI} value={f.code} onChange={e=>setF({...f,code:e.target.value})}/></FormField>
      <FormField label="BOM名称" required><Input className={FI} value={f.name} onChange={e=>setF({...f,name:e.target.value})}/></FormField>
      <FormField label="物料名称"><Input className={FI} value={f.materialName} onChange={e=>setF({...f,materialName:e.target.value})}/></FormField>
      <FormField label="版本"><Input className={FI} value={f.version} onChange={e=>setF({...f,version:e.target.value})}/></FormField>
      <FormField label="数量"><Input type="number" className={FI} value={f.quantity} onChange={e=>setF({...f,quantity:e.target.value})}/></FormField>
    </FormGrid></FormSection>
  </FormLayout>);
}
