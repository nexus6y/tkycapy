'use client';import { useState, useEffect } from 'react';import { useRouter, useParams } from 'next/navigation';import api from '@/lib/api';import { Input } from '@/components/ui/input';import { toast } from '@/components/ui/toast';
import { FormLayout,FormSection,FormGrid,FormField } from '@/components/form/form-layout';import { EntitySelect } from '@/components/form/entity-select';import { applyMaterialSelection, applyWarehouseSelection } from '@/lib/field-linkage';const FI='h-9 rounded-md border border-border bg-background px-3 text-[13px] w-full';

export default function CheckEdit(){const router=useRouter();const {id}=useParams();const [f,setF]=useState({orderNo:'',checkMethod:'',materialId:'',materialCode:'',materialName:'',spec:'',unit:'',batchNo:'',stockQty:'0',checkQty:'0',diffQty:'0',warehouseId:'',warehouseCode:'',warehouseName:'',areaName:'',inspector:'',checkDate:'',status:'ACTIVE'});
useEffect(()=>{api.get('/check-orders/'+id).then(r=>{const d=r.data;setF({...d,checkDate:d.checkDate?d.checkDate.split('T')[0]:'',materialId:d.materialId||'',warehouseId:d.warehouseId||''});});},[id]);
const save=async()=>{try{await api.put('/check-orders/'+id,f);router.push('/warehouse/check');}catch(e:any){toast(e.response?.data?.message||'保存失败','error');}};
return(<FormLayout title="修改盘点单" onSave={save} sections={[{id:'b',title:'基本信息'}]} activeSection="b"><FormSection id="b" title="基本信息"><FormGrid>
<FormField label="盘点单号"><Input className={FI} value={f.orderNo} readOnly disabled/></FormField>
<FormField label="盘点方式"><Input className={FI} value={f.checkMethod} onChange={e=>setF({...f,checkMethod:e.target.value})}/></FormField>
<FormField label="物料"><EntitySelect entity="material" value={f.materialId||''} onChange={(id,m)=>{setF({...f,...applyMaterialSelection(m)});}}/></FormField>
<FormField label="物料编码">{f.materialCode&&<Input className={FI} value={f.materialCode} readOnly disabled/>}</FormField>
<FormField label="规格型号"><Input className={FI} value={f.spec} onChange={e=>setF({...f,spec:e.target.value})}/></FormField>
<FormField label="单位"><Input className={FI} value={f.unit||''} readOnly disabled/></FormField>
<FormField label="批次号"><Input className={FI} value={f.batchNo} onChange={e=>setF({...f,batchNo:e.target.value})}/></FormField>
<FormField label="库存数量"><Input type="number" className={FI} value={f.stockQty} onChange={e=>setF({...f,stockQty:e.target.value})}/></FormField>
<FormField label="盘点数量"><Input type="number" className={FI} value={f.checkQty} onChange={e=>setF({...f,checkQty:e.target.value})}/></FormField>
<FormField label="差异数量"><Input className={FI} value={String((Number(f.checkQty)||0)-(Number(f.stockQty)||0))} readOnly disabled/></FormField>
<FormField label="仓库"><EntitySelect entity="warehouse" value={f.warehouseId||''} onChange={(id,w)=>{setF({...f,...applyWarehouseSelection(w)});}}/></FormField>
<FormField label="仓库编码">{f.warehouseCode&&<Input className={FI} value={f.warehouseCode} readOnly disabled/>}</FormField>
<FormField label="盘点人"><Input className={FI} value={f.inspector} onChange={e=>setF({...f,inspector:e.target.value})}/></FormField>
<FormField label="盘点日期"><Input type="date" className={FI} value={f.checkDate} onChange={e=>setF({...f,checkDate:e.target.value})}/></FormField>
</FormGrid></FormSection></FormLayout>);}
