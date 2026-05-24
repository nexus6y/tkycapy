'use client';
import { useEffect, useState } from 'react';
import api from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

export default function MaterialParamPage() {
  const [form, setForm] = useState({ codeFormat: '', allowDuplicateName: false, autoApproval: false, defaultStatus: 'ACTIVE' });
  const [loading, setLoading] = useState(false);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    api.get('/material-params').then(r => setForm({
      codeFormat: r.data.codeFormat || '',
      allowDuplicateName: r.data.allowDuplicateName,
      autoApproval: r.data.autoApproval,
      defaultStatus: r.data.defaultStatus,
    }));
  }, []);

  const handleSave = async () => {
    setLoading(true); setSaved(false);
    await api.put('/material-params', form);
    setLoading(false); setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  return (
    <div className="p-6 space-y-4 max-w-2xl">
      <h1 className="text-xl font-bold">物料参数</h1>
      <Card className="p-6 space-y-4">
        <div>
          <label className="text-sm font-medium">物料编码格式</label>
          <Input value={form.codeFormat} onChange={e => setForm({ ...form, codeFormat: e.target.value })} placeholder="如: MAT{yyyyMM}{seq:4}" />
          <p className="text-xs text-gray-400 mt-1">{'{yyyyMM} 年月, {seq:4} 4位流水号'}</p>
        </div>
        <div>
          <label className="text-sm font-medium">允许物料重名</label>
          <Select value={form.allowDuplicateName ? 'true' : 'false'} onValueChange={v => setForm({ ...form, allowDuplicateName: v === 'true' })}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent><SelectItem value="false">不允许</SelectItem><SelectItem value="true">允许</SelectItem></SelectContent>
          </Select>
        </div>
        <div>
          <label className="text-sm font-medium">物料自动审批</label>
          <Select value={form.autoApproval ? 'true' : 'false'} onValueChange={v => setForm({ ...form, autoApproval: v === 'true' })}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent><SelectItem value="false">关闭</SelectItem><SelectItem value="true">开启</SelectItem></SelectContent>
          </Select>
        </div>
        <div>
          <label className="text-sm font-medium">默认状态</label>
          <Select value={form.defaultStatus} onValueChange={v => setForm({ ...form, defaultStatus: v })}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent><SelectItem value="ACTIVE">启用</SelectItem><SelectItem value="INACTIVE">停用</SelectItem></SelectContent>
          </Select>
        </div>
        <div className="flex items-center gap-3">
          <Button onClick={handleSave} disabled={loading}>{loading ? '保存中...' : '保存'}</Button>
          {saved && <span className="text-green-600 text-sm">保存成功</span>}
        </div>
      </Card>
    </div>
  );
}
