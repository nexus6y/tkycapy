'use client';
import { useState } from 'react';import { useRouter } from 'next/navigation';import api from '@/lib/api';
import { Input } from '@/components/ui/input';import { Textarea } from '@/components/ui/textarea';import { toast } from '@/components/ui/toast';
import { FormLayout, FormSection, FormGrid, FormField } from '@/components/form/form-layout';
import { LinesEditor, LineItem } from '@/components/ui/lines-editor';
import { EntityPickerInput } from '@/components/form/entity-picker-input';
import { applyMaterialSelection, applyDepartmentSelection } from '@/lib/field-linkage';
import { calcTotalFromLines, recalcHeaderTotals } from '@/lib/calc';
import { Button } from '@/components/ui/button';
const FI='h-9 rounded-md border border-border bg-background px-3 text-[13px] w-full';

const PROD_COLS=[
  {key:'lineNo',label:'行号',width:'60px',type:'number' as const},
  {key:'materialCode',label:'物料编码',width:'120px'},
  {key:'materialName',label:'物料名称',width:'120px'},
  {key:'spec',label:'规格型号',width:'100px'},
  {key:'unit',label:'单位',width:'60px'},
  {key:'plannedQty',label:'计划数量',width:'80px',type:'number' as const},
  {key:'warehouseCode',label:'仓库',width:'100px'},
  {key:'remark',label:'备注',width:'100px'},
];

const MAT_COLS=[
  {key:'lineNo',label:'行号',width:'60px',type:'number' as const},
  {key:'materialCode',label:'物料编码',width:'120px'},
  {key:'materialName',label:'物料名称',width:'120px'},
  {key:'spec',label:'规格型号',width:'100px'},
  {key:'unit',label:'单位',width:'60px'},
  {key:'quantity',label:'用量',width:'80px',type:'number' as const},
  {key:'warehouseCode',label:'仓库',width:'100px'},
  {key:'remark',label:'备注',width:'100px'},
];

export default function ProductionOrderCreate(){const router=useRouter();
const [f,setF]=useState<any>({orderNo:'',orderName:'',bomId:'',bomCode:'',bomName:'',materialId:'',materialCode:'',materialName:'',specification:'',unit:'',departmentId:'',departmentCode:'',departmentName:'',quantity:'1',startDate:'',endDate:'',remark:''});
const [prodLines,setProdLines]=useState<LineItem[]>([]);
const [matLines,setMatLines]=useState<LineItem[]>([]);
const [bomLoading,setBomLoading]=useState(false);

const onBomSelect=async(id:string)=>{
  setBomLoading(true);
  try{
    // Load BOM header + explode with production quantity
    const qty=Number(f.quantity||1);
    const {data}=await api.get(`/boms/${id}/explode`,{params:{qty}});
    setF((prev:any)=>({...prev,bomId:id,bomCode:data.bom.code,bomName:data.bom.name,
      materialId:data.bom.productMaterialId||'',materialCode:data.bom.productMaterialCode||'',
      materialName:data.bom.productMaterialName||'',specification:data.bom.productSpec||'',
      unit:data.bom.productUnit||''}));
    // Populate product lines
    setProdLines([{lineNo:1,materialCode:data.bom.productMaterialCode||'',materialName:data.bom.productMaterialName||'',spec:data.bom.productSpec||'',unit:data.bom.productUnit||'',plannedQty:String(qty),warehouseCode:'',remark:''}]);
    // Populate material lines from BOM items
    if(data.items&&data.items.length>0){
      setMatLines(data.items.map((item:any)=>({
        lineNo:item.lineNo,materialCode:item.materialCode,materialName:item.materialName,
        spec:item.spec,unit:item.unit,quantity:String(item.requiredQty||item.quantity),
        warehouseCode:item.warehouseCode||'',remark:'',
      })));
    }
    toast('已加载BOM明细','success');
  }catch(e:any){toast(e.response?.data?.message||'加载BOM失败','error');}
  finally{setBomLoading(false);}
};

const save=async()=>{
  if(!f.orderName)return toast('请填写订单名称','error');
  try{
    const payload:any={...f};
    if(prodLines.length>0)payload.lines=prodLines;
    if(matLines.length>0)payload.materials=matLines;
    await api.post('/production-orders',payload);router.push('/production/order');
  }catch(e:any){toast(e.response?.data?.message||'保存失败','error');}
};

return(<FormLayout title="新增生产订单" onSave={save} sections={[{id:'b',title:'基本信息'},{id:'s',title:'BOM关联'},{id:'p',title:'产品信息'},{id:'m',title:'材料信息'}]} activeSection="b">
<FormSection id="b" title="基本信息"><FormGrid>
<FormField label="订单编号"><Input className={FI} value={f.orderNo} readOnly disabled/></FormField>
<FormField label="订单名称" required><Input className={FI} value={f.orderName} onChange={e=>setF({...f,orderName:e.target.value})} placeholder="输入订单名称"/></FormField>
<FormField label="生产部门"><EntityPickerInput entity="department" value={f.departmentCode} displayText={f.departmentCode?`${f.departmentCode} ${f.departmentName}`:''} onChange={(id:any,d:any)=>{setF({...f,...applyDepartmentSelection(d)});}}/></FormField>
<FormField label="生产数量"><Input type="number" className={FI} value={f.quantity} onChange={e=>{setF({...f,quantity:e.target.value});}} placeholder="生产数量"/></FormField>
<FormField label="开始日期"><Input type="date" className={FI} value={f.startDate} onChange={e=>setF({...f,startDate:e.target.value})}/></FormField>
<FormField label="结束日期"><Input type="date" className={FI} value={f.endDate} onChange={e=>setF({...f,endDate:e.target.value})}/></FormField>
<div className="col-span-2"><FormField label="备注"><Textarea className={`${FI} h-20`} value={f.remark} onChange={e=>setF({...f,remark:e.target.value})} placeholder="订单备注"/></FormField></div>
</FormGrid></FormSection>

<FormSection id="s" title="BOM关联"><FormGrid>
<FormField label="选择BOM"><EntityPickerInput entity="bom" value={f.bomCode} displayText={f.bomCode?`${f.bomCode} ${f.bomName}`:''} onChange={(id:any)=>{setF({...f,bomId:id});onBomSelect(id);}}/></FormField>
<FormField label="BOM编码"><Input className={FI} value={f.bomCode} readOnly disabled/></FormField>
<FormField label="物料编码"><Input className={FI} value={f.materialCode} readOnly disabled/></FormField>
<FormField label="物料名称"><Input className={FI} value={f.materialName} readOnly disabled/></FormField>
<FormField label="规格型号"><Input className={FI} value={f.specification} readOnly disabled/></FormField>
<FormField label="单位"><Input className={FI} value={f.unit} readOnly disabled/></FormField>
</FormGrid></FormSection>

<FormSection id="p" title="产品信息"><LinesEditor lines={prodLines} onChange={setProdLines} columns={PROD_COLS}/></FormSection>
<FormSection id="m" title="材料信息"><LinesEditor lines={matLines} onChange={setMatLines} columns={MAT_COLS}/></FormSection>
</FormLayout>);}
