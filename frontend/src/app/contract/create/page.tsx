'use client';
import { useEffect, useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
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
import { Plus, Search, Trash2, Upload, X } from 'lucide-react';

const FI = 'h-9 rounded-md border border-border bg-background px-3 text-[13px] w-full';
const CB = 'h-4 w-4 rounded border-border accent-[#409eff]';

/* ====== Types ====== */
interface PaymentPlanRow { lineNo: number; amount: string; planDate: string; ratio: string; remark: string; }
interface ContractLineRow { lineNo: number; materialId: string; materialCode: string; materialName: string; specification: string; unit: string; quantity: string; unitPrice: string; amount: string; remark: string; }
interface AttachmentRow { id?: string; description: string; fileName: string; fileUrl: string; fileId: string; size?: number; }

function emptyPlan(n: number): PaymentPlanRow { return { lineNo: n, amount: '', planDate: '', ratio: '', remark: '' }; }
function emptyLine(n: number): ContractLineRow { return { lineNo: n, materialId: '', materialCode: '', materialName: '', specification: '', unit: '', quantity: '', unitPrice: '', amount: '', remark: '' }; }

const REQUIRED_MAIN = new Set(['name', 'type', 'currencyType', 'receiptPaymentMethod', 'amountType', 'effectiveDate', 'undertakingDepartmentName', 'undertakerName']);

export default function ContractCreate() {
  const router = useRouter();
  const fileRef = useRef<HTMLInputElement>(null);

  const [f, setF] = useState<any>({
    code: '', name: '', type: '销售合同', isProjectContract: false, isFrameworkContract: false,
    projectId: '', projectCode: '', projectName: '',
    customerId: '', customerCode: '', customerName: '',
    supplierId: '', supplierCode: '', supplierName: '',
    organizationId: '', organizationName: '', category: '', purchaseMethod: '',
    currencyType: '人民币', receiptPaymentMethod: '', amountType: '',
    totalAmount: '', taxMonth: '', performanceBond: '', performanceMode: '', performanceLocation: '',
    effectiveDate: '', signDate: '', signUrl: '',
    undertakingDepartmentId: '', undertakingDepartmentName: '', undertakerName: '', undertakerPhone: '',
    qualityRequirement: '', warrantyPeriod: '', disputeResolution: '', liabilityForBreach: '',
    internalCode: '', legalCode: '',
    startDate: '', endDate: '',
    remark: '',
  });

  const [plans, setPlans] = useState<PaymentPlanRow[]>([]);
  const [lines, setLines] = useState<ContractLineRow[]>([]);
  const [attachments, setAttachments] = useState<AttachmentRow[]>([]);
  const [hideOptional, setHideOptional] = useState(false);
  const [matPickerIdx, setMatPickerIdx] = useState<number | null>(null);

  // auto code
  useEffect(() => { api.get('/common/next-code', { params: { entity: 'contract' } }).then(r => setF((prev: any) => ({ ...prev, code: r.data.code }))); }, []);

  const isSales = f.type === '销售合同';

  /* ====== Payment Plan Helpers ====== */
  const addPlan = () => setPlans(p => [...p, emptyPlan(p.length + 1)]);
  const delPlan = (i: number) => setPlans(p => p.filter((_, idx) => idx !== i).map((r, j) => ({ ...r, lineNo: j + 1 })));
  const updPlan = (i: number, patch: Partial<PaymentPlanRow>) => {
    setPlans(p => p.map((r, idx) => {
      if (idx !== i) return r;
      const updated = { ...r, ...patch };
      const totalAmt = Number(f.totalAmount || 0);
      if (patch.ratio !== undefined && totalAmt > 0) {
        updated.amount = (totalAmt * Number(patch.ratio || 0) / 100).toFixed(2);
      } else if (patch.amount !== undefined && totalAmt > 0) {
        updated.ratio = (Number(patch.amount || 0) / totalAmt * 100).toFixed(2);
      }
      return updated;
    }));
  };

  /* ====== Contract Line Helpers ====== */
  const addLine = () => setLines(l => [...l, emptyLine(l.length + 1)]);
  const delLine = (i: number) => setLines(l => l.filter((_, idx) => idx !== i).map((r, j) => ({ ...r, lineNo: j + 1 })));
  const updLine = (i: number, patch: Partial<ContractLineRow>) => {
    setLines(l => l.map((r, idx) => {
      if (idx !== i) return r;
      const updated = { ...r, ...patch };
      const qty = Number(updated.quantity || 0);
      const price = Number(updated.unitPrice || 0);
      updated.amount = (qty * price).toFixed(2);
      return updated;
    }));
  };
  const onMaterialSelect = (i: number, _id: string, m: any) => {
    const fill = applyMaterialSelection(m);
    updLine(i, {
      materialId: fill.materialId || '',
      materialCode: fill.materialCode || '',
      materialName: fill.materialName || '',
      specification: fill.specification || '',
      unit: fill.unit || '',
    });
  };

  /* ====== Attachment ====== */
  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const formData = new FormData();
    formData.append('file', file);
    try {
      const { data } = await api.post('/contracts/upload', formData, { headers: { 'Content-Type': 'multipart/form-data' } });
      setAttachments(a => [...a, { description: '', fileName: data.fileName, fileUrl: data.fileUrl, fileId: data.fileId, size: data.size }]);
      toast('上传成功', 'success');
    } catch (e: any) { toast(e.response?.data?.message || '上传失败', 'error'); }
    if (fileRef.current) fileRef.current.value = '';
  };
  const delAttachment = (i: number) => setAttachments(a => a.filter((_, idx) => idx !== i));
  const updAttachment = (i: number, desc: string) => setAttachments(a => a.map((r, idx) => idx === i ? { ...r, description: desc } : r));

  /* ====== Field Helpers ====== */
  const isRequired = (key: string) => REQUIRED_MAIN.has(key);
  const showField = (key: string, val: any) => !hideOptional || isRequired(key) || (val !== '' && val !== false && val !== null);

  /* ====== Save ====== */
  const save = async () => {
    // Validate main
    if (!f.name) return toast('请输入合同名称', 'error');
    if (!f.type) return toast('请选择合同类型', 'error');
    if (isSales && !f.customerId) return toast('请选择客户', 'error');
    if (!isSales && !f.supplierId) return toast('请选择供应商', 'error');
    // Validate payment plans
    if (plans.length > 0) {
      const ratioSum = plans.reduce((s, r) => s + Number(r.ratio || 0), 0);
      if (ratioSum > 0 && Math.abs(ratioSum - 100) > 0.01) {
        const ok = confirm(`收付费计划比例合计为 ${ratioSum.toFixed(1)}%，不是 100%，是否继续保存？`);
        if (!ok) return;
      }
      for (const p of plans) {
        if (!p.amount || Number(p.amount) <= 0) return toast(`收付费计划第${p.lineNo}行：金额必须大于0`, 'error');
        if (!p.planDate) return toast(`收付费计划第${p.lineNo}行：请选择计划时间`, 'error');
      }
    }
    // Validate lines
    for (const l of lines) {
      if (!l.materialId) return toast(`合同明细第${l.lineNo}行：请选择物资`, 'error');
      if (!l.quantity || Number(l.quantity) <= 0) return toast(`合同明细第${l.lineNo}行：数量必须大于0`, 'error');
    }

    try {
      // Clean counterparty fields based on type
      const payload: any = { ...f };
      if (isSales) {
        delete payload.supplierId; delete payload.supplierCode; delete payload.supplierName;
      } else {
        delete payload.customerId; delete payload.customerCode; delete payload.customerName;
      }
      payload.paymentPlans = plans;
      payload.lines = lines.map(l => ({
        lineNo: l.lineNo, materialId: l.materialId, materialCode: l.materialCode,
        materialName: l.materialName, specification: l.specification, unit: l.unit,
        quantity: l.quantity, unitPrice: l.unitPrice, amount: l.amount, remark: l.remark,
      }));
      payload.attachments = attachments;
      await api.post('/contracts', payload);
      toast('保存成功', 'success');
      router.push('/contract');
    } catch (e: any) { toast(e.response?.data?.message || '保存失败', 'error'); }
  };

  /* ====== Computed ====== */
  const planTotalAmount = plans.reduce((s, r) => s + Number(r.amount || 0), 0);
  const planTotalRatio = plans.reduce((s, r) => s + Number(r.ratio || 0), 0);
  const lineTotalAmount = lines.reduce((s, r) => s + Number(r.amount || 0), 0);

  /* ====== Render ====== */
  const sections = [
    { id: 'basic', title: '基本信息' },
    { id: 'counterparty', title: '相对方信息' },
    { id: 'plans', title: '收/付费计划' },
    { id: 'lines', title: '合同明细' },
    { id: 'attachments', title: '附件' },
  ];

  const fv = (key: string) => f[key] ?? '';

  return (
    <FormLayout title="新增合同" onSave={save} sections={sections} activeSection="basic">
      {/* ========== 基本信息 ========== */}
      <FormSection id="basic" title="基本信息" collapsible extra={
        <label className="flex items-center gap-1.5 text-[12px] text-muted-foreground cursor-pointer select-none">
          <input type="checkbox" className={CB} checked={hideOptional} onChange={e => setHideOptional(e.target.checked)} />
          隐藏非必填项
        </label>
      }>
        <FormGrid cols={3}>
          {showField('code', f.code) && <FormField label="合同编码" required><Input className={FI} value={f.code} readOnly disabled /></FormField>}
          {showField('name', f.name) && <FormField label="合同名称" required><Input className={FI} value={f.name} onChange={e => setF({ ...f, name: e.target.value })} data-testid="contract-name-input" /></FormField>}
          {showField('type', f.type) && <FormField label="合同类型" required>
            <Select value={f.type} onValueChange={(v: any) => setF({ ...f, type: v })}>
              <SelectTrigger className={FI} data-testid="contract-type-select"><SelectValue /></SelectTrigger>
              <SelectContent><SelectItem value="销售合同">销售合同</SelectItem><SelectItem value="采购合同">采购合同</SelectItem></SelectContent>
            </Select>
          </FormField>}
          {showField('isProjectContract', f.isProjectContract) && <FormField label="是否项目合同">
            <label className="flex items-center gap-2 h-9"><input type="checkbox" className={CB} checked={!!f.isProjectContract} onChange={e => setF({ ...f, isProjectContract: e.target.checked })} /><span className="text-[13px]">是</span></label>
          </FormField>}
          {showField('isFrameworkContract', f.isFrameworkContract) && <FormField label="是否框架合同">
            <label className="flex items-center gap-2 h-9"><input type="checkbox" className={CB} checked={!!f.isFrameworkContract} onChange={e => setF({ ...f, isFrameworkContract: e.target.checked })} /><span className="text-[13px]">是</span></label>
          </FormField>}
          {showField('category', f.category) && <FormField label="合同类别"><Input className={FI} value={fv('category')} onChange={e => setF({ ...f, category: e.target.value })} /></FormField>}
          {showField('projectId', f.projectId) && <FormField label="所属项目">
            <EntityPickerInput entity="project" value={f.projectCode} displayText={f.projectCode ? `${f.projectCode} ${f.projectName}` : ''}
              onChange={(_id: any, p: any) => { const fill = applyProjectSelection(p); setF((prev: any) => ({ ...prev, ...fill })); }} />
          </FormField>}
          {showField('organizationId', f.organizationId) && <FormField label="所属组织">
            <EntityPickerInput entity="department" value={f.organizationName} displayText={f.organizationName}
              onChange={(_id: any, d: any) => setF({ ...f, organizationId: d.id, organizationName: d.name })} />
          </FormField>}
          {showField('purchaseMethod', f.purchaseMethod) && <FormField label="采购方式"><Input className={FI} value={fv('purchaseMethod')} onChange={e => setF({ ...f, purchaseMethod: e.target.value })} placeholder="如：招标采购" /></FormField>}
          {showField('currencyType', f.currencyType) && <FormField label="支付货币类型" required>
            <Select value={f.currencyType} onValueChange={(v: any) => setF({ ...f, currencyType: v })}>
              <SelectTrigger className={FI}><SelectValue /></SelectTrigger>
              <SelectContent><SelectItem value="人民币">人民币</SelectItem><SelectItem value="美元">美元</SelectItem><SelectItem value="欧元">欧元</SelectItem><SelectItem value="日元">日元</SelectItem></SelectContent>
            </Select>
          </FormField>}
          {showField('receiptPaymentMethod', f.receiptPaymentMethod) && <FormField label="收付方式" required>
            <Select value={f.receiptPaymentMethod} onValueChange={(v: any) => setF({ ...f, receiptPaymentMethod: v })}>
              <SelectTrigger className={FI} data-testid="contract-paymentmethod-select"><SelectValue placeholder="请选择" /></SelectTrigger>
              <SelectContent><SelectItem value="一次性付">一次性付</SelectItem><SelectItem value="分期付">分期付</SelectItem><SelectItem value="按进度付">按进度付</SelectItem></SelectContent>
            </Select>
          </FormField>}
          {showField('amountType', f.amountType) && <FormField label="合同金额类型" required>
            <Select value={f.amountType} onValueChange={(v: any) => setF({ ...f, amountType: v })}>
              <SelectTrigger className={FI} data-testid="contract-amounttype-select"><SelectValue placeholder="请选择" /></SelectTrigger>
              <SelectContent><SelectItem value="固定总价">固定总价</SelectItem><SelectItem value="固定单价">固定单价</SelectItem><SelectItem value="可调价">可调价</SelectItem></SelectContent>
            </Select>
          </FormField>}
          {showField('totalAmount', f.totalAmount) && <FormField label="合同总金额" required><Input type="number" className={FI} value={fv('totalAmount')} onChange={e => setF({ ...f, totalAmount: e.target.value })} data-testid="contract-totalamount-input" /></FormField>}
          {showField('taxMonth', f.taxMonth) && <FormField label="缴税年月"><Input type="month" className={FI} value={fv('taxMonth')} onChange={e => setF({ ...f, taxMonth: e.target.value })} /></FormField>}
          {showField('performanceBond', f.performanceBond) && <FormField label="履约保证金"><Input type="number" className={FI} value={fv('performanceBond')} onChange={e => setF({ ...f, performanceBond: e.target.value })} /></FormField>}
          {showField('performanceMode', f.performanceMode) && <FormField label="履约方式"><Input className={FI} value={fv('performanceMode')} onChange={e => setF({ ...f, performanceMode: e.target.value })} /></FormField>}
          {showField('performanceLocation', f.performanceLocation) && <FormField label="履约地点"><Input className={FI} value={fv('performanceLocation')} onChange={e => setF({ ...f, performanceLocation: e.target.value })} /></FormField>}
          {showField('effectiveDate', f.effectiveDate) && <FormField label="生效日期" required><Input type="date" className={FI} value={fv('effectiveDate')} onChange={e => setF({ ...f, effectiveDate: e.target.value })} data-testid="contract-effectivedate-input" /></FormField>}
          {showField('signDate', f.signDate) && <FormField label="签约日期"><Input type="date" className={FI} value={fv('signDate')} onChange={e => setF({ ...f, signDate: e.target.value })} /></FormField>}
          {showField('signUrl', f.signUrl) && <FormField label="签约网址"><Input className={FI} value={fv('signUrl')} onChange={e => setF({ ...f, signUrl: e.target.value })} /></FormField>}
          {showField('warrantyPeriod', f.warrantyPeriod) && <FormField label="质保期限"><Input className={FI} value={fv('warrantyPeriod')} onChange={e => setF({ ...f, warrantyPeriod: e.target.value })} placeholder="如：12个月" /></FormField>}
          {showField('startDate', f.startDate) && <FormField label="开始日期"><Input type="date" className={FI} value={fv('startDate')} onChange={e => setF({ ...f, startDate: e.target.value })} /></FormField>}
          {showField('endDate', f.endDate) && <FormField label="结束日期"><Input type="date" className={FI} value={fv('endDate')} onChange={e => setF({ ...f, endDate: e.target.value })} /></FormField>}
          {showField('undertakingDepartmentId', f.undertakingDepartmentId) && <FormField label="承办部门" required>
            <EntityPickerInput entity="department" value={f.undertakingDepartmentName} displayText={f.undertakingDepartmentName}
              onChange={(_id: any, d: any) => setF({ ...f, undertakingDepartmentId: d.id, undertakingDepartmentName: d.name })} />
          </FormField>}
          {showField('undertakerName', f.undertakerName) && <FormField label="承办人姓名" required><Input className={FI} value={fv('undertakerName')} onChange={e => setF({ ...f, undertakerName: e.target.value })} data-testid="contract-undertaker-input" /></FormField>}
          {showField('undertakerPhone', f.undertakerPhone) && <FormField label="承办人电话"><Input className={FI} value={fv('undertakerPhone')} onChange={e => setF({ ...f, undertakerPhone: e.target.value })} /></FormField>}
          {showField('qualityRequirement', f.qualityRequirement) && <div className="col-span-3"><FormField label="质量要求"><Textarea className="min-h-[60px] rounded-md border border-border bg-background px-3 py-2 text-[13px] w-full" value={fv('qualityRequirement')} onChange={e => setF({ ...f, qualityRequirement: e.target.value })} /></FormField></div>}
          {showField('disputeResolution', f.disputeResolution) && <FormField label="争议解决方式"><Input className={FI} value={fv('disputeResolution')} onChange={e => setF({ ...f, disputeResolution: e.target.value })} /></FormField>}
          {showField('liabilityForBreach', f.liabilityForBreach) && <FormField label="违约责任"><Input className={FI} value={fv('liabilityForBreach')} onChange={e => setF({ ...f, liabilityForBreach: e.target.value })} /></FormField>}
          {showField('internalCode', f.internalCode) && <FormField label="合同编码(内部)"><Input className={FI} value={fv('internalCode')} onChange={e => setF({ ...f, internalCode: e.target.value })} /></FormField>}
          {showField('legalCode', f.legalCode) && <FormField label="合同编码(企法)"><Input className={FI} value={fv('legalCode')} onChange={e => setF({ ...f, legalCode: e.target.value })} /></FormField>}
          {showField('remark', f.remark) && <div className="col-span-3"><FormField label="备注"><Textarea className="min-h-[60px] rounded-md border border-border bg-background px-3 py-2 text-[13px] w-full" value={fv('remark')} onChange={e => setF({ ...f, remark: e.target.value })} /></FormField></div>}
        </FormGrid>
      </FormSection>

      {/* ========== 相对方信息 ========== */}
      <FormSection id="counterparty" title="相对方信息" collapsible>
        <FormGrid cols={3}>
          {isSales ? (
            <>
              <FormField label="客户" required>
                <EntityPickerInput entity="customer" value={f.customerCode}
                  displayText={f.customerCode ? `${f.customerCode} ${f.customerName}` : ''}
                  onChange={(_id: any, c: any) => { const fill = applyCustomerSelection(c); setF((prev: any) => ({ ...prev, ...fill })); }} />
              </FormField>
              <FormField label="客户编号"><Input className={FI} value={f.customerCode || ''} readOnly disabled /></FormField>
              <FormField label="客户名称"><Input className={FI} value={f.customerName || ''} readOnly disabled /></FormField>
            </>
          ) : (
            <>
              <FormField label="供应商" required>
                <EntityPickerInput entity="supplier" value={f.supplierCode}
                  displayText={f.supplierCode ? `${f.supplierCode} ${f.supplierName}` : ''}
                  onChange={(_id: any, s: any) => { const fill = applySupplierSelection(s); setF((prev: any) => ({ ...prev, ...fill })); }} />
              </FormField>
              <FormField label="供应商编号"><Input className={FI} value={f.supplierCode || ''} readOnly disabled /></FormField>
              <FormField label="供应商名称"><Input className={FI} value={f.supplierName || ''} readOnly disabled /></FormField>
            </>
          )}
        </FormGrid>
      </FormSection>

      {/* ========== 收/付费计划 ========== */}
      <FormSection id="plans" title="收/付费计划" collapsible>
        <div className="mb-3">
          <Button variant="secondary" size="sm" type="button" onClick={addPlan} data-testid="contract-add-plan-btn"><Plus className="h-3.5 w-3.5 mr-1" />新增收付费计划</Button>
        </div>
        {plans.length > 0 && (
          <ErpTable>
            <ErpThead>
              <ErpTh className="w-12">序号</ErpTh>
              <ErpTh>金额*</ErpTh>
              <ErpTh>时间*</ErpTh>
              <ErpTh>比例(%)*</ErpTh>
              <ErpTh>备注</ErpTh>
              <ErpTh className="w-16">操作</ErpTh>
            </ErpThead>
            <ErpTbody>
              {plans.map((p, i) => (
                <ErpTr key={i}>
                  <ErpTd className="text-[#909399]">{p.lineNo}</ErpTd>
                  <ErpTd><Input type="number" className="h-8 rounded border border-border bg-background px-2 text-[13px] w-[120px]" value={p.amount} onChange={e => updPlan(i, { amount: e.target.value })} /></ErpTd>
                  <ErpTd><Input type="date" className="h-8 rounded border border-border bg-background px-2 text-[13px] w-[150px]" value={p.planDate} onChange={e => updPlan(i, { planDate: e.target.value })} /></ErpTd>
                  <ErpTd><Input type="number" className="h-8 rounded border border-border bg-background px-2 text-[13px] w-[100px]" value={p.ratio} onChange={e => updPlan(i, { ratio: e.target.value })} /></ErpTd>
                  <ErpTd><Input className="h-8 rounded border border-border bg-background px-2 text-[13px] w-[160px]" value={p.remark} onChange={e => updPlan(i, { remark: e.target.value })} /></ErpTd>
                  <ErpTd><button type="button" onClick={() => delPlan(i)} className="text-[#f56c6c] hover:underline text-[12px]"><Trash2 className="h-3 w-3 inline" /></button></ErpTd>
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
        <div className="mb-3 flex items-center gap-2">
          <Button variant="secondary" size="sm" type="button" onClick={addLine} data-testid="contract-add-line-btn"><Plus className="h-3.5 w-3.5 mr-1" />新增明细</Button>
          <Button variant="outline" size="sm" type="button" onClick={() => { }}>模版下载</Button>
          <Button variant="outline" size="sm" type="button" onClick={() => { }}>导入</Button>
          {lines.length > 0 && <Button variant="outline" size="sm" type="button" onClick={() => setLines([])} className="text-[#f56c6c]">删除全部</Button>}
        </div>
        {lines.length > 0 && (
          <ErpTable>
            <ErpThead>
              <ErpTh className="w-10"><input type="checkbox" className={CB} /></ErpTh>
              <ErpTh className="w-12">序号</ErpTh>
              <ErpTh>物资编号</ErpTh>
              <ErpTh>物资名称</ErpTh>
              <ErpTh>规格型号</ErpTh>
              <ErpTh className="w-[80px]">单位</ErpTh>
              <ErpTh className="w-[100px]">数量</ErpTh>
              <ErpTh className="w-[120px]">单价</ErpTh>
              <ErpTh className="w-[120px]">金额</ErpTh>
              <ErpTh className="w-[120px]">备注</ErpTh>
              <ErpTh className="w-16">操作</ErpTh>
            </ErpThead>
            <ErpTbody>
              {lines.map((l, i) => (
                <ErpTr key={i}>
                  <ErpTd><input type="checkbox" className={CB} /></ErpTd>
                  <ErpTd className="text-[#909399]">{l.lineNo}</ErpTd>
                  <ErpTd>
                    <div className="relative">
                      <input type="text" readOnly value={l.materialCode || ''} placeholder="选择物料"
                        onClick={() => setMatPickerIdx(i)}
                        className="h-8 w-[130px] rounded border border-border bg-background px-2 pr-6 text-[13px] outline-none cursor-pointer focus:border-primary" />
                      <button type="button" onClick={() => setMatPickerIdx(i)}
                        className="absolute right-1 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-primary">
                        <Search className="h-3 w-3" />
                      </button>
                    </div>
                  </ErpTd>
                  <ErpTd><Input className="h-8 rounded border border-border bg-[#f5f7fa] px-2 text-[13px] w-[120px]" value={l.materialName} readOnly /></ErpTd>
                  <ErpTd><Input className="h-8 rounded border border-border bg-[#f5f7fa] px-2 text-[13px] w-[100px]" value={l.specification} readOnly /></ErpTd>
                  <ErpTd><Input className="h-8 rounded border border-border bg-[#f5f7fa] px-2 text-[13px] w-[60px]" value={l.unit} readOnly /></ErpTd>
                  <ErpTd><Input type="number" className="h-8 rounded border border-border bg-background px-2 text-[13px] w-[90px]" value={l.quantity} onChange={e => updLine(i, { quantity: e.target.value })} /></ErpTd>
                  <ErpTd><Input type="number" className="h-8 rounded border border-border bg-background px-2 text-[13px] w-[110px]" value={l.unitPrice} onChange={e => updLine(i, { unitPrice: e.target.value })} /></ErpTd>
                  <ErpTd><Input className="h-8 rounded border border-border bg-[#f5f7fa] px-2 text-[13px] w-[110px]" value={l.amount} readOnly /></ErpTd>
                  <ErpTd><Input className="h-8 rounded border border-border bg-background px-2 text-[13px] w-[100px]" value={l.remark} onChange={e => updLine(i, { remark: e.target.value })} /></ErpTd>
                  <ErpTd><button type="button" onClick={() => delLine(i)} className="text-[#f56c6c] hover:underline"><Trash2 className="h-3.5 w-3.5" /></button></ErpTd>
                </ErpTr>
              ))}
            </ErpTbody>
          </ErpTable>
        )}
        {lines.length === 0 && <div className="py-8 text-center text-[13px] text-muted-foreground">暂无明细数据</div>}
        {lines.length > 0 && (
          <div className="mt-2 text-[13px] text-muted-foreground">
            明细金额合计：<strong className="text-foreground">{lineTotalAmount.toLocaleString('zh-CN', { minimumFractionDigits: 2 })}</strong> 元
            {f.totalAmount && Math.abs(lineTotalAmount - Number(f.totalAmount)) > 0.01 && (
              <span className="text-[#e6a23c] ml-2">（与合同总金额 {Number(f.totalAmount).toLocaleString('zh-CN', { minimumFractionDigits: 2 })} 不一致）</span>
            )}
          </div>
        )}
      </FormSection>

      {/* ========== 附件 ========== */}
      <FormSection id="attachments" title="附件" collapsible>
        <div className="mb-3">
          <input ref={fileRef} type="file" className="hidden" onChange={handleUpload} />
          <Button variant="secondary" size="sm" type="button" onClick={() => fileRef.current?.click()}>
            <Upload className="h-3.5 w-3.5 mr-1" />新增附件
          </Button>
        </div>
        {attachments.length > 0 && (
          <ErpTable>
            <ErpThead>
              <ErpTh>描述</ErpTh>
              <ErpTh>文件名</ErpTh>
              <ErpTh className="w-[80px]">大小</ErpTh>
              <ErpTh className="w-16">操作</ErpTh>
            </ErpThead>
            <ErpTbody>
              {attachments.map((a, i) => (
                <ErpTr key={i}>
                  <ErpTd><Input className="h-8 rounded border border-border bg-background px-2 text-[13px] w-[200px]" value={a.description} onChange={e => updAttachment(i, e.target.value)} placeholder="附件描述" /></ErpTd>
                  <ErpTd><span className="text-[#409eff] text-[13px] cursor-pointer hover:underline">{a.fileName}</span></ErpTd>
                  <ErpTd className="text-[#909399] text-[12px]">{a.size ? `${(a.size / 1024).toFixed(1)}KB` : '-'}</ErpTd>
                  <ErpTd><button type="button" onClick={() => delAttachment(i)} className="text-[#f56c6c] hover:underline"><X className="h-3.5 w-3.5" /></button></ErpTd>
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
