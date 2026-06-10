'use client';

import { useState } from 'react';
import { EntityPickerDialog } from './entity-picker-dialog';
import { ENTITIES } from '@/lib/entities';
import { Search } from 'lucide-react';

interface EntityPickerInputProps {
  entity: string;
  value?: string;
  displayText?: string;
  onChange: (id: string, item: any) => void;
  placeholder?: string;
  className?: string;
  disabled?: boolean;
  status?: string;
  extraParams?: Record<string, string>;
  excludeIds?: string[];
}

export function EntityPickerInput({
  entity,
  value,
  displayText,
  onChange,
  placeholder,
  className = '',
  disabled = false,
  status,
  extraParams,
  excludeIds,
}: EntityPickerInputProps) {
  const [open, setOpen] = useState(false);

  const cfg = ENTITIES[entity];

  const handleConfirm = (item: any) => {
    const id = item[cfg?.idField || 'id'];
    onChange(id, item);
  };

  const displayValue = displayText || value || '';

  return (
    <>
      <div className={`relative ${className}`}>
        <input
          type="text"
          readOnly
          value={displayValue}
          placeholder={placeholder || `选择${entity}`}
          disabled={disabled}
          onClick={() => !disabled && setOpen(true)}
          className="h-9 w-full rounded-md border border-border bg-background px-3 pr-8 text-[13px] outline-none cursor-pointer focus:border-primary focus:ring-2 focus:ring-primary/20 disabled:cursor-not-allowed disabled:opacity-50"
        />
        <button
          type="button"
          disabled={disabled}
          onClick={() => !disabled && setOpen(true)}
          className="absolute right-1 top-1/2 -translate-y-1/2 p-1 text-muted-foreground hover:text-primary disabled:opacity-50"
        >
          <Search className="h-4 w-4" />
        </button>
      </div>

      <EntityPickerDialog
        open={open}
        onOpenChange={setOpen}
        entity={entity}
        status={status}
        extraParams={extraParams}
        excludeIds={excludeIds}
        onConfirm={handleConfirm}
      />
    </>
  );
}
