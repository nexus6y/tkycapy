'use client';
import { useEffect, useState } from 'react';import { useRouter } from 'next/navigation';import api from '@/lib/api';
import { Input } from '@/components/ui/input';import { Select,SelectContent,SelectItem,SelectTrigger,SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { toast } from '@/components/ui/toast';
import { FormLayout,FormSection,FormGrid,FormField } from '@/components/form/form-layout';
import { EntitySelect } from '@/components/form/entity-select';
import { applyCustomerSelection, applySupplierSelection, applyProjectSelection } from '@/lib/field-linkage';
const FI='h-9 rounded-md border border-border bg-background px-3 text-[13px] w-full';

export default function ContractCreate(){const router=useRouter();
useEffect(()=>{api.get('/common/next-code',{params:{entity:'contract'}}).then(r=>setF((prev:any)=>({...prev,code:r.data.code})));},[]);
const [f,setF]=useState({
  code:'',name:'',type:'销售合同',projectId:'',projectCode:'',projectName:'',
  customerId:'',customerCode:'',customerName:'',contactPerson:'',contactPhone:'',contactEmail:'',address:'',
  supplierId:'',supplierCode:'',supplierName:'',supplierContact:'',supplierPhone:'',
  totalAmount:'',startDate:'',endDate:'',remark:'',
});

const save=async()=>{
  try{
    if(!f.name)return toast('请输入合同名称','error');
    const payload:any={...f};
    // Remove partner fields that don't apply to current type
    if(f.type=='销售合同'){delete payload.supplierId;delete payload.supplierCode;delete payload.supplierName;delete payload.supplierContact;delete payload.supplierPhone;}
    else{delete payload.customerId;delete payload.customerCode;delete payload.customerName;delete payload.contactPerson;delete payload.contactPhone;delete payload.contactEmail;delete payload.address;}
    delete payload.remark; // Contract model has no remark field
    await api.post('/contracts',payload);router.push('/contract');
  }catch(e:any){toast(e.response?.data?.message||'保存失败','error');}
};

const isSales=f.type==='销售合同';

return(<FormLayout title="新增合同" onSave={save} sections={[{id:'b',title:'基本信息'},{id:'p',title:'合作方信息'}]} activeSection="b">
<FormSection id="b" title="基本信息"><FormGrid>
<FormField label="合同编码" required><Input className={FI} value={f.code} readOnly disabled/></FormField>
<FormField label="合同名称" required><Input className={FI} value={f.name} onChange={e=>setF({...f,name:e.target.value})}/></FormField>
<FormField label="合同类型" required>
  <Select value={f.type} onValueChange={(v:any)=>setF({...f,type:v})}>
    <SelectTrigger className={FI}><SelectValue/></SelectTrigger>
    <SelectContent><SelectItem value="销售合同">销售合同</SelectItem><SelectItem value="采购合同">采购合同</SelectItem></SelectContent></Select></FormField>
<FormField label="所属项目">
  <EntitySelect entity="project" value={f.projectId}
    onChange={(id,p)=>{const fill=applyProjectSelection(p);setF(prev=>({...prev,...fill}));}}/></FormField>
<FormField label="金额"><Input type="number" className={FI} value={f.totalAmount} onChange={e=>setF({...f,totalAmount:e.target.value})}/></FormField>
<FormField label="开始日期"><Input type="date" className={FI} value={f.startDate} onChange={e=>setF({...f,startDate:e.target.value})}/></FormField>
<FormField label="结束日期"><Input type="date" className={FI} value={f.endDate} onChange={e=>setF({...f,endDate:e.target.value})}/></FormField>
</FormGrid></FormSection>

<FormSection id="p" title="合作方信息"><FormGrid>
{isSales?<>
  <FormField label="客户" required>
    <EntitySelect entity="customer" value={f.customerId}
      onChange={(id,c)=>{const fill=applyCustomerSelection(c);setF(prev=>({...prev,...fill}));}}/></FormField>
  <FormField label="客户编码"><Input className={FI} value={f.customerCode} readOnly disabled/></FormField>
  <FormField label="联系人"><Input className={FI} value={f.contactPerson} onChange={e=>setF({...f,contactPerson:e.target.value})}/></FormField>
  <FormField label="联系电话"><Input className={FI} value={f.contactPhone} onChange={e=>setF({...f,contactPhone:e.target.value})}/></FormField>
  <FormField label="邮箱"><Input className={FI} value={f.contactEmail} onChange={e=>setF({...f,contactEmail:e.target.value})}/></FormField>
  <div className="col-span-2"><FormField label="地址"><Input className={FI} value={f.address} onChange={e=>setF({...f,address:e.target.value})}/></FormField></div>
</>:<>
  <FormField label="供应商" required>
    <EntitySelect entity="supplier" value={f.supplierId}
      onChange={(id,s)=>{const fill=applySupplierSelection(s);setF(prev=>({...prev,...fill}));}}/></FormField>
  <FormField label="供应商编码"><Input className={FI} value={f.supplierCode} readOnly disabled/></FormField>
  <FormField label="联系人"><Input className={FI} value={f.supplierContact} onChange={e=>setF({...f,supplierContact:e.target.value})}/></FormField>
  <FormField label="联系电话"><Input className={FI} value={f.supplierPhone} onChange={e=>setF({...f,supplierPhone:e.target.value})}/></FormField>
</>}
</FormGrid></FormSection>
</FormLayout>);}
