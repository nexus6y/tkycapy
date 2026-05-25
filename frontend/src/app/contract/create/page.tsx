'use client';
import { useState } from 'react';import { useRouter } from 'next/navigation';import api from '@/lib/api';
import { Input } from '@/components/ui/input';import { Select,SelectContent,SelectItem,SelectTrigger,SelectValue } from '@/components/ui/select';
import { FormLayout,FormSection,FormGrid,FormField } from '@/components/form/form-layout';
const FI='h-9 rounded-md border border-border bg-background px-3 text-[13px] w-full';
export default function ContractCreate(){const router=useRouter();
const [f,setF]=useState({code:'',name:'',type:'销售合同',customerName:'',supplierName:'',totalAmount:'',startDate:'',endDate:''});
const save=async()=>{try{await api.post('/contracts',f);router.push('/contract');}catch(e:any){alert(e.response?.data?.message||'保存失败');}};
return(<FormLayout title="新增合同" onSave={save} sections={[{id:'b',title:'基本信息'}]} activeSection="b"><FormSection id="b" title="基本信息"><FormGrid>
<FormField label="合同编码" required><Input className={FI} value={f.code} onChange={e=>setF({...f,code:e.target.value})}/></FormField>
<FormField label="合同名称" required><Input className={FI} value={f.name} onChange={e=>setF({...f,name:e.target.value})}/></FormField>
<FormField label="合同类型" required><Select value={f.type} onValueChange={v=>setF({...f,type:v})}><SelectTrigger className={FI}><SelectValue/></SelectTrigger><SelectContent><SelectItem value="销售合同">销售合同</SelectItem><SelectItem value="采购合同">采购合同</SelectItem></SelectContent></Select></FormField>
<FormField label={f.type==='销售合同'?'客户':'供应商'}><Input className={FI} value={f.type==='销售合同'?f.customerName:f.supplierName} onChange={e=>setF({...f,[f.type==='销售合同'?'customerName':'supplierName']:e.target.value})}/></FormField>
<FormField label="金额"><Input type="number" className={FI} value={f.totalAmount} onChange={e=>setF({...f,totalAmount:e.target.value})}/></FormField>
<FormField label="开始日期"><Input type="date" className={FI} value={f.startDate} onChange={e=>setF({...f,startDate:e.target.value})}/></FormField>
<FormField label="结束日期"><Input type="date" className={FI} value={f.endDate} onChange={e=>setF({...f,endDate:e.target.value})}/></FormField>
</FormGrid></FormSection></FormLayout>);}
