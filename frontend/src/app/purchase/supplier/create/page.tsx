'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import api from '@/lib/api';
import { Input } from '@/components/ui/input';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { FormLayout, FormSection, FormGrid, FormField } from '@/components/form/form-layout';

const FI='h-9 rounded-md border border-border bg-background px-3 text-[13px] w-full';
export default function SupplierCreatePage() {
  const router=useRouter();
  const [f,setF]=useState({code:'',name:'',contactPerson:'',contactPhone:'',contactEmail:'',address:'',creditLevel:'',taxId:'',bankName:'',bankAccount:'',status:'ACTIVE'});
  const save=async()=>{try{await api.post('/suppliers',f);router.push('/purchase/supplier');}catch(e:any){alert(e.response?.data?.message||'保存失败');}};
  return (<FormLayout title="新增供应商" onSave={save} sections={[{id:'b',title:'基本信息'},{id:'f',title:'财务信息'}]} activeSection="b">
    <FormSection id="b" title="基本信息"><FormGrid>
      <FormField label="供应商编码" required><Input className={FI} value={f.code} onChange={e=>setF({...f,code:e.target.value})}/></FormField>
      <FormField label="供应商名称" required><Input className={FI} value={f.name} onChange={e=>setF({...f,name:e.target.value})}/></FormField>
      <FormField label="联系人"><Input className={FI} value={f.contactPerson} onChange={e=>setF({...f,contactPerson:e.target.value})}/></FormField>
      <FormField label="联系电话"><Input className={FI} value={f.contactPhone} onChange={e=>setF({...f,contactPhone:e.target.value})}/></FormField>
      <FormField label="邮箱"><Input className={FI} value={f.contactEmail} onChange={e=>setF({...f,contactEmail:e.target.value})}/></FormField>
      <FormField label="信用等级"><Input className={FI} value={f.creditLevel} onChange={e=>setF({...f,creditLevel:e.target.value})}/></FormField>
      <div className="col-span-2"><FormField label="地址"><Input className={FI} value={f.address} onChange={e=>setF({...f,address:e.target.value})}/></FormField></div>
    </FormGrid></FormSection>
    <FormSection id="f" title="财务信息"><FormGrid>
      <FormField label="税号"><Input className={FI} value={f.taxId} onChange={e=>setF({...f,taxId:e.target.value})}/></FormField>
      <FormField label="开户银行"><Input className={FI} value={f.bankName} onChange={e=>setF({...f,bankName:e.target.value})}/></FormField>
      <FormField label="银行账号"><Input className={FI} value={f.bankAccount} onChange={e=>setF({...f,bankAccount:e.target.value})}/></FormField>
      <FormField label="状态"><RadioGroup value={f.status} onValueChange={v=>setF({...f,status:v})} className="flex gap-4 pt-1.5"><div className="flex items-center gap-1.5"><RadioGroupItem value="ACTIVE" id="ss-a"/><label htmlFor="ss-a" className="text-[13px]">启用</label></div><div className="flex items-center gap-1.5"><RadioGroupItem value="INACTIVE" id="ss-i"/><label htmlFor="ss-i" className="text-[13px]">停用</label></div></RadioGroup></FormField>
    </FormGrid></FormSection>
  </FormLayout>);
}
