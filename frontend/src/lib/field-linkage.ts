/**
 * 字段联动公共工具 — 选择实体后统一自动带出关联字段
 */

// ==================== 物料选择 ====================

export interface MaterialFill {
  materialId: string;
  materialCode: string;
  materialName: string;
  specification: string;
  unit: string;
  unitId: string;
  defaultWarehouseId: string;
  needInspection: boolean;
  batchManaged: boolean;
  shelfLifeManaged: boolean;
  serialManaged: boolean;
}

export function applyMaterialSelection(material: Record<string, any>): MaterialFill {
  return {
    materialId: material.id || '',
    materialCode: material.code || '',
    materialName: material.name || '',
    specification: material.specification || '',
    unit: material.unitName || material.unitSymbol || '',
    unitId: material.unitId || '',
    defaultWarehouseId: material.defaultWarehouseId || '',
    needInspection: material.needInspection ?? false,
    batchManaged: material.batchManaged ?? false,
    shelfLifeManaged: material.shelfLifeManaged ?? false,
    serialManaged: material.serialManaged ?? false,
  };
}

// ==================== 客户选择 ====================

export interface CustomerFill {
  customerId: string;
  customerCode: string;
  customerName: string;
  contactPerson: string;
  contactPhone: string;
  contactEmail: string;
  address: string;
}

export function applyCustomerSelection(customer: Record<string, any>): CustomerFill {
  return {
    customerId: customer.id || '',
    customerCode: customer.code || '',
    customerName: customer.name || '',
    contactPerson: customer.contactPerson || '',
    contactPhone: customer.contactPhone || '',
    contactEmail: customer.contactEmail || '',
    address: customer.address || '',
  };
}

// ==================== 供应商选择 ====================

export interface SupplierFill {
  supplierId: string;
  supplierCode: string;
  supplierName: string;
  contactPerson: string;
  contactPhone: string;
  contactEmail: string;
  address: string;
}

export function applySupplierSelection(supplier: Record<string, any>): SupplierFill {
  return {
    supplierId: supplier.id || '',
    supplierCode: supplier.code || '',
    supplierName: supplier.name || '',
    contactPerson: supplier.contactPerson || '',
    contactPhone: supplier.contactPhone || '',
    contactEmail: supplier.contactEmail || '',
    address: supplier.address || '',
  };
}

// ==================== 仓库选择 ====================

export interface WarehouseFill {
  warehouseId: string;
  warehouseCode: string;
  warehouseName: string;
}

export function applyWarehouseSelection(warehouse: Record<string, any>): WarehouseFill {
  return {
    warehouseId: warehouse.id || '',
    warehouseCode: warehouse.code || '',
    warehouseName: warehouse.name || '',
  };
}

// ==================== 部门选择 ====================

export interface DepartmentFill {
  departmentId: string;
  departmentCode: string;
  departmentName: string;
}

export function applyDepartmentSelection(dept: Record<string, any>): DepartmentFill {
  return {
    departmentId: dept.id || '',
    departmentCode: dept.code || '',
    departmentName: dept.name || '',
  };
}

// ==================== 项目选择 ====================

export interface ProjectFill {
  projectId: string;
  projectCode: string;
  projectName: string;
}

export function applyProjectSelection(project: Record<string, any>): ProjectFill {
  return {
    projectId: project.id || '',
    projectCode: project.code || '',
    projectName: project.name || '',
  };
}

// ==================== 合同选择 ====================

export interface ContractFill {
  contractId: string;
  contractCode: string;
  contractName: string;
}

export function applyContractSelection(contract: Record<string, any>): ContractFill {
  return {
    contractId: contract.id || '',
    contractCode: contract.code || '',
    contractName: contract.name || '',
  };
}

// ==================== 来源单号选择 ====================

export interface SourceDocResult {
  header: Record<string, any>;
  lines: Record<string, any>[];
}

/** Resolve a field value from a source line object with layered fallback. */
function resolveField(src: Record<string, any>, key: string): string {
  // 1. Direct field
  let v = src[key];
  if (v != null) return String(v);

  // 2. Dot-notation nested: "material.code" → src.material?.code
  const dot = key.indexOf('.');
  if (dot > 0) {
    const parentKey = key.slice(0, dot);
    const childKey = key.slice(dot + 1);
    const parent = src[parentKey];
    if (parent && typeof parent === 'object' && parent[childKey] != null) {
      return String(parent[childKey]);
    }
  }

  // 3. Flat alias table
  const flatFallbacks: Record<string, string[]> = {
    materialCode:  ['materialCode', 'materialNo', 'code'],
    materialName:  ['materialName', 'name'],
    quantity:      ['quantity', 'inboundQty', 'plannedQty', 'actualQty', 'shippedQty'],
    spec:          ['spec', 'specification'],
    unitPrice:     ['unitPrice', 'price'],
    amount:        ['amount', 'totalAmount'],
    warehouseCode: ['warehouseCode', 'warehouseId'],
  };
  const aliases = flatFallbacks[key] || [key];
  for (const a of aliases) {
    if (src[a] != null) return String(src[a]);
  }

  // 4. Nested object fallback (e.g. material.code, warehouse.name)
  const nestedFallback: Record<string, [string, string]> = {
    materialCode:  ['material', 'code'],
    materialName:  ['material', 'name'],
    spec:          ['material', 'specification'],
    unit:          ['material', 'unitName'],
    warehouseCode: ['warehouse', 'code'],
    warehouseName: ['warehouse', 'name'],
  };
  const pair = nestedFallback[key];
  if (pair) {
    const parent = src[pair[0]];
    if (parent && typeof parent === 'object' && parent[pair[1]] != null) {
      return String(parent[pair[1]]);
    }
  }

  return '';
}

/**
 * 选择来源单号后，根据 sourceType 和 sourceId 加载源单详情，
 * 映射到目标表单字段。
 */
export async function applySourceDocumentSelection(
  sourceType: string,
  sourceId: string,
  lineMapping: Record<string, string>,
  apiClient: any,
): Promise<SourceDocResult> {
  const typeToPath: Record<string, string> = {
    PURCHASE_ORDER: '/purchase-orders',
    PURCHASE: '/purchase-orders',
    PURCHASE_PLAN: '/purchase-plans',
    INSPECTION: '/inspections',
    SALES_ORDER: '/sales-orders',
    SALES_SHIPMENT: '/sales-shipments',
    PRODUCTION_ORDER: '/production-orders',
    COMPLETE_REPORT: '/complete-reports',
    ARRIVAL_CONFIRM: '/purchase-orders',
    QUOTATION: '/quotations',
    PRE_ORDER: '/pre-orders',
    DEMAND_PLAN: '/demand-plans',
  };

  const path = typeToPath[sourceType];
  if (!path) throw new Error(`不支持的来源类型: ${sourceType}`);
  const { data } = await apiClient.get(`${path}/${sourceId}`);

  const header: Record<string, any> = {
    sourceType, sourceId,
    sourceNo: data.orderNo || data.quotationNo || data.reportNo || data.shipmentNo || data.inspectionNo || data.planNo || '',
  };

  if (data.supplierName) {
    header.supplierId = data.supplierId || '';
    header.supplierName = data.supplierName;
  }
  if (data.customerName) {
    header.customerId = data.customerId || '';
    header.customerName = data.customerName;
  }

  const sourceLines = data.lines || data.materials || [];
  const lines = sourceLines.map((srcLine: any, idx: number) => {
    const targetLine: Record<string, any> = { lineNo: idx + 1 };
    for (const [srcKey, tgtKey] of Object.entries(lineMapping)) {
      targetLine[tgtKey] = resolveField(srcLine, srcKey);
    }
    if (targetLine.quantity && targetLine.unitPrice && !targetLine.amount) {
      targetLine.amount = String(
        (Number(targetLine.quantity) * Number(targetLine.unitPrice)).toFixed(2),
      );
    }
    return targetLine;
  });

  return { header, lines };
}
