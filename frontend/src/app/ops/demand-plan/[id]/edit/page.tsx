'use client';import { useEffect, useState } from 'react';import { useRouter, useParams } from 'next/navigation';import api from '@/lib/api';import { Input } from '@/components/ui/input';import { toast } from '@/components/ui/toast';
import { FormLayout,FormSection,FormGrid,FormField } from '@/components/form/form-layout';
import { LinesEditor, LineItem } from '@/components/ui/lines-editor';
import { EntitySelect } from '@/components/form/entity-select';
import { applyProjectSelection, applyDepartmentSelection } from '@/lib/field-linkage';
import { calcTotalQtyFromLines } from '@/lib/calc';
const FI='h-9 rounded-md border border-border bg-background px-3 text-[13px] w-full';

const DP_COLS = [
  { key: 'lineNo', label: '行号', width: '60px', type: 'number' as const },
  { key: 'materialCode', label: '物料编码', width: '120px' },
  { key: 'materialName', label: '物料名称', width: '120px' },
  { key: 'spec', label: '规格型号', width: '100px' },
  { key: 'unit', label: '单位', width: '60px' },
  { key: 'quantity', label: '需求数量', width: '80px', type: 'number' as const },
  { key: 'requiredDate', label: '需求日期', width: '110px', type: 'date' as const },
  { key: 'warehouseCode', label: '仓库', width: '100px' },
];

export default function DPEdit(){const router=useRouter();const {id}=useParams<{id:string}>();const [l,setL]=useState(true);const [f,setF]=useState<any>({});
const [lines,setLines]=useState<LineItem[]>([]);
useEffect(()=>{api.get('/demand-plans/'+id).then(r=>{setF(r.data);if(r.data.lines)setLines(r.data.lines);setL(false);});},[id]);
const save=async()=>{
  try{
    const payload:any={...f};
    if(lines.length>0){payload.lines=lines;payload.totalQuantity=calcTotalQtyFromLines(lines);}
    await api.put('/demand-plans/'+id,payload);router.push('/ops/demand-plan');
  }catch(e:any){toast(e.response?.data?.message||'保存失败','error');}
};
if(l)return<div className="h-full flex items-center justify-center text-muted-foreground">加载中...</div>;
return(<FormLayout title={'编辑需求计划：'+f.planNo} onSave={save} sections={[{id:'b',title:'基本信息'},{id:'l',title:'需求明细'}]} activeSection="b">
<FormSection id="b" title="基本信息"><FormGrid>
<FormField label="计划单号"><Input className={FI} value={f.planNo} disabled/></FormField>
<FormField label="计划名称" required><Input className={FI} value={f.planName} onChange={e=>setF({...f,planName:e.target.value})}/></FormField>
<FormField label="关联项目"><EntitySelect entity="project" value={f.projectId||''} onChange={(id,p)=>{setF({...f,...applyProjectSelection(p)});}}/></FormField>
<FormField label="项目编码">{f.projectCode&&<Input className={FI} value={f.projectCode} readOnly disabled/>}</FormField>
<FormField label="项目名称">{f.projectName&&<Input className={FI} value={f.projectName} readOnly disabled/>}</FormField>
<FormField label="需求来源"><Input className={FI} value={f.demandSource||''} onChange={e=>setF({...f,demandSource:e.target.value})}/></FormField>
<FormField label="需求用途"><Input className={FI} value={f.demandUse||''} onChange={e=>setF({...f,demandUse:e.target.value})}/></FormField>
<FormField label="需求部门"><EntitySelect entity="department" value={f.departmentId||''} onChange={(id,d)=>{setF({...f,...applyDepartmentSelection(d)});}}/></FormField>
<FormField label="部门编码">{f.departmentCode&&<Input className={FI} value={f.departmentCode} readOnly disabled/>}</FormField>
<FormField label="部门名称">{f.departmentName&&<Input className={FI} value={f.departmentName} readOnly disabled/>}</FormField>
<FormField label="需求日期"><Input type="date" className={FI} value={f.requiredDate?.split('T')[0]||''} onChange={e=>setF({...f,requiredDate:e.target.value})}/></FormField>
<FormField label="数量"><Input className={FI} value={lines.length>0?calcTotalQtyFromLines(lines):(f.totalQuantity||'')} readOnly disabled/></FormField>
</FormGrid></FormSection>
<FormSection id="l" title="需求明细"><LinesEditor lines={lines} onChange={setLines} columns={DP_COLS}/>
  {lines.length>0&&<p className="text-[12px] text-muted-foreground mt-1">总需求数量: {lines.reduce((s,l)=>s+Number(l.quantity||0),0).toLocaleString()}</p>}
</FormSection>
</FormLayout>);}
