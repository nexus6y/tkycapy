import 'dotenv/config';
import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import { Pool } from 'pg';

const pool = new Pool({ connectionString: process.env.DATABASE_URL });
const prisma = new PrismaClient({ adapter: new PrismaPg(pool) });

async function upsertByTenantCode<T extends { id: string }>(
  model: {
    findFirst: (args: any) => Promise<T | null>;
    create: (args: any) => Promise<T>;
    update: (args: any) => Promise<T>;
  },
  tenantId: string,
  code: string,
  data: Record<string, unknown>,
) {
  const existing = await model.findFirst({ where: { tenantId, code } });
  if (existing) {
    return model.update({ where: { id: existing.id }, data });
  }
  return model.create({ data: { tenantId, code, ...data } });
}

async function main() {
  const tenant = await prisma.tenant.upsert({
    where: { code: 'default' },
    update: {},
    create: { code: 'default', name: '默认租户' },
  });
  const tenantId = tenant.id;

  const departments = [
    { code: 'D001', name: '生产部', sortOrder: 10 },
    { code: 'D002', name: '采购部', sortOrder: 20 },
    { code: 'D003', name: '销售部', sortOrder: 30 },
    { code: 'D004', name: '质量部', sortOrder: 40 },
  ];
  for (const item of departments) {
    await upsertByTenantCode(prisma.department as any, tenantId, item.code, item);
  }

  const units = [
    { code: 'PCS', name: '件', symbol: 'pcs', sortOrder: 10 },
    { code: 'SET', name: '套', symbol: 'set', sortOrder: 20 },
    { code: 'KG', name: '千克', symbol: 'kg', sortOrder: 30 },
    { code: 'M', name: '米', symbol: 'm', sortOrder: 40 },
  ];
  for (const item of units) {
    await prisma.measurementUnit.upsert({
      where: { tenantId_code: { tenantId, code: item.code } },
      update: item,
      create: { tenantId, ...item },
    });
  }

  const categories = [
    { code: 'RAW', name: '原材料', sortOrder: 10 },
    { code: 'SEMI', name: '半成品', sortOrder: 20 },
    { code: 'FIN', name: '成品', sortOrder: 30 },
    { code: 'PACK', name: '包材', sortOrder: 40 },
  ];
  for (const item of categories) {
    await prisma.materialCategory.upsert({
      where: { tenantId_code: { tenantId, code: item.code } },
      update: item,
      create: { tenantId, ...item },
    });
  }

  const suppliers = [
    {
      code: 'SUP001',
      name: '深圳精密五金有限公司',
      contactPerson: '王强',
      contactPhone: '13800010001',
      contactEmail: 'sales@szjmwj.example',
      address: '深圳市宝安区工业园 18 号',
      creditLevel: 'A',
      taxId: '91440300MA5SUP001',
      bankName: '招商银行深圳分行',
      bankAccount: '755900000000001',
    },
    {
      code: 'SUP002',
      name: '苏州电子材料有限公司',
      contactPerson: '李娜',
      contactPhone: '13800010002',
      contactEmail: 'contact@szelecmat.example',
      address: '苏州市工业园区星湖街 88 号',
      creditLevel: 'A',
      taxId: '91320500MA5SUP002',
      bankName: '中国银行苏州分行',
      bankAccount: '512600000000002',
    },
    {
      code: 'SUP003',
      name: '东莞包装制品有限公司',
      contactPerson: '陈磊',
      contactPhone: '13800010003',
      contactEmail: 'info@dgpack.example',
      address: '东莞市长安镇振安路 66 号',
      creditLevel: 'B',
      taxId: '91441900MA5SUP003',
      bankName: '建设银行东莞分行',
      bankAccount: '769500000000003',
    },
  ];
  for (const item of suppliers) {
    await prisma.supplier.upsert({
      where: { tenantId_code: { tenantId, code: item.code } },
      update: item,
      create: { tenantId, ...item },
    });
  }

  const customers = [
    {
      code: 'CUS001',
      name: '上海智能装备有限公司',
      industry: '智能制造',
      valueLevel: '重点客户',
      creditLevel: 'A',
      contactPerson: '赵敏',
      contactPhone: '13900020001',
      contactEmail: 'purchase@shznzb.example',
      address: '上海市浦东新区张江路 100 号',
    },
    {
      code: 'CUS002',
      name: '杭州工业自动化有限公司',
      industry: '工业自动化',
      valueLevel: '普通客户',
      creditLevel: 'A',
      contactPerson: '周航',
      contactPhone: '13900020002',
      contactEmail: 'order@hzauto.example',
      address: '杭州市滨江区江南大道 588 号',
    },
    {
      code: 'CUS003',
      name: '广州机电设备有限公司',
      industry: '机电设备',
      valueLevel: '潜力客户',
      creditLevel: 'B',
      contactPerson: '黄丽',
      contactPhone: '13900020003',
      contactEmail: 'sales@gzjd.example',
      address: '广州市黄埔区科学大道 99 号',
    },
  ];
  for (const item of customers) {
    await prisma.customer.upsert({
      where: { tenantId_code: { tenantId, code: item.code } },
      update: item,
      create: { tenantId, ...item },
    });
  }

  const warehouses = [
    { code: 'WH001', name: '原材料仓', address: '一号厂区 A 栋', sortOrder: 10 },
    { code: 'WH002', name: '成品仓', address: '一号厂区 B 栋', sortOrder: 20 },
    { code: 'WH003', name: '不良品仓', address: '二号厂区 C 栋', sortOrder: 30 },
  ];
  for (const item of warehouses) {
    await prisma.warehouse.upsert({
      where: { tenantId_code: { tenantId, code: item.code } },
      update: item,
      create: { tenantId, ...item },
    });
  }

  const rawCategory = await prisma.materialCategory.findUniqueOrThrow({
    where: { tenantId_code: { tenantId, code: 'RAW' } },
  });
  const semiCategory = await prisma.materialCategory.findUniqueOrThrow({
    where: { tenantId_code: { tenantId, code: 'SEMI' } },
  });
  const finCategory = await prisma.materialCategory.findUniqueOrThrow({
    where: { tenantId_code: { tenantId, code: 'FIN' } },
  });
  const pcsUnit = await prisma.measurementUnit.findUniqueOrThrow({
    where: { tenantId_code: { tenantId, code: 'PCS' } },
  });
  const setUnit = await prisma.measurementUnit.findUniqueOrThrow({
    where: { tenantId_code: { tenantId, code: 'SET' } },
  });
  const kgUnit = await prisma.measurementUnit.findUniqueOrThrow({
    where: { tenantId_code: { tenantId, code: 'KG' } },
  });
  const mainWarehouse = await prisma.warehouse.findUniqueOrThrow({
    where: { tenantId_code: { tenantId, code: 'WH001' } },
  });
  const productionDept = await prisma.department.findFirstOrThrow({
    where: { tenantId, code: 'D001' },
  });

  const materials = [
    {
      code: 'MAT001',
      name: '铝合金外壳',
      specification: 'AL6061-120x80',
      categoryId: rawCategory.id,
      unitId: pcsUnit.id,
      materialProperty: '采购件',
      productCategory: '结构件',
      planAttribute: '外购',
      defaultSupplier: '深圳精密五金有限公司',
      plannedPrice: '38.500000',
      safetyStockQty: '200.000000',
      minStockQty: '80.000000',
      maxStockQty: '800.000000',
      defaultWarehouseId: mainWarehouse.id,
      needInspection: true,
    },
    {
      code: 'MAT002',
      name: '控制电路板',
      specification: 'PCB-CTRL-V2.1',
      categoryId: rawCategory.id,
      unitId: pcsUnit.id,
      materialProperty: '采购件',
      productCategory: '电子件',
      planAttribute: '外购',
      defaultSupplier: '苏州电子材料有限公司',
      plannedPrice: '126.000000',
      safetyStockQty: '100.000000',
      minStockQty: '40.000000',
      maxStockQty: '500.000000',
      defaultWarehouseId: mainWarehouse.id,
      needInspection: true,
    },
    {
      code: 'MAT003',
      name: '包装纸箱',
      specification: 'K=K 400x300x220',
      categoryId: rawCategory.id,
      unitId: pcsUnit.id,
      materialProperty: '采购件',
      productCategory: '包材',
      planAttribute: '外购',
      defaultSupplier: '东莞包装制品有限公司',
      plannedPrice: '4.800000',
      safetyStockQty: '500.000000',
      minStockQty: '200.000000',
      maxStockQty: '2000.000000',
      defaultWarehouseId: mainWarehouse.id,
    },
    {
      code: 'SEMI001',
      name: '控制模块半成品',
      specification: 'CM-100',
      categoryId: semiCategory.id,
      unitId: pcsUnit.id,
      materialProperty: '自制件',
      productCategory: '模块',
      planAttribute: '自制',
      directProduction: true,
      defaultDeptId: productionDept.id,
      economicBatch: '100.000000',
      batchMultiple: '10.000000',
      lossRate: '1.500000',
      issueMethod: '按单领料',
    },
    {
      code: 'FIN001',
      name: '智能控制终端',
      specification: 'TK-CTRL-01',
      categoryId: finCategory.id,
      unitId: setUnit.id,
      materialProperty: '自制件',
      productCategory: '成品',
      planAttribute: '自制',
      directProduction: true,
      defaultDeptId: productionDept.id,
      economicBatch: '50.000000',
      batchMultiple: '5.000000',
      lossRate: '1.000000',
      issueMethod: '按单领料',
    },
    {
      code: 'MAT004',
      name: '工业润滑脂',
      specification: 'LG-2 15kg',
      categoryId: rawCategory.id,
      unitId: kgUnit.id,
      materialProperty: '辅料',
      productCategory: '耗材',
      planAttribute: '外购',
      plannedPrice: '28.000000',
      safetyStockQty: '60.000000',
      minStockQty: '20.000000',
      maxStockQty: '200.000000',
      defaultWarehouseId: mainWarehouse.id,
    },
  ];

  for (const item of materials) {
    await prisma.material.upsert({
      where: { tenantId_code: { tenantId, code: item.code } },
      update: item,
      create: { tenantId, ...item },
    });
  }

  console.log('Basic data seed completed');
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect().then(() => pool.end()));
