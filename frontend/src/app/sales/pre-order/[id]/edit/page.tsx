'use client';import { useEffect, useState } from 'react';import { useRouter, useParams } from 'next/navigation';import api from '@/lib/api';import { Input } from '@/components/ui/input';import { toast } from '@/components/ui/toast';
import { FormLayout,FormSection,FormGrid,FormField } from '@/components/form/form-layout';
import { LinesEditor, LineItem } from '@/components/ui/lines-editor';
import { EntitySelect } from '@/components/form/entity-select';
import { applyCustomerSelection, applyContractSelection } from '@/lib/field-linkage';
import { calcTotalFromLines, recalcHeaderTotals } from '@/lib/calc';
const FI='h-9 rounded-md border border-border bg-background px-3 text-[13px] w-full';

export default function POEdit(){const router=useRouter();const {id}=useParams<{id:string}>();const [loading,setLoading]=useState(true);const [f,setF]=useState<any>({});
const [lines,setLines]=useState<LineItem[]>([]);
useEffect(()=>{api.get('/pre-orders/'+id).then(r=>{setF(r.data);if(r.data.lines)setLines(r.data.lines);setLoading(false);});},[id]);
const save=async()=>{
  try{
    const payload:any={...f};
    if(lines.length>0){payload.lines=lines;payload.totalAmount=calcTotalFromLines(lines);}
    await api.put('/pre-orders/'+id,payload);router.push('/sales/pre-order');
  }catch(e:any){toast(e.response?.data?.message||'保存失败','error');}};
if(loading)return<div className="h-full flex items-center justify-center text-muted-foreground">加载中...</div>;
return(<FormLayout title={'编辑分劈单：'+f.orderNo} onSave={save} sections={[{id:'b',title:'分劈单信息'},{id:'l',title:'明细信息'}]} activeSection="b">
<FormSection id="b" title="分劈单信息"><FormGrid>
<FormField label="分劈单号"><Input className={FI} value={f.orderNo} disabled/></FormField>
<FormField label="分劈名称" required><Input className={FI} value={f.orderName} onChange={e=>setF({...f,orderName:e.target.value})}/></FormField>
<FormField label="客户"><EntitySelect entity="customer" value={f.customerId||''} onChange={(id,c)=>{setF({...f,...applyCustomerSelection(c)});}}/></FormField>
<FormField label="合同"><EntitySelect entity="contract" value={f.contractId||''} onChange={(id,c)=>{setF({...f,...applyContractSelection(c)});}}/></FormField>
<FormField label="金额"><Input className={FI} value={lines.length>0?calcTotalFromLines(lines):(f.totalAmount||'')} placeholder="自动=明细合计" readOnly disabled/></FormField>
</FormGrid></FormSection>
<FormSection id="l" title="明细信息"><LinesEditor lines={lines} onChange={setLines}/></FormSection>
</FormLayout>);}
