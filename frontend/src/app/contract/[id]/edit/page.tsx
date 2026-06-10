'use client';
import { useEffect, useState, useRef } from 'react';
import { useRouter, useParams } from 'next/navigation';
import api from '@/lib/api';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { toast } from '@/components/ui/toast';
import { FormLayout, FormSection, FormGrid, FormField } from '@/components/form/form-layout';
import { EntityPickerInput } from '@/components/form/entity-picker-input';
import { applyCustomerSelection, applySupplierSelection, applyProjectSelection, applyMaterialSelection } from '@/lib/field-linkage';
import { ErpTable, ErpThead, ErpTh, ErpTbody, ErpTr, ErpTd } from '@/components/ui/erp-table';
import { MaterialPickerDialog } from '@/components/form/material-picker-dialog';
import { Plus, Trash2, Upload, X } from 'lucide-react';

const FI = 'h-9 rounded-md border border-border bg-background px-3 text-[13px] w-full';
const CB = 'h-4 w-4 rounded border-border accent-[#409eff]';

interface PaymentPlanRow { lineNo: number; amount: string; planDate: string; ratio: string; remark: string; }
interface ContractLineRow { lineNo: number; materialId: string; materialCode: string; materialName: string; specification: string; unit: string; quantity: string; unitPrice: string; amount: string; remark: string; }
interface AttachmentRow { id?: string; description: string; fileName: string; fileUrl: string; fileId: string; size?: number; }

function fmtDate(d: string | null | undefined): string {
  if (!d) return '';
  return d.slice(0, 10);
}

const REQUIRED_MAIN = new Set(['name', 'type', 'currencyType', 'receiptPaymentMethod', 'amountType', 'effectiveDate', 'undertakingDepartmentName', 'undertakerName']);

export default function ContractEdit() {
  const router = useRouter(); const { id } = useParams<{ id: string }>();
  const fileRef = useRef<HTMLInputElement>(null);
  const [loading, setLoading] = useState(true);

  const [f, setF] = useState<any>({});
  const [plans, setPlans] = useState<PaymentPlanRow[]>([]);
  const [lines, setLines] = useState<ContractLineRow[]>([]);
  const [attachments, setAttachments] = useState<AttachmentRow[]>([]);
  const [hideOptional, setHideOptional] = useState(false);
  const [matPickerIdx, setMatPickerIdx] = useState<number | null>(null);

  useEffect(() => {
    api.get('/contracts/' + id).then(r => {
      const d = r.data;
      setF(d);
      setPlans((d.paymentPlans || []).map((p: any, i: number) => ({
        lineNo: p.lineNo || i + 1,
        amount: String(p.amount || ''), planDate: fmtDate(p.planDate),
        ratio: String(p.ratio || ''), remark: p.remark || '',
      })));
      setLines((d.lines || []).map((l: any, i: number) => ({
        lineNo: l.lineNo || i + 1,
        materialId: l.materialId || '', materialCode: l.materialCode || '', materialName: l.materialName || '',
        specification: l.specification || '', unit: l.unit || '',
        quantity: String(l.quantity || ''), unitPrice: String(l.unitPrice || ''),
        amount: String(l.amount || ''), remark: l.remark || '',
      })));
      setAttachments((d.attachments || []).map((a: any) => ({
        id: a.id, description: a.description || '', fileName: a.fileName,
        fileUrl: a.fileUrl || '', fileId: a.fileId || '', size: a.size || 0,
      })));
      setLoading(false);
    }).catch(() => { toast('加载失败', 'error'); router.push('/contract'); });
  }, [id]);

  const isSales = f.type === '销售合同';
  const editable = f.approvalStatus === 'DRAFT' || f.approvalStatus === 'REJECTED';

  /* ====== Payment Plans ====== */
  const addPlan = () => setPlans(p => [...p, { lineNo: p.length + 1, amount: '', planDate: '', ratio: '', remark: '' }]);
  const delPlan = (i: number) => setPlans(p => p.filter((_, idx) => idx !== i).map((r, j) => ({ ...r, lineNo: j + 1 })));
  const updPlan = (i: number, patch: Partial<PaymentPlanRow>) => {
    setPlans(p => p.map((r, idx) => {
      if (idx !== i) return r;
      const u = { ...r, ...patch };
      if (patch.ratio !== undefined && Number(f.totalAmount || 0) > 0) u.amount = (Number(f.totalAmount) * Number(patch.ratio || 0) / 100).toFixed(2);
      else if (patch.amount !== undefined && Number(f.totalAmount || 0) > 0) u.ratio = (Number(patch.amount || 0) / Number(f.totalAmount) * 100).toFixed(2);
      return u;
    }));
  };

  /* ====== Contract Lines ====== */
  const addLine = () => setLines(l => [...l, { lineNo: l.length + 1, materialId: '', materialCode: '', materialName: '', specification: '', unit: '', quantity: '', unitPrice: '', amount: '', remark: '' }]);
  const delLine = (i: number) => setLines(l => l.filter((_, idx) => idx !== i).map((r, j) => ({ ...r, lineNo: j + 1 })));
  const updLine = (i: number, patch: Partial<ContractLineRow>) => {
    setLines(l => l.map((r, idx) => {
      if (idx !== i) return r;
      const u = { ...r, ...patch };
      u.amount = (Number(u.quantity || 0) * Number(u.unitPrice || 0)).toFixed(2);
      return u;
    }));
  };
  const onMaterialSelect = (i: number, _id: string, m: any) => {
    const fill = applyMaterialSelection(m);
    updLine(i, { materialId: fill.materialId || '', materialCode: fill.materialCode || '', materialName: fill.materialName || '', specification: fill.specification || '', unit: fill.unit || '' });
  };

  /* ====== Attachments ====== */
  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]; if (!file) return;
    const fd = new FormData(); fd.append('file', file);
    try {
      const { data } = await api.post('/contracts/upload', fd, { headers: { 'Content-Type': 'multipart/form-data' } });
      setAttachments(a => [...a, { description: '', fileName: data.fileName, fileUrl: data.fileUrl, fileId: data.fileId, size: data.size }]);
      toast('上传成功', 'success');
    } catch (e: any) { toast(e.response?.data?.message || '上传失败', 'error'); }
    if (fileRef.current) fileRef.current.value = '';
  };
  const delAttachment = (i: number) => setAttachments(a => a.filter((_, idx) => idx !== i));
  const updAttachment = (i: number, desc: string) => setAttachments(a => a.map((r, idx) => idx === i ? { ...r, description: desc } : r));

  /* ====== Save ====== */
  const save = async () => {
    if (!f.name) return toast('请输入合同名称', 'error');
    if (isSales && !f.customerId) return toast('请选择客户', 'error');
    if (!isSales && !f.supplierId) return toast('请选择供应商', 'error');
    if (plans.length > 0) {
      const rs = plans.reduce((s, r) => s + Number(r.ratio || 0), 0);
      if (rs > 0 && Math.abs(rs - 100) > 0.01) { if (!confirm(`收付费计划比例合计为 ${rs.toFixed(1)}%，不是 100%，是否继续保存？`)) return; }
      for (const p of plans) {
        if (!p.amount || Number(p.amount) <= 0) return toast(`收付费计划第${p.lineNo}行：金额必须大于0`, 'error');
        if (!p.planDate) return toast(`收付费计划第${p.lineNo}行：请选择计划时间`, 'error');
      }
    }
    for (const l of lines) {
      if (!l.materialId) return toast(`合同明细第${l.lineNo}行：请选择物资`, 'error');
      if (!l.quantity || Number(l.quantity) <= 0) return toast(`合同明细第${l.lineNo}行：数量必须大于0`, 'error');
    }
    try {
      const payload: any = { ...f };
      if (isSales) { delete payload.supplierId; delete payload.supplierCode; delete payload.supplierName; }
      else { delete payload.customerId; delete payload.customerCode; delete payload.customerName; }
      payload.paymentPlans = plans.map(p => ({ ...p, amount: String(p.amount), ratio: String(p.ratio) }));
      payload.lines = lines.map(l => ({ lineNo: l.lineNo, materialId: l.materialId, materialCode: l.materialCode, materialName: l.materialName, specification: l.specification, unit: l.unit, quantity: l.quantity, unitPrice: l.unitPrice, amount: l.amount, remark: l.remark }));
      payload.attachments = attachments;
      await api.put('/contracts/' + id, payload);
      toast('保存成功', 'success');
      router.push('/contract');
    } catch (e: any) { toast(e.response?.data?.message || '保存失败', 'error'); }
  };

  const planTotalAmount = plans.reduce((s, r) => s + Number(r.amount || 0), 0);
  const planTotalRatio = plans.reduce((s, r) => s + Number(r.ratio || 0), 0);
  const lineTotalAmount = lines.reduce((s, r) => s + Number(r.amount || 0), 0);

  const fv = (k: string) => f[k] ?? '';
  const isRequired = (k: string) => REQUIRED_MAIN.has(k);
  const showField = (k: string, v: any) => !hideOptional || isRequired(k) || (v !== '' && v !== false && v !== null);

  if (loading) return <div className="h-full flex items-center justify-center text-muted-foreground">加载中...</div>;

  const sections = [
    { id: 'basic', title: '基本信息' }, { id: 'counterparty', title: '相对方信息' },
    { id: 'plans', title: '收/付费计划' }, { id: 'lines', title: '合同明细' }, { id: 'attachments', title: '附件' },
  ];

  const noop = async () => { };

  return (
    <FormLayout title={'编辑合同：' + f.code} onSave={editable ? save : noop} sections={sections} activeSection="basic">
      {!editable && <div className="px-4 py-2 bg-[#fdf6ec] text-[#e6a23c] text-[13px] border border-[#faecd8] rounded">⚠ 合同已提交/审批，不可编辑。如需修改请先撤回或走变更流程。</div>}

      {/* ========== 基本信息 ========== */}
      <FormSection id="basic" title="基本信息" collapsible extra={
        <label className="flex items-center gap-1.5 text-[12px] text-muted-foreground cursor-pointer select-none">
          <input type="checkbox" className={CB} checked={hideOptional} onChange={e => setHideOptional(e.target.checked)} disabled={!editable} />
          隐藏非必填项
        </label>
      }>
        <FormGrid cols={3}>
          {showField('code', f.code) && <FormField label="合同编码" required><Input className={FI} value={f.code} readOnly disabled /></FormField>}
          {showField('name', f.name) && <FormField label="合同名称" required><Input className={FI} value={fv('name')} onChange={e => setF({ ...f, name: e.target.value })} disabled={!editable} data-testid="contract-name-input"/></FormField>}
          {showField('type', f.type) && <FormField label="合同类型" required>
            <Select value={f.type} onValueChange={(v: any) => setF({ ...f, type: v })} disabled={!editable}>
              <SelectTrigger className={FI}><SelectValue /></SelectTrigger>
              <SelectContent><SelectItem value="销售合同">销售合同</SelectItem><SelectItem value="采购合同">采购合同</SelectItem></SelectContent>
            </Select>
          </FormField>}
          {showField('isProjectContract', f.isProjectContract) && <FormField label="是否项目合同">
            <label className="flex items-center gap-2 h-9"><input type="checkbox" className={CB} checked={!!f.isProjectContract} onChange={e => setF({ ...f, isProjectContract: e.target.checked })} disabled={!editable} /><span className="text-[13px]">是</span></label>
          </FormField>}
          {showField('isFrameworkContract', f.isFrameworkContract) && <FormField label="是否框架合同">
            <label className="flex items-center gap-2 h-9"><input type="checkbox" className={CB} checked={!!f.isFrameworkContract} onChange={e => setF({ ...f, isFrameworkContract: e.target.checked })} disabled={!editable} /><span className="text-[13px]">是</span></label>
          </FormField>}
          {showField('category', f.category) && <FormField label="合同类别"><Input className={FI} value={fv('category')} onChange={e => setF({ ...f, category: e.target.value })} disabled={!editable} /></FormField>}
          {showField('projectId', f.projectId) && <FormField label="所属项目">
            <EntityPickerInput entity="project" value={f.projectCode || ''} displayText={f.projectCode ? `${f.projectCode} ${f.projectName || ''}` : ''}
              onChange={(_id: any, p: any) => { const fill = applyProjectSelection(p); setF((prev: any) => ({ ...prev, ...fill })); }} disabled={!editable} />
          </FormField>}
          {showField('organizationId', f.organizationId) && <FormField label="所属组织">
            <EntityPickerInput entity="department" value={f.organizationName || ''} displayText={f.organizationName}
              onChange={(_id: any, d: any) => setF({ ...f, organizationId: d.id, organizationName: d.name })} disabled={!editable} />
          </FormField>}
          {showField('purchaseMethod', f.purchaseMethod) && <FormField label="采购方式"><Input className={FI} value={fv('purchaseMethod')} onChange={e => setF({ ...f, purchaseMethod: e.target.value })} disabled={!editable} /></FormField>}
          {showField('currencyType', f.currencyType) && <FormField label="支付货币类型" required>
            <Select value={f.currencyType} onValueChange={(v: any) => setF({ ...f, currencyType: v })} disabled={!editable}>
              <SelectTrigger className={FI}><SelectValue /></SelectTrigger>
              <SelectContent><SelectItem value="人民币">人民币</SelectItem><SelectItem value="美元">美元</SelectItem><SelectItem value="欧元">欧元</SelectItem><SelectItem value="日元">日元</SelectItem></SelectContent>
            </Select>
          </FormField>}
          {showField('receiptPaymentMethod', f.receiptPaymentMethod) && <FormField label="收付方式" required>
            <Select value={f.receiptPaymentMethod} onValueChange={(v: any) => setF({ ...f, receiptPaymentMethod: v })} disabled={!editable}>
              <SelectTrigger className={FI}><SelectValue placeholder="请选择" /></SelectTrigger>
              <SelectContent><SelectItem value="一次性付">一次性付</SelectItem><SelectItem value="分期付">分期付</SelectItem><SelectItem value="按进度付">按进度付</SelectItem></SelectContent>
            </Select>
          </FormField>}
          {showField('amountType', f.amountType) && <FormField label="合同金额类型" required>
            <Select value={f.amountType} onValueChange={(v: any) => setF({ ...f, amountType: v })} disabled={!editable}>
              <SelectTrigger className={FI}><SelectValue placeholder="请选择" /></SelectTrigger>
              <SelectContent><SelectItem value="固定总价">固定总价</SelectItem><SelectItem value="固定单价">固定单价</SelectItem><SelectItem value="可调价">可调价</SelectItem></SelectContent>
            </Select>
          </FormField>}
          {showField('totalAmount', f.totalAmount) && <FormField label="合同总金额" required><Input type="number" className={FI} value={fv('totalAmount')} onChange={e => setF({ ...f, totalAmount: e.target.value })} disabled={!editable} /></FormField>}
          {showField('taxMonth', f.taxMonth) && <FormField label="缴税年月"><Input type="month" className={FI} value={fv('taxMonth')} onChange={e => setF({ ...f, taxMonth: e.target.value })} disabled={!editable} /></FormField>}
          {showField('performanceBond', f.performanceBond) && <FormField label="履约保证金"><Input type="number" className={FI} value={fv('performanceBond')} onChange={e => setF({ ...f, performanceBond: e.target.value })} disabled={!editable} /></FormField>}
          {showField('performanceMode', f.performanceMode) && <FormField label="履约方式"><Input className={FI} value={fv('performanceMode')} onChange={e => setF({ ...f, performanceMode: e.target.value })} disabled={!editable} /></FormField>}
          {showField('performanceLocation', f.performanceLocation) && <FormField label="履约地点"><Input className={FI} value={fv('performanceLocation')} onChange={e => setF({ ...f, performanceLocation: e.target.value })} disabled={!editable} /></FormField>}
          {showField('effectiveDate', f.effectiveDate) && <FormField label="生效日期" required><Input type="date" className={FI} value={fmtDate(f.effectiveDate)} onChange={e => setF({ ...f, effectiveDate: e.target.value })} disabled={!editable} /></FormField>}
          {showField('signDate', f.signDate) && <FormField label="签约日期"><Input type="date" className={FI} value={fmtDate(f.signDate)} onChange={e => setF({ ...f, signDate: e.target.value })} disabled={!editable} /></FormField>}
          {showField('signUrl', f.signUrl) && <FormField label="签约网址"><Input className={FI} value={fv('signUrl')} onChange={e => setF({ ...f, signUrl: e.target.value })} disabled={!editable} /></FormField>}
          {showField('warrantyPeriod', f.warrantyPeriod) && <FormField label="质保期限"><Input className={FI} value={fv('warrantyPeriod')} onChange={e => setF({ ...f, warrantyPeriod: e.target.value })} disabled={!editable} /></FormField>}
          {showField('startDate', f.startDate) && <FormField label="开始日期"><Input type="date" className={FI} value={fmtDate(f.startDate)} onChange={e => setF({ ...f, startDate: e.target.value })} disabled={!editable} /></FormField>}
          {showField('endDate', f.endDate) && <FormField label="结束日期"><Input type="date" className={FI} value={fmtDate(f.endDate)} onChange={e => setF({ ...f, endDate: e.target.value })} disabled={!editable} /></FormField>}
          {showField('undertakingDepartmentId', f.undertakingDepartmentId) && <FormField label="承办部门" required>
            <EntityPickerInput entity="department" value={f.undertakingDepartmentName || ''} displayText={f.undertakingDepartmentName}
              onChange={(_id: any, d: any) => setF({ ...f, undertakingDepartmentId: d.id, undertakingDepartmentName: d.name })} disabled={!editable} />
          </FormField>}
          {showField('undertakerName', f.undertakerName) && <FormField label="承办人姓名" required><Input className={FI} value={fv('undertakerName')} onChange={e => setF({ ...f, undertakerName: e.target.value })} disabled={!editable} /></FormField>}
          {showField('undertakerPhone', f.undertakerPhone) && <FormField label="承办人电话"><Input className={FI} value={fv('undertakerPhone')} onChange={e => setF({ ...f, undertakerPhone: e.target.value })} disabled={!editable} /></FormField>}
          {showField('qualityRequirement', f.qualityRequirement) && <div className="col-span-3"><FormField label="质量要求"><Textarea className="min-h-[60px] rounded-md border border-border bg-background px-3 py-2 text-[13px] w-full" value={fv('qualityRequirement')} onChange={e => setF({ ...f, qualityRequirement: e.target.value })} disabled={!editable} /></FormField></div>}
          {showField('disputeResolution', f.disputeResolution) && <FormField label="争议解决方式"><Input className={FI} value={fv('disputeResolution')} onChange={e => setF({ ...f, disputeResolution: e.target.value })} disabled={!editable} /></FormField>}
          {showField('liabilityForBreach', f.liabilityForBreach) && <FormField label="违约责任"><Input className={FI} value={fv('liabilityForBreach')} onChange={e => setF({ ...f, liabilityForBreach: e.target.value })} disabled={!editable} /></FormField>}
          {showField('internalCode', f.internalCode) && <FormField label="合同编码(内部)"><Input className={FI} value={fv('internalCode')} onChange={e => setF({ ...f, internalCode: e.target.value })} disabled={!editable} /></FormField>}
          {showField('legalCode', f.legalCode) && <FormField label="合同编码(企法)"><Input className={FI} value={fv('legalCode')} onChange={e => setF({ ...f, legalCode: e.target.value })} disabled={!editable} /></FormField>}
          {showField('remark', f.remark) && <div className="col-span-3"><FormField label="备注"><Textarea className="min-h-[60px] rounded-md border border-border bg-background px-3 py-2 text-[13px] w-full" value={fv('remark')} onChange={e => setF({ ...f, remark: e.target.value })} disabled={!editable} /></FormField></div>}
        </FormGrid>
      </FormSection>

      {/* ========== 相对方信息 ========== */}
      <FormSection id="counterparty" title="相对方信息" collapsible>
        <FormGrid cols={3}>
          {isSales ? (<>
            <FormField label="客户" required>
              <EntityPickerInput entity="customer" value={f.customerCode || ''} displayText={f.customerCode ? `${f.customerCode} ${f.customerName || ''}` : ''}
                onChange={(_id: any, c: any) => { const fill = applyCustomerSelection(c); setF((prev: any) => ({ ...prev, ...fill })); }} disabled={!editable} />
            </FormField>
            <FormField label="客户编号"><Input className={FI} value={f.customerCode || ''} readOnly disabled /></FormField>
            <FormField label="客户名称"><Input className={FI} value={f.customerName || ''} readOnly disabled /></FormField>
          </>) : (<>
            <FormField label="供应商" required>
              <EntityPickerInput entity="supplier" value={f.supplierCode || ''} displayText={f.supplierCode ? `${f.supplierCode} ${f.supplierName || ''}` : ''}
                onChange={(_id: any, s: any) => { const fill = applySupplierSelection(s); setF((prev: any) => ({ ...prev, ...fill })); }} disabled={!editable} />
            </FormField>
            <FormField label="供应商编号"><Input className={FI} value={f.supplierCode || ''} readOnly disabled /></FormField>
            <FormField label="供应商名称"><Input className={FI} value={f.supplierName || ''} readOnly disabled /></FormField>
          </>)}
        </FormGrid>
      </FormSection>

      {/* ========== 收/付费计划 ========== */}
      <FormSection id="plans" title="收/付费计划" collapsible>
        {editable && <div className="mb-3"><Button variant="secondary" size="sm" type="button" onClick={addPlan}><Plus className="h-3.5 w-3.5 mr-1" />新增收付费计划</Button></div>}
        {plans.length > 0 && (
          <ErpTable>
            <ErpThead>
              <ErpTh className="w-12">序号</ErpTh><ErpTh>金额</ErpTh><ErpTh>时间</ErpTh><ErpTh>比例(%)</ErpTh><ErpTh>备注</ErpTh>
              {editable && <ErpTh className="w-16">操作</ErpTh>}
            </ErpThead>
            <ErpTbody>
              {plans.map((p, i) => (
                <ErpTr key={i}>
                  <ErpTd className="text-[#909399]">{p.lineNo}</ErpTd>
                  <ErpTd>{editable ? <Input type="number" className="h-8 rounded border border-border bg-background px-2 text-[13px] w-[120px]" value={p.amount} onChange={e => updPlan(i, { amount: e.target.value })} /> : <span>{Number(p.amount).toLocaleString()}</span>}</ErpTd>
                  <ErpTd>{editable ? <Input type="date" className="h-8 rounded border border-border bg-background px-2 text-[13px] w-[150px]" value={p.planDate} onChange={e => updPlan(i, { planDate: e.target.value })} /> : <span className="text-[13px]">{p.planDate || '-'}</span>}</ErpTd>
                  <ErpTd>{editable ? <Input type="number" className="h-8 rounded border border-border bg-background px-2 text-[13px] w-[100px]" value={p.ratio} onChange={e => updPlan(i, { ratio: e.target.value })} /> : <span>{Number(p.ratio).toFixed(2)}%</span>}</ErpTd>
                  <ErpTd>{editable ? <Input className="h-8 rounded border border-border bg-background px-2 text-[13px] w-[160px]" value={p.remark} onChange={e => updPlan(i, { remark: e.target.value })} /> : <span className="text-[13px]">{p.remark || '-'}</span>}</ErpTd>
                  {editable && <ErpTd><button type="button" onClick={() => delPlan(i)} className="text-[#f56c6c] hover:underline"><Trash2 className="h-3 w-3 inline" /></button></ErpTd>}
                </ErpTr>
              ))}
            </ErpTbody>
          </ErpTable>
        )}
        {plans.length > 0 && (
          <div className="mt-2 flex gap-6 text-[13px] text-muted-foreground">
            <span>金额合计：<strong className="text-foreground">{planTotalAmount.toLocaleString('zh-CN', { minimumFractionDigits: 2 })}</strong> 元</span>
            <span>比例合计：<strong className={Math.abs(planTotalRatio - 100) > 0.01 ? 'text-[#f56c6c]' : 'text-foreground'}>{planTotalRatio.toFixed(2)}</strong>%</span>
          </div>
        )}
      </FormSection>

      {/* ========== 合同明细 ========== */}
      <FormSection id="lines" title="合同明细" collapsible>
        {editable && (
          <div className="mb-3 flex items-center gap-2">
            <Button variant="secondary" size="sm" type="button" onClick={addLine}><Plus className="h-3.5 w-3.5 mr-1" />新增明细</Button>
            <Button variant="outline" size="sm" type="button" onClick={() => { }}>模版下载</Button>
            <Button variant="outline" size="sm" type="button" onClick={() => { }}>导入</Button>
          </div>
        )}
        {lines.length > 0 && (
          <ErpTable>
            <ErpThead>
              <ErpTh className="w-12">序号</ErpTh><ErpTh>物资编号</ErpTh><ErpTh>物资名称</ErpTh><ErpTh>规格型号</ErpTh><ErpTh className="w-[80px]">单位</ErpTh><ErpTh className="w-[100px]">数量</ErpTh><ErpTh className="w-[120px]">单价</ErpTh><ErpTh className="w-[120px]">金额</ErpTh><ErpTh>备注</ErpTh>
              {editable && <ErpTh className="w-16">操作</ErpTh>}
            </ErpThead>
            <ErpTbody>
              {lines.map((l, i) => (
                <ErpTr key={i}>
                  <ErpTd className="text-[#909399]">{l.lineNo}</ErpTd>
                  <ErpTd>
                    {editable ? (
                      <div className="relative">
                        <input type="text" readOnly value={l.materialCode || ''} placeholder="选择物料"
                          onClick={() => setMatPickerIdx(i)}
                          className="h-8 w-[130px] rounded border border-border bg-background px-2 pr-6 text-[13px] outline-none cursor-pointer focus:border-primary" />
                        <button type="button" onClick={() => setMatPickerIdx(i)}
                          className="absolute right-1 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-primary">
                          <Plus className="h-3 w-3" />
                        </button>
                      </div>
                    ) : <span className="text-[#409eff]">{l.materialCode || '-'}</span>}
                  </ErpTd>
                  <ErpTd>{editable ? <Input className="h-8 rounded border border-border bg-[#f5f7fa] px-2 text-[13px] w-[120px]" value={l.materialName} readOnly /> : l.materialName || '-'}</ErpTd>
                  <ErpTd>{editable ? <Input className="h-8 rounded border border-border bg-[#f5f7fa] px-2 text-[13px] w-[100px]" value={l.specification} readOnly /> : <span className="text-[#909399]">{l.specification || '-'}</span>}</ErpTd>
                  <ErpTd>{editable ? <Input className="h-8 rounded border border-border bg-[#f5f7fa] px-2 text-[13px] w-[60px]" value={l.unit} readOnly /> : l.unit || '-'}</ErpTd>
                  <ErpTd>{editable ? <Input type="number" className="h-8 rounded border border-border bg-background px-2 text-[13px] w-[90px]" value={l.quantity} onChange={e => updLine(i, { quantity: e.target.value })} /> : <span>{l.quantity || '-'}</span>}</ErpTd>
                  <ErpTd>{editable ? <Input type="number" className="h-8 rounded border border-border bg-background px-2 text-[13px] w-[110px]" value={l.unitPrice} onChange={e => updLine(i, { unitPrice: e.target.value })} /> : <span>{l.unitPrice || '-'}</span>}</ErpTd>
                  <ErpTd><span className="font-medium">{Number(l.amount).toLocaleString('zh-CN', { minimumFractionDigits: 2 })}</span></ErpTd>
                  <ErpTd>{editable ? <Input className="h-8 rounded border border-border bg-background px-2 text-[13px] w-[100px]" value={l.remark} onChange={e => updLine(i, { remark: e.target.value })} /> : <span className="text-[13px]">{l.remark || '-'}</span>}</ErpTd>
                  {editable && <ErpTd><button type="button" onClick={() => delLine(i)} className="text-[#f56c6c] hover:underline"><Trash2 className="h-3.5 w-3.5" /></button></ErpTd>}
                </ErpTr>
              ))}
            </ErpTbody>
          </ErpTable>
        )}
        {lines.length === 0 && <div className="py-8 text-center text-[13px] text-muted-foreground">暂无明细数据</div>}
        {lines.length > 0 && (
          <div className="mt-2 text-[13px] text-muted-foreground">
            明细金额合计：<strong className="text-foreground">{lineTotalAmount.toLocaleString('zh-CN', { minimumFractionDigits: 2 })}</strong> 元
            {f.totalAmount && Math.abs(lineTotalAmount - Number(f.totalAmount)) > 0.01 && <span className="text-[#e6a23c] ml-2">（与合同总金额不一致）</span>}
          </div>
        )}
      </FormSection>

      {/* ========== 附件 ========== */}
      <FormSection id="attachments" title="附件" collapsible>
        {editable && (
          <div className="mb-3">
            <input ref={fileRef} type="file" className="hidden" onChange={handleUpload} />
            <Button variant="secondary" size="sm" type="button" onClick={() => fileRef.current?.click()}><Upload className="h-3.5 w-3.5 mr-1" />新增附件</Button>
          </div>
        )}
        {attachments.length > 0 && (
          <ErpTable>
            <ErpThead><ErpTh>描述</ErpTh><ErpTh>文件名</ErpTh><ErpTh className="w-[80px]">大小</ErpTh>{editable && <ErpTh className="w-16">操作</ErpTh>}</ErpThead>
            <ErpTbody>
              {attachments.map((a, i) => (
                <ErpTr key={i}>
                  <ErpTd>{editable ? <Input className="h-8 rounded border border-border bg-background px-2 text-[13px] w-[200px]" value={a.description} onChange={e => updAttachment(i, e.target.value)} placeholder="附件描述" /> : <span className="text-[13px]">{a.description || '-'}</span>}</ErpTd>
                  <ErpTd><span className="text-[#409eff] text-[13px] cursor-pointer hover:underline">{a.fileName}</span></ErpTd>
                  <ErpTd className="text-[#909399] text-[12px]">{a.size ? `${(a.size / 1024).toFixed(1)}KB` : '-'}</ErpTd>
                  {editable && <ErpTd><button type="button" onClick={() => delAttachment(i)} className="text-[#f56c6c] hover:underline"><X className="h-3.5 w-3.5" /></button></ErpTd>}
                </ErpTr>
              ))}
            </ErpTbody>
          </ErpTable>
        )}
        {attachments.length === 0 && <div className="py-8 text-center text-[13px] text-muted-foreground">暂无附件</div>}
      </FormSection>

        <MaterialPickerDialog
          open={matPickerIdx !== null}
          onOpenChange={(v) => { if (!v) setMatPickerIdx(null); }}
          onConfirm={(m) => { if (matPickerIdx !== null) onMaterialSelect(matPickerIdx, m.id, m); setMatPickerIdx(null); }}
        />
      </FormLayout>
  );
}
