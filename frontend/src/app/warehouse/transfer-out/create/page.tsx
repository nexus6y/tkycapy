'use client';import { useState } from 'react';import { useRouter } from 'next/navigation';import api from '@/lib/api';import { Input } from '@/components/ui/input';import { RadioGroup,RadioGroupItem } from '@/components/ui/radio-group';import { FormLayout,FormSection,FormGrid,FormField } from '@/components/form/form-layout';
const FI='h-9 rounded-md border border-border bg-background px-3 text-[13px] w-full';
export default function TCreate(){const router=useRouter();const [f,setF]=useState({orderNo:'',type:'OUT',materialName:'',quantity:'',fromWarehouse:'',toWarehouse:''});
const save=async()=>{try{await api.post('/transfer-orders',f);router.push('/warehouse/transfer-out');}catch(e:any){alert(e.response?.data?.message||'保存失败');}};
return(<FormLayout title="新增调拨单" onSave={save} sections={[{id:'b',title:'调拨信息'}]} activeSection="b"><FormSection id="b" title="调拨信息"><FormGrid>
<FormField label="调拨单号" required><Input className={FI} value={f.orderNo} onChange={e=>setF({...f,orderNo:e.target.value})}/></FormField>
<FormField label="调拨类型" required><RadioGroup value={f.type} onValueChange={v=>setF({...f,type:v})} className="flex gap-4 pt-1.5"><div className="flex items-center gap-1.5"><RadioGroupItem value="OUT" id="to-out"/><label htmlFor="to-out" className="text-[13px]">调出</label></div><div className="flex items-center gap-1.5"><RadioGroupItem value="IN" id="to-in"/><label htmlFor="to-in" className="text-[13px]">调入</label></div></RadioGroup></FormField>
<FormField label="物料名称"><Input className={FI} value={f.materialName} onChange={e=>setF({...f,materialName:e.target.value})}/></FormField>
<FormField label="数量"><Input type="number" className={FI} value={f.quantity} onChange={e=>setF({...f,quantity:e.target.value})}/></FormField>
<FormField label="调出仓库"><Input className={FI} value={f.fromWarehouse} onChange={e=>setF({...f,fromWarehouse:e.target.value})}/></FormField>
<FormField label="调入仓库"><Input className={FI} value={f.toWarehouse} onChange={e=>setF({...f,toWarehouse:e.target.value})}/></FormField>
</FormGrid></FormSection></FormLayout>);}
