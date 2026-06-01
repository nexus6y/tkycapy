'use client';import { useState, useEffect } from 'react';import { useRouter } from 'next/navigation';import api from '@/lib/api';import { Input } from '@/components/ui/input';import { toast } from '@/components/ui/toast';import { FormLayout,FormSection,FormGrid,FormField } from '@/components/form/form-layout';import { LinesEditor, LineItem } from '@/components/ui/lines-editor';import { EntitySelect } from '@/components/form/entity-select';import { applyDepartmentSelection } from '@/lib/field-linkage';import { recalcHeaderTotals } from '@/lib/calc';const FI='h-9 rounded-md border border-border bg-background px-3 text-[13px] w-full';

export default function IssueCreate(){const router=useRouter();
const [f,setF]=useState({orderNo:'',productionOrderId:'',productionOrderNo:'',materialId:'',materialName:'',spec:'',quantity:'',departmentId:'',departmentCode:'',departmentName:'',issueDate:new Date().toISOString().split('T')[0]});
const [lines,setLines]=useState<LineItem[]>([]);

const onProductionOrderSelect=async(id:string,doc:any)=>{
  if(!id)return;
  setF(prev=>({...prev,productionOrderId:id,productionOrderNo:doc.orderNo||'',
    departmentId:doc.departmentId||prev.departmentId,departmentName:doc.departmentName||prev.departmentName}));
  // Load full PO with materials
  try{
    const {data}=await api.get(`/production-orders/${id}`);
    const materials=data.materials||[];
    if(materials.length>0){
      const newLines= materials.map((m:any,i:number)=>({
        lineNo:m.lineNo??i+1,
        materialCode:m.materialCode||'',materialName:m.materialName||'',
        spec:m.spec||'',unit:m.unit||'',
        quantity:m.quantity!=null?String(m.quantity):'0',
        warehouseCode:m.warehouseCode||'',
      }));
      setLines(newLines);
      const h=recalcHeaderTotals(newLines);
      setF(prev=>({...prev,quantity:h.totalQuantity,materialName:newLines[0]?.materialName||''}));
      toast('已加载生产订单材料清单','success');
    }
  }catch(e:any){toast(e.response?.data?.message||'加载材料失败','error');}
};

const save=async()=>{
  const payload:any={...f};
  if(lines.length>0){payload.lines=lines;const h=recalcHeaderTotals(lines);payload.quantity=h.totalQuantity;}
  await api.post('/issue-orders',payload);router.push('/production/issue');
};

return(<FormLayout title="新增领料单" onSave={save} sections={[{id:'b',title:'领料信息'},{id:'l',title:'材料明细'}]} activeSection="b">
<FormSection id="b" title="领料信息"><FormGrid>
<FormField label="领料单号"><Input className={FI} value={f.orderNo} onChange={e=>setF({...f,orderNo:e.target.value})} placeholder="留空自动生成"/></FormField>
<FormField label="生产订单" required>
  <EntitySelect entity="productionOrder" value={f.productionOrderId} status="APPROVED"
    onChange={(id,doc)=>{onProductionOrderSelect(id,doc);}}/></FormField>
<FormField label="生产订单号">{f.productionOrderNo&&<Input className={FI} value={f.productionOrderNo} readOnly disabled/>}</FormField>
<FormField label="总数量"><Input className={FI} value={f.quantity} readOnly disabled/></FormField>
<FormField label="领料部门">
  <EntitySelect entity="department" value={f.departmentId}
    onChange={(id,d)=>{setF({...f,...applyDepartmentSelection(d)});}}/></FormField>
<FormField label="领料日期"><Input type="date" className={FI} value={f.issueDate} onChange={e=>setF({...f,issueDate:e.target.value})}/></FormField>
</FormGrid></FormSection>
<FormSection id="l" title="材料明细"><LinesEditor lines={lines} onChange={setLines}/></FormSection>
</FormLayout>);}
