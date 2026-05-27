'use client';
import { useRouter, usePathname } from 'next/navigation';
import { X } from 'lucide-react';
import { useState, useEffect } from 'react';

interface Tag { path: string; label: string; }
const LABELS: Record<string, string> = {
  '/':'工作台','/login':'登录',
  '/material':'物料档案','/material/create':'新增物料','/material-category':'物料分类','/material-param':'物料参数','/material-approval':'物料审批',
  '/project':'项目维护','/project/query':'项目查询',
  '/contract':'合同维护','/contract/params':'合同参数','/contract/query':'合同查询',
  '/sales/customer':'客户档案','/sales/params':'销售参数','/sales/quotation':'报价单维护','/sales/pre-order':'分劈单维护','/sales/order':'销售订单维护','/sales/shipment':'销售出货维护','/sales/return':'销售退货维护','/sales/trace':'销售执行追溯',
  '/sales/query/order':'销售订单查询','/sales/query/quotation':'报价单查询','/sales/query/pre-order':'分劈单查询','/sales/query/shipment':'销售出货查询','/sales/query/return':'销售退货查询',
  '/ops/demand-plan':'需求计划维护','/ops/demand-query':'需求计划查询',
  '/purchase/supplier':'供应商档案','/purchase/params':'采购参数','/purchase/plan':'采购计划维护','/purchase/order':'采购订单维护','/purchase/return':'退供单维护','/purchase/trace':'采购合同追溯',
  '/purchase/query/order':'采购订单查询','/purchase/query/plan':'采购计划查询','/purchase/query/return':'退供单查询',
  '/quality/params':'质检参数','/quality/inspection':'质检单维护','/quality/defective':'不良品台账','/quality/inspection-query':'质检单查询',
  '/production/bom':'BOM维护','/production/bom-diff':'BOM差异分析','/production/process':'标准工序','/production/route':'工艺路线',
  '/production/order':'生产订单工作台','/production/change':'生产变更','/production/issue':'领料单维护','/production/return':'退料单维护','/production/issue-trace':'领料全追溯','/production/complete-audit':'完工报告审核','/production/damage-audit':'制损单审核',
  '/production/query/order':'生产订单查询','/production/query/issue':'领料单查询','/production/query/return':'退料单查询',
  '/warehouse/area':'地区','/warehouse/warehouse':'仓库','/warehouse/zone':'储区','/warehouse/passage':'通道','/warehouse/shelf':'货架','/warehouse/location':'货位',
  '/warehouse/arrival':'到货确认','/warehouse/inbound':'入库单维护','/warehouse/inbound-query':'入库单查询','/warehouse/outbound':'出库单维护','/warehouse/outbound-query':'出库单查询',
  '/warehouse/stock':'库存查询','/warehouse/check':'盘点单维护','/warehouse/adjust-order':'调整单审核',
  '/warehouse/transfer-out':'调出单维护','/warehouse/transfer-in':'调入单维护',
  '/warehouse/scrap-apply':'报废申请','/warehouse/scrap-dispose':'报废处置','/warehouse/scrap-ledger':'报废台账','/warehouse/scrap-query':'报废查询',
  '/warehouse/lend-order':'借出单维护','/warehouse/return-order':'归还单维护',
  '/cost/carry-over':'结转维护','/cost/carry-order':'结转订单','/cost/procure-in':'采购入库','/cost/procure-out':'采购退供','/cost/account-period':'核算期间',
  '/system/dept':'组织机构','/system/user':'用户管理','/system/role':'角色管理','/system/menu':'菜单管理','/system/permission':'权限分配','/system/dict':'字典管理',
  '/system/log/login':'登录日志','/system/log/operate':'操作日志',
};
function getLabel(p:string){ return LABELS[p] || (p.includes('/create')?'新增'+LABELS[p.replace('/create','')]:p.includes('/edit')?'编辑':p.split('/').pop()||p); }

export default function TagsView() {
  const router = useRouter(); const pathname = usePathname();
  const [tags, setTags] = useState<Tag[]>([]);
  const getL = (p: string) => getLabel(p);

  useEffect(() => {
    if (pathname === '/login') return;
    setTags(prev => prev.some(t => t.path === pathname) ? prev : [...prev, { path: pathname, label: getL(pathname) }].slice(-10));
  }, [pathname]);

  if (tags.length === 0) return null;

  const close = (path: string) => {
    setTags(prev => { const n = prev.filter(t => t.path !== path); if (path === pathname && n.length > 0) router.push(n[n.length - 1].path); return n; });
  };

  return (
    <div className="h-[44px] bg-canvas border-b border-border flex items-center px-2 gap-0.5 overflow-x-auto shrink-0">
      {tags.map(tag => {
        const active = tag.path === pathname;
        return (
          <span key={tag.path} onClick={() => router.push(tag.path)}
            className={`inline-flex items-center gap-1.5 px-3 py-1 text-[13px] cursor-pointer whitespace-nowrap rounded-t-md border border-b-0 transition-colors select-none
              ${active ? 'bg-background text-primary border-border -mb-[1px]' : 'text-muted-foreground border-transparent hover:text-foreground hover:bg-muted/50'}`}
          >{tag.label}<X className="h-3 w-3 hover:text-destructive rounded-sm" onClick={e => { e.stopPropagation(); close(tag.path); }} /></span>
        );
      })}
    </div>
  );
}
