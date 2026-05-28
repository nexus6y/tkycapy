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

const SECTIONS = [
  { id: 'basic', title: '基本信息' },
  { id: 'source', title: '来源关联' },
  { id: 'org', title: '组织与人员' },
  { id: 'detail', title: '金额与交货' },
];

export default function SalesOrderCreate() {
  const router = useRouter();
  const [customers, setCustomers] = useState<any[]>([]);
  const [projects, setProjects] = useState<any[]>([]);
  const [contracts, setContracts] = useState<any[]>([]);
  const [quotations, setQuotations] = useState<any[]>([]);
  const [preOrders, setPreOrders] = useState<any[]>([]);
  const [depts, setDepts] = useState<any[]>([]);

  const [f, setF] = useState<any>({
    orderNo: '', orderName: '', orderType: '',
    customerId: '', customerName: '',
    projectId: '', projectName: '',
    contractId: '', contractName: '',
    quotationId: '', quotationNo: '',
    preOrderId: '', preOrderNo: '',
    departmentName: '', salesperson: '', organizationName: '',
    totalAmount: '', deliveryDate: '', orderDate: new Date().toISOString().split('T')[0],
    remark: '',
  });

  useEffect(() => {
    api.get('/common/next-code', { params: { entity: 'salesOrder' } }).then(r => setF((prev: any) => ({ ...prev, orderNo: r.data.code })));
    api.get('/customers', { params: { pageSize: 999 } }).then(r => setCustomers(r.data.items));
    api.get('/projects', { params: { pageSize: 999 } }).then(r => setProjects(r.data.items));
    api.get('/contracts', { params: { pageSize: 999 } }).then(r => setContracts(r.data.items));
    api.get('/quotations', { params: { pageSize: 999 } }).then(r => setQuotations(r.data.items));
    api.get('/pre-orders', { params: { pageSize: 999 } }).then(r => setPreOrders(r.data.items));
    api.get('/departments', { params: { pageSize: 999 } }).then(r => setDepts(r.data.items));
  }, []);

  const save = async () => {
    if (!f.orderName) return toast('请填写订单名称', 'error');
    const validFields = ['orderNo','orderName','orderType','orderDate','deliveryDate','totalAmount','remark',
      'customerId','customerName','projectId','projectName',
      'contractId','contractName','quotationId','quotationNo',
      'preOrderId','preOrderNo'];
    const payload: any = {};
    validFields.forEach(k => { if (f[k] !== '' && f[k] !== undefined) payload[k] = f[k]; });
    if (payload.totalAmount === '') payload.totalAmount = undefined;
    await api.post('/sales-orders', payload);
    router.push('/sales/order');
  };

  // Helper to find item label by ID from an array
  const label = (arr: any[], id: any, field = 'name') => arr.find(x => x.id === id)?.[field] || id;

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
            <Select value={f.customerId} onValueChange={(v: any) => {
              const c = customers.find(x => x.id === v);
              setF({ ...f, customerId: v, customerName: c?.name || '' });
            }}>
              <SelectTrigger className={FI}><SelectValue placeholder="选择客户">{label(customers, f.customerId)}</SelectValue></SelectTrigger>
              <SelectContent>{customers.map(c => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}</SelectContent>
            </Select>
          </FormField>
          <FormField label="项目">
            <Select value={f.projectId} onValueChange={(v: any) => {
              const p = projects.find(x => x.id === v);
              setF({ ...f, projectId: v, projectName: p?.name || '' });
            }}>
              <SelectTrigger className={FI}><SelectValue placeholder="选择项目（可选）">{label(projects, f.projectId)}</SelectValue></SelectTrigger>
              <SelectContent>{projects.map(p => <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>)}</SelectContent>
            </Select>
          </FormField>
          <FormField label="关联合同">
            <Select value={f.contractId} onValueChange={(v: any) => {
              const c = contracts.find(x => x.id === v);
              setF({ ...f, contractId: v, contractName: c?.name || '' });
            }}>
              <SelectTrigger className={FI}><SelectValue placeholder="选择合同（可选）">{label(contracts, f.contractId)}</SelectValue></SelectTrigger>
              <SelectContent>{contracts.map(c => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}</SelectContent>
            </Select>
          </FormField>
          <FormField label="关联报价单">
            <Select value={f.quotationId} onValueChange={(v: any) => {
              const q = quotations.find(x => x.id === v);
              setF({ ...f, quotationId: v, quotationNo: q?.quotationNo || '' });
            }}>
              <SelectTrigger className={FI}><SelectValue placeholder="选择报价单（可选）">{label(quotations, f.quotationId, 'quotationName')}</SelectValue></SelectTrigger>
              <SelectContent>{quotations.map(q => <SelectItem key={q.id} value={q.id}>{q.quotationName}</SelectItem>)}</SelectContent>
            </Select>
          </FormField>
          <FormField label="关联分劈单">
            <Select value={f.preOrderId} onValueChange={(v: any) => {
              const p = preOrders.find(x => x.id === v);
              setF({ ...f, preOrderId: v, preOrderNo: p?.orderNo || '' });
            }}>
              <SelectTrigger className={FI}><SelectValue placeholder="选择分劈单（可选）">{label(preOrders, f.preOrderId, 'orderName')}</SelectValue></SelectTrigger>
              <SelectContent>{preOrders.map(p => <SelectItem key={p.id} value={p.id}>{p.orderName}</SelectItem>)}</SelectContent>
            </Select>
          </FormField>
        </FormGrid>
      </FormSection>

      <FormSection id="org" title="组织与人员">
        <FormGrid>
          <FormField label="销售部门">
            <Select value={f.departmentName} onValueChange={(v: any) => setF({ ...f, departmentName: v })}>
              <SelectTrigger className={FI}><SelectValue placeholder="选择部门（可选）">{f.departmentName}</SelectValue></SelectTrigger>
              <SelectContent>{depts.map(d => <SelectItem key={d.id} value={d.name}>{d.name}</SelectItem>)}</SelectContent>
            </Select>
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
            <Input type="number" className={FI} value={f.totalAmount} onChange={e => setF({ ...f, totalAmount: e.target.value })} placeholder="0.00" />
          </FormField>
          <FormField label="交货日期">
            <Input type="date" className={FI} value={f.deliveryDate} onChange={e => setF({ ...f, deliveryDate: e.target.value })} />
          </FormField>
        </FormGrid>
      </FormSection>

    </FormLayout>
  );
}
