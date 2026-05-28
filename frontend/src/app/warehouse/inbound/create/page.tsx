'use client';import { useEffect, useState } from 'react';import { useRouter } from 'next/navigation';import api from '@/lib/api';import { Input } from '@/components/ui/input';import { Select,SelectContent,SelectItem,SelectTrigger,SelectValue } from '@/components/ui/select';import { Textarea } from '@/components/ui/textarea';import { FormLayout,FormSection,FormGrid,FormField } from '@/components/form/form-layout';import { toast } from '@/components/ui/toast';
const FI='h-9 rounded-md border border-border bg-background px-3 text-[13px] w-full';
export default function ICreate(){const router=useRouter();
const [materials,setMaterials]=useState<any[]>([]);const [zones,setZones]=useState<any[]>([]);const [suppliers,setSuppliers]=useState<any[]>([]);
const [f,setF]=useState({orderNo:'',sourceType:'PURCHASE',sourceNo:'',supplierName:'',supplierId:'',materialName:'',materialId:'',specification:'',quantity:'',warehouseName:'',zoneId:'',unitPrice:'',totalAmount:'',remark:''});
useEffect(()=>{
api.get('/common/next-code',{params:{entity:'inboundOrder'}}).then(r=>setF((prev:any)=>({...prev,orderNo:r.data.code})));
api.get('/materials',{params:{pageSize:999}}).then(r=>setMaterials(r.data.items));
api.get('/zones',{params:{pageSize:999}}).then(r=>setZones(r.data.items));
api.get('/suppliers',{params:{pageSize:999}}).then(r=>setSuppliers(r.data.items));
},[]);
const label=(arr:any[],id:any,f='name')=>arr.find(x=>x.id===id)?.[f]||id;
const save=async()=>{
if(!f.materialName)return toast('请选择物料','error');
if(!f.quantity)return toast('请填写数量','error');
const p:any={...f};['materialId','zoneId','supplierId'].forEach(k=>delete p[k]);
if(p.totalAmount==='')p.totalAmount=undefined;
await api.post('/inbound-orders',p);router.push('/warehouse/inbound');
};
return(<FormLayout title="新增入库单" onSave={save} sections={[{id:'b',title:'入库信息'},{id:'s',title:'来源信息'}]} activeSection="b">
<FormSection id="b" title="入库信息"><FormGrid>
<FormField label="入库单号"><Input className={FI} value={f.orderNo} readOnly disabled/></FormField>
<FormField label="物料" required>
<Select value={f.materialId} onValueChange={(v:any)=>{const m=materials.find(x=>x.id===v);setF({...f,materialId:v,materialName:m?.name||'',specification:m?.specification||''});}}>
<SelectTrigger className={FI}><SelectValue placeholder="选择物料">{label(materials,f.materialId)}</SelectValue></SelectTrigger>
<SelectContent>{materials.map(m=><SelectItem key={m.id} value={m.id}>{m.name}</SelectItem>)}</SelectContent></Select></FormField>
<FormField label="规格型号"><Input className={FI} value={f.specification} readOnly disabled/></FormField>
<FormField label="数量" required><Input type="number" className={FI} value={f.quantity} onChange={e=>setF({...f,quantity:e.target.value})} placeholder="0"/></FormField>
<FormField label="仓库">
<Select value={f.zoneId} onValueChange={(v:any)=>{const z=zones.find(x=>x.id===v);setF({...f,zoneId:v,warehouseName:z?.name||''});}}>
<SelectTrigger className={FI}><SelectValue placeholder="选择仓库">{label(zones,f.zoneId)}</SelectValue></SelectTrigger>
<SelectContent>{zones.map(z=><SelectItem key={z.id} value={z.id}>{z.name}</SelectItem>)}</SelectContent></Select></FormField>
<FormField label="单价"><Input type="number" className={FI} value={f.unitPrice} onChange={e=>setF({...f,unitPrice:e.target.value})} placeholder="0.00"/></FormField>
<FormField label="金额"><Input type="number" className={FI} value={f.totalAmount} onChange={e=>setF({...f,totalAmount:e.target.value})} placeholder="自动=数量×单价"/></FormField>
<div className="col-span-2"><FormField label="备注"><Textarea className={`${FI} h-20`} value={f.remark} onChange={e=>setF({...f,remark:e.target.value})}/></FormField></div>
</FormGrid></FormSection>
<FormSection id="s" title="来源信息"><FormGrid>
<FormField label="来源类型">
<Select value={f.sourceType} onValueChange={(v:any)=>setF({...f,sourceType:v})}>
<SelectTrigger className={FI}><SelectValue/></SelectTrigger>
<SelectContent><SelectItem value="PURCHASE">采购入库</SelectItem><SelectItem value="INSPECTION">质检入库</SelectItem><SelectItem value="PRODUCTION">生产入库</SelectItem><SelectItem value="OTHER">其他</SelectItem></SelectContent></Select></FormField>
<FormField label="来源单号"><Input className={FI} value={f.sourceNo} onChange={e=>setF({...f,sourceNo:e.target.value})} placeholder="输入来源单号"/></FormField>
<FormField label="供应商">
<Select value={f.supplierId} onValueChange={(v:any)=>{const s=suppliers.find(x=>x.id===v);setF({...f,supplierId:v,supplierName:s?.name||''});}}>
<SelectTrigger className={FI}><SelectValue placeholder="选择供应商">{label(suppliers,f.supplierId)}</SelectValue></SelectTrigger>
<SelectContent>{suppliers.map(s=><SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>)}</SelectContent></Select></FormField>
</FormGrid></FormSection>
</FormLayout>);}
