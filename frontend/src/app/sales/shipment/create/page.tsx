'use client';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import api from '@/lib/api';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { FormLayout, FormSection, FormGrid, FormField } from '@/components/form/form-layout';
import { toast } from '@/components/ui/toast';

const FI = 'h-9 rounded-md border border-border bg-background px-3 text-[13px] w-full';

export default function ShipmentCreate() {
  const router = useRouter();
  const [orders, setOrders] = useState<any[]>([]);

  const [f, setF] = useState<any>({
    shipmentNo: '', orderId: '', orderNo: '', customerName: '',
    totalQuantity: '', totalAmount: '', shipmentDate: new Date().toISOString().split('T')[0],
  });

  useEffect(() => {
    api.get('/common/next-code', { params: { entity: 'salesShipment' } }).then(r => setF((prev: any) => ({ ...prev, shipmentNo: r.data.code })));
    api.get('/sales-orders', { params: { pageSize: 999, status: 'APPROVED' } }).then(r => setOrders(r.data.items));
  }, []);

  const label = (arr: any[], id: any, field = 'orderNo') => arr.find(x => x.id === id)?.[field] || id;

  const save = async () => {
    if (!f.orderId) return toast('请选择关联订单', 'error');
    if (!f.totalQuantity) return toast('请填写出货数量', 'error');
    const payload: any = {};
    ['shipmentNo','orderId','orderNo','customerName','totalQuantity','totalAmount','shipmentDate'].forEach(k => {
      if (f[k] !== '' && f[k] !== undefined) payload[k] = f[k];
    });
    if (payload.shipmentDate) payload.shipmentDate = new Date(payload.shipmentDate).toISOString();
    await api.post('/sales-shipments', payload);
    router.push('/sales/shipment');
  };

  return (
    <FormLayout title="新增销售出货" onSave={save} sections={[{ id: 'b', title: '出货信息' }]} activeSection="b">
      <FormSection id="b" title="出货信息">
        <FormGrid>
          <FormField label="出货单号">
            <Input className={FI} value={f.shipmentNo} readOnly disabled />
          </FormField>
          <FormField label="关联订单" required>
            <Select value={f.orderId} onValueChange={(v: any) => {
              const o = orders.find(x => x.id === v);
              setF({ ...f, orderId: v, orderNo: o?.orderNo || '', customerName: o?.customerName || '' });
            }}>
              <SelectTrigger className={FI}><SelectValue placeholder="选择销售订单">{label(orders, f.orderId)}</SelectValue></SelectTrigger>
              <SelectContent>
                {orders.map(o => <SelectItem key={o.id} value={o.id}>{o.orderNo} {o.orderName}</SelectItem>)}
              </SelectContent>
            </Select>
          </FormField>
          <FormField label="客户">
            <Input className={FI} value={f.customerName} readOnly disabled />
          </FormField>
          <FormField label="出货日期">
            <Input type="date" className={FI} value={f.shipmentDate} onChange={e => setF({ ...f, shipmentDate: e.target.value })} />
          </FormField>
          <FormField label="数量" required>
            <Input type="number" className={FI} value={f.totalQuantity} onChange={e => setF({ ...f, totalQuantity: e.target.value })} placeholder="0" />
          </FormField>
          <FormField label="金额">
            <Input type="number" className={FI} value={f.totalAmount} onChange={e => setF({ ...f, totalAmount: e.target.value })} placeholder="0.00" />
          </FormField>
        </FormGrid>
      </FormSection>
    </FormLayout>
  );
}
