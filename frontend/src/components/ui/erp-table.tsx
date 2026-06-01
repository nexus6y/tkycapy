'use client';

import React from 'react';
import { cn } from '@/lib/utils';
import { ChevronLeft, ChevronRight, RefreshCw, Settings } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

/* ===== Table header ===== */
export function ErpTable({ children, className }: { children: React.ReactNode; className?: string }) {
  return <table className={cn('w-full text-[14px]', className)}>{children}</table>;
}

export function ErpThead({ children }: { children: React.ReactNode }) {
  return <thead><tr className="bg-[#f5f7fa]">{children}</tr></thead>;
}

export function ErpTh({ children, className, ...props }: React.ThHTMLAttributes<HTMLTableCellElement>) {
  return <th className={cn('text-left px-4 py-3 text-[#909399] font-medium border-b border-[#ebeef5]', className)} {...props}>{children}</th>;
}

export function ErpTbody({ children }: { children: React.ReactNode }) {
  return <tbody>{children}</tbody>;
}

export function ErpTr({ children, className }: { children: React.ReactNode; className?: string }) {
  return <tr className={cn('border-b border-[#ebeef5] hover:bg-[#f5f7fa] transition-colors', className)}>{children}</tr>;
}

export function ErpTd({ children, className, ...props }: React.TdHTMLAttributes<HTMLTableCellElement>) {
  return <td className={cn('px-4 py-2.5 text-[#606266]', className)} {...props}>{children}</td>;
}

export function ErpEmpty({ colSpan, message = '暂无数据' }: { colSpan: number; message?: string }) {
  return <tr><td colSpan={colSpan} className="text-center text-[#909399] py-16">{message}</td></tr>;
}

export function ErpLink({ children, onClick }: { children: React.ReactNode; onClick?: () => void }) {
  return <button onClick={onClick} className="text-[#409eff] cursor-pointer hover:underline">{children}</button>;
}

export function ErpAction({ children }: { children: React.ReactNode }) {
  return <div className="flex items-center gap-4">{children}</div>;
}

export function ErpActionBtn({ children, onClick, danger }: { children: React.ReactNode; onClick?: () => void; danger?: boolean }) {
  return <button onClick={onClick} className={`text-[13px] inline-flex items-center gap-0.5 hover:opacity-80 ${danger ? 'text-[#f56c6c]' : 'text-[#409eff]'}`}>{children}</button>;
}

/* ===== Table toolbar icons ===== */
export function ErpTools({ onRefresh, onSettings }: { onRefresh?: () => void; onSettings?: () => void }) {
  return (
    <div className="flex items-center justify-end px-4 py-1.5 bg-[#f5f7fa] border-b border-[#ebeef5] gap-1">
      <button onClick={onRefresh} title="刷新" className="p-1.5 hover:bg-white rounded text-[#909399] hover:text-[#409eff] transition-colors"><RefreshCw className="h-4 w-4"/></button>
      <button onClick={onSettings} title="列设置" className="p-1.5 hover:bg-white rounded text-[#909399] hover:text-[#409eff] transition-colors"><Settings className="h-4 w-4"/></button>
    </div>
  );
}

/* ===== Status dot ===== */
export function ErpStatus({ active }: { active: boolean }) {
  return (
    <span className="inline-flex items-center gap-1.5">
      <span className={`w-1.5 h-1.5 rounded-full ${active ? 'bg-[#67c23a]' : 'bg-[#c0c4cc]'}`} />
      {active ? '启用' : '停用'}
    </span>
  );
}

/* ===== Approval badge ===== */
export function ErpApproval({ status, labels = { DRAFT: '草稿', SUBMITTED: '已提交', APPROVED: '已通过', REJECTED: '已拒绝' } }: { status: string; labels?: Record<string, string> }) {
  const colors: Record<string, string> = {
    APPROVED: 'bg-[#f0f9eb] text-[#67c23a]',
    SUBMITTED: 'bg-[#ecf5ff] text-[#409eff]',
    REJECTED: 'bg-[#fef0f0] text-[#f56c6c]',
    DRAFT: 'bg-[#f4f4f5] text-[#909399]',
  };
  return <span className={`inline-flex px-1.5 py-0.5 rounded text-[12px] ${colors[status] || colors.DRAFT}`}>{labels[status] || status}</span>;
}

/* ===== Pagination ===== */
export function ErpPagination({ page, pageSize, total, onPage, onPageSize }: {
  page: number; pageSize: number; total: number;
  onPage: (p: number) => void; onPageSize: (v: string) => void;
}) {
  const tp = Math.ceil(total / pageSize);
  const pgs = Array.from({ length: tp }, (_, i) => i + 1).filter(p => p === 1 || p === tp || Math.abs(p - page) <= 2);
  return (
    <div className="flex items-center justify-end px-4 py-2.5 border-t border-[#ebeef5] gap-3">
      <span className="text-[13px] text-[#909399]">共 <span className="text-[#409eff]">{total}</span> 条</span>
      <Select value={String(pageSize)} onValueChange={v => { if (v) { onPageSize(v); onPage(1); } }}>
        <SelectTrigger className="w-[100px] h-9 rounded-md border border-border bg-background px-3 text-[13px]"><SelectValue /></SelectTrigger>
        <SelectContent>{[20, 30, 50, 100].map(n => <SelectItem key={n} value={String(n)}>{n}条/页</SelectItem>)}</SelectContent>
      </Select>
      <div className="flex items-center gap-0.5">
        <Button variant="outline" size="icon" className="h-8 w-8" disabled={page <= 1} onClick={() => onPage(page - 1)}><ChevronLeft className="h-4 w-4" /></Button>
        {pgs.map((p, i) => (
          <span key={p}>
            {i > 0 && pgs[i - 1] !== p - 1 && <span className="text-[#909399] mx-0.5">...</span>}
            <button onClick={() => onPage(p)} className={`h-8 w-8 rounded-md text-[13px] transition-colors ${p === page ? 'bg-[#409eff] text-white' : 'border border-[#ebeef5] text-[#606266] hover:bg-[#f5f7fa]'}`}>{p}</button>
          </span>
        ))}
        <Button variant="outline" size="icon" className="h-8 w-8" disabled={page >= tp} onClick={() => onPage(page + 1)}><ChevronRight className="h-4 w-4" /></Button>
      </div>
    </div>
  );
}

/* ===== ErpListPage — unified list page container (no card shadow, just border) ===== */
export function ErpListPage({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <div className={cn('bg-background rounded-lg border border-border', className)}>
      {children}
    </div>
  );
}
