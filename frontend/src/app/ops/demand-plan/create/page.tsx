'use client';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import api from '@/lib/api';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { FormLayout, FormSection, FormGrid, FormField } from '@/components/form/form-layout';
import { toast } from '@/components/ui/toast';

const FI = 'h-9 rounded-md border border-border bg-background px-3 text-[13px] w-full';
const SECTIONS = [{ id: 'basic', title: '基本信息' }, { id: 'detail', title: '需求明细' }];

export default function DemandPlanCreate() {
  const router = useRouter();
  const [projects, setProjects] = useState<any[]>([]);
  const [materials, setMaterials] = useState<any[]>([]);
  const [depts, setDepts] = useState<any[]>([]);

  const [f, setF] = useState<any>({
    planNo: '', planName: '', demandSource: '', demandUse: '',
    projectId: '', projectName: '',
    materialId: '', materialName: '',
    departmentName: '',
    requiredDate: '', totalQuantity: '', remark: '',
  });

  useEffect(() => {
    api.get('/common/next-code', { params: { entity: 'demandPlan' } }).then(r => setF((prev: any) => ({ ...prev, planNo: r.data.code })));
    api.get('/projects', { params: { pageSize: 999 } }).then(r => setProjects(r.data.items));
    api.get('/materials', { params: { pageSize: 999 } }).then(r => setMaterials(r.data.items));
    api.get('/departments', { params: { pageSize: 999 } }).then(r => setDepts(r.data.items));
  }, []);

  const label = (arr: any[], id: any, field = 'name') => arr.find(x => x.id === id)?.[field] || id;

  const save = async () => {
    if (!f.planName) return toast('请填写计划名称', 'error');
    const validFields = ['planNo', 'planName', 'demandSource', 'demandUse',
      'projectId', 'projectName', 'requiredDate', 'totalQuantity', 'remark'];
    const payload: any = {};
    validFields.forEach(k => { if (f[k] !== '' && f[k] !== undefined) payload[k] = f[k]; });
    await api.post('/demand-plans', payload);
    router.push('/ops/demand-plan');
  };

  return (
    <FormLayout title="新增需求计划" onSave={save} sections={SECTIONS} activeSection="basic">
      <FormSection id="basic" title="基本信息">
        <FormGrid>
          <FormField label="计划单号">
            <Input className={FI} value={f.planNo} readOnly disabled />
          </FormField>
          <FormField label="计划名称" required>
            <Input className={FI} value={f.planName} onChange={e => setF({ ...f, planName: e.target.value })} placeholder="输入计划名称" />
          </FormField>
          <FormField label="关联项目">
            <Select value={f.projectId} onValueChange={(v: any) => {
              const p = projects.find(x => x.id === v);
              setF({ ...f, projectId: v, projectName: p?.name || '' });
            }}>
              <SelectTrigger className={FI}><SelectValue placeholder="选择项目（可选）">{label(projects, f.projectId)}</SelectValue></SelectTrigger>
              <SelectContent>{projects.map(p => <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>)}</SelectContent>
            </Select>
          </FormField>
          <FormField label="需求来源">
            <Input className={FI} value={f.demandSource} onChange={e => setF({ ...f, demandSource: e.target.value })} placeholder="如 销售订单、库存预警" />
          </FormField>
          <FormField label="需求用途">
            <Input className={FI} value={f.demandUse} onChange={e => setF({ ...f, demandUse: e.target.value })} placeholder="如 生产用料、备货" />
          </FormField>
          <FormField label="需求部门">
            <Select value={f.departmentName} onValueChange={(v: any) => setF({ ...f, departmentName: v })}>
              <SelectTrigger className={FI}><SelectValue placeholder="选择部门（可选）">{f.departmentName}</SelectValue></SelectTrigger>
              <SelectContent>{depts.map(d => <SelectItem key={d.id} value={d.name}>{d.name}</SelectItem>)}</SelectContent>
            </Select>
          </FormField>
          <FormField label="需求日期">
            <Input type="date" className={FI} value={f.requiredDate} onChange={e => setF({ ...f, requiredDate: e.target.value })} />
          </FormField>
          <div className="col-span-2">
            <FormField label="备注">
              <Textarea className={`${FI} h-20`} value={f.remark} onChange={e => setF({ ...f, remark: e.target.value })} placeholder="备注信息" />
            </FormField>
          </div>
        </FormGrid>
      </FormSection>

      <FormSection id="detail" title="需求明细">
        <FormGrid>
          <FormField label="需求物料">
            <Select value={f.materialId} onValueChange={(v: any) => {
              const m = materials.find(x => x.id === v);
              setF({ ...f, materialId: v, materialName: m?.name || '' });
            }}>
              <SelectTrigger className={FI}><SelectValue placeholder="选择物料">{label(materials, f.materialId)}</SelectValue></SelectTrigger>
              <SelectContent>{materials.map(m => <SelectItem key={m.id} value={m.id}>{m.name}</SelectItem>)}</SelectContent>
            </Select>
          </FormField>
          <FormField label="需求数量">
            <Input type="number" className={FI} value={f.totalQuantity} onChange={e => setF({ ...f, totalQuantity: e.target.value })} placeholder="0" />
          </FormField>
        </FormGrid>
      </FormSection>
    </FormLayout>
  );
}
