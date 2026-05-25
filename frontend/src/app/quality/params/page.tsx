'use client';
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

export default function QualityParamsPage() {
  const [f,setF]=useState({autoApproval:false,defectRateThreshold:'5',inspectionTemplate:'标准质检模板'});
  const [saved,setSaved]=useState(false);
  return (<div className="p-6 max-w-2xl"><div className="bg-background rounded-lg border p-6 space-y-4">
    <h1 className="text-lg font-bold">质检参数</h1>
    <div className="space-y-4">
      <div><label className="text-[13px] font-medium">自动审批</label><Select value={f.autoApproval?'true':'false'} onValueChange={v=>setF({...f,autoApproval:v==='true'})}><SelectTrigger className="h-9 rounded-md border border-border bg-background px-3 text-[13px] w-full"><SelectValue/></SelectTrigger><SelectContent><SelectItem value="false">关闭</SelectItem><SelectItem value="true">开启</SelectItem></SelectContent></Select></div>
      <div><label className="text-[13px] font-medium">不合格品率阈值(%)</label><Input className="h-9 rounded-md border border-border bg-background px-3 text-[13px]" value={f.defectRateThreshold} onChange={e=>setF({...f,defectRateThreshold:e.target.value})}/></div>
      <div><label className="text-[13px] font-medium">质检模板</label><Input className="h-9 rounded-md border border-border bg-background px-3 text-[13px]" value={f.inspectionTemplate} onChange={e=>setF({...f,inspectionTemplate:e.target.value})}/></div>
    </div>
    <div className="flex items-center gap-3"><Button size="sm" onClick={()=>{setSaved(true);setTimeout(()=>setSaved(false),2000);}}>保存</Button>{saved&&<span className="text-green-600 text-[12px]">保存成功</span>}</div>
  </div></div>);
}
