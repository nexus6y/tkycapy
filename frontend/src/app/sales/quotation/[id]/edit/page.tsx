'use client';import { useEffect, useState } from 'react';import { useRouter, useParams } from 'next/navigation';import api from '@/lib/api';import { Input } from '@/components/ui/input';import { toast } from '@/components/ui/toast';
import { FormLayout,FormSection,FormGrid,FormField } from '@/components/form/form-layout';
import { LinesEditor, LineItem } from '@/components/ui/lines-editor';
import { EntitySelect } from '@/components/form/entity-select';
import { applyCustomerSelection, applyDepartmentSelection } from '@/lib/field-linkage';
import { calcTotalFromLines } from '@/lib/calc';
const FI='h-9 rounded-md border border-border bg-background px-3 text-[13px] w-full';

const QT_COLS = [
  { key: 'lineNo', label: '行号', width: '60px', type: 'number' as const },
  { key: 'materialCode', label: '物料编码', width: '120px' },
  { key: 'materialName', label: '物料名称', width: '120px' },
  { key: 'spec', label: '规格型号', width: '100px' },
  { key: 'unit', label: '单位', width: '60px' },
  { key: 'quantity', label: '数量', width: '80px', type: 'number' as const },
  { key: 'unitPrice', label: '单价', width: '80px', type: 'number' as const },
  { key: 'amount', label: '金额', width: '100px', type: 'number' as const },
  { key: 'deliveryDate', label: '交期', width: '110px', type: 'date' as const },
  { key: 'warehouseCode', label: '仓库', width: '100px' },
];

export default function QEdit(){const router=useRouter();const {id}=useParams<{id:string}>();const [loading,setLoading]=useState(true);const [f,setF]=useState<any>({});
const [lines,setLines]=useState<LineItem[]>([]);
useEffect(()=>{api.get('/quotations/'+id).then(r=>{setF(r.data);if(r.data.lines)setLines(r.data.lines);setLoading(false);});},[id]);
const save=async()=>{
  const payload:any={...f};
  if(lines.length>0){payload.lines=lines;payload.totalAmount=calcTotalFromLines(lines);}
  await api.put('/quotations/'+id,payload);router.push('/sales/quotation');
};
if(loading)return<div className="h-full flex items-center justify-center text-muted-foreground">加载中...</div>;
return(<FormLayout title={'编辑报价单：'+f.quotationNo} onSave={save} sections={[{id:'b',title:'报价单信息'},{id:'l',title:'报价明细'}]} activeSection="b">
<FormSection id="b" title="报价单信息"><FormGrid>
<FormField label="报价单号"><Input className={FI} value={f.quotationNo} disabled/></FormField>
<FormField label="报价名称" required><Input className={FI} value={f.quotationName} onChange={e=>setF({...f,quotationName:e.target.value})}/></FormField>
<FormField label="客户"><EntitySelect entity="customer" value={f.customerId||''} onChange={(id,c)=>{setF({...f,...applyCustomerSelection(c)});}}/></FormField>
<FormField label="客户编码">{f.customerCode&&<Input className={FI} value={f.customerCode} readOnly disabled/>}</FormField>
<FormField label="报价部门"><EntitySelect entity="department" value={f.departmentId||''} onChange={(id,d)=>{setF({...f,...applyDepartmentSelection(d)});}}/></FormField>
<FormField label="负责人"><Input className={FI} value={f.responsibleName||''} onChange={e=>setF({...f,responsibleName:e.target.value})}/></FormField>
<FormField label="截止日期"><Input type="date" className={FI} value={f.validUntil?.split('T')[0]||''} onChange={e=>setF({...f,validUntil:e.target.value})}/></FormField>
<FormField label="金额"><Input className={FI} value={lines.length>0?calcTotalFromLines(lines):(f.totalAmount||'')} placeholder="自动=明细合计" readOnly disabled/></FormField>
</FormGrid></FormSection>
<FormSection id="l" title="报价明细"><LinesEditor lines={lines} onChange={setLines} columns={QT_COLS}/></FormSection>
</FormLayout>);}
