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
  { id:'source', title:'产品来源选择' },
  { id:'product', title:'产品信息' },
  { id:'material', title:'材料信息' },
];

export default function ProductionOrderCreate() {
  const router = useRouter();
  const [f,setF]=useState<any>({
    orderNo:'', orderName:'', businessType:'', orgName:'默认企业',
    departmentId:'', departmentCode:'', departmentName:'',
    sourceId:'', sourceType:'', sourceCode:'', sourceName:'', quantity:'1',
    createdBy:'测试用户', orderDate:new Date().toISOString().split('T')[0], remark:'',
  });
  const [prodLines,setProdLines]=useState<LineItem[]>([]);
  const [matLines,setMatLines]=useState<LineItem[]>([]);
  const [sourceLoading,setSourceLoading]=useState(false);

  /* ── 选择计划：需求计划单 ── */
  const onPlanSelect = async (id:string) => {
    setSourceLoading(true);
    try {
      const {data} = await api.get(`/demand-plans/${id}`,{});
      const plan = data;
      setF((prev:any)=>({...prev,sourceId:id,sourceType:'demandPlan',sourceCode:plan.planNo,sourceName:plan.planName,
        orderName:prev.orderName||`生产-${plan.planName||plan.planNo}`,quantity:plan.totalQuantity||'1'}));
      if (data.lines&&data.lines.length>0) {
        setProdLines(data.lines.map((l:any,i:number)=>({lineNo:l.lineNo??i+1,
          materialCode:l.materialCode||'',materialName:l.materialName||'',
          spec:l.spec||'',unit:l.unit||'',plannedQty:l.quantity||'0',warehouseCode:'',remark:''})));
      }
      toast('已加载需求计划产品明细','success');
    } catch(e:any) { toast(e.response?.data?.message||'加载需求计划失败','error'); }
    finally { setSourceLoading(false); }
  };

  /* ── 选择需求：销售需求单（销售订单） ── */
  const onOrderSelect = async (id:string) => {
    setSourceLoading(true);
    try {
      const {data} = await api.get(`/sales-orders/${id}`);
      const so = data;
      setF((prev:any)=>({...prev,sourceId:id,sourceType:'salesOrder',sourceCode:so.orderNo,sourceName:so.orderName,
        orderName:prev.orderName||`生产-${so.orderName||so.orderNo}`,quantity:String(so.lines?.reduce((s:number,l:any)=>s+Number(l.quantity||0),0)||1)}));
      if (so.lines&&so.lines.length>0) {
        setProdLines(so.lines.map((l:any,i:number)=>({lineNo:l.lineNo??i+1,
          materialCode:l.materialCode||'',materialName:l.materialName||'',
          spec:l.spec||'',unit:l.unit||'',plannedQty:l.quantity||'0',warehouseCode:'',remark:''})));
      }
      toast('已加载销售订单产品明细','success');
    } catch(e:any) { toast(e.response?.data?.message||'加载销售订单失败','error'); }
    finally { setSourceLoading(false); }
  };

  /* ── 选择BOM：物料BOM ── */
  const onBomSelect = async (id:string) => {
    setSourceLoading(true);
    try {
      const qty = Number(f.quantity||1);
      const {data} = await api.get(`/boms/${id}/explode`,{params:{qty}});
      const bom = data.bom;
      setF((prev:any)=>({...prev,sourceId:id,sourceType:'bom',sourceCode:bom.code,sourceName:bom.name,
        orderName:prev.orderName||`生产-${bom.productMaterialName||bom.code}`}));
      setProdLines([{lineNo:1,materialCode:bom.productMaterialCode||'',materialName:bom.productMaterialName||'',
        spec:bom.productSpec||'',unit:bom.productUnit||'',plannedQty:String(qty),warehouseCode:'',remark:''}]);
      if (data.items&&data.items.length>0) {
        setMatLines(data.items.map((item:any)=>({lineNo:item.lineNo,materialCode:item.materialCode,
          materialName:item.materialName,spec:item.spec,unit:item.unit,
          quantity:String(item.requiredQty||item.quantity),warehouseCode:item.warehouseCode||'',remark:''})));
      }
      toast('已从BOM加载产品和材料明细','success');
    } catch(e:any) { toast(e.response?.data?.message||'加载BOM失败','error'); }
    finally { setSourceLoading(false); }
  };

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
      // Map source type to correct payload fields
      if (f.sourceType==='demandPlan') {
        payload.demandPlanId = f.sourceId; payload.demandPlanNo = f.sourceCode;
      } else if (f.sourceType==='salesOrder') {
        // sales order source — no direct field, stored in remark for traceability
        payload.remark = (payload.remark||'') + ` [来源:销售订单${f.sourceCode}]`;
      } else if (f.sourceType==='bom') {
        payload.bomId = f.sourceId;
      }
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
          <FormField label="计划数量">
            <Input type="number" className={FI} value={f.quantity||'1'}
              onChange={e=>setF({...f,quantity:e.target.value})} placeholder="生产数量"/>
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

      {/* 产品来源选择 — 三个互斥来源按钮 */}
      <FormSection id="source" title="产品来源选择">
        <FormGrid>
          <FormField label="选择来源">
            <div className="flex flex-wrap gap-2 pt-1">
              {/* 1) 选择计划：需求计划单 */}
              <EntityPickerInput entity="demandPlan" value={f.sourceType==='demandPlan'?f.sourceCode:''}
                displayText={f.sourceType==='demandPlan'?`${f.sourceCode} ${f.sourceName}`:''}
                status="APPROVED"
                onChange={(id:any)=>{setF({...f,sourceType:''});onPlanSelect(id);}}
                placeholder="选择计划：需求计划单"/>
              {/* 2) 选择需求：销售需求单 */}
              <EntityPickerInput entity="salesOrder" value={f.sourceType==='salesOrder'?f.sourceCode:''}
                displayText={f.sourceType==='salesOrder'?`${f.sourceCode} ${f.sourceName}`:''}
                status="APPROVED"
                onChange={(id:any)=>{setF({...f,sourceType:''});onOrderSelect(id);}}
                placeholder="选择需求：销售需求单"/>
              {/* 3) 选择BOM：物料BOM */}
              <EntityPickerInput entity="bom" value={f.sourceType==='bom'?f.sourceCode:''}
                displayText={f.sourceType==='bom'?`${f.sourceCode} ${f.sourceName}`:''}
                status="APPROVED"
                onChange={(id:any)=>{setF({...f,sourceType:''});onBomSelect(id);}}
                placeholder="选择BOM：物料BOM"/>
            </div>
          </FormField>
          {f.sourceCode && (
            <FormField label="来源单号">
              <Input className={FI} value={`${f.sourceType==='demandPlan'?'需求计划':f.sourceType==='salesOrder'?'销售订单':'BOM'}：${f.sourceCode} ${f.sourceName||''}`} readOnly disabled/>
            </FormField>
          )}
          {sourceLoading && (
            <div className="col-span-2 py-2 text-center text-[13px] text-muted-foreground">正在加载产品明细...</div>
          )}
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
