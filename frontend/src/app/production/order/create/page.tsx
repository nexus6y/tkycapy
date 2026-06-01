'use client';
import { useState } from 'react';import { useRouter } from 'next/navigation';import api from '@/lib/api';
import { Input } from '@/components/ui/input';import { toast } from '@/components/ui/toast';
import { FormLayout, FormSection, FormGrid, FormField } from '@/components/form/form-layout';
import { LinesEditor, LineItem } from '@/components/ui/lines-editor';
import { EntitySelect } from '@/components/form/entity-select';
import { applyMaterialSelection, applyDepartmentSelection } from '@/lib/field-linkage';

const FI='h-9 rounded-md border border-border bg-background px-3 text-[13px] w-full';
const SECS=[{id:'basic',title:'生产订单信息'},{id:'products',title:'产品信息'},{id:'materials',title:'材料信息'}];

const PROD_COLS = [
  { key: 'lineNo', label: '行号', width: '60px', type: 'number' as const },
  { key: 'materialCode', label: '物料编码', width: '120px' },
  { key: 'materialName', label: '产品名称', width: '120px' },
  { key: 'spec', label: '规格型号', width: '100px' },
  { key: 'unit', label: '单位', width: '60px' },
  { key: 'plannedQty', label: '计划数量', width: '80px', type: 'number' as const },
  { key: 'warehouseCode', label: '仓库', width: '100px' },
  { key: 'remark', label: '备注', width: '100px' },
];

const MAT_COLS = [
  { key: 'lineNo', label: '行号', width: '60px', type: 'number' as const },
  { key: 'materialCode', label: '物料编码', width: '120px' },
  { key: 'materialName', label: '材料名称', width: '120px' },
  { key: 'spec', label: '规格型号', width: '100px' },
  { key: 'unit', label: '单位', width: '60px' },
  { key: 'quantity', label: '数量', width: '80px', type: 'number' as const },
  { key: 'warehouseCode', label: '仓库', width: '100px' },
  { key: 'remark', label: '备注', width: '100px' },
];

export default function ProductionOrderCreatePage() {
  const router=useRouter();
  const [f,setF]=useState({orderNo:'',orderName:'',materialId:'',materialCode:'',materialName:'',specification:'',unit:'',departmentId:'',departmentCode:'',departmentName:'',quantity:'1',startDate:'',endDate:'',remark:''});
  const [lines,setLines]=useState<LineItem[]>([]);
  const [materials,setMaterials]=useState<LineItem[]>([]);

  const save=async()=>{
    try{
      const payload:any={...f};
      if(lines.length>0)payload.lines=lines;
      if(materials.length>0)payload.materials=materials;
      await api.post('/production-orders',payload);
      router.push('/production/order');
    }catch(e:any){toast(e.response?.data?.message||'保存失败','error');}
  };

  return (<FormLayout title="新增生产订单" onSave={save} sections={SECS} activeSection="basic">
    <FormSection id="basic" title="生产订单信息"><FormGrid>
      <FormField label="生产编号"><Input className={FI} value={f.orderNo} onChange={e=>setF({...f,orderNo:e.target.value})} placeholder="留空自动生成"/></FormField>
      <FormField label="生产名称" required><Input className={FI} value={f.orderName} onChange={e=>setF({...f,orderName:e.target.value})}/></FormField>
      <FormField label="物料"><EntitySelect entity="material" value={f.materialId} onChange={(id,m)=>{setF({...f,...applyMaterialSelection(m)});}}/></FormField>
      <FormField label="规格型号"><Input className={FI} value={f.specification} readOnly disabled/></FormField>
      <FormField label="单位"><Input className={FI} value={f.unit} readOnly disabled/></FormField>
      <FormField label="生产部门"><EntitySelect entity="department" value={f.departmentId} onChange={(id,d)=>{setF({...f,...applyDepartmentSelection(d)});}}/></FormField>
      <FormField label="数量"><Input type="number" className={FI} value={f.quantity} onChange={e=>setF({...f,quantity:e.target.value})}/></FormField>
      <FormField label="开始日期"><Input type="date" className={FI} value={f.startDate} onChange={e=>setF({...f,startDate:e.target.value})}/></FormField>
      <FormField label="结束日期"><Input type="date" className={FI} value={f.endDate} onChange={e=>setF({...f,endDate:e.target.value})}/></FormField>
      <div className="col-span-2"><FormField label="备注"><Input className={FI} value={f.remark} onChange={e=>setF({...f,remark:e.target.value})}/></FormField></div>
    </FormGrid></FormSection>
    <FormSection id="products" title="产品信息"><LinesEditor lines={lines} onChange={setLines} columns={PROD_COLS}/></FormSection>
    <FormSection id="materials" title="材料信息"><LinesEditor lines={materials} onChange={setMaterials} columns={MAT_COLS}/></FormSection>
  </FormLayout>);
}
