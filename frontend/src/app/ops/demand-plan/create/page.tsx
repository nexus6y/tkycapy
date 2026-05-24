'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import api from '@/lib/api';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { FormLayout, FormSection, FormGrid, FormField } from '@/components/form/form-layout';

const FI = 'h-9 rounded-md border border-border bg-background px-3 text-[13px] w-full';
const SECTIONS = [{id:'basic',title:'基本信息'},{id:'detail',title:'需求明细'}];

export default function DemandPlanCreate() {
  const router = useRouter();
  const [f,setF]=useState({planNo:'',planName:'',demandSource:'',demandUse:'',projectName:'',requiredDate:'',totalQuantity:'',remark:''});
  const save = async () => { try { await api.post('/demand-plans', f); router.push('/ops/demand-plan'); } catch(e:any) { alert(e.response?.data?.message||'保存失败'); } };

  return (<FormLayout title="新增需求计划" onSave={save} sections={SECTIONS} activeSection="basic">
    <FormSection id="basic" title="基本信息"><FormGrid>
      <FormField label="计划单号"><Input className={FI} value={f.planNo} onChange={e=>setF({...f,planNo:e.target.value})}/></FormField>
      <FormField label="计划名称" required><Input className={FI} value={f.planName} onChange={e=>setF({...f,planName:e.target.value})}/></FormField>
      <FormField label="需求来源"><Input className={FI} value={f.demandSource} onChange={e=>setF({...f,demandSource:e.target.value})}/></FormField>
      <FormField label="需求用途"><Input className={FI} value={f.demandUse} onChange={e=>setF({...f,demandUse:e.target.value})}/></FormField>
      <FormField label="项目名称"><Input className={FI} value={f.projectName} onChange={e=>setF({...f,projectName:e.target.value})}/></FormField>
      <FormField label="需求日期"><Input type="date" className={FI} value={f.requiredDate} onChange={e=>setF({...f,requiredDate:e.target.value})}/></FormField>
      <FormField label="数量"><Input type="number" className={FI} value={f.totalQuantity} onChange={e=>setF({...f,totalQuantity:e.target.value})}/></FormField>
      <div className="col-span-2"><FormField label="备注"><Input className={FI} value={f.remark} onChange={e=>setF({...f,remark:e.target.value})}/></FormField></div>
    </FormGrid></FormSection>
    <FormSection id="detail" title="需求明细"><div className="text-center text-muted-foreground py-8 text-[13px]">明细列表将在后续版本中添加</div></FormSection>
  </FormLayout>);
}
