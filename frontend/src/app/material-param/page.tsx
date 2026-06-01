'use client';
import { useEffect, useState } from 'react';
import api from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ErpListPage } from '@/components/ui/erp-table';

const FI = 'h-9 rounded-md border border-border bg-background px-3 text-[13px]';
const FL = 'text-[13px] text-muted-foreground w-[140px] text-right shrink-0';

export default function MaterialParamPage() {
  const [form, setForm] = useState({
    codeFormat: '',
    allowDuplicateName: false,
    autoApproval: false,
    defaultStatus: 'ACTIVE',
  });
  const [loading, setLoading] = useState(false);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    api.get('/material-params').then(r =>
      setForm({
        codeFormat: r.data.codeFormat || '',
        allowDuplicateName: r.data.allowDuplicateName,
        autoApproval: r.data.autoApproval,
        defaultStatus: r.data.defaultStatus,
      })
    );
  }, []);

  const handleSave = async () => {
    setLoading(true);
    setSaved(false);
    await api.put('/material-params', form);
    setLoading(false);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  return (
    <ErpListPage>
      {/* Page header */}
      <div className="flex items-center justify-between px-4 h-14 border-b border-border">
        <span className="text-[15px] font-medium text-foreground">物料参数</span>
        <Button onClick={handleSave} disabled={loading} size="sm">
          {loading ? '保存中...' : '保存'}
        </Button>
      </div>

      {/* Form body */}
      <div className="p-6 max-w-2xl space-y-5">
        <div className="flex items-center gap-4">
          <span className={FL}>物料编码格式</span>
          <div className="flex-1">
            <Input
              className={`${FI} w-full`}
              value={form.codeFormat}
              onChange={e => setForm({ ...form, codeFormat: e.target.value })}
              placeholder="如: MAT{yyyyMM}{seq:4}"
            />
            <p className="text-[12px] text-muted-foreground mt-1">{'{yyyyMM} 年月, {seq:4} 4位流水号'}</p>
          </div>
        </div>

        <div className="flex items-center gap-4">
          <span className={FL}>允许物料重名</span>
          <div className="flex-1">
            <Select
              value={form.allowDuplicateName ? 'true' : 'false'}
              onValueChange={(v: any) => setForm({ ...form, allowDuplicateName: v === 'true' })}
            >
              <SelectTrigger className={`${FI} w-[200px]`}>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="false">不允许</SelectItem>
                <SelectItem value="true">允许</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="flex items-center gap-4">
          <span className={FL}>物料自动审批</span>
          <div className="flex-1">
            <Select
              value={form.autoApproval ? 'true' : 'false'}
              onValueChange={(v: any) => setForm({ ...form, autoApproval: v === 'true' })}
            >
              <SelectTrigger className={`${FI} w-[200px]`}>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="false">关闭</SelectItem>
                <SelectItem value="true">开启</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="flex items-center gap-4">
          <span className={FL}>默认状态</span>
          <div className="flex-1">
            <Select
              value={form.defaultStatus}
              onValueChange={(v: any) => setForm({ ...form, defaultStatus: v })}
            >
              <SelectTrigger className={`${FI} w-[200px]`}>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ACTIVE">启用</SelectItem>
                <SelectItem value="INACTIVE">停用</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        {saved && (
          <div className="flex items-center gap-4">
            <span className={FL} />
            <span className="text-[#67c23a] text-[13px]">保存成功</span>
          </div>
        )}
      </div>
    </ErpListPage>
  );
}
