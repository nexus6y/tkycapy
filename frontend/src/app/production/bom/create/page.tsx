'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { ChevronDown, Download, Grip, HelpCircle, MinusCircle, Plus, Save, Send, Trash2 } from 'lucide-react';
import api from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Textarea } from '@/components/ui/textarea';
import { toast } from '@/components/ui/toast';
import { EntityPickerInput } from '@/components/form/entity-picker-input';
import { applyMaterialSelection } from '@/lib/field-linkage';

const inputClass = 'h-10 rounded-md border border-[#dcdfe6] bg-white px-3 text-[14px]';
const disabledClass = 'h-10 rounded-md border border-[#dcdfe6] bg-[#f5f7fa] px-3 text-[14px] text-[#909399]';

interface BomItemRow {
  lineNo: number;
  materialId: string;
  materialCode: string;
  materialName: string;
  spec: string;
  unit: string;
  quantity: string;
  denominator: string;
  issueMethod: string;
  remark: string;
}

const emptyRow = (lineNo: number): BomItemRow => ({
  lineNo,
  materialId: '',
  materialCode: '',
  materialName: '',
  spec: '',
  unit: '',
  quantity: '1',
  denominator: '1',
  issueMethod: '一般件',
  remark: '',
});

export default function BomCreatePage() {
  const router = useRouter();
  const [saving, setSaving] = useState(false);
  const [hideOptional, setHideOptional] = useState(false);
  const [selectedRows, setSelectedRows] = useState<Set<number>>(new Set());
  const [form, setForm] = useState({
    code: '',
    name: '',
    productMaterialId: '',
    productMaterialCode: '',
    productMaterialName: '',
    productSpec: '',
    productUnit: '',
    version: 'V1.0',
    baseQty: '1',
    bomUse: '生产',
    bomType: '主BOM',
    replaceFlag: '',
    scrapRate: '0.00',
    status: 'ACTIVE',
    remark: '',
  });
  const [items, setItems] = useState<BomItemRow[]>([]);

  useEffect(() => {
    api.get('/common/next-code', { params: { entity: 'bom' } })
      .then(r => setForm(prev => ({ ...prev, code: r.data?.code || '' })))
      .catch(() => {});
  }, []);

  const updateRow = (idx: number, patch: Partial<BomItemRow>) => {
    setItems(prev => prev.map((row, i) => i === idx ? { ...row, ...patch } : row));
  };

  const addRow = () => {
    setItems(prev => [...prev, emptyRow(prev.length + 1)]);
  };

  const deleteRows = () => {
    if (selectedRows.size === 0) return toast('请先勾选子件行', 'info');
    setItems(prev => prev
      .filter((_, idx) => !selectedRows.has(idx))
      .map((row, idx) => ({ ...row, lineNo: idx + 1 })));
    setSelectedRows(new Set());
  };

  const toggleRow = (idx: number, checked: boolean) => {
    const next = new Set(selectedRows);
    checked ? next.add(idx) : next.delete(idx);
    setSelectedRows(next);
  };

  const toggleAll = (checked: boolean) => {
    setSelectedRows(checked ? new Set(items.map((_, idx) => idx)) : new Set());
  };

  const onProductSelect = (_id: string, material: any) => {
    const fill = applyMaterialSelection(material);
    setForm(prev => ({
      ...prev,
      productMaterialId: fill.materialId,
      productMaterialCode: fill.materialCode,
      productMaterialName: fill.materialName,
      productSpec: fill.specification,
      productUnit: fill.unit,
    }));
  };

  const onChildSelect = (idx: number, _id: string, material: any) => {
    const fill = applyMaterialSelection(material);
    updateRow(idx, {
      materialId: fill.materialId,
      materialCode: fill.materialCode,
      materialName: fill.materialName,
      spec: fill.specification,
      unit: fill.unit,
    });
  };

  const validate = () => {
    if (!form.productMaterialId) {
      toast('请选择物料编码', 'error');
      return false;
    }
    for (const item of items) {
      if (!item.materialId) {
        toast(`第${item.lineNo}行：请选择物料编码`, 'error');
        return false;
      }
      if (!item.quantity || Number(item.quantity) <= 0) {
        toast(`第${item.lineNo}行：子件用量必须大于0`, 'error');
        return false;
      }
      if (!item.denominator || Number(item.denominator) <= 0) {
        toast(`第${item.lineNo}行：母件底数必须大于0`, 'error');
        return false;
      }
    }
    return true;
  };

  const buildPayload = () => ({
    code: form.code,
    name: form.name || form.productMaterialName || form.productMaterialCode,
    version: form.version,
    baseQty: form.baseQty || '1',
    productMaterialId: form.productMaterialId,
    productMaterialCode: form.productMaterialCode,
    productMaterialName: form.productMaterialName,
    productSpec: form.productSpec,
    productUnit: form.productUnit,
    status: form.status,
    remark: form.remark,
    items: items.map(row => ({
      lineNo: row.lineNo,
      materialId: row.materialId,
      materialCode: row.materialCode,
      materialName: row.materialName,
      spec: row.spec,
      unit: row.unit,
      quantity: row.quantity,
      denominator: Number(row.denominator || 1),
      issueMethod: row.issueMethod,
      remark: row.remark,
    })),
  });

  const save = async () => {
    if (!validate()) return null;
    setSaving(true);
    try {
      const { data } = await api.post('/boms', buildPayload());
      toast('保存成功', 'success');
      return data;
    } catch (e: any) {
      toast(e.response?.data?.message || '保存失败', 'error');
      return null;
    } finally {
      setSaving(false);
    }
  };

  const saveAndBack = async () => {
    const data = await save();
    if (data) router.push('/production/bom');
  };

  const submit = async () => {
    const data = await save();
    if (!data?.id) return;
    try {
      await api.put(`/boms/${data.id}/submit`);
      toast('提交成功', 'success');
      router.push('/production/bom');
    } catch (e: any) {
      toast(e.response?.data?.message || '提交失败', 'error');
    }
  };

  return (
    <div className="flex h-full min-h-0 flex-col bg-[#f5f7fa]">
      <div className="flex h-[54px] shrink-0 items-center border-b border-[#ebeef5] bg-white px-6">
        <h1 className="text-[18px] font-medium text-[#303133]">新增BOM信息</h1>
      </div>

      <div className="flex h-[62px] shrink-0 items-center gap-2 border-b border-[#ebeef5] bg-[#f7f9fc] px-4">
        <Button variant="outline" className="h-11 w-[146px] gap-2 border-[#409eff] text-[#606266]" onClick={() => router.back()}>
          <MinusCircle className="h-5 w-5 text-[#409eff]" />取消
        </Button>
        <Button variant="outline" className="h-11 w-[146px] gap-2 border-[#409eff] text-[#606266]" onClick={saveAndBack} disabled={saving}>
          <Save className="h-5 w-5 text-[#409eff]" />保存
        </Button>
        <Button variant="outline" className="h-11 w-[146px] gap-2 border-[#409eff] text-[#606266]" onClick={submit} disabled={saving}>
          <Send className="h-5 w-5 text-[#409eff]" />提交
        </Button>
      </div>

      <div className="min-h-0 flex-1 space-y-4 overflow-auto p-3">
        <Panel
          title="母件信息"
          extra={(
            <div className="flex items-center gap-3 text-[14px] text-[#303133]">
              <Switch checked={hideOptional} onCheckedChange={setHideOptional} />
              <span className="font-medium">隐藏非必填项</span>
              <ChevronDown className="h-4 w-4 text-[#606266]" />
            </div>
          )}
        >
          <div className="grid grid-cols-3 gap-x-8 gap-y-5 px-10 py-8">
            <Field label="物料编码" required>
              <EntityPickerInput
                entity="material"
                value={form.productMaterialCode}
                displayText={form.productMaterialCode}
                status="ACTIVE"
                onChange={onProductSelect}
                placeholder=""
              />
            </Field>
            <Field label="物料名称">
              <Input className={disabledClass} value={form.productMaterialName} disabled />
            </Field>
            <Field label="规格型号">
              <Input className={disabledClass} value={form.productSpec} disabled />
            </Field>

            <Field label="计量单位">
              <Select value={form.productUnit || '请选择'} onValueChange={v => { const value = String(v); setForm({ ...form, productUnit: value === '请选择' ? '' : value }); }}>
                <SelectTrigger className={inputClass}><SelectValue placeholder="请选择" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="请选择">请选择</SelectItem>
                  <SelectItem value="个">个</SelectItem>
                  <SelectItem value="件">件</SelectItem>
                  <SelectItem value="套">套</SelectItem>
                  <SelectItem value="kg">kg</SelectItem>
                </SelectContent>
              </Select>
            </Field>
            <Field label="BOM编码">
              <Input className={disabledClass} value={form.code} disabled placeholder="自动生成" />
            </Field>
            <Field label="BOM名称">
              <Input className={inputClass} value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} />
            </Field>

            <Field label="BOM用途" required>
              <Select value={form.bomUse} onValueChange={v => setForm({ ...form, bomUse: String(v) })}>
                <SelectTrigger className={inputClass}><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="生产">生产</SelectItem>
                  <SelectItem value="委外">委外</SelectItem>
                  <SelectItem value="研发">研发</SelectItem>
                </SelectContent>
              </Select>
            </Field>
            <Field label="BOM类型" help>
              <Select value={form.bomType} onValueChange={v => setForm({ ...form, bomType: String(v) })}>
                <SelectTrigger className={inputClass}><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="主BOM">主BOM</SelectItem>
                  <SelectItem value="替代BOM">替代BOM</SelectItem>
                </SelectContent>
              </Select>
            </Field>
            <Field label="替代标识" help>
              <Select value={form.replaceFlag || '请选择'} onValueChange={v => { const value = String(v); setForm({ ...form, replaceFlag: value === '请选择' ? '' : value }); }}>
                <SelectTrigger className={inputClass}><SelectValue placeholder="请选择" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="请选择">请选择</SelectItem>
                  <SelectItem value="主用">主用</SelectItem>
                  <SelectItem value="替代">替代</SelectItem>
                </SelectContent>
              </Select>
            </Field>

            {!hideOptional && (
              <>
                <Field label="废品率(%)">
                  <Input type="number" className={inputClass} value={form.scrapRate} onChange={e => setForm({ ...form, scrapRate: e.target.value })} />
                </Field>
                <div className="col-span-2" />
              </>
            )}

            <div className="col-span-3">
              <Field label="备注">
                <div className="relative">
                  <Textarea
                    className="h-12 resize-none rounded-md border border-[#dcdfe6] bg-white px-3 py-2 pr-14 text-[14px]"
                    maxLength={200}
                    value={form.remark}
                    onChange={e => setForm({ ...form, remark: e.target.value })}
                  />
                  <span className="absolute bottom-2 right-3 text-[13px] text-[#909399]">{form.remark.length}/200</span>
                </div>
              </Field>
            </div>
          </div>
        </Panel>

        <Panel title="子件信息">
          <div className="mx-7 mt-9 bg-[#f3f5fa] p-2">
            <div className="mb-2 flex items-center gap-2">
              <Button variant="outline" className="h-10 w-[132px] border-[#409eff] text-[#606266]" onClick={addRow}>新增</Button>
              <Button variant="outline" className="h-10 w-[146px] gap-1 text-[#606266]" onClick={() => toast('按编码导入待接入', 'info')}>
                按编码导入 <ChevronDown className="h-4 w-4" />
              </Button>
              <Button variant="outline" className="h-10 w-[132px] text-[#909399]" onClick={() => toast('请选择需要批改的子件行', 'info')}>批改</Button>
              <Button variant="outline" className="h-10 w-[132px] text-[#909399]" onClick={deleteRows}>删除</Button>
            </div>
            <div className="overflow-auto border border-[#dcdfe6] bg-white">
              <table className="min-w-[1500px] w-full border-collapse text-[14px]">
                <thead>
                  <tr className="h-[52px] bg-[#f5f7fa] text-[#303133]">
                    <Th className="w-[64px]"><Checkbox checked={items.length > 0 && selectedRows.size === items.length} onCheckedChange={(v: boolean) => toggleAll(v)} /></Th>
                    <Th className="w-[72px]">序号</Th>
                    <Th className="w-[210px]">物料编码</Th>
                    <Th className="w-[320px]">物料名称</Th>
                    <Th className="w-[210px]">规格型号</Th>
                    <Th className="w-[130px]">计量单位</Th>
                    <Th className="w-[170px]" required>计划属性</Th>
                    <Th className="w-[190px]" required>子件用量</Th>
                    <Th className="w-[170px]" required>母件底数</Th>
                    <Th className="w-[140px]">操作</Th>
                  </tr>
                </thead>
                <tbody>
                  {items.map((row, idx) => (
                    <tr key={idx} className="h-[52px] border-t border-[#ebeef5] hover:bg-[#f5f7fa]">
                      <Td><Checkbox checked={selectedRows.has(idx)} onCheckedChange={(v: boolean) => toggleRow(idx, v)} /></Td>
                      <Td>{row.lineNo}</Td>
                      <Td>
                        <EntityPickerInput
                          entity="material"
                          value={row.materialCode}
                          displayText={row.materialCode}
                          status="ACTIVE"
                          onChange={(id, material) => onChildSelect(idx, id, material)}
                        />
                      </Td>
                      <Td>{row.materialName || '-'}</Td>
                      <Td className="text-[#909399]">{row.spec || '-'}</Td>
                      <Td>{row.unit || '-'}</Td>
                      <Td>
                        <Select value={row.issueMethod} onValueChange={v => updateRow(idx, { issueMethod: String(v) })}>
                          <SelectTrigger className="h-8 border-[#dcdfe6] text-[13px]"><SelectValue /></SelectTrigger>
                          <SelectContent>
                            <SelectItem value="一般件">一般件</SelectItem>
                            <SelectItem value="关键件">关键件</SelectItem>
                            <SelectItem value="替代件">替代件</SelectItem>
                          </SelectContent>
                        </Select>
                      </Td>
                      <Td><Input type="number" className="h-8 border-[#dcdfe6] text-[13px]" value={row.quantity} onChange={e => updateRow(idx, { quantity: e.target.value })} /></Td>
                      <Td><Input type="number" className="h-8 border-[#dcdfe6] text-[13px]" value={row.denominator} onChange={e => updateRow(idx, { denominator: e.target.value })} /></Td>
                      <Td>
                        <button type="button" className="text-[#409eff] hover:underline" onClick={() => {
                          setItems(prev => prev.filter((_, i) => i !== idx).map((r, i) => ({ ...r, lineNo: i + 1 })));
                        }}>删除</button>
                      </Td>
                    </tr>
                  ))}
                  {items.length === 0 && (
                    <tr>
                      <td colSpan={10} className="h-[78px] text-center text-[#909399]">暂无数据</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </Panel>
      </div>
    </div>
  );
}

function Panel({ title, children, extra }: { title: string; children: React.ReactNode; extra?: React.ReactNode }) {
  return (
    <section className="rounded border border-[#dbe9fb] bg-white shadow-sm">
      <div className="flex h-[58px] items-center justify-between border-b border-[#ebeef5] bg-gradient-to-b from-white to-[#fbfdff] px-3">
        <div className="flex items-center gap-2 text-[17px] font-semibold text-[#303133]">
          <span className="relative inline-flex h-6 w-6 items-center justify-center rounded border border-[#3155b7] text-[#3155b7]">
            <span className="h-2 w-3 rounded-sm border border-current" />
            <span className="absolute -bottom-1 -right-1 h-3 w-3 rounded-sm bg-[#79b8ff]" />
          </span>
          {title}
        </div>
        <div className="flex items-center gap-4">
          {extra}
          <Grip className="h-7 w-7 text-[#9bd2ff]" />
        </div>
      </div>
      {children}
    </section>
  );
}

function Field({ label, required, help, children }: { label: string; required?: boolean; help?: boolean; children: React.ReactNode }) {
  return (
    <div className="flex items-center gap-4">
      <label className="flex w-[116px] shrink-0 items-center justify-end text-[16px] text-[#303133]">
        {required && <span className="mr-1 text-[#f56c6c]">*</span>}
        {help && <HelpCircle className="mr-1 h-4 w-4 fill-[#db6f9a] text-[#db6f9a]" />}
        {label}
      </label>
      <div className="min-w-0 flex-1">{children}</div>
    </div>
  );
}

function Th({ children, required, className = '' }: { children: React.ReactNode; required?: boolean; className?: string }) {
  return <th className={`border-r border-[#dcdfe6] px-3 text-center font-semibold ${className}`}>{required && <span className="text-[#f56c6c]">* </span>}{children}</th>;
}

function Td({ children, className = '' }: { children: React.ReactNode; className?: string }) {
  return <td className={`border-r border-[#ebeef5] px-3 text-center text-[#303133] ${className}`}>{children}</td>;
}
