'use client';import { useEffect, useState } from 'react';import { useRouter, useParams } from 'next/navigation';import api from '@/lib/api';import { Input } from '@/components/ui/input';import { toast } from '@/components/ui/toast';
import { FormLayout,FormSection,FormGrid,FormField } from '@/components/form/form-layout';
import { LinesEditor, LineItem } from '@/components/ui/lines-editor';
const FI='h-9 rounded-md border border-border bg-background px-3 text-[13px] w-full';

const INB_COLS = [
  { key: 'lineNo', label: '行号', width: '60px', type: 'number' as const },
  { key: 'materialCode', label: '物料编码', width: '120px' },
  { key: 'materialName', label: '物料名称', width: '120px' },
  { key: 'spec', label: '规格型号', width: '100px' },
  { key: 'unit', label: '单位', width: '60px' },
  { key: 'quantity', label: '数量', width: '80px', type: 'number' as const },
  { key: 'unitPrice', label: '单价', width: '80px', type: 'number' as const },
  { key: 'amount', label: '金额', width: '100px', type: 'number' as const },
  { key: 'warehouseCode', label: '仓库', width: '100px' },
  { key: 'locationCode', label: '仓位', width: '80px' },
  { key: 'batchNo', label: '批次', width: '100px' },
];

export default function IEdit(){const router=useRouter();const {id}=useParams<{id:string}>();const [l,setL]=useState(true);const [f,setF]=useState<any>({});
const [lines,setLines]=useState<LineItem[]>([]);
useEffect(()=>{api.get('/inbound-orders/'+id).then(r=>{setF(r.data);if(r.data.lines)setLines(r.data.lines);setL(false);});},[id]);
const save=async()=>{try{await api.put('/inbound-orders/'+id,{...f,lines});router.push('/warehouse/inbound');}catch(e:any){toast(e.response?.data?.message||'保存失败','error');}};
if(l)return<div className="h-full flex items-center justify-center text-muted-foreground">加载中...</div>;
return(<FormLayout title={'编辑入库单：'+f.orderNo} onSave={save} sections={[{id:'b',title:'入库信息'},{id:'l',title:'明细信息'}]} activeSection="b">
<FormSection id="b" title="入库信息"><FormGrid>
<FormField label="入库单号"><Input className={FI} value={f.orderNo} disabled/></FormField>
<FormField label="物料名称"><Input className={FI} value={f.materialName||''} onChange={e=>setF({...f,materialName:e.target.value})}/></FormField>
<FormField label="规格型号"><Input className={FI} value={f.specification||''} onChange={e=>setF({...f,specification:e.target.value})}/></FormField>
<FormField label="数量"><Input type="number" className={FI} value={f.quantity||''} onChange={e=>setF({...f,quantity:e.target.value})}/></FormField>
<FormField label="仓库"><Input className={FI} value={f.warehouseName||''} onChange={e=>setF({...f,warehouseName:e.target.value})}/></FormField>
<FormField label="单价"><Input type="number" className={FI} value={f.unitPrice||''} onChange={e=>setF({...f,unitPrice:e.target.value})}/></FormField>
<FormField label="金额"><Input type="number" className={FI} value={f.totalAmount||''} onChange={e=>setF({...f,totalAmount:e.target.value})}/></FormField>
</FormGrid></FormSection>
<FormSection id="l" title="明细信息"><LinesEditor lines={lines} onChange={setLines} columns={INB_COLS}/></FormSection>
</FormLayout>);}
