/**
 * 实体中心映射 — 所有实体的 API 路径、显示字段、ID 字段
 *
 * 使用方式：
 *   import { ENTITIES } from '@/lib/entities';
 *   const cfg = ENTITIES.customer; // { path: '/customers', displayField: 'name', idField: 'id' }
 */

export interface EntityConfig {
  path: string;
  displayField: string;   // SelectTrigger 中显示哪个字段
  idField: string;        // value 用哪个字段
  statusFilter?: string;  // 过滤参数名，如 'status' 或 'approvalStatus'
}

export const ENTITIES: Record<string, EntityConfig> = {
  // ===== 基础实体 =====
  customer:       { path: '/customers',              displayField: 'name',          idField: 'id', statusFilter: 'status' },
  supplier:       { path: '/suppliers',              displayField: 'name',          idField: 'id', statusFilter: 'status' },
  material:       { path: '/materials',              displayField: 'name',          idField: 'id', statusFilter: 'status' },
  materialCategory: { path: '/material-categories',  displayField: 'name',          idField: 'id' },
  measurementUnit:{ path: '/measurement-units',      displayField: 'name',          idField: 'id' },
  warehouse:      { path: '/warehouses',             displayField: 'name',          idField: 'id', statusFilter: 'status' },
  zone:           { path: '/zones',                  displayField: 'name',          idField: 'id' },
  passage:        { path: '/passages',               displayField: 'name',          idField: 'id' },
  shelf:          { path: '/shelves',                displayField: 'name',          idField: 'id' },
  location:       { path: '/locations',              displayField: 'code',          idField: 'id' },
  department:     { path: '/departments',            displayField: 'name',          idField: 'id', statusFilter: 'status' },
  project:        { path: '/projects',               displayField: 'name',          idField: 'id' },
  bom:            { path: '/boms',                   displayField: 'name',          idField: 'id' },
  user:           { path: '/users',                  displayField: 'name',          idField: 'id' },
  role:           { path: '/roles',                  displayField: 'name',          idField: 'id' },

  // ===== 业务单据 =====
  contract:       { path: '/contracts',              displayField: 'name',          idField: 'id' },
  quotation:      { path: '/quotations',             displayField: 'quotationName', idField: 'id', statusFilter: 'approvalStatus' },
  preOrder:       { path: '/pre-orders',             displayField: 'orderName',     idField: 'id', statusFilter: 'approvalStatus' },
  salesOrder:     { path: '/sales-orders',           displayField: 'orderNo',       idField: 'id', statusFilter: 'approvalStatus' },
  salesShipment:  { path: '/sales-shipments',        displayField: 'shipmentNo',    idField: 'id', statusFilter: 'approvalStatus' },
  purchasePlan:   { path: '/purchase-plans',         displayField: 'orderName',     idField: 'id', statusFilter: 'approvalStatus' },
  purchaseOrder:  { path: '/purchase-orders',        displayField: 'orderName',     idField: 'id', statusFilter: 'approvalStatus' },
  demandPlan:     { path: '/demand-plans',           displayField: 'planName',      idField: 'id', statusFilter: 'approvalStatus' },
  inspection:     { path: '/inspections',            displayField: 'inspectionNo',  idField: 'id', statusFilter: 'approvalStatus' },
  productionOrder:{ path: '/production-orders',      displayField: 'orderName',     idField: 'id', statusFilter: 'approvalStatus' },
  issueOrder:     { path: '/issue-orders',           displayField: 'orderNo',       idField: 'id' },
  returnOrder:    { path: '/return-orders',          displayField: 'orderNo',       idField: 'id' },
  completeReport: { path: '/complete-reports',       displayField: 'reportNo',      idField: 'id' },
};

export type EntityType = keyof typeof ENTITIES;
