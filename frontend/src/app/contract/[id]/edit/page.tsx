'use client';import { useEffect, useState } from 'react';import { useRouter, useParams } from 'next/navigation';import api from '@/lib/api';import { Input } from '@/components/ui/input';import { Select,SelectContent,SelectItem,SelectTrigger,SelectValue } from '@/components/ui/select';import { toast } from '@/components/ui/toast';
import { FormLayout,FormSection,FormGrid,FormField } from '@/components/form/form-layout';
import { EntitySelect } from '@/components/form/entity-select';
import { applyCustomerSelection, applySupplierSelection, applyProjectSelection } from '@/lib/field-linkage';
const FI='h-9 rounded-md border border-border bg-background px-3 text-[13px] w-full';

export default function CEdit(){const router=useRouter();const {id}=useParams<{id:string}>();const [loading,setLoading]=useState(true);const [f,setF]=useState<any>({});
useEffect(()=>{api.get('/contracts/'+id).then(r=>{setF(r.data);setLoading(false);}).catch(()=>{toast('加载失败','error');router.push('/contract');});},[id]);
const save=async()=>{
  try{
    if(!f.name)return toast('请输入合同名称','error');
    await api.put('/contracts/'+id,f);router.push('/contract');
  }catch(e:any){toast(e.response?.data?.message||'保存失败','error');}
};
if(loading)return<div className="h-full flex items-center justify-center text-muted-foreground">加载中...</div>;
const isSales=f.type==='销售合同';
return(<FormLayout title={'编辑合同：'+f.code} onSave={save} sections={[{id:'b',title:'基本信息'},{id:'p',title:'合作方信息'}]} activeSection="b">
<FormSection id="b" title="基本信息"><FormGrid>
<FormField label="合同编码"><Input className={FI} value={f.code} disabled/></FormField>
<FormField label="合同名称" required><Input className={FI} value={f.name||''} onChange={e=>setF({...f,name:e.target.value})}/></FormField>
<FormField label="合同类型">
  <Select value={f.type} onValueChange={(v:any)=>setF({...f,type:v})}>
    <SelectTrigger className={FI}><SelectValue/></SelectTrigger>
    <SelectContent><SelectItem value="销售合同">销售合同</SelectItem><SelectItem value="采购合同">采购合同</SelectItem></SelectContent></Select></FormField>
<FormField label="所属项目">
  <EntitySelect entity="project" value={f.projectId||''}
    onChange={(id,p)=>{setF({...f,...applyProjectSelection(p)});}}/></FormField>
<FormField label="金额"><Input type="number" className={FI} value={f.totalAmount||''} onChange={e=>setF({...f,totalAmount:e.target.value})}/></FormField>
<FormField label="开始日期"><Input type="date" className={FI} value={f.startDate?f.startDate.slice(0,10):''} onChange={e=>setF({...f,startDate:e.target.value})}/></FormField>
<FormField label="结束日期"><Input type="date" className={FI} value={f.endDate?f.endDate.slice(0,10):''} onChange={e=>setF({...f,endDate:e.target.value})}/></FormField>
</FormGrid></FormSection>

<FormSection id="p" title="合作方信息"><FormGrid>
{isSales?<>
  <FormField label="客户">
    <EntitySelect entity="customer" value={f.customerId||''}
      onChange={(id,c)=>{setF({...f,...applyCustomerSelection(c)});}}/></FormField>
  <FormField label="客户编码"><Input className={FI} value={f.customerCode||''} readOnly disabled/></FormField>
  <FormField label="联系人"><Input className={FI} value={f.contactPerson||''} onChange={e=>setF({...f,contactPerson:e.target.value})}/></FormField>
  <FormField label="联系电话"><Input className={FI} value={f.contactPhone||''} onChange={e=>setF({...f,contactPhone:e.target.value})}/></FormField>
  <FormField label="邮箱"><Input className={FI} value={f.contactEmail||''} onChange={e=>setF({...f,contactEmail:e.target.value})}/></FormField>
  <div className="col-span-2"><FormField label="地址"><Input className={FI} value={f.address||''} onChange={e=>setF({...f,address:e.target.value})}/></FormField></div>
</>:<>
  <FormField label="供应商">
    <EntitySelect entity="supplier" value={f.supplierId||''}
      onChange={(id,s)=>{setF({...f,...applySupplierSelection(s)});}}/></FormField>
  <FormField label="供应商编码"><Input className={FI} value={f.supplierCode||''} readOnly disabled/></FormField>
  <FormField label="联系人"><Input className={FI} value={f.supplierContact||''} onChange={e=>setF({...f,supplierContact:e.target.value})}/></FormField>
  <FormField label="联系电话"><Input className={FI} value={f.supplierPhone||''} onChange={e=>setF({...f,supplierPhone:e.target.value})}/></FormField>
</>}
</FormGrid></FormSection>
</FormLayout>);}
