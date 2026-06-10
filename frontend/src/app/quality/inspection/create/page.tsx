'use client';
import { useState, useEffect } from 'react';import { useRouter } from 'next/navigation';import api from '@/lib/api';
import { Input } from '@/components/ui/input';import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';import { toast } from '@/components/ui/toast';
import { FormLayout, FormSection, FormGrid, FormField } from '@/components/form/form-layout';
import { LinesEditor, LineItem } from '@/components/ui/lines-editor';
import { EntityPickerInput } from '@/components/form/entity-picker-input';
import { applyMaterialSelection } from '@/lib/field-linkage';
import { calcTotalQtyFromLines } from '@/lib/calc';
const FI='h-9 rounded-md border border-border bg-background px-3 text-[13px] w-full';
const SECS=[{id:'basic',title:'质检单信息'},{id:'lines',title:'检验明细'}];

const QC_COLS = [
  { key: 'lineNo', label: '行号', width: '60px', type: 'number' as const },
  { key: 'materialCode', label: '物料编码', width: '120px' },
  { key: 'materialName', label: '物料名称', width: '120px' },
  { key: 'spec', label: '规格型号', width: '100px' },
  { key: 'unit', label: '单位', width: '60px' },
  { key: 'inspectQty', label: '检验数量', width: '80px', type: 'number' as const },
  { key: 'qualifiedQty', label: '合格数量', width: '80px', type: 'number' as const },
  { key: 'unqualifiedQty', label: '不合格数', width: '80px', type: 'number' as const },
  { key: 'unqualifiedReason', label: '不合格原因', width: '120px' },
  { key: 'result', label: '结果', width: '80px' },
];

export default function InspectionCreatePage() {
  const router=useRouter();
  const [lines,setLines]=useState<LineItem[]>([]);
  const [srcLoading,setSrcLoading]=useState(false);
  const [f,setF]=useState({inspectionNo:'',sourceType:'采购单',sourceId:'',sourceNo:'',materialId:'',materialCode:'',materialName:'',specification:'',unit:'',quantity:'',inspector:'',result:''});
  useEffect(()=>{api.get('/common/next-code',{params:{entity:'inspection'}}).then(r=>setF((prev:any)=>({...prev,inspectionNo:r.data.code})));},[]);

  const onSourceSelect=async(sourceId:string)=>{
    setSrcLoading(true);
    try{
      const srcPath=f.sourceType==='采购单'?'/purchase-orders':'/production-orders';
      const {data}=await api.get(`${srcPath}/${sourceId}`);
      const srcLines=data.lines||data.materials||[];
      const firstLine=srcLines[0]||{};
      setF(prev=>({...prev,sourceId,sourceNo:data.orderNo||data.planNo||'',
        materialName:firstLine.materialName||data.materialName||prev.materialName,
        materialCode:firstLine.materialCode||'',
        specification:firstLine.spec||'',
        unit:firstLine.unit||'',
        quantity:srcLines.length>0?String(srcLines.reduce((s:number,l:any)=>s+Number(l.quantity||l.plannedQty||0),0)):(data.quantity||prev.quantity)}));
      if(srcLines.length>0){
        setLines(srcLines.map((l:any,i:number)=>({lineNo:l.lineNo??i+1,materialCode:l.materialCode||'',materialName:l.materialName||'',spec:l.spec||'',unit:l.unit||'',inspectQty:l.quantity||l.plannedQty||'0',qualifiedQty:'0',unqualifiedQty:'0',result:'PENDING'})));
      }
      toast('已加载来源单明细','success');
    }catch(e:any){toast(e.response?.data?.message||'加载失败','error');}
    finally{setSrcLoading(false);}
  };

  const save=async()=>{
    // Validation
    for (const l of lines) {
      const insp = Number(l.inspectQty || 0);
      const qual = Number(l.qualifiedQty || 0);
      const unqual = Number(l.unqualifiedQty || 0);
      if (qual + unqual > insp) return toast(`第${l.lineNo}行：合格+不合格不能超过检验数量`, 'error');
      if (unqual > 0 && !l.unqualifiedReason) return toast(`第${l.lineNo}行：不合格数量>0时必须填写不合格原因`, 'error');
    }
    try{
      // Only keep valid Inspection model fields
      const payload: any = {} as any;
      for (const k of ['inspectionNo','sourceType','sourceNo','materialId','materialName','quantity','inspector','result']) {
        if ((f as any)[k] !== undefined && (f as any)[k] !== '') (payload as any)[k] = (f as any)[k];
      }
      if(lines.length>0){
        // Map unqualifiedReason → remark (InspectionLine has no unqualifiedReason field)
        payload.lines = lines.map((l:any) => {
          const {unqualifiedReason, ...rest} = l;
          if (unqualifiedReason && !rest.remark) rest.remark = unqualifiedReason;
          return rest;
        });
        payload.quantity = String(lines.reduce((s:number,l:any)=>s+Number(l.inspectQty||0),0));
      }
      await api.post('/inspections',payload);router.push('/quality/inspection');
    }catch(e:any){toast(e.response?.data?.message||'保存失败','error');}
  };

  return (<FormLayout title="新增质检单" onSave={save} sections={SECS} activeSection="basic">
    <FormSection id="basic" title="质检单信息"><FormGrid>
      <FormField label="质检单号" required><Input className={FI} value={f.inspectionNo} readOnly disabled/></FormField>
      <FormField label="来源类型" required>
        <RadioGroup value={f.sourceType} onValueChange={(v:any)=>setF({...f,sourceType:v,sourceId:'',sourceNo:''})} className="flex gap-4 pt-1.5">
          <div className="flex items-center gap-1.5"><RadioGroupItem value="采购单" id="st-po"/><label htmlFor="st-po" className="text-[13px]">采购单</label></div>
          <div className="flex items-center gap-1.5"><RadioGroupItem value="生产退料" id="st-pr"/><label htmlFor="st-pr" className="text-[13px]">生产退料</label></div>
        </RadioGroup>
      </FormField>
      <FormField label="来源单号">
        <EntityPickerInput entity={f.sourceType==='采购单'?'purchaseOrder':'productionOrder'} value={f.sourceNo} displayText={f.sourceNo || ''} status="APPROVED"
          onChange={(id:any)=>{setF({...f,sourceId:id});onSourceSelect(id);}}/>
      </FormField>
      <FormField label="物料"><EntityPickerInput entity="material" value={f.materialCode} displayText={f.materialCode ? `${f.materialCode} ${f.materialName}` : ''} onChange={(id:any,m:any)=>{setF({...f,...applyMaterialSelection(m)});}}/></FormField>
      <FormField label="物料编码">{f.materialCode&&<Input className={FI} value={f.materialCode} readOnly disabled/>}</FormField>
      <FormField label="规格型号"><Input className={FI} value={f.specification||''} readOnly disabled/></FormField>
      <FormField label="单位"><Input className={FI} value={f.unit||''} readOnly disabled/></FormField>
      <FormField label="数量"><Input className={FI} value={f.quantity} readOnly disabled/></FormField>
      <FormField label="检验员"><Input className={FI} value={f.inspector} onChange={e=>setF({...f,inspector:e.target.value})}/></FormField>
      <FormField label="检验结果"><Input className={FI} value={f.result} onChange={e=>setF({...f,result:e.target.value})} placeholder="合格/不合格/待定"/></FormField>
    </FormGrid></FormSection>
    <FormSection id="lines" title="检验明细"><LinesEditor lines={lines} onChange={setLines} columns={QC_COLS}/></FormSection>
  </FormLayout>);
}
