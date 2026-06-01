'use client';
import { useEffect, useState } from 'react';import { useRouter } from 'next/navigation';import api from '@/lib/api';
import { Input } from '@/components/ui/input';
import { FormLayout, FormSection, FormGrid, FormField } from '@/components/form/form-layout';
import { LinesEditor, LineItem } from '@/components/ui/lines-editor';
import { EntitySelect } from '@/components/form/entity-select';
import { calcTotalFromLines } from '@/lib/calc';
import { toast } from '@/components/ui/toast';

const FI = 'h-9 rounded-md border border-border bg-background px-3 text-[13px] w-full';

const SHIP_COLS = [
  { key: 'lineNo', label: '行号', width: '60px', type: 'number' as const },
  { key: 'materialCode', label: '物料编码', width: '120px' },
  { key: 'materialName', label: '物料名称', width: '120px' },
  { key: 'spec', label: '规格型号', width: '100px' },
  { key: 'unit', label: '单位', width: '60px' },
  { key: 'orderQty', label: '订单数量', width: '80px', type: 'number' as const },
  { key: 'shippedQty', label: '本次发货', width: '80px', type: 'number' as const },
  { key: 'warehouseCode', label: '仓库', width: '100px' },
];

export default function ShipmentCreate() {
  const router=useRouter();
  const [lines, setLines] = useState<LineItem[]>([]);

  const [f, setF] = useState<any>({
    shipmentNo: '', orderId: '', orderNo: '', customerName: '',
    totalQuantity: '', totalAmount: '', shipmentDate: new Date().toISOString().split('T')[0],
  });

  useEffect(() => {
    api.get('/common/next-code', { params: { entity: 'salesShipment' } }).then(r => setF((prev: any) => ({ ...prev, shipmentNo: r.data.code })));
  }, []);

  const onOrderChange = (id: string, doc: any) => {
    setF({ ...f, orderId: id, orderNo: doc.orderNo || '', customerName: doc.customerName || '' });
    if (id) {
      api.get('/sales-orders/' + id).then(r => {
        const soLines = r.data.lines || [];
        if (soLines.length > 0) {
          const newLines = soLines.map((l: any, i: number) => ({
            lineNo: l.lineNo || i + 1, salesOrderLineId: l.id || '',
            materialCode: l.materialCode || '', materialName: l.materialName || '',
            spec: l.spec || '', unit: l.unit || '',
            orderQty: l.quantity || '0', shippedQty: '', warehouseCode: l.warehouseCode || '',
          }));
          setLines(newLines);
          toast('已加载销售订单明细','success');
        } else { setLines([]); }
      }).catch(() => { setLines([]); });
    } else { setLines([]); }
  };

  const save = async () => {
    if (!f.orderId) return toast('请选择关联订单', 'error');
    const payload: any = { shipmentNo: f.shipmentNo, orderId: f.orderId, orderNo: f.orderNo, customerName: f.customerName, shipmentDate: f.shipmentDate };
    const totalQty = lines.reduce((s, l) => s + Number(l.shippedQty || 0), 0);
    payload.totalQuantity = String(totalQty > 0 ? totalQty : f.totalQuantity || '0');
    payload.totalAmount = calcTotalFromLines(lines);
    if (payload.shipmentDate) payload.shipmentDate = new Date(payload.shipmentDate).toISOString();
    if (lines.length > 0) payload.lines = lines;
    await api.post('/sales-shipments', payload);
    router.push('/sales/shipment');
  };

  return (
    <FormLayout title="新增销售出货" onSave={save} sections={[{ id: 'b', title: '出货信息' }, { id: 'l', title: '出货明细' }]} activeSection="b">
      <FormSection id="b" title="出货信息">
        <FormGrid>
          <FormField label="出货单号"><Input className={FI} value={f.shipmentNo} readOnly disabled /></FormField>
          <FormField label="关联订单" required>
            <EntitySelect entity="salesOrder" value={f.orderId} status="APPROVED"
              onChange={(id, doc) => { onOrderChange(id, doc); }} />
          </FormField>
          <FormField label="客户"><Input className={FI} value={f.customerName} readOnly disabled /></FormField>
          <FormField label="出货日期"><Input type="date" className={FI} value={f.shipmentDate} onChange={e => setF({ ...f, shipmentDate: e.target.value })} /></FormField>
          <FormField label="金额"><Input className={FI} value={lines.length>0?calcTotalFromLines(lines):f.totalAmount} placeholder="自动=发货明细合计" readOnly disabled/></FormField>
        </FormGrid>
      </FormSection>
      <FormSection id="l" title="出货明细">
        <LinesEditor lines={lines} onChange={setLines} columns={SHIP_COLS} />
        {lines.length > 0 && <p className="text-[12px] text-muted-foreground mt-1">选择关联订单后自动加载销售订单明细。填写"本次发货"数量即按明细发货。</p>}
      </FormSection>
    </FormLayout>
  );
}
