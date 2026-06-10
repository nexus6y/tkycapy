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
import { applySupplierSelection, applySourceDocumentSelection } from '@/lib/field-linkage';
import { recalcHeaderTotals } from '@/lib/calc';

const FI = 'h-9 rounded-md border border-border bg-background px-3 text-[13px] w-full';

const INB_COLS = [
  { key: 'lineNo', label: '行号', width: '60px', type: 'number' as const },
  { key: 'materialCode', label: '物料编码', width: '120px' },
  { key: 'materialName', label: '物料名称', width: '120px' },
  { key: 'spec', label: '规格型号', width: '100px' },
  { key: 'unit', label: '单位', width: '60px' },
  { key: 'quantity', label: '数量', width: '80px', type: 'number' as const },
  { key: 'unitPrice', label: '单价', width: '80px', type: 'number' as const },
  { key: 'amount', label: '金额', width: '100px', type: 'number' as const },
  { key: 'warehouseCode', label: '仓库', width: '100px' },
  { key: 'locationCode', label: '仓位', width: '80px' },
  { key: 'batchNo', label: '批次', width: '100px' },
];

const EMPTY_HEADER = {
  sourceId: '', sourceNo: '', supplierId: '', supplierCode: '', supplierName: '',
  materialId: '', materialCode: '', materialName: '', specification: '', unit: '',
  quantity: '', unitPrice: '', totalAmount: '',
};

export default function ICreate() {
  const router = useRouter();
  const [f, setF] = useState({
    orderNo: '', sourceType: 'PURCHASE',
    sourceId: '', sourceNo: '', supplierId: '', supplierCode: '', supplierName: '',
    materialId: '', materialCode: '', materialName: '', specification: '', unit: '',
    quantity: '', warehouseId: '', warehouseCode: '', warehouseName: '',
    unitPrice: '', totalAmount: '', remark: '',
  });
  const [lines, setLines] = useState<LineItem[]>([]);
  const [sourceLoading, setSourceLoading] = useState(false);

  const isOther = f.sourceType === 'OTHER';

  useEffect(() => {
    api.get('/common/next-code', { params: { entity: 'inboundOrder' } })
      .then(r => setF(prev => ({ ...prev, orderNo: r.data.code })));
  }, []);

  // Recalculate header totals from lines
  useEffect(() => {
    if (lines.length > 0) {
      const h = recalcHeaderTotals(lines);
      setF(prev => ({ ...prev, totalAmount: h.totalAmount, quantity: h.totalQuantity }));
    }
  }, [lines]);

  // Resolve the source entity for the picker
  const srcEntity = f.sourceType === 'PURCHASE' ? 'purchaseOrder'
    : f.sourceType === 'INSPECTION' ? 'inspection'
      : 'purchaseOrder';

  // ── Source document selection ──
  const onSourceSelect = async (sourceId: string) => {
    if (!sourceId || sourceLoading) return;
    setSourceLoading(true);
    try {
      const result = await applySourceDocumentSelection(
        f.sourceType === 'PURCHASE' ? 'PURCHASE_ORDER' : f.sourceType,
        sourceId,
        {
          materialCode: 'materialCode', materialName: 'materialName', spec: 'spec', unit: 'unit',
          quantity: 'quantity', unitPrice: 'unitPrice', amount: 'amount', warehouseCode: 'warehouseCode',
        },
        api,
      );
      const h = result.header;
      setF(prev => ({
        ...prev,
        sourceNo: h.sourceNo || '',
        sourceId,
        supplierId: h.supplierId || prev.supplierId,
        supplierCode: h.supplierCode || prev.supplierCode,
        supplierName: h.supplierName || prev.supplierName,
        materialName: result.lines[0]?.materialName || prev.materialName,
        specification: result.lines[0]?.spec || prev.specification,
        unit: result.lines[0]?.unit || prev.unit,
      }));
      if (result.lines.length > 0) setLines(result.lines as LineItem[]);
      toast('已加载来源单明细', 'success');
    } catch (e: any) {
      toast(e.response?.data?.message || '加载来源单失败', 'error');
    } finally {
      setSourceLoading(false);
    }
  };

  // ── Save ──
  const save = async () => {
    if (lines.length === 0) return toast('请添加至少一行明细', 'error');

    const firstLine = lines[0];
    const p: any = {
      orderNo: f.orderNo, sourceType: f.sourceType, sourceNo: f.sourceNo,
      sourceId: f.sourceId, supplierId: f.supplierId, supplierName: f.supplierName,
      warehouseId: f.warehouseId, warehouseCode: f.warehouseCode, warehouseName: f.warehouseName,
      materialName: firstLine.materialName || '',
      specification: firstLine.spec || '',
      remark: f.remark,
    };

    p.lines = lines;
    const h = recalcHeaderTotals(lines);
    p.totalAmount = h.totalAmount;
    p.quantity = h.totalQuantity;

    await api.post('/inbound-orders', p);
    router.push('/warehouse/inbound');
  };

  return (
    <FormLayout title="新增入库单" onSave={save} sections={[
      { id: 'b', title: '入库信息' },
      { id: 's', title: '来源信息' },
      { id: 'l', title: '明细信息' },
    ]} activeSection="b">

      {/* ═══ 入库信息 ═══ */}
      <FormSection id="b" title="入库信息">
        <FormGrid>
          <FormField label="入库单号">
            <Input className={FI} value={f.orderNo} readOnly disabled />
          </FormField>

          <FormField label="仓库">
            <EntityPickerInput entity="warehouse" value={f.warehouseCode}
              displayText={f.warehouseCode ? `${f.warehouseCode} ${f.warehouseName}` : ''}
              onChange={(id: any, w: any) => setF({
                ...f, warehouseId: id, warehouseCode: w.code || '', warehouseName: w.name || '',
              })} />
          </FormField>

          {/* Summary totals from lines (both modes) */}
          {lines.length > 0 && <>
            <FormField label="总数量">
              <Input className={FI} value={recalcHeaderTotals(lines).totalQuantity} readOnly disabled />
            </FormField>
            <FormField label="总金额">
              <Input className={FI} value={f.totalAmount || ''} readOnly disabled />
            </FormField>
          </>}

          <div className="col-span-2">
            <FormField label="备注">
              <Textarea className={`${FI} h-20`} value={f.remark}
                onChange={e => setF({ ...f, remark: e.target.value })} />
            </FormField>
          </div>
        </FormGrid>
      </FormSection>

      {/* ═══ 来源信息 ═══ */}
      <FormSection id="s" title="来源信息">
        <FormGrid>
          <FormField label="来源类型">
            <Select value={f.sourceType} onValueChange={(v: any) => {
              setF(prev => ({
                ...prev, sourceType: v, ...EMPTY_HEADER,
                warehouseId: prev.warehouseId, warehouseCode: prev.warehouseCode, warehouseName: prev.warehouseName,
              }));
              setLines([]);
            }}>
              <SelectTrigger className={FI}><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="PURCHASE">采购入库</SelectItem>
                <SelectItem value="INSPECTION">质检入库</SelectItem>
                <SelectItem value="OTHER">其他</SelectItem>
              </SelectContent>
            </Select>
          </FormField>

          {/* ── Source mode: picker + auto-fill supplier ── */}
          {!isOther && <>
            <FormField label="来源单号">
              <EntityPickerInput entity={srcEntity} value={f.sourceNo}
                displayText={f.sourceNo || ''} status="APPROVED"
                onChange={(id: any, doc: any) => {
                  const no = doc.orderNo || doc.inspectionNo || '';
                  setF({ ...f, sourceId: id, sourceNo: no });
                  onSourceSelect(id);
                }} />
            </FormField>
            <FormField label="供应商">
              {f.supplierName ? (
                <Input className={FI} value={f.supplierName} readOnly disabled />
              ) : (
                <span className="text-[13px] text-muted-foreground pt-2">选择来源单后自动填充</span>
              )}
            </FormField>
          </>}

          {/* ── OTHER mode: only supplier picker ── */}
          {isOther && (
            <FormField label="供应商">
              <EntityPickerInput entity="supplier" value={f.supplierCode}
                displayText={f.supplierCode ? `${f.supplierCode} ${f.supplierName}` : ''}
                onChange={(id: any, s: any) => { setF({ ...f, ...applySupplierSelection(s) }); }} />
            </FormField>
          )}
        </FormGrid>
      </FormSection>

      {/* ═══ 明细信息 ═══ */}
      <FormSection id="l" title="明细信息">
        <LinesEditor lines={lines} onChange={setLines} columns={INB_COLS} materialPicker />
      </FormSection>

    </FormLayout>
  );
}
