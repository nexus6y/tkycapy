'use client';
import { useEffect, useState } from 'react';import { useRouter } from 'next/navigation';import api from '@/lib/api';
import { Input } from '@/components/ui/input';import { Textarea } from '@/components/ui/textarea';
import { FormLayout, FormSection, FormGrid, FormField } from '@/components/form/form-layout';
import { LinesEditor, LineItem } from '@/components/ui/lines-editor';
import { EntitySelect } from '@/components/form/entity-select';
import { applyProjectSelection, applyDepartmentSelection } from '@/lib/field-linkage';
import { calcTotalQtyFromLines } from '@/lib/calc';
import { toast } from '@/components/ui/toast';

const FI = 'h-9 rounded-md border border-border bg-background px-3 text-[13px] w-full';
const SECTIONS = [{ id: 'basic', title: '基本信息' }, { id: 'lines', title: '需求明细' }];

const DP_COLS = [
  { key: 'lineNo', label: '行号', width: '60px', type: 'number' as const },
  { key: 'materialCode', label: '物料编码', width: '120px' },
  { key: 'materialName', label: '物料名称', width: '120px' },
  { key: 'spec', label: '规格型号', width: '100px' },
  { key: 'unit', label: '单位', width: '60px' },
  { key: 'quantity', label: '需求数量', width: '80px', type: 'number' as const },
  { key: 'requiredDate', label: '需求日期', width: '110px', type: 'date' as const },
  { key: 'warehouseCode', label: '仓库', width: '100px' },
];

export default function DemandPlanCreate() {
  const router = useRouter();
  const [lines, setLines] = useState<LineItem[]>([]);

  const [f, setF] = useState<any>({
    planNo: '', planName: '', demandSource: '', demandUse: '',
    projectId: '', projectCode: '', projectName: '',
    departmentId: '', departmentCode: '', departmentName: '',
    requiredDate: '', totalQuantity: '', remark: '',
  });

  useEffect(() => {
    api.get('/common/next-code', { params: { entity: 'demandPlan' } }).then(r => setF((prev: any) => ({ ...prev, planNo: r.data.code })));
  }, []);

  const save = async () => {
    if (!f.planName) return toast('请填写计划名称', 'error');
    const payload: any = { ...f };
    if (lines.length > 0) {
      payload.lines = lines;
      payload.totalQuantity = calcTotalQtyFromLines(lines);
    }
    await api.post('/demand-plans', payload);
    router.push('/ops/demand-plan');
  };

  return (
    <FormLayout title="新增需求计划" onSave={save} sections={SECTIONS} activeSection="basic">
      <FormSection id="basic" title="基本信息">
        <FormGrid>
          <FormField label="计划单号"><Input className={FI} value={f.planNo} readOnly disabled /></FormField>
          <FormField label="计划名称" required><Input className={FI} value={f.planName} onChange={e => setF({ ...f, planName: e.target.value })} placeholder="输入计划名称" /></FormField>
          <FormField label="关联项目"><EntitySelect entity="project" value={f.projectId} onChange={(id,p)=>{setF({...f,...applyProjectSelection(p)});}}/></FormField>
          <FormField label="项目编码">{f.projectCode&&<Input className={FI} value={f.projectCode} readOnly disabled/>}</FormField>
          <FormField label="项目名称">{f.projectName&&<Input className={FI} value={f.projectName} readOnly disabled/>}</FormField>
          <FormField label="需求来源"><Input className={FI} value={f.demandSource} onChange={e => setF({ ...f, demandSource: e.target.value })} placeholder="如 销售订单、库存预警" /></FormField>
          <FormField label="需求用途"><Input className={FI} value={f.demandUse} onChange={e => setF({ ...f, demandUse: e.target.value })} placeholder="如 生产用料、备货" /></FormField>
          <FormField label="需求部门"><EntitySelect entity="department" value={f.departmentId} onChange={(id,d)=>{setF({...f,...applyDepartmentSelection(d)});}}/></FormField>
          <FormField label="部门编码">{f.departmentCode&&<Input className={FI} value={f.departmentCode} readOnly disabled/>}</FormField>
          <FormField label="部门名称">{f.departmentName&&<Input className={FI} value={f.departmentName} readOnly disabled/>}</FormField>
          <FormField label="需求日期"><Input type="date" className={FI} value={f.requiredDate} onChange={e => setF({ ...f, requiredDate: e.target.value })} /></FormField>
          <FormField label="数量"><Input className={FI} value={lines.length>0?calcTotalQtyFromLines(lines):(f.totalQuantity||'')} placeholder="自动=明细合计" readOnly disabled/></FormField>
          <div className="col-span-2"><FormField label="备注"><Textarea className={`${FI} h-20`} value={f.remark} onChange={e => setF({ ...f, remark: e.target.value })} placeholder="备注信息" /></FormField></div>
        </FormGrid>
      </FormSection>

      <FormSection id="lines" title="需求明细">
        <LinesEditor lines={lines} onChange={setLines} columns={DP_COLS} />
        {lines.length > 0 && <p className="text-[12px] text-muted-foreground mt-1">总需求数量: {lines.reduce((s,l)=>s+Number(l.quantity||0),0).toLocaleString()}</p>}
      </FormSection>
    </FormLayout>
  );
}
