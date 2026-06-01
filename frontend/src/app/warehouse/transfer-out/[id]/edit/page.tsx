'use client';import { useEffect, useState } from 'react';import { useRouter, useParams } from 'next/navigation';import api from '@/lib/api';import { Input } from '@/components/ui/input';import { RadioGroup,RadioGroupItem } from '@/components/ui/radio-group';import { toast } from '@/components/ui/toast';
import { FormLayout,FormSection,FormGrid,FormField } from '@/components/form/form-layout';import { EntitySelect } from '@/components/form/entity-select';import { applyMaterialSelection, applyWarehouseSelection } from '@/lib/field-linkage';
const FI='h-9 rounded-md border border-border bg-background px-3 text-[13px] w-full';

export default function TEdit(){const router=useRouter();const {id}=useParams<{id:string}>();const [l,setL]=useState(true);const [f,setF]=useState<any>({});
useEffect(()=>{api.get('/transfer-orders/'+id).then(r=>{setF(r.data);setL(false);});},[id]);
const save=async()=>{try{await api.put('/transfer-orders/'+id,f);router.push('/warehouse/transfer-out');}catch(e:any){toast(e.response?.data?.message||'保存失败','error');}};
if(l)return<div className="h-full flex items-center justify-center text-muted-foreground">加载中...</div>;
return(<FormLayout title={'编辑调拨单：'+f.orderNo} onSave={save} sections={[{id:'b',title:'调拨信息'}]} activeSection="b"><FormSection id="b" title="调拨信息"><FormGrid>
<FormField label="调拨单号"><Input className={FI} value={f.orderNo} disabled/></FormField>
<FormField label="调拨类型" required><RadioGroup value={f.type} onValueChange={(v:any)=>setF({...f,type:v})} className="flex gap-4 pt-1.5"><div className="flex items-center gap-1.5"><RadioGroupItem value="OUT" id="te-o"/><label htmlFor="te-o" className="text-[13px]">调出</label></div><div className="flex items-center gap-1.5"><RadioGroupItem value="IN" id="te-i"/><label htmlFor="te-i" className="text-[13px]">调入</label></div></RadioGroup></FormField>
<FormField label="物料"><EntitySelect entity="material" value={f.materialId||''} onChange={(id,m)=>{setF({...f,...applyMaterialSelection(m)});}}/></FormField>
<FormField label="物料编码">{f.materialCode&&<Input className={FI} value={f.materialCode} readOnly disabled/>}</FormField>
<FormField label="规格型号">{f.spec&&<Input className={FI} value={f.spec} readOnly disabled/>}</FormField>
<FormField label="单位">{f.unit&&<Input className={FI} value={f.unit} readOnly disabled/>}</FormField>
<FormField label="数量"><Input type="number" className={FI} value={f.quantity||''} onChange={e=>setF({...f,quantity:e.target.value})}/></FormField>
<FormField label="调出仓库"><EntitySelect entity="warehouse" value={f.fromWarehouseId||''} onChange={(id,w)=>{setF({...f,fromWarehouseId:w.id||'',fromWarehouseCode:w.code||'',fromWarehouse:w.name||''});}}/></FormField>
<FormField label="调出仓库编码">{f.fromWarehouseCode&&<Input className={FI} value={f.fromWarehouseCode} readOnly disabled/>}</FormField>
<FormField label="调出仓库名称">{f.fromWarehouse&&<Input className={FI} value={f.fromWarehouse} readOnly disabled/>}</FormField>
<FormField label="调入仓库"><EntitySelect entity="warehouse" value={f.toWarehouseId||''} onChange={(id,w)=>{setF({...f,toWarehouseId:w.id||'',toWarehouseCode:w.code||'',toWarehouse:w.name||''});}}/></FormField>
<FormField label="调入仓库编码">{f.toWarehouseCode&&<Input className={FI} value={f.toWarehouseCode} readOnly disabled/>}</FormField>
<FormField label="调入仓库名称">{f.toWarehouse&&<Input className={FI} value={f.toWarehouse} readOnly disabled/>}</FormField>
</FormGrid></FormSection></FormLayout>);}
