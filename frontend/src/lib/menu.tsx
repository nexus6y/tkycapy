import { LayoutGrid, Package, FolderKanban, FileText, ShoppingCart, TrendingUp, ShoppingBag, ShieldCheck, Factory, Warehouse, Calculator, Settings } from 'lucide-react';

export interface MenuItem {
  code: string; name: string; icon?: React.ReactNode; path?: string;
  children?: MenuItem[];
}

export const menuConfig: MenuItem[] = [
  {
    code: 'dashboard', name: '工作台', icon: <LayoutGrid size={16} />, path: '/',
  },
  {
    code: 'foundation', name: '公共基础', icon: <Package size={16} />, children: [
      { code: 'material', name: '物料管理', children: [
        { code: 'materialCategory', name: '物料分类', path: '/material-category' },
        { code: 'materialParam', name: '物料参数', path: '/material-param' },
        { code: 'materialArchives', name: '物料档案', path: '/material' },
        { code: 'materialApproval', name: '物料审批', path: '/material-approval' },
      ]},
      { code: 'project', name: '项目管理', children: [
        { code: 'projectMaintain', name: '项目维护', path: '/project' },
        { code: 'projectQuery', name: '项目查询', path: '/project/query' },
      ]},
      { code: 'contract', name: '合同管理', children: [
        { code: 'contractMaintain', name: '合同维护', path: '/contract' },
        { code: 'contractParam', name: '合同参数', path: '/contract/params' },
        { code: 'contractQuery', name: '合同查询', path: '/contract/query' },
      ]},
    ],
  },
  {
    code: 'sales', name: '销售管理', icon: <ShoppingCart size={16} />, children: [
      { code: 'customer', name: '客户档案', path: '/sales/customer' },
      { code: 'saleParam', name: '销售参数', path: '/sales/params' },
      { code: 'quotation', name: '报价单维护', path: '/sales/quotation' },
      { code: 'preOrder', name: '分劈单维护', path: '/sales/pre-order' },
      { code: 'saleOrder', name: '销售订单维护', path: '/sales/order' },
      { code: 'saleShipment', name: '销售出货维护', path: '/sales/shipment' },
      { code: 'saleReturn', name: '销售退货维护', path: '/sales/return' },
      { code: 'saleTrace', name: '销售执行追溯', path: '/sales/trace' },
      { code: 'saleQuery', name: '销售查询', children: [
        { code: 'quotationQuery', name: '报价单查询', path: '/sales/query/quotation' },
        { code: 'preOrderQuery', name: '分劈单查询', path: '/sales/query/pre-order' },
        { code: 'saleOrderQuery', name: '销售订单查询', path: '/sales/query/order' },
        { code: 'shipmentQuery', name: '销售出货查询', path: '/sales/query/shipment' },
        { code: 'returnQuery', name: '销售退货查询', path: '/sales/query/return' },
      ]},
    ],
  },
  {
    code: 'ops', name: '运营管理', icon: <TrendingUp size={16} />, children: [
      { code: 'demand', name: '运营需求', children: [
        { code: 'demandPlan', name: '需求计划维护', path: '/ops/demand-plan' },
        { code: 'demandQuery', name: '需求计划查询', path: '/ops/demand-query' },
      ]},
    ],
  },
  {
    code: 'purchase', name: '采购管理', icon: <ShoppingBag size={16} />, children: [
      { code: 'supplier', name: '供应商档案', path: '/purchase/supplier' },
      { code: 'purchaseParam', name: '采购参数', path: '/purchase/params' },
      { code: 'purchasePlan', name: '采购计划维护', path: '/purchase/plan' },
      { code: 'purchaseOrder', name: '采购订单维护', path: '/purchase/order' },
      { code: 'purchaseReturn', name: '退供单维护', path: '/purchase/return' },
      { code: 'purchaseTrace', name: '采购合同追溯', path: '/purchase/trace' },
      { code: 'purchaseQuery', name: '采购查询', children: [
        { code: 'planQuery', name: '采购计划查询', path: '/purchase/query/plan' },
        { code: 'orderQuery', name: '采购订单查询', path: '/purchase/query/order' },
        { code: 'returnQuery', name: '退供单查询', path: '/purchase/query/return' },
      ]},
    ],
  },
  {
    code: 'quality', name: '质量管理', icon: <ShieldCheck size={16} />, children: [
      { code: 'qualityParam', name: '质检参数', path: '/quality/params' },
      { code: 'inspection', name: '质检单维护', path: '/quality/inspection' },
      { code: 'defective', name: '不良品台账', path: '/quality/defective' },
      { code: 'inspectionQuery', name: '质检单查询', path: '/quality/inspection-query' },
    ],
  },
  {
    code: 'production', name: '标准生产', icon: <Factory size={16} />, children: [
      { code: 'mfgBase', name: '制造基础', children: [
        { code: 'bomMgt', name: 'BOM管理', children: [
          { code: 'bomMaintain', name: 'BOM维护', path: '/production/bom' },
          { code: 'bomDiff', name: 'BOM差异分析', path: '/production/bom-diff' },
        ]},
        { code: 'processMgt', name: '工艺管理', children: [
          { code: 'standardProcess', name: '标准工序', path: '/production/process' },
          { code: 'processRoute', name: '工艺路线', path: '/production/route' },
        ]},
      ]},
      { code: 'prodMgt', name: '生产管理', children: [
        { code: 'prodOrder', name: '生产订单工作台', path: '/production/order' },
        { code: 'prodChange', name: '生产变更', path: '/production/change' },
        { code: 'issue', name: '领料单维护', path: '/production/issue' },
        { code: 'return', name: '退料单维护', path: '/production/return' },
        { code: 'issueTrace', name: '领料全追溯', path: '/production/issue-trace' },
        { code: 'completeAudit', name: '完工报告审核', path: '/production/complete-audit' },
        { code: 'damageAudit', name: '制损单审核', path: '/production/damage-audit' },
        { code: 'prodQuery', name: '生产查询', children: [
          { code: 'orderQuery', name: '生产订单工作台查询', path: '/production/query/order' },
          { code: 'issueQuery', name: '领料单查询', path: '/production/query/issue' },
          { code: 'returnQuery', name: '退料单查询', path: '/production/query/return' },
        ]},
      ]},
    ],
  },
  {
    code: 'warehouse', name: '仓储管理', icon: <Warehouse size={16} />, children: [
      { code: 'whBase', name: '仓储基础', children: [
        { code: 'area', name: '地区', path: '/warehouse/area' },
        { code: 'warehouse', name: '仓库', path: '/warehouse/warehouse' },
        { code: 'zone', name: '储区', path: '/warehouse/zone' },
        { code: 'passage', name: '通道', path: '/warehouse/passage' },
        { code: 'shelf', name: '货架', path: '/warehouse/shelf' },
        { code: 'location', name: '货位', path: '/warehouse/location' },
      ]},
      { code: 'inbound', name: '入库管理', children: [
        { code: 'arrival', name: '到货确认', path: '/warehouse/arrival' },
        { code: 'inboundOrder', name: '入库单维护', path: '/warehouse/inbound' },
        { code: 'inboundQuery', name: '入库单查询', path: '/warehouse/inbound-query' },
      ]},
      { code: 'outbound', name: '出库管理', children: [
        { code: 'outboundOrder', name: '出库单维护', path: '/warehouse/outbound' },
        { code: 'outboundQuery', name: '出库单查询', path: '/warehouse/outbound-query' },
      ]},
      { code: 'inventory', name: '库存管理', children: [
        { code: 'stockQuery', name: '库存查询', path: '/warehouse/stock' },
        { code: 'check', name: '盘点单维护', path: '/warehouse/check' },
      ]},
    ],
  },
  {
    code: 'cost', name: '成本管理', icon: <Calculator size={16} />, children: [
      { code: 'account', name: '存货核算', children: [
        { code: 'carryOver', name: '结转维护', path: '/cost/carry-over' },
        { code: 'carryOrder', name: '结转订单', path: '/cost/carry-order' },
        { code: 'procureIn', name: '采购入库', path: '/cost/procure-in' },
        { code: 'procureOut', name: '采购退供', path: '/cost/procure-out' },
      ]},
    ],
  },
  {
    code: 'system', name: '系统管理', icon: <Settings size={16} />, children: [
      { code: 'dept', name: '组织机构', path: '/system/dept' },
      { code: 'user', name: '用户管理', path: '/system/user' },
      { code: 'role', name: '角色管理', path: '/system/role' },
      { code: 'menu', name: '菜单管理', path: '/system/menu' },
      { code: 'permission', name: '权限分配', path: '/system/permission' },
      { code: 'dict', name: '字典管理', path: '/system/dict' },
      { code: 'log', name: '日志管理', children: [
        { code: 'loginLog', name: '登录日志', path: '/system/log/login' },
        { code: 'operateLog', name: '操作日志', path: '/system/log/operate' },
      ]},
    ],
  },
];
