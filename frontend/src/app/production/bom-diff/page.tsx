'use client';
import { useState } from 'react';
import api from '@/lib/api';
import { Button } from '@/components/ui/button';
import { ErpTable, ErpThead, ErpTh, ErpTbody, ErpTr, ErpTd, ErpEmpty, ErpListPage } from '@/components/ui/erp-table';
import { EntityPickerInput } from '@/components/form/entity-picker-input';
import { ErpSearchFields, ErpSearchField } from '@/components/ui/erp-search-fields';
import { GitCompare } from 'lucide-react';

interface DiffItem {
  changeType: string;
  materialCode: string; materialName: string; spec: string; unit: string;
  quantity?: number; quantityA?: number; quantityB?: number;
  lossRate?: number; lossRateA?: number; lossRateB?: number;
  warehouseA?: string; warehouseB?: string;
  processA?: string; processB?: string;
}

const TYPE_MAP: Record<string, { label: string; color: string }> = {
  added: { label: '新增', color: 'bg-[#f0f9eb] text-[#67c23a]' },
  removed: { label: '删除', color: 'bg-[#fef0f0] text-[#f56c6c]' },
  changed: { label: '变更', color: 'bg-[#fdf6ec] text-[#e6a23c]' },
  unchanged: { label: '未变化', color: 'bg-[#f4f4f5] text-[#909399]' },
};

export default function BomDiffPage() {
  const [baseBomId, setBaseBomId] = useState('');
  const [baseBomLabel, setBaseBomLabel] = useState('');
  const [compareBomId, setCompareBomId] = useState('');
  const [compareBomLabel, setCompareBomLabel] = useState('');
  const [bomA, setBomA] = useState<any>(null);
  const [bomB, setBomB] = useState<any>(null);
  const [diffs, setDiffs] = useState<DiffItem[]>([]);
  const [summary, setSummary] = useState<any>(null);

  const handleCompare = async () => {
    if (!baseBomId || !compareBomId) return;
    if (baseBomId === compareBomId) return;
    try {
      const { data } = await api.get('/boms/diff', { params: { a: baseBomId, b: compareBomId } });
      setBomA(data.bomA); setBomB(data.bomB);
      setDiffs(data.diffs); setSummary(data.summary);
    } catch (e: any) { /* ignore */ }
  };

  return (
    <ErpListPage>
      <div className="flex items-center justify-between px-4 h-14 border-b border-border">
        <span className="text-[15px] font-medium text-foreground">BOM 差异分析</span>
        <Button variant="default" size="sm" onClick={handleCompare} disabled={!baseBomId || !compareBomId}>
          <GitCompare className="h-3.5 w-3.5 mr-1" />对比
        </Button>
      </div>

      <ErpSearchFields>
        <ErpSearchField label="基准BOM" labelWidth="w-[70px]">
          <EntityPickerInput entity="bom" value={baseBomLabel}
            onChange={(id: any, item: any) => { setBaseBomId(id); setBaseBomLabel(`${item.code} ${item.name}`); }} />
        </ErpSearchField>
        <ErpSearchField label="对比BOM" labelWidth="w-[70px]">
          <EntityPickerInput entity="bom" value={compareBomLabel}
            onChange={(id: any, item: any) => { setCompareBomId(id); setCompareBomLabel(`${item.code} ${item.name}`); }} />
        </ErpSearchField>
      </ErpSearchFields>

      {bomA && bomB && (
        <div className="px-4 py-2 border-b border-border bg-muted/30 flex items-center gap-4 text-[13px]">
          <span>基准: <strong>{bomA.code}</strong> (v{bomA.version})</span>
          <span className="text-[#909399]">vs</span>
          <span>对比: <strong>{bomB.code}</strong> (v{bomB.version})</span>
          {summary && (
            <span className="ml-4 flex gap-3">
              <span className="text-[#67c23a]">新增 {summary.added}</span>
              <span className="text-[#f56c6c]">删除 {summary.removed}</span>
              <span className="text-[#e6a23c]">变更 {summary.changed}</span>
              <span className="text-[#909399]">未变化 {summary.unchanged}</span>
            </span>
          )}
        </div>
      )}

      <div className="overflow-auto">
        <ErpTable>
          <ErpThead>
            <ErpTh>差异类型</ErpTh><ErpTh>物料编码</ErpTh><ErpTh>物料名称</ErpTh>
            <ErpTh>规格型号</ErpTh><ErpTh>单位</ErpTh>
            <ErpTh>BOM-A用量</ErpTh><ErpTh>BOM-B用量</ErpTh>
            <ErpTh>A损耗率</ErpTh><ErpTh>B损耗率</ErpTh>
            <ErpTh>A仓库</ErpTh><ErpTh>B仓库</ErpTh>
            <ErpTh>A工序</ErpTh><ErpTh>B工序</ErpTh>
          </ErpThead>
          <ErpTbody>
            {diffs.map((d, idx) => {
              const t = TYPE_MAP[d.changeType] || TYPE_MAP.unchanged;
              return (
                <ErpTr key={idx}>
                  <ErpTd><span className={`inline-flex px-1.5 py-0.5 rounded text-[12px] ${t.color}`}>{t.label}</span></ErpTd>
                  <ErpTd><span className="text-[#409eff]">{d.materialCode}</span></ErpTd>
                  <ErpTd>{d.materialName}</ErpTd>
                  <ErpTd className="text-[#909399]">{d.spec}</ErpTd>
                  <ErpTd>{d.unit}</ErpTd>
                  <ErpTd>{d.quantityA != null ? d.quantityA : d.quantity}</ErpTd>
                  <ErpTd className={d.quantityA !== d.quantityB && d.quantityA != null ? 'text-[#e6a23c] font-medium' : ''}>
                    {d.quantityB != null ? d.quantityB : d.quantity}
                  </ErpTd>
                  <ErpTd>{(d.lossRateA != null ? d.lossRateA : d.lossRate ?? 0)}%</ErpTd>
                  <ErpTd className={d.lossRateA !== d.lossRateB && d.lossRateA != null ? 'text-[#e6a23c] font-medium' : ''}>
                    {(d.lossRateB != null ? d.lossRateB : d.lossRate ?? 0)}%
                  </ErpTd>
                  <ErpTd className="text-[#909399]">{d.warehouseA || '-'}</ErpTd>
                  <ErpTd className={d.warehouseA !== d.warehouseB ? 'text-[#e6a23c] font-medium' : 'text-[#909399]'}>
                    {d.warehouseB || '-'}
                  </ErpTd>
                  <ErpTd className="text-[#909399]">{d.processA || '-'}</ErpTd>
                  <ErpTd className={d.processA !== d.processB ? 'text-[#e6a23c] font-medium' : 'text-[#909399]'}>
                    {d.processB || '-'}
                  </ErpTd>
                </ErpTr>
              );
            })}
            {diffs.length === 0 && <ErpEmpty colSpan={14} message={bomA ? '两BOM子件完全相同' : '请选择两个BOM进行对比'} />}
          </ErpTbody>
        </ErpTable>
      </div>
    </ErpListPage>
  );
}
