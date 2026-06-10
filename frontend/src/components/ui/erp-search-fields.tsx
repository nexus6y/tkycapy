'use client';

import React from 'react';

/* ===== ErpSearchField — single label+control pair ===== */
export function ErpSearchField({
  label,
  children,
  labelWidth = 'w-[80px]',
}: {
  label: string;
  children: React.ReactNode;
  labelWidth?: string;
}) {
  return (
    <div className="flex items-center gap-1.5">
      <span className={`text-[13px] text-muted-foreground ${labelWidth} text-right shrink-0`}>
        {label}
      </span>
      {children}
    </div>
  );
}

/* ===== ErpSearchFields — search filter row ===== */
export function ErpSearchFields({
  children,
  advancedOpen = false,
  advancedChildren,
}: {
  children: React.ReactNode;
  advancedOpen?: boolean;
  advancedChildren?: React.ReactNode;
}) {
  return (
    <div className="flex items-center gap-4 px-4 py-2.5 border-b border-border bg-[#f5f7fa] flex-wrap">
      {children}
      {advancedOpen && advancedChildren}
    </div>
  );
}
