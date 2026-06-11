'use client';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import api from '@/lib/api';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { toast } from '@/components/ui/toast';
import { FormLayout, FormSection, FormGrid, FormField } from '@/components/form/form-layout';
import { LinesEditor, LineItem } from '@/components/ui/lines-editor';
import { EntityPickerInput } from '@/components/form/entity-picker-input';
import { applyDepartmentSelection } from '@/lib/field-linkage';

const FI = 'h-9 rounded-md border border-border bg-background px-3 text-[13px] w-full';

const PROD_COLS = [
  { key:'lineNo', label:'行号', width:'60px', type:'number' as const },
  { key:'materialCode', label:'物料编码', width:'120px' },
  { key:'materialName', label:'物料名称', width:'120px' },
  { key:'spec', label:'规格型号', width:'100px' },
  { key:'unit', label:'单位', width:'60px' },
  { key:'plannedQty', label:'计划数量', width:'80px', type:'number' as const },
  { key:'warehouseCode', label:'仓库', width:'100px' },
  { key:'remark', label:'备注', width:'100px' },
];

const MAT_COLS = [
  { key:'lineNo', label:'序号', width:'60px', type:'number' as const },
  { key:'materialCode', label:'物料编码', width:'120px' },
  { key:'materialName', label:'物料名称', width:'120px' },
  { key:'spec', label:'规格型号', width:'100px' },
  { key:'unit', label:'单位', width:'60px' },
  { key:'quantity', label:'数量', width:'80px', type:'number' as const },
  { key:'warehouseCode', label:'仓库', width:'100px' },
  { key:'remark', label:'备注', width:'100px' },
];

const SECTIONS = [
  { id:'basic', title:'基本信息' },
  { id:'product', title:'产品信息' },
  { id:'material', title:'材料信息' },
];

export default function ProductionOrderCreate() {
  const router = useRouter();
  const [f,setF]=useState<any>({
    orderNo:'', orderName:'', businessType:'', orgName:'默认企业',
    departmentId:'', departmentCode:'', departmentName:'',
    createdBy:'测试用户', orderDate:new Date().toISOString().split('T')[0], remark:'',
  });
  const [prodLines,setProdLines]=useState<LineItem[]>([]);
  const [matLines,setMatLines]=useState<LineItem[]>([]);

  useEffect(()=>{
    api.get('/common/next-code',{params:{entity:'productionOrder'}})
      .then(r=>setF((prev:any)=>({...prev,orderNo:r.data.code})));
  },[]);

  const save = async () => {
    if (!f.orderName) return toast('请填写生产名称','error');
    if (!f.departmentId) return toast('请选择生产部门','error');
    try {
      const payload:any = {
        orderNo:f.orderNo, orderName:f.orderName,
        departmentId:f.departmentId, departmentName:f.departmentName,
        quantity:String(prodLines.reduce((s,l)=>s+Number(l.plannedQty||0),0)),
        startDate:f.orderDate, remark:f.remark,
      };
      if (prodLines.length>0) payload.lines = prodLines;
      if (matLines.length>0) payload.materials = matLines;
      await api.post('/production-orders',payload);
      router.push('/production/order');
    } catch(e:any) { toast(e.response?.data?.message||'保存失败','error'); }
  };

  return (
    <FormLayout title="新增生产订单" onSave={save} sections={SECTIONS} activeSection="basic">

      <FormSection id="basic" title="基本信息">
        <FormGrid>
          <FormField label="生产编码">
            <Input className={FI} value={f.orderNo} readOnly disabled placeholder="自动生成"/>
          </FormField>
          <FormField label="生产名称" required>
            <Input className={FI} value={f.orderName} onChange={e=>setF({...f,orderName:e.target.value})} placeholder="请输入生产名称"/>
          </FormField>
          <FormField label="业务类型">
            <Select value={f.businessType||'标准生产'} onValueChange={v=>setF({...f,businessType:v})}>
              <SelectTrigger className={FI}><SelectValue/></SelectTrigger>
              <SelectContent>
                <SelectItem value="标准生产">标准生产</SelectItem>
                <SelectItem value="返工生产">返工生产</SelectItem>
                <SelectItem value="委外生产">委外生产</SelectItem>
              </SelectContent>
            </Select>
          </FormField>
          <FormField label="所属组织" required>
            <Input className={FI} value={f.orgName||''} onChange={e=>setF({...f,orgName:e.target.value})} placeholder="所属组织"/>
          </FormField>
          <FormField label="生产部门" required>
            <EntityPickerInput entity="department" value={f.departmentCode}
              displayText={f.departmentCode?`${f.departmentCode} ${f.departmentName}`:''}
              onChange={(id:any,d:any)=>{setF({...f,...applyDepartmentSelection(d)});}}/>
          </FormField>
          <FormField label="制单人">
            <Input className={FI} value={f.createdBy||''} readOnly disabled/>
          </FormField>
          <FormField label="制单日期">
            <Input type="date" className={FI} value={f.orderDate} onChange={e=>setF({...f,orderDate:e.target.value})}/>
          </FormField>
          <div className="col-span-2">
            <FormField label="备注">
              <Textarea className={`${FI} h-20`} value={f.remark} onChange={e=>setF({...f,remark:e.target.value})} placeholder=""/>
            </FormField>
          </div>
        </FormGrid>
      </FormSection>

      <FormSection id="product" title="产品信息">
        <LinesEditor lines={prodLines} onChange={setProdLines} columns={PROD_COLS} materialPicker/>
      </FormSection>

      <FormSection id="material" title="材料信息">
        <LinesEditor lines={matLines} onChange={setMatLines} columns={MAT_COLS} materialPicker/>
      </FormSection>

    </FormLayout>
  );
}
