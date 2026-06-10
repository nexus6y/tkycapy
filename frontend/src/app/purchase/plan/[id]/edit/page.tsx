'use client';import { useState, useEffect } from 'react';import { useRouter, useParams } from 'next/navigation';import api from '@/lib/api';import { Input } from '@/components/ui/input';import { FormLayout,FormSection,FormGrid,FormField } from '@/components/form/form-layout';import { LinesEditor, LineItem } from '@/components/ui/lines-editor';import { EntitySelect } from '@/components/form/entity-select';import { applySupplierSelection, applyMaterialSelection } from '@/lib/field-linkage';import { calcTotalFromLines, recalcHeaderTotals } from '@/lib/calc';import { toast } from '@/components/ui/toast';const FI='h-9 rounded-md border border-border bg-background px-3 text-[13px] w-full';

export default function PurchasePlanEdit(){const router=useRouter();const {id}=useParams();const [loading,setLoading]=useState(true);
const [f,setF]=useState<any>({});
const [lines,setLines]=useState<LineItem[]>([]);
const editable=!f.approvalStatus||f.approvalStatus==='DRAFT';

useEffect(()=>{
  api.get('/purchase-plans/'+id).then(r=>{const d=r.data;setF({
    orderNo:d.orderNo||'',orderName:d.orderName||'',
    supplierId:d.supplierId||'',supplierName:d.supplierName||'',
    materialName:d.materialName||'',
    quantity:d.quantity||'',
    requiredDate:d.requiredDate?d.requiredDate.split('T')[0]:'',
    demandPlanId:d.demandPlanId||'',demandPlanNo:d.demandPlanNo||'',
    approvalStatus:d.approvalStatus||'DRAFT',
    businessStatus:d.businessStatus||'',
    remark:d.remark||'',
  });if(d.lines)setLines(d.lines);setLoading(false);});
},[id]);

const onLinesChange=(newLines:LineItem[])=>{
  setLines(newLines);
  if(newLines.length>0){const h=recalcHeaderTotals(newLines);setF((prev:any)=>({...prev,quantity:h.totalQuantity}));}
};

const save=async()=>{
  try{
    if(!f.orderName)return toast('请填写计划名称','error');
    const payload:any={
      orderNo:f.orderNo,orderName:f.orderName,
      supplierId:f.supplierId||undefined,supplierName:f.supplierName||undefined,
      materialName:f.materialName||undefined,
      quantity:f.quantity||undefined,
      requiredDate:f.requiredDate||undefined,
      demandPlanId:f.demandPlanId||undefined,demandPlanNo:f.demandPlanNo||undefined,
      remark:f.remark||undefined,
    };
    if(lines.length>0){payload.lines=lines;}
    await api.put('/purchase-plans/'+id,payload);router.push('/purchase/plan');
  }catch(e:any){toast(e.response?.data?.message||'保存失败','error');}
};

if(loading)return<div className="h-full flex items-center justify-center text-muted-foreground">加载中...</div>;

return(<FormLayout title="修改采购计划" onSave={editable?save:(async()=>{})} sections={[{id:'b',title:'计划信息'},{id:'l',title:'明细信息'}]} activeSection="b">
{!editable&&<div className="px-4 py-2 bg-[#fdf6ec] text-[#e6a23c] text-[13px] border border-[#faecd8] rounded">计划已提交/审批，不可编辑。</div>}
<FormSection id="b" title="计划信息"><FormGrid>
<FormField label="计划编号" required><Input className={FI} value={f.orderNo} onChange={e=>setF({...f,orderNo:e.target.value})} disabled={!editable}/></FormField>
<FormField label="计划名称" required><Input className={FI} value={f.orderName} onChange={e=>setF({...f,orderName:e.target.value})} disabled={!editable} data-testid="plan-ordername-input"/></FormField>
<FormField label="供应商"><EntitySelect entity="supplier" value={f.supplierId||''} onChange={(id,s)=>{setF({...f,...applySupplierSelection(s)});}} disabled={!editable}/></FormField>
<FormField label="物料"><EntitySelect entity="material" value={f.materialId||''} onChange={(id,m)=>{setF({...f,...applyMaterialSelection(m)});}} disabled={!editable}/></FormField>
<FormField label="数量"><Input className={FI} value={lines.length>0?recalcHeaderTotals(lines).totalQuantity:(f.quantity||'')} readOnly disabled/></FormField>
<FormField label="金额"><Input className={FI} value={lines.length>0?calcTotalFromLines(lines):''} placeholder="自动=明细合计" readOnly disabled/></FormField>
<FormField label="需求日期"><Input type="date" className={FI} value={f.requiredDate||''} onChange={e=>setF({...f,requiredDate:e.target.value})} disabled={!editable}/></FormField>
</FormGrid></FormSection>
<FormSection id="l" title="明细信息"><LinesEditor lines={lines} onChange={editable?onLinesChange:(()=>{})}/></FormSection>
</FormLayout>);}
