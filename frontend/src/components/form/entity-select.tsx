'use client';

import { useState, useEffect, useCallback } from 'react';
import api from '@/lib/api';
import { ENTITIES, type EntityType } from '@/lib/entities';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

export interface EntitySelectProps {
  /** Which entity to fetch */
  entity: EntityType;
  /** Currently selected ID */
  value: string;
  /** Called with (id, full entity object) on selection */
  onChange: (id: string, entity: Record<string, any>) => void;
  /** Placeholder text */
  placeholder?: string;
  /** Filter by status value (e.g. 'ACTIVE', 'APPROVED') — overrides entity's default statusFilter */
  status?: string;
  /** Additional query params appended to the API URL */
  extraParams?: Record<string, string>;
  /** CSS class for SelectTrigger */
  className?: string;
  /** Whether the select is disabled */
  disabled?: boolean;
}

/**
 * EntitySelect — 通用实体选择器
 *
 * 用法示例：
 *   <EntitySelect
 *     entity="customer"
 *     value={form.customerId}
 *     onChange={(id, customer) => {
 *       const fill = applyCustomerSelection(customer);
 *       setForm(f => ({ ...f, ...fill }));
 *     }}
 *     status="ACTIVE"
 *   />
 */
export function EntitySelect({
  entity,
  value,
  onChange,
  placeholder,
  status,
  extraParams,
  className,
  disabled,
}: EntitySelectProps) {
  const cfg = ENTITIES[entity];
  const [items, setItems] = useState<Record<string, any>[]>([]);
  const [loading, setLoading] = useState(true);

  const fetch = useCallback(async () => {
    setLoading(true);
    try {
      const params: Record<string, any> = { pageSize: 999 };
      if (status !== undefined) {
        params[cfg.statusFilter || 'status'] = status;
      }
      if (extraParams) {
        Object.assign(params, extraParams);
      }
      const { data } = await api.get(cfg.path, { params });
      setItems(data.items || []);
    } catch {
      setItems([]);
    } finally {
      setLoading(false);
    }
  }, [cfg.path, cfg.statusFilter, status, extraParams]);

  useEffect(() => { fetch(); }, [fetch]);

  const selected = items.find(i => i[cfg.idField] === value);

  const handleChange = (id: any) => {
    if (!id) return;
    const item = items.find(i => i[cfg.idField] === id);
    if (item) {
      onChange(id, item);
    }
  };

  return (
    <Select value={value || ''} onValueChange={handleChange} disabled={disabled}>
      <SelectTrigger className={className || 'w-full h-9 rounded-md border border-border bg-background px-3 text-[13px]'}>
        <SelectValue placeholder={loading ? '加载中...' : (placeholder || `选择${entity}`)}>
          {selected ? (cfg.displayField === 'name'
            ? `${selected.code ? selected.code + ' ' : ''}${selected[cfg.displayField] || ''}`
            : selected[cfg.displayField]) : undefined}
        </SelectValue>
      </SelectTrigger>
      <SelectContent>
        {items.length === 0 && !loading && (
          <div className="px-3 py-2 text-[13px] text-muted-foreground">暂无数据</div>
        )}
        {items.map(item => (
          <SelectItem key={item[cfg.idField]} value={item[cfg.idField]}>
            {cfg.displayField === 'name'
              ? `${item.code ? item.code + ' ' : ''}${item[cfg.displayField] || ''}`
              : item[cfg.displayField]}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
