'use client';import { useEffect, useState } from 'react';import { useRouter, useParams } from 'next/navigation';import api from '@/lib/api';import { Input } from '@/components/ui/input';import { Select,SelectContent,SelectItem,SelectTrigger,SelectValue } from '@/components/ui/select';import { Textarea } from '@/components/ui/textarea';import { FormLayout,FormSection,FormGrid,FormField } from '@/components/form/form-layout';import { LinesEditor, LineItem } from '@/components/ui/lines-editor';import { toast } from '@/components/ui/toast';
const FI='h-9 rounded-md border border-border bg-background px-3 text-[13px] w-full';

const OUT_COLS = [
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

export default function OEdit(){const router=useRouter();const {id}=useParams<{id:string}>();const [materials,setMaterials]=useState<any[]>([]);const [zones,setZones]=useState<any[]>([]);const [l,setL]=useState(true);const [f,setF]=useState<any>({});
const [lines,setLines]=useState<LineItem[]>([]);
useEffect(()=>{
api.get('/materials',{params:{pageSize:999}}).then(r=>setMaterials(r.data.items));
api.get('/zones',{params:{pageSize:999}}).then(r=>setZones(r.data.items));
api.get('/outbound-orders/'+id).then(r=>{setF({...r.data,materialId:r.data.materialId||'',zoneId:r.data.zoneId||''});if(r.data.lines)setLines(r.data.lines);setL(false);});
},[id]);
const label=(arr:any[],v:any,field='name')=>arr.find(x=>x.id===v)?.[field]||v;
const save=async()=>{const p:any={...f};['materialId','zoneId'].forEach(k=>delete p[k]);if(lines.length>0)p.lines=lines;await api.put('/outbound-orders/'+id,p);router.push('/warehouse/outbound');};
if(l)return<div className="h-full flex items-center justify-center text-muted-foreground">加载中...</div>;
return(<FormLayout title={'编辑出库单：'+f.orderNo} onSave={save} sections={[{id:'b',title:'出库信息'},{id:'l',title:'明细信息'}]} activeSection="b">
<FormSection id="b" title="出库信息"><FormGrid>
<FormField label="出库单号"><Input className={FI} value={f.orderNo} disabled/></FormField>
<FormField label="来源类型"><Input className={FI} value={f.sourceType||''} disabled/></FormField>
<FormField label="来源单号"><Input className={FI} value={f.sourceNo||''} disabled/></FormField>
<FormField label="物料名称">
<Select value={f.materialId||''} onValueChange={(v:any)=>{const m=materials.find(x=>x.id===v);setF({...f,materialId:v,materialName:m?.name||'',specification:m?.specification||''});}}>
<SelectTrigger className={FI}><SelectValue>{f.materialName||'选择物料'}</SelectValue></SelectTrigger>
<SelectContent>{materials.map(m=><SelectItem key={m.id} value={m.id}>{m.name}</SelectItem>)}</SelectContent></Select></FormField>
<FormField label="规格型号"><Input className={FI} value={f.specification||''} readOnly disabled/></FormField>
<FormField label="数量"><Input type="number" className={FI} value={f.quantity||''} onChange={e=>setF({...f,quantity:e.target.value})}/></FormField>
<FormField label="仓库">
<Select value={f.zoneId||''} onValueChange={(v:any)=>{const z=zones.find(x=>x.id===v);setF({...f,zoneId:v,warehouseName:z?.name||''});}}>
<SelectTrigger className={FI}><SelectValue>{f.warehouseName||'选择仓库'}</SelectValue></SelectTrigger>
<SelectContent>{zones.map(z=><SelectItem key={z.id} value={z.id}>{z.name}</SelectItem>)}</SelectContent></Select></FormField>
<FormField label="单价"><Input type="number" className={FI} value={f.unitPrice||''} onChange={e=>setF({...f,unitPrice:e.target.value})}/></FormField>
<FormField label="金额"><Input type="number" className={FI} value={f.totalAmount||''} onChange={e=>setF({...f,totalAmount:e.target.value})}/></FormField>
<div className="col-span-2"><FormField label="备注"><Textarea className={`${FI} h-20`} value={f.remark||''} onChange={e=>setF({...f,remark:e.target.value})}/></FormField></div>
</FormGrid></FormSection>
<FormSection id="l" title="明细信息"><LinesEditor lines={lines} onChange={setLines} columns={OUT_COLS}/></FormSection>
</FormLayout>);}
