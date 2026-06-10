'use client';
import { useEffect, useState } from 'react';
import api from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from '@/components/ui/toast';

export default function SalesParamsPage() {
  const [f,setF]=useState({autoCode:'',defaultTax:'',pricePrecision:'',amountPrecision:'',validDays:''});
  const [loading,setLoading]=useState(true);
  const [saving,setSaving]=useState(false);

  useEffect(()=>{
    api.get('/sales-params').then(r=>{
      const d=r.data;
      setF({autoCode:d.autoCode||'Q{yyyyMM}{seq:4}',defaultTax:d.defaultTax||'13',pricePrecision:d.pricePrecision||'2',amountPrecision:d.amountPrecision||'2',validDays:d.validDays||'30'});
      setLoading(false);
    }).catch(()=>setLoading(false));
  },[]);

  const save=async()=>{
    setSaving(true);
    try{
      await api.put('/sales-params',f);
      toast('保存成功','success');
    }catch(e:any){toast(e.response?.data?.message||'保存失败','error');}
    finally{setSaving(false);}
  };

  if(loading)return<div className="p-6 max-w-2xl"><div className="text-muted-foreground text-[13px]">加载中...</div></div>;

  return (
    <div className="p-6 max-w-2xl"><div className="bg-white rounded-lg border p-6 space-y-4">
      <h1 className="text-lg font-bold">销售参数</h1>
      <div className="grid grid-cols-2 gap-4">
        <div><label className="text-[12px] font-medium">报价单编码规则</label><Input className="h-8 text-[13px]" value={f.autoCode} onChange={e=>setF({...f,autoCode:e.target.value})}/></div>
        <div><label className="text-[12px] font-medium">默认税率(%)</label><Input className="h-8 text-[13px]" value={f.defaultTax} onChange={e=>setF({...f,defaultTax:e.target.value})}/></div>
        <div><label className="text-[12px] font-medium">单价小数位</label><Select value={f.pricePrecision} onValueChange={(v:any)=>setF({...f,pricePrecision:v})}><SelectTrigger className="h-8 text-[13px]"><SelectValue/></SelectTrigger><SelectContent><SelectItem value="0">0</SelectItem><SelectItem value="2">2</SelectItem><SelectItem value="4">4</SelectItem><SelectItem value="6">6</SelectItem></SelectContent></Select></div>
        <div><label className="text-[12px] font-medium">金额小数位</label><Select value={f.amountPrecision} onValueChange={(v:any)=>setF({...f,amountPrecision:v})}><SelectTrigger className="h-8 text-[13px]"><SelectValue/></SelectTrigger><SelectContent><SelectItem value="0">0</SelectItem><SelectItem value="2">2</SelectItem><SelectItem value="4">4</SelectItem><SelectItem value="6">6</SelectItem></SelectContent></Select></div>
        <div><label className="text-[12px] font-medium">报价有效期(天)</label><Input className="h-8 text-[13px]" value={f.validDays} onChange={e=>setF({...f,validDays:e.target.value})}/></div>
      </div>
      <div className="flex items-center gap-3"><Button size="sm" onClick={save} disabled={saving}>{saving?'保存中...':'保存'}</Button></div>
    </div></div>
  );
}
