'use client';import { useEffect, useState } from 'react';import { useRouter } from 'next/navigation';import api from '@/lib/api';import { Input } from '@/components/ui/input';import { Select,SelectContent,SelectItem,SelectTrigger,SelectValue } from '@/components/ui/select';import { Textarea } from '@/components/ui/textarea';import { toast } from '@/components/ui/toast';import { FormLayout,FormSection,FormGrid,FormField } from '@/components/form/form-layout';import { LinesEditor, LineItem } from '@/components/ui/lines-editor';import { EntitySelect } from '@/components/form/entity-select';import { applyMaterialSelection, applySupplierSelection, applySourceDocumentSelection } from '@/lib/field-linkage';import { calcLineAmount, recalcHeaderTotals } from '@/lib/calc';
const FI='h-9 rounded-md border border-border bg-background px-3 text-[13px] w-full';

const INB_COLS=[
  {key:'lineNo',label:'行号',width:'60px',type:'number' as const},
  {key:'materialCode',label:'物料编码',width:'120px'},
  {key:'materialName',label:'物料名称',width:'120px'},
  {key:'spec',label:'规格型号',width:'100px'},
  {key:'unit',label:'单位',width:'60px'},
  {key:'quantity',label:'数量',width:'80px',type:'number' as const},
  {key:'unitPrice',label:'单价',width:'80px',type:'number' as const},
  {key:'amount',label:'金额',width:'100px',type:'number' as const},
  {key:'warehouseCode',label:'仓库',width:'100px'},
  {key:'locationCode',label:'仓位',width:'80px'},
  {key:'batchNo',label:'批次',width:'100px'},
];

export default function ICreate(){const router=useRouter();
const [f,setF]=useState({orderNo:'',sourceType:'PURCHASE',sourceId:'',sourceNo:'',supplierId:'',supplierCode:'',supplierName:'',materialId:'',materialCode:'',materialName:'',specification:'',unit:'',quantity:'',warehouseId:'',warehouseCode:'',warehouseName:'',unitPrice:'',totalAmount:'',remark:''});
const [lines,setLines]=useState<LineItem[]>([]);
const [sourceLoading,setSourceLoading]=useState(false);

useEffect(()=>{api.get('/common/next-code',{params:{entity:'inboundOrder'}}).then(r=>setF(prev=>({...prev,orderNo:r.data.code})));},[]);

// Auto-calc totalAmount when lines change or header quantity/price change
useEffect(()=>{
  if(lines.length>0){const h=recalcHeaderTotals(lines);setF(prev=>({...prev,totalAmount:h.totalAmount,quantity:h.totalQuantity}));}
  else if(f.quantity&&f.unitPrice){setF(prev=>({...prev,totalAmount:calcLineAmount(f.quantity,f.unitPrice)}));}
},[lines,f.quantity,f.unitPrice]);

const onSourceSelect=async(sourceId:string)=>{
  if(!sourceId||sourceLoading)return;
  setSourceLoading(true);
  try{
    const result=await applySourceDocumentSelection(f.sourceType,sourceId,{
      materialCode:'materialCode',materialName:'materialName',spec:'spec',unit:'unit',
      quantity:'quantity',unitPrice:'unitPrice',amount:'amount',warehouseCode:'warehouseCode',
    },api);
    const header=result.header;
    setF(prev=>({...prev,
      sourceNo:header.sourceNo||'',supplierId:header.supplierId||prev.supplierId,
      supplierName:header.supplierName||prev.supplierName,
      materialName:result.lines[0]?.materialName||prev.materialName,
      specification:result.lines[0]?.spec||prev.specification,
    }));
    if(result.lines.length>0)setLines(result.lines as LineItem[]);
    toast('已加载来源单明细','success');
  }catch(e:any){toast(e.response?.data?.message||'加载来源单失败','error');}
  finally{setSourceLoading(false);}
};

const save=async()=>{
  if(!f.materialName&&lines.length===0)return toast('请填写物料或添加明细','error');
  if(!f.quantity&&lines.length===0)return toast('请填写数量','error');
  const p:any={...f};
  if(p.totalAmount==='')p.totalAmount=undefined;
  if(lines.length>0){p.lines=lines;const h=recalcHeaderTotals(lines);p.totalAmount=h.totalAmount;p.quantity=h.totalQuantity;}
  if(!p.lines&&p.quantity&&p.unitPrice)p.totalAmount=calcLineAmount(p.quantity,p.unitPrice);
  await api.post('/inbound-orders',p);router.push('/warehouse/inbound');
};

const srcEntity=f.sourceType==='PURCHASE'?'purchaseOrder':f.sourceType==='INSPECTION'?'inspection':'purchaseOrder';

return(<FormLayout title="新增入库单" onSave={save} sections={[{id:'b',title:'入库信息'},{id:'s',title:'来源信息'},{id:'l',title:'明细信息'}]} activeSection="b">
<FormSection id="b" title="入库信息"><FormGrid>
<FormField label="入库单号"><Input className={FI} value={f.orderNo} readOnly disabled/></FormField>
<FormField label="物料">
  <EntitySelect entity="material" value={f.materialId} status="ACTIVE"
    onChange={(id,m)=>{setF({...f,...applyMaterialSelection(m)});}}/></FormField>
<FormField label="规格型号"><Input className={FI} value={f.specification} readOnly disabled/></FormField>
<FormField label="单位"><Input className={FI} value={f.unit} readOnly disabled/></FormField>
<FormField label="数量"><Input type="number" className={FI} value={f.quantity} onChange={e=>setF({...f,quantity:e.target.value})} placeholder="总数量"/></FormField>
<FormField label="仓库">
  <EntitySelect entity="warehouse" value={f.warehouseId}
    onChange={(id,w)=>setF({...f,warehouseId:id,warehouseCode:w.code||'',warehouseName:w.name||''})}/></FormField>
<FormField label="单价"><Input type="number" className={FI} value={f.unitPrice} onChange={e=>setF({...f,unitPrice:e.target.value})} placeholder="0.00"/></FormField>
<FormField label="金额"><Input className={FI} value={lines.length>0||(f.quantity&&f.unitPrice)?f.totalAmount:''} placeholder="自动=数量×单价 或 明细合计" readOnly disabled/></FormField>
<div className="col-span-2"><FormField label="备注"><Textarea className={`${FI} h-20`} value={f.remark} onChange={e=>setF({...f,remark:e.target.value})}/></FormField></div>
</FormGrid></FormSection>

<FormSection id="s" title="来源信息"><FormGrid>
<FormField label="来源类型">
<Select value={f.sourceType} onValueChange={(v:any)=>{setF({...f,sourceType:v,sourceId:'',sourceNo:'',materialName:'',specification:''});setLines([]);}}>
<SelectTrigger className={FI}><SelectValue/></SelectTrigger>
<SelectContent><SelectItem value="PURCHASE">采购入库</SelectItem><SelectItem value="INSPECTION">质检入库</SelectItem><SelectItem value="OTHER">其他</SelectItem></SelectContent></Select></FormField>
<FormField label="来源单号">
{f.sourceType!=='OTHER'?(
  <EntitySelect entity={srcEntity} value={f.sourceId} status="APPROVED"
    onChange={(id,doc)=>{setF({...f,sourceId:id,sourceNo:doc.orderNo||doc.inspectionNo||''});onSourceSelect(id);}}
    disabled={sourceLoading}/>):(
  <Input className={FI} value={f.sourceNo} onChange={e=>setF({...f,sourceNo:e.target.value})} placeholder="输入来源单号"/>)}
</FormField>
<FormField label="来源单号(已选)">{f.sourceNo&&<Input className={FI} value={f.sourceNo} readOnly disabled/>}{!f.sourceNo&&<span className="text-[13px] text-muted-foreground">选择来源单后自动显示</span>}</FormField>
<FormField label="供应商">
  <EntitySelect entity="supplier" value={f.supplierId}
    onChange={(id,s)=>{setF({...f,...applySupplierSelection(s)});}}/></FormField>
</FormGrid></FormSection>

<FormSection id="l" title="明细信息"><LinesEditor lines={lines} onChange={setLines} columns={INB_COLS}/></FormSection>
</FormLayout>);}
