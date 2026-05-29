'use client';import { useEffect, useState } from 'react';import { useRouter, useParams } from 'next/navigation';import api from '@/lib/api';import { Input } from '@/components/ui/input';import { Select,SelectContent,SelectItem,SelectTrigger,SelectValue } from '@/components/ui/select';import { Button } from '@/components/ui/button';import { toast } from '@/components/ui/toast';
import { FormLayout,FormSection,FormGrid,FormField } from '@/components/form/form-layout';
import { LinesEditor, LineItem } from '@/components/ui/lines-editor';
const FI='h-9 rounded-md border border-border bg-background px-3 text-[13px] w-full';

const QC_COLS = [
  { key: 'lineNo', label: '行号', width: '60px', type: 'number' as const },
  { key: 'materialCode', label: '物料编码', width: '120px' },
  { key: 'materialName', label: '物料名称', width: '120px' },
  { key: 'spec', label: '规格型号', width: '100px' },
  { key: 'unit', label: '单位', width: '60px' },
  { key: 'inspectQty', label: '检验数量', width: '80px', type: 'number' as const },
  { key: 'qualifiedQty', label: '合格数量', width: '80px', type: 'number' as const },
  { key: 'unqualifiedQty', label: '不合格数', width: '80px', type: 'number' as const },
  { key: 'result', label: '结果', width: '80px' },
];

export default function IEdit(){const router=useRouter();const {id}=useParams<{id:string}>();const [loading,setLoading]=useState(true);const [f,setF]=useState<any>({});
const [lines,setLines]=useState<LineItem[]>([]);
useEffect(()=>{api.get('/inspections/'+id).then(r=>{const d=r.data;setF(d);if(d.lines)setLines(d.lines);setLoading(false);});},[id]);

const saveAndSubmit=async()=>{try{await api.put('/inspections/'+id,{...f,lines});await api.put(`/inspections/${id}/submit`);toast('已保存并提交','success');router.push('/quality/inspection');}catch(e:any){toast(e.response?.data?.message||'提交失败','error');}};
const doApprove=async()=>{try{await api.put('/inspections/'+id,{...f,lines});await api.put(`/inspections/${id}/approve`);toast('审核完成，已生成入库单','success');router.push('/quality/inspection');}catch(e:any){toast(e.response?.data?.message||'审核失败','error');}};

if(loading)return<div className="h-full flex items-center justify-center text-muted-foreground">加载中...</div>;
return(<FormLayout title={'编辑质检单：'+f.inspectionNo} onSave={async()=>{await api.put('/inspections/'+id,{...f,lines});router.push('/quality/inspection');}} sections={[{id:'b',title:'质检信息'},{id:'l',title:'检验明细'}]} activeSection="b">
<FormSection id="b" title="质检信息"><FormGrid>
<FormField label="质检单号"><Input className={FI} value={f.inspectionNo} disabled/></FormField>
<FormField label="来源类型"><Input className={FI} value={f.sourceType||''} disabled/></FormField>
<FormField label="来源单号"><Input className={FI} value={f.sourceNo||''} disabled/></FormField>
<FormField label="物料名称"><Input className={FI} value={f.materialName||''} onChange={e=>setF({...f,materialName:e.target.value})}/></FormField>
<FormField label="检验员"><Input className={FI} value={f.inspector||''} onChange={e=>setF({...f,inspector:e.target.value})}/></FormField>
<FormField label="检验总量"><Input className={FI} value={f.quantity||''} disabled/></FormField>
<FormField label="合格数"><Input type="number" className={FI} value={f.qualifiedQty||''} onChange={e=>setF({...f,qualifiedQty:e.target.value})}/></FormField>
<FormField label="不合格数"><Input type="number" className={FI} value={f.unqualifiedQty||''} onChange={e=>setF({...f,unqualifiedQty:e.target.value})}/></FormField>
<FormField label="检验结果">
<Select value={f.result||''} onValueChange={(v:any)=>setF({...f,result:v})}>
<SelectTrigger className={FI}><SelectValue placeholder="选择结果"/></SelectTrigger>
<SelectContent><SelectItem value="合格">合格</SelectItem><SelectItem value="不合格">不合格</SelectItem><SelectItem value="待定">待定</SelectItem></SelectContent></Select></FormField>
<div className="col-span-2 flex gap-2 mt-1">
{f.approvalStatus==='DRAFT'&&<Button variant="default" size="sm" onClick={saveAndSubmit} className="bg-primary">保存并提交</Button>}
{f.approvalStatus==='SUBMITTED'&&<Button variant="default" size="sm" onClick={doApprove} className="bg-green-600 hover:bg-green-700">审核通过 / 生成入库单</Button>}
</div>
</FormGrid></FormSection>
<FormSection id="l" title="检验明细"><LinesEditor lines={lines} onChange={setLines} columns={QC_COLS}/></FormSection>
</FormLayout>);}
