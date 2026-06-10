/**
 * 弹窗选择器配置 — 每个实体类型的弹窗标题、查询字段、表格列
 */

export interface PickerSearchField {
  label: string;
  param: string;
  width?: string;
  placeholder?: string;
  type?: 'text' | 'select';
  options?: { label: string; value: string }[];
}

export interface PickerColumn {
  key: string;
  label: string;
  width?: string;
  render?: 'code' | 'text' | 'date' | 'status' | 'approval';
  ellipsis?: boolean;
}

export interface EntityPickerDefinition {
  entity: string;
  title: string;
  apiPath: string;
  searchFields: PickerSearchField[];
  columns: PickerColumn[];
}

export const ENTITY_PICKERS: Record<string, EntityPickerDefinition> = {
  customer: {
    entity: 'customer',
    title: '选择客户',
    apiPath: '/customers',
    searchFields: [
      { label: '客户编号', param: 'code', width: 'w-[140px]', placeholder: '编号' },
      { label: '客户名称', param: 'name', width: 'w-[160px]', placeholder: '名称' },
    ],
    columns: [
      { key: 'code', label: '客户编号', render: 'code' },
      { key: 'name', label: '客户名称' },
      { key: 'contactPerson', label: '联系人' },
      { key: 'contactPhone', label: '联系电话' },
      { key: 'industry', label: '所属行业' },
      { key: 'valueLevel', label: '客户价值' },
      { key: 'createdAt', label: '创建时间', render: 'date' },
    ],
  },

  supplier: {
    entity: 'supplier',
    title: '选择供应商',
    apiPath: '/suppliers',
    searchFields: [
      { label: '供应商编号', param: 'code', width: 'w-[140px]', placeholder: '编号' },
      { label: '供应商名称', param: 'name', width: 'w-[160px]', placeholder: '名称' },
    ],
    columns: [
      { key: 'code', label: '供应商编号', render: 'code' },
      { key: 'name', label: '供应商名称' },
      { key: 'contactPerson', label: '联系人' },
      { key: 'contactPhone', label: '联系电话' },
      { key: 'creditLevel', label: '信用等级' },
      { key: 'taxId', label: '税号' },
      { key: 'createdAt', label: '创建时间', render: 'date' },
    ],
  },

  material: {
    entity: 'material',
    title: '选择物料',
    apiPath: '/materials',
    searchFields: [
      { label: '物料编码', param: 'code', width: 'w-[140px]', placeholder: '编码' },
      { label: '物料名称', param: 'name', width: 'w-[160px]', placeholder: '名称' },
      { label: '规格型号', param: 'specification', width: 'w-[140px]', placeholder: '规格' },
    ],
    columns: [
      { key: 'code', label: '物料编码', render: 'code' },
      { key: 'name', label: '物料名称' },
      { key: 'specification', label: '规格型号' },
      { key: 'categoryName', label: '物料分类' },
      { key: 'materialType', label: '物料性质' },
      { key: 'unitName', label: '计量单位' },
      { key: 'status', label: '状态', render: 'status' },
      { key: 'createdAt', label: '创建时间', render: 'date' },
    ],
  },

  warehouse: {
    entity: 'warehouse',
    title: '选择仓库',
    apiPath: '/warehouses',
    searchFields: [
      { label: '仓库编码', param: 'code', width: 'w-[140px]', placeholder: '编码' },
      { label: '仓库名称', param: 'name', width: 'w-[160px]', placeholder: '名称' },
    ],
    columns: [
      { key: 'code', label: '仓库编码', render: 'code' },
      { key: 'name', label: '仓库名称' },
      { key: 'address', label: '地址' },
      { key: 'managerName', label: '负责人' },
      { key: 'status', label: '状态', render: 'status' },
      { key: 'createdAt', label: '创建时间', render: 'date' },
    ],
  },

  project: {
    entity: 'project',
    title: '选择项目',
    apiPath: '/projects',
    searchFields: [
      { label: '项目编码', param: 'code', width: 'w-[140px]', placeholder: '编码' },
      { label: '项目名称', param: 'name', width: 'w-[160px]', placeholder: '名称' },
    ],
    columns: [
      { key: 'code', label: '项目编码', render: 'code' },
      { key: 'name', label: '项目名称' },
      { key: 'source', label: '项目来源' },
      { key: 'approvalStatus', label: '审批状态', render: 'approval' },
      { key: 'createdAt', label: '创建时间', render: 'date' },
    ],
  },

  department: {
    entity: 'department',
    title: '选择部门',
    apiPath: '/departments',
    searchFields: [
      { label: '部门编码', param: 'code', width: 'w-[140px]', placeholder: '编码' },
      { label: '部门名称', param: 'name', width: 'w-[160px]', placeholder: '名称' },
    ],
    columns: [
      { key: 'code', label: '部门编码', render: 'code' },
      { key: 'name', label: '部门名称' },
      { key: 'parentName', label: '上级部门' },
      { key: 'status', label: '状态', render: 'status' },
      { key: 'createdAt', label: '创建时间', render: 'date' },
    ],
  },

  contract: {
    entity: 'contract',
    title: '选择合同',
    apiPath: '/contracts',
    searchFields: [
      { label: '合同编号', param: 'code', width: 'w-[140px]', placeholder: '编号' },
      { label: '合同名称', param: 'name', width: 'w-[160px]', placeholder: '名称' },
    ],
    columns: [
      { key: 'code', label: '合同编号', render: 'code' },
      { key: 'name', label: '合同名称' },
      { key: 'type', label: '合同类型' },
      { key: 'customerName', label: '客户' },
      { key: 'supplierName', label: '供应商' },
      { key: 'totalAmount', label: '合同金额' },
      { key: 'createdAt', label: '创建时间', render: 'date' },
    ],
  },

  quotation: {
    entity: 'quotation',
    title: '选择报价单',
    apiPath: '/quotations',
    searchFields: [
      { label: '报价单号', param: 'quotationNo', width: 'w-[140px]', placeholder: '编号' },
      { label: '报价名称', param: 'quotationName', width: 'w-[160px]', placeholder: '名称' },
    ],
    columns: [
      { key: 'quotationNo', label: '报价单号', render: 'code' },
      { key: 'quotationName', label: '报价名称' },
      { key: 'customerName', label: '客户' },
      { key: 'totalAmount', label: '报价金额' },
      { key: 'approvalStatus', label: '审批状态', render: 'approval' },
      { key: 'createdAt', label: '创建时间', render: 'date' },
    ],
  },

  preOrder: {
    entity: 'preOrder',
    title: '选择分劈单',
    apiPath: '/pre-orders',
    searchFields: [
      { label: '分劈单号', param: 'orderNo', width: 'w-[140px]', placeholder: '编号' },
      { label: '分劈名称', param: 'orderName', width: 'w-[160px]', placeholder: '名称' },
    ],
    columns: [
      { key: 'orderNo', label: '分劈单号', render: 'code' },
      { key: 'orderName', label: '分劈名称' },
      { key: 'customerName', label: '客户' },
      { key: 'approvalStatus', label: '审批状态', render: 'approval' },
      { key: 'createdAt', label: '创建时间', render: 'date' },
    ],
  },

  salesOrder: {
    entity: 'salesOrder',
    title: '选择销售订单',
    apiPath: '/sales-orders',
    searchFields: [
      { label: '订单编号', param: 'orderNo', width: 'w-[140px]', placeholder: '编号' },
      { label: '订单名称', param: 'orderName', width: 'w-[160px]', placeholder: '名称' },
      { label: '客户', param: 'customerName', width: 'w-[140px]', placeholder: '客户' },
    ],
    columns: [
      { key: 'orderNo', label: '订单编号', render: 'code' },
      { key: 'orderName', label: '订单名称' },
      { key: 'customerName', label: '客户' },
      { key: 'totalAmount', label: '订单金额' },
      { key: 'approvalStatus', label: '审批状态', render: 'approval' },
      { key: 'createdAt', label: '创建时间', render: 'date' },
    ],
  },

  purchaseOrder: {
    entity: 'purchaseOrder',
    title: '选择采购订单',
    apiPath: '/purchase-orders',
    searchFields: [
      { label: '订单编号', param: 'orderNo', width: 'w-[140px]', placeholder: '编号' },
      { label: '订单名称', param: 'orderName', width: 'w-[160px]', placeholder: '名称' },
      { label: '供应商', param: 'supplierName', width: 'w-[140px]', placeholder: '供应商' },
    ],
    columns: [
      { key: 'orderNo', label: '订单编号', render: 'code' },
      { key: 'orderName', label: '订单名称' },
      { key: 'supplierName', label: '供应商' },
      { key: 'totalAmount', label: '订单金额' },
      { key: 'approvalStatus', label: '审批状态', render: 'approval' },
      { key: 'createdAt', label: '创建时间', render: 'date' },
    ],
  },

  inspection: {
    entity: 'inspection',
    title: '选择质检单',
    apiPath: '/inspections',
    searchFields: [
      { label: '质检单号', param: 'code', width: 'w-[140px]', placeholder: '编号' },
      { label: '物料名称', param: 'name', width: 'w-[160px]', placeholder: '物料' },
    ],
    columns: [
      { key: 'inspectionNo', label: '质检单号', render: 'code' },
      { key: 'sourceType', label: '来源类型' },
      { key: 'sourceNo', label: '来源单号' },
      { key: 'materialName', label: '物料名称' },
      { key: 'result', label: '质检结果' },
      { key: 'approvalStatus', label: '审批状态', render: 'approval' },
      { key: 'createdAt', label: '创建时间', render: 'date' },
    ],
  },

  salesShipment: {
    entity: 'salesShipment',
    title: '选择销售出货单',
    apiPath: '/sales-shipments',
    searchFields: [
      { label: '出货单号', param: 'shipmentNo', width: 'w-[140px]', placeholder: '编号' },
      { label: '客户', param: 'customerName', width: 'w-[140px]', placeholder: '客户' },
    ],
    columns: [
      { key: 'shipmentNo', label: '出货单号', render: 'code' },
      { key: 'customerName', label: '客户' },
      { key: 'approvalStatus', label: '审批状态', render: 'approval' },
      { key: 'createdAt', label: '创建时间', render: 'date' },
    ],
  },

  purchasePlan: {
    entity: 'purchasePlan',
    title: '选择采购计划',
    apiPath: '/purchase-plans',
    searchFields: [
      { label: '计划编号', param: 'orderNo', width: 'w-[140px]', placeholder: '编号' },
      { label: '计划名称', param: 'orderName', width: 'w-[160px]', placeholder: '名称' },
    ],
    columns: [
      { key: 'orderNo', label: '计划编号', render: 'code' },
      { key: 'orderName', label: '计划名称' },
      { key: 'supplierName', label: '供应商' },
      { key: 'approvalStatus', label: '审批状态', render: 'approval' },
      { key: 'createdAt', label: '创建时间', render: 'date' },
    ],
  },

  bom: {
    entity: 'bom',
    title: '选择BOM',
    apiPath: '/boms',
    searchFields: [
      { label: 'BOM编码', param: 'code', width: 'w-[140px]', placeholder: '编码' },
      { label: 'BOM名称', param: 'name', width: 'w-[160px]', placeholder: '名称' },
    ],
    columns: [
      { key: 'code', label: 'BOM编码', render: 'code' },
      { key: 'name', label: 'BOM名称' },
      { key: 'productMaterialName', label: '成品物料' },
      { key: 'version', label: '版本' },
      { key: 'approvalStatus', label: '审批状态', render: 'approval' },
      { key: 'createdAt', label: '创建时间', render: 'date' },
    ],
  },

  productionOrder: {
    entity: 'productionOrder',
    title: '选择生产订单',
    apiPath: '/production-orders',
    searchFields: [
      { label: '生产编号', param: 'code', width: 'w-[140px]', placeholder: '编号' },
      { label: '生产名称', param: 'name', width: 'w-[160px]', placeholder: '名称' },
    ],
    columns: [
      { key: 'orderNo', label: '生产编号', render: 'code' },
      { key: 'orderName', label: '生产名称' },
      { key: 'materialName', label: '产品名称' },
      { key: 'businessStatus', label: '生产状态' },
      { key: 'approvalStatus', label: '审批状态', render: 'approval' },
      { key: 'createdAt', label: '创建时间', render: 'date' },
    ],
  },

  demandPlan: {
    entity: 'demandPlan',
    title: '选择需求计划',
    apiPath: '/demand-plans',
    searchFields: [
      { label: '计划编号', param: 'code', width: 'w-[140px]', placeholder: '编号' },
      { label: '计划名称', param: 'name', width: 'w-[160px]', placeholder: '名称' },
    ],
    columns: [
      { key: 'planNo', label: '计划编号', render: 'code' },
      { key: 'planName', label: '计划名称' },
      { key: 'approvalStatus', label: '审批状态', render: 'approval' },
      { key: 'createdAt', label: '创建时间', render: 'date' },
    ],
  },
};
