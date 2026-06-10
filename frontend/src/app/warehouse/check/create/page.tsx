'use client';import { useState } from 'react';import { useRouter } from 'next/navigation';import api from '@/lib/api';import { Input } from '@/components/ui/input';import { toast } from '@/components/ui/toast';import { FormLayout,FormSection,FormGrid,FormField } from '@/components/form/form-layout';import { EntityPickerInput } from '@/components/form/entity-picker-input';import { applyMaterialSelection, applyWarehouseSelection } from '@/lib/field-linkage';const FI='h-9 rounded-md border border-border bg-background px-3 text-[13px] w-full';

export default function CheckCreate(){const router=useRouter();
const [f,setF]=useState({orderNo:'',checkMethod:'',materialId:'',materialCode:'',materialName:'',spec:'',unit:'',batchNo:'',stockQty:'0',checkQty:'0',diffQty:'0',warehouseId:'',warehouseCode:'',warehouseName:'',areaName:'',inspector:'',checkDate:new Date().toISOString().split('T')[0],status:'ACTIVE'});

const onMaterialSelect=(id:string,m:any)=>{
  const fill=applyMaterialSelection(m);
  setF(prev=>({...prev,...fill,
    materialId:fill.materialId,materialCode:fill.materialCode,materialName:fill.materialName,
    spec:fill.specification,unit:fill.unit,
  }));
  // Query inventory for this material to pre-fill stockQty
  if(fill.materialCode){
    api.get('/inventory',{params:{materialCode:fill.materialCode,pageSize:99}}).then(r=>{
      const items=r.data.items||[];
      const total=items.reduce((s:number,i:any)=>s+(Number(i.quantity)||0),0);
      setF(prev=>({...prev,stockQty:String(total)}));
    }).catch(()=>{});
  }
};

const save=async()=>{
  try {
    const payload={...f,diffQty:String((Number(f.checkQty)||0)-(Number(f.stockQty)||0))};
    await api.post('/check-orders',payload);router.push('/warehouse/check');
  } catch(e:any){toast(e.response?.data?.message||'保存失败','error');}
};

return(<FormLayout title="新增盘点单" onSave={save} sections={[{id:'b',title:'基本信息'}]} activeSection="b"><FormSection id="b" title="基本信息"><FormGrid>
<FormField label="盘点单号"><Input className={FI} value={f.orderNo} onChange={e=>setF({...f,orderNo:e.target.value})} placeholder="留空自动生成"/></FormField>
<FormField label="盘点方式"><Input className={FI} value={f.checkMethod} onChange={e=>setF({...f,checkMethod:e.target.value})}/></FormField>
<FormField label="物料" required>
  <EntityPickerInput entity="material" value={f.materialCode}
    displayText={f.materialCode ? `${f.materialCode} ${f.materialName}` : ''}
    onChange={(id,m)=>{onMaterialSelect(id,m);}}
    placeholder="选择物料"/></FormField>
<FormField label="物料编码">{f.materialCode&&<Input className={FI} value={f.materialCode} readOnly disabled/>}</FormField>
<FormField label="规格型号"><Input className={FI} value={f.spec} onChange={e=>setF({...f,spec:e.target.value})} readOnly disabled/></FormField>
<FormField label="单位"><Input className={FI} value={f.unit} onChange={e=>setF({...f,unit:e.target.value})} readOnly disabled/></FormField>
<FormField label="批次号"><Input className={FI} value={f.batchNo} onChange={e=>setF({...f,batchNo:e.target.value})}/></FormField>
<FormField label="库存数量"><Input type="number" className={FI} value={f.stockQty} onChange={e=>setF({...f,stockQty:e.target.value})}/></FormField>
<FormField label="盘点数量"><Input type="number" className={FI} value={f.checkQty} onChange={e=>setF({...f,checkQty:e.target.value})}/></FormField>
<FormField label="差异数量"><Input className={FI} value={String((Number(f.checkQty)||0)-(Number(f.stockQty)||0))} readOnly disabled/></FormField>
<FormField label="仓库" required>
  <EntityPickerInput entity="warehouse" value={f.warehouseCode}
    displayText={f.warehouseCode ? `${f.warehouseCode} ${f.warehouseName}` : ''}
    onChange={(id,w)=>{setF({...f,...applyWarehouseSelection(w)});}}
    placeholder="选择仓库"/></FormField>
<FormField label="仓库编码">{f.warehouseCode&&<Input className={FI} value={f.warehouseCode} readOnly disabled/>}</FormField>
<FormField label="盘点人"><Input className={FI} value={f.inspector} onChange={e=>setF({...f,inspector:e.target.value})}/></FormField>
<FormField label="盘点日期"><Input type="date" className={FI} value={f.checkDate} onChange={e=>setF({...f,checkDate:e.target.value})}/></FormField>
</FormGrid></FormSection></FormLayout>);}
