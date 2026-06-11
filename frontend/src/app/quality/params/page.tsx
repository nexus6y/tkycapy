'use client';
import { useEffect, useState } from 'react';
import api from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { toast } from '@/components/ui/toast';

const DOC_TYPES = [
  { key:'purchaseOrder', label:'采购到货入库' },
  { key:'salesReturn', label:'销售退货' },
  { key:'outsource', label:'委外到货' },
  { key:'transfer', label:'材料物资调拨' },
  { key:'productionReturn', label:'生产退料' },
];

export default function QualityParamsPage() {
  const [f,setF]=useState({autoApproval:false,defectRateThreshold:'5',inspectionTemplate:'标准质检模板',needInspectionDocs:{} as Record<string,boolean>});
  const [loading,setLoading]=useState(true);const [saving,setSaving]=useState(false);

  useEffect(()=>{
    api.get('/quality-params').then(r=>{
      const d=r.data;
      setF({
        autoApproval:d.autoApproval||false,
        defectRateThreshold:d.defectRateThreshold||'5',
        inspectionTemplate:d.inspectionTemplate||'标准质检模板',
        needInspectionDocs:d.needInspectionDocs||{purchaseOrder:true,salesReturn:true,outsource:true,transfer:true,productionReturn:true},
      });
      setLoading(false);
    }).catch(()=>setLoading(false));
  },[]);

  const toggleDocType=(key:string,checked:boolean)=>{
    setF(prev=>({...prev,needInspectionDocs:{...prev.needInspectionDocs,[key]:checked}}));
  };

  const save=async()=>{
    setSaving(true);
    try{await api.put('/quality-params',f);toast('质检参数已保存','success');}
    catch(e:any){toast(e.response?.data?.message||'保存失败','error');}
    finally{setSaving(false);}
  };

  if(loading)return <div className="p-6 max-w-3xl"><div className="text-muted-foreground text-[13px]">加载中...</div></div>;

  return (
    <div className="p-6 max-w-3xl">
      <div className="bg-background rounded-lg border p-6 space-y-6">
        <h1 className="text-lg font-bold">质检参数</h1>

        {/* 需质检单据类型 — per doc: 勾选需要质检的单据类型 */}
        <div className="space-y-3">
          <h2 className="text-[14px] font-medium text-[#303133]">需质检单据类型</h2>
          <p className="text-[12px] text-[#909399]">
            勾选需要质检的单据类型。不勾选默认不质检。勾选后，若物料档案"是否质检"=是，则该物料需质检。
          </p>
          <div className="flex flex-wrap gap-6">
            {DOC_TYPES.map(dt=>(
              <label key={dt.key} className="flex items-center gap-2 cursor-pointer">
                <Checkbox checked={f.needInspectionDocs[dt.key]||false} onCheckedChange={(v)=>toggleDocType(dt.key,!!v)}/>
                <span className="text-[13px] text-[#303133]">{dt.label}</span>
              </label>
            ))}
          </div>
        </div>

        <div className="border-t pt-4 space-y-4">
          <div>
            <label className="text-[13px] font-medium text-[#303133]">不合格品率阈值(%)</label>
            <p className="text-[12px] text-[#909399] mb-1">批量不合格判定标准。抽样不合格比例超过此值时，整批判定不合格。</p>
            <input type="number" className="h-9 w-[120px] rounded-md border border-[#dcdfe6] bg-white px-3 text-[13px]"
              value={f.defectRateThreshold} onChange={e=>setF({...f,defectRateThreshold:e.target.value})}/>
          </div>
        </div>

        <div className="flex items-center gap-3 pt-2">
          <Button size="sm" onClick={save} disabled={saving}>{saving?'保存中...':'保存'}</Button>
        </div>
      </div>
    </div>
  );
}
