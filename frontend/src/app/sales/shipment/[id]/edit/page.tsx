'use client';import { useEffect, useState } from 'react';import { useRouter, useParams } from 'next/navigation';import api from '@/lib/api';import { Input } from '@/components/ui/input';import { toast } from '@/components/ui/toast';
import { FormLayout,FormSection,FormGrid,FormField } from '@/components/form/form-layout';
import { LinesEditor, LineItem } from '@/components/ui/lines-editor';
const FI='h-9 rounded-md border border-border bg-background px-3 text-[13px] w-full';

const SHIP_COLS = [
  { key: 'lineNo', label: '行号', width: '60px', type: 'number' as const },
  { key: 'materialCode', label: '物料编码', width: '120px' },
  { key: 'materialName', label: '物料名称', width: '120px' },
  { key: 'spec', label: '规格型号', width: '100px' },
  { key: 'unit', label: '单位', width: '60px' },
  { key: 'orderQty', label: '订单数量', width: '80px', type: 'number' as const },
  { key: 'shippedQty', label: '本次发货', width: '80px', type: 'number' as const },
  { key: 'warehouseCode', label: '仓库', width: '100px' },
];

export default function ShEdit(){const router=useRouter();const {id}=useParams<{id:string}>();const [loading,setLoading]=useState(true);const [f,setF]=useState<any>({});
const [lines,setLines]=useState<LineItem[]>([]);
useEffect(()=>{api.get('/sales-shipments/'+id).then(r=>{setF(r.data);if(r.data.lines)setLines(r.data.lines);setLoading(false);});},[id]);
const save=async()=>{
  const totalQty = lines.filter((l: any) => l.shippedQty).reduce((s: number, l: any) => s + Number(l.shippedQty || 0), 0);
  const p:any={...f}; if(lines.length>0)p.lines=lines; if(totalQty>0)p.totalQuantity=String(totalQty);
  await api.put('/sales-shipments/'+id,p);router.push('/sales/shipment');
};
if(loading)return<div className="h-full flex items-center justify-center text-muted-foreground">加载中...</div>;
return(<FormLayout title={'编辑出货单：'+f.shipmentNo} onSave={save} sections={[{id:'b',title:'出货信息'},{id:'l',title:'出货明细'}]} activeSection="b">
<FormSection id="b" title="出货信息"><FormGrid>
<FormField label="出货单号"><Input className={FI} value={f.shipmentNo} disabled/></FormField>
<FormField label="关联订单"><Input className={FI} value={f.orderNo||''} disabled/></FormField>
<FormField label="客户"><Input className={FI} value={f.customerName||''} onChange={e=>setF({...f,customerName:e.target.value})}/></FormField>
<FormField label="数量"><Input type="number" className={FI} value={f.totalQuantity||''} onChange={e=>setF({...f,totalQuantity:e.target.value})}/></FormField>
<FormField label="金额"><Input type="number" className={FI} value={f.totalAmount||''} onChange={e=>setF({...f,totalAmount:e.target.value})}/></FormField>
</FormGrid></FormSection>
<FormSection id="l" title="出货明细"><LinesEditor lines={lines} onChange={setLines} columns={SHIP_COLS}/></FormSection>
</FormLayout>);}
