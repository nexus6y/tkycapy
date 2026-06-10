'use client';import { useEffect, useState } from 'react';import { useRouter, useParams } from 'next/navigation';import api from '@/lib/api';import { Input } from '@/components/ui/input';import { Textarea } from '@/components/ui/textarea';import { Button } from '@/components/ui/button';import { toast } from '@/components/ui/toast';
import { FormLayout,FormSection,FormGrid,FormField } from '@/components/form/form-layout';
import { EntityPickerInput } from '@/components/form/entity-picker-input';
import { applyMaterialSelection } from '@/lib/field-linkage';
import { Select,SelectContent,SelectItem,SelectTrigger,SelectValue } from '@/components/ui/select';
import { Plus, Trash2, ArrowUp, ArrowDown, Copy } from 'lucide-react';
const FI='h-9 rounded-md border border-border bg-background px-3 text-[13px] w-full';

interface BomItemRow {
  lineNo:number; parentMaterialId?:string; parentMaterialCode?:string; parentMaterialName?:string;
  materialId:string; materialCode:string; materialName:string; spec:string; unit:string;
  quantity:string; lossRate:string; issueMethod:string;
  warehouseId?:string; warehouseCode:string; warehouseName:string;
  processId?:string; processName:string; remark:string;
}
const emptyRow=():BomItemRow=>({lineNo:1,materialId:'',materialCode:'',materialName:'',spec:'',unit:'',quantity:'1',lossRate:'0',issueMethod:'',warehouseId:'',warehouseCode:'',warehouseName:'',processId:'',processName:'',remark:''});

export default function BEdit(){const router=useRouter();const {id}=useParams<{id:string}>();const [loading,setLoading]=useState(true);const [f,setF]=useState<any>({});
const [items,setItems]=useState<BomItemRow[]>([]);
const isEditable=f.approvalStatus==='DRAFT'||f.approvalStatus==='REJECTED';

useEffect(()=>{api.get('/boms/'+id).then(r=>{const d=r.data;setF(d);setItems((d.items||[]).map((i:any)=>({lineNo:i.lineNo,parentMaterialId:i.parentMaterialId||'',parentMaterialCode:i.parentMaterialCode||'',parentMaterialName:i.parentMaterialName||'',materialId:i.materialId||'',materialCode:i.materialCode||'',materialName:i.materialName||'',spec:i.spec||'',unit:i.unit||'',quantity:String(i.quantity||1),lossRate:String(i.lossRate||0),issueMethod:i.issueMethod||'',warehouseId:i.warehouseId||'',warehouseCode:i.warehouseCode||'',warehouseName:i.warehouseName||'',processId:i.processId||'',processName:i.processName||'',remark:i.remark||''})));setLoading(false);}).catch(()=>{toast('加载失败','error');router.push('/production/bom');});},[id]);

const addRow=()=>{setItems(prev=>[...prev,{...emptyRow(),lineNo:prev.length+1}]);};
const delRow=(idx:number)=>{if(items.length<=1)return;setItems(prev=>prev.filter((_,i)=>i!==idx).map((r,i)=>({...r,lineNo:i+1})));};
const dupRow=(idx:number)=>{const r=items[idx];const newItems=[...items];newItems.splice(idx+1,0,{...r,lineNo:0});setItems(newItems.map((r,i)=>({...r,lineNo:i+1})));};
const moveRow=(idx:number,dir:number)=>{const to=idx+dir;if(to<0||to>=items.length)return;const n=[...items];[n[idx],n[to]]=[n[to],n[idx]];setItems(n.map((r,i)=>({...r,lineNo:i+1})));};
const updateRow=(idx:number,patch:Partial<BomItemRow>)=>{setItems(prev=>prev.map((r,i)=>i===idx?{...r,...patch}:r));};
const onMaterialSelect=(idx:number,id:string,m:any)=>{const fill=applyMaterialSelection(m);updateRow(idx,{materialId:fill.materialId,materialCode:fill.materialCode,materialName:fill.materialName,spec:fill.specification,unit:fill.unit,warehouseId:fill.defaultWarehouseId||'',warehouseCode:'',warehouseName:''});};

const save=async()=>{
  if(!f.name)return toast('请输入BOM名称','error');
  for(const item of items){
    if(!item.materialId)return toast(`第${item.lineNo}行：请选择子件物料`,'error');
    if(Number(item.quantity)<=0)return toast(`第${item.lineNo}行：用量必须大于0`,'error');
  }
  try{
    await api.put('/boms/'+id,{...f,items});
    router.push('/production/bom');
  }catch(e:any){toast(e.response?.data?.message||'保存失败','error');}
};

if(loading)return<div className="h-full flex items-center justify-center text-muted-foreground">加载中...</div>;
const noop=async()=>{};
return(<FormLayout title={'编辑BOM：'+f.code} onSave={isEditable?save:noop} sections={[{id:'b',title:'基本信息'},{id:'p',title:'成品信息'},{id:'items',title:'子件明细'},{id:'r',title:'备注'}]} activeSection="b">
<form onSubmit={e=>{e.preventDefault();if(isEditable)save();}} className="contents">
{!isEditable && <div className="px-4 py-2 bg-[#fdf6ec] text-[#e6a23c] text-[13px] border-b border-[#faecd8]">⚠ BOM已审批，不可编辑。如需修改请复制新版本或走变更流程。</div>}

<FormSection id="b" title="基本信息"><FormGrid>
<FormField label="BOM编码"><Input className={FI} value={f.code||''} disabled/></FormField>
<FormField label="BOM名称" required><Input className={FI} value={f.name||''} onChange={e=>setF({...f,name:e.target.value})} disabled={!isEditable}/></FormField>
<FormField label="版本"><Input className={FI} value={f.version||''} onChange={e=>setF({...f,version:e.target.value})} disabled={!isEditable}/></FormField>
<FormField label="基准数量"><Input type="number" className={FI} value={f.baseQty||'1'} onChange={e=>setF({...f,baseQty:e.target.value})} disabled={!isEditable}/></FormField>
<FormField label="生效日期"><Input type="date" className={FI} value={f.effectiveDate?.split('T')[0]||''} onChange={e=>setF({...f,effectiveDate:e.target.value})} disabled={!isEditable}/></FormField>
<FormField label="失效日期"><Input type="date" className={FI} value={f.expireDate?.split('T')[0]||''} onChange={e=>setF({...f,expireDate:e.target.value})} disabled={!isEditable}/></FormField>
<FormField label="状态">{isEditable?<Select value={f.status||'ACTIVE'} onValueChange={(v:any)=>setF({...f,status:v})}><SelectTrigger className={FI}><SelectValue/></SelectTrigger><SelectContent><SelectItem value="ACTIVE">启用</SelectItem><SelectItem value="INACTIVE">停用</SelectItem></SelectContent></Select>:<Input className={FI} value={f.status==='ACTIVE'?'启用':'停用'} disabled/>}</FormField>
</FormGrid></FormSection>

<FormSection id="p" title="成品信息"><FormGrid>
{isEditable?<FormField label="成品物料">
  <EntityPickerInput entity="material" value={f.productMaterialCode||''} displayText={f.productMaterialCode ? `${f.productMaterialCode} ${f.productMaterialName||''}` : ''} status="ACTIVE"
    onChange={(id:any,m:any)=>{const fill=applyMaterialSelection(m);setF({...f,productMaterialId:fill.materialId,productMaterialCode:fill.materialCode,productMaterialName:fill.materialName,productSpec:fill.specification,productUnit:fill.unit});}}/></FormField>
:<FormField label="成品物料"><Input className={FI} value={f.productMaterialCode||''} disabled/></FormField>}
<FormField label="成品编码"><Input className={FI} value={f.productMaterialCode||''} readOnly disabled/></FormField>
<FormField label="成品名称"><Input className={FI} value={f.productMaterialName||''} readOnly disabled/></FormField>
<FormField label="规格型号"><Input className={FI} value={f.productSpec||''} readOnly disabled/></FormField>
<FormField label="单位"><Input className={FI} value={f.productUnit||''} readOnly disabled/></FormField>
</FormGrid></FormSection>

<FormSection id="items" title="子件明细">
  {isEditable&&<div className="flex items-center gap-1 mb-3"><Button type="button" variant="outline" size="sm" onClick={addRow}><Plus className="h-3.5 w-3.5 mr-1"/>新增行</Button></div>}
  <div className="overflow-auto border border-border rounded-md">
    <table className="w-full text-[13px]">
      <thead><tr className="bg-[#f5f7fa] border-b border-[#ebeef5]">
        <th className="px-2 py-2 text-[#909399] font-medium text-left w-10">序号</th><th className="px-2 py-2 text-[#909399] font-medium text-left min-w-[80px]">父项物料</th>
        <th className="px-2 py-2 text-[#909399] font-medium text-left min-w-[120px]">子件物料</th>
        <th className="px-2 py-2 text-[#909399] font-medium text-left min-w-[80px]">规格型号</th><th className="px-2 py-2 text-[#909399] font-medium text-left w-14">单位</th>
        <th className="px-2 py-2 text-[#909399] font-medium text-left w-20">用量</th><th className="px-2 py-2 text-[#909399] font-medium text-left w-18">损耗率%</th>
        <th className="px-2 py-2 text-[#909399] font-medium text-left min-w-[80px]">发料方式</th><th className="px-2 py-2 text-[#909399] font-medium text-left min-w-[100px]">默认仓库</th>
        <th className="px-2 py-2 text-[#909399] font-medium text-left min-w-[80px]">工序</th><th className="px-2 py-2 text-[#909399] font-medium text-left min-w-[80px]">备注</th>
        {isEditable&&<th className="px-2 py-2 text-[#909399] font-medium text-left w-28">操作</th>}
      </tr></thead>
      <tbody>{items.map((r,idx)=>{
        if(isEditable)return (
        <tr key={idx} className="border-b border-[#ebeef5] hover:bg-[#f5f7fa]">
          <td className="px-2 py-1.5 text-[#909399]">{r.lineNo}</td>
          <td className="px-2 py-1.5"><EntityPickerInput entity="material" value={r.parentMaterialCode} displayText={r.parentMaterialCode||''} onChange={(id:any,m:any)=>{const f=applyMaterialSelection(m);updateRow(idx,{parentMaterialId:f.materialId,parentMaterialCode:f.materialCode,parentMaterialName:f.materialName});}}/></td>
          <td className="px-2 py-1.5"><EntityPickerInput entity="material" value={r.materialCode} displayText={r.materialCode?`${r.materialCode} ${r.materialName}`:''} status="ACTIVE" onChange={(id:any,m:any)=>onMaterialSelect(idx,id,m)}/></td>
          <td className="px-2 py-1.5"><input className="w-full bg-transparent border-none outline-none text-[13px] text-[#909399]" value={r.spec} readOnly/></td>
          <td className="px-2 py-1.5"><input className="w-full bg-transparent border-none outline-none text-[13px] text-[#909399]" value={r.unit} readOnly/></td>
          <td className="px-2 py-1.5"><input type="number" className="w-full border border-border rounded px-1.5 py-0.5 text-[13px]" value={r.quantity} onChange={e=>updateRow(idx,{quantity:e.target.value})} min="0" step="0.000001"/></td>
          <td className="px-2 py-1.5"><input type="number" className="w-full border border-border rounded px-1.5 py-0.5 text-[13px]" value={r.lossRate} onChange={e=>updateRow(idx,{lossRate:e.target.value})} min="0" max="100" step="0.01"/></td>
          <td className="px-2 py-1.5"><Input className="w-full h-7 text-[12px]" value={r.issueMethod} onChange={e=>updateRow(idx,{issueMethod:e.target.value})}/></td>
          <td className="px-2 py-1.5"><EntityPickerInput entity="warehouse" value={r.warehouseCode} displayText={r.warehouseCode||''} onChange={(id:any,w:any)=>{updateRow(idx,{warehouseId:w.id||id,warehouseCode:w.code||'',warehouseName:w.name||''});}}/></td>
          <td className="px-2 py-1.5"><Input className="w-full h-7 text-[12px]" value={r.processName} onChange={e=>updateRow(idx,{processName:e.target.value})}/></td>
          <td className="px-2 py-1.5"><Input className="w-full h-7 text-[12px]" value={r.remark} onChange={e=>updateRow(idx,{remark:e.target.value})}/></td>
          <td className="px-2 py-1.5"><div className="flex items-center gap-1">
            <button type="button" onClick={()=>moveRow(idx,-1)} className="p-0.5 hover:bg-gray-200 rounded"><ArrowUp className="h-3 w-3"/></button>
            <button type="button" onClick={()=>moveRow(idx,1)} className="p-0.5 hover:bg-gray-200 rounded"><ArrowDown className="h-3 w-3"/></button>
            <button type="button" onClick={()=>dupRow(idx)} className="p-0.5 hover:bg-gray-200 rounded text-blue-500"><Copy className="h-3 w-3"/></button>
            <button type="button" onClick={()=>delRow(idx)} className="p-0.5 hover:bg-gray-200 rounded text-red-500"><Trash2 className="h-3 w-3"/></button>
          </div></td>
        </tr>);
        return (<tr key={idx} className="border-b border-[#ebeef5]">
          <td className="px-2 py-1.5 text-[#909399]">{r.lineNo}</td>
          <td className="px-2 py-1.5 text-[#909399]">{r.parentMaterialCode||'-'}</td>
          <td className="px-2 py-1.5 text-[#409eff]">{r.materialCode} {r.materialName}</td>
          <td className="px-2 py-1.5 text-[#909399]">{r.spec||'-'}</td><td className="px-2 py-1.5">{r.unit||'-'}</td>
          <td className="px-2 py-1.5">{r.quantity}</td><td className="px-2 py-1.5">{r.lossRate}%</td>
          <td className="px-2 py-1.5">{r.issueMethod||'-'}</td><td className="px-2 py-1.5 text-[#909399]">{r.warehouseCode||'-'}</td>
          <td className="px-2 py-1.5">{r.processName||'-'}</td><td className="px-2 py-1.5 text-[#909399]">{r.remark||'-'}</td>
        </tr>);
      })}</tbody>
    </table>
    {items.length===0&&<div className="text-center text-[#909399] py-8">暂无子件明细</div>}
  </div>
</FormSection>

<FormSection id="r" title="备注"><FormGrid>
<div className="col-span-2"><FormField label="备注"><Textarea className={`${FI} h-20`} value={f.remark||''} onChange={e=>setF({...f,remark:e.target.value})} disabled={!isEditable} placeholder="BOM备注信息"/></FormField></div>
</FormGrid></FormSection>
</form></FormLayout>);}
