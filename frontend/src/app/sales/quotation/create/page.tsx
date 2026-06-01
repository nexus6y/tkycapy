'use client';
import { useEffect, useState } from 'react';import { useRouter } from 'next/navigation';import api from '@/lib/api';
import { Input } from '@/components/ui/input';import { toast } from '@/components/ui/toast';
import { FormLayout,FormSection,FormGrid,FormField } from '@/components/form/form-layout';
import { LinesEditor, LineItem } from '@/components/ui/lines-editor';
import { EntitySelect } from '@/components/form/entity-select';
import { applyCustomerSelection, applyDepartmentSelection } from '@/lib/field-linkage';
import { calcLineAmount, calcTotalFromLines } from '@/lib/calc';
const FI='h-9 rounded-md border border-border bg-background px-3 text-[13px] w-full';

const QT_COLS=[
  {key:'lineNo',label:'行号',width:'60px',type:'number' as const},
  {key:'materialCode',label:'物料编码',width:'120px'},
  {key:'materialName',label:'物料名称',width:'120px'},
  {key:'spec',label:'规格型号',width:'100px'},
  {key:'unit',label:'单位',width:'60px'},
  {key:'quantity',label:'数量',width:'80px',type:'number' as const},
  {key:'unitPrice',label:'单价',width:'80px',type:'number' as const},
  {key:'amount',label:'金额',width:'100px',type:'number' as const},
  {key:'deliveryDate',label:'交期',width:'110px',type:'date' as const},
  {key:'warehouseCode',label:'仓库',width:'100px'},
];

export default function QuotationCreate(){const router=useRouter();
const [lines,setLines]=useState<LineItem[]>([]);
useEffect(()=>{api.get('/common/next-code',{params:{entity:'quotation'}}).then(r=>setF((prev:any)=>({...prev,quotationNo:r.data.code})));},[]);
const [f,setF]=useState({
  quotationNo:'',quotationName:'',
  customerId:'',customerCode:'',customerName:'',contactPerson:'',contactPhone:'',contactEmail:'',address:'',
  departmentId:'',departmentCode:'',departmentName:'',
  responsibleName:'',validUntil:'',totalAmount:'',remark:'',
});

const save=async()=>{
  const payload:any={...f};
  // Remove contact fields that don't belong in quotation model
  delete payload.contactPerson;delete payload.contactPhone;delete payload.contactEmail;delete payload.address;
  if(lines.length>0){
    payload.lines=lines;
    payload.totalAmount=calcTotalFromLines(lines);
  }
  await api.post('/quotations',payload);router.push('/sales/quotation');
};

return(<FormLayout title="新增报价单" onSave={save} sections={[{id:'b',title:'报价单信息'},{id:'c',title:'客户信息'},{id:'l',title:'报价明细'}]} activeSection="b">
<FormSection id="b" title="报价单信息"><FormGrid>
<FormField label="报价单号"><Input className={FI} value={f.quotationNo} readOnly disabled/></FormField>
<FormField label="报价名称" required><Input className={FI} value={f.quotationName} onChange={e=>setF({...f,quotationName:e.target.value})}/></FormField>
<FormField label="报价部门">
  <EntitySelect entity="department" value={f.departmentId}
    onChange={(id,d)=>{const fill=applyDepartmentSelection(d);setF(prev=>({...prev,...fill}));}}/></FormField>
<FormField label="负责人"><Input className={FI} value={f.responsibleName} onChange={e=>setF({...f,responsibleName:e.target.value})}/></FormField>
<FormField label="有效期至"><Input type="date" className={FI} value={f.validUntil} onChange={e=>setF({...f,validUntil:e.target.value})}/></FormField>
<FormField label="金额"><Input className={FI} value={lines.length>0?calcTotalFromLines(lines):f.totalAmount} placeholder="自动=明细合计" readOnly disabled/></FormField>
<div className="col-span-2"><FormField label="备注"><Input className={FI} value={f.remark} onChange={e=>setF({...f,remark:e.target.value})}/></FormField></div>
</FormGrid></FormSection>

<FormSection id="c" title="客户信息"><FormGrid>
<FormField label="客户" required>
  <EntitySelect entity="customer" value={f.customerId}
    onChange={(id,c)=>{const fill=applyCustomerSelection(c);setF(prev=>({...prev,...fill}));}}/></FormField>
<FormField label="客户编码"><Input className={FI} value={f.customerCode} readOnly disabled/></FormField>
<FormField label="联系人"><Input className={FI} value={f.contactPerson} onChange={e=>setF({...f,contactPerson:e.target.value})}/></FormField>
<FormField label="联系电话"><Input className={FI} value={f.contactPhone} onChange={e=>setF({...f,contactPhone:e.target.value})}/></FormField>
<FormField label="邮箱"><Input className={FI} value={f.contactEmail} onChange={e=>setF({...f,contactEmail:e.target.value})}/></FormField>
<div className="col-span-2"><FormField label="地址"><Input className={FI} value={f.address} onChange={e=>setF({...f,address:e.target.value})}/></FormField></div>
</FormGrid></FormSection>

<FormSection id="l" title="报价明细"><LinesEditor lines={lines} onChange={setLines} columns={QT_COLS}/></FormSection>
</FormLayout>);}
