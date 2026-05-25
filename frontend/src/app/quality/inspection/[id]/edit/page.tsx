'use client';import { useEffect, useState } from 'react';import { useRouter, useParams } from 'next/navigation';import api from '@/lib/api';import { Input } from '@/components/ui/input';import { Select,SelectContent,SelectItem,SelectTrigger,SelectValue } from '@/components/ui/select';import { RadioGroup,RadioGroupItem } from '@/components/ui/radio-group';import { FormLayout,FormSection,FormGrid,FormField } from '@/components/form/form-layout';
const FI='h-9 rounded-md border border-border bg-background px-3 text-[13px] w-full';
export default function IEdit(){const router=useRouter();const {id}=useParams<{id:string}>();const [loading,setLoading]=useState(true);const [f,setF]=useState<any>({});
useEffect(()=>{api.get('/inspections/'+id).then(r=>{setF(r.data);setLoading(false);});},[id]);
const save=async()=>{try{await api.put('/inspections/'+id,f);router.push('/quality/inspection');}catch(e:any){alert(e.response?.data?.message||'保存失败');}};
if(loading)return<div className="h-full flex items-center justify-center text-muted-foreground">加载中...</div>;
return(<FormLayout title={'编辑质检单：'+f.inspectionNo} onSave={save} sections={[{id:'b',title:'质检信息'}]} activeSection="b"><FormSection id="b" title="质检信息"><FormGrid>
<FormField label="质检单号"><Input className={FI} value={f.inspectionNo} disabled/></FormField>
<FormField label="来源类型"><RadioGroup value={f.sourceType||'采购单'} onValueChange={v=>setF({...f,sourceType:v})} className="flex gap-4 pt-1.5"><div className="flex items-center gap-1.5"><RadioGroupItem value="采购单" id="ie-po"/><label htmlFor="ie-po" className="text-[13px]">采购单</label></div><div className="flex items-center gap-1.5"><RadioGroupItem value="生产退料" id="ie-pr"/><label htmlFor="ie-pr" className="text-[13px]">生产退料</label></div></RadioGroup></FormField>
<FormField label="来源单号"><Input className={FI} value={f.sourceNo||''} onChange={e=>setF({...f,sourceNo:e.target.value})}/></FormField>
<FormField label="物料名称"><Input className={FI} value={f.materialName||''} onChange={e=>setF({...f,materialName:e.target.value})}/></FormField>
<FormField label="数量"><Input type="number" className={FI} value={f.quantity||''} onChange={e=>setF({...f,quantity:e.target.value})}/></FormField>
<FormField label="检验员"><Input className={FI} value={f.inspector||''} onChange={e=>setF({...f,inspector:e.target.value})}/></FormField>
<FormField label="检验结果"><Select value={f.result||''} onValueChange={v=>setF({...f,result:v})}><SelectTrigger className={FI}><SelectValue placeholder="选择结果"/></SelectTrigger><SelectContent><SelectItem value="合格">合格</SelectItem><SelectItem value="不合格">不合格</SelectItem><SelectItem value="待定">待定</SelectItem></SelectContent></Select></FormField>
</FormGrid></FormSection></FormLayout>);}
