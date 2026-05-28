'use client';
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

export default function ContractParamsPage() {
  const [form, setForm] = useState({ defaultType: '销售合同', autoApproval: false, amountWarning: '100000' });
  const [saved, setSaved] = useState(false);

  return (
    <div className="p-6 space-y-4 max-w-2xl">
      <h1 className="text-xl font-bold">合同参数</h1>
      <Card className="p-6 space-y-4">
        <div><label className="text-sm font-medium">默认合同类型</label>
          <Select value={form.defaultType} onValueChange={(v:any) => setForm({ ...form, defaultType: v })}>
            <SelectTrigger><SelectValue /></SelectTrigger><SelectContent><SelectItem value="销售合同">销售合同</SelectItem><SelectItem value="采购合同">采购合同</SelectItem></SelectContent>
          </Select>
        </div>
        <div><label className="text-sm font-medium">自动审批</label>
          <Select value={form.autoApproval ? 'true' : 'false'} onValueChange={(v:any) => setForm({ ...form, autoApproval: v === 'true' })}>
            <SelectTrigger><SelectValue /></SelectTrigger><SelectContent><SelectItem value="false">关闭</SelectItem><SelectItem value="true">开启</SelectItem></SelectContent>
          </Select>
        </div>
        <div><label className="text-sm font-medium">金额预警阈值</label><Input value={form.amountWarning} onChange={e => setForm({ ...form, amountWarning: e.target.value })} /></div>
        <div className="flex items-center gap-3">
          <Button onClick={() => { setSaved(true); setTimeout(() => setSaved(false), 2000); }}>保存</Button>
          {saved && <span className="text-green-600 text-sm">保存成功</span>}
        </div>
      </Card>
    </div>
  );
}
