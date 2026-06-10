'use client';import { useState, useEffect } from 'react';import { useRouter } from 'next/navigation';import api from '@/lib/api';import { Input } from '@/components/ui/input';import { FormLayout,FormSection,FormGrid,FormField } from '@/components/form/form-layout';import { LinesEditor, LineItem } from '@/components/ui/lines-editor';import { EntityPickerInput } from '@/components/form/entity-picker-input';import { applySupplierSelection, applyDepartmentSelection, applyProjectSelection, applyPurchaseContractSelection, applySourceDocumentSelection } from '@/lib/field-linkage';import { calcTotalFromLines, recalcHeaderTotals } from '@/lib/calc';import { toast } from '@/components/ui/toast';const FI='h-9 rounded-md border border-border bg-background px-3 text-[13px] w-full';

export default function PurchaseOrderCreate(){const router=useRouter();
const [f,setF]=useState({orderNo:'',orderName:'',supplierId:'',supplierName:'',purchaser:'',purchaseType:'',
  projectId:'',projectName:'',contractId:'',contractName:'',
  departmentId:'',departmentName:'',
  purchasePlanId:'',purchasePlanNo:'',totalAmount:'',expectedDeliveryDate:'',remark:''});
const [lines,setLines]=useState<LineItem[]>([]);
const [planLoading,setPlanLoading]=useState(false);
const [contractLoading,setContractLoading]=useState(false);
useEffect(()=>{api.get('/common/next-code',{params:{entity:'purchaseOrder'}}).then(r=>setF((prev:any)=>({...prev,orderNo:r.data.code})));},[]);

const onLinesChange=(newLines:LineItem[])=>{
  setLines(newLines);
  if(newLines.length>0){const h=recalcHeaderTotals(newLines);setF(prev=>({...prev,totalAmount:h.totalAmount}));}
};

const onPlanSelect=async(id:string)=>{
  setPlanLoading(true);
  try{
    const result=await applySourceDocumentSelection('PURCHASE_PLAN',id,{
      materialCode:'materialCode',materialName:'materialName',spec:'spec',unit:'unit',
      quantity:'quantity',unitPrice:'unitPrice',amount:'amount',requiredDate:'requiredDate',warehouseCode:'warehouseCode',
    },api);
    setF(prev=>({...prev,purchasePlanId:id,purchasePlanNo:result.header.sourceNo||'',
      supplierId:result.header.supplierId||prev.supplierId,
      supplierName:result.header.supplierName||prev.supplierName,}));
    if(result.lines.length>0)onLinesChange(result.lines as LineItem[]);
    toast('已加载采购计划明细','success');
  }catch(e:any){toast(e.response?.data?.message||'加载失败','error');}
  finally{setPlanLoading(false);}
};

const onContractSelect=async(id:string,contract:any)=>{
  const fill=applyPurchaseContractSelection(contract);
  setF(prev=>({
    ...prev,
    contractId:fill.contractId||'',
    contractName:fill.contractName||'',
    supplierId:fill.supplierId||prev.supplierId,
    supplierName:fill.supplierName||prev.supplierName,
    projectId:fill.projectId||prev.projectId,
    projectName:fill.projectName||prev.projectName,
    departmentId:fill.departmentId||prev.departmentId,
    departmentName:fill.departmentName||prev.departmentName,
    purchaseType:fill.purchaseType||prev.purchaseType||'',
    totalAmount:lines.length===0?(fill.totalAmount||prev.totalAmount):prev.totalAmount,
  }));
  if(!id)return;
  setContractLoading(true);
  try{
    const {data}=await api.get('/contracts/'+id);
    if(data.lines&&data.lines.length>0){
      const contractLines:LineItem[]=data.lines.map((l:any,i:number)=>({
        lineNo:l.lineNo||i+1,
        materialCode:l.materialCode||'',
        materialName:l.materialName||'',
        spec:l.specification||'',
        unit:l.unit||'',
        quantity:l.quantity!=null?String(l.quantity):'',
        unitPrice:l.unitPrice!=null?String(l.unitPrice):'',
        amount:l.amount!=null?String(l.amount):'',
        warehouseCode:'',
        remark:l.remark||'',
      }));
      setLines(contractLines);
      const h=recalcHeaderTotals(contractLines);
      setF(prev=>({...prev,totalAmount:h.totalAmount}));
      toast(`已加载合同${data.lines.length}条明细`,'success');
    }
  }catch(e:any){}finally{setContractLoading(false);}
};

const save=async()=>{
  if(!f.orderName)return toast('请填写订单名称','error');
  if(!f.supplierName)return toast('请选择供应商','error');
  // Build safe payload: only fields that exist in Prisma PurchaseOrder model
  const payload:any={
    orderNo:f.orderNo, orderName:f.orderName,
    supplierId:f.supplierId, supplierName:f.supplierName,
    purchaseType:f.purchaseType,
    purchaser:f.purchaser,
    projectId:f.projectId||undefined, projectName:f.projectName||undefined,
    contractId:f.contractId||undefined, contractName:f.contractName||undefined,
    departmentId:f.departmentId||undefined, departmentName:f.departmentName||undefined,
    purchasePlanId:f.purchasePlanId||undefined, purchasePlanNo:f.purchasePlanNo||undefined,
    expectedDeliveryDate:f.expectedDeliveryDate||undefined,
    totalAmount:lines.length>0?calcTotalFromLines(lines):(f.totalAmount||undefined),
    remark:f.remark||undefined,
  };
  if(lines.length>0)payload.lines=lines;
  try{
    await api.post('/purchase-orders',payload);
    router.push('/purchase/order');
  }catch(e:any){toast(e.response?.data?.message||'保存失败','error');}
};

return(<FormLayout title="新增采购订单" onSave={save} sections={[{id:'b',title:'基本信息'},{id:'s',title:'来源关联'},{id:'l',title:'明细信息'}]} activeSection="b">
<FormSection id="b" title="基本信息"><FormGrid>
<FormField label="订单编号"><Input className={FI} value={f.orderNo} readOnly disabled/></FormField>
<FormField label="订单名称" required><Input className={FI} value={f.orderName} onChange={e=>setF({...f,orderName:e.target.value})}/></FormField>
<FormField label="供应商" required>
  <EntityPickerInput entity="supplier" value={f.supplierName} displayText={f.supplierName}
    onChange={(id:any,s:any)=>{setF({...f,...applySupplierSelection(s)});}}/></FormField>
<FormField label="采购负责人"><Input className={FI} value={f.purchaser} onChange={e=>setF({...f,purchaser:e.target.value})}/></FormField>
<FormField label="采购方式"><Input className={FI} value={f.purchaseType} onChange={e=>setF({...f,purchaseType:e.target.value})}/></FormField>
<FormField label="金额"><Input className={FI} value={lines.length>0?calcTotalFromLines(lines):f.totalAmount} placeholder="自动=明细合计" readOnly disabled/></FormField>
<FormField label="期望交货日"><Input type="date" className={FI} value={f.expectedDeliveryDate} onChange={e=>setF({...f,expectedDeliveryDate:e.target.value})}/></FormField>
<FormField label="备注"><Input className={FI} value={f.remark} onChange={e=>setF({...f,remark:e.target.value})}/></FormField>
</FormGrid></FormSection>
<FormSection id="s" title="来源关联"><FormGrid>
<FormField label="关联计划"><EntityPickerInput entity="purchasePlan" value={f.purchasePlanNo} displayText={f.purchasePlanNo || ''} status="APPROVED"
  onChange={(id:any)=>{setF({...f,purchasePlanId:id});onPlanSelect(id);}}/></FormField>
<FormField label="关联项目"><EntityPickerInput entity="project" value={f.projectName} displayText={f.projectName}
  onChange={(id:any,p:any)=>{setF({...f,...applyProjectSelection(p)});}}/></FormField>
<FormField label="关联合同">
  <EntityPickerInput entity="contract" value={f.contractName} displayText={f.contractName}
    status="APPROVED" extraParams={{type:'采购合同'}}
    onChange={(id:any,c:any)=>{onContractSelect(id,c);}}/></FormField>
<FormField label="采购部门"><EntityPickerInput entity="department" value={f.departmentName} displayText={f.departmentName}
  onChange={(id:any,d:any)=>{setF({...f,...applyDepartmentSelection(d)});}}/></FormField>
</FormGrid></FormSection>
<FormSection id="l" title="明细信息">{contractLoading?<div className="py-4 text-center text-[13px] text-muted-foreground">加载合同明细中...</div>:<LinesEditor lines={lines} onChange={onLinesChange}/>}</FormSection>
</FormLayout>);}
