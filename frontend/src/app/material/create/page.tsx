'use client';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import api from '@/lib/api';
import { Input } from '@/components/ui/input';
import { EntitySelect } from '@/components/form/entity-select';
import { Switch } from '@/components/ui/switch';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Textarea } from '@/components/ui/textarea';
import { toast } from '@/components/ui/toast';
import { FormLayout, FormSection, FormGrid, FormField } from '@/components/form/form-layout';

const FI = 'h-9 rounded-md border border-border bg-background px-3 text-[13px] w-full';

const SECTIONS = [
  { id:'basic', title:'基本信息' },
  { id:'nature', title:'物料性质' },
  { id:'unit', title:'计量单位' },
  { id:'purchase', title:'采购信息' },
  { id:'qa_sales', title:'质检与销售' },
  { id:'warehouse', title:'仓储信息' },
  { id:'prod', title:'生产与工时' },
];

export default function MaterialCreatePage() {
  const router = useRouter();
  const [f,setF]=useState<any>({
    code:'',name:'',categoryId:'',unitId:'',specification:'',externalCode:'',
    materialType:'PHYSICAL',materialProperty:'',productCategory:'',unifiedUnit:true,sortOrder:0,status:'ACTIVE',remark:'',

    defaultSupplier:'',defaultPurchaser:'',minPurchaseQty:'',plannedPrice:'',requiredManufacturer:'',excludedManufacturer:'',responsiblePerson:'',
    needInspection:false,defectRateLimit:'',defaultSalesperson:'',minOrderQty:'',
    defaultWarehouseId:'',safetyStockQty:'',maxStockQty:'',minStockQty:'',batchManaged:false,shelfLifeManaged:false,remainingShelfLife:'',serialManaged:false,
    directProduction:false,planAttribute:'',economicBatch:'',batchMultiple:'',lossRate:'',defaultDeptId:'',issueMethod:'',
    prodStdQty:'',prodStdHours:'',repairStdQty:'',repairStdHours:'',maintStdQty:'',maintStdHours:'',
  });
  useEffect(()=>{api.get('/common/next-code',{params:{entity:'material'}}).then(r=>setF((prev:any)=>({...prev,code:r.data.code})));},[]);

  const save = async () => {
    try { await api.post('/materials', f); router.push('/material'); }
    catch(e:any) { toast(e.response?.data?.message||'保存失败','error'); }
  };

  return (
    <FormLayout title="新增物料档案" onSave={save} sections={SECTIONS} activeSection="basic">

      {/* 基本信息 */}
      <FormSection id="basic" title="基本信息">
        <FormGrid>
          <FormField label="1级分类" required>
            <EntitySelect entity="materialCategory" value={f.categoryId} onChange={(id:any)=>setF({...f,categoryId:id})} placeholder="选择分类"/>
          </FormField>
          <FormField label="物料编号"><Input className={FI} value={f.code} readOnly disabled/></FormField>
          <FormField label="物料名称" required><Input className={FI} value={f.name} onChange={e=>setF({...f,name:e.target.value})} data-testid="material-name-input"/></FormField>
          <FormField label="规格型号"><Input className={FI} value={f.specification} onChange={e=>setF({...f,specification:e.target.value})}/></FormField>
          <FormField label="外部编码"><Input className={FI} value={f.externalCode} onChange={e=>setF({...f,externalCode:e.target.value})}/></FormField>
          <FormField label="排序"><Input type="number" className={FI} value={f.sortOrder} onChange={e=>setF({...f,sortOrder:+e.target.value})}/></FormField>
          <FormField label="状态">
            <RadioGroup value={f.status} onValueChange={(v:any)=>setF({...f,status:v})} className="flex items-center gap-4 pt-1.5">
              <div className="flex items-center gap-1.5"><RadioGroupItem value="ACTIVE" id="s-active"/><label htmlFor="s-active" className="text-[13px]">启用</label></div>
              <div className="flex items-center gap-1.5"><RadioGroupItem value="INACTIVE" id="s-inactive"/><label htmlFor="s-inactive" className="text-[13px]">停用</label></div>
            </RadioGroup>
          </FormField>
          <div className="col-span-2"><FormField label="备注"><Textarea className={`${FI} h-20`} value={f.remark} onChange={e=>setF({...f,remark:e.target.value})}/></FormField></div>
        </FormGrid>
      </FormSection>

      {/* 物料性质 */}
      <FormSection id="nature" title="物料性质">
        <FormGrid>
          <FormField label="物料性质" required>
            <RadioGroup value={f.materialType} onValueChange={(v:any)=>setF({...f,materialType:v})} className="flex items-center gap-4 pt-1.5">
              <div className="flex items-center gap-1.5"><RadioGroupItem value="PHYSICAL" id="mt-phys"/><label htmlFor="mt-phys" className="text-[13px]">实物</label></div>
              <div className="flex items-center gap-1.5"><RadioGroupItem value="VIRTUAL" id="mt-virt"/><label htmlFor="mt-virt" className="text-[13px]">虚拟</label></div>
            </RadioGroup>
          </FormField>
          <FormField label="物料属性"><Input className={FI} value={f.materialProperty} onChange={e=>setF({...f,materialProperty:e.target.value})}/></FormField>
          <FormField label="产品分类" required><Input className={FI} value={f.productCategory} onChange={e=>setF({...f,productCategory:e.target.value})}/></FormField>
        </FormGrid>
      </FormSection>

      {/* 计量单位 */}
      <FormSection id="unit" title="计量单位">
        <FormGrid>
          <FormField label="统一计量单位">
            <RadioGroup value={f.unifiedUnit?'true':'false'} onValueChange={(v:any)=>setF({...f,unifiedUnit:v==='true'})} className="flex items-center gap-4 pt-1.5">
              <div className="flex items-center gap-1.5"><RadioGroupItem value="true" id="uu-yes"/><label htmlFor="uu-yes" className="text-[13px]">是</label></div>
              <div className="flex items-center gap-1.5"><RadioGroupItem value="false" id="uu-no"/><label htmlFor="uu-no" className="text-[13px]">否</label></div>
            </RadioGroup>
          </FormField>
          <FormField label="计量单位" required>
            <EntitySelect entity="measurementUnit" value={f.unitId} onChange={(id:any)=>setF({...f,unitId:id})} placeholder="选择单位"/>
          </FormField>
        </FormGrid>
      </FormSection>

      {/* 采购信息 */}
      <FormSection id="purchase" title="采购信息">
        <FormGrid>
          <FormField label="默认供应商"><Input className={FI} value={f.defaultSupplier} onChange={e=>setF({...f,defaultSupplier:e.target.value})}/></FormField>
          <FormField label="默认采购员"><Input className={FI} value={f.defaultPurchaser} onChange={e=>setF({...f,defaultPurchaser:e.target.value})}/></FormField>
          <FormField label="最小采购数量"><Input type="number" className={FI} value={f.minPurchaseQty} onChange={e=>setF({...f,minPurchaseQty:e.target.value})}/></FormField>
          <FormField label="计划采购价"><Input type="number" className={FI} value={f.plannedPrice} onChange={e=>setF({...f,plannedPrice:e.target.value})}/></FormField>
          <FormField label="要求生产厂家"><Input className={FI} value={f.requiredManufacturer} onChange={e=>setF({...f,requiredManufacturer:e.target.value})}/></FormField>
          <FormField label="排除厂家"><Input className={FI} value={f.excludedManufacturer} onChange={e=>setF({...f,excludedManufacturer:e.target.value})}/></FormField>
          <FormField label="主办人"><Input className={FI} value={f.responsiblePerson} onChange={e=>setF({...f,responsiblePerson:e.target.value})}/></FormField>
        </FormGrid>
      </FormSection>

      {/* 质检与销售 */}
      <FormSection id="qa_sales" title="质检与销售">
        <FormGrid>
          <FormField label="是否质检">
            <Switch checked={f.needInspection} onCheckedChange={v=>setF({...f,needInspection:v})} className="mt-1.5"/>
          </FormField>
          <FormField label="不合格比例下限(%)"><Input type="number" className={FI} value={f.defectRateLimit} onChange={e=>setF({...f,defectRateLimit:e.target.value})}/></FormField>
          <FormField label="默认销售员"><Input className={FI} value={f.defaultSalesperson} onChange={e=>setF({...f,defaultSalesperson:e.target.value})}/></FormField>
          <FormField label="最小起订数量"><Input type="number" className={FI} value={f.minOrderQty} onChange={e=>setF({...f,minOrderQty:e.target.value})}/></FormField>
        </FormGrid>
      </FormSection>

      {/* 仓储信息 */}
      <FormSection id="warehouse" title="仓储信息">
        <FormGrid>
          <FormField label="默认存储仓库"><Input className={FI} value={f.defaultWarehouseId} onChange={e=>setF({...f,defaultWarehouseId:e.target.value})}/></FormField>
          <FormField label="安全库存数量"><Input type="number" className={FI} value={f.safetyStockQty} onChange={e=>setF({...f,safetyStockQty:e.target.value})}/></FormField>
          <FormField label="最高库存数量"><Input type="number" className={FI} value={f.maxStockQty} onChange={e=>setF({...f,maxStockQty:e.target.value})}/></FormField>
          <FormField label="最低库存数量"><Input type="number" className={FI} value={f.minStockQty} onChange={e=>setF({...f,minStockQty:e.target.value})}/></FormField>
          <FormField label="批次管理"><Switch checked={f.batchManaged} onCheckedChange={v=>setF({...f,batchManaged:v})} className="mt-1.5"/></FormField>
          <FormField label="效期管理"><Switch checked={f.shelfLifeManaged} onCheckedChange={v=>setF({...f,shelfLifeManaged:v})} className="mt-1.5"/></FormField>
          <FormField label="剩余有效期(天)"><Input type="number" className={FI} value={f.remainingShelfLife} onChange={e=>setF({...f,remainingShelfLife:e.target.value})}/></FormField>
          <FormField label="序列号管理"><Switch checked={f.serialManaged} onCheckedChange={v=>setF({...f,serialManaged:v})} className="mt-1.5"/></FormField>
        </FormGrid>
      </FormSection>

      {/* 生产与工时 */}
      <FormSection id="prod" title="生产与工时">
        <FormGrid>
          <FormField label="直接生产"><Switch checked={f.directProduction} onCheckedChange={v=>setF({...f,directProduction:v})} className="mt-1.5"/></FormField>
          <FormField label="计划属性" required><Input className={FI} value={f.planAttribute} onChange={e=>setF({...f,planAttribute:e.target.value})}/></FormField>
          <FormField label="经济批量"><Input type="number" className={FI} value={f.economicBatch} onChange={e=>setF({...f,economicBatch:e.target.value})}/></FormField>
          <FormField label="批量倍量"><Input type="number" className={FI} value={f.batchMultiple} onChange={e=>setF({...f,batchMultiple:e.target.value})}/></FormField>
          <FormField label="损耗率(%)"><Input type="number" className={FI} value={f.lossRate} onChange={e=>setF({...f,lossRate:e.target.value})}/></FormField>
          <FormField label="默认生产部门"><Input className={FI} value={f.defaultDeptId} onChange={e=>setF({...f,defaultDeptId:e.target.value})}/></FormField>
          <FormField label="发料方式"><Input className={FI} value={f.issueMethod} onChange={e=>setF({...f,issueMethod:e.target.value})}/></FormField>
        </FormGrid>
        <div className="mt-5 pt-4 border-t">
          <h3 className="text-[13px] font-bold text-foreground mb-3">生产标准工时</h3>
          <FormGrid>
            <FormField label="生产数量"><Input type="number" className={FI} value={f.prodStdQty} onChange={e=>setF({...f,prodStdQty:e.target.value})}/></FormField>
            <FormField label="单人用时(时)"><Input type="number" className={FI} value={f.prodStdHours} onChange={e=>setF({...f,prodStdHours:e.target.value})}/></FormField>
            <FormField label="检修数量"><Input type="number" className={FI} value={f.repairStdQty} onChange={e=>setF({...f,repairStdQty:e.target.value})}/></FormField>
            <FormField label="单人工时(检修)"><Input type="number" className={FI} value={f.repairStdHours} onChange={e=>setF({...f,repairStdHours:e.target.value})}/></FormField>
            <FormField label="维修数量"><Input type="number" className={FI} value={f.maintStdQty} onChange={e=>setF({...f,maintStdQty:e.target.value})}/></FormField>
            <FormField label="单人工时(维修)"><Input type="number" className={FI} value={f.maintStdHours} onChange={e=>setF({...f,maintStdHours:e.target.value})}/></FormField>
          </FormGrid>
        </div>
      </FormSection>
    </FormLayout>
  );
}
