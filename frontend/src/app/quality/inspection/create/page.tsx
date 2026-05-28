'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import api from '@/lib/api';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { toast } from '@/components/ui/toast';
import { FormLayout, FormSection, FormGrid, FormField } from '@/components/form/form-layout';

const FI='h-9 rounded-md border border-border bg-background px-3 text-[13px] w-full';
const SECS=[{id:'basic',title:'质检单信息'}];

export default function InspectionCreatePage() {
  const router=useRouter();
  useEffect(()=>{api.get('/common/next-code',{params:{entity:'inspection'}}).then(r=>setF((prev:any)=>({...prev,inspectionNo:r.data.code})));},[]);const [f,setF]=useState({inspectionNo:'',sourceType:'采购单',sourceNo:'',materialName:'',quantity:'',inspector:'',result:''});
  const save=async()=>{try{await api.post('/inspections',{...f,quantity:+f.quantity});router.push('/quality/inspection');}catch(e:any){toast(e.response?.data?.message||'保存失败','error');}};
  return (<FormLayout title="新增质检单" onSave={save} sections={SECS} activeSection="basic">
    <FormSection id="basic" title="质检单信息"><FormGrid>
      <FormField label="质检单号" required><Input className={FI} value={f.inspectionNo} readOnly disabled/></FormField>
      <FormField label="来源类型" required>
        <RadioGroup value={f.sourceType} onValueChange={(v:any)=>setF({...f,sourceType:v})} className="flex gap-4 pt-1.5">
          <div className="flex items-center gap-1.5"><RadioGroupItem value="采购单" id="st-po"/><label htmlFor="st-po" className="text-[13px]">采购单</label></div>
          <div className="flex items-center gap-1.5"><RadioGroupItem value="生产退料" id="st-pr"/><label htmlFor="st-pr" className="text-[13px]">生产退料</label></div>
        </RadioGroup>
      </FormField>
      <FormField label="来源单号"><Input className={FI} value={f.sourceNo} onChange={e=>setF({...f,sourceNo:e.target.value})}/></FormField>
      <FormField label="物料名称" required><Input className={FI} value={f.materialName} onChange={e=>setF({...f,materialName:e.target.value})}/></FormField>
      <FormField label="数量"><Input type="number" className={FI} value={f.quantity} onChange={e=>setF({...f,quantity:e.target.value})}/></FormField>
      <FormField label="检验员"><Input className={FI} value={f.inspector} onChange={e=>setF({...f,inspector:e.target.value})}/></FormField>
      <FormField label="检验结果"><Select value={f.result} onValueChange={(v:any)=>setF({...f,result:v})}><SelectTrigger className={FI}><SelectValue placeholder="选择结果"/></SelectTrigger><SelectContent><SelectItem value="合格">合格</SelectItem><SelectItem value="不合格">不合格</SelectItem><SelectItem value="待定">待定</SelectItem></SelectContent></Select></FormField>
    </FormGrid></FormSection>
  </FormLayout>);
}
