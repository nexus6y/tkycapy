'use client';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import api from '@/lib/api';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { toast } from '@/components/ui/toast';
import { FormLayout, FormSection, FormGrid, FormField } from '@/components/form/form-layout';
import { LinesEditor, LineItem } from '@/components/ui/lines-editor';
import { EntityPickerInput } from '@/components/form/entity-picker-input';
import { applyDepartmentSelection } from '@/lib/field-linkage';

const FI = 'h-9 rounded-md border border-border bg-background px-3 text-[13px] w-full';

const PROD_COLS = [
  { key: 'lineNo', label: '行号', width: '60px', type: 'number' as const },
  { key: 'materialCode', label: '物料编码', width: '120px' },
  { key: 'materialName', label: '物料名称', width: '120px' },
  { key: 'spec', label: '规格型号', width: '100px' },
  { key: 'unit', label: '单位', width: '60px' },
  { key: 'plannedQty', label: '计划数量', width: '80px', type: 'number' as const },
  { key: 'warehouseCode', label: '仓库', width: '100px' },
  { key: 'remark', label: '备注', width: '100px' },
];

const MAT_COLS = [
  { key: 'lineNo', label: '行号', width: '60px', type: 'number' as const },
  { key: 'materialCode', label: '物料编码', width: '120px' },
  { key: 'materialName', label: '物料名称', width: '120px' },
  { key: 'spec', label: '规格型号', width: '100px' },
  { key: 'unit', label: '单位', width: '60px' },
  { key: 'quantity', label: '用量', width: '80px', type: 'number' as const },
  { key: 'warehouseCode', label: '仓库', width: '100px' },
  { key: 'remark', label: '备注', width: '100px' },
];

export default function ProductionOrderCreate() {
  const router = useRouter();
  const [f, setF] = useState<any>({
    orderNo: '', orderName: '', bomId: '', bomCode: '', bomName: '',
    departmentId: '', departmentCode: '', departmentName: '',
    quantity: '1', startDate: '', endDate: '', remark: '',
  });
  const [prodLines, setProdLines] = useState<LineItem[]>([]);
  const [matLines, setMatLines] = useState<LineItem[]>([]);
  const [bomLoading, setBomLoading] = useState(false);
  const [useBom, setUseBom] = useState(true);

  useEffect(() => {
    api.get('/common/next-code', { params: { entity: 'productionOrder' } })
      .then(r => setF((prev: any) => ({ ...prev, orderNo: r.data.code })));
  }, []);

  const onBomSelect = async (id: string) => {
    setBomLoading(true);
    try {
      const qty = Number(f.quantity || 1);
      const { data } = await api.get(`/boms/${id}/explode`, { params: { qty } });
      setF((prev: any) => ({
        ...prev, bomId: id, bomCode: data.bom.code, bomName: data.bom.name,
        orderName: prev.orderName || `生产-${data.bom.productMaterialName || data.bom.code}`,
      }));
      // Product line from BOM
      setProdLines([{
        lineNo: 1, materialCode: data.bom.productMaterialCode || '',
        materialName: data.bom.productMaterialName || '',
        spec: data.bom.productSpec || '', unit: data.bom.productUnit || '',
        plannedQty: String(qty), warehouseCode: '', remark: '',
      }]);
      // Material lines from BOM items
      if (data.items && data.items.length > 0) {
        setMatLines(data.items.map((item: any) => ({
          lineNo: item.lineNo, materialCode: item.materialCode, materialName: item.materialName,
          spec: item.spec, unit: item.unit, quantity: String(item.requiredQty || item.quantity),
          warehouseCode: item.warehouseCode || '', remark: '',
        })));
      }
      toast('已从BOM加载产品和材料明细', 'success');
    } catch (e: any) {
      toast(e.response?.data?.message || '加载BOM失败', 'error');
    } finally {
      setBomLoading(false);
    }
  };

  const save = async () => {
    if (!f.orderName) return toast('请填写生产名称', 'error');
    if (prodLines.length === 0) return toast('请至少添加一个产品行', 'error');
    try {
      const payload: any = {
        orderNo: f.orderNo, orderName: f.orderName,
        bomId: f.bomId || undefined,
        departmentId: f.departmentId, departmentName: f.departmentName,
        quantity: f.quantity, startDate: f.startDate, endDate: f.endDate,
        remark: f.remark,
      };
      if (prodLines.length > 0) payload.lines = prodLines;
      if (matLines.length > 0) payload.materials = matLines;
      await api.post('/production-orders', payload);
      router.push('/production/order');
    } catch (e: any) {
      toast(e.response?.data?.message || '保存失败', 'error');
    }
  };

  return (
    <FormLayout title="新增生产订单" onSave={save} sections={[
      { id: 'basic', title: '基本信息' },
      { id: 'bom', title: 'BOM关联' },
      { id: 'product', title: '产品信息' },
      { id: 'material', title: '材料信息' },
    ]} activeSection="basic">

      {/* ═══ 基本信息 ═══ */}
      <FormSection id="basic" title="基本信息">
        <FormGrid>
          <FormField label="生产编号">
            <Input className={FI} value={f.orderNo} readOnly disabled />
          </FormField>
          <FormField label="生产名称" required>
            <Input className={FI} value={f.orderName} onChange={e => setF({ ...f, orderName: e.target.value })} placeholder="输入生产名称" />
          </FormField>
          <FormField label="生产部门">
            <EntityPickerInput entity="department" value={f.departmentCode}
              displayText={f.departmentCode ? `${f.departmentCode} ${f.departmentName}` : ''}
              onChange={(id: any, d: any) => { setF({ ...f, ...applyDepartmentSelection(d) }); }} />
          </FormField>
          <FormField label="生产数量">
            <Input type="number" className={FI} value={f.quantity}
              onChange={e => { setF({ ...f, quantity: e.target.value }); }}
              placeholder="生产数量" />
          </FormField>
          <FormField label="开工日期">
            <Input type="date" className={FI} value={f.startDate}
              onChange={e => setF({ ...f, startDate: e.target.value })} />
          </FormField>
          <FormField label="完工日期">
            <Input type="date" className={FI} value={f.endDate}
              onChange={e => setF({ ...f, endDate: e.target.value })} />
          </FormField>
          <div className="col-span-2">
            <FormField label="备注">
              <Textarea className={`${FI} h-20`} value={f.remark}
                onChange={e => setF({ ...f, remark: e.target.value })} placeholder="生产备注" />
            </FormField>
          </div>
        </FormGrid>
      </FormSection>

      {/* ═══ BOM关联 ═══ */}
      <FormSection id="bom" title="BOM关联">
        <FormGrid>
          <FormField label="创建方式">
            <div className="flex gap-4 pt-1.5">
              <label className="flex items-center gap-1.5 text-[13px] cursor-pointer">
                <input type="radio" checked={useBom} onChange={() => setUseBom(true)} className="accent-[#409eff]" />
                按BOM创建（业务引导）
              </label>
              <label className="flex items-center gap-1.5 text-[13px] cursor-pointer">
                <input type="radio" checked={!useBom} onChange={() => setUseBom(false)} className="accent-[#409eff]" />
                直接创建
              </label>
            </div>
          </FormField>
          {useBom && <>
            <FormField label="选择BOM">
              <EntityPickerInput entity="bom" value={f.bomCode}
                displayText={f.bomCode ? `${f.bomCode} ${f.bomName}` : ''}
                status="APPROVED"
                onChange={(id: any) => { setF({ ...f, bomId: id }); onBomSelect(id); }} />
            </FormField>
            <FormField label="BOM编码">
              <Input className={FI} value={f.bomCode} readOnly disabled />
            </FormField>
            <FormField label="BOM名称">
              <Input className={FI} value={f.bomName} readOnly disabled />
            </FormField>
          </>}
          {bomLoading && (
            <div className="col-span-2 py-2 text-center text-[13px] text-muted-foreground">
              正在从BOM加载产品及材料明细...
            </div>
          )}
        </FormGrid>
      </FormSection>

      {/* ═══ 产品信息 (成品明细) ═══ */}
      <FormSection id="product" title="产品信息">
        <LinesEditor lines={prodLines} onChange={setProdLines} columns={PROD_COLS} materialPicker />
      </FormSection>

      {/* ═══ 材料信息 (子件明细) ═══ */}
      <FormSection id="material" title="材料信息">
        <LinesEditor lines={matLines} onChange={setMatLines} columns={MAT_COLS} materialPicker />
      </FormSection>

    </FormLayout>
  );
}
