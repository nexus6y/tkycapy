'use client';import { useState } from 'react';import { useRouter } from 'next/navigation';import api from '@/lib/api';import { Input } from '@/components/ui/input';import { RadioGroup,RadioGroupItem } from '@/components/ui/radio-group';import { toast } from '@/components/ui/toast';
import { FormLayout,FormSection,FormGrid,FormField } from '@/components/form/form-layout';
import { EntitySelect } from '@/components/form/entity-select';
import { applyMaterialSelection, applyWarehouseSelection } from '@/lib/field-linkage';
const FI='h-9 rounded-md border border-border bg-background px-3 text-[13px] w-full';

export default function TCreate(){const router=useRouter();
const [f,setF]=useState({orderNo:'',type:'OUT',materialId:'',materialCode:'',materialName:'',spec:'',unit:'',quantity:'',fromWarehouseId:'',fromWarehouseCode:'',fromWarehouse:'',toWarehouseId:'',toWarehouseCode:'',toWarehouse:''});
const save=async()=>{try{await api.post('/transfer-orders',f);router.push('/warehouse/transfer-out');}catch(e:any){toast(e.response?.data?.message||'保存失败','error');}};
return(<FormLayout title="新增调拨单" onSave={save} sections={[{id:'b',title:'调拨信息'}]} activeSection="b"><FormSection id="b" title="调拨信息"><FormGrid>
<FormField label="调拨单号"><Input className={FI} value={f.orderNo} onChange={e=>setF({...f,orderNo:e.target.value})} placeholder="留空自动生成"/></FormField>
<FormField label="调拨类型" required><RadioGroup value={f.type} onValueChange={(v:any)=>setF({...f,type:v})} className="flex gap-4 pt-1.5"><div className="flex items-center gap-1.5"><RadioGroupItem value="OUT" id="to-out"/><label htmlFor="to-out" className="text-[13px]">调出</label></div><div className="flex items-center gap-1.5"><RadioGroupItem value="IN" id="to-in"/><label htmlFor="to-in" className="text-[13px]">调入</label></div></RadioGroup></FormField>
<FormField label="物料"><EntitySelect entity="material" value={f.materialId} onChange={(id,m)=>{setF({...f,...applyMaterialSelection(m)});}}/></FormField>
<FormField label="数量"><Input type="number" className={FI} value={f.quantity} onChange={e=>setF({...f,quantity:e.target.value})}/></FormField>
<FormField label="调出仓库"><EntitySelect entity="warehouse" value={f.fromWarehouseId} onChange={(id,w)=>{setF({...f,fromWarehouseId:id,fromWarehouseCode:w.code||'',fromWarehouse:w.name||''});}}/></FormField>
<FormField label="调入仓库"><EntitySelect entity="warehouse" value={f.toWarehouseId} onChange={(id,w)=>{setF({...f,toWarehouseId:id,toWarehouseCode:w.code||'',toWarehouse:w.name||''});}}/></FormField>
</FormGrid></FormSection></FormLayout>);}
