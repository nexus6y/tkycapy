'use client';import { useEffect, useState } from 'react';import { useRouter, useParams } from 'next/navigation';import api from '@/lib/api';import { Input } from '@/components/ui/input';import { Textarea } from '@/components/ui/textarea';import { FormLayout,FormSection,FormGrid,FormField } from '@/components/form/form-layout';import { LinesEditor, LineItem } from '@/components/ui/lines-editor';import { EntitySelect } from '@/components/form/entity-select';import { applyMaterialSelection, applyWarehouseSelection } from '@/lib/field-linkage';import { calcTotalFromLines, recalcHeaderTotals } from '@/lib/calc';import { toast } from '@/components/ui/toast';
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

export default function OEdit(){const router=useRouter();const {id}=useParams<{id:string}>();const [l,setL]=useState(true);const [f,setF]=useState<any>({});
const [lines,setLines]=useState<LineItem[]>([]);
useEffect(()=>{api.get('/outbound-orders/'+id).then(r=>{setF(r.data);if(r.data.lines)setLines(r.data.lines);setL(false);});},[id]);

const onLinesChange=(newLines:LineItem[])=>{
  setLines(newLines);
  if(newLines.length>0){const h=recalcHeaderTotals(newLines);setF((prev:any)=>({...prev,totalAmount:h.totalAmount,quantity:h.totalQuantity}));}
};

const save=async()=>{
  try{
    const payload:any={...f};
    if(lines.length>0){payload.lines=lines;payload.totalAmount=calcTotalFromLines(lines);}
    await api.put('/outbound-orders/'+id,payload);router.push('/warehouse/outbound');
  }catch(e:any){toast(e.response?.data?.message||'保存失败','error');}
};
if(l)return<div className="h-full flex items-center justify-center text-muted-foreground">加载中...</div>;
return(<FormLayout title={'编辑出库单：'+f.orderNo} onSave={save} sections={[{id:'b',title:'出库信息'},{id:'l',title:'明细信息'}]} activeSection="b">
<FormSection id="b" title="出库信息"><FormGrid>
<FormField label="出库单号"><Input className={FI} value={f.orderNo} disabled/></FormField>
<FormField label="来源类型"><Input className={FI} value={f.sourceType||''} disabled/></FormField>
<FormField label="来源单号"><Input className={FI} value={f.sourceNo||''} disabled/></FormField>
<FormField label="物料"><EntitySelect entity="material" value={f.materialId||''} status="ACTIVE" onChange={(id,m)=>{setF({...f,...applyMaterialSelection(m)});}}/></FormField>
<FormField label="规格型号"><Input className={FI} value={f.specification||''} readOnly disabled/></FormField>
<FormField label="数量"><Input className={FI} value={lines.length>0?recalcHeaderTotals(lines).totalQuantity:(f.quantity||'')} readOnly disabled/></FormField>
<FormField label="仓库"><EntitySelect entity="warehouse" value={f.warehouseId||''} onChange={(id,w)=>{setF({...f,...applyWarehouseSelection(w)});}}/></FormField>
<FormField label="单价"><Input type="number" className={FI} value={f.unitPrice||''} onChange={e=>setF({...f,unitPrice:e.target.value})}/></FormField>
<FormField label="金额"><Input className={FI} value={lines.length>0?calcTotalFromLines(lines):(f.totalAmount||'')} placeholder="自动=明细合计" readOnly disabled/></FormField>
<div className="col-span-2"><FormField label="备注"><Textarea className={`${FI} h-20`} value={f.remark||''} onChange={e=>setF({...f,remark:e.target.value})}/></FormField></div>
</FormGrid></FormSection>
<FormSection id="l" title="明细信息"><LinesEditor lines={lines} onChange={onLinesChange} columns={OUT_COLS}/></FormSection>
</FormLayout>);}
