'use client';

import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { ChevronDown, Download, Plus, Search, Upload } from 'lucide-react';

/* ===== ErpToolbar — standard list page action bar ===== */
export function ErpToolbar({
  addLabel = '新增',
  addHref,
  onAdd,
  editLabel = '修改',
  editDisabled = true,
  onEdit,
  deleteLabel = '删除',
  deleteDisabled = true,
  onDelete,
  showImport = false,
  importItems,
  showExport = false,
  onExport,
  extraLeft,
  showReset = true,
  onReset,
  showSearch = true,
  onSearch,
  searchLabel = '搜索',
  showAdvanced,
  advancedOpen,
  onAdvancedToggle,
  extraRight,
}: {
  addLabel?: string;
  addHref?: string;
  onAdd?: () => void;
  editLabel?: string;
  editDisabled?: boolean;
  onEdit?: () => void;
  deleteLabel?: string;
  deleteDisabled?: boolean;
  onDelete?: () => void;
  showImport?: boolean;
  importItems?: { label: string; icon?: React.ReactNode; onClick: () => void }[];
  showExport?: boolean;
  onExport?: () => void;
  extraLeft?: React.ReactNode;
  showReset?: boolean;
  onReset?: () => void;
  showSearch?: boolean;
  onSearch?: () => void;
  searchLabel?: string;
  showAdvanced?: boolean;
  advancedOpen?: boolean;
  onAdvancedToggle?: () => void;
  extraRight?: React.ReactNode;
}) {
  const router = useRouter();

  const handleAdd = () => {
    if (onAdd) onAdd();
    else if (addHref) router.push(addHref);
  };

  return (
    <div className="flex items-center justify-between px-4 h-14 border-b border-border">
      <div className="flex items-center gap-1">
        {/* New */}
        <Button variant="secondary" size="sm" onClick={handleAdd}>
          <Plus className="h-3.5 w-3.5" />
          {addLabel}
        </Button>

        {/* Edit */}
        {(onEdit || editDisabled) && (
          <Button
            variant="outline"
            size="sm"
            disabled={editDisabled}
            onClick={onEdit || (() => {})}
          >
            {editLabel}
          </Button>
        )}

        {/* Delete */}
        {(onDelete || deleteDisabled) && (
          <Button
            variant="outline"
            size="sm"
            disabled={deleteDisabled}
            onClick={onDelete || (() => {})}
          >
            {deleteLabel}
          </Button>
        )}

        {/* Import dropdown */}
        {showImport && importItems && (
          <DropdownMenu>
            <DropdownMenuTrigger className="inline-flex items-center justify-center gap-1 rounded-md border border-border bg-background px-2.5 h-7 text-[13px] font-medium hover:bg-accent hover:text-accent-foreground transition-colors">
              导入 <ChevronDown className="h-3 w-3" />
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start">
              {importItems.map((item, i) => (
                <DropdownMenuItem key={i} onClick={item.onClick}>
                  {item.icon}
                  {item.label}
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>
        )}

        {/* Export */}
        {showExport && (
          <Button variant="outline" size="sm" onClick={onExport}>
            <Download className="h-3.5 w-3.5 mr-1" />导出
          </Button>
        )}

        {extraLeft}
      </div>

      <div className="flex items-center gap-1">
        {/* Reset */}
        {showReset && onReset && (
          <Button variant="ghost" size="sm" onClick={onReset}>
            重置
          </Button>
        )}

        {/* Saved search dropdown (optional) — slot via extraRight */}
        {extraRight}

        {/* Search */}
        {showSearch && onSearch && (
          <Button variant="default" size="sm" onClick={onSearch}>
            <Search className="h-3.5 w-3.5 mr-1" />
            {searchLabel}
          </Button>
        )}

        {/* Advanced toggle */}
        {showAdvanced && onAdvancedToggle && (
          <Button variant="ghost" size="sm" onClick={onAdvancedToggle}>
            {advancedOpen ? '收起' : '高级搜索'}
          </Button>
        )}
      </div>
    </div>
  );
}
