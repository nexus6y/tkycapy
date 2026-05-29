'use client';import { useEffect, useState } from 'react';import { useRouter, useParams } from 'next/navigation';import api from '@/lib/api';import { Input } from '@/components/ui/input';import { toast } from '@/components/ui/toast';
import { FormLayout,FormSection,FormGrid,FormField } from '@/components/form/form-layout';
import { LinesEditor, LineItem } from '@/components/ui/lines-editor';
const FI='h-9 rounded-md border border-border bg-background px-3 text-[13px] w-full';

const PROD_COLS = [
  { key: 'lineNo', label: '行号', width: '60px', type: 'number' as const },
  { key: 'materialCode', label: '物料编码', width: '120px' },
  { key: 'materialName', label: '产品名称', width: '120px' },
  { key: 'spec', label: '规格型号', width: '100px' },
  { key: 'unit', label: '单位', width: '60px' },
  { key: 'plannedQty', label: '计划数量', width: '80px', type: 'number' as const },
  { key: 'actualQty', label: '实际数量', width: '80px', type: 'number' as const },
  { key: 'warehouseCode', label: '仓库', width: '100px' },
];

const MAT_COLS = [
  { key: 'lineNo', label: '行号', width: '60px', type: 'number' as const },
  { key: 'materialCode', label: '物料编码', width: '120px' },
  { key: 'materialName', label: '材料名称', width: '120px' },
  { key: 'spec', label: '规格型号', width: '100px' },
  { key: 'unit', label: '单位', width: '60px' },
  { key: 'quantity', label: '数量', width: '80px', type: 'number' as const },
  { key: 'issuedQty', label: '已领量', width: '80px', type: 'number' as const },
  { key: 'warehouseCode', label: '仓库', width: '100px' },
];

export default function POEdit(){const router=useRouter();const {id}=useParams<{id:string}>();const [l,setL]=useState(true);const [f,setF]=useState<any>({});
const [lines,setLines]=useState<LineItem[]>([]);
const [materials,setMaterials]=useState<LineItem[]>([]);
useEffect(()=>{api.get('/production-orders/'+id).then(r=>{setF(r.data);if(r.data.lines)setLines(r.data.lines);if(r.data.materials)setMaterials(r.data.materials);setL(false);});},[id]);
const save=async()=>{try{await api.put('/production-orders/'+id,{...f,lines,materials});router.push('/production/order');}catch(e:any){toast(e.response?.data?.message||'保存失败','error');}};
if(l)return<div className="h-full flex items-center justify-center text-muted-foreground">加载中...</div>;
return(<FormLayout title={'编辑生产订单：'+f.orderNo} onSave={save} sections={[{id:'b',title:'订单信息'},{id:'p',title:'产品信息'},{id:'m',title:'材料信息'}]} activeSection="b">
<FormSection id="b" title="订单信息"><FormGrid>
<FormField label="生产编号"><Input className={FI} value={f.orderNo} disabled/></FormField>
<FormField label="生产名称" required><Input className={FI} value={f.orderName} onChange={e=>setF({...f,orderName:e.target.value})}/></FormField>
<FormField label="物料"><Input className={FI} value={f.materialName||''} onChange={e=>setF({...f,materialName:e.target.value})}/></FormField>
<FormField label="生产部门"><Input className={FI} value={f.departmentName||''} onChange={e=>setF({...f,departmentName:e.target.value})}/></FormField>
<FormField label="数量"><Input type="number" className={FI} value={f.quantity||''} onChange={e=>setF({...f,quantity:e.target.value})}/></FormField>
<FormField label="开始日期"><Input type="date" className={FI} value={f.startDate?.split('T')[0]||''} onChange={e=>setF({...f,startDate:e.target.value})}/></FormField>
<FormField label="结束日期"><Input type="date" className={FI} value={f.endDate?.split('T')[0]||''} onChange={e=>setF({...f,endDate:e.target.value})}/></FormField>
</FormGrid></FormSection>
<FormSection id="p" title="产品信息"><LinesEditor lines={lines} onChange={setLines} columns={PROD_COLS}/></FormSection>
<FormSection id="m" title="材料信息"><LinesEditor lines={materials} onChange={setMaterials} columns={MAT_COLS}/></FormSection>
</FormLayout>);}
