'use client';import { useEffect, useState } from 'react';import { useRouter } from 'next/navigation';import api from '@/lib/api';import { Input } from '@/components/ui/input';import { toast } from '@/components/ui/toast';
import { FormLayout,FormSection,FormGrid,FormField } from '@/components/form/form-layout';
import { LinesEditor, LineItem } from '@/components/ui/lines-editor';
import { EntitySelect } from '@/components/form/entity-select';
import { applyCustomerSelection, applyContractSelection } from '@/lib/field-linkage';
import { calcTotalFromLines, recalcHeaderTotals } from '@/lib/calc';
const FI='h-9 rounded-md border border-border bg-background px-3 text-[13px] w-full';

export default function PreOrderCreate(){const router=useRouter();
const [f,setF]=useState({orderNo:'',orderName:'',customerId:'',customerCode:'',customerName:'',contractId:'',contractCode:'',contractName:'',totalAmount:'',remark:''});
const [lines,setLines]=useState<LineItem[]>([]);
useEffect(()=>{api.get('/common/next-code',{params:{entity:'preOrder'}}).then(r=>setF((prev:any)=>({...prev,orderNo:r.data.code})));},[]);

const onLinesChange=(newLines:LineItem[])=>{
  setLines(newLines);
  if(newLines.length>0){const h=recalcHeaderTotals(newLines);setF(prev=>({...prev,totalAmount:h.totalAmount}));}
};

const save=async()=>{
  try{
    if(!f.orderName)return toast('请填写分劈名称','error');
    const payload:any={...f};
    if(lines.length>0){payload.lines=lines;payload.totalAmount=calcTotalFromLines(lines);}
    await api.post('/pre-orders',payload);router.push('/sales/pre-order');
  }catch(e:any){toast(e.response?.data?.message||'保存失败','error');}};
return(<FormLayout title="新增分劈单" onSave={save} sections={[{id:'b',title:'分劈单信息'},{id:'l',title:'明细信息'}]} activeSection="b">
<FormSection id="b" title="分劈单信息"><FormGrid>
<FormField label="分劈单号" required><Input className={FI} value={f.orderNo} readOnly disabled/></FormField>
<FormField label="分劈名称" required><Input className={FI} value={f.orderName} onChange={e=>setF({...f,orderName:e.target.value})}/></FormField>
<FormField label="客户"><EntitySelect entity="customer" value={f.customerId} onChange={(id,c)=>{setF({...f,...applyCustomerSelection(c)});}}/></FormField>
<FormField label="客户编码">{f.customerCode&&<Input className={FI} value={f.customerCode} readOnly disabled/>}</FormField>
<FormField label="合同"><EntitySelect entity="contract" value={f.contractId} onChange={(id,c)=>{setF({...f,...applyContractSelection(c)});}}/></FormField>
<FormField label="金额"><Input className={FI} value={lines.length>0?calcTotalFromLines(lines):f.totalAmount} placeholder="自动=明细合计" readOnly disabled/></FormField>
</FormGrid></FormSection>
<FormSection id="l" title="明细信息"><LinesEditor lines={lines} onChange={onLinesChange}/></FormSection>
</FormLayout>);}
