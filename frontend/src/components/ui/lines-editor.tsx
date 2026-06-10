'use client';
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Plus, Trash2, Search } from 'lucide-react';
import { EntityPickerDialog } from '@/components/form/entity-picker-dialog';

export interface LineItem {
  key?: string; // temp key for React
  lineNo: number;
  materialCode?: string;
  materialName?: string;
  spec?: string;
  unit?: string;
  quantity?: string;
  unitPrice?: string;
  amount?: string;
  warehouseCode?: string;
  locationCode?: string;
  batchNo?: string;
  requiredDate?: string;
  deliveryDate?: string;
  remark?: string;
  [key: string]: any;
}

interface LinesEditorProps {
  lines: LineItem[];
  onChange: (lines: LineItem[]) => void;
  columns?: { key: string; label: string; width?: string; type?: 'text' | 'number' | 'date' }[];
  /** When true, the material code cell shows a picker button to select material from the database */
  materialPicker?: boolean;
}

const DEFAULT_COLUMNS = [
  { key: 'lineNo', label: '行号', width: '60px', type: 'number' as const },
  { key: 'materialCode', label: '物料编码', width: '120px' },
  { key: 'materialName', label: '物料名称', width: '120px' },
  { key: 'spec', label: '规格型号', width: '100px' },
  { key: 'unit', label: '单位', width: '60px' },
  { key: 'quantity', label: '数量', width: '80px', type: 'number' as const },
  { key: 'unitPrice', label: '单价', width: '80px', type: 'number' as const },
  { key: 'amount', label: '金额', width: '100px', type: 'number' as const },
  { key: 'requiredDate', label: '需求日期', width: '110px', type: 'date' as const },
  { key: 'warehouseCode', label: '仓库', width: '100px' },
];

export function LinesEditor({ lines, onChange, columns = DEFAULT_COLUMNS, materialPicker = false }: LinesEditorProps) {
  const [pickerOpen, setPickerOpen] = useState(false);
  const [pickerRowIdx, setPickerRowIdx] = useState<number>(-1);

  const addLine = () => {
    const maxNo = lines.reduce((m, l) => Math.max(m, l.lineNo || 0), 0);
    onChange([...lines, { lineNo: maxNo + 1 }]);
  };

  const removeLine = (idx: number) => {
    onChange(lines.filter((_, i) => i !== idx).map((l, i) => ({ ...l, lineNo: i + 1 })));
  };

  const updateLine = (idx: number, key: string, value: string) => {
    const updated = lines.map((l, i) => {
      if (i !== idx) return l;
      const newLine = { ...l, [key]: value };
      // Auto-calculate amount
      if ((key === 'quantity' || key === 'unitPrice') && newLine.quantity && newLine.unitPrice) {
        newLine.amount = String((Number(newLine.quantity) * Number(newLine.unitPrice)).toFixed(2));
      }
      return newLine;
    });
    onChange(updated);
  };

  const openMaterialPicker = (rowIdx: number) => {
    setPickerRowIdx(rowIdx);
    setPickerOpen(true);
  };

  const onMaterialSelected = (item: any) => {
    if (pickerRowIdx < 0 || pickerRowIdx >= lines.length) return;
    setPickerOpen(false);
    const updated = lines.map((l, i) => {
      if (i !== pickerRowIdx) return l;
      return {
        ...l,
        materialCode: item.code || '',
        materialName: item.name || '',
        spec: item.specification || '',
        unit: item.unitSymbol || item.unitName || '',
      };
    });
    onChange(updated);
  };

  return (
    <>
      <div className="border rounded-md overflow-hidden">
        <div className="flex items-center justify-between px-3 py-2 bg-muted/30 border-b">
          <span className="text-[13px] font-medium">明细信息</span>
          <Button variant="secondary" size="sm" onClick={addLine}><Plus className="h-3 w-3 mr-0.5" />新增行</Button>
        </div>
        <div className="overflow-auto max-h-[400px]">
          <table className="w-full text-[13px]">
            <thead>
              <tr className="bg-[#f5f7fa]">
                {columns.map(c => (
                  <th key={c.key} className="text-left px-2 py-2 font-medium text-[#909399] border-b border-border" style={{ width: c.width, minWidth: c.width }}>
                    {c.label}
                  </th>
                ))}
                <th className="w-10 px-2 py-2 border-b border-border" />
              </tr>
            </thead>
            <tbody>
              {lines.length === 0 && (
                <tr><td colSpan={columns.length + 1} className="text-center py-8 text-muted-foreground text-[13px]">暂无明细，点击"新增行"添加</td></tr>
              )}
              {lines.map((l, i) => (
                <tr key={i} className="border-b border-border hover:bg-muted/30">
                  {columns.map(c => {
                    // Material code cell: show picker button when materialPicker is enabled
                    if (materialPicker && c.key === 'materialCode') {
                      return (
                        <td key={c.key} className="px-2 py-1">
                          <div className="flex items-center gap-0.5">
                            <input
                              type="text"
                              className="h-8 rounded border border-border bg-background px-2 text-[12px] flex-1 min-w-0 cursor-pointer"
                              value={l.materialCode ?? ''}
                              readOnly
                              onClick={() => openMaterialPicker(i)}
                              placeholder="点击选择"
                            />
                            <button
                              type="button"
                              className="h-8 w-7 flex items-center justify-center rounded border border-border bg-background hover:bg-muted shrink-0 text-muted-foreground hover:text-primary transition-colors"
                              onClick={() => openMaterialPicker(i)}
                              title="选择物料"
                            >
                              <Search className="h-3 w-3" />
                            </button>
                          </div>
                        </td>
                      );
                    }
                    return (
                      <td key={c.key} className="px-2 py-1">
                        <input
                          type={c.type || 'text'}
                          className="h-8 rounded border border-border bg-background px-2 text-[12px] w-full"
                          value={l[c.key] ?? ''}
                          onChange={e => updateLine(i, c.key, e.target.value)}
                        />
                      </td>
                    );
                  })}
                  <td className="px-2 py-1">
                    <Button variant="ghost" size="icon" className="h-7 w-7 text-red-500 hover:bg-red-50" onClick={() => removeLine(i)}>
                      <Trash2 className="h-3 w-3" />
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {materialPicker && (
        <EntityPickerDialog
          open={pickerOpen}
          onOpenChange={setPickerOpen}
          entity="material"
          status="ACTIVE"
          onConfirm={onMaterialSelected}
        />
      )}
    </>
  );
}
