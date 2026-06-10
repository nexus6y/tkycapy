'use client';

import { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import api from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { ErpTable, ErpThead, ErpTh, ErpTbody, ErpTr, ErpTd, ErpEmpty, ErpPagination, ErpApproval, ErpStatus } from '@/components/ui/erp-table';
import { ErpSearchFields, ErpSearchField } from '@/components/ui/erp-search-fields';
import { ENTITY_PICKERS, type EntityPickerDefinition, type PickerSearchField, type PickerColumn } from './entity-picker-config';
import { toast } from '@/components/ui/toast';

interface EntityPickerDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  entity: string;
  status?: string;
  extraParams?: Record<string, string>;
  excludeIds?: string[];
  onConfirm: (item: any) => void;
}

/** Override values for fetchData — callers pass explicit values to avoid stale-closure bugs. */
interface FetchOverrides {
  page?: number;
  search?: Record<string, string>;
  extraParams?: Record<string, string>;
}

export function EntityPickerDialog({
  open,
  onOpenChange,
  entity,
  status,
  extraParams,
  excludeIds,
  onConfirm,
}: EntityPickerDialogProps) {
  const config = ENTITY_PICKERS[entity];

  const [items, setItems] = useState<any[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(30);
  const [selected, setSelected] = useState<any>(null);
  const selectedRef = useRef<any>(null);
  const [search, setSearch] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);

  // Refs: always hold the latest values; never stale even across async boundaries
  const searchRef = useRef<Record<string, string>>({});
  const extraParamsRef = useRef(extraParams);
  searchRef.current = search;
  extraParamsRef.current = extraParams;

  /**
   * Core fetch — accepts optional overrides so callers can supply explicit page/search/extraParams
   * and bypass stale-closure React state.
   */
  const fetchData = useCallback(async (overrides?: FetchOverrides) => {
    if (!config) return;
    setLoading(true);
    try {
      const p = overrides?.page ?? page;
      const params: any = { page: p, pageSize };
      // Search: prefer explicit override, fall back to ref (latest), never stale closure
      const cur = overrides?.search ?? searchRef.current;
      for (const sf of config.searchFields) {
        if (cur[sf.param]) params[sf.param] = cur[sf.param];
      }
      if (status) params.status = status;
      // Extra params: prefer explicit override, fall back to ref (latest)
      const ep = overrides?.extraParams ?? extraParamsRef.current;
      if (ep) Object.assign(params, ep);
      const { data } = await api.get(config.apiPath, { params });
      setItems(data.items || []);
      setTotal(data.total || 0);
    } catch {
      setItems([]);
      setTotal(0);
    } finally {
      setLoading(false);
    }
  // page/pageSize are fallback defaults; overrides take precedence.
  // config and status are stable for the life of the picker instance.
  }, [config, page, pageSize, status]);

  // ── Open effect: reset everything + fetch page 1 with empty search ──
  useEffect(() => {
    if (open) {
      setSelected(null);
      selectedRef.current = null;
      setPage(1);
      setSearch({});
      searchRef.current = {};
      extraParamsRef.current = extraParams;
      // Explicit overrides → no stale page/search possible
      fetchData({ page: 1, search: {}, extraParams });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, entity]);

  // ── Page / pageSize change → fetch with current state (no overrides needed) ──
  useEffect(() => {
    if (open) fetchData();
  }, [page, pageSize, fetchData, open]);

  // ── extraParams change detection ──
  // Stable key avoids re-fire from new object literals on every render
  const extraParamsKey = useMemo(
    () => JSON.stringify(extraParams || {}),
    [extraParams]
  );
  const prevExtraParamsKeyRef = useRef(extraParamsKey);

  useEffect(() => {
    if (extraParamsKey !== prevExtraParamsKeyRef.current) {
      prevExtraParamsKeyRef.current = extraParamsKey;
      extraParamsRef.current = extraParams;
      if (open) {
        setPage(1);
        fetchData({ page: 1, extraParams });
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [extraParamsKey, open]);

  // ── Search: set page to 1, then fetch with explicit page=1 + latest ref values ──
  const handleSearch = () => {
    if (!config) return;
    setPage(1);
    fetchData({ page: 1 });
  };

  // ── Reset: clear search + page, immediately fetch page 1 with empty search ──
  const handleReset = () => {
    setSelected(null);
    setSearch({});
    searchRef.current = {};
    setPage(1);
    fetchData({ page: 1, search: {} });
  };

  const doSelect = (item: any) => {
    setSelected(item);
    selectedRef.current = item;
  };

  const handleRowClick = (item: any) => {
    doSelect(item);
  };

  const handleRowDoubleClick = (item: any) => {
    doSelect(item);
    onConfirm(item);
    onOpenChange(false);
  };

  const handleCodeClick = (item: any) => {
    doSelect(item);
    onConfirm(item);
    onOpenChange(false);
  };

  const handleConfirm = () => {
    // Read from ref to avoid stale React state closure
    const target = selectedRef.current;
    if (!target) {
      toast('请选择一条数据', 'info');
      return;
    }
    onConfirm(target);
    onOpenChange(false);
  };

  if (!config) {
    return (
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent>
          <div className="py-8 text-center text-muted-foreground">
            未找到实体 "{entity}" 的选择器配置
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  const renderCell = (item: any, col: PickerColumn) => {
    const val = item[col.key];
    switch (col.render) {
      case 'code':
        return <span className="text-[#409eff]">{val || '-'}</span>;
      case 'date':
        return (
          <span className="text-[#909399]">
            {val ? new Date(val).toLocaleDateString('zh-CN') : '-'}
          </span>
        );
      case 'status':
        return <ErpStatus active={val === 'ACTIVE'} />;
      case 'approval':
        return <ErpApproval status={val || 'DRAFT'} />;
      default:
        return val || '-';
    }
  };

  const renderSearchField = (sf: PickerSearchField) => (
    <ErpSearchField key={sf.param} label={sf.label}>
      <Input
        className={`${sf.width || 'w-[140px]'} h-9 rounded-md border border-border bg-background px-3 text-[13px]`}
        value={search[sf.param] || ''}
        onChange={e => setSearch(prev => ({ ...prev, [sf.param]: e.target.value }))}
        placeholder={sf.placeholder}
        onKeyDown={e => {
          if (e.key === 'Enter') handleSearch();
        }}
      />
    </ErpSearchField>
  );

  const colSpan = config.columns.length + 2; // radio + index + columns

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="!max-w-[80vw] !w-[80vw] max-h-[75vh] flex flex-col p-0 gap-0">
        {/* Header */}
        <DialogHeader className="px-4 py-3 border-b border-border shrink-0 bg-white">
          <div className="flex items-center justify-between">
            <DialogTitle className="text-[15px]">{config.title}</DialogTitle>
          </div>
        </DialogHeader>

        {/* Search area */}
        <div className="shrink-0">
          <ErpSearchFields>
            {config.searchFields.map(renderSearchField)}
          </ErpSearchFields>
          <div className="flex items-center justify-end px-4 py-2 border-b border-border gap-1 bg-white">
            <Button variant="ghost" size="sm" onClick={handleReset}>重置</Button>
            <Button variant="default" size="sm" onClick={handleSearch}>查询</Button>
          </div>
        </div>

        {/* Table area */}
        <div className="flex-1 overflow-auto min-h-0">
          <ErpTable>
            <ErpThead>
              <ErpTh className="w-10" />
              <ErpTh className="w-12">序号</ErpTh>
              {config.columns.map(col => (
                <ErpTh key={col.key}>{col.label}</ErpTh>
              ))}
            </ErpThead>
            <ErpTbody>
              {items.map((item, idx) => {
                const isSelected = selected?.id === item.id;
                return (
                  <ErpTr
                    key={item.id}
                    className={isSelected ? 'bg-[#ecf5ff]' : ''}
                  >
                    <ErpTd className="w-10">
                      <input
                        type="radio"
                        checked={isSelected}
                        onChange={() => handleRowClick(item)}
                        className="accent-[#409eff]"
                      />
                    </ErpTd>
                    <ErpTd className="w-12 text-[#909399]">
                      {(page - 1) * pageSize + idx + 1}
                    </ErpTd>
                    {config.columns.map(col => {
                      const isCodeCol = col.render === 'code';
                      return (
                      <ErpTd
                        key={col.key}
                        className="cursor-pointer"
                        onClick={() => isCodeCol ? handleCodeClick(item) : handleRowClick(item)}
                        onDoubleClick={() => handleRowDoubleClick(item)}
                      >
                        {renderCell(item, col)}
                      </ErpTd>
                    );
                    })}
                  </ErpTr>
                );
              })}
              {!loading && items.length === 0 && <ErpEmpty colSpan={colSpan} />}
            </ErpTbody>
          </ErpTable>
        </div>

        {/* Pagination */}
        <div className="shrink-0">
          <ErpPagination
            page={page}
            pageSize={pageSize}
            total={total}
            onPage={setPage}
            onPageSize={v => { setPageSize(+v); setPage(1); }}
          />
        </div>

        {/* Footer buttons */}
        <div className="flex items-center justify-end gap-2 px-4 py-3 border-t border-border shrink-0 bg-white">
          <Button variant="outline" onClick={() => onOpenChange(false)}>取消</Button>
          <Button onClick={handleConfirm}>确定</Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
