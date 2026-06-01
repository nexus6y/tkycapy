'use client';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import api from '@/lib/api';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { FormLayout, FormSection, FormGrid, FormField } from '@/components/form/form-layout';
import { LinesEditor, LineItem } from '@/components/ui/lines-editor';
import { EntitySelect } from '@/components/form/entity-select';
import { applyCustomerSelection, applyProjectSelection, applyContractSelection, applySourceDocumentSelection, applyDepartmentSelection } from '@/lib/field-linkage';
import { calcTotalFromLines, recalcHeaderTotals } from '@/lib/calc';
import { toast } from '@/components/ui/toast';

const FI = 'h-9 rounded-md border border-border bg-background px-3 text-[13px] w-full';

const SECTIONS = [
  { id: 'basic', title: '基本信息' },
  { id: 'source', title: '来源关联' },
  { id: 'org', title: '组织与人员' },
  { id: 'detail', title: '金额与交货' },
  { id: 'lines', title: '明细信息' },
];

export default function SalesOrderCreate() {
  const router = useRouter();
  const [lines, setLines] = useState<LineItem[]>([]);
  const [quotationLoading, setQuotationLoading] = useState(false);
  const [preOrderLoading, setPreOrderLoading] = useState(false);

  const [f, setF] = useState<any>({
    orderNo: '', orderName: '', orderType: '',
    customerId: '', customerCode: '', customerName: '',
    projectId: '', projectCode: '', projectName: '',
    contractId: '', contractCode: '', contractName: '',
    quotationId: '', quotationNo: '',
    preOrderId: '', preOrderNo: '',
    departmentId: '', departmentCode: '', departmentName: '',
    salesperson: '', organizationName: '',
    totalAmount: '', deliveryDate: '', orderDate: new Date().toISOString().split('T')[0],
    remark: '',
  });

  useEffect(() => {
    api.get('/common/next-code', { params: { entity: 'salesOrder' } }).then(r => setF((prev: any) => ({ ...prev, orderNo: r.data.code })));
  }, []);

  const save = async () => {
    if (!f.orderName) return toast('请填写订单名称', 'error');
    const payload: any = {
      orderNo: f.orderNo, orderName: f.orderName, orderType: f.orderType,
      orderDate: f.orderDate, deliveryDate: f.deliveryDate, remark: f.remark,
      customerId: f.customerId, customerName: f.customerName,
      projectId: f.projectId, projectName: f.projectName,
      contractId: f.contractId, contractName: f.contractName,
      quotationId: f.quotationId, quotationNo: f.quotationNo,
      preOrderId: f.preOrderId, preOrderNo: f.preOrderNo,
    };
    if (lines.length > 0) {
      payload.lines = lines;
      payload.totalAmount = calcTotalFromLines(lines);
    } else if (f.totalAmount) {
      payload.totalAmount = f.totalAmount;
    }
    await api.post('/sales-orders', payload);
    router.push('/sales/order');
  };

  // When lines change, update header totalAmount
  const onLinesChange = (newLines: LineItem[]) => {
    setLines(newLines);
    if (newLines.length > 0) {
      const h = recalcHeaderTotals(newLines);
      setF((prev: any) => ({ ...prev, totalAmount: h.totalAmount }));
    }
  };

  // Source quotation → auto-fill customer + lines
  const onQuotationSelect = async (id: string) => {
    setQuotationLoading(true);
    try {
      const result = await applySourceDocumentSelection('QUOTATION', id, {
        materialCode: 'materialCode', materialName: 'materialName', spec: 'spec', unit: 'unit',
        quantity: 'quantity', unitPrice: 'unitPrice', amount: 'amount', deliveryDate: 'deliveryDate', warehouseCode: 'warehouseCode',
      }, api);
      setF((prev: any) => ({
        ...prev, quotationId: id, quotationNo: result.header.sourceNo || '',
        customerId: result.header.customerId || prev.customerId,
        customerName: result.header.customerName || prev.customerName,
      }));
      if (result.lines.length > 0) onLinesChange(result.lines as LineItem[]);
      toast('已加载报价明细', 'success');
    } catch (e: any) { toast(e.response?.data?.message || '加载失败', 'error'); }
    finally { setQuotationLoading(false); }
  };

  // Source preOrder → auto-fill customer + lines
  const onPreOrderSelect = async (id: string) => {
    setPreOrderLoading(true);
    try {
      const result = await applySourceDocumentSelection('PRE_ORDER', id, {
        materialCode: 'materialCode', materialName: 'materialName', spec: 'spec', unit: 'unit',
        quantity: 'quantity', unitPrice: 'unitPrice', amount: 'amount', deliveryDate: 'deliveryDate', warehouseCode: 'warehouseCode',
      }, api);
      setF((prev: any) => ({
        ...prev, preOrderId: id, preOrderNo: result.header.sourceNo || '',
        customerId: result.header.customerId || prev.customerId,
        customerName: result.header.customerName || prev.customerName,
      }));
      if (result.lines.length > 0) onLinesChange(result.lines as LineItem[]);
      toast('已加载分劈明细', 'success');
    } catch (e: any) { toast(e.response?.data?.message || '加载失败', 'error'); }
    finally { setPreOrderLoading(false); }
  };

  return (
    <FormLayout title="新增销售订单" onSave={save} sections={SECTIONS} activeSection="basic">

      <FormSection id="basic" title="基本信息">
        <FormGrid>
          <FormField label="订单号"><Input className={FI} value={f.orderNo} readOnly disabled /></FormField>
          <FormField label="订单名称" required>
            <Input className={FI} value={f.orderName} onChange={e => setF({ ...f, orderName: e.target.value })} placeholder="输入订单名称" />
          </FormField>
          <FormField label="订单类型">
            <Input className={FI} value={f.orderType} onChange={e => setF({ ...f, orderType: e.target.value })} placeholder="如 标准订单" />
          </FormField>
          <FormField label="订单日期">
            <Input type="date" className={FI} value={f.orderDate} onChange={e => setF({ ...f, orderDate: e.target.value })} />
          </FormField>
          <div className="col-span-2">
            <FormField label="备注">
              <Textarea className={`${FI} h-20`} value={f.remark} onChange={e => setF({ ...f, remark: e.target.value })} placeholder="订单备注" />
            </FormField>
          </div>
        </FormGrid>
      </FormSection>

      <FormSection id="source" title="来源关联">
        <FormGrid>
          <FormField label="客户">
            <EntitySelect entity="customer" value={f.customerId}
              onChange={(id, c) => { setF({ ...f, ...applyCustomerSelection(c) }); }} />
          </FormField>
          <FormField label="项目">
            <EntitySelect entity="project" value={f.projectId}
              onChange={(id, p) => { setF({ ...f, ...applyProjectSelection(p) }); }} />
          </FormField>
          <FormField label="关联合同">
            <EntitySelect entity="contract" value={f.contractId}
              onChange={(id, c) => { setF({ ...f, ...applyContractSelection(c) }); }} />
          </FormField>
          <FormField label="关联报价单">
            <EntitySelect entity="quotation" value={f.quotationId} status="APPROVED"
              onChange={(id) => { setF({ ...f, quotationId: id }); onQuotationSelect(id); }}
              disabled={quotationLoading} />
          </FormField>
          <FormField label="关联分劈单">
            <EntitySelect entity="preOrder" value={f.preOrderId} status="APPROVED"
              onChange={(id) => { setF({ ...f, preOrderId: id }); onPreOrderSelect(id); }}
              disabled={preOrderLoading} />
          </FormField>
        </FormGrid>
      </FormSection>

      <FormSection id="org" title="组织与人员">
        <FormGrid>
          <FormField label="销售部门">
            <EntitySelect entity="department" value={f.departmentId}
              onChange={(id, d) => { setF({ ...f, ...applyDepartmentSelection(d) }); }} />
          </FormField>
          <FormField label="销售负责人">
            <Input className={FI} value={f.salesperson} onChange={e => setF({ ...f, salesperson: e.target.value })} placeholder="输入负责人" />
          </FormField>
          <FormField label="所属组织">
            <Input className={FI} value={f.organizationName} onChange={e => setF({ ...f, organizationName: e.target.value })} placeholder="输入组织名称" />
          </FormField>
        </FormGrid>
      </FormSection>

      <FormSection id="detail" title="金额与交货">
        <FormGrid>
          <FormField label="金额">
            <Input className={FI} value={lines.length > 0 ? calcTotalFromLines(lines) : f.totalAmount}
              placeholder="自动=明细合计" readOnly disabled />
          </FormField>
          <FormField label="交货日期">
            <Input type="date" className={FI} value={f.deliveryDate} onChange={e => setF({ ...f, deliveryDate: e.target.value })} />
          </FormField>
        </FormGrid>
      </FormSection>

      <FormSection id="lines" title="明细信息">
        <LinesEditor lines={lines} onChange={onLinesChange} />
      </FormSection>

    </FormLayout>
  );
}
