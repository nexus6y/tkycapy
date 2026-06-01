'use client';import { useEffect, useState } from 'react';import { useRouter } from 'next/navigation';import api from '@/lib/api';import { Input } from '@/components/ui/input';import { Select,SelectContent,SelectItem,SelectTrigger,SelectValue } from '@/components/ui/select';import { Textarea } from '@/components/ui/textarea';import { FormLayout,FormSection,FormGrid,FormField } from '@/components/form/form-layout';import { LinesEditor, LineItem } from '@/components/ui/lines-editor';import { EntitySelect } from '@/components/form/entity-select';import { applyMaterialSelection, applyWarehouseSelection, applySourceDocumentSelection } from '@/lib/field-linkage';import { calcLineAmount, calcTotalFromLines, recalcHeaderTotals } from '@/lib/calc';import { toast } from '@/components/ui/toast';
const FI='h-9 rounded-md border border-border bg-background px-3 text-[13px] w-full';

const OUT_COLS = [
  { key: 'lineNo', label: '行号', width: '60px', type: 'number' as const },
  { key: 'materialCode', label: '物料编码', width: '120px' },
  { key: 'materialName', label: '物料名称', width: '120px' },
  { key: 'spec', label: '规格型号', width: '100px' },
  { key: 'unit', label: '单位', width: '60px' },
  { key: 'quantity', label: '数量', width: '80px', type: 'number' as const },
  { key: 'unitPrice', label: '单价', width: '80px', type: 'number' as const },
  { key: 'amount', label: '金额', width: '100px', type: 'number' as const },
  { key: 'warehouseCode', label: '仓库', width: '100px' },
  { key: 'locationCode', label: '仓位', width: '80px' },
  { key: 'batchNo', label: '批次', width: '100px' },
];

export default function OCreate(){const router=useRouter();
const [f,setF]=useState({orderNo:'',sourceType:'SALES_SHIPMENT',sourceId:'',sourceNo:'',materialId:'',materialCode:'',materialName:'',specification:'',unit:'',quantity:'',warehouseId:'',warehouseCode:'',warehouseName:'',unitPrice:'',totalAmount:'',remark:''});
const [lines,setLines]=useState<LineItem[]>([]);
const [sourceLoading,setSourceLoading]=useState(false);
useEffect(()=>{api.get('/common/next-code',{params:{entity:'outboundOrder'}}).then(r=>setF((prev:any)=>({...prev,orderNo:r.data.code})));},[]);

const onLinesChange=(newLines:LineItem[])=>{
  setLines(newLines);
  if(newLines.length>0){const h=recalcHeaderTotals(newLines);setF(prev=>({...prev,totalAmount:h.totalAmount,quantity:h.totalQuantity}));}
};

const onShipmentSelect=async(shipmentId:string)=>{
  setSourceLoading(true);
  try{
    const result=await applySourceDocumentSelection('SALES_SHIPMENT',shipmentId,{
      materialCode:'materialCode',materialName:'materialName',spec:'spec',unit:'unit',
      shippedQty:'quantity',unitPrice:'unitPrice',amount:'amount',warehouseCode:'warehouseCode',
    },api);
    setF(prev=>({...prev,sourceId:shipmentId,sourceNo:result.header.sourceNo||''}));
    if(result.lines.length>0)onLinesChange(result.lines as LineItem[]);
    toast('已加载出货明细','success');
  }catch(e:any){toast(e.response?.data?.message||'加载失败','error');}
  finally{setSourceLoading(false);}
};

const save=async()=>{
  if(!f.materialName&&lines.length===0)return toast('请填写物料或添加明细','error');
  if(!f.quantity&&lines.length===0)return toast('请填写数量','error');
  const p:any={...f};
  if(lines.length>0){p.lines=lines;p.totalAmount=calcTotalFromLines(lines);const h=recalcHeaderTotals(lines);p.quantity=h.totalQuantity;}
  if(!p.lines&&p.quantity&&p.unitPrice)p.totalAmount=calcLineAmount(p.quantity,p.unitPrice);
  await api.post('/outbound-orders',p);router.push('/warehouse/outbound');
};

return(<FormLayout title="新增出库单" onSave={save} sections={[{id:'b',title:'出库信息'},{id:'s',title:'来源信息'},{id:'l',title:'明细信息'}]} activeSection="b">
<FormSection id="b" title="出库信息"><FormGrid>
<FormField label="出库单号"><Input className={FI} value={f.orderNo} readOnly disabled/></FormField>
<FormField label="物料">
  <EntitySelect entity="material" value={f.materialId} status="ACTIVE"
    onChange={(id,m)=>{setF({...f,...applyMaterialSelection(m)});}}/></FormField>
<FormField label="规格型号"><Input className={FI} value={f.specification} readOnly disabled/></FormField>
<FormField label="单位"><Input className={FI} value={f.unit} readOnly disabled/></FormField>
<FormField label="数量"><Input className={FI} value={lines.length>0?recalcHeaderTotals(lines).totalQuantity:f.quantity} readOnly disabled placeholder="自动=明细合计"/></FormField>
<FormField label="仓库">
  <EntitySelect entity="warehouse" value={f.warehouseId}
    onChange={(id,w)=>{setF({...f,...applyWarehouseSelection(w)});}}/></FormField>
<FormField label="单价"><Input type="number" className={FI} value={f.unitPrice} onChange={e=>setF({...f,unitPrice:e.target.value})} placeholder="0.00"/></FormField>
<FormField label="金额"><Input className={FI} value={lines.length>0||(f.quantity&&f.unitPrice)?f.totalAmount:''} placeholder="自动=数量×单价 或 明细合计" readOnly disabled/></FormField>
<div className="col-span-2"><FormField label="备注"><Textarea className={`${FI} h-20`} value={f.remark} onChange={e=>setF({...f,remark:e.target.value})}/></FormField></div>
</FormGrid></FormSection>

<FormSection id="s" title="来源信息"><FormGrid>
<FormField label="来源类型">
<Select value={f.sourceType} onValueChange={(v:any)=>setF({...f,sourceType:v,sourceId:'',sourceNo:''})}>
<SelectTrigger className={FI}><SelectValue/></SelectTrigger>
<SelectContent><SelectItem value="SALES_SHIPMENT">销售出货单</SelectItem><SelectItem value="OTHER">其他</SelectItem></SelectContent></Select></FormField>
{f.sourceType==='SALES_SHIPMENT'?(
<FormField label="来源单号">
  <EntitySelect entity="salesShipment" value={f.sourceId} status="APPROVED"
    onChange={(id)=>{setF({...f,sourceId:id});onShipmentSelect(id);}} disabled={sourceLoading}/></FormField>
):(
<FormField label="来源单号"><Input className={FI} value={f.sourceNo} onChange={e=>setF({...f,sourceNo:e.target.value})} placeholder="手动输入"/></FormField>
)}
</FormGrid></FormSection>

<FormSection id="l" title="明细信息"><LinesEditor lines={lines} onChange={onLinesChange} columns={OUT_COLS}/></FormSection>
</FormLayout>);}
